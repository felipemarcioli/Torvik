import { test, expect } from "./build-fixture";
import { selectExercise, selectInCategory, openExerciseGroup } from "./home-helpers";
import { EXERCISE_SECTIONS } from "../../src/components/torvik/data";
import { EXERCISES } from "../../src/lib/exercises/catalog";

test.beforeEach(async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await page.goto("/");
});

test("restored home has preparation, no default exercise and useful navigation/settings", async ({
  page,
}) => {
  await expect(page.locator(".home-preparation")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Exercício atual" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Antes de começar" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Preparar câmera", exact: true })).toBeDisabled();
  await expect(page.locator(".workout-group-tile.torvik-panel")).toHaveCount(4);
  const nav = page.getByRole("navigation", { name: "Navegação principal" });
  await expect(nav.getByRole("button")).toHaveText(["Treinar", "Progresso", "Ajustes"]);
  await expect(nav.getByRole("button", { name: "Treinar" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await nav.getByRole("button", { name: "Progresso" }).click();
  await expect(page.getByText(/Nenhuma sessão salva/)).toBeVisible();
  await expect(page.locator(".progress-totals")).toHaveCount(0);
  await nav.getByRole("button", { name: "Ajustes" }).click();
  await page.getByRole("checkbox", { name: "Feedback por voz" }).uncheck();
  await page.getByLabel("Modo de voz").selectOption("basic");
  await page.getByRole("slider", { name: /Volume/ }).fill("0.4");
  await page.getByText("Privacidade e armazenamento", { exact: true }).click();
  await expect(page.getByText(/em IndexedDB/)).toBeVisible();
  await page.reload();
  await nav.getByRole("button", { name: "Ajustes" }).click();
  await expect(page.getByRole("checkbox", { name: "Feedback por voz" })).not.toBeChecked();
  await expect(page.getByLabel("Modo de voz")).toHaveValue("basic");
  await expect(page.getByRole("slider", { name: /Volume/ })).toHaveValue("0.4");
});

test("animated categories contain all 30 entries and selection/details reuse the catalog", async ({
  page,
}) => {
  // This single test traverses 30 animated cards and detail screens on mobile too.
  test.setTimeout(60000);
  const seen: string[] = [];
  for (const section of EXERCISE_SECTIONS) {
    await openExerciseGroup(page, section.exercises[0]!.id);
    const dialog = page.locator("dialog[open]");
    await expect(dialog.locator(".exercise-card")).toHaveCount(section.exercises.length);
    for (const exercise of section.exercises) {
      await selectExercise(page, exercise.id);
      await expect(page.locator(".detail-instructions li")).toHaveText(
        exercise.instructions.slice(0, 3),
      );
      await expect(
        page.getByRole("button", {
          name: `Preparar ${exercise.name.toLocaleLowerCase("pt-BR")}`,
          exact: true,
        }),
      ).toBeVisible();
      await expect(page.locator(".detail-preview img")).toHaveAttribute(
        "src",
        exercise.previewAvailable === false
          ? "/torvik-image-3d-180.webp"
          : exercise.previewAnimation,
      );
      await page.getByRole("button", { name: "Voltar", exact: true }).click();
      const selected = dialog.locator('.exercise-card[data-selected="true"]');
      await expect(selected.locator("input:visible")).toBeChecked();
      await expect(selected).toContainText(exercise.name);
      seen.push(exercise.id);
    }
    await dialog.getByRole("button", { name: "Voltar às categorias" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator(".current-exercise-content")).toContainText(
      section.exercises.at(-1)!.name,
    );
  }
  expect(seen.sort()).toEqual(EXERCISES.map((item) => item.id).sort());
});

test("preparing from the restored category uses the selected exercise and back reopens it", async ({
  page,
}) => {
  await page.route("https://cdn.jsdelivr.net/npm/@mediapipe/pose@*/pose.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: "window.Pose=class{setOptions(){}onResults(cb){this.cb=cb}async close(){}async send(){this.cb({poseLandmarks:[]})}};",
    }),
  );
  await selectInCategory(page, "lunge");
  await page
    .locator("dialog[open]")
    .getByRole("button", { name: "Preparar câmera", exact: true })
    .click();
  await expect(page.getByRole("main", { name: "Treino de Afundo" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Iniciar em 5 segundos", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await expect(page.locator("dialog[open]")).toBeVisible();
  await expect(page.locator('dialog[open] input[value="lunge"]:visible')).toBeChecked();
  await page.locator("dialog[open]").getByRole("button", { name: "Voltar às categorias" }).click();
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await expect(page.locator(".current-exercise-content")).toContainText("Afundo");
});

test("search ignores accents, keyboard opens details and browser back restores search", async ({
  page,
}) => {
  const search = page.getByRole("searchbox", { name: "Buscar exercício por nome" });
  await search.fill("FLEXAO");
  await expect(page.locator(".exercise-row")).toHaveCount(1);
  const row = page.getByRole("button", { name: /Flexão de Braço.*Ver detalhes/ });
  await row.focus();
  await row.press("Enter");
  await expect(page.getByRole("heading", { name: "Flexão de Braço", exact: true })).toBeFocused();
  await page.goBack();
  await expect(search).toHaveValue("FLEXAO");
  await expect(page.locator('.exercise-row[data-selected="true"]')).toHaveCount(1);
  await search.fill("zzzz");
  await expect(page.getByRole("status")).toHaveText("0 exercícios encontrados");
});

test("category scroll and selection survive details, browser back/forward and Escape", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 });
  const card = await selectInCategory(page, "wallsit");
  const details = card.getByRole("button", { name: /^Ver detalhes de/ });
  await details.scrollIntoViewIfNeeded();
  const scroll = page.locator("dialog[open] .workout-category-scroll");
  const before = await scroll.evaluate((element) => element.scrollTop);
  await details.click();
  await page.goBack();
  await expect(page.locator("dialog[open]")).toBeVisible();
  await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBe(before);
  await page.goForward();
  await expect(
    page.getByRole("heading", { name: /Agachamento isométrico na parede/ }),
  ).toBeVisible();
  await page.goBack();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await expect(page.locator(".current-exercise-content")).toContainText(
    "Agachamento isométrico na parede",
  );
});

for (const [width, height] of [
  [360, 800],
  [390, 844],
  [768, 1024],
  [1366, 768],
  [1920, 1080],
  [360, 640],
  [844, 390],
]) {
  test(`restored home and navigation fit ${width}×${height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: width!, height: height! });
    const fit = async () =>
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    await fit();
    const mobile = width! < 768;
    await expect(page.locator(".app-bottom-nav")).toBeVisible({ visible: mobile });
    await expect(page.locator(".app-desktop-header")).toBeVisible({ visible: !mobile });
    await expect(page.locator(width! < 600 ? ".home-mobile-welcome" : ".home-hero")).toBeVisible();
    for (const tile of await page.locator(".workout-group-tile").all()) {
      const style = await tile.evaluate((button) => ({
        border: getComputedStyle(button).borderTopWidth,
        background: getComputedStyle(button).backgroundColor,
      }));
      expect(style.border).not.toBe("0px");
      expect(style.background).not.toBe("rgba(0, 0, 0, 0)");
    }
    const path = testInfo.outputPath(`home-${width}.png`);
    await page.screenshot({ path, fullPage: true });
    await testInfo.attach(`Home ${width}px`, { path, contentType: "image/png" });
    const card = await selectInCategory(page, "mountainclimber");
    await fit();
    if (width! < 600) await expect(card.locator(".mobile-exercise-preview")).toBeVisible();
    else {
      await card.getByRole("button", { name: "Ver instruções", exact: true }).click();
      await expect(card.locator("ul")).toBeVisible();
    }
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "Voltar às categorias" })
      .click();
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(page.locator(".current-exercise-preview img")).toBeVisible();
    const start = page.getByRole("button", { name: "Preparar câmera", exact: true });
    await expect(start).toBeEnabled();
    // Center explicitly: the browser's "if needed" scroll can leave a control
    // within the viewport but covered by the fixed bottom navigation.
    await start.evaluate((button) =>
      button.scrollIntoView({ block: "center", behavior: "instant" }),
    );
    if (mobile) {
      const box = await start.boundingBox(),
        nav = await page.locator(".app-bottom-nav").boundingBox();
      expect(box!.y + box!.height).toBeLessThanOrEqual(nav!.y);
    }
    await selectExercise(page, "mountainclimber");
    await fit();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect
      .poll(() =>
        page.locator(".detail-preview img").evaluate((img: HTMLImageElement) => img.currentSrc),
      )
      .toContain("still.webp");
    await page.getByRole("button", { name: "Progresso", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Progresso", exact: true })).toBeVisible();
    await fit();
    await page.getByRole("button", { name: "Ajustes", exact: true }).click();
    await fit();
    await page.addStyleTag({ content: "html { font-size: 24px !important; }" });
    await fit();
  });
}
