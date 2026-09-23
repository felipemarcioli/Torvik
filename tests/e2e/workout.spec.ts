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
test("instruções por teclado não mudam o exercício", async ({ page }) => {
  await setup(page);
  await page.getByRole("radio", { name: /Flexão de Braço/ }).check();
  const button = page.locator('button[aria-controls="instructions-squat"]');
  await button.focus();
  await button.press("Enter");
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("radio", { name: /Flexão de Braço/ })).toBeChecked();
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
  await expect(page.getByText("1 repetições avaliadas • 1 dentro dos critérios")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Meu histórico" }).click();
  await expect(page.getByRole("button", { name: "Exportar", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Excluir", exact: true }).click();
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
