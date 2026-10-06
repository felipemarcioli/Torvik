import { openExerciseGroup } from "./home-helpers";
import { expect, test, type Page } from "@playwright/test";
import { pose } from "../fixtures/exercises";
import type { ExerciseId } from "../../src/lib/biomech";
import { EXERCISES } from "../../src/lib/exercises/catalog";
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
    await page.locator(`input[value="${id}"]:visible`).check();
    await page.getByRole("button", { name: "Preparar câmera", exact: true }).click();
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
    await page.getByRole("button", { name: "Finalizar treino", exact: true }).click();
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
    await page.getByRole("button", { name: "Meu histórico" }).click();
    await expect(page.locator(".progress-session-card")).toContainText(name);
    if (id === "plank") {
      await expect(page.getByRole("combobox", { name: /^Métrica/ })).toHaveValue("validSeconds");
      await expect(page.getByRole("combobox", { name: /^Métrica/ }).locator("option")).toHaveCount(
        2,
      );
    }
  });
}
test("categorias exibem todo o catálogo na ordem esperada e preservam a seleção", async ({
  page,
}) => {
  await setup(page, "lunge", 170);
  const categories: [string, string[]][] = [
    [
      "Treino Superior",
      [
        "pushup",
        "floorpress",
        "bicepscurl",
        "tricepskickback",
        "lateralraise",
        "shoulderpress",
        "frontraise",
        "bentoverrow",
      ],
    ],
    [
      "Treino de Pernas",
      [
        "squat",
        "lunge",
        "reverselunge",
        "glutebridge",
        "calfraise",
        "romaniandeadlift",
        "bulgariansquat",
        "wallsit",
      ],
    ],
    ["Core", ["situp", "plank", "sideplank", "deadbug", "birddog", "lyinglegraise", "shouldertap"]],
    [
      "Cardio",
      [
        "jumpingjack",
        "mountainclimber",
        "highknees",
        "buttkicks",
        "skater",
        "stepjack",
        "jumpsquat",
      ],
    ],
  ];
  await expect(page.locator('.workout-group-tile[aria-expanded="false"]')).toHaveCount(4);
  await expect(page.locator(".exercise-card:visible")).toHaveCount(0);
  await expect(page.locator(".workout-group-label > .font-bold")).toHaveText(
    categories.map(([title]) => title),
  );
  const visibleIds = await page
    .locator(".desktop-exercise-select input")
    .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value));
  expect([...visibleIds].sort()).toEqual(EXERCISES.map((exercise) => exercise.id).sort());
  for (const [title, ids] of categories) {
    await openExerciseGroup(page, ids[0]!);
    await expect(page.locator('.workout-group-tile[aria-expanded="true"]')).toHaveCount(1);
    const section = page.getByRole("dialog", { name: title, exact: true });
    await expect(section.getByRole("heading", { name: new RegExp(title) })).toBeVisible();
    expect(
      await section
        .locator("input:visible")
        .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value)),
    ).toEqual(ids);
    for (const id of ids) {
      const radio = section.locator(`input[value="${id}"]:visible`);
      await radio.check();
      await expect(radio).toBeChecked();
      await expect(page.locator('.exercise-card[data-selected="true"]')).toHaveCount(1);
    }
  }
});

test("trinta cards, troca rápida, previews e movimento reduzido sem overflow", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await setup(page, "lunge", 170);
  await expect(page.locator(".exercise-card")).toHaveCount(30);
  for (const [id, name] of items) {
    await openExerciseGroup(page, id);
    await page.locator(`input[value="${id}"]:visible`).check();
    await expect(page.locator('.exercise-card[data-preview-open="true"]')).toHaveCount(1);
    await expect(page.locator(`#exercise-preview-${id}`)).toHaveAttribute("aria-hidden", "false");
  }
  for (const [width, height] of [
    [360, 800],
    [390, 844],
    [844, 390],
    [768, 1024],
    [1280, 800],
  ]) {
    await page.setViewportSize({ width: width!, height: height! });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await openExerciseGroup(page, "plank");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const img = page.locator("#exercise-preview-plank img");
  await expect
    .poll(() => img.evaluate((i: HTMLImageElement) => i.currentSrc))
    .toContain("still.webp");
  await page.screenshot({ path: "/tmp/torvik-eight-exercises.png", fullPage: true });
});

