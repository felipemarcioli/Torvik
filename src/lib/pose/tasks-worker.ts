import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import type { PoseResult } from "./types";
type Input =
  | { type: "init"; wasm: string; model: string }
  | { type: "frame"; id: number; image: ImageBitmap; timestamp: number };
const scope = self as unknown as {
  onmessage: ((event: MessageEvent<Input>) => void) | null;
  postMessage: (message: unknown) => void;
};
let model: PoseLandmarker | null = null;
scope.onmessage = async ({ data }) => {
  try {
    if (data.type === "init") {
      const files = await FilesetResolver.forVisionTasks(data.wasm);
      model = await PoseLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: data.model, delegate: "CPU" },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      scope.postMessage({ type: "ready" });
      return;
    }
    if (!model) throw new Error("not ready");
    try {
      const output = model.detectForVideo(data.image, data.timestamp);
      const result: PoseResult = {
        landmarks: output.landmarks[0] ?? [],
        worldLandmarks: output.worldLandmarks[0] ?? [],
      };
      scope.postMessage({ type: "result", id: data.id, result });
    } finally {
      data.image.close();
    }
  } catch {
    scope.postMessage({ type: "error", id: data.type === "frame" ? data.id : null });
  }
};
