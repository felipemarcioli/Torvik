import { test, expect } from "./build-fixture";
import { selectExercise, openExerciseGroup } from "./home-helpers";
import { EXERCISE_SECTIONS } from "../../src/components/torvik/data";
import { EXERCISES } from "../../src/lib/exercises/catalog";

test.beforeEach(async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await page.goto("/");
});

test("home is compact, no default exercise, consistent tabs and useful settings", async ({
  page,
}) => {
  await expect(page.getByRole("button", { name: /^Preparar/ })).toHaveCount(0);
  await expect(page.locator(".detail-preview, .home-preparation, .exercise-row")).toHaveCount(0);
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

test("categories show all catalog entries, details reuse instructions and preserve selection", async ({
  page,
}) => {
  await expect(page.locator(".workout-group-tile")).toHaveCount(4);
  const seen: string[] = [];
  for (const section of EXERCISE_SECTIONS) {
    await openExerciseGroup(page, section.exercises[0]!.id);
    await expect(page.locator(".exercise-row strong")).toHaveText(
      section.exercises.map((item) => item.name),
    );
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
      await expect(page.locator('.exercise-row[data-selected="true"] strong')).toHaveText(
        exercise.name,
      );
      await expect(page.locator('.exercise-row[data-selected="true"]')).toHaveAttribute(
        "aria-current",
        "true",
      );
      seen.push(exercise.id);
    }
  }
  expect(seen.sort()).toEqual(EXERCISES.map((item) => item.id).sort());
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

test("list scroll and selected exercise survive details and browser back/forward", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await openExerciseGroup(page, "wallsit");
  await page
    .getByRole("button", { name: /Agachamento isométrico na parede.*Ver detalhes/ })
    .scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  await selectExercise(page, "wallsit");
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Treino de Pernas", exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(before);
  await page.goForward();
  await expect(
    page.getByRole("heading", { name: /Agachamento isométrico na parede/ }),
  ).toBeVisible();
});

for (const [width, height] of [
  [360, 800],
  [390, 844],
  [430, 932],
  [360, 640],
  [844, 390],
  [1440, 900],
])
  test(`home, list, details and settings fit ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width: width!, height: height! });
    const fit = async () =>
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    await fit();
    await selectExercise(page, "mountainclimber");
    await fit();
    const button = page.getByRole("button", { name: /^Preparar/ });
    await button.scrollIntoViewIfNeeded();
    const box = await button.boundingBox(),
      nav = await page.locator(".app-bottom-nav").boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(nav!.y);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect
      .poll(() =>
        page.locator(".detail-preview img").evaluate((img: HTMLImageElement) => img.currentSrc),
      )
      .toContain("still.webp");
    await page.getByRole("button", { name: "Ajustes", exact: true }).click();
    await fit();
    await page.addStyleTag({ content: "html { font-size: 24px !important; }" });
    await fit();
  });
