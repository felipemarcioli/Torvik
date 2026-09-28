import { openExerciseGroup } from "./home-helpers";
import { expect, test, type Page } from "@playwright/test";
import { expansionPose, NEW_IDS, type Stage } from "../fixtures/expansion";
import { EXERCISE_BY_ID } from "../../src/lib/exercises/catalog";
import type { NewExerciseId } from "../../src/lib/exercises/expansion";
async function setup(page: Page, id: NewExerciseId) {
  await page.route("https://fonts.googleapis.com/**", (r) => r.abort());
  await page.route("https://cdn.jsdelivr.net/npm/@mediapipe/pose@*/pose.js", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body: `window.__exercisePose=${JSON.stringify(expansionPose(id, "base"))};window.Pose=class{setOptions(){}onResults(cb){this.cb=cb}async close(){}async send({image}){const l=window.__exercisePose.map(p=>({...p,x:.5+(p.x-.5)*image.videoHeight/image.videoWidth}));this.cb({poseLandmarks:l})}};`,
    }),
  );
  await page.goto("/");
  await openExerciseGroup(page, id);
  await page.locator(`input[value="${id}"]:visible`).check();
  await page.getByRole("button", { name: "Preparar câmera", exact: true }).click();
}
async function pose(page: Page, id: NewExerciseId, stage: Stage) {
  await page.evaluate(
    (l) => {
      (window as unknown as { __exercisePose: unknown }).__exercisePose = l;
    },
    expansionPose(id, stage),
  );
  // Allow the application's existing landmark smoothing and temporal confirmations.
  await page.waitForTimeout(900);
}
for (const id of NEW_IDS) {
  test(`${id}: automatic start, one cycle, report, history and exports`, async ({ page }) => {
    await setup(page, id);
    await expect(page.getByRole("button", { name: "Pausar", exact: true })).toBeVisible({
      timeout: 18000,
    });
    await page.waitForTimeout(600);
    if (id === "reverselunge") await pose(page, id, "step");
    await pose(page, id, "entry");
    await pose(page, id, "target");
    await pose(page, id, "base");
    await page.getByRole("button", { name: "Finalizar treino", exact: true }).click();
    await expect(page.getByText("1 de 1 nos critérios do app")).toBeVisible();
    await page.getByRole("button", { name: "Salvar sessão", exact: true }).click();
    await expect(page.getByRole("button", { name: "Salvo neste dispositivo" })).toBeVisible();
    await page.getByRole("button", { name: "Ver sessão salva" }).click();
    await expect(
      page.getByRole("heading", { name: EXERCISE_BY_ID[id].name, exact: true }),
    ).toBeVisible();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar CSV" }).click();
    expect((await download).suggestedFilename()).toMatch(/\.csv$/);
    await page.reload();
    await page.getByRole("button", { name: "Meu histórico" }).click();
    await expect(page.locator(".progress-session-card")).toContainText(EXERCISE_BY_ID[id].name);
  });
}
test("new previews fit mobile, retain instructions on desktop and honor reduced motion", async ({
  page,
}) => {
  await page.goto("/");
  for (const [width, height] of [
    [360, 800],
    [390, 844],
  ]) {
    await page.setViewportSize({ width: width!, height: height! });
    for (const id of NEW_IDS) {
      await openExerciseGroup(page, id);
      await page.locator(`input[value="${id}"]:visible`).check();
      const preview = page.locator(`#exercise-preview-${id}`);
      await expect(preview).toHaveAttribute("aria-hidden", "false");
      await expect(page.locator('.exercise-card[data-preview-open="true"]')).toHaveCount(1);
      await expect
        .poll(() =>
          preview
            .locator("img")
            .evaluate((i: HTMLImageElement) => (i.complete ? i.naturalWidth : 0)),
        )
        .toBe(EXERCISE_BY_ID[id].previewAvailable === false ? 180 : 256);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect
        .poll(() => preview.locator("img").evaluate((i: HTMLImageElement) => i.currentSrc))
        .toContain(
          EXERCISE_BY_ID[id].previewAvailable === false
            ? "torvik-image-3d-180.webp"
            : `torvik-${id}-still.webp`,
        );
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await expect
        .poll(() => preview.locator("img").evaluate((i: HTMLImageElement) => i.currentSrc))
        .toContain(`torvik-${id}.webp`);
      await expect(preview).not.toContainText("Demonstração animada indisponível.");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() =>
      page
        .locator("#exercise-preview-mountainclimber img")
        .evaluate((i: HTMLImageElement) => i.currentSrc),
    )
    .toContain("torvik-mountainclimber-still.webp");
  await page.screenshot({ path: "/tmp/torvik-sixteen-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1280, height: 800 });
  await openExerciseGroup(page, "glutebridge");
  const card = page
    .locator(".exercise-card")
    .filter({ has: page.locator('input[value="glutebridge"]') });
  await card.getByRole("button", { name: "Ver instruções" }).click();
  await expect(
    card.getByText("Posicione a câmera de lado, próxima ao chão", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "/tmp/torvik-sixteen-desktop.png", fullPage: true });
});
