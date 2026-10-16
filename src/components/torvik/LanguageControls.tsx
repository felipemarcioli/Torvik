import { useId } from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGES, type LanguagePreference } from "@/lib/i18n/languages";
import { useLanguagePreference } from "@/lib/i18n/provider";

export function LanguageControls() {
  const { t } = useTranslation();
  const { preference, setPreference, language } = useLanguagePreference();
  const id = useId();
  return (
    <section className="language-controls settings-voice">
      <label htmlFor={id} className="settings-section-title">
        {t("Idioma")}
      </label>
      <select
        id={id}
        className="torvik-control"
        value={preference}
        onChange={(event) => setPreference(event.target.value as LanguagePreference)}
      >
        <option value="auto">{t("Automático")}</option>
        {LANGUAGES.map(({ code, name }) => (
          <option key={code} value={code} lang={code} dir={code === "ar" ? "rtl" : "ltr"}>
            {name}
          </option>
        ))}
      </select>
      <p className="mt-2 text-sm text-muted-foreground" role="status">
        {t("Idioma atual: {{language}}", {
          language: LANGUAGES.find(({ code }) => code === language)!.name,
        })}
      </p>
    </section>
  );
}
