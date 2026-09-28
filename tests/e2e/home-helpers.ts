import { expect, type Page } from "@playwright/test";

export async function openExerciseGroup(page: Page, id: string) {
  const group = page
    .locator(".workout-group")
    .filter({ has: page.locator(`input[value="${id}"]`) });
  const dialog = group.locator("dialog");
  if ((await dialog.getAttribute("open")) !== null) return;
  const current = page.locator(".workout-category-dialog[open]");
  if (await current.count()) {
    await current.getByRole("button", { name: "Voltar às categorias" }).click();
    await expect(current).toHaveCount(0);
  }
  await group.locator(".workout-group-tile").click();
  await expect(dialog).toBeVisible();
}
