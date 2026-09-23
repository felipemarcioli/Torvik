import type { PoseEngine, PoseResult } from "./types";
export const TASKS_VERSION = "1.0.1";
export const TASKS_ENGINE_ID = `tasks-vision-${TASKS_VERSION}-pose-lite-v1-cpu-worker`;
const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VERSION}/wasm`;
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
/** Experimental; never selected by the workout screen without a separate validated rollout. */
export async function createTasksPose(): Promise<PoseEngine> {
  const worker = new Worker(new URL("./tasks-worker.ts", import.meta.url), { type: "module" });
  let closed = false,
    sequence = 0;
  type Pending = {
    resolve: (result: PoseResult) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  };
  const pending = new Map<number, Pending>();
  let readyResolve!: () => void, readyReject!: (error: Error) => void;
  const ready = new Promise<void>((resolve, reject) => {
    readyResolve = resolve;
    readyReject = reject;
  });
  const close = () => {
    if (closed) return;
    closed = true;
    worker.terminate();
    for (const item of pending.values()) {
      clearTimeout(item.timer);
      item.reject(new Error("Comparação interrompida."));
    }
    pending.clear();
  };
  const startup = setTimeout(() => {
    readyReject(new Error("O modelo experimental demorou demais para carregar."));
    close();
  }, 30000);
  worker.onmessage = ({ data }: { data: { type: string; id?: number; result?: PoseResult } }) => {
    if (data.type === "ready") {
      clearTimeout(startup);
      readyResolve();
      return;
    }
    const task = data.id === undefined ? undefined : pending.get(data.id);
    if (task) {
      clearTimeout(task.timer);
      pending.delete(data.id!);
      if (data.type === "result" && data.result) task.resolve(data.result);
      else task.reject(new Error("O modelo experimental não processou o frame."));
    } else if (data.type === "error") {
      clearTimeout(startup);
      readyReject(new Error("Modelo experimental indisponível neste navegador."));
      close();
    }
  };
  worker.onerror = () => {
    clearTimeout(startup);
    readyReject(new Error("Worker de análise indisponível."));
    close();
  };
  worker.postMessage({ type: "init", wasm: WASM, model: MODEL });
  await ready;
  return {
    id: TASKS_ENGINE_ID,
    async process(video, timestamp) {
      if (closed) throw new Error("Modelo encerrado.");
      const image = await createImageBitmap(video);
      if (closed) {
        image.close();
        throw new Error("Modelo encerrado.");
      }
      const id = ++sequence;
      return new Promise<PoseResult>((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error("Tempo de processamento excedido."));
          close();
        }, 20000);
        pending.set(id, { resolve, reject, timer });
        worker.postMessage({ type: "frame", id, image, timestamp }, [image]);
      });
    },
    async close() {
      clearTimeout(startup);
      close();
    },
  };
}
