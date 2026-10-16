export const LANGUAGES = [
  { code: "pt-BR", name: "Português (Brasil)", speech: "pt-BR" },
  { code: "en", name: "English", speech: "en-US" },
  { code: "es", name: "Español", speech: "es-ES" },
  { code: "fr", name: "Français", speech: "fr-FR" },
  { code: "de", name: "Deutsch", speech: "de-DE" },
  { code: "it", name: "Italiano", speech: "it-IT" },
  { code: "ja", name: "日本語", speech: "ja-JP" },
  { code: "zh-CN", name: "简体中文", speech: "zh-CN" },
  { code: "ko", name: "한국어", speech: "ko-KR" },
  { code: "hi", name: "हिन्दी", speech: "hi-IN" },
  { code: "ar", name: "العربية", speech: "ar-SA" },
] as const;
export type Language = (typeof LANGUAGES)[number]["code"];
export type LanguagePreference = Language | "auto";
export const LANGUAGE_STORAGE_KEY = "torvik.language.v1";
export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.some(({ code }) => code === value);
}
export function matchLanguage(value: string): Language | undefined {
  try {
    const base = new Intl.Locale(value.replaceAll("_", "-")).language;
    return LANGUAGES.find(({ code }) => code.split("-")[0] === base)?.code;
  } catch {
    return undefined;
  }
}
export function detectLanguage(languages: readonly string[] = [], language?: string): Language {
  for (const candidate of [...languages, ...(language ? [language] : [])]) {
    const match = matchLanguage(candidate);
    if (match) return match;
  }
  return "en";
}
export function readLanguagePreference(storage?: Pick<Storage, "getItem">): LanguagePreference {
  try {
    const value = storage?.getItem(LANGUAGE_STORAGE_KEY);
    return isLanguage(value) ? value : "auto";
  } catch {
    return "auto";
  }
}
export function speechLanguage(language: Language) {
  return LANGUAGES.find(({ code }) => code === language)!.speech;
}
/** A future Capacitor shell can provide Device.getLanguageTag without adding a native dependency. */
export type NativeLanguageReader = () => Promise<{ value: string }>;
export async function deviceLanguage(native?: NativeLanguageReader): Promise<Language> {
  if (native) {
    try {
      const match = matchLanguage((await native()).value);
      if (match) return match;
    } catch {
      /* Fall back to the webview's language list. */
    }
  }
  return typeof navigator === "undefined"
    ? "en"
    : detectLanguage(navigator.languages, navigator.language);
}
