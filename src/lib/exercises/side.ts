import { Analyzer, visible, calculateAngle, type AnalysisFrame } from "./core";
export const LEFT = [11, 13, 15, 23, 25, 27] as const;
export const sides = (needs: readonly number[]) => [needs, needs.map((i) => i + 1)] as const;
export const distance = (f: AnalysisFrame, a: number, b: number) =>
  Math.hypot(
    (f.landmarks[a]!.x - f.landmarks[b]!.x) * f.width,
    (f.landmarks[a]!.y - f.landmarks[b]!.y) * f.height,
  );
/** A side is selected only at baseline and never switched during a partial cycle. */
export abstract class SideAnalyzer extends Analyzer {
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
