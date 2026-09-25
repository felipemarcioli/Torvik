import { expect, test } from "bun:test";
import { createAnalyzer, type ExerciseId, type AnalysisFrame } from "../src/lib/biomech";
import { EXERCISES } from "../src/lib/exercises/catalog";
import { SessionLedger } from "../src/lib/session";
import { createHistoryStore, isSessionReport } from "../src/lib/history";
import { historyTotals, evolution, cohort, comparison, sessionStats } from "../src/lib/progress";
import { reportCsv, printableReport } from "../src/lib/history-export";
import { IDBFactory } from "fake-indexeddb";
import { pose, transform } from "./fixtures/exercises";
const specs: [ExerciseId, number, number, number, number][] = [
  ["lunge", 170, 130, 90, 130],
  ["bicepscurl", 170, 130, 55, 110],
  ["situp", 175, 140, 90, 130],
  ["lateralraise", 5, 45, 90, 60],
];
const frame = (id: ExerciseId, a: number, t: number): AnalysisFrame => ({
  landmarks: pose(id, a),
  width: 1000,
  height: 1000,
  timestamp: t,
});
test("catálogo tem oito identificadores únicos e modalidade explícita", () => {
  expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(8);
  expect(EXERCISES.filter((e) => e.type === "HOLD_BASED").map((e) => e.id)).toEqual(["plank"]);
});
for (const [id, base, enter, target, partial] of specs) {
  test(`${id}: ciclo completo e eventos únicos em diferentes escalas, rotações e cadências`, () => {
    for (const [width, height, rot, dt] of [
      [1000, 1000, 0, 300],
      [1920, 1080, 8, 170],
      [1080, 1920, -8, 500],
    ]) {
      const a = createAnalyzer(id);
      const angles = [base, base, base, enter, enter, target, target, base, base, base];
      let events = 0;
      angles.forEach((angle, i) => {
        const r = a.analyze({
          landmarks: transform(pose(id, angle!), width!, height!, rot!),
          width: width!,
          height: height!,
          timestamp: i * dt!,
        });
        if (r.event?.type === "repetition") events++;
      });
      expect(a.totalReps).toBe(1);
      expect(a.correctReps).toBe(1);
      expect(events).toBe(1);
    }
  });
  test(`${id}: parcial, ruído, início no meio, preparação e perda não inventam ciclos`, () => {
    const partialAnalyzer = createAnalyzer(id);
    [base, base, partial, partial, base, base].forEach((v, i) =>
      partialAnalyzer.analyze(frame(id, v, i * 300)),
    );
    expect(partialAnalyzer.totalReps).toBe(1);
    expect(partialAnalyzer.correctReps).toBe(0);
    for (const count of [false, true]) {
      const a = createAnalyzer(id);
      [target, target, base, base, base, base].forEach((v, i) =>
        a.analyze(frame(id, v, i * 300), count),
      );
      expect(a.totalReps).toBe(0);
    }
    const a = createAnalyzer(id);
    [base, base, enter, enter].forEach((v, i) => a.analyze(frame(id, v, i * 300)));
    const missing = frame(id, target, 1200);
    missing.landmarks = [];
    expect(a.analyze(missing).tracking).toBe(false);
    [base, base, base].forEach((v, i) => a.analyze(frame(id, v, 1500 + i * 300)));
    expect(a.totalReps).toBe(0);
    const b = createAnalyzer(id);
    [base, base, base - 1, base + 1, base - 1, base].forEach((v, i) =>
      b.analyze(frame(id, v, i * 300)),
    );
    expect(b.totalReps).toBe(0);
  });
}
test("rosca mantém lado durante ciclo e reavalia depois; retorno incompleto não conta", () => {
  const a = createAnalyzer("bicepscurl");
  [170, 170, 130, 130].forEach((v, i) => a.analyze(frame("bicepscurl", v, i * 300)));
  const change = frame("bicepscurl", 55, 1200);
  change.landmarks.forEach((p, i) => {
    p.visibility = i % 2 === 0 ? 1 : 0.6;
  });
  expect(a.analyze(change).side).toBe("left");
  a.analyze(frame("bicepscurl", 55, 1500));
  a.analyze(frame("bicepscurl", 145, 1800));
  expect(a.totalReps).toBe(0);
  change.timestamp = 2100;
  change.landmarks[13]!.visibility = 0;
  expect(a.analyze(change).event?.type).toBe("interrupted");
  expect(a.totalReps).toBe(0);
});
test("afundo rejeita base fechada; elevação rejeita abertura de um braço e classifica excesso", () => {
  const l = createAnalyzer("lunge"),
    f = frame("lunge", 90, 0);
  f.landmarks[28] = { ...f.landmarks[27]! };
  expect(l.analyze(f).message).toContain("passada");
  const a = createAnalyzer("lateralraise");
  [5, 5, 120, 120, 120, 5, 5].forEach((v, i) => a.analyze(frame("lateralraise", v, i * 300)));
  expect(a.totalReps).toBe(1);
  expect(a.correctReps).toBe(0);
  const b = createAnalyzer("lateralraise");
  [5, 5, 90, 90, 90, 5, 5].forEach((v, i) => {
    const f = frame("lateralraise", v, i * 300),
      down = pose("lateralraise", 5);
    for (const n of [12, 14, 16]) f.landmarks[n] = down[n]!;
    b.analyze(f);
  });
  expect(b.totalReps).toBe(0);
});
test("prancha só soma pares de frames válidos, confirma retomada e não soma preparação ou lacunas", () => {
  const a = createAnalyzer("plank");
  const feed = (y: number, t: number, count = true) => a.analyze(frame("plank", y, t), count);
  for (let t = 0; t <= 1500; t += 300)
    expect(feed(0.4, t, false).measurement).toMatchObject({ validMs: 0 });
  feed(0.4, 1800);
  feed(0.4, 2100);
  expect(feed(0.4, 2400).measurement).toMatchObject({ valid: true, validMs: 300 });
  expect(feed(0.58, 2700).measurement).toMatchObject({ valid: false, validMs: 300 });
  expect(feed(0.58, 3000).message).toBe("Eleve um pouco o quadril");
  expect(feed(0.23, 3300).message).toBe("Abaixe um pouco o quadril");
  feed(0.4, 3600);
  feed(0.4, 3900);
  expect(feed(0.4, 4200).measurement).toMatchObject({ validMs: 600 });
  expect(feed(0.4, 9000).measurement).toMatchObject({ valid: false, validMs: 600 });
  const missing = frame("plank", 0.4, 9300);
  missing.landmarks = [];
  expect(a.analyze(missing).tracking).toBe(false);
  a.resetPartial(9600);
  expect(feed(0.4, 9900).measurement).toMatchObject({ validMs: 600 });
  expect(a.totalReps).toBe(0);
});
test("prancha rejeita apoio errado e joelhos flexionados, registra episódios uma vez", () => {
  const a = createAnalyzer("plank");
  let issues = 0;
  for (let t = 0; t <= 3000; t += 300) {
    const f = frame("plank", 0.4, t);
    f.landmarks[13]!.x = 0.8;
    f.landmarks[13]!.y = 0.45;
    f.landmarks[15]!.x = 0.9;
    f.landmarks[15]!.y = 0.5;
    const r = a.analyze(f);
    if (r.event?.type === "hold-issue") issues++;
    expect(r.measurement).toMatchObject({ valid: false, validMs: 0 });
  }
  expect(issues).toBe(1);
  const b = createAnalyzer("plank"),
    f = frame("plank", 0.4, 0);
  f.landmarks[25]!.y = 0.65;
  expect(b.analyze(f).measurement).toMatchObject({ valid: false });
});
test("sessões v2 de prancha persistem sem reps, exportam duração e não misturam métricas", async () => {
  const ledger = new SessionLedger("plank"),
    a = createAnalyzer("plank");
  ledger.clock.setRunning(true, 0);
  for (let t = 0; t <= 2100; t += 300) {
    const r = a.analyze(frame("plank", 0.4, t));
    ledger.observe(r);
    ledger.consume(r.event);
  }
  ledger.clock.setRunning(false, 2100);
  const report = ledger.snapshot(2100);
  expect(report.type).toBe("HOLD_BASED");
  expect(report.validSeconds).toBeCloseTo(1.8);
  expect(report.totalReps).toBeUndefined();
  expect(isSessionReport(report)).toBe(true);
  const db = createHistoryStore(new IDBFactory());
  await db.save(report);
  expect(await db.list()).toEqual([report]);
  expect(reportCsv(report)).toContain("tempo_postura_valida_segundos");
  expect(reportCsv(report)).not.toContain("repeticoes_avaliadas");
  expect(printableReport(report)).not.toContain("Repetições avaliadas");
  expect(sessionStats(report)[0]![0]).toBe("Tempo em postura válida");
  expect(historyTotals([report]).totalReps).toBe(0);
  expect(
    evolution([report], "plank", "all", cohort(report), new Date(Date.now() + 1000)).points[0]
      ?.validSeconds,
  ).toBeCloseTo(1.8);
  expect(
    comparison(report, { ...report, id: "b", rulesVersion: "different" }).validSeconds,
  ).toBeNull();
  expect(isSessionReport({ ...report, totalReps: 0 })).toBe(false);
  expect(isSessionReport({ ...report, validSeconds: NaN })).toBe(false);
});
