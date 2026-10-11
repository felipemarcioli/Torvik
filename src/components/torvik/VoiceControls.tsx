import type { WorkoutVoiceControls } from "@/hooks/use-workout-voice";
const statusText = {
  unavailable:
    "Voz local em português indisponível neste navegador. O treino continua normalmente.",
  "needs-activation": "Toque em Ativar voz para ouvir as orientações.",
  blocked: "Não foi possível reproduzir o áudio. Toque em Ativar voz para tentar novamente.",
  ready: "Voz local em português pronta.",
};
export function VoiceControls({
  voice,
  expanded = false,
}: {
  voice: WorkoutVoiceControls;
  expanded?: boolean;
}) {
  const { settings, update, status, activate } = voice;
  return (
    <details open={expanded || undefined} className="voice-controls">
      <summary className="cursor-pointer px-3 py-2 font-semibold focus-visible:outline-2 focus-visible:outline-primary">
        {settings.enabled ? "Voz ligada" : "Voz desligada"}
        {settings.enabled && status !== "ready" && (
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {status === "unavailable" ? "Indisponível" : "Ativar áudio"}
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
          Feedback por voz
        </label>
        <label className="flex items-center justify-between gap-3">
          Modo de voz
          <select
            className="torvik-control min-w-0"
            value={settings.mode}
            onChange={(e) => update({ mode: e.target.value === "basic" ? "basic" : "full" })}
          >
            <option value="basic">Básico</option>
            <option value="full">Completo</option>
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-3">
          Volume{" "}
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.volume}
            onChange={(e) => update({ volume: Number(e.target.value) })}
            className="min-w-0 flex-1 accent-primary"
          />
          <span className="w-10 tabular-nums">{Math.round(settings.volume * 100)}%</span>
        </label>
        <div className="sm:col-span-2">
          {settings.enabled && (
            <p role="status" className="text-xs text-muted-foreground">
              {statusText[status]}
            </p>
          )}
          {settings.enabled && (status === "blocked" || status === "needs-activation") && (
            <button type="button" className="torvik-secondary mt-2" onClick={activate}>
              Ativar voz
            </button>
          )}
        </div>
      </div>
    </details>
  );
}
