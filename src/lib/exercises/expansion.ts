import {
  calculateAngle,
  verticalInclination,
  visible,
  RULES,
  type AnalysisFrame,
  type FeedbackLevel,
} from "./core";
import { SideAnalyzer, sides, distance } from "./side";

export type NewExerciseId =
  | "glutebridge"
  | "calfraise"
  | "reverselunge"
  | "shoulderpress"
  | "frontraise"
  | "bentoverrow"
  | "tricepskickback"
  | "mountainclimber";
// Engineering starting points, not universal or clinically validated movement limits.
export const NEW_RULES = {
  glutebridge: { base: 140, enter: 150, target: 165, excursion: 20, kneeMin: 45, kneeMax: 140 },
  calfraise: {
    base: 0.12,
    enter: 0.22,
    target: 0.38,
    excursion: 0.16,
    transitionMs: 250,
    minFootPixels: 12,
  },
  reverselunge: {
    base: 155,
    enter: 140,
    target: 110,
    excursion: 25,
    closed: 0.22,
    open: 0.35,
    torso: 40,
  },
  shoulderpress: { base: 110, enter: 125, target: 160, excursion: 40 },
  frontraise: { base: 20, enter: 35, target: 75, excursion: 40, elbow: 145, max: 110 },
  bentoverrow: {
    base: 155,
    enter: 135,
    target: 90,
    excursion: 40,
    torsoDrift: 15,
    pullEntry: 0.04,
    pullTarget: 0.1,
  },
  tricepskickback: { base: 110, enter: 125, target: 160, excursion: 40, armDrift: 20 },
  mountainclimber: {
    base: 155,
    enter: 140,
    target: 100,
    excursion: 35,
    knee: 150,
    elbow: 150,
    hipDrift: 0.12,
  },
} as const;
export const NEW_FEEDBACK = {
  bridgeRange: "Eleve mais o quadril na ponte",
  calfRange: "Suba mais o calcanhar",
  calfPosture: "Mantenha o corpo estável na panturrilha",
  reverseRange: "Amplie a descida do afundo reverso",
  reversePosture: "Mantenha o tronco ereto no afundo reverso",
  pressRange: "Estenda mais os dois braços",
  frontRange: "Eleve o braço à frente até a altura do ombro",
  frontElbow: "Evite dobrar o cotovelo na elevação frontal",
  frontHigh: "Revise a altura da elevação frontal",
  rowRange: "Puxe mais o cotovelo para trás",
  rowPosture: "Mantenha o tronco estável na remada",
  kickRange: "Estenda mais o cotovelo no kickback",
  kickPosture: "Mantenha o braço superior estável no kickback",
  climberRange: "Aproxime mais o joelho do tronco",
  climberPosture: "Mantenha o quadril estável no mountain climber",
} as const;
const NEEDS: Record<NewExerciseId, number[]> = {
  glutebridge: [11, 23, 25, 27],
  calfraise: [11, 23, 25, 27, 29, 31],
  reverselunge: [11, 23, 25, 27, 29, 31],
  shoulderpress: [11, 13, 15, 23],
  frontraise: [11, 13, 15, 23],
  bentoverrow: [11, 13, 15, 23, 25],
  tricepskickback: [11, 13, 15, 23, 25],
  mountainclimber: [11, 13, 15, 23, 25, 27],
};
const RANGE: Record<NewExerciseId, string> = {
  glutebridge: NEW_FEEDBACK.bridgeRange,
  calfraise: NEW_FEEDBACK.calfRange,
  reverselunge: NEW_FEEDBACK.reverseRange,
  shoulderpress: NEW_FEEDBACK.pressRange,
  frontraise: NEW_FEEDBACK.frontRange,
  bentoverrow: NEW_FEEDBACK.rowRange,
  tricepskickback: NEW_FEEDBACK.kickRange,
  mountainclimber: NEW_FEEDBACK.climberRange,
};
type Point = { x: number; y: number };
type Sample = {
  value: number;
  base: boolean;
  enter: boolean;
  target: boolean;
  eligible: boolean;
  guidance: string;
  issues: string[];
  actor?: "left" | "right";
};
const subtract = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y;
const length = (a: Point) => Math.hypot(a.x, a.y);
const unit = (a: Point): Point => {
  const n = length(a);
  return { x: a.x / n, y: a.y / n };
};

