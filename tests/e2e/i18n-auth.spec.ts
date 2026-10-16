import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { createTorvikI18n } from "../../src/lib/i18n";
import { LANGUAGES } from "../../src/lib/i18n/languages";

test.skip(process.env["TORVIK_AUTH_TEST"] !== "1", "Requires the dedicated mock Auth environment.");

async function capture(page: Page, info: TestInfo, screen: string) {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
    .toBe(true);
  const outside = await page.locator("button:visible, input:visible").evaluateAll((elements) =>
    elements
      .filter((element) => {
        const box = element.getBoundingClientRect();
        return box.left < -1 || box.right > innerWidth + 1;
      })
      .map((element) => element.id || element.textContent),
  );
  expect(outside).toEqual([]);
  await page.screenshot({
    path: info.outputPath(`${screen}.png`),
    fullPage: true,
    animations: "disabled",
  });
}

for (const { code } of LANGUAGES)
  test.describe(`auth ${code}`, () => {
    test.use({ locale: code });
    test("login error, registration and recovery use the selected locale", async ({
      page,
    }, info) => {
      const local = createTorvikI18n(code);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
      await page.route("https://torvik-auth-test.supabase.co/auth/v1/**", (route) =>
        route.fulfill({
          status: 400,
          headers: {
            "X-Supabase-Api-Version": "2024-01-01",
            "Access-Control-Expose-Headers": "X-Supabase-Api-Version",
          },
          json: { code: "invalid_credentials", msg: "Invalid login credentials" },
        }),
      );
      await page.goto("/");
      await expect(page.locator("#auth-heading")).toHaveText(local.t("Bom ter você de volta"), {
        timeout: 20000,
      });
      await expect(page.locator("html")).toHaveAttribute("lang", code);
      await expect(page.locator("html")).toHaveAttribute("dir", code === "ar" ? "rtl" : "ltr");
      await page.locator("#auth-email").fill("test@example.com");
      await page.locator("#auth-password").fill("test-password");
      await page.locator('button[type="submit"]').click();
      await expect(page.getByRole("alert")).toHaveText(local.t("E-mail ou senha incorretos."));
      await capture(page, info, "login-error");
      await page.locator(".auth-switch").click();
      await expect(page.locator("#auth-heading")).toHaveText(local.t("Comece sua jornada"));
      await expect(page.locator("#auth-confirmation")).toBeVisible();
      await capture(page, info, "registration");
      await page.locator(".auth-switch").click();
      await page.getByRole("button", { name: local.t("Esqueci minha senha"), exact: true }).click();
      await expect(page.locator("#auth-heading")).toHaveText(local.t("Recupere sua senha"));
      await capture(page, info, "recovery");
      expect(errors).toEqual([]);
    });
  });
