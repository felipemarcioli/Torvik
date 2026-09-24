import { expect, test, type Page } from "@playwright/test";
async function setup(page: Page, visible = true) {
  await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await page.route("https://cdn.jsdelivr.net/npm/@mediapipe/pose@*/pose.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `
    window.__angle = 170;
    window.__visible = ${visible};
    window.Pose = class {
      setOptions() {} onResults(cb) { this.cb=cb; }
      async close() {}
      async send({image}) {
        const p=(x,y)=>({x,y,z:0,visibility:1});
        const l=Array.from({length:33},()=>p(.5,.5));
        const angle=window.__angle*Math.PI/180;
        const ratio=image.videoHeight/image.videoWidth;
        for(const offset of [0,1]) {
          l[11+offset]=p(.5,.1);l[23+offset]=p(.5,.3);l[25+offset]=p(.5,.5);
          l[27+offset]=p(.5+.2*ratio*Math.sin(angle),.5-.2*Math.cos(angle));
        }
        this.cb({poseLandmarks:window.__visible ? l : []});
      }
    };
  `,
    }),
  );
  await page.goto("/");
}
test("controles de exercício funcionam por teclado", async ({ page }) => {
  await setup(page);
  await page.getByRole("radio", { name: /Flexão de Braço/ }).check();
  if ((page.viewportSize()?.width ?? 0) < 600) {
    const flex = page.getByRole("radio", { name: /Flexão de Braço/ });
    await expect(flex).toBeChecked();
    await expect(flex).toHaveAttribute("aria-expanded", "true");
    await flex.press("Space");
    await expect(flex).toBeChecked();
    await expect(flex).toHaveAttribute("aria-expanded", "false");
    return;
  }
  const button = page.locator('button[aria-controls="instructions-squat"]');
  await button.focus();
  await button.press("Enter");
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("radio", { name: /Flexão de Braço/ })).toBeChecked();
});

test("accordion mobile abre somente o exercício selecionado", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);

  const squat = page.locator(".exercise-card").filter({ hasText: "Agachamento" });
  const pushup = page.locator(".exercise-card").filter({ hasText: "Flexão de Braço" });
  const jumpingJack = page.locator(".exercise-card").filter({ hasText: "Polichinelo" });
  const pushupBefore = await pushup.boundingBox();

  await expect(page.getByRole("radio", { name: /Agachamento/ })).toBeChecked();
  await expect(page.locator("#exercise-preview-squat")).toHaveAttribute("aria-hidden", "true");

  await squat.locator(".mobile-exercise-select").click();
  await expect(page.locator("#exercise-preview-squat")).toHaveAttribute("aria-hidden", "false");
  await expect(page.getByText("Mantenha os pés alinhados e desça com controle.")).toBeVisible();
  await expect(page.locator('.exercise-card[data-preview-open="true"]')).toHaveCount(1);
  await expect
    .poll(async () => (await pushup.boundingBox())?.y ?? 0)
    .toBeGreaterThan(pushupBefore!.y + 60);

  await squat.locator(".mobile-exercise-select").click();
  await expect(page.locator("#exercise-preview-squat")).toHaveAttribute("aria-hidden", "true");
  await expect(page.getByRole("radio", { name: /Agachamento/ })).toBeChecked();

  await pushup.locator(".mobile-exercise-select").click();
  await expect(page.getByRole("radio", { name: /Flexão de Braço/ })).toBeChecked();
  await expect(page.locator("#exercise-preview-pushup")).toHaveAttribute("aria-hidden", "false");
  await expect(page.locator("#exercise-preview-squat")).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator('.exercise-card[data-preview-open="true"]')).toHaveCount(1);

  const jumpingJackRadio = page.getByRole("radio", { name: /Polichinelo/ });
  await jumpingJackRadio.focus();
  await jumpingJackRadio.press("Space");
  await expect(jumpingJackRadio).toBeChecked();
  await expect(page.locator("#exercise-preview-jumpingjack")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  await jumpingJackRadio.press("Space");
  await expect(jumpingJackRadio).toBeChecked();
  await expect(page.locator("#exercise-preview-jumpingjack")).toHaveAttribute(
    "aria-hidden",
    "true",
  );

  await jumpingJack.locator(".mobile-exercise-select").click();
  const animation = jumpingJack.locator(".exercise-preview-animation");
  await expect(animation).toHaveAttribute("src", "/exercise-previews/torvik-jumpingjack.webp");
  await expect
    .poll(() =>
      animation.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 256),
    )
    .toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() => animation.evaluate((img: HTMLImageElement) => img.currentSrc))
    .toContain("torvik-jumpingjack-still.webp");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const size of [
    { width: 390, height: 844 },
    { width: 360, height: 800 },
  ]) {
    await page.setViewportSize(size);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const action = await page.getByRole("button", { name: "Preparar câmera" }).boundingBox();
    expect(action).not.toBeNull();
    expect(action!.y + action!.height).toBeLessThanOrEqual(size.height);
  }
});
test("preparação, treino, pausa, relatório, histórico e reinício", async ({ page }) => {
  await setup(page);
  await page.getByRole("button", { name: "Preparar câmera", exact: true }).click();
  const start = page.getByRole("button", { name: "Iniciar em 5 segundos" });
  await expect(start).toBeEnabled();
  await start.click();
  await expect(page.getByRole("button", { name: "Pausar", exact: true })).toBeVisible({
    timeout: 10000,
  });
  for (const angle of [140, 80, 170]) {
    await page.evaluate((value) => {
      (window as unknown as { __angle: number }).__angle = value;
    }, angle);
    await page.waitForTimeout(420);
  }
  await expect(page.getByText("Repetição dentro dos critérios", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Pausar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Treino pausado" })).toBeVisible();
  await page.getByRole("button", { name: "Preparar retomada" }).click();
  await expect(start).toBeEnabled();
  await start.click();
  await expect(page.getByRole("button", { name: "Pausar", exact: true })).toBeVisible({
    timeout: 10000,
  });
  // Simulate the browser visibility signal; resuming always requires user action.
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.getByRole("heading", { name: "Treino pausado" })).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.getByRole("button", { name: "Preparar retomada" })).toBeVisible();
  await page.getByRole("button", { name: "Finalizar treino", exact: true }).click();
  await expect(
    page.getByText("1 de 1 repetições completas atenderam às regras do aplicativo."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Salvar sessão", exact: true }).click();
  await expect(page.getByRole("button", { name: "Salvo neste dispositivo" })).toBeVisible();
  await page.getByRole("button", { name: "Voltar ao início" }).click();
  await page.getByRole("button", { name: "Meu histórico" }).click();
  await expect(page.getByRole("heading", { name: "Meu progresso" })).toBeVisible();
  await expect(page.getByText("Avaliadas", { exact: true })).toBeVisible();
  await expect(
    page.locator(".progress-card-stats").getByText("Nos critérios", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Meu histórico" }).click();
  await page.getByRole("button", { name: "Ver detalhes" }).click();
  await expect(page.getByRole("button", { name: "Exportar JSON", exact: true })).toBeVisible();
  await page.getByText("Repetições registradas (1)", { exact: true }).click();
  await expect(page.getByText(/Repetição 1 ·/)).toBeVisible();
  await page.getByRole("button", { name: "Excluir sessão", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar exclusão" }).click();
  await expect(page.getByText(/Nenhuma sessão salva/)).toBeVisible();
  await page.getByRole("button", { name: "Voltar ao início" }).click();
  await page.getByRole("button", { name: "Preparar câmera", exact: true }).click();
  await expect(start).toBeEnabled();
  await page.getByRole("button", { name: "Finalizar treino", exact: true }).click();
  await expect(page.getByText(/Dados insuficientes/)).toBeVisible();
  await page.getByRole("button", { name: "Novo treino" }).click();
  await expect(start).toBeEnabled();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
});
test("falha no script oferece nova tentativa funcional", async ({ page }) => {
  await setup(page);
  let failures = 1;
  await page.route("https://cdn.jsdelivr.net/npm/@mediapipe/pose@*/pose.js", async (route) => {
    if (failures-- > 0) await route.abort();
    else await route.fallback();
  });
  await page.getByRole("button", { name: "Preparar câmera", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Não foi possível carregar");
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByRole("button", { name: "Iniciar em 5 segundos" })).toBeEnabled();
});
test("imagem completa e ações sem sobreposição em retrato e paisagem", async ({ page }) => {
  await setup(page, false);
  await page.getByRole("button", { name: "Preparar câmera", exact: true }).click();
  await expect(page.getByRole("button", { name: "Iniciar em 5 segundos" })).toBeEnabled();
  for (const size of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 360, height: 800 },
    { width: 768, height: 1024 },
  ]) {
    await page.setViewportSize(size);
    await expect(page.locator("video")).toHaveCSS("object-fit", "contain");
    await expect(page.locator("canvas")).toHaveCSS("object-fit", "contain");
    const camera = await page
      .getByRole("region", { name: "Prévia completa da câmera" })
      .boundingBox();
    const button = await page.getByRole("button", { name: "Iniciar em 5 segundos" }).boundingBox();
    expect(camera).not.toBeNull();
    expect(button).not.toBeNull();
    expect(camera!.y + camera!.height).toBeLessThanOrEqual(size.height + 1);
    for (const action of await page.locator(".workout-actions button").all()) {
      const box = await action.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.y + box!.height).toBeLessThanOrEqual(size.height + 1);
    }
    const overlapX = Math.max(
      0,
      Math.min(camera!.x + camera!.width, button!.x + button!.width) -
        Math.max(camera!.x, button!.x),
    );
    const overlapY = Math.max(
      0,
      Math.min(camera!.y + camera!.height, button!.y + button!.height) -
        Math.max(camera!.y, button!.y),
    );
    expect(overlapX * overlapY).toBe(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 360, height: 800 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "20px";
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

async function tracking(page: Page, visible: boolean) {
  await page.evaluate((value) => {
    (window as unknown as { __visible: boolean }).__visible = value;
  }, visible);
}
test("início automático tolera movimento, cancela perda e não reinicia sessão", async ({
  page,
}) => {
  test.setTimeout(45000);
  await setup(page);
  await page.getByRole("button", { name: "Preparar câmera", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Posicione-se na câmera/ })).toBeVisible();
  await expect(
    page.getByText("Prepare-se. O treino já vai começar.", { exact: true }),
  ).toBeVisible();
  await tracking(page, false);
  await expect(page.getByRole("heading", { name: /Posicione-se na câmera/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Iniciar em 5 segundos" })).toBeEnabled();
  await tracking(page, true);
  await expect(
    page.getByText("Prepare-se. O treino já vai começar.", { exact: true }),
  ).toBeVisible();
  // Movement during countdown must neither count repetitions nor require immobility.
  for (const angle of [158, 165, 140, 80, 170]) {
    await page.evaluate((value) => {
      (window as unknown as { __angle: number }).__angle = value;
    }, angle);
    await page.waitForTimeout(400);
    await expect(
      page.getByText("Prepare-se. O treino já vai começar.", { exact: true }),
    ).toBeVisible();
  }
  await expect(page.getByRole("button", { name: "Pausar", exact: true })).toBeVisible({
    timeout: 10000,
  });
  await page.waitForTimeout(7200);
  await expect(page.getByRole("button", { name: "Pausar", exact: true })).toBeVisible();
  await expect(page.getByText("Prepare-se. O treino já vai começar.", { exact: true })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Finalizar treino", exact: true }).click();
  await expect(page.getByText(/Dados insuficientes/)).toBeVisible();
});
test("manual fora do quadro oferece cinco segundos e cancelamento não inicia sessão", async ({
  page,
}) => {
  await setup(page, false);
  await page.getByRole("button", { name: "Preparar câmera", exact: true }).click();
  const manual = page.getByRole("button", { name: "Iniciar em 5 segundos" });
  await expect(manual).toBeEnabled();
  await manual.click();
  await expect(page.getByText("Posicione-se no quadro.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pausar", exact: true })).toHaveCount(0);
  await tracking(page, true);
  await expect(page.getByRole("button", { name: "Pausar", exact: true })).toBeVisible({
    timeout: 10000,
  });
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page.getByRole("button", { name: "Preparar câmera", exact: true }).click();
  await expect(
    page.getByText("Prepare-se. O treino já vai começar.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page.waitForTimeout(5500);
  await expect(page.getByRole("button", { name: "Preparar câmera", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pausar", exact: true })).toHaveCount(0);
});

async function mockVoice(page: Page, enabled: boolean, blocked = false) {
  await page.addInitScript(
    ({ enabled, blocked }) => {
      localStorage.setItem("torvik.voice.v1", JSON.stringify({ enabled, mode: "full", volume: 1 }));
      const state = { spoken: [] as { text: string; volume: number }[], cancellations: 0, blocked };
      Object.assign(window, { __voice: state });
      class Utterance {
        text: string;
        volume = 1;
        onstart: (() => void) | null = null;
        onend: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor(text: string) {
          this.text = text;
        }
      }
      let active: Utterance | null = null;
      const synth = new EventTarget();
      Object.assign(synth, {
        getVoices: () => [{ lang: "pt-BR", localService: true, name: "Português local" }],
        speak: (utterance: Utterance) => {
          state.spoken.push({ text: utterance.text, volume: utterance.volume });
          active = utterance;
          queueMicrotask(() => {
            if (active !== utterance) return;
            if (state.blocked) utterance.onerror?.();
            else {
              utterance.onstart?.();
              setTimeout(() => {
                if (active === utterance) utterance.onend?.();
              }, 30);
            }
          });
        },
        cancel: () => {
          state.cancellations++;
          active = null;
        },
      });
      Object.defineProperty(window, "speechSynthesis", { configurable: true, value: synth });
      Object.defineProperty(window, "SpeechSynthesisUtterance", {
        configurable: true,
        value: Utterance,
      });
    },
    { enabled, blocked },
  );
}
const spokenVoice = (page: Page) =>
  page.evaluate(
    () =>
      (window as unknown as { __voice: { spoken: { text: string; volume: number }[] } }).__voice
        .spoken,
  );

for (const enabled of [true, false]) {
  test(`voz ${enabled ? "ligada" : "desligada"} preserva cinco repetições e relatório`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    await mockVoice(page, enabled);
    await setup(page);
    await page.getByRole("button", { name: "Preparar câmera", exact: true }).click();
    await expect(page.getByRole("button", { name: "Pausar", exact: true })).toBeVisible({
      timeout: 15000,
    });
    if (enabled) {
      await expect
        .poll(async () => (await spokenVoice(page)).map((v) => v.text))
        .toContain("Vamos começar!");
      for (const number of ["Três", "Dois", "Um"])
        expect((await spokenVoice(page)).filter((v) => v.text === number)).toHaveLength(1);
    }
    for (let rep = 0; rep < 5; rep++) {
      for (const [angle, phase] of [
        [140, "Descendo"],
        [80, "Agachado"],
        [170, "Em pé"],
      ] as const) {
        await page.evaluate((value) => {
          (window as unknown as { __angle: number }).__angle = value;
        }, angle);
        await expect(page.locator(".workout-feedback-detail")).toContainText(phase);
      }
      await expect(page.locator(".workout-metrics > div:first-child > p:first-child")).toHaveText(
        String(rep + 1),
      );
    }
    if (enabled)
      await expect
        .poll(
          async () => (await spokenVoice(page)).filter((v) => v.text === "5 repetições!").length,
        )
        .toBe(1);
    await page.getByRole("button", { name: "Finalizar treino", exact: true }).click();
    await expect(
      page.getByText("5 de 5 repetições completas atenderam às regras do aplicativo."),
    ).toBeVisible();
    if (enabled)
      await expect
        .poll(
          async () => (await spokenVoice(page)).filter((v) => v.text === "Treino encerrado").length,
        )
        .toBe(1);
    else expect(await spokenVoice(page)).toEqual([]);
  });
}

test("áudio bloqueado permite recuperação, ajustes e cancelamento sem reiniciar câmera", async ({
  page,
}) => {
  await mockVoice(page, true, true);
  await setup(page, false);
  await page.getByRole("button", { name: "Preparar câmera", exact: true }).click();
  await page.getByText("Voz ligada", { exact: false }).first().click();
  await expect(page.getByText(/Não foi possível reproduzir o áudio/)).toBeVisible();
  await page.evaluate(() => {
    (window as unknown as { __voice: { blocked: boolean } }).__voice.blocked = false;
  });
  await page.getByRole("button", { name: "Ativar voz", exact: true }).click();
  await expect(page.getByText("Voz local em português pronta.")).toBeVisible();
  await page.getByLabel("Modo de voz").selectOption("basic");
  await page.getByRole("slider", { name: /Volume/ }).fill("0.4");
  await page.getByRole("checkbox", { name: "Feedback por voz" }).uncheck();
  await page.getByRole("checkbox", { name: "Feedback por voz" }).check();
  expect((await spokenVoice(page)).at(-1)?.volume).toBe(0.4);
  await expect(page.getByRole("button", { name: "Iniciar em 5 segundos" })).toBeEnabled();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  const count = (await spokenVoice(page)).length;
  await page.waitForTimeout(1000);
  expect(await spokenVoice(page)).toHaveLength(count);
});

test("síntese indisponível não bloqueia o treino", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: undefined });
  });
  await setup(page, false);
  await page.getByRole("button", { name: "Preparar câmera", exact: true }).click();
  await page.getByText("Voz ligada", { exact: false }).first().click();
  await expect(page.getByText(/Voz local em português indisponível/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Iniciar em 5 segundos" })).toBeEnabled();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
});
