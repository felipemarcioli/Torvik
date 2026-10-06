import { calculateAngle, verticalInclination, visible, type AnalysisFrame } from "./core";
import type { AdditionId } from "./additions";
import { MeasureFilter } from "./temporal";
export type Side = "left" | "right";
export type MovementSample = {
  base: boolean;
  enter: boolean;
  target: boolean;
  eligible: boolean;
  issues: string[];
};
export const PARAMETERS = {
  romaniandeadlift: { base: 160, enter: 145, target: 110, knee: 145 },
  bulgariansquat: { base: 155, enter: 140, target: 110, stance: 0.35, rearLift: 0.12 },
  floorpress: { base: 115, enter: 130, target: 160, height: 0.65 },
  deadbug: { baseHip: 120, targetHip: 150, targetKnee: 150, targetArm: 145 },
  birddog: { baseHip: 125, targetHip: 155, targetKnee: 155, targetArm: 145 },
  lyinglegraise: { base: 155, enter: 140, target: 105, knee: 155 },
  shouldertap: { handBase: 0.72, handEntry: 0.5, handTarget: 0.3, elbow: 150 },
  highknees: { base: 0.9, enter: 0.65, target: 0.25 },
  buttkicks: { base: 150, enter: 125, target: 80, ankleTarget: 0.85 },
  stepjack: { closed: 0.35, open: 0.85, moved: 0.45, stationary: 0.22 },
  skater: { displacement: 0.6, cross: 0.12, settleMs: 140 },
  jumpsquat: { base: 155, enter: 140, target: 110, footLift: 0.16, bodyLift: 0.2 },
  wallsit: { kneeMin: 70, kneeMax: 115, exitMin: 60, exitMax: 125, torso: 25 },
  sideplank: {
    alignment: 165,
    exitAlignment: 155,
    elbowMin: 65,
    elbowMax: 115,
    shoulderStack: 0.2,
  },
} as const;
export class Geometry {
  constructor(
    readonly f: AnalysisFrame,
    private filter: MeasureFilter,
  ) {}
  p(i: number) {
    const p = this.f.landmarks[i]!;
    return { x: p.x * this.f.width, y: p.y * this.f.height };
  }
  distance(a: number, b: number) {
    const p = this.p(a),
      q = this.p(b);
    return Math.hypot(p.x - q.x, p.y - q.y);
  }
  angle(a: number, b: number, c: number) {
    const v = calculateAngle(
      this.f.landmarks[a]!,
      this.f.landmarks[b]!,
      this.f.landmarks[c]!,
      this.f,
    );
    return v === null ? NaN : this.filter.value(`angle:${a}:${b}:${c}`, v, this.f.timestamp);
  }
  ratio(key: string, v: number) {
    return this.filter.value(key, v, this.f.timestamp);
  }
  torso(o = 0) {
    return this.distance(11 + o, 23 + o);
  }
  horizontal(a: number, b: number) {
    const p = this.p(a),
      q = this.p(b);
    return Math.abs(p.y - q.y) / this.distance(a, b);
  }
  tilt(o = 0) {
    return verticalInclination(this.f.landmarks[11 + o]!, this.f.landmarks[23 + o]!, this.f) ?? NaN;
  }
  visible(indices: number[]) {
    return (
      visible(this.f.landmarks, indices) &&
      indices.every((i) => this.f.landmarks[i]!.visibility >= 0.65) &&
      this.torso() >= 20
    );
  }
}
const legs = [11, 12, 23, 24, 25, 26, 27, 28];
export const REQUIRED: Record<AdditionId, number[]> = {
  romaniandeadlift: [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28],
  bulgariansquat: legs,
  wallsit: legs,
  floorpress: [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28],
  sideplank: [11, 12, 23, 24, 25, 26, 27, 28],
  deadbug: [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28],
  birddog: [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28],
  lyinglegraise: legs,
  shouldertap: [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28],
  highknees: legs,
  buttkicks: legs,
  skater: legs,
  stepjack: [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28],
  jumpsquat: [...legs, 29, 30, 31, 32],
};
export const MODERN_FEEDBACK = {
  hingeKnee: "Revise a flexão dos joelhos no terra romeno",
  torso: "Revise a estabilidade do tronco observada",
  plank: "Revise o alinhamento observado na prancha",
} as const;
/** Each branch describes that movement's geometry; no substitution with legacy detectors. */
export function sampleMovement(
  id: AdditionId,
  g: Geometry,
  side: Side,
  reference: Record<string, number>,
): MovementSample {
  const o = side === "left" ? 0 : 1,
    other = 1 - o,
    t = g.torso(o),
    p = (i: number) => g.p(i + o),
    a = (x: number, y: number, z: number) => g.angle(x + o, y + o, z + o);
  const s: MovementSample = {
    base: false,
    enter: false,
    target: false,
    eligible: true,
    issues: [],
  };
  const hip = a(11, 23, 25),
    knee = a(23, 25, 27),
    tilt = g.tilt(o);
  if (id === "romaniandeadlift") {
    const c = PARAMETERS.romaniandeadlift;
    s.eligible = knee >= c.knee && a(11, 13, 15) >= 145 && p(15).y > p(11).y;
    s.base = hip >= c.base && tilt <= 20;
    s.enter = hip <= c.enter && tilt >= 25;
    s.target = hip <= c.target && tilt >= 45;
    if (knee < 155) s.issues.push(MODERN_FEEDBACK.hingeKnee);
  } else if (id === "bulgariansquat") {
    const c = PARAMETERS.bulgariansquat,
      leg = g.distance(23 + o, 25 + o) + g.distance(25 + o, 27 + o);
    s.eligible =
      g.distance(27, 28) / leg >= c.stance &&
      (p(27).y - g.p(27 + other).y) / t >= c.rearLift &&
      tilt < 50;
    s.base = knee >= c.base;
    s.enter = knee <= c.enter;
    s.target = knee <= c.target;
  } else if (id === "floorpress") {
    const c = PARAMETERS.floorpress,
      elbows = [0, 1].map((i) => g.angle(11 + i, 13 + i, 15 + i)),
      heights = [0, 1].map((i) => (g.p(11 + i).y - g.p(15 + i).y) / g.torso(i));
    s.eligible =
      g.horizontal(11, 23) < 0.35 && elbows.every(Number.isFinite) && heights.every((h) => h > 0.1);
    s.base = elbows.every((v) => v >= 50 && v <= c.base);
    s.enter = elbows.every((v) => v >= c.enter);
    s.target = elbows.every((v) => v >= c.target) && heights.every((h) => h >= c.height);
  } else if (id === "lyinglegraise") {
    const c = PARAMETERS.lyinglegraise,
      hips = [0, 1].map((i) => g.angle(11 + i, 23 + i, 27 + i));
    s.eligible =
      g.horizontal(11, 23) < 0.3 && [0, 1].every((i) => g.angle(23 + i, 25 + i, 27 + i) >= c.knee);
    s.base = hips.every((v) => v >= c.base);
    s.enter = hips.every((v) => v <= c.enter);
    s.target = hips.every((v) => v <= c.target);
  } else if (id === "deadbug" || id === "birddog") {
    const c = PARAMETERS[id],
      arm = g.angle(23 + other, 11 + other, 15 + other),
      supportKnee = g.angle(23 + other, 25 + other, 27 + other),
      supportHip = g.angle(11 + other, 23 + other, 25 + other),
      supportArm = g.angle(23 + o, 11 + o, 15 + o);
    const armExtended = g.angle(11 + other, 13 + other, 15 + other) >= 145;
    const supine = id === "deadbug";
    s.eligible =
      g.horizontal(11 + o, 23 + o) < 0.4 &&
      supportKnee >= 55 &&
      supportKnee <= 130 &&
      supportHip >= 50 &&
      supportHip <= 125 &&
      supportArm >= 55 &&
      supportArm <= 125;
    if (supine)
      s.eligible &&= g.p(25 + other).y < g.p(23 + other).y && g.p(15 + o).y < g.p(11 + o).y;
    else s.eligible &&= g.p(25 + other).y > g.p(23 + other).y && g.p(15 + o).y > g.p(11 + o).y;
    s.base = hip >= 55 && hip <= c.baseHip && knee >= 55 && knee <= 125 && arm >= 55 && arm <= 120;
    s.enter = hip >= 135 && knee >= 130 && arm >= 125;
    s.target = hip >= c.targetHip && knee >= c.targetKnee && arm >= c.targetArm && armExtended;
  } else if (id === "shouldertap") {
    const c = PARAMETERS.shouldertap,
      d = g.ratio(`tap:${o}`, g.distance(15 + o, 11 + other) / t),
      elbowSupport = g.angle(11 + other, 13 + other, 15 + other),
      body = g.angle(11 + other, 23 + other, 27 + other);
    s.eligible =
      g.horizontal(11 + other, 23 + other) < 0.4 &&
      elbowSupport >= c.elbow &&
      g.p(15 + other).y > g.p(11 + other).y &&
      body >= 155 &&
      knee >= 150;
    s.base = d >= c.handBase && a(11, 13, 15) >= 150 && p(15).y > p(11).y;
    s.enter = d <= c.handEntry;
    s.target = d <= c.handTarget;
    if (body < 165) s.issues.push(MODERN_FEEDBACK.plank);
  } else if (id === "highknees") {
    const c = PARAMETERS.highknees,
      below = g.ratio(`kneeHeight:${o}`, (p(25).y - p(23).y) / t);
    s.eligible =
      tilt < 30 &&
      g.angle(23 + other, 25 + other, 27 + other) >= 130 &&
      (g.p(25 + other).y - g.p(23 + other).y) / g.torso(other) > 0.65;
    s.base = below >= c.base && knee >= 145;
    s.enter = below <= c.enter && knee <= 130;
    s.target = below <= c.target && knee <= 115 && p(27).y > p(25).y;
  } else if (id === "buttkicks") {
    const c = PARAMETERS.buttkicks,
      ankle = g.ratio(`heelHip:${o}`, g.distance(27 + o, 23 + o) / t);
    s.eligible =
      tilt < 30 &&
      (p(25).y - p(23).y) / t > 0.6 &&
      g.angle(23 + other, 25 + other, 27 + other) >= 130;
    s.base = knee >= c.base;
    s.enter = knee <= c.enter;
    s.target = knee <= c.target && ankle <= c.ankleTarget;
  } else if (id === "stepjack") {
    const c = PARAMETERS.stepjack,
      separation = g.distance(27, 28) / t,
      height = [0, 1].map((i) => (g.p(11 + i).y - g.p(15 + i).y) / g.torso(i));
    const moved = Math.abs((p(27).x - (reference[`ankleX:${o}`] ?? p(27).x)) / t),
      still = Math.abs(
        (g.p(27 + other).x - (reference[`ankleX:${other}`] ?? g.p(27 + other).x)) / t,
      );
    const outward = (p(27).x - g.p(27 + other).x) * (g.p(11 + o).x - g.p(11 + other).x) > 0;
    s.eligible = tilt < 25 && [0, 1].every((i) => g.angle(23 + i, 25 + i, 27 + i) >= 140);
    s.base = separation <= c.closed && height.every((h) => h < -0.3);
    s.enter = separation >= 0.6 && moved >= 0.25 && still <= c.stationary && outward;
    s.target =
      separation >= c.open &&
      moved >= c.moved &&
      still <= c.stationary &&
      height.every((h) => h > 0.8) &&
      outward;
  }
  if (![hip, knee, tilt, t].every(Number.isFinite) || t < 20) s.eligible = false;
  return s;
}
