import { selectExercise, prepareExercise, finishWorkout } from "./home-helpers";
import { test, expect } from "./build-fixture";
import type { Page } from "@playwright/test";
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
  await selectExercise(page, "squat");
}
test("preparação, treino, pausa, relatório, histórico e reinício", async ({ page }) => {
  await setup(page);
  await prepareExercise(page);
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
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
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
  await expect(page.getByRole("button", { name: "Continuar", exact: true })).toBeVisible();
  await finishWorkout(page);
  await expect(page.getByText("1 de 1 nos critérios do app")).toBeVisible();
  await page.getByRole("button", { name: "Salvar sessão", exact: true }).click();
  await expect(page.getByRole("button", { name: "Salvo neste dispositivo" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ver sessão salva" })).toBeVisible();
  await page.getByRole("button", { name: "Voltar ao exercício" }).click();
  await page.getByRole("button", { name: "Progresso", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Progresso", exact: true })).toBeVisible();
  await expect(page.getByText("Avaliadas", { exact: true })).toBeVisible();
  await expect(
    page.locator(".progress-card-stats").getByText("Nos critérios", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Progresso", exact: true }).click();
  await page.getByRole("button", { name: "Ver detalhes" }).click();
  await expect(page.getByRole("button", { name: "Exportar JSON", exact: true })).toBeVisible();
  await page.getByText("Repetições registradas (1)", { exact: true }).click();
  await expect(page.getByText(/Repetição 1 ·/)).toBeVisible();
  await page.getByRole("button", { name: "Excluir sessão", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar exclusão" }).click();
  await expect(page.getByText(/Nenhuma sessão salva/)).toBeVisible();
  await page.getByRole("button", { name: "Treinar", exact: true }).click();
  await selectExercise(page, "squat");
  await prepareExercise(page);
  await expect(start).toBeEnabled();
  await finishWorkout(page);
  await expect(page.getByRole("heading", { name: "Nenhuma repetição avaliada" })).toBeVisible();
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(start).toBeEnabled();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  if (await page.getByRole("button", { name: "Descartar e sair" }).count())
    await page.getByRole("button", { name: "Descartar e sair" }).click();
});
test("falha no script oferece nova tentativa funcional", async ({ page }) => {
  await setup(page);
  let failures = 1;
  await page.route("https://cdn.jsdelivr.net/npm/@mediapipe/pose@*/pose.js", async (route) => {
    if (failures-- > 0) await route.abort();
    else await route.fallback();
  });
  await prepareExercise(page);
  await expect(page.getByRole("alert")).toContainText("Não foi possível carregar");
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByRole("button", { name: "Iniciar em 5 segundos" })).toBeEnabled();
});
test("imagem completa e ações sem sobreposição em retrato e paisagem", async ({ page }) => {
  await setup(page, false);
  await prepareExercise(page);
  await expect(page.getByRole("button", { name: "Iniciar em 5 segundos" })).toBeEnabled();
  for (const size of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 360, height: 800 },
    { width: 430, height: 932 },
    { width: 360, height: 640 },
    { width: 768, height: 1024 },
    { width: 1366, height: 768 },
    { width: 1920, height: 1080 },
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
  await prepareExercise(page);
  await expect(page.getByRole("heading", { name: /Vamos encontrar sua posição/ })).toBeVisible();
  await expect(
    page.getByText("Prepare-se. O treino já vai começar.", { exact: true }),
  ).toBeVisible();
  await tracking(page, false);
  await expect(page.getByRole("heading", { name: /Vamos encontrar sua posição/ })).toBeVisible();
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
  await finishWorkout(page);
  await expect(page.getByRole("heading", { name: "Nenhuma repetição avaliada" })).toBeVisible();
});
test("manual fora do quadro oferece cinco segundos e cancelamento não inicia sessão", async ({
  page,
}) => {
  await setup(page, false);
  await prepareExercise(page);
  const manual = page.getByRole("button", { name: "Iniciar em 5 segundos" });
  await expect(manual).toBeEnabled();
  await manual.click();
  await expect(page.getByText("Posicione-se no quadro.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pausar", exact: true })).toHaveCount(0);
  await tracking(page, true);
  await expect(page.getByRole("button", { name: "Pausar", exact: true })).toBeVisible({
    timeout: 10000,
  });
  await page.getByRole("button", { name: "Pausar", exact: true }).click();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  if (await page.getByRole("button", { name: "Descartar e sair" }).count())
    await page.getByRole("button", { name: "Descartar e sair" }).click();
  await prepareExercise(page);
  await expect(
    page.getByText("Prepare-se. O treino já vai começar.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  if (await page.getByRole("button", { name: "Descartar e sair" }).count())
    await page.getByRole("button", { name: "Descartar e sair" }).click();
  await page.waitForTimeout(5500);
  await expect(
    page.getByRole("button", { name: "Preparar agachamento", exact: true }),
  ).toBeVisible();
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
    await prepareExercise(page);
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
    await finishWorkout(page);
    await expect(page.getByText("5 de 5 nos critérios do app")).toBeVisible();
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
  await prepareExercise(page);
  await page.getByRole("button", { name: "Controles de câmera e voz" }).click();
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
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Iniciar em 5 segundos" })).toBeEnabled();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  if (await page.getByRole("button", { name: "Descartar e sair" }).count())
    await page.getByRole("button", { name: "Descartar e sair" }).click();
  const count = (await spokenVoice(page)).length;
  await page.waitForTimeout(1000);
  expect(await spokenVoice(page)).toHaveLength(count);
});

test("síntese indisponível não bloqueia o treino", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: undefined });
  });
  await setup(page, false);
  await prepareExercise(page);
  await page.getByRole("button", { name: "Controles de câmera e voz" }).click();
  await expect(page.getByText(/Voz local em português indisponível/)).toBeVisible();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Iniciar em 5 segundos" })).toBeEnabled();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  if (await page.getByRole("button", { name: "Descartar e sair" }).count())
    await page.getByRole("button", { name: "Descartar e sair" }).click();
});

test("relatório vazio é claro e mantém informações técnicas recolhidas", async ({ page }) => {
  await setup(page);
  await prepareExercise(page);
  await finishWorkout(page);
  await expect(page.getByRole("heading", { name: "Sessão encerrada" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Nenhuma repetição avaliada" })).toBeVisible();
  await expect(page.locator(".report-progress")).toHaveCount(0);
  await expect(page.locator(".report-review")).toHaveCount(0);
  await expect(page.locator(".report-history-list")).toHaveCount(0);
  if (test.info().project.name === "mobile-chromium")
    await page
      .locator(".report-content")
      .screenshot({ path: "/tmp/torvik-report-empty-mobile.png" });
  const info = page.getByText("Sobre este relatório e seus dados");
  await expect(info).toBeVisible();
  await expect(page.getByText(/Não mede precisão científica/)).toBeHidden();
  await info.click();
  await expect(page.getByText(/Não mede precisão científica/)).toBeVisible();
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByRole("button", { name: "Iniciar em 5 segundos" })).toBeVisible();
});

test("relatório destaca resultados, salva antes de novo treino e consulta anteriores em Progresso", async ({
  page,
}) => {
  test.setTimeout(45000);
  await setup(page);
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const request = indexedDB.open("torvik-history", 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("sessions", { keyPath: "id" });
      request.onsuccess = () => resolve(request.result);
    });
    await new Promise<void>((resolve) => {
      const tx = db.transaction("sessions", "readwrite");
      tx.objectStore("sessions").put({
        schemaVersion: 1,
        id: "older",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        exercise: "pushup",
        seconds: 91,
        totalReps: 12,
        correctReps: 10,
        feedbackCounts: { "Amplie a descida da flexão": 2 },
        interruptedCycles: 1,
        trackingLosses: 0,
        rulesVersion: "old-rules",
        engineVersion: "pose",
      });
      tx.oncomplete = () => resolve();
    });
    db.close();
  });
  await prepareExercise(page);
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
  for (const angle of [140, 125, 170]) {
    await page.evaluate((value) => {
      (window as unknown as { __angle: number }).__angle = value;
    }, angle);
    await page.waitForTimeout(420);
  }
  await finishWorkout(page);
  await expect(page.getByRole("heading", { name: "Treino concluído!" })).toBeVisible();
  await expect(page.locator(".report-metric-main dd")).toHaveText("2");
  await expect(page.getByText("1 de 2 nos critérios do app")).toBeVisible();
  await page.locator(".report-issues summary").click();
  await expect(page.getByText(/limite de amplitude configurado/)).toBeVisible();
  await expect(page.locator(".report-history-list")).toHaveCount(0);
  for (const [width, height] of [
    [360, 800],
    [390, 844],
    [844, 390],
    [768, 1024],
    [1366, 768],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width: width!, height: height! });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .locator(".report-content")
    .screenshot({ path: `/tmp/torvik-report-${test.info().project.name}.png` });
  await page.getByRole("button", { name: "Salvar sessão", exact: true }).click();
  await expect(page.getByRole("button", { name: "Salvo neste dispositivo" })).toBeVisible();
  await page.getByRole("button", { name: "Ver Progresso" }).click();
  await page.locator("#session-older").click();
  await expect(page.getByRole("heading", { name: "Flexão de Braço", exact: true })).toBeVisible();
  await expect(page.getByText("Amplie a descida da flexão", { exact: true })).toBeVisible();
});

test("browser back during execution pauses, asks before discard and preserves repetitions", async ({
  page,
}) => {
  await setup(page);
  await prepareExercise(page);
  await expect(page.getByRole("button", { name: "Pausar", exact: true })).toBeVisible({
    timeout: 15000,
  });
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
  await expect(page.locator(".workout-metrics > div:first-child > p:first-child")).toHaveText("1");
  await expect(page.getByRole("navigation", { name: "Navegação principal" })).toHaveCount(0);
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Treino pausado" })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: "Voltar à pausa", exact: true }).click();
  await expect(page.locator(".workout-metrics > div:first-child > p:first-child")).toHaveText("1");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pausar", exact: true })).toBeVisible({
    timeout: 15000,
  });
  await finishWorkout(page);
  await expect(page.getByText("1 de 1 nos critérios do app")).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: "Voltar ao resultado", exact: true }).click();
  const save = await page.getByRole("button", { name: "Salvar sessão", exact: true }).boundingBox();
  const restart = await page
    .getByRole("button", { name: "Novo treino", exact: true })
    .boundingBox();
  expect(save!.y).toBeLessThan(restart!.y);
  await page.getByRole("button", { name: "Salvar sessão", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Sessão salva.");
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Agachamento", exact: true })).toBeVisible();
});

test("back from preparation returns to the chosen exercise without starting a session", async ({
  page,
}) => {
  await setup(page, false);
  await prepareExercise(page);
  await expect(page.getByRole("button", { name: "Iniciar em 5 segundos" })).toBeEnabled();
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Agachamento", exact: true })).toBeVisible();
  await expect(page.locator("video")).toHaveCount(0);
  await page.getByRole("button", { name: "Progresso", exact: true }).click();
  await expect(page.getByText(/Nenhuma sessão salva/)).toBeVisible();
});

test("permissão negada mantém nova tentativa e saída acessíveis em retrato e paisagem", async ({
  page,
}) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException("Permission denied", "NotAllowedError");
    };
  });
  await setup(page, false);
  await prepareExercise(page);
  await expect(page.getByRole("alert")).toContainText("Permissão de câmera negada");
  for (const size of [
    { width: 320, height: 640 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(size);
    const retry = page.getByRole("button", { name: "Tentar novamente", exact: true });
    await retry.scrollIntoViewIfNeeded();
    const camera = await page.locator(".camera-region").boundingBox();
    const action = await retry.boundingBox();
    expect(action!.y).toBeGreaterThanOrEqual(camera!.y);
    expect(action!.y + action!.height).toBeLessThanOrEqual(camera!.y + camera!.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Agachamento", exact: true })).toBeVisible();
  await expect(page.locator("video")).toHaveCount(0);
});
