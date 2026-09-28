import type { Page } from "@playwright/test";

export async function openExerciseGroup(page: Page, id: string) {
  const group = page
    .locator(".workout-group")
    .filter({ has: page.locator(`input[value="${id}"]`) });
  const toggle = group.locator(".workout-group-toggle");
  if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
}
