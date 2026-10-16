import { createInstance, type FormatterModule } from "i18next";
import { initReactI18next } from "react-i18next";
import { isLanguage, type Language } from "./languages";
import en from "../../locales/en/translation.json" with { type: "json" };
import pt from "../../locales/pt-BR/translation.json" with { type: "json" };
import es from "../../locales/es/translation.json" with { type: "json" };
import fr from "../../locales/fr/translation.json" with { type: "json" };
import de from "../../locales/de/translation.json" with { type: "json" };
import it from "../../locales/it/translation.json" with { type: "json" };
import ja from "../../locales/ja/translation.json" with { type: "json" };
import zh from "../../locales/zh-CN/translation.json" with { type: "json" };
import ko from "../../locales/ko/translation.json" with { type: "json" };
import hi from "../../locales/hi/translation.json" with { type: "json" };
import ar from "../../locales/ar/translation.json" with { type: "json" };

export const dictionaries = { en, "pt-BR": pt, es, fr, de, it, ja, "zh-CN": zh, ko, hi, ar };
export function createTorvikI18n(language: Language = "en") {
  const instance = createInstance();
  const formatter: FormatterModule = {
    type: "formatter",
    init() {},
    add() {},
    addCached() {},
    format: (value: unknown, _format, lng) =>
      typeof value === "number" ? new Intl.NumberFormat(lng).format(value) : String(value ?? ""),
  };
  void instance
    .use(formatter)
    .use(initReactI18next)
    .init({
      lng: language,
      fallbackLng: "en",
      supportedLngs: Object.keys(dictionaries),
      resources: Object.fromEntries(
        Object.entries(dictionaries).map(([code, translation]) => [
          code,
          { translation: { ...translation } },
        ]),
      ),
      keySeparator: false,
      nsSeparator: false,
      initAsync: false,
      interpolation: { escapeValue: false, alwaysFormat: true },
      returnEmptyString: false,
      react: { useSuspense: false },
    });
  return instance;
}
// Server rendering only reads the English default. Preference changes are browser-only.
export const i18n = createTorvikI18n();
export function currentLanguage(): Language {
  return isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : "en";
}
/** Natural-language keys also resolve legacy feedback IDs without migrating stored reports. */
export const translate = (key: string, values: Record<string, unknown> = {}): string =>
  i18n.t(key.replace(/\s+/g, " ").trim(), values);
/** Written text may fall back; speech must never silently switch to a different language. */
export const translateVoice = (key: string, values: Record<string, unknown> = {}): string =>
  Object.hasOwn(dictionaries[currentLanguage()], key) ? translate(key, values) : "";
export const formatNumber = (value: number, options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat(currentLanguage(), options).format(value);
export const formatList = (values: string[]) =>
  new Intl.ListFormat(currentLanguage()).format(values);
export function formatDuration(seconds: number) {
  const parts: string[] = [];
  for (const [unit, value] of [
    ["hour", Math.floor(seconds / 3600)],
    ["minute", Math.floor((seconds % 3600) / 60)],
    ["second", Math.floor(seconds % 60)],
  ] as const) {
    if (value || (unit === "second" && !parts.length))
      parts.push(formatNumber(value, { style: "unit", unit, unitDisplay: "short" }));
  }
  return parts.join(" ");
}
