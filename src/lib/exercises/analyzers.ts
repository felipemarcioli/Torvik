import {
  Analyzer,
  RULES,
  visible,
  calculateAngle,
  verticalInclination,
  type AnalysisFrame,
  type AnalysisResult,
} from "./core";
import { SquatAnalyzer, PushUpAnalyzer, JumpingJackAnalyzer } from "./legacy";
import { THRESHOLDS, type ExerciseId } from "./catalog";
const LEFT = [11, 13, 15, 23, 25, 27] as const;
const sides = (needs: readonly number[]) => [needs, needs.map((i) => i + 1)] as const;
const distance = (f: AnalysisFrame, a: number, b: number) =>
  Math.hypot(
    (f.landmarks[a]!.x - f.landmarks[b]!.x) * f.width,
    (f.landmarks[a]!.y - f.landmarks[b]!.y) * f.height,
  );
/** A side is selected only at baseline and never switched during a partial cycle. */
abstract class SideAnalyzer extends Analyzer {
  protected abstract needs: readonly (readonly number[])[];
  protected choose(f: AnalysisFrame) {
    if (!this.side) {
      const scores = this.needs.map((indices) =>
        visible(f.landmarks, [...indices])
          ? Math.min(...indices.map((i) => f.landmarks[i]!.visibility))
          : -1,
      );
      if (Math.max(...scores) < 0) return false;
      this.side = scores[1]! > scores[0]! ? "right" : "left";
    }
    return visible(f.landmarks, [...this.needs[this.side === "right" ? 1 : 0]!]);
  }
  protected angle(f: AnalysisFrame, a: number, b: number, c: number) {
    const offset = this.side === "right" ? 1 : 0;
    return calculateAngle(
      f.landmarks[a + offset]!,
      f.landmarks[b + offset]!,
      f.landmarks[c + offset]!,
      f,
    );
  }
}
type BendKind = "lunge" | "bicepscurl" | "situp";
const AMPLITUDE = {
  lunge: "Amplie a descida do afundo",
  bicepscurl: "Amplie a flexão do cotovelo",
  situp: "Suba mais o tronco",
};
export class ConfiguredBendAnalyzer extends SideAnalyzer {
  protected needs;
  private lowest = 180;
  private baselineAngle = 180;
  private deep = false;
  private issues = new Set<string>();
  private initialArm = 0;
  constructor(private kind: BendKind) {
    super();
    this.needs = sides(kind === "bicepscurl" ? [11, 13, 15, 23] : [11, 23, 25, 27]);
  }
  protected override resetCycle() {
    this.lowest = 180;
    this.deep = false;
    this.issues.clear();
  }
  override analyze(f: AnalysisFrame, count = true): AnalysisResult {
    if (!this.begin(f) || !this.choose(f)) return this.missing(f);
    const cfg = THRESHOLDS[this.kind],
      now = f.timestamp,
      offset = this.side === "right" ? 1 : 0;
    const angle =
      this.kind === "bicepscurl"
        ? this.angle(f, 11, 13, 15)
        : this.kind === "situp"
          ? this.angle(f, 11, 23, 27)
          : this.angle(f, 23, 25, 27);
    if (angle === null) return this.missing(f);
    let issue = "";
    if (this.kind === "lunge") {
      if (!visible(f.landmarks, [23, 24, 25, 26, 27, 28])) return this.missing(f);
      const leg = distance(f, 23 + offset, 25 + offset) + distance(f, 25 + offset, 27 + offset);
      if (leg < 1 || distance(f, 27, 28) / leg < THRESHOLDS.lunge.stance) {
        this.event = this.resetPartial(now);
        return this.result("Mantenha os pés em posição de passada", "posture");
      }
      const tilt = verticalInclination(f.landmarks[11 + offset]!, f.landmarks[23 + offset]!, f);
      if (tilt === null) return this.missing(f);
      if (tilt > THRESHOLDS.lunge.torso) issue = "Mantenha o tronco estável no afundo";
    }
    if (this.kind === "situp") {
      const knee = this.angle(f, 23, 25, 27);
      if (knee === null) return this.missing(f);
      if (knee < THRESHOLDS.situp.kneeMin || knee > THRESHOLDS.situp.kneeMax) {
        this.event = this.resetPartial(now);
        return this.result("Mantenha os joelhos dobrados", "posture");
      }
    }
    const arm = this.kind === "bicepscurl" ? this.angle(f, 23, 11, 13) : 0;
    if (arm === null) return this.missing(f);
    if (!count && angle < cfg.baseline) this.resetPartial(now);
    if (!this.armed) {
      if (this.stable("baseline", angle >= cfg.baseline, now, RULES.baselineMs)) {
        this.armed = true;
        this.state = "baseline";
        this.baselineAngle = angle;
        this.initialArm = arm;
      }
      return this.result(
        this.armed ? "Posição inicial reconhecida" : "Retorne à posição inicial por um instante",
        "posture",
      );
    }
    if (!count) return this.result("Pronto para começar", "good");
    if (!this.active && angle >= cfg.baseline) this.baselineAngle = angle;
    if (!this.active && this.stable("enter", angle <= cfg.enter, now)) {
      this.active = true;
      this.state = "moving";
    }
    if (this.active) {
      this.lowest = Math.min(this.lowest, angle);
      if (
        this.kind === "bicepscurl" &&
        Math.abs(arm - this.initialArm) > THRESHOLDS.bicepscurl.armDrift
      )
        issue = "Mantenha o braço próximo ao tronco";
      if (this.stable("posture", !!issue, now) && issue) this.issues.add(issue);
      if (this.stable("target", angle <= cfg.target, now, RULES.depthMs)) {
        this.deep = true;
        this.state = "target";
      }
      if (this.stable("return", angle >= cfg.baseline, now)) {
        if (this.baselineAngle - this.lowest >= cfg.excursion)
          this.complete([...(this.deep ? [] : [AMPLITUDE[this.kind]]), ...this.issues], now);
        else {
          this.active = false;
          this.resetCycle();
        }
        // Reconfirm a baseline before changing the observed side.
        this.resetPartial(now);
        return this.result(
          this.event?.type === "repetition"
            ? (this.event.issues[0] ?? "Repetição dentro dos critérios")
            : "Movimento curto: retorne à posição inicial",
          this.event?.type === "repetition" && this.event.correct ? "good" : "range",
        );
      }
      return this.result(
        issue ||
          (this.deep
            ? "Amplitude reconhecida. Retorne à posição inicial."
            : "Continue o movimento com controle"),
        issue ? "posture" : this.deep ? "good" : "range",
      );
    }
    return this.result("Pronto para a próxima repetição", "posture");
  }
}
export class LateralRaiseAnalyzer extends Analyzer {
  private peaks = [0, 0];
  private bases = [0, 0];
  private reached = false;
  private issues = new Set<string>();
  protected override resetCycle() {
    this.peaks = [0, 0];
    this.reached = false;
    this.issues.clear();
  }
  override analyze(f: AnalysisFrame, count = true): AnalysisResult {
    if (!this.begin(f) || !visible(f.landmarks, [11, 12, 13, 14, 15, 16, 23, 24]))
      return this.missing(f);
    const cfg = THRESHOLDS.lateralraise,
      now = f.timestamp;
    const angles = [0, 1].map((o) =>
      calculateAngle(f.landmarks[23 + o]!, f.landmarks[11 + o]!, f.landmarks[13 + o]!, f),
    );
    if (angles.some((a) => a === null)) return this.missing(f);
    const [left, right] = angles as [number, number];
    const down = Math.max(left, right) <= cfg.baseline;
    if (!count && !down) this.resetPartial(now);
    if (!this.armed) {
      if (this.stable("baseline", down, now, RULES.baselineMs)) {
        this.armed = true;
        this.state = "baseline";
        this.bases = [left, right];
      }
      return this.result("Comece com os dois braços ao lado do corpo", "posture");
    }
    if (!count) return this.result("Pronto para começar", "good");
    if (!this.active && down) this.bases = [left, right];
    if (!this.active && this.stable("enter", Math.max(left, right) >= cfg.enter, now)) {
      this.active = true;
      this.state = "moving";
    }
    if (this.active) {
      this.peaks = [Math.max(this.peaks[0]!, left), Math.max(this.peaks[1]!, right)];
      const high = Math.max(left, right) > cfg.tooHigh,
        asymmetric = Math.abs(left - right) > cfg.asymmetry;
      if (this.stable("high", high, now)) this.issues.add("Não eleve os braços demais");
      if (this.stable("symmetry", asymmetric, now))
        this.issues.add("Mantenha os braços simétricos");
      if (
        this.stable(
          "target",
          Math.min(left, right) >= cfg.target && Math.max(left, right) <= cfg.targetMax,
          now,
          RULES.depthMs,
        )
      ) {
        this.reached = true;
        this.state = "target";
      }
      if (this.stable("return", down, now)) {
        if (this.peaks.every((p, i) => p - this.bases[i]! >= cfg.excursion))
          this.complete(
            [...(this.reached ? [] : ["Eleve os braços até a altura dos ombros"]), ...this.issues],
            now,
          );
        else {
          this.active = false;
          this.resetCycle();
        }
        this.resetPartial(now);
        return this.result(
          this.event?.type === "repetition"
            ? (this.event.issues[0] ?? "Repetição dentro dos critérios")
            : "Eleve os dois braços para completar o movimento",
          this.event?.type === "repetition" && this.event.correct ? "good" : "range",
        );
      }
      return this.result(
        high
          ? "Não eleve os braços demais"
          : asymmetric
            ? "Mantenha os braços simétricos"
            : "Eleve os braços até a altura dos ombros",
        high || asymmetric ? "posture" : "range",
      );
    }
    return this.result("Pronto para a próxima repetição", "posture");
  }
}
export class PlankAnalyzer extends SideAnalyzer {
  protected needs = sides(LEFT);
  private valid = false;
  private validMs = 0;
  private lastValid: number | null = null;
  private lastIssue = "";
  private recordedIssue = "";
  protected override resetCycle() {
    this.valid = false;
    this.lastValid = null;
    this.lastIssue = "";
    this.recordedIssue = "";
  }
  protected override result(
    message: string,
    level: AnalysisResult["level"],
    tracking = true,
  ): AnalysisResult {
    return {
      ...super.result(message, level, tracking),
      measurement: { type: "HOLD_BASED", valid: this.valid, validMs: this.validMs },
    };
  }
  override analyze(f: AnalysisFrame, count = true): AnalysisResult {
    if (!this.begin(f) || !this.choose(f)) return this.missing(f);
    const cfg = THRESHOLDS.plank,
      now = f.timestamp,
      o = this.side === "right" ? 1 : 0;
    const body = this.angle(f, 11, 23, 27),
      knee = this.angle(f, 23, 25, 27),
      elbow = this.angle(f, 11, 13, 15);
    if (body === null || knee === null || elbow === null) return this.missing(f);
    const l = f.landmarks,
      vector = (a: number, b: number) => ({
        x: (l[b + o]!.x - l[a + o]!.x) * f.width,
        y: (l[b + o]!.y - l[a + o]!.y) * f.height,
      });
    const axis = vector(11, 27),
      forearm = vector(13, 15),
      hip = vector(11, 23),
      support = vector(11, 13);
    const length = Math.hypot(axis.x, axis.y),
      fl = Math.hypot(forearm.x, forearm.y);
    if (length < 1 || fl < 1) return this.missing(f);
    const parallel =
      (Math.acos(Math.min(1, Math.abs(axis.x * forearm.x + axis.y * forearm.y) / (length * fl))) *
        180) /
      Math.PI;
    const bodyTilt = (Math.asin(Math.min(1, Math.abs(axis.y) / length)) * 180) / Math.PI;
    const supported =
      elbow >= cfg.elbowMin &&
      elbow <= cfg.elbowMax &&
      parallel <= cfg.forearmMax &&
      bodyTilt <= cfg.bodyTiltMax;
    const aligned =
      body >= (this.valid ? cfg.exitAlignment : cfg.alignment) &&
      knee >= (this.valid ? cfg.exitKnee : cfg.knee);
    let issue = "";
    if (!supported) issue = "Apoie os antebraços";
    else if (!aligned) {
      const deviation = (axis.x * hip.y - axis.y * hip.x) / (length * length),
        side = axis.x * support.y - axis.y * support.x;
      issue =
        Math.abs(deviation) > 0.025
          ? deviation * side > 0
            ? "Eleve um pouco o quadril"
            : "Abaixe um pouco o quadril"
          : "Alinhe o corpo na prancha";
    }
    const acceptable = supported && aligned;
    this.armed = true;
    if (!acceptable || !count) {
      this.valid = false;
      this.lastValid = null;
      this.stable("valid", false, now);
    }
    if (count && acceptable && this.stable("valid", true, now, RULES.baselineMs)) {
      if (this.lastValid !== null) this.validMs += Math.max(0, now - this.lastValid);
      this.valid = true;
      this.lastValid = now;
    }
    if (issue !== this.lastIssue) {
      this.stable("issue", false, now);
      this.lastIssue = issue;
      this.recordedIssue = "";
    }
    if (count && issue && this.stable("issue", true, now, 1200) && this.recordedIssue !== issue) {
      this.recordedIssue = issue;
      this.event = { id: ++this.sequence, type: "hold-issue", issue, timestamp: now };
    }
    this.state = this.valid ? "holding" : "adjusting";
    return this.result(
      issue ||
        (this.valid ? "Boa postura. Continue assim." : "Mantenha o alinhamento por um instante"),
      this.valid ? "good" : "posture",
    );
  }
}
const FACTORIES: Record<ExerciseId, () => Analyzer> = {
  squat: () => new SquatAnalyzer(),
  pushup: () => new PushUpAnalyzer(),
  jumpingjack: () => new JumpingJackAnalyzer(),
  lunge: () => new ConfiguredBendAnalyzer("lunge"),
  bicepscurl: () => new ConfiguredBendAnalyzer("bicepscurl"),
  lateralraise: () => new LateralRaiseAnalyzer(),
  situp: () => new ConfiguredBendAnalyzer("situp"),
  plank: () => new PlankAnalyzer(),
};
export const createAnalyzer = (id: ExerciseId): Analyzer => FACTORIES[id]();
