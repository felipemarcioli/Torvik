import { test, expect, type Page } from "@playwright/test";
import { ADDITION_IDS, type AdditionId } from "../../src/lib/exercises/additions";
import { EXERCISE_BY_ID } from "../../src/lib/exercises/catalog";
import { catalogPose, type Stage } from "../fixtures/catalog-30";
import {
  openExerciseGroup,
  selectExercise,
  prepareExercise,
  finishWorkout,
  changeSide,
} from "./home-helpers";
async function setup(page: Page, id: AdditionId) {
  await page.route("https://fonts.googleapis.com/**", (r) => r.abort());
  await page.route("https://cdn.jsdelivr.net/npm/@mediapipe/pose@*/pose.js", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body: `window.__catalogPose=${JSON.stringify(catalogPose(id, "base"))};window.__catalogSamples=[];window.Pose=class{setOptions(){}onResults(cb){this.cb=cb}async close(){}async send({image}){const now=performance.now(),samples=window.__catalogSamples;if(samples.length&&now-samples.at(-1)>400)samples.length=0;samples.push(now);if(samples.length>30)samples.shift();this.cb({poseLandmarks:window.__catalogPose.map(p=>({...p,x:.5+(p.x-.5)*.65*image.videoHeight/image.videoWidth,y:.5+(p.y-.5)*.65}))})}};`,
    }),
  );
  await page.goto("/");
  await openExerciseGroup(page, id);
  await selectExercise(page, id);
  await prepareExercise(page);
  await expect(page.getByRole("button", { name: "Pausar", exact: true })).toBeVisible({
    timeout: 18000,
  });
  if (EXERCISE_BY_ID[id].type === "REP_BASED") await pose(page, id, "base");
}
async function pose(page: Page, id: AdditionId, stage: Stage, side: "left" | "right" = "left") {
  await page.evaluate(
    (l) => {
      const harness = window as unknown as { __catalogPose: unknown; __catalogSamples: number[] };
      harness.__catalogPose = l;
      harness.__catalogSamples = [];
    },
    catalogPose(id, stage, side),
  );
  await page.waitForTimeout(800);
  // Advancing wall time alone does not prove that the camera sampled this fixture stage.
  await page.waitForFunction(
    () => {
      const samples = (window as unknown as { __catalogSamples: number[] }).__catalogSamples;
      return samples.length >= 4 && samples[samples.length - 1]! - samples[0]! >= 400;
    },
    null,
    { timeout: 12000 },
  );
}
for (const id of ADDITION_IDS) {
  test(`${id}: selection, measurement, report and persisted history`, async ({ page }) => {
    test.setTimeout(60000);
    await setup(page, id);
    if (EXERCISE_BY_ID[id].type === "HOLD_BASED") {
      for (const width of [360, 390]) {
        await page.setViewportSize({ width, height: 844 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
      }
    }
    if (EXERCISE_BY_ID[id].type === "HOLD_BASED") {
      await page.waitForTimeout(1600);
      await expect(page.locator(".workout-metrics")).toContainText("Contando");
    } else if (id === "skater") await pose(page, id, "right");
    else {
      await pose(page, id, "entry");
      await pose(page, id, "target");
      if (id === "jumpsquat") {
        await pose(page, id, "air");
        await pose(page, id, "landing");
      }
      await pose(page, id, "base");
    }
    await finishWorkout(page);
    await expect(page.locator(".report-exercise")).toHaveText(EXERCISE_BY_ID[id].name);
    if (EXERCISE_BY_ID[id].type === "REP_BASED")
      await expect(page.getByText("1 de 1 nos critérios do app")).toBeVisible();
    if (EXERCISE_BY_ID[id].sideMode)
      await expect(page.getByRole("heading", { name: "Resultados por lado" })).toBeVisible();
    await page.getByRole("button", { name: "Salvar sessão", exact: true }).click();
    await expect(page.getByRole("button", { name: "Salvo neste dispositivo" })).toBeVisible();
    await page.getByRole("button", { name: "Ver sessão salva" }).click();
    await expect(
      page.getByRole("heading", { name: EXERCISE_BY_ID[id].name, exact: true }),
    ).toBeVisible();
    const downloading = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar CSV" }).click();
    expect((await downloading).suggestedFilename()).toMatch(/\.csv$/);
    await page.reload();
    await page.getByRole("button", { name: "Progresso", exact: true }).click();
    await expect(page.locator(".progress-session-card")).toContainText(EXERCISE_BY_ID[id].name);
  });
}
test("side change preserves completed Bulgarian repetitions and prepares opposite leg", async ({
  page,
}) => {
  test.setTimeout(45000);
  await setup(page, "bulgariansquat");
  await pose(page, "bulgariansquat", "entry");
  await pose(page, "bulgariansquat", "target");
  await pose(page, "bulgariansquat", "base");
  await pose(page, "bulgariansquat", "base", "right");
  await changeSide(page, "Direito");

  await expect(page.getByRole("button", { name: "Pausar", exact: true })).toBeVisible({
    timeout: 18000,
  });
  await pose(page, "bulgariansquat", "base", "right");
  await pose(page, "bulgariansquat", "entry", "right");
  await pose(page, "bulgariansquat", "target", "right");
  await pose(page, "bulgariansquat", "base", "right");
  await finishWorkout(page);
  await expect(page.getByText("2 de 2 nos critérios do app")).toBeVisible();
  const sides = page.getByRole("region", { name: "Resultados por lado" });
  await expect(sides).toContainText("1 repetições");
});
test("side plank side change records separate valid times in report and history", async ({
  page,
}) => {
  test.setTimeout(60000);
  await setup(page, "sideplank");
  await page.waitForTimeout(1800);
  await pose(page, "sideplank", "base", "right");
  await changeSide(page, "Direito");
  await expect(page.getByRole("button", { name: "Pausar", exact: true })).toBeVisible({
    timeout: 18000,
  });
  await page.waitForTimeout(1800);
  await finishWorkout(page);
  const sides = page.getByRole("region", { name: "Resultados por lado" });
  await expect(sides.locator("dd")).toHaveText([/^[1-9]/, /^[1-9]/]);
  await page.getByRole("button", { name: "Salvar sessão", exact: true }).click();
  await expect(page.getByRole("button", { name: "Salvo neste dispositivo" })).toBeVisible();
  await page.getByRole("button", { name: "Ver sessão salva" }).click();
  await expect(sides.locator("dd")).toHaveText([/^[1-9]/, /^[1-9]/]);
});
for (const width of [360, 390])
  test(`14 new previews load, animate and honor reduced motion at ${width}px`, async ({ page }) => {
    test.setTimeout(180000);
    await page.route("https://fonts.googleapis.com/**", (r) => r.abort());
    await page.goto("/");
    await page.setViewportSize({ width, height: 800 });
    for (const id of ADDITION_IDS) {
      await openExerciseGroup(page, id);
      await selectExercise(page, id);
      const img = page.locator(`#exercise-preview-${id} img`);
      await expect
        .poll(() => img.evaluate((i: HTMLImageElement) => (i.complete ? i.naturalWidth : 0)))
        .toBe(256);
      await expect
        .poll(() => img.evaluate((i: HTMLImageElement) => i.currentSrc))
        .toContain(`torvik-${id}.webp`);
      const first = await img.screenshot();
      await page.waitForTimeout(450);
      const second = await img.screenshot();
      await page.waitForTimeout(450);
      const third = await img.screenshot();
      expect(!first.equals(second) || !second.equals(third)).toBe(true);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect
        .poll(() => img.evaluate((i: HTMLImageElement) => i.currentSrc))
        .toContain(`torvik-${id}-still.webp`);
      await page.emulateMedia({ reducedMotion: "no-preference" });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  });
