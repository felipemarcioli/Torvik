import { describe, expect, test } from "bun:test";
import { CameraController, type CameraDependencies, type PipelineError } from "../src/lib/camera";
import type { PoseEngine } from "../src/lib/pose/types";
function deferred<T>() {
  let resolve!: (v: T) => void, reject!: (e: Error) => void;
  const promise = new Promise<T>((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
function fixture(overrides: Partial<CameraDependencies> = {}) {
  let stopped = 0,
    closed = 0,
    frames = 0,
    requests = 0,
    now = 0;
  const track = new EventTarget() as MediaStreamTrack;
  Object.assign(track, { stop: () => stopped++ });
  const stream = {
    getTracks: () => [track],
    getVideoTracks: () => [track],
  } as unknown as MediaStream;
  const video = {
    srcObject: null,
    readyState: 2,
    videoWidth: 1280,
    videoHeight: 720,
    currentTime: 0,
    play: async () => {},
  } as unknown as HTMLVideoElement;
  const engine: PoseEngine = {
    id: "fake",
    process: async () => ({ landmarks: [] }),
    close: async () => {
      closed++;
    },
  };
  const errors: PipelineError[] = [];
  const queue = new Map<number, FrameRequestCallback>();
  let id = 0;
  const dependencies: CameraDependencies = {
    createEngine: async () => engine,
    getUserMedia: async () => {
      requests++;
      return stream;
    },
    schedule: (callback) => {
      queue.set(++id, callback);
      return id;
    },
    cancel: (key) => {
      queue.delete(key);
    },
    now: () => now,
    timeoutMs: 30,
    ...overrides,
  };
  const controller = new CameraController(
    video,
    { onStage: () => {}, onFrame: () => frames++, onError: (error) => errors.push(error) },
    dependencies,
  );
  return {
    controller,
    video,
    engine,
    stream,
    track,
    errors,
    stats: () => ({ stopped, closed, frames, requests }),
    async next() {
      now += 16;
      video.currentTime += 0.033;
      const callbacks = [...queue.values()];
      queue.clear();
      callbacks.forEach((cb) => cb(now));
      await flush();
    },
  };
}
describe("ciclo de vida da câmera", () => {
  test("stream tardio é encerrado após cancelamento", async () => {
    const pending = deferred<MediaStream>();
    const f = fixture({ getUserMedia: () => pending.promise });
    const start = f.controller.start();
    await flush();
    f.controller.stop();
    pending.resolve(f.stream);
    await start;
    expect(f.stats().stopped).toBe(1);
    expect(f.stats().closed).toBe(1);
    expect(f.video.srcObject).toBeNull();
  });
  test("modelo recebido após cancelamento é fechado sem solicitar câmera", async () => {
    const pending = deferred<PoseEngine>();
    const f = fixture({ createEngine: () => pending.promise });
    const start = f.controller.start();
    f.controller.stop();
    pending.resolve(f.engine);
    await start;
    expect(f.stats().closed).toBe(1);
    expect(f.stats().requests).toBe(0);
  });
  test("encerra tracks durante inferência e só fecha modelo quando ela termina", async () => {
    const pending = deferred<{ landmarks: [] }>();
    const f = fixture();
    f.engine.process = () => pending.promise;
    await f.controller.start();
    await flush();
    f.controller.stop();
    f.controller.stop();
    expect(f.stats().stopped).toBe(1);
    expect(f.stats().closed).toBe(0);
    pending.resolve({ landmarks: [] });
    await flush();
    expect(f.stats().closed).toBe(1);
    expect(f.stats().frames).toBe(0);
  });
  test("rejeição de play libera recursos", async () => {
    const f = fixture();
    f.video.play = async () => {
      throw new Error("failed");
    };
    await f.controller.start();
    expect(f.stats().stopped).toBe(1);
    expect(f.errors[0]?.stage).toBe("video");
  });
  test("frames repetidos não são enviados; pausa suspende e retomada agenda", async () => {
    const f = fixture();
    await f.controller.start();
    await flush();
    expect(f.stats().frames).toBe(1);
    f.controller.setPaused(true);
    await f.next();
    expect(f.stats().frames).toBe(1);
    f.controller.setPaused(false);
    await f.next();
    expect(f.stats().frames).toBe(2);
    f.controller.stop();
  });
  test("falhas persistentes de inferência são apresentadas e liberam câmera", async () => {
    const f = fixture();
    f.engine.process = async () => {
      throw new Error("bad frame");
    };
    await f.controller.start();
    await flush();
    await f.next();
    await f.next();
    expect(f.errors[0]?.stage).toBe("inference");
    expect(f.stats().stopped).toBe(1);
  });
  test("modelo que não responde encerra câmera pelo watchdog", async () => {
    const f = fixture();
    f.engine.process = () => new Promise(() => {});
    await f.controller.start();
    await new Promise((r) => setTimeout(r, 45));
    expect(f.errors[0]?.code).toBe("timeout");
    expect(f.stats().stopped).toBe(1);
    expect(f.stats().closed).toBe(0);
  });
  test("câmera desconectada encerra sessão", async () => {
    const f = fixture();
    await f.controller.start();
    await flush();
    f.track.dispatchEvent(new Event("ended"));
    expect(f.errors[0]?.code).toBe("NotReadableError");
    expect(f.stats().stopped).toBe(1);
  });
});
