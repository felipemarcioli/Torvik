import { createPose } from "./mediapipe";
import type { PoseEngine, PoseResult } from "./pose/types";
class OperationTimeout extends Error {}
export type PipelineStage = "model" | "camera" | "video" | "inference";
export class PipelineError extends Error {
  constructor(
    public stage: PipelineStage,
    public code: string,
  ) {
    super(code);
  }
}
export function cameraErrorMessage(error: unknown): string {
  if (!(error instanceof PipelineError))
    return "Não foi possível preparar o treino. Tente novamente.";
  if (error.stage === "model")
    return "Não foi possível carregar o modelo. Confira a conexão e tente novamente.";
  if (error.code === "NotAllowedError")
    return "Permissão de câmera negada. Autorize o acesso nas configurações do navegador e tente novamente.";
  if (error.code === "NotFoundError")
    return "Nenhuma câmera disponível. Conecte uma câmera ou escolha outra.";
  if (error.code === "NotReadableError")
    return "A câmera está ocupada ou foi desconectada. Feche outros aplicativos que a utilizam.";
  if (error.code === "unsupported")
    return "A câmera precisa de um navegador compatível e conexão HTTPS.";
  if (error.code === "OverconstrainedError")
    return "A câmera selecionada não está disponível. Escolha outra câmera.";
  if (error.stage === "inference")
    return "O processamento do movimento foi interrompido. Tente novamente.";
  return "Não foi possível reproduzir a câmera. Tente novamente.";
}
type Frame = PoseResult & { width: number; height: number; timestamp: number };
export type CameraDependencies = {
  createEngine: () => Promise<PoseEngine>;
  getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
  schedule: (callback: FrameRequestCallback) => number;
  cancel: (id: number) => void;
  now: () => number;
  timeoutMs: number;
};
const defaults: CameraDependencies = {
  createEngine: createPose,
  getUserMedia: (constraints) => {
    if (!globalThis.isSecureContext || !navigator.mediaDevices?.getUserMedia)
      return Promise.reject(new PipelineError("camera", "unsupported"));
    return navigator.mediaDevices.getUserMedia(constraints);
  },
  schedule: (callback) => requestAnimationFrame(callback),
  cancel: (id) => cancelAnimationFrame(id),
  now: () => performance.now(),
  timeoutMs: 20000,
};
/** One controller per attempt. stop() releases tracks synchronously and closes an idle engine. */
export class CameraController {
  private cancelled = false;
  private paused = false;
  private started = false;
  private raf: number | null = null;
  private stream: MediaStream | null = null;
  private engine: PoseEngine | null = null;
  private pending: Promise<unknown> | null = null;
  private closing = false;
  private lastTime = -1;
  private failures = 0;
  private lastResultAt = 0;
  private listeners: Array<() => void> = [];
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private dependencies: CameraDependencies;
  constructor(
    private video: HTMLVideoElement,
    private callbacks: {
      onFrame: (frame: Frame) => void;
      onStage: (stage: PipelineStage) => void;
      onError: (error: PipelineError) => void;
    },
    dependencies: Partial<CameraDependencies> = {},
  ) {
    this.dependencies = { ...defaults, ...dependencies };
  }
  private async bounded<T>(operation: Promise<T>): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new OperationTimeout("timeout")),
        this.dependencies.timeoutMs,
      );
      this.timers.add(timer);
    });
    try {
      return await Promise.race([operation, timeout]);
    } finally {
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(timer);
      }
    }
  }
  async start(deviceId?: string): Promise<void> {
    if (this.started || this.cancelled) return;
    this.started = true;
    let stage: PipelineStage = "model";
    try {
      this.callbacks.onStage(stage);
      const creating = this.dependencies.createEngine().then((engine) => {
        if (this.cancelled) {
          void engine.close().catch(() => {});
        } else {
          this.engine = engine;
        }
        return engine;
      });
      await this.bounded(creating);
      if (this.cancelled) return;
      stage = "camera";
      this.callbacks.onStage(stage);
      const stream = await this.dependencies.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "user" }),
        },
        audio: false,
      });
      if (this.cancelled) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      this.stream = stream;
      for (const track of stream.getVideoTracks()) {
        const ended = () => this.fail(new PipelineError("camera", "NotReadableError"));
        track.addEventListener("ended", ended);
        this.listeners.push(() => track.removeEventListener("ended", ended));
      }
      this.video.srcObject = stream;
      stage = "video";
      this.callbacks.onStage(stage);
      await this.bounded(this.video.play());
      if (this.cancelled) return;
      this.lastResultAt = this.dependencies.now();
      this.callbacks.onStage("inference");
      void this.tick();
    } catch (error) {
      if (!this.cancelled)
        this.fail(
          error instanceof PipelineError
            ? error
            : new PipelineError(stage, error instanceof Error ? error.name : "unknown"),
        );
    }
  }
  private fail(error: PipelineError) {
    if (this.cancelled) return;
    this.stop();
    this.callbacks.onError(error);
  }
  private async tick() {
    this.raf = null;
    if (this.cancelled || this.paused) return;
    if (this.dependencies.now() - this.lastResultAt > this.dependencies.timeoutMs) {
      this.fail(new PipelineError("inference", "timeout"));
      return;
    }
    const video = this.video;
    if (
      video.readyState >= 2 &&
      video.videoWidth > 0 &&
      video.videoHeight > 0 &&
      video.currentTime !== this.lastTime &&
      this.engine
    ) {
      this.lastTime = video.currentTime;
      const timestamp = this.dependencies.now(),
        width = video.videoWidth,
        height = video.videoHeight;
      const engine = this.engine;
      const pending = Promise.resolve().then(() => engine.process(video, timestamp));
      this.pending = pending;
      try {
        const result = await this.bounded(pending);
        this.failures = 0;
        this.lastResultAt = this.dependencies.now();
        if (!this.cancelled && !this.paused)
          this.callbacks.onFrame({ ...result, width, height, timestamp });
      } catch (error) {
        if (!this.cancelled && (error instanceof OperationTimeout || ++this.failures >= 3))
          this.fail(
            new PipelineError(
              "inference",
              error instanceof OperationTimeout ? "timeout" : "failed",
            ),
          );
      } finally {
        void pending.then(
          () => this.releasePending(pending),
          () => this.releasePending(pending),
        );
      }
    }
    if (!this.cancelled && !this.paused)
      this.raf = this.dependencies.schedule(() => {
        void this.tick();
      });
  }
  private releasePending(pending: Promise<unknown>) {
    if (this.pending === pending) this.pending = null;
    if (this.cancelled) this.closeEngine();
  }
  setPaused(paused: boolean) {
    this.paused = paused;
    if (!paused) this.lastResultAt = this.dependencies.now();
    if (paused && this.raf !== null) {
      this.dependencies.cancel(this.raf);
      this.raf = null;
    }
    if (!paused && !this.cancelled && !this.pending && this.raf === null)
      this.raf = this.dependencies.schedule(() => {
        void this.tick();
      });
  }
  private closeEngine() {
    if (this.closing || this.pending || !this.engine) return;
    this.closing = true;
    void this.engine.close().catch(() => {});
  }
  stop() {
    if (this.cancelled) return;
    this.cancelled = true;
    if (this.raf !== null) this.dependencies.cancel(this.raf);
    for (const clear of this.listeners) clear();
    this.listeners = [];
    this.stream?.getTracks().forEach((track) => track.stop());
    this.video.srcObject = null;
    // Pending watchdogs stay bounded; do not close WASM while a send is still active.
    this.closeEngine();
  }
}
