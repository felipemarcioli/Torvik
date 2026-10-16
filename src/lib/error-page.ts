import { dictionaries } from "./i18n";
import { isLanguage, type Language } from "./i18n/languages";

/** No shared language state: simultaneous server errors cannot leak another request's locale. */
export function renderErrorPage(language: Language = "en"): string {
  const locale = isLanguage(language) ? language : "en";
  const text = (key: keyof typeof dictionaries.en) =>
    String((dictionaries[locale] as Record<string, string>)[key] || dictionaries.en[key]).replace(
      /[&<>"']/g,
      (character) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!,
    );
  return `<!doctype html>
<html lang="${locale}" dir="${locale === "ar" ? "rtl" : "ltr"}">
  <head>
    <meta charset="utf-8" />
    <title>${text("Não foi possível carregar a página")}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content" />
    <style>
      * { box-sizing: border-box; }
      body { font: 16px/1.5 system-ui, -apple-system, sans-serif; background: #0c1727; color: #f4f5f7; display: grid; place-items: center; min-height: 100vh; min-height: 100dvh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 1.5rem; border: 1px solid #293b50; border-radius: 1.5rem; background: #142338; }
      .brand { color: #ff914d; font-size: .875rem; font-weight: 700; letter-spacing: .1em; margin-bottom: 1.5rem; }
      h1 { font-size: 1.5rem; line-height: 1.2; letter-spacing: -.03em; margin: 0 0 .75rem; overflow-wrap: anywhere; }
      p { color: #acbbcc; font-size: .875rem; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: .75rem; justify-content: center; flex-wrap: wrap; }
      a, button { min-height: 52px; padding: .75rem 1rem; border-radius: 1rem; font: inherit; font-weight: 600; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      a:focus-visible, button:focus-visible { outline: 3px solid #90c5eb; outline-offset: 4px; }
      .primary { background: #ff914d; color: #152033; }
      .secondary { background: #1d3046; color: #f4f5f7; border-color: #293b50; }
    </style>
  </head>
  <body>
    <main class="card">
      <p class="brand">TORVIK</p>
      <h1>${text("Não foi possível carregar a página")}</h1>
      <p>${text("Ocorreu um problema. Tente novamente ou volte ao início.")}</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">${text("Tentar novamente")}</button>
        <a class="secondary" href="/">${text("Voltar ao início")}</a>
      </div>
    </main>
  </body>
</html>`;
}
