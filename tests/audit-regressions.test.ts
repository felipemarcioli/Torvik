import { describe, expect, test } from "bun:test";
import {
  calculateAngle,
  SquatAnalyzer,
  JumpingJackAnalyzer,
  type Landmark,
} from "../src/lib/biomech";
const point = (x: number, y: number): Landmark => ({ x, y, z: 0, visibility: 1 });
const frame = (landmarks: Landmark[], timestamp: number, width = 1000, height = 1000) => ({
  landmarks,
  width,
  height,
  timestamp,
});
export function squat(angle: number) {
  const l = Array.from({ length: 33 }, () => point(0.5, 0.5));
  for (const offset of [0, 1]) {
    l[23 + offset] = point(0.5, 0.3);
    l[25 + offset] = point(0.5, 0.5);
    l[27 + offset] = point(
      0.5 + 0.2 * Math.sin((angle * Math.PI) / 180),
      0.5 - 0.2 * Math.cos((angle * Math.PI) / 180),
    );
    l[11 + offset] = point(0.5, 0.1);
  }
  return l;
}
export function jack(up: boolean, open: boolean) {
  const l = Array.from({ length: 33 }, () => point(0.5, 0.5));
  l[0] = point(0.5, 0.2);
  l[11] = point(0.4, 0.4);
  l[12] = point(0.6, 0.4);
  l[15] = point(0.35, up ? 0.1 : 0.6);
  l[16] = point(0.65, up ? 0.1 : 0.6);
  l[27] = point(open ? 0.3 : 0.46, 0.9);
  l[28] = point(open ? 0.7 : 0.54, 0.9);
  return l;
}
describe("regressões identificadas na auditoria", () => {
  test("ângulos usam a proporção real e rejeitam segmentos degenerados", () => {
    const b = point(0.5, 0.5);
    expect(
      calculateAngle(
        point(0.5 + 100 / 1920, 0.5 + 100 / 1080),
        b,
        point(0.5 + 100 / 1920, 0.5 - 100 / 1080),
        { width: 1920, height: 1080 },
      ),
    ).toBeCloseTo(90);
    expect(calculateAngle(b, b, point(0.6, 0.6), { width: 1920, height: 1080 })).toBeNull();
  });
  test("oscilações em torno de 160 graus não contam repetições", () => {
    const a = new SquatAnalyzer();
    [170, 170, 170, 159, 161, 159, 161].forEach((v, i) => a.analyze(frame(squat(v), i * 300)));
    expect(a.totalReps).toBe(0);
  });
  test("perda de rastreamento descarta o ciclo", () => {
    const a = new SquatAnalyzer();
    [170, 170, 140, 140, 80, 80].forEach((v, i) => a.analyze(frame(squat(v), i * 300)));
    a.analyze(frame([], 1800));
    a.analyze(frame(squat(170), 2100));
    a.analyze(frame(squat(170), 2400));
    expect(a.totalReps).toBe(0);
  });
  test("polichinelo exige abertura simultânea", () => {
    const a = new JumpingJackAnalyzer();
    [
      jack(false, false),
      jack(false, false),
      jack(true, false),
      jack(true, false),
      jack(false, true),
      jack(false, true),
      jack(false, false),
      jack(false, false),
    ].forEach((l, i) => a.analyze(frame(l, i * 300)));
    expect(a.totalReps).toBe(1);
    expect(a.correctReps).toBe(0);
  });
});
