import { test, expect } from "./build-fixture";
import type { Page, TestInfo } from "@playwright/test";
import { dictionaries, createTorvikI18n } from "../../src/lib/i18n";
import { LANGUAGES } from "../../src/lib/i18n/languages";

async function screenshotAndLayout(page: Page, info: TestInfo, name: string) {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
    .toBe(true);
  const outside = await page
    .locator(
      "main button:visible, main select:visible, nav button:visible, dialog[open] button:visible",
    )
    .evaluateAll((elements) =>
      elements
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1);
        })
        .map((element) => element.textContent),
    );
  expect(outside).toEqual([]);
  await page.screenshot({
    path: info.outputPath(`${name}.png`),
    fullPage: true,
    animations: "disabled",
  });
}

for (const { code } of LANGUAGES)
  test.describe(code, () => {
    test.use({ locale: code });
    test("automatic locale, main screens, persisted selection and RTL", async ({ page }, info) => {
      const local = createTorvikI18n(code);
      const t = (key: string) => local.t(key);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("lang", code, { timeout: 20000 });
      await expect(page.locator("html")).toHaveAttribute("dir", code === "ar" ? "rtl" : "ltr");
      await screenshotAndLayout(page, info, "home");
      await page.locator("#exercise-category-legs").click();
      const dialog = page.locator("dialog[open]");
      await expect(dialog).toBeVisible();
      await screenshotAndLayout(page, info, "exercises");
      const card = dialog
        .locator(".exercise-card")
        .filter({ has: page.locator('input[value="squat"]') });
      await card.locator("input:visible").check();
      await card.locator(".exercise-details-button:visible").click();
      await expect(page.locator(".exercise-detail h1")).toHaveText(t("Agachamento"));
      await screenshotAndLayout(page, info, "exercise-detail");
      await page.getByRole("button", { name: t("Ajustes"), exact: true }).click();
      const languages = page.locator(".language-controls select");
      await expect(languages).toHaveValue("auto");
      await expect(languages.locator("option")).toHaveCount(12);
      await screenshotAndLayout(page, info, "settings");
      const enabled = page.locator('.voice-controls input[type="checkbox"]');
      await enabled.uncheck();
      await languages.selectOption("ar");
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      await languages.selectOption("en");
      await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
      await expect(enabled).not.toBeChecked();
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await page.getByRole("button", { name: dictionaries.en["Ajustes"], exact: true }).click();
      await expect(languages).toHaveValue("en");
      await expect(enabled).not.toBeChecked();
      await languages.selectOption("auto");
      await expect(page.locator("html")).toHaveAttribute("lang", code);
      await page.evaluate(async () => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open("torvik-history", 1);
          request.onupgradeneeded = () =>
            request.result.createObjectStore("sessions", { keyPath: "id" });
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        await new Promise<void>((resolve, reject) => {
          const transaction = db.transaction("sessions", "readwrite");
          transaction.objectStore("sessions").put({
            schemaVersion: 1,
            id: "i18n-fixture",
            exercise: "squat",
            createdAt: new Date().toISOString(),
            seconds: 1500,
            totalReps: 10,
            correctReps: 8,
            feedbackCounts: { "Revise o alinhamento do corpo": 2 },
            interruptedCycles: 0,
            trackingLosses: 0,
            rulesVersion: "v1",
            engineVersion: "pose1",
          });
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        });
        db.close();
      });
      await page.getByRole("button", { name: t("Progresso"), exact: true }).click();
      await expect(page.locator(".progress-session-card")).toHaveCount(1);
      await screenshotAndLayout(page, info, "history");
      await page.locator("#session-i18n-fixture").click();
      await expect(page.locator("main h1")).toHaveText(t("Agachamento"));
      await screenshotAndLayout(page, info, "report");
      expect(errors).toEqual([]);
    });
  });

test("unsupported device falls back to English; manual locale survives device language changes", async ({
  page,
}) => {
  await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "languages", { configurable: true, value: ["nl-NL"] });
    Object.defineProperty(navigator, "language", { configurable: true, value: "nl-NL" });
  });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("button", { name: dictionaries.en["Ajustes"], exact: true }).click();
  await page.locator(".language-controls select").selectOption("ja");
  await page.evaluate(() => {
    Object.defineProperty(navigator, "languages", { configurable: true, value: ["es-MX"] });
    dispatchEvent(new Event("languagechange"));
  });
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await page.locator(".language-controls select").selectOption("auto");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
});
