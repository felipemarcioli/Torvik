import { Analyzer, type AnalysisFrame, type AnalysisResult, type FeedbackLevel } from "./core";
import { EXERCISE_BY_ID } from "./catalog";
import type { AdditionId } from "./additions";
import { Confirmations, MeasureFilter, MODERN_TIMING as TIME } from "./temporal";
import {
  Geometry,
  REQUIRED,
  PARAMETERS,
  MODERN_FEEDBACK,
  sampleMovement,
  type Side,
  type MovementSample,
} from "./movement-measures";
type Slot = {
  armed: boolean;
  active: boolean;
  reached: boolean;
  confirmations: Confirmations;
  issues: Set<string>;
};
const slot = (): Slot => ({
  armed: false,
  active: false,
  reached: false,
  confirmations: new Confirmations(),
  issues: new Set(),
});
export class CatalogAnalyzer extends Analyzer {
  protected filter = new MeasureFilter();
  protected selected: Side = "left";
  protected lastFrame: number | null = null;
  protected reference: Record<string, number> = {};
  private slots: Record<Side, Slot> = { left: slot(), right: slot() };
  private expected: Side | null = null;
  private confirmations = new Confirmations();
  private jumpPhase: "base" | "squat" | "air" | "landing" = "base";
  private skaterStart: number | null = null;
  private skaterOrigin: number | null = null;
  private skaterDirection: Side | null = null;
  constructor(readonly exercise: AdditionId) {
    super();
  }
  protected override resetCycle() {
    this.filter.clear();
    this.lastFrame = null;
    this.reference = {};
    this.slots = { left: slot(), right: slot() };
    this.expected = null;
    this.confirmations.clear();
    this.jumpPhase = "base";
    this.skaterStart = this.skaterOrigin = null;
    this.skaterDirection = null;
  }
  override selectSide(side: Side, timestamp = 0) {
    const event = this.resetPartial(timestamp);
    this.selected = side;
    return event;
  }
  protected geometry(f: AnalysisFrame): Geometry | null {
    if (!this.begin(f)) return null;
    if (this.lastFrame !== null && f.timestamp - this.lastFrame > TIME.maxGapMs)
      this.event = this.resetPartial(f.timestamp) ?? this.event;
    const g = new Geometry(f, this.filter);
    const needs = [...REQUIRED[this.exercise]];
    if (this.exercise === "sideplank")
      needs.push(...(this.selected === "left" ? [13, 15] : [14, 16]));
    if (!g.visible(needs)) return null;
    this.lastFrame = f.timestamp;
    return g;
  }
  private record(actor: Side | null, issues: string[], now: number) {
    this.totalReps++;
    if (!issues.length) this.correctReps++;
    this.event = {
      id: ++this.sequence,
      type: "repetition",
      correct: !issues.length,
      issues,
      timestamp: now,
      ...(actor ? { side: actor } : {}),
    };
    this.side = actor;
  }
  override analyze(f: AnalysisFrame, count = true): AnalysisResult {
    const before = this.lastFrame,
      g = this.geometry(f);
    if (!g) return this.missing(f);
    if (before !== null && f.timestamp === before)
      return this.result("Aguardando novo frame", "warning");
    if (this.exercise === "jumpsquat") return this.jump(g, count);
    if (this.exercise === "skater") return this.skater(g, count);
    const mode = EXERCISE_BY_ID[this.exercise].sideMode;
    const actors: Side[] =
      mode === "alternating" ? ["left", "right"] : [mode === "selected" ? this.selected : "left"];
    const samples = actors.map((actor) => ({
      actor,
      s: sampleMovement(this.exercise, g, actor, this.reference),
    }));
    if (!samples.some(({ s }) => s.eligible)) {
      this.event = this.resetPartial(f.timestamp) ?? this.event;
      return this.result(
        "Volte à posição inicial indicada; ajuste a diagonal da câmera",
        "posture",
      );
    }
    let completed = false,
      partial = false;
    for (const { actor, s } of samples) {
      const z = this.slots[actor],
        now = f.timestamp;
      if (!s.eligible) {
        this.slots[actor] = slot();
        continue;
      }
      if (s.base && this.exercise === "stepjack" && !z.active)
        this.reference[`ankleX:${actor === "left" ? 0 : 1}`] = g.p(actor === "left" ? 27 : 28).x;
      if (!count) {
        this.slots[actor] = slot();
        this.slots[actor].armed = z.confirmations.check("baseline", s.base, now, TIME.baselineMs);
        this.slots[actor].confirmations = z.confirmations;
        continue;
      }
      if (!z.armed) {
        if (z.confirmations.check("baseline", s.base, now, TIME.baselineMs)) z.armed = true;
        if (s.base && this.exercise === "stepjack") {
          this.reference[`ankleX:${actor === "left" ? 0 : 1}`] = g.p(actor === "left" ? 27 : 28).x;
        }
        continue;
      }
      if (!z.active && this.expected && actor !== this.expected) continue;
      if (!z.active && z.confirmations.check("entry", s.enter, now, TIME.transitionMs)) {
        z.active = true;
        this.side = mode ? actor : null;
      }
      if (z.active) {
        if (z.confirmations.check("target", s.target, now, TIME.targetMs)) z.reached = true;
        for (const issue of Object.values(MODERN_FEEDBACK))
          if (z.confirmations.check(issue, s.issues.includes(issue), now, TIME.transitionMs))
            z.issues.add(issue);
        if (z.confirmations.check("return", s.base, now, TIME.returnMs)) {
          if (z.reached && !completed) {
            this.record(mode ? actor : null, [...z.issues], now);
            completed = true;
            this.expected = mode === "alternating" ? (actor === "left" ? "right" : "left") : null;
          } else partial = true;
          this.slots[actor] = slot();
          this.slots[actor].armed = true;
        }
      }
    }
    this.armed = actors.some((a) => this.slots[a].armed);
    this.active = actors.some((a) => this.slots[a].active);
    this.state = this.active
      ? actors.some((a) => this.slots[a].reached)
        ? "target"
        : "moving"
      : this.armed
        ? "baseline"
        : "positioning";
    if (mode === "selected") this.side = this.selected;
    return this.result(
      completed
        ? (this.event?.type === "repetition" && this.event.issues[0]) ||
            "Ciclo completo reconhecido"
        : partial
          ? "Movimento incompleto: repetição não contada"
          : !this.armed
            ? "Mantenha a posição inicial por um instante"
            : this.expected && !this.active
              ? `Alterne para o lado ${this.expected === "left" ? "esquerdo" : "direito"}`
              : this.active
                ? "Complete o movimento e retorne"
                : "Posição inicial reconhecida",
      completed && this.event?.type === "repetition" && this.event.issues.length
        ? "posture"
        : partial
          ? "range"
          : completed || this.armed
            ? "good"
            : "posture",
    );
  }
  private jump(g: Geometry, count: boolean) {
    const now = g.f.timestamp,
      c = PARAMETERS.jumpsquat,
      t = g.torso(),
      knees = [0, 1].map((o) => g.angle(23 + o, 25 + o, 27 + o)),
      standing = knees.every((k) => k >= c.base) && g.tilt() < 25;
    const feet = [29, 30, 31, 32];
    if (feet.some((i) => g.distance(i < 31 ? i : i - 2, i < 31 ? i + 2 : i) < 10))
      return this.missing(g.f);
    if (!this.armed) {
      if (this.confirmations.check("base", standing, now, TIME.baselineMs)) {
        this.armed = true;
        this.reference["hipY"] = (g.p(23).y + g.p(24).y) / 2;
        for (const i of feet) this.reference[`foot:${i}`] = g.p(i).y;
      }
      return this.result("Comece em pé, com os dois pés nítidos e câmera fixa", "posture");
    }
    if (!count) {
      if (!standing) this.resetPartial(now);
      return this.result("Posição inicial reconhecida", "good");
    }
    const hipLift = (this.reference["hipY"]! - (g.p(23).y + g.p(24).y) / 2) / t;
    const lifts = feet.map((i) => (this.reference[`foot:${i}`]! - g.p(i).y) / t);
    const lowered = knees.every((k) => k <= c.target),
      air =
        lifts.every((v) => v >= c.footLift) &&
        hipLift >= c.bodyLift &&
        knees.every((k) => k >= 145);
    const back = lifts.every((v) => Math.abs(v) < 0.09) && Math.abs(hipLift) < 0.15;
    if (
      this.jumpPhase === "base" &&
      this.confirmations.check("squat", lowered, now, TIME.transitionMs)
    ) {
      this.jumpPhase = "squat";
      this.active = true;
    }
    if (this.jumpPhase === "squat" && this.confirmations.check("air", air, now, TIME.targetMs))
      this.jumpPhase = "air";
    if (this.jumpPhase === "air" && this.confirmations.check("landing", back, now, TIME.returnMs))
      this.jumpPhase = "landing";
    if (
      this.jumpPhase === "landing" &&
      this.confirmations.check("finish", back && standing, now, TIME.returnMs)
    ) {
      this.record(null, [], now);
      this.active = false;
      this.jumpPhase = "base";
      this.confirmations.clear();
    }
    // A plain squat returning to standing has no flight evidence and is discarded.
    else if (
      this.jumpPhase === "squat" &&
      this.confirmations.check("noJump", back && standing, now, 250)
    ) {
      this.active = false;
      this.jumpPhase = "base";
      this.confirmations.clear();
    }
    this.state =
      this.jumpPhase === "base"
        ? "baseline"
        : this.jumpPhase === "squat"
          ? "squat"
          : this.jumpPhase === "air"
            ? "airborne"
            : "landing";
    return this.result(
      this.event?.type === "repetition"
        ? "Ciclo com elevação dos pés reconhecido"
        : this.jumpPhase === "squat"
          ? "Aguardando elevação do corpo e dos dois pés"
          : "Agache, salte e estabilize o retorno",
      "good",
    );
  }
  private skater(g: Geometry, count: boolean) {
    const now = g.f.timestamp,
      t = g.torso(),
      center = g.ratio("center", (g.p(23).x + g.p(24).x) / 2),
      c = PARAMETERS.skater;
    if (g.tilt() > 40) return this.missing(g.f);
    const spread = g.distance(27, 28) / t;
    if (!this.armed) {
      if (this.confirmations.check("base", spread < 1.5, now, TIME.baselineMs)) {
        this.armed = true;
        this.skaterOrigin = center;
        this.skaterStart = center;
      }
      return this.result("Estabilize a posição inicial com espaço nos dois lados", "posture");
    }
    if (!count) {
      this.skaterOrigin = this.skaterStart = center;
      return this.result("Posição inicial reconhecida", "good");
    }
    const shift = (center - this.skaterOrigin!) / t;
    const direction = shift > 0 ? "right" : "left";
    if (
      !this.active &&
      Math.abs(shift) >= c.displacement &&
      this.confirmations.check(
        "move",
        !this.expected || direction === this.expected,
        now,
        TIME.transitionMs,
      )
    ) {
      this.active = true;
      this.skaterDirection = direction;
    }
    if (this.active) {
      // Anatomical landing leg inferred by shoulder ordering, invariant to horizontal reflection.
      const rightward = this.skaterDirection === "right",
        rightImage = g.p(12).x > g.p(11).x;
      const actor: Side = rightward === rightImage ? "right" : "left",
        o = actor === "left" ? 0 : 1;
      const cross = (g.p(27 + 1 - o).x - g.p(27 + o).x) * (g.p(11 + o).x - g.p(11 + 1 - o).x) > 0;
      const bent = g.angle(23 + o, 25 + o, 27 + o) < 155;
      const stable = Math.abs(center - (this.skaterStart ?? center)) / t < 0.08;
      this.skaterStart = center;
      if (this.confirmations.check("arrival", cross && bent && stable, now, c.settleMs)) {
        this.record(actor, [], now);
        this.active = false;
        this.expected = this.skaterDirection === "left" ? "right" : "left";
        this.skaterOrigin = center;
        this.skaterDirection = null;
        this.confirmations.clear();
      }
    }
    this.state = this.active ? "moving" : "baseline";
    return this.result(
      this.event?.type === "repetition"
        ? "Deslocamento e chegada reconhecidos"
        : "Desloque-se para o outro lado e estabilize a chegada",
      "good",
    );
  }
}
