import { expect, test } from "bun:test";
import { evaluateVideo, latencySummary } from "../src/lib/pose/evaluation";
import type { PoseEngine, PoseResult } from "../src/lib/pose/types";
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
const video = {
  duration: 1 / 15,
  currentTime: 0,
  readyState: 2,
  videoWidth: 640,
  videoHeight: 480,
} as HTMLVideoElement;
test("comparação cancelada fecha um modelo recebido tardiamente", async () => {
  const creating = deferred<PoseEngine>();
  const abort = new AbortController();
  let closes = 0;
  const result = evaluateVideo(
    video,
    () => creating.promise,
    "squat",
    0,
    abort.signal,
    () => {},
  );
  abort.abort();
  await expect(result).rejects.toThrow("cancelada");
  creating.resolve({
    id: "test",
    process: async () => ({ landmarks: [] }),
    close: async () => {
      closes++;
    },
  });
  await Promise.resolve();
  expect(closes).toBe(1);
});
test("cancelar comparação responde sem fechar modelo durante inferência", async () => {
  const processing = deferred<PoseResult>();
  const started = deferred<void>();
  const abort = new AbortController();
  let closes = 0;
  const engine: PoseEngine = {
    id: "test",
    process: () => {
      started.resolve();
      return processing.promise;
    },
    close: async () => {
      closes++;
    },
  };
  const result = evaluateVideo(
    video,
    async () => engine,
    "squat",
    0,
    abort.signal,
    () => {},
  );
  await started.promise;
  abort.abort();
  await expect(result).rejects.toThrow("cancelada");
  expect(closes).toBe(0);
  processing.resolve({ landmarks: [] });
  await Promise.resolve();
  await Promise.resolve();
  expect(closes).toBe(1);
});
test("comparação mede amostras e não atribui rastreamento a frames vazios", async () => {
  let closes = 0;
  const result = await evaluateVideo(
    video,
    async () => ({
      id: "test",
      process: async () => ({ landmarks: [] }),
      close: async () => {
        closes++;
      },
    }),
    "squat",
    2,
    new AbortController().signal,
    () => {},
  );
  expect(result.frames).toBe(1);
  expect(result.trackingCoverage).toBe(0);
  expect(result.absoluteCountError).toBe(2);
  expect(closes).toBe(1);
  expect(latencySummary([100, 20, 30, 10])).toEqual({ meanMs: 40, p95Ms: 100 });
});
