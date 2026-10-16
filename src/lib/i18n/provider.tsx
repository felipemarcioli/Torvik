import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { i18n, currentLanguage } from "./index";
import {
  deviceLanguage,
  isLanguage,
  LANGUAGE_STORAGE_KEY,
  readLanguagePreference,
  type LanguagePreference,
  type NativeLanguageReader,
} from "./languages";

const PreferenceContext = createContext({
  preference: "auto" as LanguagePreference,
  setPreference: (_: LanguagePreference) => {},
});
export function LocaleProvider({
  children,
  nativeLanguage,
}: {
  children: ReactNode;
  nativeLanguage?: NativeLanguageReader;
}) {
  const [preference, setPreferenceState] = useState<LanguagePreference>("auto");
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    let disposed = false;
    let revision = 0;
    let selected: LanguagePreference = "auto";
    try {
      selected = readLanguagePreference(localStorage);
    } catch {
      /* Memory-only preferences. */
    }
    const apply = async () => {
      const attempt = ++revision;
      const language = selected === "auto" ? await deviceLanguage(nativeLanguage) : selected;
      if (disposed || attempt !== revision) return;
      await i18n.changeLanguage(language);
      if (disposed || attempt !== revision) return;
      setPreferenceState(selected);
      setInitialized(true);
    };
    const automatic = () => {
      if (selected === "auto") void apply();
    };
    const change = (event: Event) => {
      selected = (event as CustomEvent<LanguagePreference>).detail;
      void apply();
    };
    const storage = (event: StorageEvent) => {
      if (event.key !== LANGUAGE_STORAGE_KEY && event.key !== null) return;
      selected = isLanguage(event.newValue) ? event.newValue : "auto";
      void apply();
    };
    window.addEventListener("languagechange", automatic);
    window.addEventListener("torvik:language", change);
    window.addEventListener("storage", storage);
    void apply();
    return () => {
      disposed = true;
      window.removeEventListener("languagechange", automatic);
      window.removeEventListener("torvik:language", change);
      window.removeEventListener("storage", storage);
    };
  }, [nativeLanguage]);
  function setPreference(next: LanguagePreference) {
    if (next !== "auto" && !isLanguage(next)) return;
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    } catch {
      /* Memory-only preferences. */
    }
    setPreferenceState(next);
    window.dispatchEvent(new CustomEvent("torvik:language", { detail: next }));
  }
  return (
    <I18nextProvider i18n={i18n}>
      <PreferenceContext.Provider value={{ preference, setPreference }}>
        {/* Keep the SSR shell stable until browser preferences resolve. Lazy routes can
            hydrate after parent effects, so translating an SSR subtree here would race hydration. */}
        {initialized ? (
          children
        ) : (
          <div className="loading-state" role="status">
            Torvik
          </div>
        )}
      </PreferenceContext.Provider>
    </I18nextProvider>
  );
}
export const useLanguagePreference = () => ({
  ...useContext(PreferenceContext),
  language: currentLanguage(),
});
