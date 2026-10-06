import { CatalogAnalyzer } from "./catalog-analyzers";
import { Confirmations, MODERN_TIMING as TIME } from "./temporal";
import { PARAMETERS, type Side } from "./movement-measures";
import type { AnalysisFrame, AnalysisResult, FeedbackLevel } from "./core";
export class IsometricAnalyzer extends CatalogAnalyzer {
  private acquisition = new Confirmations();
  private valid = false;
  private acquired = false;
  private lastValid: number | null = null;
  private invalidSince: number | null = null;
  private validMs = 0;
  private bySide = { left: 0, right: 0 };
  constructor(
    id: "wallsit" | "sideplank",
    private graceMs: number = TIME.holdGraceMs,
  ) {
    super(id);
  }
  protected override resetCycle() {
    super.resetCycle();
    this.acquisition?.clear();
    this.valid = this.acquired = false;
    this.lastValid = this.invalidSince = null;
  }
  protected override result(
    message: string,
    level: FeedbackLevel,
    tracking = true,
  ): AnalysisResult {
    return {
      ...super.result(message, level, tracking),
      measurement: {
        type: "HOLD_BASED",
        valid: this.valid,
        validMs: this.validMs,
        ...(this.exercise === "sideplank" ? { validMsBySide: { ...this.bySide } } : {}),
      },
    };
  }
  override analyze(f: AnalysisFrame, count = true): AnalysisResult {
    const before = this.lastFrame,
      g = this.geometry(f);
    if (!g) return this.missing(f);
    if (before !== null && f.timestamp === before)
      return this.result("Aguardando novo frame", "warning");
    const side: Side =
        this.exercise === "sideplank"
          ? this.selected
          : g.f.landmarks[11]!.visibility >= g.f.landmarks[12]!.visibility
            ? "left"
            : "right",
      o = side === "left" ? 0 : 1,
      now = f.timestamp;
    this.side = this.exercise === "sideplank" ? side : null;
    let acceptable = false;
    if (this.exercise === "wallsit") {
      const c = PARAMETERS.wallsit;
      acceptable =
        g.tilt(o) <= c.torso &&
        [0, 1].every((i) => {
          const k = g.angle(23 + i, 25 + i, 27 + i),
            hip = g.angle(11 + i, 23 + i, 25 + i);
          return (
            k >= (this.acquired ? c.exitMin : c.kneeMin) &&
            k <= (this.acquired ? c.exitMax : c.kneeMax) &&
            hip >= 65 &&
            hip <= 120 &&
            g.p(27 + i).y > g.p(25 + i).y
          );
        });
    } else {
      const c = PARAMETERS.sideplank,
        body = g.angle(11 + o, 23 + o, 27 + o),
        knee = g.angle(23 + o, 25 + o, 27 + o),
        elbow = g.angle(11 + o, 13 + o, 15 + o),
        t = g.torso(o),
        stack = Math.abs(g.p(11).y - g.p(12).y) / t;
      acceptable =
        body >= (this.acquired ? c.exitAlignment : c.alignment) &&
        knee >= 155 &&
        g.angle(23 + 1 - o, 25 + 1 - o, 27 + 1 - o) >= 155 &&
        elbow >= c.elbowMin &&
        elbow <= c.elbowMax &&
        g.horizontal(11 + o, 27 + o) < 0.45 &&
        g.p(13 + o).y > g.p(11 + o).y &&
        g.p(11 + o).y > g.p(11 + 1 - o).y &&
        stack >= c.shoulderStack;
    }
    this.armed = true;
    if (!count) {
      this.acquired = this.valid = false;
      this.lastValid = this.invalidSince = null;
      this.acquisition.clear();
    } else if (!acceptable) {
      this.valid = false;
      this.lastValid = null;
      this.invalidSince ??= now;
      if (!this.acquired) this.acquisition.clear();
      if (now - this.invalidSince > this.graceMs) {
        this.acquired = false;
        this.acquisition.clear();
      }
    } else {
      this.invalidSince = null;
      if (!this.acquired && this.acquisition.check("valid", true, now, TIME.holdStableMs))
        this.acquired = true;
      if (this.acquired) {
        if (this.lastValid !== null) {
          const delta = now - this.lastValid;
          this.validMs += delta;
          if (this.exercise === "sideplank") this.bySide[side] += delta;
        }
        this.lastValid = now;
        this.valid = true;
      }
    }
    this.state = this.valid ? "holding" : "adjusting";
    return this.result(
      this.valid
        ? "Postura reconhecida; contando tempo"
        : acceptable
          ? "Mantenha a posição por um instante"
          : "Tempo pausado: revise a posição observada ou o enquadramento",
      this.valid ? "good" : "posture",
    );
  }
}