/** Same event contract as existing rep analyzers; no inference, timers or React here. */
export class ExpansionAnalyzer extends SideAnalyzer {
  protected needs;
  private confirmations = new Map<string, { at: number; samples: number; last: number }>();
  private origin = 0;
  private reached = false;
  private excursionReached = false;
  private issues = new Set<string>();
  private reference: Record<string, number> = {};
  private cycleActor: "left" | "right" | undefined;
  private expectedActor: "left" | "right" | undefined;
  private backwardStep = false;
  constructor(readonly exercise: NewExerciseId) {
    super();
    this.needs = sides(NEEDS[exercise]);
  }
  protected override result(message: string, level: FeedbackLevel, tracking = true) {
    const result = super.result(message, level, tracking);
    if (this.exercise === "shoulderpress") result.side = null;
    if (this.exercise === "mountainclimber") result.side = this.cycleActor ?? null;
    if (this.exercise === "reverselunge")
      result.side =
        this.reference["front"] === undefined
          ? null
          : this.reference["front"] === 1
            ? "right"
            : "left";
    return result;
  }
  protected override resetCycle() {
    this.confirmations.clear();
    this.origin = 0;
    this.reached = false;
    this.excursionReached = false;
    this.issues.clear();
    this.reference = {};
    this.cycleActor = undefined;
    this.backwardStep = false;
  }
  override resetPartial(timestamp = 0) {
    this.expectedActor = undefined;
    return super.resetPartial(timestamp);
  }
  private confirmed(key: string, condition: boolean, now: number, duration: number) {
    if (!condition) {
      this.confirmations.delete(key);
      return false;
    }
    const c = this.confirmations.get(key) ?? { at: now, samples: 0, last: -Infinity };
    if (now > c.last) {
      c.samples++;
      c.last = now;
    }
    this.confirmations.set(key, c);
    return c.samples >= 2 && now - c.at >= duration;
  }
  override analyze(f: AnalysisFrame, count = true) {
    if (!this.begin(f) || !this.choose(f)) return this.missing(f);
    const s = this.measure(f);
    if (!s || !Number.isFinite(s.value)) return this.missing(f);
    const now = f.timestamp;
    if (!s.eligible) {
      this.event = this.resetPartial(now) ?? this.event;
      return this.result(s.guidance, "posture");
    }
    const transition =
      this.exercise === "calfraise" ? NEW_RULES.calfraise.transitionMs : RULES.transitionMs;
    if (!count && this.active) this.resetPartial(now);
    if (!this.armed) {
      this.state = "positioning";
      if (this.confirmed("base", s.base, now, RULES.baselineMs)) {
        this.armed = true;
        this.origin = s.value;
        this.state = "baseline";
      }
      return this.result(
        s.base ? "Mantenha a posição inicial por um instante" : s.guidance,
        "warning",
      );
    }
    if (!count) {
      if (!s.base) this.resetPartial(now);
      return this.result("Posição inicial reconhecida", "good");
    }
    const rightActor = !this.expectedActor || s.actor === this.expectedActor;
    if (!this.active && this.confirmed("entry", s.enter && rightActor, now, transition)) {
      this.active = true;
      this.cycleActor = s.actor;
      this.state = "moving";
    }
    if (!this.active)
      return this.result(
        rightActor ? "Pronto para o movimento" : "Alterne o joelho após retornar à prancha alta",
        "good",
      );
    // An alternating movement cannot switch knees before its reset phase.
    if (this.cycleActor && s.actor && s.actor !== this.cycleActor && !s.base) {
      this.event = this.resetPartial(now);
      return this.result("Retorne à prancha alta antes de alternar", "warning");
    }
    if (
      this.confirmed(
        "excursion",
        s.value - this.origin >= NEW_RULES[this.exercise].excursion,
        now,
        transition,
      )
    )
      this.excursionReached = true;
    if (this.confirmed("target", s.target, now, RULES.depthMs)) this.reached = true;
    let current = "";
    for (const issue of Object.values(NEW_FEEDBACK)) {
      if (this.confirmed(issue, s.issues.includes(issue), now, RULES.transitionMs)) {
        this.issues.add(issue);
        current = issue;
      }
    }
    this.state = this.reached ? "target" : "moving";
    if (this.confirmed("return", s.base, now, transition)) {
      const actor = this.cycleActor;
      if (this.excursionReached) {
        if (!this.reached) this.issues.add(RANGE[this.exercise]);
        const issues = [...this.issues];
        this.complete(issues, now);
        this.expectedActor = actor ? (actor === "left" ? "right" : "left") : undefined;
      } else this.resetCycle();
      this.armed = false;
      this.side = null;
      this.state = "positioning";
      return this.result(
        this.event?.type === "repetition"
          ? this.event.correct
            ? "Boa execução!"
            : (this.event.issues[0] ?? "Revise os critérios desta repetição")
          : "Complete a amplitude do movimento",
        this.event?.type === "repetition" && this.event.correct ? "good" : "range",
      );
    }
    return this.result(
      current ||
        (this.reached
          ? "Amplitude reconhecida. Retorne à posição inicial"
          : "Continue o movimento"),
      current ? "posture" : this.reached ? "good" : "range",
    );
  }
  private measure(f: AnalysisFrame): Sample | null {
    const id = this.exercise,
      o = this.side === "right" ? 1 : 0;
    const p = (n: number): Point => ({
      x: f.landmarks[n]!.x * f.width,
      y: f.landmarks[n]!.y * f.height,
    });
    const angle = (a: number, b: number, c: number) =>
      calculateAngle(f.landmarks[a]!, f.landmarks[b]!, f.landmarks[c]!, f);
    const a = (a: number, b: number, c: number) => angle(a + o, b + o, c + o);
    const torso = distance(f, 11 + o, 23 + o);
    if (torso < 5) return null;
    const shoulder = p(11 + o),
      hip = p(23 + o),
      up = unit(subtract(shoulder, hip));
    const tilt = verticalInclination(f.landmarks[11 + o]!, f.landmarks[23 + o]!, f);
    if (tilt === null) return null;
    const s: Sample = {
      value: 0,
      base: false,
      enter: false,
      target: false,
      eligible: true,
      guidance: "Volte à posição inicial",
      issues: [],
    };
    const remember = (key: string, value: number) => {
      if (!this.armed && !this.active) this.reference[key] = value;
      return this.reference[key] ?? value;
    };
    if (id === "glutebridge") {
      const c = NEW_RULES.glutebridge,
        h = a(11, 23, 25),
        k = a(23, 25, 27);
      if (h === null || k === null) return null;
      const knee = p(25 + o),
        ankle = p(27 + o);
      s.eligible = k >= c.kneeMin && k <= c.kneeMax && shoulder.y > knee.y && ankle.y > knee.y;
      s.guidance = "Deite de costas, dobre os joelhos e comece com o quadril baixo";
      const axis = subtract(ankle, shoulder),
        n = length(axis);
      if (n < 5) return null;
      const height =
        ((axis.x * (hip.y - shoulder.y) - axis.y * (hip.x - shoulder.x)) / n / torso) *
        Math.sign(axis.x);
      const low = remember("height", height);
      s.value = h;
      s.base = h <= c.base;
      s.enter = h >= c.enter && height < low - 0.08;
      s.target = h >= c.target && height < low - 0.16;
    } else if (id === "calfraise") {
      const c = NEW_RULES.calfraise,
        knee = a(23, 25, 27),
        heel = p(29 + o),
        toe = p(31 + o);
      const foot = distance(f, 29 + o, 31 + o);
      if (knee === null || foot < c.minFootPixels) return null;
      // Project lift against the body vertical, compensating for modest camera roll.
      const baselineUp = { x: remember("upX", up.x), y: remember("upY", up.y) };
      const lift = dot(subtract(heel, toe), baselineUp) / foot;
      const baseToeX = remember("toeX", toe.x),
        baseToeY = remember("toeY", toe.y);
      const shift = Math.hypot(toe.x - baseToeX, toe.y - baseToeY) / torso;
      s.eligible = knee >= 150 && tilt <= 30 && shift < 0.2;
      s.guidance = "Fique em pé, com os calcanhares apoiados e os pés nítidos na câmera";
      s.value = lift;
      s.base = lift <= c.base && lift >= -0.2;
      s.enter = lift >= c.enter;
      s.target = lift >= c.target;
      if (tilt > 15 || shift > 0.08) s.issues.push(NEW_FEEDBACK.calfPosture);
    } else if (id === "shoulderpress") {
      if (!visible(f.landmarks, [11, 12, 13, 14, 15, 16, 23, 24])) return null;
      const c = NEW_RULES.shoulderpress,
        l = angle(11, 13, 15),
        r = angle(12, 14, 16);
      if (l === null || r === null) return null;
      const heights = [0, 1].map(
        (side) =>
          dot(subtract(p(15 + side), p(11 + side)), unit(subtract(p(11 + side), p(23 + side)))) /
          distance(f, 11 + side, 23 + side),
      );
      s.value = Math.min(l, r);
      s.base =
        l >= 55 &&
        r >= 55 &&
        l <= c.base &&
        r <= c.base &&
        heights.every((h) => h >= -0.2 && h <= 0.65);
      s.enter = l >= c.enter && r >= c.enter;
      s.target = l >= c.target && r >= c.target && heights.every((h) => h >= 0.65);
      s.eligible = tilt < 35;
      s.guidance = "Comece de frente, com os cotovelos dobrados e as mãos próximas aos ombros";
    } else if (id === "frontraise") {
      if (!visible(f.landmarks, [0])) return null;
      const c = NEW_RULES.frontraise,
        elevation = a(23, 11, 13),
        elbow = a(11, 13, 15);
      if (elevation === null || elbow === null) return null;
      const nose = subtract(p(0), shoulder),
        forward = { x: -up.y, y: up.x };
      const orientation = Math.sign(dot(nose, forward));
      const projected = (dot(subtract(p(15 + o), shoulder), forward) * orientation) / torso;
      s.eligible = tilt <= 30 && Math.abs(dot(nose, forward)) / torso >= 0.06;
      s.guidance = "Fique de lado com o rosto visível e comece com o braço baixo";
      s.value = elevation;
      s.base = elevation <= c.base;
      s.enter = elevation >= c.enter && projected > 0.15;
      s.target = elevation >= c.target && elevation <= c.max && projected > 0.3;
      if (elbow < c.elbow) s.issues.push(NEW_FEEDBACK.frontElbow);
      if (elevation > c.max) s.issues.push(NEW_FEEDBACK.frontHigh);
    } else if (id === "bentoverrow" || id === "tricepskickback") {
      const elbow = a(11, 13, 15),
        upper = a(23, 11, 13),
        hipAngle = a(11, 23, 25);
      if (elbow === null || upper === null || hipAngle === null) return null;
      s.eligible = tilt >= 25 && tilt <= 85 && hipAngle >= 70 && hipAngle <= 155;
      s.guidance =
        id === "bentoverrow"
          ? "Incline o tronco e comece com o braço estendido"
          : "Incline o tronco, mantenha o braço junto ao corpo e dobre o cotovelo";
      const initialTilt = remember("tilt", tilt),
        initialUpper = remember("upper", upper);
      const towardHip = dot(subtract(p(13 + o), shoulder), unit(subtract(hip, shoulder))) / torso;
      if (id === "bentoverrow") {
        const c = NEW_RULES.bentoverrow,
          hand = distance(f, 15 + o, 23 + o) / torso;
        const pull = towardHip - remember("elbowBack", towardHip);
        s.value = 180 - elbow;
        s.base = elbow >= c.base;
        s.enter = elbow <= c.enter && towardHip > 0.15 && pull >= c.pullEntry;
        s.target = elbow <= c.target && towardHip > 0.3 && hand < 0.85 && pull >= c.pullTarget;
        if (Math.abs(tilt - initialTilt) > c.torsoDrift) s.issues.push(NEW_FEEDBACK.rowPosture);
      } else {
        const c = NEW_RULES.tricepskickback;
        s.value = elbow;
        s.base = elbow >= 55 && elbow <= c.base && upper <= 35;
        s.enter = elbow >= c.enter;
        s.target = elbow >= c.target;
        if (Math.abs(upper - initialUpper) > c.armDrift || Math.abs(tilt - initialTilt) > 15)
          s.issues.push(NEW_FEEDBACK.kickPosture);
      }
    } else if (id === "reverselunge") {
      if (!visible(f.landmarks, [11, 12, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32])) return null;
      const c = NEW_RULES.reverselunge,
        kl = angle(23, 25, 27),
        kr = angle(24, 26, 28);
      if (kl === null || kr === null) return null;
      const leg = distance(f, 23 + o, 25 + o) + distance(f, 25 + o, 27 + o);
      const forward = unit({
        x: p(31).x - p(29).x + (p(32).x - p(30).x),
        y: p(31).y - p(29).y + (p(32).y - p(30).y),
      });
      if (!Number.isFinite(forward.x) || Math.abs(forward.x) < 0.5 || leg < 5) return null;
      const left = dot(p(27), forward) / leg,
        right = dot(p(28), forward) / leg;
      const l0 = remember("left", left),
        r0 = remember("right", right);
      const separation = Math.abs(left - right);
      if (separation < c.open)
        this.confirmed("backward-step", false, f.timestamp, RULES.transitionMs);
      if (this.armed && !this.backwardStep && separation >= c.open) {
        const dl = left - l0,
          dr = right - r0;
        const stepValid =
          Math.min(dl, dr) < -c.open &&
          Math.abs(Math.max(dl, dr)) < 0.18 &&
          (dl < dr ? kr : kl) >= 120;
        if (this.confirmed("backward-step", stepValid, f.timestamp, RULES.transitionMs)) {
          this.backwardStep = true;
          this.reference["front"] = dl < dr ? 1 : 0;
          this.reference["backKnee"] = p(dl < dr ? 25 : 26).y / leg;
        }
      }
      const front = this.reference["front"] === 1 ? 1 : 0;
      const knee = front ? kr : kl;
      const backKnee = p(front ? 25 : 26).y / leg;
      s.value = 180 - knee;
      s.base = kl >= c.base && kr >= c.base && separation <= c.closed;
      s.enter = this.backwardStep && knee <= c.enter;
      s.target =
        this.backwardStep &&
        knee <= c.target &&
        backKnee - (this.reference["backKnee"] ?? backKnee) > 0.06;
      s.guidance = "Comece em pé com os pés próximos, depois dê um passo para trás";
      if (tilt > c.torso) s.issues.push(NEW_FEEDBACK.reversePosture);
    } else {
      if (!visible(f.landmarks, [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28])) return null;
      const c = NEW_RULES.mountainclimber,
        hl = angle(11, 23, 25),
        hr = angle(12, 24, 26),
        kl = angle(23, 25, 27),
        kr = angle(24, 26, 28),
        el = angle(11, 13, 15),
        er = angle(12, 14, 16);
      if ([hl, hr, kl, kr, el, er].some((v) => v === null)) return null;
      const hlv = hl!,
        hrv = hr!,
        bodyTilt = Math.abs((Math.atan2(hip.y - shoulder.y, hip.x - shoulder.x) * 180) / Math.PI);
      const horizontal = Math.min(bodyTilt, 180 - bodyTilt);
      s.eligible =
        horizontal <= 35 &&
        el! >= c.elbow &&
        er! >= c.elbow &&
        p(15).y > p(11).y &&
        p(16).y > p(12).y;
      s.guidance = "Comece na prancha alta com os dois joelhos visíveis";
      s.base = hlv >= c.base && hrv >= c.base && kl! >= c.knee && kr! >= c.knee;
      const actor = hlv < hrv ? "left" : "right",
        flex = Math.min(hlv, hrv),
        other = Math.max(hlv, hrv);
      s.actor = actor;
      s.value = 180 - flex;
      s.enter = flex <= c.enter && other >= c.base;
      s.target = flex <= c.target && other >= c.base;
      const hipOffset = (hip.y - shoulder.y) / torso,
        initial = remember("hip", hipOffset);
      if (Math.abs(hipOffset - initial) > c.hipDrift) s.issues.push(NEW_FEEDBACK.climberPosture);
    }
    return s;
  }
}
