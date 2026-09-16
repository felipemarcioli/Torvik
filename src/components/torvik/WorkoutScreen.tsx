import { useEffect, useRef, useState } from "react";
import {
  createAnalyzer,
  POSE_CONNECTIONS,
  VIS_THRESHOLD,
  type AnalysisResult,
  type ExerciseId,
  type Landmark,
} from "@/lib/biomech";
import { createPose } from "@/lib/mediapipe";
import { EXERCISES } from "./data";
import { formatTime, type SessionReport } from "./ReportScreen";

const LEVEL_STYLES: Record<string, string> = {
  good: "border-success/60 bg-success/15 text-success",
  range: "border-caution/60 bg-caution/15 text-caution",
  posture: "border-accent/60 bg-accent/15 text-accent",
  warning: "border-border bg-secondary/80 text-muted-foreground",
};

const STATE_LABELS: Record<string, string> = {
  standing: "Em pé",
  descending: "Descendo",
  squat: "Agachado",
  high: "Prancha alta",
  low: "Embaixo",
  closed: "Fechado",
  opening: "Abrindo",
  open: "Aberto",
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyzerRef = useRef(createAnalyzer(exercise));
  const feedbackCounts = useRef<Record<string, number>>({});
  const smoothed = useRef<Landmark[] | null>(null);
  const startedAt = useRef(Date.now());

  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState<"loading" | "running" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<AnalysisResult>({
    message: "Posicione-se na frente da câmera",
    level: "warning",
    state: analyzerRef.current.state,
    totalReps: 0,
    correctReps: 0,
  });

  const exerciseName = EXERCISES.find((e) => e.id === exercise)?.name ?? "Treino";

  useEffect(() => {
    const id = window.setInterval(
      () => setSeconds(Math.floor((Date.now() - startedAt.current) / 1000)),
      500,
    );
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let pose: any = null;
    let raf = 0;
    let cancelled = false;

    async function start() {
      try {
        pose = await createPose();
        pose.onResults(onResults);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: "user" },
          audio: false,
        });
        if (cancelled) return;
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        setStatus("running");

        const loop = async () => {
          if (cancelled) return;
          if (video.readyState >= 2) {
            try {
              await pose.send({ image: video });
            } catch {
              /* frame skipped */
            }
          }
          raf = requestAnimationFrame(() => void loop());
        };
        void loop();
      } catch (err: any) {
        if (cancelled) return;
        setStatus("error");
        setErrorMsg(
          err?.name === "NotAllowedError"
            ? "Permissão de câmera negada. Libere o acesso à câmera nas configurações do navegador (ícone de cadeado na barra de endereço) e recarregue a página."
            : err?.name === "NotFoundError"
              ? "Nenhuma câmera encontrada. Conecte uma webcam e tente novamente."
              : (err?.message ?? "Não foi possível iniciar a câmera."),
        );
      }
    }

    function onResults(results: any) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const raw: Landmark[] | undefined = results.poseLandmarks;
      if (!raw) {
        smoothed.current = null;
        applyResult(analyzerRef.current.analyze([]));
        return;
      }

      // Exponential smoothing of landmarks
      const prev = smoothed.current;
      const lms: Landmark[] = raw.map((p, i) => {
        const q = prev?.[i];
        const a = 0.55;
        return q
          ? {
              x: q.x + (p.x - q.x) * a,
              y: q.y + (p.y - q.y) * a,
              z: q.z + (p.z - q.z) * a,
              visibility: p.visibility ?? 0,
            }
          : { x: p.x, y: p.y, z: p.z, visibility: p.visibility ?? 0 };
      });
      smoothed.current = lms;

      drawSkeleton(ctx, lms, canvas.width, canvas.height);
      applyResult(analyzerRef.current.analyze(lms));
    }

    function applyResult(next: AnalysisResult) {
      setResult((prev) => {
        if (
          next.level !== "good" &&
          next.level !== "warning" &&
          next.totalReps !== prev.totalReps &&
          next.totalReps > 0
        ) {
          feedbackCounts.current[next.message] = (feedbackCounts.current[next.message] ?? 0) + 1;
        }
        return next;
      });
    }

    void start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      try {
        pose?.close?.();
      } catch {
        /* ignore */
      }
    };
  }, [exercise]);

  const finish = () => {
    onFinish({
      exercise,
      seconds: Math.floor((Date.now() - startedAt.current) / 1000),
      totalReps: analyzerRef.current.totalReps,
      correctReps: analyzerRef.current.correctReps,
      feedbackCounts: { ...feedbackCounts.current },
    });
  };

  return (
    <div className="relative min-h-screen bg-background">
      <div className="relative mx-auto aspect-video max-h-screen w-full max-w-[1400px] overflow-hidden bg-black">
        <video ref={videoRef} playsInline muted className="size-full -scale-x-100 object-cover" />
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 size-full -scale-x-100 object-cover"
        />

        {/* HUD */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 md:p-6">
          <div className="flex flex-wrap items-start gap-3">
            <div className="rounded-2xl border border-border bg-background/70 px-5 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Tempo</p>
              <p className="font-display text-3xl font-bold tabular-nums">{formatTime(seconds)}</p>
            </div>
            <div className="rounded-2xl border border-primary/50 bg-background/70 px-5 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Repetições</p>
              <p className="font-display text-5xl font-bold leading-none text-primary tabular-nums">
                {result.totalReps}
              </p>
              <p className="mt-1 text-sm text-success">{result.correctReps} corretas</p>
            </div>
            <div className="rounded-2xl border border-accent/50 bg-background/70 px-5 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Estado</p>
              <p className="text-lg font-semibold text-accent">
                {STATE_LABELS[result.state] ?? result.state}
              </p>
            </div>
            <div className="ml-auto rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm font-semibold backdrop-blur">
              {exerciseName}
            </div>
          </div>

          <div
            className={`mx-auto w-full max-w-2xl rounded-2xl border px-6 py-4 text-center text-xl font-bold backdrop-blur ${LEVEL_STYLES[result.level]}`}
          >
            {status === "loading" ? "Carregando modelo e câmera..." : result.message}
          </div>
        </div>

        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/95 p-6">
            <div className="max-w-md rounded-2xl border border-destructive/50 bg-card p-6 text-center">
              <h2 className="text-xl font-bold text-destructive">Câmera indisponível</h2>
              <p className="mt-3 text-sm text-muted-foreground">{errorMsg}</p>
              <button
                type="button"
                onClick={onCancel}
                className="mt-6 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground"
              >
                Voltar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-6 left-1/2 flex -translate-x-1/2 gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-border bg-card/90 px-6 py-3 font-semibold backdrop-blur transition hover:bg-secondary"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={finish}
          className="rounded-full bg-primary px-8 py-3 font-bold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:brightness-110"
        >
          Finalizar Treino
        </button>
      </div>
    </div>
  );
}

function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  lms: Landmark[],
  width: number,
  height: number,
) {
  ctx.lineWidth = Math.max(3, width / 320);
  ctx.strokeStyle = "rgba(80, 160, 255, 0.9)";
  for (const [a, b] of POSE_CONNECTIONS) {
    const p = lms[a];
    const q = lms[b];
    if (!p || !q || p.visibility < VIS_THRESHOLD || q.visibility < VIS_THRESHOLD) continue;
    ctx.beginPath();
    ctx.moveTo(p.x * width, p.y * height);
    ctx.lineTo(q.x * width, q.y * height);
    ctx.stroke();
  }
  ctx.fillStyle = "rgb(245, 140, 45)";
  for (const p of lms) {
    if (!p || p.visibility < VIS_THRESHOLD) continue;
    ctx.beginPath();
    ctx.arc(p.x * width, p.y * height, Math.max(4, width / 260), 0, Math.PI * 2);
    ctx.fill();
  }
}
