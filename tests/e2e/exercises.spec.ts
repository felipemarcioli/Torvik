import { openExerciseGroup, selectExercise, prepareExercise, finishWorkout } from "./home-helpers";
import { test, expect } from "./build-fixture";
import type { Page } from "@playwright/test";
import { pose } from "../fixtures/exercises";
import type { ExerciseId } from "../../src/lib/biomech";
async function setup(page: Page, id: ExerciseId, angle: number) {
  await page.route("https://fonts.googleapis.com/**", (r) => r.abort());
  await page.route("https://cdn.jsdelivr.net/npm/@mediapipe/pose@*/pose.js", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body: `window.__exercisePose=${JSON.stringify(pose(id, angle))};window.Pose=class {setOptions(){} onResults(cb){this.cb=cb;}async close(){}async send({image}){const l=window.__exercisePose.map(p=>({...p,x:.5+(p.x-.5)*image.videoHeight/image.videoWidth}));this.cb({poseLandmarks:l});}};`,
    }),
  );
  await page.goto("/");
}
async function setPose(page: Page, id: ExerciseId, angle: number) {
  await page.evaluate(
    (l) => {
      (window as unknown as { __exercisePose: unknown }).__exercisePose = l;
    },
    pose(id, angle),
  );
  await page.waitForTimeout(500);
}
const items: [ExerciseId, string, number, number][] = [
  ["lunge", "Afundo", 170, 90],
  ["bicepscurl", "Rosca bíceps", 170, 55],
  ["lateralraise", "Elevação lateral", 5, 90],
  ["situp", "Abdominal", 175, 90],
  ["plank", "Prancha", 0.4, 0.4],
];
for (const [id, name, baseline, target] of items) {
  test(`${name}: seleção, início automático, resultado, persistência e exportação`, async ({
    page,
  }) => {
    await setup(page, id, baseline);
    await openExerciseGroup(page, id);
    await selectExercise(page, id);
    await prepareExercise(page);
    await expect(page.getByRole("button", { name: "Pausar", exact: true })).toBeVisible({
      timeout: 12000,
    });
    await page.waitForTimeout(650);
    if (id === "plank") {
      await expect(page.getByText("Contando", { exact: true })).toBeVisible();
      await page.waitForTimeout(1300);
      const valid = await page.locator(".workout-metrics").innerText();
      await setPose(page, id, 0.58);
      await expect(page.getByText("Ajuste a postura", { exact: true }).first()).toBeVisible();
      const frozen = await page.locator(".workout-metrics").innerText();
      await page.waitForTimeout(800);
      expect(await page.locator(".workout-metrics").innerText()).toBe(frozen);
      expect(valid).toContain("em postura válida");
    } else {
      await setPose(page, id, target);
      await setPose(page, id, baseline);
      await expect(page.locator(".workout-metrics")).toContainText("1");
    }
    await finishWorkout(page);
    await expect(
      page.getByRole("heading", { name: "Treino concluído!", exact: true }),
    ).toBeVisible();
    if (id === "plank") {
      await expect(page.locator(".report-summary")).toContainText("Tempo em postura válida");
      await expect(page.locator(".report-summary progress")).toHaveCount(0);
      await expect(page.locator(".report-summary")).not.toContainText("repetições");
    } else await expect(page.getByText("1 de 1 nos critérios do app")).toBeVisible();
    await page.getByRole("button", { name: "Salvar sessão", exact: true }).click();
    await expect(page.getByRole("button", { name: "Salvo neste dispositivo" })).toBeVisible();
    await page.getByRole("button", { name: "Ver sessão salva" }).click();
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar CSV" }).click();
    expect((await download).suggestedFilename()).toMatch(/\.csv$/);
    if (id === "plank") {
      await expect(page.locator(".progress-detail-stats")).not.toContainText("Avaliadas");
      await expect(page.locator(".progress-detail-stats")).toContainText("Tempo em postura válida");
    }
    await page.reload();
    await page.getByRole("button", { name: "Progresso", exact: true }).click();
    await expect(page.locator(".progress-session-card")).toContainText(name);
    if (id === "plank") {
      await page.getByText("Gráficos de evolução", { exact: true }).click();
      await expect(page.getByRole("combobox", { name: /^Métrica/ })).toHaveValue("validSeconds");
      await expect(page.getByRole("combobox", { name: /^Métrica/ }).locator("option")).toHaveCount(
        2,
      );
    }
  });
}
