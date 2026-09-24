import { VoiceControls } from "./VoiceControls";
import type { WorkoutVoiceControls } from "@/hooks/use-workout-voice";
import { useWorkout } from "@/hooks/use-workout";
import type { ExerciseId } from "@/lib/biomech";
import { formatTime, type SessionReport } from "@/lib/session";
import { EXERCISES } from "./data";
const stages = {
  model: "Baixando modelo de movimento…",
  camera: "Aguardando acesso à câmera…",
  video: "Preparando vídeo…",
  inference: "Preparando a primeira análise…",
};
const states: Record<string, string> = {
  positioning: "Posicionando",
  standing: "Em pé",
  high: "Prancha alta",
  descending: "Descendo",
  squat: "Agachado",
  low: "Embaixo",
  closed: "Fechado",
  opening: "Abrindo",
  open: "Aberto",
};
const styles = {
  good: "border-success/50 text-success",
  range: "border-caution/50 text-caution",
  posture: "border-accent/50 text-accent",
  warning: "border-border text-muted-foreground",
};
export function WorkoutScreen({
  exercise,
  voice,
  onFinish,
  onCancel,
}: {
  exercise: ExerciseId;
  voice: WorkoutVoiceControls;
  onFinish: (report: SessionReport) => void;
  onCancel: () => void;
}) {
  const w = useWorkout(exercise, voice.controller);
  const details = EXERCISES.find((e) => e.id === exercise)!;
  return (
    <main className="workout-layout bg-background" aria-label={`Treino de ${details.name}`}>
      <header className="workout-header flex items-center justify-between gap-4 border-b border-border bg-card px-4 py-2.5 sm:px-6">
        <div className="min-w-0">
          <p className="torvik-kicker text-[0.625rem]">Torvik · treino local</p>
          <h1 className="truncate text-lg font-bold leading-tight sm:text-xl">{details.name}</h1>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-muted-foreground">Tempo ativo</p>
          <p className="font-display text-xl font-bold tabular-nums sm:text-2xl">
            {formatTime(w.seconds)}
          </p>
        </div>
      </header>
      <section
        className="camera-region relative flex min-h-0 items-center justify-center overflow-hidden bg-black"
        aria-label="Prévia completa da câmera"
      >
        <video
          ref={w.videoRef}
          playsInline
          muted
          aria-label="Vídeo da câmera"
          className={`absolute inset-0 size-full object-contain ${w.mirrored ? "-scale-x-100" : ""}`}
        />
        <canvas
          ref={w.canvasRef}
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 size-full object-contain ${w.mirrored ? "-scale-x-100" : ""}`}
        />
        {w.phase === "countdown" && (
          <div
            role="status"
            className="workout-countdown absolute top-3 left-1/2 z-10 w-[min(18rem,calc(100%-2rem))] -translate-x-1/2 rounded-2xl border border-primary/60 bg-background/95 px-4 py-3 text-center shadow-xl backdrop-blur-md sm:top-5"
          >
            <p
              key={w.countdown}
              className="countdown-number font-display font-extrabold text-primary"
            >
              {w.countdown}
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {w.result.tracking
                ? "Prepare-se. O treino já vai começar."
                : "Posicione-se no quadro."}
            </p>
          </div>
        )}
        {w.phase === "loading" && (
          <div
            role="status"
            className="torvik-panel relative mx-4 max-w-sm p-6 text-center shadow-xl"
          >
            <span
              aria-hidden="true"
              className="mb-3 inline-block size-3 animate-pulse rounded-full bg-accent"
            />
            <h2 className="text-xl font-bold">Preparando a câmera</h2>
            <p className="mt-2 text-sm text-muted-foreground">{stages[w.stage]}</p>
          </div>
        )}
        {w.phase === "paused" && (
          <div className="torvik-panel relative mx-4 max-w-sm bg-card/95 p-6 text-center shadow-xl">
            <p className="torvik-kicker">Sessão em espera</p>
            <h2 className="mt-1 text-xl font-bold">Treino pausado</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Seu tempo e suas repetições estão preservados.
            </p>
          </div>
        )}
        {w.phase === "error" && (
          <div
            role="alert"
            className="torvik-panel relative mx-4 max-w-lg border-destructive/50 bg-card p-6 shadow-xl"
          >
            <p className="torvik-kicker text-destructive">Atenção</p>
            <h2 className="mt-1 text-xl font-bold">Não foi possível continuar</h2>
            <p className="mt-2 text-sm text-muted-foreground">{w.error}</p>
            <button type="button" className="torvik-primary mt-4" onClick={w.retry}>
              Tentar novamente
            </button>
          </div>
        )}
      </section>
      <section className="workout-controls border-t border-border bg-card px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6">
        {(w.phase === "running" || w.phase === "paused") && (
          <div className="workout-metrics mx-auto mb-3 flex max-w-3xl items-center justify-between gap-5 border-b border-border pb-3">
            <div className="flex items-baseline gap-3">
              <p className="font-display text-[clamp(3.5rem,12vw,4.5rem)] font-extrabold leading-none text-primary tabular-nums">
                {w.result.totalReps}
              </p>
              <p className="text-sm font-semibold text-muted-foreground">repetições</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-2xl font-bold text-success tabular-nums">
                {w.result.correctReps}
              </p>
              <p className="max-w-28 text-xs leading-tight text-muted-foreground">nos critérios</p>
            </div>
          </div>
        )}
        {w.phase === "preparing" && (
          <div className="workout-preparation mx-auto mb-3 max-w-3xl">
            <p className="torvik-kicker">Início automático</p>
            <h2 className="mt-1 text-lg font-bold leading-tight">
              Posicione-se na câmera para iniciar automaticamente
            </h2>
            <p className="mt-1 text-sm leading-snug text-muted-foreground">
              {details.instructions[0]}.{" "}
              {exercise === "jumpingjack"
                ? "Comece com braços baixos e pés juntos."
                : exercise === "squat"
                  ? "Comece em pé."
                  : "Comece na posição alta da flexão."}
            </p>
          </div>
        )}
        {w.phase !== "loading" && w.phase !== "error" && w.phase !== "paused" && (
          <div
            className={`workout-feedback mx-auto max-w-3xl rounded-xl border bg-background px-3 py-2 text-center transition-colors duration-200 ${styles[w.result.level]}`}
          >
            <p role="status" aria-live="polite" aria-atomic="true" className="font-semibold">
              {w.phase === "preparing" && w.result.tracking
                ? "Corpo detectado. Preparando o início automático…"
                : w.phase === "countdown"
                  ? "Mantenha os pontos do corpo visíveis. Não precisa ficar imóvel."
                  : w.result.message}
            </p>
            <p className="workout-feedback-detail text-xs text-muted-foreground">
              {states[w.result.state] ?? w.result.state}
              {w.result.side ? ` • lado ${w.result.side === "left" ? "esquerdo" : "direito"}` : ""}
            </p>
          </div>
        )}
        {w.devices.length > 1 &&
          (w.phase === "preparing" || w.phase === "paused" || w.phase === "error") && (
            <label className="mx-auto mt-3 flex max-w-3xl items-center gap-3 text-sm font-semibold">
              Câmera
              <select
                className="torvik-control min-w-0 flex-1 font-normal"
                value={w.deviceId}
                onChange={(e) => w.selectCamera(e.target.value)}
              >
                <option value="">Frontal / padrão</option>
                {w.devices.map((d, i) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Câmera ${i + 1}`}
                  </option>
                ))}
              </select>
            </label>
          )}
        <div className="workout-actions mx-auto mt-3 flex max-w-3xl flex-wrap gap-2">
          {w.phase === "preparing" && (
            <button
              type="button"
              className="torvik-primary w-full sm:w-auto sm:flex-1"
              onClick={w.start}
            >
              Iniciar em 5 segundos
            </button>
          )}
          {w.phase === "paused" && (
            <button
              type="button"
              className="torvik-primary w-full sm:w-auto sm:flex-1"
              onClick={w.resume}
            >
              Preparar retomada
            </button>
          )}
          {w.phase === "running" && (
            <button
              type="button"
              className="torvik-primary w-full sm:w-auto sm:flex-1"
              onClick={() => onFinish(w.finish())}
            >
              Finalizar treino
            </button>
          )}
          {w.phase === "running" && (
            <button
              type="button"
              className="torvik-secondary w-[calc(50%-0.25rem)] sm:w-auto"
              onClick={w.pause}
            >
              Pausar
            </button>
          )}
          {(w.phase === "paused" || w.phase === "preparing") && (
            <button
              type="button"
              className="torvik-secondary w-[calc(50%-0.25rem)] sm:w-auto sm:flex-1"
              onClick={() => onFinish(w.finish())}
            >
              Finalizar treino
            </button>
          )}
          <button
            type="button"
            className={`torvik-secondary ${["loading", "error", "countdown"].includes(w.phase) ? "w-full" : "w-[calc(50%-0.25rem)]"} sm:w-auto`}
            onClick={onCancel}
          >
            Cancelar
          </button>
        </div>
        <VoiceControls voice={voice} />
      </section>
    </main>
  );
}
