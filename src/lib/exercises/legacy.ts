import {
  Analyzer,
  RULES,
  calculateAngle,
  verticalInclination,
  visible,
  type AnalysisFrame,
  type AnalysisResult,
} from "./core";
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
