import { test, expect } from "./build-fixture";
import { createTorvikI18n } from "../../src/lib/i18n";
import { LANGUAGES } from "../../src/lib/i18n/languages";

// Synthetic camera/estimator: checks UI and lifecycle, not real movement recognition.
for (const { code } of LANGUAGES) {
  test.describe(`workout ${code}`, () => {
    test.use({ locale: code });
    test("translated preparation and live language controls preserve the camera", async ({
      page,
    }, info) => {
      const local = createTorvikI18n(code);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
      await page.route("https://cdn.jsdelivr.net/npm/@mediapipe/pose@*/pose.js", (route) =>
        route.fulfill({
          contentType: "text/javascript",
          body: `window.Pose = class {
          setOptions() {} onResults(callback) { this.callback = callback; }
          async close() {} async send() { this.callback({poseLandmarks: []}); }
        };`,
        }),
      );
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("lang", code, { timeout: 20000 });
      await page.locator("#exercise-category-legs").click();
      const card = page
        .locator("dialog[open] .exercise-card")
        .filter({ has: page.locator('input[value="squat"]') });
      await card.locator("input:visible").check();
      await card.locator(".exercise-details-button:visible").click();
      await page.locator(".detail-start").click();
      await expect(
        page.getByRole("heading", { name: local.t("Vamos encontrar sua posição"), exact: true }),
      ).toBeVisible();
      await expect
        .poll(() =>
          page.locator("video").evaluate((video) => (video as HTMLVideoElement).currentTime),
        )
        .toBeGreaterThan(0);
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
        .toBe(true);
      await page.screenshot({
        path: info.outputPath("preparation.png"),
        fullPage: true,
        animations: "disabled",
      });
      const trackId = await page
        .locator("video")
        .evaluate(
          (video) => ((video as HTMLVideoElement).srcObject as MediaStream).getVideoTracks()[0]!.id,
        );
      await page.getByRole("button", { name: local.t("Controles de câmera e voz") }).click();
      const panel = page.getByRole("dialog");
      const language = panel.locator(".language-controls select");
      await expect(language).toHaveValue("auto");
      await page.screenshot({
        path: info.outputPath("workout-controls.png"),
        fullPage: true,
        animations: "disabled",
      });
      await panel.locator('.voice-controls input[type="checkbox"]').uncheck();
      await language.selectOption(code === "ar" ? "en" : "ar");
      const changed = createTorvikI18n(code === "ar" ? "en" : "ar");
      await expect(page.locator("html")).toHaveAttribute("dir", code === "ar" ? "ltr" : "rtl");
      await expect(panel.getByRole("heading")).toHaveText(changed.t("Câmera e voz"));
      await expect(panel.locator('.voice-controls input[type="checkbox"]')).not.toBeChecked();
      await language.selectOption("auto");
      await expect(page.locator("html")).toHaveAttribute("lang", code);
      await expect(panel.getByRole("heading")).toHaveText(local.t("Câmera e voz"));
      await panel.getByRole("button", { name: local.t("Fechar"), exact: true }).click();
      await expect(
        page.getByRole("heading", { name: local.t("Vamos encontrar sua posição"), exact: true }),
      ).toBeVisible();
      const track = await page.locator("video").evaluate((video) => {
        const track = ((video as HTMLVideoElement).srcObject as MediaStream).getVideoTracks()[0]!;
        return { id: track.id, state: track.readyState };
      });
      expect(track).toEqual({ id: trackId, state: "live" });
      expect(errors).toEqual([]);
    });
  });
}
