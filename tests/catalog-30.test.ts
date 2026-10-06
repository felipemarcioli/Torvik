import { test, expect } from "bun:test";
import { existsSync } from "node:fs";
import { createAnalyzer, type AnalysisResult, type Landmark } from "../src/lib/biomech";
import { ADDITION_IDS, type AdditionId } from "../src/lib/exercises/additions";
import { EXERCISES } from "../src/lib/exercises/catalog";
import { EXERCISE_SECTIONS } from "../src/components/torvik/data";
import { SessionLedger } from "../src/lib/session";
import { createHistoryStore, isSessionReport } from "../src/lib/history";
import { reportCsv, printableReport } from "../src/lib/history-export";
import { evolution, cohort } from "../src/lib/progress";
import { IsometricAnalyzer } from "../src/lib/exercises/isometrics";
import { IDBFactory } from "fake-indexeddb";
import { catalogPose, type Stage } from "./fixtures/catalog-30";
test("every new catalogue preview references three real, distinct files", () => {
  const paths = ADDITION_IDS.flatMap((id) => {
    const exercise = EXERCISES.find((e) => e.id === id)!;
    return [exercise.previewAnimation, exercise.previewStill, exercise.previewSprite!];
  });
  expect(new Set(paths).size).toBe(42);
  for (const path of paths)
    expect(existsSync(new URL(`../public${path}`, import.meta.url))).toBe(true);
});
export function harness(id: AdditionId, mirror = false, width = 1000, height = 1000, dt = 100) {
  const analyzer = createAnalyzer(id);
  let now = 0;
  const events: NonNullable<AnalysisResult["event"]>[] = [];
  const results: AnalysisResult[] = [];
  function feed(
    stage: Stage,
    samples = 8,
    side: "left" | "right" = "left",
    count = true,
    edit?: (l: Landmark[]) => void,
  ) {
    let r!: AnalysisResult;
    for (let i = 0; i < samples; i++) {
      let l = catalogPose(id, stage, side);
      edit?.(l);
      l = l.map((p) => ({
        ...p,
        x: 0.5 + (((mirror ? 1 - p.x : p.x) - 0.5) * 650) / width,
        y: 0.5 + ((p.y - 0.5) * 650) / height,
      }));
      r = analyzer.analyze({ landmarks: l, width, height, timestamp: now }, count);
      now += dt;
      results.push(r);
      if (r.event) events.push(r.event);
    }
    return r;
  }
  function cycle(side: "left" | "right" = "left") {
    feed("base", 8, side);
    feed("entry", 6, side);
    feed("target", 6, side);
    if (id === "jumpsquat") {
      feed("air", 4, side);
      feed("landing", 5, side);
    }
    return feed("base", 8, side);
  }
  return {
    analyzer,
    feed,
    cycle,
    events,
    results,
    advance: (ms: number) => {
      now += ms;
    },
    time: () => now,
  };
}
test("30 unique IDs, 8/8/7/7 sections, unchanged original IDs and modalities", () => {
  expect(EXERCISES.length).toBe(30);
  expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(30);
  expect({
    legs: EXERCISES.filter((e) => e.category === "legs").length,
    upper: EXERCISES.filter((e) => ["chest", "back", "arms", "shoulders"].includes(e.category))
      .length,
    core: EXERCISES.filter((e) => e.category === "core").length,
    cardio: EXERCISES.filter((e) => e.category === "cardio").length,
  }).toEqual({ legs: 8, upper: 8, core: 7, cardio: 7 });
  expect(EXERCISE_SECTIONS.map((s) => s.exercises.length)).toEqual([8, 8, 7, 7]);
  expect(new Set(EXERCISE_SECTIONS.flatMap((s) => s.exercises.map((e) => e.id))).size).toBe(30);
  expect(
    EXERCISES.filter((e) => e.type === "HOLD_BASED")
      .map((e) => e.id)
      .sort(),
  ).toEqual(["plank", "sideplank", "wallsit"]);
});
const reps = ADDITION_IDS.filter((id) => !["wallsit", "sideplank", "skater"].includes(id));
for (const id of reps) {
  test(`${id}: complete cycles, reflection, frame proportions and cadence`, () => {
    for (const [mirror, w, h, dt] of [
      [false, 1000, 1000, 100],
      [true, 1920, 1080, 140],
      [false, 1080, 1920, 200],
    ] as const) {
      const x = harness(id, mirror, w, h, dt);
      x.cycle();
      expect({ id, last: x.results.at(-1), total: x.analyzer.totalReps }).toMatchObject({
        total: 1,
      });
      expect(x.events.filter((e) => e.type === "repetition")).toHaveLength(1);
    }
  });
  test(`${id}: incomplete, countdown, missing, confidence, gap and jitter do not count`, () => {
    const a = harness(id);
    a.feed("target");
    a.feed("base");
    expect(a.analyzer.totalReps).toBe(0);
    const b = harness(id);
    for (const s of ["base", "entry", "target", "air", "base"] as Stage[])
      b.feed(s, 8, "left", false);
    expect(b.analyzer.totalReps).toBe(0);
    const c = harness(id);
    c.feed("base");
    c.feed("entry");
    c.feed("base");
    expect(c.analyzer.totalReps).toBe(0);
    for (const mutate of [
      (l: Landmark[]) => l.splice(0),
      (l: Landmark[]) => l.forEach((p) => (p.visibility = 0.4)),
      (l: Landmark[]) => l.forEach((p) => (p.x = NaN)),
    ]) {
      const d = harness(id);
      d.feed("base");
      d.feed("entry");
      expect(d.feed("target", 1, "left", true, mutate).tracking).toBe(false);
      d.feed("base");
      expect(d.analyzer.totalReps).toBe(0);
    }
    const e = harness(id);
    e.feed("base");
    e.feed("entry");
    e.advance(2000);
    e.feed("target");
    e.feed("base");
    expect(e.analyzer.totalReps).toBe(0);
    const f = harness(id);
    f.feed("base");
    f.feed("target", 1);
    f.feed("base");
    expect(f.analyzer.totalReps).toBe(0);
  });
}
for (const id of [
  "deadbug",
  "birddog",
  "shouldertap",
  "highknees",
  "buttkicks",
  "stepjack",
] as const) {
  test(`${id}: alternating anatomical side events and deduplicated history`, async () => {
    const x = harness(id);
    x.cycle("left");
    x.cycle("left");
    expect(x.analyzer.totalReps).toBe(1);
    x.cycle("right");
    expect(x.analyzer.totalReps).toBe(2);
    const ledger = new SessionLedger(id);
    for (const e of x.events) {
      ledger.consume(e);
      ledger.consume(e);
    }
    const report = ledger.snapshot(10000);
    expect(report.sideResults?.left.totalReps).toBe(1);
    expect(report.sideResults?.right.totalReps).toBe(1);
    expect(isSessionReport(report)).toBe(true);
    const db = createHistoryStore(new IDBFactory());
    await db.save(report);
    expect((await db.list())[0]).toEqual(report);
    expect(reportCsv(report)).toContain("lado_left_repeticoes");
    expect(printableReport(report)).toContain("Resultados por lado");
  });
}
test("bulgarian selected front leg can change without losing finished counts", () => {
  const x = harness("bulgariansquat");
  x.cycle("left");
  x.analyzer.selectSide("right", x.time());
  x.cycle("right");
  expect(x.analyzer.totalReps).toBe(2);
  expect(
    x.events.filter((e) => e.type === "repetition").map((e) => e.type === "repetition" && e.side),
  ).toEqual(["left", "right"]);
});
test("skater counts settled opposite arrivals; standing and incomplete translation do not count", () => {
  for (const mirror of [false, true]) {
    const x = harness("skater", mirror);
    x.feed("base");
    x.feed("right");
    x.feed("left");
    expect(x.analyzer.totalReps).toBe(2);
    expect(x.events.filter((e) => e.type === "repetition")).toHaveLength(2);
  }
  const y = harness("skater");
  y.feed("base", 40);
  expect(y.analyzer.totalReps).toBe(0);
});
for (const id of ["wallsit", "sideplank"] as const) {
  test(`${id}: stable acquisition, invalid and low confidence pause time; preparation never accumulates`, () => {
    const x = harness(id);
    expect(x.feed("base", 12, "left", false).measurement).toMatchObject({ validMs: 0 });
    x.feed("base", 12);
    const first = x.results.at(-1)!.measurement;
    expect(first?.type).toBe("HOLD_BASED");
    expect(first).toMatchObject({ valid: true });
    const ms = first?.type === "HOLD_BASED" ? first.validMs : 0;
    expect(x.feed("partial", 4).measurement).toMatchObject({ valid: false, validMs: ms });
    expect(x.feed("base", 1).measurement).toMatchObject({ valid: false, validMs: ms });
    x.feed("base", 8);
    const before = x.results.at(-1)!.measurement;
    const total = before?.type === "HOLD_BASED" ? before.validMs : 0;
    expect(
      x.feed("base", 3, "left", true, (l) => l.forEach((p) => (p.visibility = 0.2))).measurement,
    ).toMatchObject({ valid: false, validMs: total });
    expect(x.feed("base", 3, "left", true, (l) => l.splice(0)).measurement).toMatchObject({
      valid: false,
      validMs: total,
    });
    expect(x.analyzer.totalReps).toBe(0);
  });
}
test("side plank totals remain separate after selected side change and persist without reps", async () => {
  const x = harness("sideplank"),
    ledger = new SessionLedger("sideplank");
  ledger.clock.setRunning(true, 0);
  ledger.observe(x.feed("base", 15));
  x.analyzer.selectSide("right", x.time());
  ledger.observe(x.feed("base", 15, "right"));
  ledger.clock.setRunning(false, x.time());
  const r = ledger.snapshot(x.time());
  expect(r.sideResults?.left.validSeconds).toBeGreaterThan(0);
  expect(r.sideResults?.right.validSeconds).toBeGreaterThan(0);
  expect(isSessionReport(r)).toBe(true);
  const db = createHistoryStore(new IDBFactory());
  await db.save(r);
  expect(await db.list()).toEqual([r]);
  expect(
    isSessionReport({
      ...r,
      sideResults: {
        left: { totalReps: 0, correctReps: 0, validSeconds: NaN },
        right: r.sideResults?.right,
      },
    }),
  ).toBe(false);
});
test("wall sit requires both bent legs; side plank cannot time the upper shoulder as support", () => {
  const wall = harness("wallsit");
  expect(
    wall.feed("base", 20, "left", true, (l) => {
      l[26] = { ...l[26]!, x: 0.4, y: 0.63 };
      l[28] = { ...l[28]!, x: 0.4, y: 0.82 };
    }).measurement,
  ).toMatchObject({ valid: false, validMs: 0 });
  const side = harness("sideplank");
  // The wrong, upper arm is bent down toward the waist, resembling an elbow angle.
  expect(
    side.feed("base", 20, "right", true, (l) => {
      l[13] = { ...l[13]!, x: 0.7, y: 0.49 };
      l[15] = { ...l[15]!, x: 0.85, y: 0.49 };
    }).measurement,
  ).toMatchObject({ valid: false, validMs: 0 });
});
test("jump squat rejects plain squats, heel-only lift and standing translation", () => {
  for (const edit of [
    (l: Landmark[]) => {
      for (const i of [31, 32]) l[i]!.y += 0.1;
    },
  ]) {
    const x = harness("jumpsquat");
    x.feed("base");
    x.feed("target");
    x.feed("base", 6, "left", true, edit);
    x.feed("base");
    expect(x.analyzer.totalReps).toBe(0);
  }
  const x = harness("jumpsquat");
  x.feed("base");
  x.feed("target");
  x.feed("base");
  expect(x.analyzer.totalReps).toBe(0);
  const translated = harness("jumpsquat");
  translated.feed("base");
  translated.feed("base", 10, "left", true, (l) => l.forEach((p) => (p.y -= 0.1)));
  translated.feed("base");
  expect(translated.analyzer.totalReps).toBe(0);
});
test("opposite arm and leg are required; single-leg raise and unilateral floor press do not count", () => {
  for (const id of ["deadbug", "birddog", "lyinglegraise", "floorpress"] as const) {
    const x = harness(id);
    x.feed("base");
    const original = catalogPose(id, "base");
    x.feed("target", 12, "left", true, (l) => {
      for (const i of id === "deadbug" || id === "birddog"
        ? [14, 16]
        : id === "lyinglegraise"
          ? [26, 28]
          : [14, 16])
        l[i] = { ...original[i]! };
    });
    x.feed("base");
    expect(x.analyzer.totalReps).toBe(0);
  }
});
test("alternating running rejects simultaneous bilateral knee lift or heel curl", () => {
  for (const id of ["highknees", "buttkicks"] as const) {
    const x = harness(id);
    x.feed("base");
    for (const stage of ["entry", "target"] as const) {
      const opposite = catalogPose(id, stage, "right");
      x.feed(stage, 12, "left", true, (l) => {
        for (const i of [26, 28]) l[i] = { ...opposite[i]! };
      });
    }
    x.feed("base");
    expect(x.analyzer.totalReps).toBe(0);
  }
});
test("brief isometric grace preserves acquisition but never bridges invalid frames; configurable zero grace reacquires", () => {
  for (const grace of [0, 250]) {
    const a = new IsometricAnalyzer("wallsit", grace);
    const f = (stage: Stage, timestamp: number) => ({
      landmarks: catalogPose("wallsit", stage),
      width: 1000,
      height: 1000,
      timestamp,
    });
    for (let t = 0; t <= 1000; t += 100) a.analyze(f("base", t));
    const r = a.analyze(f("partial", 1100));
    expect(r.measurement).toMatchObject({ valid: false, validMs: 500 });
    const returning = a.analyze(f("base", 1200));
    expect(returning.measurement).toMatchObject({ validMs: 500 });
    if (grace === 250) expect(returning.measurement).toMatchObject({ valid: true });
    a.resetPartial(1250);
    expect(a.analyze(f("base", 1300)).measurement).toMatchObject({ valid: false, validMs: 500 });
  }
});
test("side graph excludes older unassigned data and weights only the selected side", () => {
  const x = harness("highknees");
  x.cycle("left");
  x.cycle("right");
  const ledger = new SessionLedger("highknees");
  for (const e of x.events) ledger.consume(e);
  const r = ledger.snapshot(10000);
  const old = { ...r, id: "old" };
  delete old.sideResults;
  const now = new Date(Date.now() + 1000);
  const left = evolution([r, old], "highknees", "all", cohort(r), now, "left");
  expect(left.points[0]?.totalReps).toBe(1);
  expect(left.points[0]?.sessions).toBe(1);
  expect(evolution([r, old], "highknees", "all", cohort(r), now).points[0]?.totalReps).toBe(4);
  expect(
    isSessionReport({
      ...r,
      sideResults: { ...r.sideResults, left: { totalReps: 9, correctReps: 0, validSeconds: 0 } },
    }),
  ).toBe(false);
});
