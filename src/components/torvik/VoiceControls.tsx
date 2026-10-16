import { useTranslation } from "react-i18next";
import { translate as t, formatNumber } from "@/lib/i18n";
import { LanguageControls } from "./LanguageControls";
import type { WorkoutVoiceControls } from "@/hooks/use-workout-voice";
const statusText = {
  unavailable: "Nenhuma voz compatível disponível. As instruções escritas continuam disponíveis.",
  "needs-activation": "Toque em Ativar voz para ouvir as orientações.",
  blocked: "Não foi possível reproduzir o áudio. Toque em Ativar voz para tentar novamente.",
  ready: "Voz disponível para o idioma selecionado.",
};
export function VoiceControls({
  voice,
  expanded = false,
  showLanguage = true,
}: {
  voice: WorkoutVoiceControls;
  expanded?: boolean;
  showLanguage?: boolean;
}) {
  useTranslation();

  const { settings, update, status, activate } = voice;
  return (
    <details open={expanded || undefined} className="voice-controls">
      <summary className="cursor-pointer px-3 py-2 font-semibold focus-visible:outline-2 focus-visible:outline-primary">
        {settings.enabled ? t("Voz ligada") : t("Voz desligada")}
        {settings.enabled && status !== "ready" && (
          <span className="ms-2 text-xs font-normal text-muted-foreground">
            {status === "unavailable" ? t("Indisponível") : t("Ativar áudio")}
          </span>
        )}
      </summary>
      <div className="grid gap-3 border-t border-border p-3 sm:grid-cols-2">
        <label className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            className="size-5 accent-primary"
            checked={settings.enabled}
            onChange={(e) => update({ enabled: e.target.checked })}
          />
          {t("Feedback por voz")}
        </label>
        <label className="voice-mode">
          {t("Modo de voz")}
          <select
            className="torvik-control min-w-0"
            value={settings.mode}
            onChange={(e) => update({ mode: e.target.value === "basic" ? "basic" : "full" })}
          >
            <option value="basic">{t("Básico")}</option>
            <option value="full">{t("Completo")}</option>
          </select>
        </label>
        <label className="voice-volume">
          <span>{t("Volume")}</span>
          <span className="tabular-nums">
            {formatNumber(settings.volume, { style: "percent" })}
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.volume}
            onChange={(e) => update({ volume: Number(e.target.value) })}
            className="min-w-0 flex-1 accent-primary"
          />
        </label>
        <div className="sm:col-span-2">
          {settings.enabled && (
            <p role="status" className="text-xs text-muted-foreground">
              {t(statusText[status])}
            </p>
          )}
          {settings.enabled && (status === "blocked" || status === "needs-activation") && (
            <button type="button" className="torvik-secondary mt-2" onClick={activate}>
              {t("Ativar voz")}
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground sm:col-span-2">
          {t("Algumas vozes dependem de conexão à internet.")}
        </p>
        {showLanguage && (
          <div className="sm:col-span-2">
            <LanguageControls />
          </div>
        )}
      </div>
    </details>
  );
}
