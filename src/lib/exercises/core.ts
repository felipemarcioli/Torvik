/** Local 2D heuristics, not a clinically validated biomechanical assessment. */
export type Landmark = { x: number; y: number; z: number; visibility: number };
export type FrameSize = { width: number; height: number };
export type AnalysisFrame = FrameSize & { landmarks: Landmark[]; timestamp: number };
export type { ExerciseId } from "./catalog";
export type FeedbackLevel = "good" | "range" | "posture" | "warning";
export const RULES_VERSION = "2.0.0";
export const VIS_THRESHOLD = 0.5;
// Engineering defaults: validate against annotated recordings before performance claims.
export const RULES = {
  baselineMs: 300,
  transitionMs: 150,
  depthMs: 100,
  enter: 150,
  exit: 160,
  depth: 90,
  maxGapMs: 750,
} as const;
export const LM = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;
export type RepetitionEvent = {
  side?: "left" | "right";
  id: number;
  type: "repetition";
  correct: boolean;
  issues: string[];
  timestamp: number;
};
export type AnalysisEvent =
  | RepetitionEvent
  | { id: number; type: "hold-issue"; issue: string; timestamp: number }
  | { id: number; type: "interrupted"; timestamp: number };
export type AnalysisResult = {
  measurement?:
    | { type: "REP_BASED" }
    | {
        type: "HOLD_BASED";
        valid: boolean;
        validMs: number;
        validMsBySide?: { left: number; right: number };
      };
  message: string;
  level: FeedbackLevel;
  state: string;
  totalReps: number;
  correctReps: number;
  tracking: boolean;
  ready: boolean;
  event: AnalysisEvent | null;
  side: "left" | "right" | null;
};
const finitePoint = (p: Landmark | undefined): p is Landmark =>
  !!p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.visibility);
const validSize = (s: FrameSize) =>
  Number.isFinite(s.width) && Number.isFinite(s.height) && s.width > 0 && s.height > 0;
export function calculateAngle(
  a: Landmark,
  b: Landmark,
  c: Landmark,
  size: FrameSize,
): number | null {
  if (!validSize(size) || ![a, b, c].every(finitePoint)) return null;
  const bax = (a.x - b.x) * size.width,
    bay = (a.y - b.y) * size.height;
  const bcx = (c.x - b.x) * size.width,
    bcy = (c.y - b.y) * size.height;
  const magnitude = Math.hypot(bax, bay) * Math.hypot(bcx, bcy);
  if (magnitude < 1e-8) return null;
  return (
    (Math.acos(Math.max(-1, Math.min(1, (bax * bcx + bay * bcy) / magnitude))) * 180) / Math.PI
  );
}
export function verticalInclination(
  top: Landmark,
  bottom: Landmark,
  size: FrameSize,
): number | null {
  if (!validSize(size) || !finitePoint(top) || !finitePoint(bottom)) return null;
  const dx = (top.x - bottom.x) * size.width,
    dy = (top.y - bottom.y) * size.height;
  const mag = Math.hypot(dx, dy);
  return mag < 1e-8 ? null : (Math.acos(Math.max(-1, Math.min(1, -dy / mag))) * 180) / Math.PI;
}
export function visible(lms: Landmark[], indices: number[]) {
  return indices.every((i) => {
    const p = lms[i];
    return (
      finitePoint(p) &&
      p.visibility >= VIS_THRESHOLD &&
      p.x >= 0 &&
      p.x <= 1 &&
      p.y >= 0 &&
      p.y <= 1
    );
  });
}
export abstract class Analyzer {
  totalReps = 0;
  correctReps = 0;
  state = "positioning";
  protected side: "left" | "right" | null = null;
  protected armed = false;
  protected active = false;
  protected sequence = 0;
  protected event: AnalysisEvent | null = null;
  private holds = new Map<string, number>();
  private lastTimestamp: number | null = null;
  protected stable(
    key: string,
    condition: boolean,
    now: number,
    duration: number = RULES.transitionMs,
  ): boolean {
    if (!condition) {
      this.holds.delete(key);
      return false;
    }
    if (!this.holds.has(key)) this.holds.set(key, now);
    return now - (this.holds.get(key) ?? now) >= duration;
  }
  resetPartial(timestamp = 0): AnalysisEvent | null {
    const interrupted: AnalysisEvent | null = this.active
      ? { id: ++this.sequence, type: "interrupted", timestamp }
      : null;
    this.active = false;
    this.armed = false;
    this.side = null;
    this.state = "positioning";
    this.holds.clear();
    this.lastTimestamp = null;
    this.resetCycle();
    return interrupted;
  }
  protected abstract resetCycle(): void;
  protected begin(frame: AnalysisFrame): boolean {
    this.event = null;
    if (!validSize(frame) || !Number.isFinite(frame.timestamp)) return false;
    if (
      this.lastTimestamp !== null &&
      (frame.timestamp < this.lastTimestamp ||
        frame.timestamp - this.lastTimestamp > RULES.maxGapMs)
    ) {
      this.event = this.resetPartial(frame.timestamp);
    }
    this.lastTimestamp = frame.timestamp;
    return true;
  }
  protected missing(frame: AnalysisFrame): AnalysisResult {
    this.event = this.resetPartial(frame.timestamp) ?? this.event;
    return this.result("Ajuste a câmera para mostrar os pontos necessários", "warning", false);
  }
  protected result(message: string, level: FeedbackLevel, tracking = true): AnalysisResult {
    return {
      message,
      level,
      state: this.state,
      totalReps: this.totalReps,
      correctReps: this.correctReps,
      tracking,
      ready: this.armed,
      event: this.event,
      side: this.side,
    };
  }
  protected complete(issues: string[], now: number) {
    this.totalReps++;
    if (!issues.length) this.correctReps++;
    this.event = {
      id: ++this.sequence,
      type: "repetition",
      correct: !issues.length,
      issues,
      timestamp: now,
    };
    this.active = false;
    this.holds.clear();
    this.resetCycle();
  }
  abstract analyze(frame: AnalysisFrame, count?: boolean): AnalysisResult;
  /** Optional explicit anatomical side; existing analyzers retain automatic selection. */
  selectSide(_side: "left" | "right", timestamp = 0) {
    return this.resetPartial(timestamp);
  }
}
