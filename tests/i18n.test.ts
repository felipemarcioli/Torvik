import { afterEach, describe, expect, test } from "bun:test";
import {
  createTorvikI18n,
  dictionaries,
  i18n,
  formatNumber,
  formatDuration,
  translateVoice,
} from "../src/lib/i18n";
import {
  LANGUAGES,
  detectLanguage,
  type Language,
  readLanguagePreference,
  deviceLanguage,
} from "../src/lib/i18n/languages";
import { validateTranslations } from "../src/lib/i18n/validation";
import { requiredTranslationKeys } from "../scripts/translation-source";
const sourceKeys = requiredTranslationKeys();

afterEach(async () => {
  await i18n.changeLanguage("pt-BR");
});
test("device language variants, ordered preferences, invalid tags and English fallback", () => {
  for (const [value, expected] of [
    ["pt-PT", "pt-BR"],
    ["en-GB", "en"],
    ["es-MX", "es"],
    ["fr-CA", "fr"],
    ["zh-Hans-SG", "zh-CN"],
    ["AR_eg", "ar"],
  ])
    expect(detectLanguage([value!])).toBe(expected as Language);
  expect(detectLanguage(["invalid_?", "nl-NL", "de-AT"], "es")).toBe("de");
  expect(detectLanguage([], "ja-JP")).toBe("ja");
  expect(detectLanguage(["nl-NL"])).toBe("en");
});
test("manual preference storage rejects invalid values and tolerates denied storage", () => {
  for (const { code } of LANGUAGES)
    expect(readLanguagePreference({ getItem: () => code })).toBe(code);
  expect(readLanguagePreference({ getItem: () => "unsupported" })).toBe("auto");
  expect(
    readLanguagePreference({
      getItem: () => {
        throw new Error("denied");
      },
    }),
  ).toBe("auto");
  expect(readLanguagePreference()).toBe("auto");
});
test("optional native language adapter resolves standardized language", async () => {
  expect(await deviceLanguage(async () => ({ value: "ko-KR" }))).toBe("ko");
  expect(
    await deviceLanguage(async () => {
      throw new Error("unavailable");
    }),
  ).toBe("en");
});
test("validator detects missing keys, blanks, missing variables, encoding and extra keys", () => {
  const result = validateTranslations(
    { a: "{{count}} items", b: "Text", c: "Text", d: "Text" },
    { a: "{{wrong}} items", b: " ", c: "\uFFFD", extra: "x" },
  );
  expect(result).toEqual({
    missing: ["d"],
    extra: ["extra"],
    empty: ["b"],
    interpolation: ["a"],
    encoding: ["c"],
  });
});
describe("11 language technical integrity and dynamic text", () => {
  for (const { code } of LANGUAGES)
    test(code, async () => {
      const result = validateTranslations(dictionaries["pt-BR"], dictionaries[code]);
      expect(result.missing).toEqual([]);
      expect(result.extra).toEqual([]);
      expect(sourceKeys.filter((key) => !Object.hasOwn(dictionaries[code], key))).toEqual([]);
      expect(result.empty).toEqual([]);
      expect(result.interpolation).toEqual([]);
      expect(result.encoding).toEqual([]);
      await i18n.changeLanguage(code);
      expect(formatNumber(1234.5)).toBe(new Intl.NumberFormat(code).format(1234.5));
      expect(formatDuration(25 * 60)).toBe(
        new Intl.NumberFormat(code, { style: "unit", unit: "minute", unitDisplay: "short" }).format(
          25,
        ),
      );
      const instance = createTorvikI18n(code);
      expect(instance.t("Idioma atual: {{language}}", { language: "TEST" })).toContain("TEST");
      expect(instance.t("{{count}} repetições!", { count: 10 })).not.toContain("{{");
    });
});
test("written text falls back to English and missing voice text stays silent", async () => {
  const isolated = createTorvikI18n("ja");
  isolated.addResource("en", "translation", "fallback.probe", "English fallback");
  expect(isolated.t("fallback.probe")).toBe("English fallback");
  await i18n.changeLanguage("ja");
  expect(translateVoice("unknown.voice.key")).toBe("");
});
