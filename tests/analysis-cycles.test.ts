import { expect, test } from "bun:test";
import {
  calculateAngle,
  SquatAnalyzer,
  PushUpAnalyzer,
  JumpingJackAnalyzer,
  type Landmark,
  type Analyzer,
} from "../src/lib/biomech";
const p = (x: number, y: number): Landmark => ({ x, y, z: 0, visibility: 1 });
function bend(angle: number, push = false) {
  const l = Array.from({ length: 33 }, () => p(0.5, 0.5)),
    rad = (angle * Math.PI) / 180;
  for (const offset of [0, 1]) {
    if (push) {
      l[11 + offset] = p(0.2, 0.5);
      l[13 + offset] = p(0.4, 0.5);
      l[15 + offset] = p(0.4 - 0.15 * Math.cos(rad), 0.5 + 0.15 * Math.sin(rad));
      l[23 + offset] = p(0.6, 0.5);
      l[25 + offset] = p(0.8, 0.5);
    } else {
      l[11 + offset] = p(0.5, 0.1);
      l[23 + offset] = p(0.5, 0.3);
      l[25 + offset] = p(0.5, 0.5);
      l[27 + offset] = p(0.5 + 0.2 * Math.sin(rad), 0.5 - 0.2 * Math.cos(rad));
    }
  }
  return l;
}
function jack(open: boolean) {
  const l = Array.from({ length: 33 }, () => p(0.5, 0.5));
  l[0] = p(0.5, 0.2);
  l[11] = p(0.4, 0.4);
  l[12] = p(0.6, 0.4);
  l[15] = p(0.35, open ? 0.1 : 0.6);
  l[16] = p(0.65, open ? 0.1 : 0.6);
  l[27] = p(open ? 0.3 : 0.46, 0.9);
  l[28] = p(open ? 0.7 : 0.54, 0.9);
  return l;
}
function feed(a: Analyzer, frames: Landmark[][]) {
  return frames.map((landmarks, i) =>
    a.analyze({ landmarks, width: 1000, height: 1000, timestamp: i * 300 }),
  );
}
test("ciclos completos são reconhecidos nos três exercícios", () => {
  for (const push of [false, true]) {
    const a = push ? new PushUpAnalyzer() : new SquatAnalyzer();
    const results = feed(
      a,
      [170, 170, 140, 140, 80, 80, 170, 170].map((v) => bend(v, push)),
    );
    expect(a.totalReps).toBe(1);
    expect(a.correctReps).toBe(1);
    expect(results.filter((r) => r.event?.type === "repetition")).toHaveLength(1);
  }
  const a = new JumpingJackAnalyzer();
  feed(a, [false, false, true, true, true, false, false].map(jack));
  expect(a.totalReps).toBe(1);
  expect(a.correctReps).toBe(1);
});
test("começar no meio do movimento não conta e amplitude parcial é sinalizada", () => {
  const a = new SquatAnalyzer();
  feed(
    a,
    [80, 80, 170, 170].map((v) => bend(v)),
  );
  expect(a.totalReps).toBe(0);
  const b = new SquatAnalyzer();
  feed(
    b,
    [170, 170, 140, 140, 170, 170].map((v) => bend(v)),
  );
  expect(b.totalReps).toBe(1);
  expect(b.correctReps).toBe(0);
});
test("lado escolhido fica fixo durante ciclo e sua perda invalida a repetição", () => {
  const a = new SquatAnalyzer();
  const frames = [170, 170, 140, 140].map((v) => bend(v));
  for (const l of frames) for (const i of [11, 23, 25, 27]) l[i]!.visibility = 0.6;
  const results = feed(a, frames);
  expect(results.at(-1)?.side).toBe("right");
  const missing = bend(80);
  missing[26]!.visibility = 0;
  const lost = a.analyze({ landmarks: missing, width: 1000, height: 1000, timestamp: 1200 });
  expect(lost.tracking).toBe(false);
  expect(lost.event?.type).toBe("interrupted");
  expect(a.totalReps).toBe(0);
});
test("intervalo longo entre frames invalida ciclo, e preparação não conta", () => {
  const a = new SquatAnalyzer();
  feed(
    a,
    [170, 170, 140, 140].map((v) => bend(v)),
  );
  expect(
    a.analyze({ landmarks: bend(170), width: 1000, height: 1000, timestamp: 5000 }).event?.type,
  ).toBe("interrupted");
  expect(a.totalReps).toBe(0);
  const b = new SquatAnalyzer();
  [170, 170, 140, 140, 80, 80, 170, 170].forEach((v, i) =>
    b.analyze({ landmarks: bend(v), width: 1000, height: 1000, timestamp: i * 300 }, false),
  );
  expect(b.totalReps).toBe(0);
});
test("geometria é invariante à resolução e rejeita entradas não finitas", () => {
  for (const size of [
    { width: 1920, height: 1080 },
    { width: 1080, height: 1920 },
    { width: 1000, height: 1000 },
  ]) {
    const center = p(0.5, 0.5);
    expect(
      calculateAngle(
        p(0.5 + 100 / size.width, 0.5 + 100 / size.height),
        center,
        p(0.5 + 100 / size.width, 0.5 - 100 / size.height),
        size,
      ),
    ).toBeCloseTo(90);
  }
  expect(calculateAngle(p(NaN, 0), p(0, 0), p(1, 1), { width: 100, height: 100 })).toBeNull();
  expect(calculateAngle(p(1, 0), p(0, 0), p(1, 1), { width: 0, height: 100 })).toBeNull();
});
