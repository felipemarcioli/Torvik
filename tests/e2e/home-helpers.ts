import { expect, type Page } from "@playwright/test";
import { EXERCISE_SECTIONS } from "../../src/components/torvik/data";
import { EXERCISE_BY_ID, type ExerciseId } from "../../src/lib/exercises/catalog";

export async function openExerciseGroup(page: Page, id: string) {
  const section = EXERCISE_SECTIONS.find((item) =>
    item.exercises.some((exercise) => exercise.id === id),
  )!;
  if (await page.locator(".exercise-detail").count()) {
    await page.getByRole("button", { name: "Voltar", exact: true }).click();
    await expect(page.locator(".exercise-detail")).toHaveCount(0);
  }
  const dialog = page.locator("dialog[open]");
  if (await dialog.getByRole("heading", { name: section.title, exact: true }).count()) return;
  if (await dialog.count()) {
    await dialog.getByRole("button", { name: "Voltar às categorias" }).click();
    await expect(dialog).toHaveCount(0);
  }
  await page.getByRole("button", { name: new RegExp(section.title) }).click();
  await expect(dialog.getByRole("heading", { name: section.title, exact: true })).toBeVisible();
}
export async function selectInCategory(page: Page, id: ExerciseId) {
  await openExerciseGroup(page, id);
  const card = page
    .locator("dialog[open] .exercise-card")
    .filter({ has: page.locator(`input[value="${id}"]`) });
  const radio = card.locator("input:visible");
  await radio.check();
  // On phones, selecting also expands the existing sprite preview.
  if (
    (await card.locator(".mobile-exercise-select:visible").count()) &&
    (await card.getAttribute("data-preview-open")) !== "true"
  ) {
    await card.locator(".mobile-exercise-select").click();
  }
  await expect(radio).toBeChecked();
  return card;
}
export async function selectExercise(page: Page, id: ExerciseId) {
  const card = await selectInCategory(page, id);
  await card
    .getByRole("button", {
      name: `Ver detalhes de ${EXERCISE_BY_ID[id].name.toLocaleLowerCase("pt-BR")}`,
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: EXERCISE_BY_ID[id].name, exact: true }),
  ).toBeVisible();
}
export const prepareExercise = (page: Page) =>
  page.getByRole("button", { name: /^Preparar / }).click();
export async function finishWorkout(page: Page) {
  const pause = page.getByRole("button", { name: "Pausar", exact: true });
  const finish = page.getByRole("button", { name: "Finalizar treino", exact: true });
  await expect(
    pause.or(finish).or(page.getByRole("button", { name: "Iniciar em 5 segundos", exact: true })),
  ).toBeVisible();
  if (await pause.count()) await pause.click();
  if (!(await finish.count()))
    await page.getByRole("button", { name: "Controles de câmera e voz" }).click();
  await finish.click();
}
export async function changeSide(page: Page, name: "Esquerdo" | "Direito") {
  await page.getByRole("button", { name: "Controles de câmera e voz" }).click();
  await page.getByRole("button", { name, exact: true }).click();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
}
