import { useCallback, useEffect, useRef, useState } from "react";
import { RULES, createAnalyzer, type AnalysisResult, type ExerciseId } from "@/lib/biomech";
import { CameraController, cameraErrorMessage, type PipelineStage } from "@/lib/camera";
import { SessionLedger } from "@/lib/session";
import { drawPose } from "@/lib/draw-pose";
export type WorkoutPhase = "loading" | "preparing" | "countdown" | "running" | "paused" | "error";
const initialResult: AnalysisResult = {
  message: "Posicione o corpo no quadro",
  level: "warning",
  state: "positioning",
  totalReps: 0,
  correctReps: 0,
  tracking: false,
  ready: false,
  event: null,
  side: null,
};
export function useWorkout(exercise: ExerciseId) {
  const videoRef = useRef<HTMLVideoElement>(null),
    canvasRef = useRef<HTMLCanvasElement>(null);
  const runtime = useRef<{
    analyzer: ReturnType<typeof createAnalyzer>;
    ledger: SessionLedger;
  } | null>(null);
  if (!runtime.current)
    runtime.current = { analyzer: createAnalyzer(exercise), ledger: new SessionLedger(exercise) };
  const controller = useRef<CameraController | null>(null);
  const phaseRef = useRef<WorkoutPhase>("loading");
  const [phase, setPhaseState] = useState<WorkoutPhase>("loading");
  const setPhase = useCallback((next: WorkoutPhase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);
  const [stage, setStage] = useState<PipelineStage>("model");
  const [error, setError] = useState("");
  const [result, setResult] = useState(initialResult);
  const resultRef = useRef(initialResult);
  const held = useRef<{ until: number; result: AnalysisResult } | null>(null);
  const [seconds, setSeconds] = useState(0),
    [countdown, setCountdown] = useState(3);
  const [attempt, setAttempt] = useState(0),
    [deviceId, setDeviceId] = useState("");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]),
    [mirrored, setMirrored] = useState(true);
  const lastFrameAt = useRef<number | null>(null);
  const dimensions = useRef<string | null>(null);
  const countdownDeadline = useRef<number | null>(null);
  const interrupt = useCallback(() => {
    const { analyzer, ledger } = runtime.current!;
    const now = performance.now();
    ledger.clock.setRunning(false, now);
    ledger.consume(analyzer.resetPartial(now));
    ledger.resetTracking();
    held.current = null;
    resultRef.current = {
      ...initialResult,
      totalReps: analyzer.totalReps,
      correctReps: analyzer.correctReps,
    };
    setResult(resultRef.current);
    countdownDeadline.current = null;
    lastFrameAt.current = null;
  }, []);
  const refreshDevices = useCallback(async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices(list.filter((d) => d.kind === "videoinput"));
    } catch {
      /* Optional selector; capture errors are reported by the controller. */
    }
  }, []);
  useEffect(() => {
    if (!videoRef.current) return;
    let disposed = false,
      first = true;
    setPhase("loading");
    setError("");
    interrupt();
    const camera = new CameraController(videoRef.current, {
      onStage: (next) => {
        if (!disposed) setStage(next);
      },
      onError: (err) => {
        if (disposed) return;
        interrupt();
        setError(cameraErrorMessage(err));
        setPhase("error");
      },
      onFrame: (frame) => {
        if (disposed) return;
        if (first) {
          first = false;
          setPhase("preparing");
          void refreshDevices();
          const stream = videoRef.current?.srcObject as MediaStream | null;
          setMirrored(stream?.getVideoTracks()[0]?.getSettings().facingMode !== "environment");
        }
        const size = `${frame.width}x${frame.height}`;
        if (dimensions.current !== null && dimensions.current !== size) {
          interrupt();
          setPhase("preparing");
        }
        dimensions.current = size;
        lastFrameAt.current = performance.now();
        if (canvasRef.current)
          drawPose(canvasRef.current, frame.landmarks, frame.width, frame.height);
        const { analyzer, ledger } = runtime.current!;
        const next = analyzer.analyze(frame, phaseRef.current === "running");
        resultRef.current = next;
        const now = performance.now();
        if (phaseRef.current === "running") {
          ledger.consume(next.event);
          ledger.tracking(next.tracking);
          ledger.clock.setRunning(next.tracking && next.ready, now);
        }
        if (phaseRef.current === "countdown" && (!next.tracking || !next.ready)) {
          countdownDeadline.current = null;
          setPhase("preparing");
        }
        if (next.event?.type === "repetition") held.current = { until: now + 1500, result: next };
        const display = !next.tracking
          ? next
          : held.current && now < held.current.until
            ? { ...next, message: held.current.result.message, level: held.current.result.level }
            : next;
        setResult((previous) =>
          previous.message === display.message &&
          previous.level === display.level &&
          previous.state === display.state &&
          previous.totalReps === display.totalReps &&
          previous.correctReps === display.correctReps &&
          previous.ready === display.ready &&
          previous.tracking === display.tracking &&
          previous.side === display.side
            ? previous
            : display,
        );
      },
    });
    controller.current = camera;
    void camera.start(deviceId || undefined);
    return () => {
      disposed = true;
      camera.stop();
      runtime.current!.ledger.clock.setRunning(false, performance.now());
    };
  }, [exercise, deviceId, attempt, interrupt, refreshDevices, setPhase]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = performance.now();
      if (
        lastFrameAt.current !== null &&
        now - lastFrameAt.current > RULES.maxGapMs &&
        ["running", "preparing", "countdown"].includes(phaseRef.current)
      ) {
        const staleAt = lastFrameAt.current + RULES.maxGapMs;
        runtime.current!.ledger.clock.setRunning(false, staleAt);
        if (phaseRef.current === "running") runtime.current!.ledger.tracking(false);
        const active = phaseRef.current === "running";
        interrupt();
        if (!active) setPhase("preparing");
        const stale = { ...resultRef.current, message: "Aguardando novos frames da câmera" };
        resultRef.current = stale;
        setResult(stale);
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      setSeconds(runtime.current!.ledger.clock.seconds(now));
      if (phaseRef.current === "countdown" && countdownDeadline.current !== null) {
        const left = Math.ceil((countdownDeadline.current - now) / 1000);
        setCountdown(Math.max(1, left));
        if (left <= 0 && resultRef.current.ready) {
          countdownDeadline.current = null;
          setPhase("running");
          runtime.current!.ledger.clock.setRunning(true, now);
        }
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [interrupt, setPhase]);
  const pause = useCallback(() => {
    interrupt();
    controller.current?.setPaused(true);
    setPhase("paused");
  }, [interrupt, setPhase]);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden && phaseRef.current !== "error") {
        pause();
        controller.current?.stop();
      }
    };
    document.addEventListener("visibilitychange", hidden);
    navigator.mediaDevices?.addEventListener?.("devicechange", refreshDevices);
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      navigator.mediaDevices?.removeEventListener?.("devicechange", refreshDevices);
    };
  }, [pause, refreshDevices]);
  const retry = () => {
    interrupt();
    controller.current?.stop();
    setAttempt((v) => v + 1);
  };
  return {
    videoRef,
    canvasRef,
    phase,
    stage,
    error,
    result,
    seconds,
    countdown,
    devices,
    deviceId,
    mirrored,
    pause,
    retry,
    start: () => {
      if (!resultRef.current.ready || phaseRef.current !== "preparing") return;
      setCountdown(3);
      countdownDeadline.current = performance.now() + 3000;
      setPhase("countdown");
    },
    resume: retry,
    selectCamera: (id: string) => {
      if (id === deviceId) return;
      interrupt();
      controller.current?.stop();
      setDeviceId(id);
    },
    finish: () => {
      interrupt();
      controller.current?.stop();
      return runtime.current!.ledger.snapshot(performance.now());
    },
  };
}
