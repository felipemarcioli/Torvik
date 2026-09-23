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
  onFinish,
  onCancel,
}: {
  exercise: ExerciseId;
  onFinish: (report: SessionReport) => void;
  onCancel: () => void;
}) {
  const w = useWorkout(exercise);
  const details = EXERCISES.find((e) => e.id === exercise)!;
  return (
    <main className="workout-layout bg-background" aria-label={`Treino de ${details.name}`}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Torvik • treino local
          </p>
          <h1 className="text-lg font-bold">{details.name}</h1>
        </div>
        <div className="flex gap-5">
          <div>
            <p className="text-xs text-muted-foreground">Tempo ativo</p>
            <p className="font-display text-xl tabular-nums">{formatTime(w.seconds)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Repetições</p>
            <p className="font-display text-xl text-primary tabular-nums">
              {w.result.totalReps}{" "}
              <span className="text-xs text-muted-foreground">
                • {w.result.correctReps} nos critérios
              </span>
            </p>
          </div>
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
            className="relative mx-4 rounded-3xl bg-background/90 px-8 py-4 text-center text-primary"
          >
            <p className="text-8xl font-bold tabular-nums">{w.countdown}</p>
            <p className="mt-2 max-w-xs text-base font-semibold text-foreground">
              {w.result.tracking
                ? "Prepare-se. O treino já vai começar."
                : "Posicione-se no quadro."}
            </p>
          </div>
        )}
        {w.phase === "loading" && (
          <p role="status" className="relative mx-4 rounded-2xl bg-card/95 p-5 text-center">
            {stages[w.stage]}
          </p>
        )}
        {w.phase === "paused" && (
          <div className="relative rounded-2xl bg-card/95 p-5 text-center">
            <h2 className="text-xl font-bold">Treino pausado</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Seu tempo e suas repetições estão preservados.
            </p>
          </div>
        )}
        {w.phase === "error" && (
          <div
            role="alert"
            className="relative mx-4 max-w-lg rounded-2xl border border-destructive/50 bg-card p-5"
          >
            <h2 className="text-lg font-bold">Não foi possível continuar</h2>
            <p className="mt-2 text-sm text-muted-foreground">{w.error}</p>
            <button type="button" className="torvik-primary mt-4" onClick={w.retry}>
              Tentar novamente
            </button>
          </div>
        )}
      </section>
      <section className="border-t border-border bg-card px-4 py-3">
        {w.phase === "preparing" && (
          <div className="mx-auto mb-3 max-w-3xl">
            <h2 className="font-bold">Posicione-se na câmera para iniciar automaticamente</h2>
            <p className="mt-1 text-sm text-muted-foreground">
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
            className={`mx-auto max-w-3xl rounded-xl border bg-background px-3 py-2 text-center ${styles[w.result.level]}`}
          >
            <p role="status" aria-live="polite" aria-atomic="true" className="font-semibold">
              {w.phase === "preparing" && w.result.tracking
                ? "Corpo detectado. Preparando o início automático…"
                : w.phase === "countdown"
                  ? "Mantenha os pontos do corpo visíveis. Não precisa ficar imóvel."
                  : w.result.message}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {states[w.result.state] ?? w.result.state}
              {w.result.side ? ` • lado ${w.result.side === "left" ? "esquerdo" : "direito"}` : ""}
            </p>
          </div>
        )}
        {w.devices.length > 1 &&
          (w.phase === "preparing" || w.phase === "paused" || w.phase === "error") && (
            <label className="mx-auto mt-3 flex max-w-3xl items-center gap-3 text-sm">
              Câmera
              <select
                className="min-w-0 flex-1 rounded-lg border border-border bg-background p-2"
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
        <div className="mx-auto mt-3 flex max-w-3xl flex-wrap justify-center gap-2 pb-[env(safe-area-inset-bottom)]">
          <button type="button" className="torvik-secondary" onClick={onCancel}>
            Cancelar
          </button>
          {w.phase === "preparing" && (
            <button type="button" className="torvik-primary" onClick={w.start}>
              Iniciar em 5 segundos
            </button>
          )}
          {w.phase === "running" && (
            <button type="button" className="torvik-secondary" onClick={w.pause}>
              Pausar
            </button>
          )}
          {w.phase === "paused" && (
            <button type="button" className="torvik-primary" onClick={w.resume}>
              Preparar retomada
            </button>
          )}
          {["running", "paused", "preparing"].includes(w.phase) && (
            <button type="button" className="torvik-primary" onClick={() => onFinish(w.finish())}>
              Finalizar treino
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
