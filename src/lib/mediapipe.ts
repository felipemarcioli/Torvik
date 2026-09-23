import type { PoseEngine, PoseResult } from "./pose/types";
import type { Landmark } from "./biomech";
const POSE_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404";
export const LEGACY_ENGINE_ID = "mediapipe-pose-0.5.1675469404";
const scripts = new Map<string, Promise<void>>();
/** A failed attempt is removed, so a retry always creates a new request. */
export function loadScript(src: string, timeoutMs = 20000): Promise<void> {
  const previous = scripts.get(src);
  if (previous) return previous;
  const promise = new Promise<void>((resolve, reject) => {
    const el = document.createElement("script");
    const finish = (error?: Error) => {
      clearTimeout(timer);
      el.onload = null;
      el.onerror = null;
      if (error) {
        el.remove();
        reject(error);
      } else {
        resolve();
      }
    };
    const timer = setTimeout(
      () => finish(new Error("O download do modelo demorou demais. Tente novamente.")),
      timeoutMs,
    );
    el.src = src;
    el.crossOrigin = "anonymous";
    el.async = true;
    el.onload = () => finish();
    el.onerror = () =>
      finish(new Error("Não foi possível baixar o modelo. Verifique sua conexão."));
    document.head.appendChild(el);
  });
  scripts.set(src, promise);
  void promise.catch(() => {
    if (scripts.get(src) === promise) scripts.delete(src);
  });
  return promise;
}
interface LegacyPose {
  setOptions(options: {
    modelComplexity: number;
    smoothLandmarks: boolean;
    enableSegmentation: boolean;
    minDetectionConfidence: number;
    minTrackingConfidence: number;
  }): void;
  onResults(
    callback: (result: { poseLandmarks?: Landmark[]; poseWorldLandmarks?: Landmark[] }) => void,
  ): void;
  send(input: { image: HTMLVideoElement }): Promise<void>;
  close(): Promise<void>;
}
declare global {
  interface Window {
    Pose?: new (options: { locateFile: (file: string) => string }) => LegacyPose;
  }
}
export async function createPose(): Promise<PoseEngine> {
  await loadScript(`${POSE_CDN}/pose.js`);
  const Ctor = window.Pose;
  if (!Ctor) throw new Error("Modelo indisponível neste navegador. Tente novamente.");
  const pose = new Ctor({ locateFile: (file) => `${POSE_CDN}/${file}` });
  try {
    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
  } catch (error) {
    await pose.close().catch(() => {});
    throw error;
  }
  let latest: PoseResult | null = null,
    closed = false;
  pose.onResults((result) => {
    latest = {
      landmarks: result.poseLandmarks ?? [],
      ...(result.poseWorldLandmarks ? { worldLandmarks: result.poseWorldLandmarks } : {}),
    };
  });
  return {
    id: LEGACY_ENGINE_ID,
    async process(video) {
      if (closed) throw new Error("Modelo encerrado");
      latest = null;
      await pose.send({ image: video });
      if (!latest) throw new Error("O modelo não retornou um resultado.");
      return latest;
    },
    async close() {
      if (closed) return;
      closed = true;
      await pose.close();
    },
  };
}