test("grupos preservam seleção e detalhes, teclado e espaço acima da ação mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page, "lunge", 170);
  const legs = page.locator("#exercise-category-legs");
  await expect(legs).toBeEnabled({ timeout: 15000 });
  await legs.focus();
  await legs.press("Enter");
  const squat = page.locator('input[value="squat"]:visible');
  await squat.press("Space");
  await expect(squat).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "Voltar às categorias" }).click();
  await expect(page.locator("#workout-group-legs")).not.toBeVisible();
  await expect(legs).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator('input[value="squat"]').first()).toBeChecked();
  await expect(page.locator("#workout-group-legs")).toHaveAttribute("inert", "");
  await expect(legs).toBeFocused();
  await legs.press("Space");
  await expect(squat).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#exercise-preview-squat")).toHaveAttribute("aria-hidden", "false");
  await openExerciseGroup(page, "mountainclimber");
  await page.locator('input[value="mountainclimber"]:visible').check();
  await expect(legs).toHaveAttribute("aria-expanded", "false");
  const preview = page.locator("#exercise-preview-mountainclimber");
  await expect(preview.locator("img")).toHaveAttribute(
    "src",
    "/exercise-previews/torvik-mountainclimber.webp",
  );
  for (const size of [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(size);
    await page.waitForTimeout(300);
    await preview.evaluate((e) => e.scrollIntoView({ block: "center" }));
    const box = await preview.boundingBox();
    const action = await page
      .getByRole("button", { name: "Preparar câmera", exact: true })
      .boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(action!.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator("#workout-group-cardio")
      .evaluate((e) => getComputedStyle(e).transitionDuration),
  ).toBe("0s");
});

test("grade 2x2 navega para uma categoria modal e retorna com Escape", async ({ page }) => {
  await setup(page, "lunge", 170);
  for (const width of [360, 390, 550]) {
    await page.setViewportSize({ width, height: 844 });
    const cards = page.locator(".workout-group-tile");
    await expect(cards).toHaveCount(4);
    const boxes = await cards.evaluateAll((elements) =>
      elements.map((e) => {
        const r = e.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width };
      }),
    );
    expect(boxes[0]!.y).toBe(boxes[1]!.y);
    expect(boxes[2]!.y).toBe(boxes[3]!.y);
    expect(boxes[1]!.x).toBeGreaterThan(boxes[0]!.x + boxes[0]!.width);
    expect(boxes[2]!.y).toBeGreaterThan(boxes[0]!.y);
    const upper = page.locator("#exercise-category-upper");
    await upper.click();
    const dialog = page.getByRole("dialog", { name: "Treino Superior", exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Voltar às categorias" })).toBeFocused();
    await expect(dialog.locator(".exercise-card")).toHaveCount(8);
    await expect(
      dialog.getByRole("button", { name: "Preparar câmera", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Preparar câmera", exact: true })).toHaveCount(1);
    await expect.poll(async () => (await dialog.boundingBox())!.height).toBeGreaterThan(800);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(upper).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.style.overflow)).not.toBe("hidden");
  }
});

test("preparação acompanha a seleção e reutiliza os previews e orientações", async ({ page }) => {
  await setup(page, "lunge", 170);
  const preparation = page.locator(".home-preparation");
  const current = preparation.locator(".current-exercise");
  await expect(current).toContainText("Agachamento");
  await expect(preparation.getByRole("heading", { name: "Antes de começar" })).toBeVisible();
  await expect(preparation.locator("li")).toHaveCount(4);
  for (const id of ["pushup", "mountainclimber", "squat"] as const) {
    await openExerciseGroup(page, id);
    await page.locator(`input[value="${id}"]:visible`).check();
    await page.getByRole("button", { name: "Voltar às categorias" }).click();
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    const exercise = EXERCISES.find((e) => e.id === id)!;
    await expect(current).toContainText(exercise.name);
    await expect(current).toContainText(exercise.badge);
    await expect(current.locator("img")).toHaveAttribute("src", exercise.previewAnimation);
    await expect
      .poll(() =>
        current
          .locator("img")
          .evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth === 256),
      )
      .toBe(true);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect
      .poll(() => current.locator("img").evaluate((i: HTMLImageElement) => i.currentSrc))
      .toContain(exercise.previewStill);
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
  for (const width of [360, 390, 550, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await preparation.locator("li").last().scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (width < 600) {
      const tip = await preparation.locator("li").last().boundingBox();
      const action = await page
        .getByRole("button", { name: "Preparar câmera", exact: true })
        .boundingBox();
      expect(tip!.y + tip!.height).toBeLessThanOrEqual(action!.y);
    }
  }
});
