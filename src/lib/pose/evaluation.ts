import { createAnalyzer, RULES_VERSION, type ExerciseId } from "../biomech";
import type { PoseEngine } from "./types";
export type EvaluationResult = {
  engine: string;
  rules: string;
  frames: number;
  trackedFrames: number;
  trackingCoverage: number;
  totalReps: number;
  criteriaReps: number;
  meanMs: number;
  p95Ms: number;
  sampleSeconds: number;
  expectedReps: number;
  absoluteCountError: number;
};
export function latencySummary(samples: number[]) {
  const sorted = [...samples].sort((a, b) => a - b);
  return {
    meanMs: samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : 0,
    p95Ms: sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)] ?? 0,
  };
}
function cancellable<T>(operation: Promise<T>, signal: AbortSignal, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", cancel);
    };
    const cancel = () => {
      cleanup();
      reject(new Error("Comparação cancelada."));
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Tempo de processamento excedido."));
    }, timeoutMs);
    signal.addEventListener("abort", cancel, { once: true });
    operation.then(
      (value) => {
        cleanup();
        resolve(value);
      },
      (error: unknown) => {
        cleanup();
        reject(error);
      },
    );
    if (signal.aborted) cancel();
  });
}
async function seek(video: HTMLVideoElement, time: number, signal: AbortSignal) {
  signal.throwIfAborted();
  if (Math.abs(video.currentTime - time) < 0.0001 && video.readyState >= 2) return;
  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      video.removeEventListener("seeked", done);
      video.removeEventListener("error", fail);
      signal.removeEventListener("abort", fail);
    };
    const done = () => {
        cleanup();
        resolve();
      },
      fail = () => {
        cleanup();
        reject(new Error("Leitura do vídeo interrompida."));
      };
    const timer = setTimeout(fail, 5000);
    video.addEventListener("seeked", done, { once: true });
    video.addEventListener("error", fail, { once: true });
    signal.addEventListener("abort", fail, { once: true });
    video.currentTime = time;
  });
}
/** Same 15 timestamped frames/s for both engines, independent of inference speed. */
export async function evaluateVideo(
  video: HTMLVideoElement,
  factory: () => Promise<PoseEngine>,
  exercise: ExerciseId,
  expectedReps: number,
  signal: AbortSignal,
  progress: (fraction: number) => void,
): Promise<EvaluationResult> {
  signal.throwIfAborted();
  const creating = factory();
  let engine: PoseEngine;
  try {
    engine = await cancellable(creating, signal, 30000);
  } catch (error) {
    // A cancelled download may still produce a model later.
    void creating.then((late) => late.close()).catch(() => {});
    throw error;
  }
  const analyzer = createAnalyzer(exercise),
    latencies: number[] = [];
  let pending: Promise<unknown> | null = null;
  let tracked = 0;
  try {
    signal.throwIfAborted();
    const duration = Math.min(video.duration, 60);
    if (!Number.isFinite(duration) || duration <= 0) throw new Error("Vídeo sem duração válida.");
    for (let i = 0; i < Math.floor(duration * 15); i++) {
      signal.throwIfAborted();
      await seek(video, i / 15, signal);
      const before = performance.now();
      const processing = Promise.resolve().then(() => engine.process(video, (i * 1000) / 15));
      pending = processing;
      const pose = await cancellable(processing, signal, 20000);
      pending = null;
      signal.throwIfAborted();
      latencies.push(performance.now() - before);
      const result = analyzer.analyze({
        landmarks: pose.landmarks,
        width: video.videoWidth,
        height: video.videoHeight,
        timestamp: (i * 1000) / 15,
      });
      if (result.tracking) tracked++;
      progress((i + 1) / Math.floor(duration * 15));
    }
    return {
      engine: engine.id,
      rules: RULES_VERSION,
      frames: latencies.length,
      trackedFrames: tracked,
      trackingCoverage: latencies.length ? tracked / latencies.length : 0,
      totalReps: analyzer.totalReps,
      criteriaReps: analyzer.correctReps,
      ...latencySummary(latencies),
      sampleSeconds: duration,
      expectedReps,
      absoluteCountError: Math.abs(analyzer.totalReps - expectedReps),
    };
  } finally {
    const close = () => engine.close().catch(() => {});
    // Never close the legacy WASM during an in-flight send, even after cancellation.
    if (pending) void pending.then(close, close);
    else await close();
  }
}
