import { RULES_VERSION, type AnalysisEvent, type ExerciseId } from "./biomech";
import { LEGACY_ENGINE_ID } from "./mediapipe";
export type SessionReport = {
  schemaVersion: 1;
  id: string;
  createdAt: string;
  exercise: ExerciseId;
  seconds: number;
  totalReps: number;
  correctReps: number;
  feedbackCounts: Record<string, number>;
  interruptedCycles: number;
  trackingLosses: number;
  rulesVersion: string;
  engineVersion: string;
};
export function formatTime(seconds: number) {
  const whole = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
}
export class ActiveClock {
  private accumulated = 0;
  private since: number | null = null;
  setRunning(running: boolean, now: number) {
    if (running && this.since === null) this.since = now;
    if (!running && this.since !== null) {
      this.accumulated += Math.max(0, now - this.since);
      this.since = null;
    }
  }
  seconds(now: number) {
    return Math.floor(
      (this.accumulated + (this.since === null ? 0 : Math.max(0, now - this.since))) / 1000,
    );
  }
}
export class SessionLedger {
  readonly clock = new ActiveClock();
  private seen = new Set<number>();
  private previousTracking: boolean | null = null;
  private report: SessionReport;
  constructor(exercise: ExerciseId, engineVersion = LEGACY_ENGINE_ID) {
    this.report = {
      schemaVersion: 1,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      exercise,
      seconds: 0,
      totalReps: 0,
      correctReps: 0,
      feedbackCounts: {},
      interruptedCycles: 0,
      trackingLosses: 0,
      rulesVersion: RULES_VERSION,
      engineVersion,
    };
  }
  consume(event: AnalysisEvent | null) {
    if (!event || this.seen.has(event.id)) return;
    this.seen.add(event.id);
    if (event.type === "interrupted") {
      this.report.interruptedCycles++;
      return;
    }
    this.report.totalReps++;
    if (event.correct) this.report.correctReps++;
    for (const issue of new Set(event.issues))
      this.report.feedbackCounts[issue] = (this.report.feedbackCounts[issue] ?? 0) + 1;
  }
  tracking(visible: boolean) {
    if (this.previousTracking === true && !visible) this.report.trackingLosses++;
    this.previousTracking = visible;
  }
  resetTracking() {
    this.previousTracking = null;
  }
  snapshot(now: number): SessionReport {
    return {
      ...this.report,
      seconds: this.clock.seconds(now),
      feedbackCounts: { ...this.report.feedbackCounts },
    };
  }
}
