/** Local 2D heuristics, not a clinically validated biomechanical assessment. */
export type Landmark = { x: number; y: number; z: number; visibility: number };
export type FrameSize = { width: number; height: number };
export type AnalysisFrame = FrameSize & { landmarks: Landmark[]; timestamp: number };
export type ExerciseId = "squat" | "pushup" | "jumpingjack";
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
} as const;
export type RepetitionEvent = {
  id: number;
  type: "repetition";
  correct: boolean;
  issues: string[];
  timestamp: number;
};
export type AnalysisEvent =
  RepetitionEvent | { id: number; type: "interrupted"; timestamp: number };
export type AnalysisResult = {
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
function visible(lms: Landmark[], indices: number[]) {
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
}
abstract class BendAnalyzer extends Analyzer {
  private deep = false;
  private posture = false;
  protected abstract kind: "squat" | "pushup";
  protected override resetCycle() {
    this.deep = false;
    this.posture = false;
  }
  override analyze(frame: AnalysisFrame, count = true): AnalysisResult {
    if (!this.begin(frame)) return this.missing(frame);
    const l = frame.landmarks;
    const needs = this.kind === "squat" ? [11, 23, 25, 27] : [11, 13, 15, 23, 25];
    if (!this.side) {
      const scores = [0, 1].map((offset) =>
        visible(
          l,
          needs.map((i) => i + offset),
        )
          ? Math.min(...needs.map((i) => l[i + offset]!.visibility))
          : -1,
      );
      if (Math.max(...scores) < 0) return this.missing(frame);
      this.side = scores[1]! > scores[0]! ? "right" : "left";
    }
    const offset = this.side === "right" ? 1 : 0;
    if (
      !visible(
        l,
        needs.map((i) => i + offset),
      )
    )
      return this.missing(frame);
    const get = (i: number) => l[i + offset]!;
    const angle =
      this.kind === "squat"
        ? calculateAngle(get(23), get(25), get(27), frame)
        : calculateAngle(get(11), get(13), get(15), frame);
    const posture =
      this.kind === "squat"
        ? verticalInclination(get(11), get(23), frame)
        : calculateAngle(get(11), get(23), get(25), frame);
    if (angle === null || posture === null) return this.missing(frame);
    const now = frame.timestamp;
    const baseline = this.kind === "squat" ? "standing" : "high";
    if (!count && angle < RULES.exit) {
      this.resetPartial(now);
      return this.result("Retorne à posição inicial", "posture");
    }
    if (!this.armed) {
      if (this.stable("baseline", angle >= RULES.exit, now, RULES.baselineMs)) {
        this.armed = true;
        this.state = baseline;
      }
      return this.result(
        this.armed ? "Posição inicial reconhecida" : "Mantenha a posição inicial por um instante",
        "posture",
      );
    }
    if (!count) return this.result("Pronto para começar", "good");
    if (!this.active && this.stable("enter", angle < RULES.enter, now)) {
      this.active = true;
      this.state = "descending";
    }
    if (this.active) {
      const off = this.kind === "squat" ? posture > 40 : Math.abs(180 - posture) > 25;
      if (this.stable("posture", off, now)) this.posture = true;
      if (this.stable("depth", angle <= RULES.depth, now, RULES.depthMs)) {
        this.deep = true;
        this.state = this.kind === "squat" ? "squat" : "low";
      }
      if (this.stable("exit", angle >= RULES.exit, now)) {
        const issues: string[] = [];
        if (!this.deep)
          issues.push(
            this.kind === "squat"
              ? "Amplie a descida do agachamento"
              : "Amplie a descida da flexão",
          );
        if (this.posture)
          issues.push(
            this.kind === "squat"
              ? "Revise a inclinação do tronco"
              : "Revise o alinhamento do corpo",
          );
        this.complete(issues, now);
        this.state = baseline;
        return this.result(
          issues[0] ?? "Repetição dentro dos critérios",
          issues.length ? "range" : "good",
        );
      }
      if (off)
        return this.result(
          this.kind === "squat" ? "Revise a inclinação do tronco" : "Revise o alinhamento do corpo",
          "posture",
        );
      return this.result(
        this.deep
          ? "Amplitude reconhecida. Retorne à posição inicial."
          : "Continue a descida com controle",
        this.deep ? "good" : "range",
      );
    }
    return this.result("Pronto para a próxima repetição", "posture");
  }
}
export class SquatAnalyzer extends BendAnalyzer {
  protected kind = "squat" as const;
}
export class PushUpAnalyzer extends BendAnalyzer {
  protected kind = "pushup" as const;
}
export class JumpingJackAnalyzer extends Analyzer {
  private opened = false;
  private arms = false;
  private legs = false;
  protected override resetCycle() {
    this.opened = false;
    this.arms = false;
    this.legs = false;
  }
  override analyze(frame: AnalysisFrame, count = true): AnalysisResult {
    if (!this.begin(frame)) return this.missing(frame);
    const l = frame.landmarks;
    if (!visible(l, [0, 11, 12, 15, 16, 27, 28])) return this.missing(frame);
    const shoulder = Math.abs(l[11]!.x - l[12]!.x);
    if (shoulder < 0.03) return this.missing(frame);
    const distance = Math.abs(l[27]!.x - l[28]!.x);
    const armsUp = l[15]!.y < l[0]!.y && l[16]!.y < l[0]!.y;
    const armsDown = l[15]!.y > l[11]!.y && l[16]!.y > l[12]!.y;
    const feetOpen = distance > shoulder * 1.2,
      feetClosed = distance < shoulder * 0.9;
    const closed = armsDown && feetClosed,
      now = frame.timestamp;
    if (!count && !closed) {
      this.resetPartial(now);
      return this.result("Comece com braços baixos e pés juntos", "posture");
    }
    if (!this.armed) {
      if (this.stable("baseline", closed, now, RULES.baselineMs)) {
        this.armed = true;
        this.state = "closed";
      }
      return this.result(
        this.armed ? "Posição inicial reconhecida" : "Comece com braços baixos e pés juntos",
        "posture",
      );
    }
    if (!count) return this.result("Pronto para começar", "good");
    if (!this.active && this.stable("enter", armsUp || feetOpen, now)) {
      this.active = true;
      this.state = "opening";
    }
    if (this.active) {
      this.arms ||= armsUp;
      this.legs ||= feetOpen;
      if (this.stable("open", armsUp && feetOpen, now, RULES.depthMs)) {
        this.opened = true;
        this.state = "open";
      }
      if (this.stable("exit", closed, now)) {
        const issues = this.opened
          ? []
          : !this.arms
            ? ["Eleve os braços acima da cabeça"]
            : !this.legs
              ? ["Abra mais as pernas"]
              : ["Abra braços e pernas ao mesmo tempo"];
        this.complete(issues, now);
        this.state = "closed";
        return this.result(
          issues[0] ?? "Repetição dentro dos critérios",
          issues.length ? "range" : "good",
        );
      }
      return this.result(
        this.opened
          ? "Abertura reconhecida. Feche o movimento."
          : "Abra braços e pernas ao mesmo tempo",
        this.opened ? "good" : "range",
      );
    }
    return this.result("Pronto para a próxima repetição", "posture");
  }
}
export function createAnalyzer(id: ExerciseId): Analyzer {
  return id === "squat"
    ? new SquatAnalyzer()
    : id === "pushup"
      ? new PushUpAnalyzer()
      : new JumpingJackAnalyzer();
}
export const POSE_CONNECTIONS: [number, number][] = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
  [27, 31],
  [28, 32],
  [27, 29],
  [28, 30],
  [29, 31],
  [30, 32],
  [0, 11],
  [0, 12],
];
