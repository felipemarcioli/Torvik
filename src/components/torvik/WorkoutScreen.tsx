import { useEffect, useState } from "react";
import { Mascot } from "./TorvikUI";
import { SlidersHorizontal, LoaderCircle, Pause, Play, Check } from "lucide-react";
import { BackButton } from "./AppNavigation";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { VoiceControls } from "./VoiceControls";
import type { WorkoutVoiceControls } from "@/hooks/use-workout-voice";
import { useWorkout } from "@/hooks/use-workout";
import type { ExerciseId } from "@/lib/biomech";
import { formatTime, type SessionReport } from "@/lib/session";
import { EXERCISES, CAMERA_TIPS } from "./data";
const stages = {
  model: "Baixando modelo de movimento…",
  camera: "Aguardando acesso à câmera…",
  video: "Preparando vídeo…",
  inference: "Preparando a primeira análise…",
};
import { MOVEMENT_LABELS as states } from "@/lib/exercises/catalog";
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
  registerBack,
}: {
  exercise: ExerciseId;
  voice: WorkoutVoiceControls;
  onFinish: (report: SessionReport) => void;
  onCancel: () => void;
  registerBack: (handler: () => boolean) => () => void;
}) {
  const w = useWorkout(exercise, voice.controller);
  const details = EXERCISES.find((e) => e.id === exercise)!;
  const [confirmExit, setConfirmExit] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const hasProgress =
    w.seconds > 0 ||
    w.result.totalReps > 0 ||
    (w.result.measurement?.type === "HOLD_BASED" && w.result.measurement.validMs > 0);
  const requestExit = () => {
    if (hasProgress) {
      w.pause();
      setConfirmExit(true);
    } else onCancel();
  };
  useEffect(() =>
    registerBack(() => {
      if (controlsOpen) setControlsOpen(false);
      else if (confirmExit) setConfirmExit(false);
      else if (w.phase === "running" || w.phase === "countdown") w.pause();
      else if (hasProgress) {
        w.pause();
        setConfirmExit(true);
      } else {
        voice.controller.stop();
        return true;
      }
      return false;
    }),
  );
  return (
    <main className="workout-layout bg-background" aria-label={`Treino de ${details.name}`}>
      <header className="workout-header flex items-center justify-between gap-4 border-b border-border bg-card px-4 py-2.5 sm:px-6">
        <BackButton
          onClick={() => {
            if (["running", "countdown"].includes(w.phase)) w.pause();
            else requestExit();
          }}
        >
          {["running", "countdown"].includes(w.phase) ? "Voltar à pausa" : "Voltar"}
        </BackButton>
        <div className="min-w-0">
          <p className="torvik-kicker text-[0.625rem]">Torvik · seu movimento</p>
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
        {["preparing", "countdown", "running", "paused"].includes(w.phase) && (
          <span className="camera-status">
            <i aria-hidden="true" /> Câmera local · sem gravação
          </span>
        )}
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
          <div role="status" className="workout-state relative">
            <Mascot decorative />
            <LoaderCircle className="loading-spinner mx-auto mb-3" size={22} aria-hidden="true" />
            <h2 className="text-xl font-bold">Preparando a câmera</h2>
            <p className="mt-2 text-sm text-muted-foreground">{stages[w.stage]}</p>
          </div>
        )}
        {w.phase === "paused" && (
          <div className="workout-state relative">
            <Pause className="mx-auto mb-3 text-primary" size={28} aria-hidden="true" />
            <p className="torvik-kicker">Respire um pouco</p>
            <h2 className="mt-1 text-xl font-bold">Treino pausado</h2>
            <p className="mt-2 text-sm text-muted-foreground">Seu progresso está preservado.</p>
          </div>
        )}
        {w.phase === "error" && (
          <div role="alert" className="workout-state relative">
            <Mascot decorative />
            <p className="torvik-kicker text-destructive">Vamos ajustar</p>
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
            <div
              className={
                details.type === "HOLD_BASED"
                  ? "flex min-w-0 flex-col items-start gap-1"
                  : "flex items-baseline gap-3"
              }
            >
              <p className="font-display text-[clamp(3.5rem,12vw,4.5rem)] font-extrabold leading-none text-primary tabular-nums">
                {details.type === "HOLD_BASED"
                  ? formatTime(
                      w.result.measurement?.type === "HOLD_BASED"
                        ? w.result.measurement.validMs / 1000
                        : 0,
                    )
                  : w.result.totalReps}
              </p>
              <p className="text-sm font-semibold text-muted-foreground">
                {details.type === "HOLD_BASED" ? "em postura válida" : "repetições"}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p
                className={`font-display ${details.type === "HOLD_BASED" ? "text-sm" : "text-2xl"} font-bold text-success tabular-nums`}
              >
                {details.type === "HOLD_BASED"
                  ? w.result.measurement?.type === "HOLD_BASED" && w.result.measurement.valid
                    ? "Contando"
                    : "Ajuste a postura"
                  : w.result.correctReps}
              </p>
              <p className="max-w-28 text-xs leading-tight text-muted-foreground">
                {details.type === "HOLD_BASED" ? "segundo os critérios do app" : "nos critérios"}
              </p>
            </div>
          </div>
        )}
        {w.phase === "preparing" && (
          <div className="workout-preparation mx-auto mb-3 max-w-3xl">
            <p className="torvik-kicker">Início automático</p>
            <h2 className="mt-1 text-lg font-bold leading-tight">Vamos encontrar sua posição</h2>
            <p className="mt-1 text-sm leading-snug text-muted-foreground">
              {details.cameraGuidance ?? details.instructions[0]} {details.initialPosition}
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
        <div className="workout-actions mx-auto mt-3 flex max-w-3xl flex-wrap gap-2">
          {w.phase === "preparing" && (
            <button type="button" className="torvik-primary flex-1" onClick={w.start}>
              Iniciar em 5 segundos
            </button>
          )}
          {w.phase === "running" && (
            <button type="button" className="torvik-primary flex-1" onClick={w.pause}>
              <Pause size={18} aria-hidden="true" /> Pausar
            </button>
          )}
          {w.phase === "paused" && (
            <>
              <button type="button" className="torvik-primary w-full" onClick={w.resume}>
                <Play size={18} aria-hidden="true" /> Continuar
              </button>
              <button
                type="button"
                className="torvik-secondary flex-1"
                onClick={() => onFinish(w.finish())}
              >
                <Check size={18} aria-hidden="true" /> Finalizar treino
              </button>
              <button type="button" className="torvik-secondary flex-1" onClick={requestExit}>
                Sair
              </button>
            </>
          )}
          {["loading", "error", "countdown", "preparing"].includes(w.phase) && (
            <button type="button" className="torvik-secondary" onClick={requestExit}>
              Sair
            </button>
          )}
          <Sheet open={controlsOpen} onOpenChange={setControlsOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="torvik-secondary"
                aria-label="Controles de câmera e voz"
              >
                <SlidersHorizontal size={20} aria-hidden="true" />
                <span>Controles</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="app-sheet">
              <SheetTitle>Câmera e voz</SheetTitle>
              <SheetDescription>Controles do treino atual.</SheetDescription>
              {details.sideMode === "selected" &&
                ["preparing", "running", "paused"].includes(w.phase) && (
                  <div className="mx-auto mb-2 flex max-w-3xl flex-wrap items-center gap-2 text-sm">
                    <span>
                      {exercise === "bulgariansquat" ? "Perna dianteira:" : "Lado de apoio:"}
                    </span>
                    {(["left", "right"] as const).map((side) => (
                      <button
                        key={side}
                        type="button"
                        className="torvik-secondary"
                        aria-pressed={w.selectedSide === side}
                        onClick={() => w.selectSide(side)}
                      >
                        {side === "left" ? "Esquerdo" : "Direito"}
                      </button>
                    ))}
                    <span className="text-xs text-muted-foreground">
                      A troca preserva os resultados e prepara o outro lado.
                    </span>
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

              {w.devices.length <= 1 && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Câmera padrão do dispositivo. A escolha aparece quando há mais de uma câmera
                  disponível.
                </p>
              )}
              {w.devices.length > 1 && ["running", "countdown", "loading"].includes(w.phase) && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Pause o treino para trocar de câmera.
                </p>
              )}
              {w.phase === "preparing" && (
                <button
                  type="button"
                  className="torvik-secondary mt-3"
                  onClick={() => onFinish(w.finish())}
                >
                  <Check size={18} aria-hidden="true" /> Finalizar treino
                </button>
              )}
              <VoiceControls voice={voice} expanded />
              <details className="app-disclosure">
                <summary>Ajuda de posicionamento</summary>
                <ul className="space-y-2">
                  {CAMERA_TIPS.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </details>
              <details className="app-disclosure">
                <summary>Leitura da análise</summary>
                <p>
                  {states[w.result.state] ?? w.result.state}
                  {w.result.side
                    ? ` · lado ${w.result.side === "left" ? "esquerdo" : "direito"}`
                    : ""}
                </p>
                <p>
                  {details.analysisLimitations ??
                    "A câmera estima o movimento em 2D segundo os critérios do app, sem validação clínica."}
                </p>
              </details>
            </SheetContent>
          </Sheet>
        </div>
        <AlertDialog open={confirmExit} onOpenChange={setConfirmExit}>
          <AlertDialogContent className="app-confirm">
            <AlertDialogTitle>Descartar este treino?</AlertDialogTitle>
            <AlertDialogDescription>
              O progresso desta sessão será descartado. Para guardar um resultado, volte e escolha
              Finalizar treino.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar à pausa</AlertDialogCancel>
              <AlertDialogAction onClick={onCancel}>Descartar e sair</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </main>
  );
}
