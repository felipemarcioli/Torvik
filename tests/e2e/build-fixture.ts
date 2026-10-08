import { test as base, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";

// Optional production-build validation for environments where binding a server is blocked.
// The browser receives the real SSR response and public assets through Playwright routing.
export const test = base.extend({
  page: async ({ page }, providePage) => {
    if (process.env["TORVIK_BUILD_VALIDATION"] === "1") {
      const entry = resolve(".output/server/index.mjs");
      const { default: app } = await import(entry);
      const mime: Record<string, string> = {
        ".js": "text/javascript",
        ".css": "text/css",
        ".webp": "image/webp",
        ".png": "image/png",
        ".svg": "image/svg+xml",
        ".json": "application/json",
      };
      await page.route("http://127.0.0.1:4173/**", async (route) => {
        const pathname = new URL(route.request().url()).pathname;
        if (pathname !== "/") {
          try {
            const body = await readFile(resolve(".output/public", `.${pathname}`));
            await route.fulfill({
              body,
              contentType: mime[extname(pathname)] ?? "application/octet-stream",
            });
          } catch {
            await route.fulfill({ status: 404 });
          }
          return;
        }
        const response: Response = await app.fetch(
          new Request(route.request().url()),
          {},
          { waitUntil() {} },
        );
        await route.fulfill({
          status: response.status,
          headers: Object.fromEntries(response.headers),
          body: await response.text(),
        });
      });
    }
    await providePage(page);
  },
});
export { expect };
