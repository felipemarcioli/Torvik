import { RULES, type AnalysisResult, type RepetitionEvent } from "../biomech";
import { SpeechQueue, type VoiceSettings } from "./speech";
export type VoicePhase = "loading" | "preparing" | "countdown" | "running" | "paused" | "error";
export type VoiceEvent =
  | { type: "phase"; phase: VoicePhase }
  | { type: "countdown"; value: number }
  | { type: "repetition"; event: RepetitionEvent; total: number }
  | { type: "interrupt" | "tracking-lost" };
export interface WorkoutVoiceSink {
  publish(event: VoiceEvent): void;
  observe(result: AnalysisResult, at: number): void;
}
const corrections: Record<string, string> = {
  "Revise a inclinação do tronco": "Revise a inclinação do tronco.",
  "Revise o alinhamento do corpo": "Mantenha o corpo alinhado.",
  "Amplie a descida do agachamento": "Tente aumentar a amplitude do agachamento.",
  "Amplie a descida da flexão": "Tente aumentar a amplitude da flexão.",
  "Eleve os braços acima da cabeça": "Eleve os braços acima da cabeça.",
  "Abra mais as pernas": "Abra mais as pernas.",
  "Abra braços e pernas ao mesmo tempo": "Abra braços e pernas ao mesmo tempo.",
};
const posture = new Set(["Revise a inclinação do tronco", "Revise o alinhamento do corpo"]);
/** Receives cheap data writes; only tick (outside camera inference) schedules speech. */
export class WorkoutVoice implements WorkoutVoiceSink {
  private active = false;
  private phase: VoicePhase = "loading";
  private countdown = 5;
  private attempt = 0;
  private cancelledAt = -Infinity;
  private silentCountdown = false;
  private started = false;
  private events: VoiceEvent[] = [];
  private raw: { result: AnalysisResult; at: number } | null = null;
  private seen = new Set<number>();
  private milestones = new Set<number>();
  private spokenSeconds = new Set<string>();
  private issues = new Map<string, number>();
  private repeatedIssues = new Set<string>();
  private goodStreak = 0;
  private postureKey = "";
  private postureSince = 0;
  private missingSince: number | null = null;
  private terminal = false;
  constructor(
    readonly speech: SpeechQueue,
    private now = () => performance.now(),
  ) {}
  begin() {
    this.stop();
    this.active = true;
    this.phase = "loading";
    this.countdown = 5;
    this.started = false;
    this.attempt = 0;
    this.cancelledAt = -Infinity;
    this.seen.clear();
    this.milestones.clear();
    this.spokenSeconds.clear();
    this.speech.activate();
  }
  observe(result: AnalysisResult, at: number) {
    if (this.active) this.raw = { result, at };
  }
  publish(event: VoiceEvent) {
    if (!this.active) return;
    // Lifecycle cancellation is synchronous, even if the browser suspends timers.
    if (
      event.type === "interrupt" ||
      (event.type === "phase" && ["paused", "error", "loading"].includes(event.phase))
    )
      this.speech.remove(
        (m) =>
          !(
            event.type === "interrupt" &&
            this.phase === "loading" &&
            !this.started &&
            m.key === "activation"
          ),
      );
    if (event.type === "phase" && event.phase === "preparing")
      this.speech.remove((m) => m.key.startsWith("countdown:"));
    if (event.type === "tracking-lost") this.speech.remove((m) => !!m.common);
    this.events.push(event);
  }
  configure(settings: VoiceSettings) {
    // Consume past repetitions before an opt-in, so old progress is never replayed.
    this.tick();
    this.speech.configure(settings);
    this.resetEvidence();
  }
  private resetEvidence() {
    this.issues.clear();
    this.repeatedIssues.clear();
    this.goodStreak = 0;
    this.postureKey = "";
    this.missingSince = null;
  }
  private tracked() {
    return !!this.raw && this.raw.result.tracking && this.now() - this.raw.at <= RULES.maxGapMs;
  }
  private common(
    key: string,
    text: string,
    priority: number,
    valid: () => boolean,
    repeatMs = 24000,
  ) {
    this.speech.offer({
      key,
      text,
      priority,
      expires: this.now() + 3000,
      common: true,
      repeatMs,
      valid: () => this.active && this.phase === "running" && valid(),
    });
  }
  private repetition(event: RepetitionEvent, total: number) {
    if (this.seen.has(event.id)) return;
    this.seen.add(event.id);
    if (this.phase !== "running") return;
    if (total > 0 && total % 5 === 0 && !this.milestones.has(total)) {
      this.milestones.add(total);
      this.speech.offer({
        key: `milestone:${total}`,
        text: `${total} repetições!`,
        priority: 60,
        expires: this.now() + 8000,
        valid: () => this.active && this.phase === "running",
      });
    }
    const current = new Set(event.issues);
    this.repeatedIssues.clear();
    for (const key of this.issues.keys()) if (!current.has(key)) this.issues.delete(key);
    for (const key of current) {
      const count = (this.issues.get(key) ?? 0) + 1;
      this.issues.set(key, count);
      if (count >= 2 && corrections[key]) this.repeatedIssues.add(key);
    }
    for (const key of this.repeatedIssues) {
      this.common(key, corrections[key]!, 20, () => this.tracked() && this.repeatedIssues.has(key));
      break;
    }
    this.goodStreak = event.correct ? this.goodStreak + 1 : 0;
    if (this.goodStreak >= 3 && total % 5 !== 0)
      this.common(
        "encouragement",
        "Muito bem, continue!",
        10,
        () => this.tracked() && this.goodStreak >= 3,
        30000,
      );
  }
  tick() {
    for (const event of this.events.splice(0)) {
      if (event.type === "interrupt" || event.type === "tracking-lost") {
        this.resetEvidence();
        this.raw = null;
        continue;
      }
      if (event.type === "phase") {
        if (this.phase === event.phase) continue;
        if (this.phase === "countdown" && event.phase !== "running") {
          this.cancelledAt = this.now();
          this.speech.remove((m) => m.key.startsWith("countdown:"));
        }
        this.phase = event.phase;
        if (event.phase === "countdown") {
          this.attempt++;
          this.silentCountdown = this.now() - this.cancelledAt < 8000;
        }
        if (event.phase === "running") {
          this.speech.remove((m) => m.key.startsWith("countdown:") || m.key === "activation");
          this.speech.offer({
            key: `start:${this.attempt}`,
            text: this.started ? "Vamos continuar!" : "Vamos começar!",
            priority: 100,
            expires: this.now() + 3000,
            valid: () => this.active && this.phase === "running",
          });
          this.started = true;
        }
      } else if (event.type === "countdown") this.countdown = event.value;
      else if (event.type === "repetition") this.repetition(event.event, event.total);
    }
    if (this.active && this.phase === "countdown" && this.countdown <= 3 && !this.silentCountdown) {
      const value = this.countdown,
        attempt = this.attempt,
        key = `countdown:${attempt}:${value}`;
      if (!this.spokenSeconds.has(key)) {
        this.spokenSeconds.add(key);
        this.speech.offer({
          key,
          text: ["", "Um", "Dois", "Três"][value]!,
          priority: 80,
          expires: this.now() + 1000,
          valid: () =>
            this.active &&
            this.phase === "countdown" &&
            this.attempt === attempt &&
            this.countdown === value,
        });
      }
    }
    if (this.active && this.phase === "running") {
      if (!this.tracked()) {
        this.postureKey = "";
        this.issues.clear();
        this.repeatedIssues.clear();
        this.goodStreak = 0;
        this.missingSince ??= this.now();
        if (this.now() - this.missingSince >= 1500)
          this.common("tracking", "Volte ao enquadramento da câmera.", 50, () => !this.tracked());
      } else {
        this.missingSince = null;
        const key = this.raw!.result.message;
        if (!posture.has(key)) this.postureKey = "";
        else {
          if (key !== this.postureKey) {
            this.postureKey = key;
            this.postureSince = this.now();
          }
          if (this.now() - this.postureSince >= 1200)
            this.common(
              key,
              corrections[key]!,
              20,
              () => this.tracked() && this.raw?.result.message === key,
            );
        }
      }
    }
    this.speech.tick();
  }
  finish() {
    this.tick();
    this.stop();
    this.terminal = true;
    this.speech.offer({
      key: "finish",
      text: "Treino encerrado",
      priority: 100,
      expires: this.now() + 3000,
      valid: () => this.terminal,
      done: () => {
        this.terminal = false;
      },
    });
  }
  stop() {
    this.active = this.terminal = false;
    this.events = [];
    this.raw = null;
    this.resetEvidence();
    this.speech.clear();
  }
}
