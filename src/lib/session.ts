import { type AnalysisEvent, type AnalysisResult, type ExerciseId } from "./biomech";
import { EXERCISE_BY_ID } from "./exercises/catalog";
import { LEGACY_ENGINE_ID } from "./mediapipe";
type SessionBase = {
  sideResults?: {
    left: { totalReps: number; correctReps: number; validSeconds: number };
    right: { totalReps: number; correctReps: number; validSeconds: number };
  };
  id: string;
  createdAt: string;
  exercise: ExerciseId;
  seconds: number;
  feedbackCounts: Record<string, number>;
  interruptedCycles: number;
  trackingLosses: number;
  rulesVersion: string;
  engineVersion: string;
};
export type RepetitionLog = {
  version: 1;
  events: {
    id: number;
    activeSeconds: number;
    correct: boolean;
    issues: string[];
    side?: "left" | "right";
  }[];
};
export type SessionReport = SessionBase &
  (
    | {
        schemaVersion: 1;
        type?: "REP_BASED";
        totalReps: number;
        correctReps: number;
        repetitionLog?: RepetitionLog;
        validSeconds?: never;
      }
    | {
        schemaVersion: 2;
        type: "REP_BASED";
        totalReps: number;
        correctReps: number;
        repetitionLog?: RepetitionLog;
        validSeconds?: never;
      }
    | {
        schemaVersion: 2;
        type: "HOLD_BASED";
        validSeconds: number;
        totalReps?: never;
        correctReps?: never;
        repetitionLog?: never;
      }
  );
export function formatTime(seconds: number) {
  const whole = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
}
export const isHold = (report: { type?: string }) => report.type === "HOLD_BASED";
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
  private readonly base: SessionBase;
  private totalReps = 0;
  private correctReps = 0;
  private validMs = 0;
  private log: RepetitionLog = { version: 1, events: [] };
  private sideResults = {
    left: { totalReps: 0, correctReps: 0, validSeconds: 0 },
    right: { totalReps: 0, correctReps: 0, validSeconds: 0 },
  };
  constructor(
    private exercise: ExerciseId,
    engineVersion = LEGACY_ENGINE_ID,
  ) {
    this.base = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      exercise,
      seconds: 0,
      feedbackCounts: {},
      interruptedCycles: 0,
      trackingLosses: 0,
      rulesVersion: EXERCISE_BY_ID[exercise].rulesVersion,
      engineVersion,
    };
  }
  consume(event: AnalysisEvent | null) {
    if (!event || this.seen.has(event.id)) return;
    this.seen.add(event.id);
    if (event.type === "interrupted") {
      this.base.interruptedCycles++;
      return;
    }
    if (event.type === "hold-issue") {
      this.base.feedbackCounts[event.issue] = (this.base.feedbackCounts[event.issue] ?? 0) + 1;
      return;
    }
    this.totalReps++;
    if (event.correct) this.correctReps++;
    if (event.side) {
      this.sideResults[event.side].totalReps++;
      if (event.correct) this.sideResults[event.side].correctReps++;
    }
    this.log.events.push({
      id: event.id,
      activeSeconds: this.clock.seconds(event.timestamp),
      correct: event.correct,
      issues: [...new Set(event.issues)],
      ...(event.side ? { side: event.side } : {}),
    });
    for (const issue of new Set(event.issues))
      this.base.feedbackCounts[issue] = (this.base.feedbackCounts[issue] ?? 0) + 1;
  }
  observe(result: AnalysisResult) {
    if (result.measurement?.type === "HOLD_BASED") {
      this.validMs = result.measurement.validMs;
      if (result.measurement.validMsBySide)
        for (const side of ["left", "right"] as const)
          this.sideResults[side].validSeconds = result.measurement.validMsBySide[side] / 1000;
    }
  }
  tracking(visible: boolean) {
    if (this.previousTracking === true && !visible) this.base.trackingLosses++;
    this.previousTracking = visible;
  }
  resetTracking() {
    this.previousTracking = null;
  }
  snapshot(now: number): SessionReport {
    const base = {
      ...this.base,
      seconds: this.clock.seconds(now),
      feedbackCounts: { ...this.base.feedbackCounts },
      schemaVersion: 2 as const,
      ...(EXERCISE_BY_ID[this.exercise].sideMode
        ? {
            sideResults: {
              left: { ...this.sideResults.left },
              right: { ...this.sideResults.right },
            },
          }
        : {}),
    };
    return EXERCISE_BY_ID[this.exercise].type === "HOLD_BASED"
      ? { ...base, type: "HOLD_BASED", validSeconds: this.validMs / 1000 }
      : {
          ...base,
          type: "REP_BASED",
          totalReps: this.totalReps,
          correctReps: this.correctReps,
          repetitionLog: {
            version: 1,
            events: this.log.events.map((e) => ({ ...e, issues: [...e.issues] })),
          },
        };
  }
}
