import { expect, test } from "bun:test";
import { createAnalyzer, type AnalysisResult, type Landmark } from "../src/lib/biomech";
import { type NewExerciseId } from "../src/lib/exercises/expansion";
import { expansionPose, NEW_IDS, type Stage } from "./fixtures/expansion";
import { transform } from "./fixtures/exercises";
import { SessionLedger } from "../src/lib/session";
import { createHistoryStore, isSessionReport } from "../src/lib/history";
import { reportCsv, printableReport } from "../src/lib/history-export";
import { historyTotals, cohort, evolution, comparison } from "../src/lib/progress";
import { EXERCISE_BY_ID } from "../src/lib/exercises/catalog";
import { IDBFactory } from "fake-indexeddb";
function harness(id: NewExerciseId, width = 1000, height = 1000, rotation = 0, dt = 160) {
  const a = createAnalyzer(id);
  let t = 0;
  const events: AnalysisResult["event"][] = [];
  const results: AnalysisResult[] = [];
  function feed(
    stage: Stage,
    samples = 4,
    count = true,
    actor: "left" | "right" = "left",
    edit?: (l: Landmark[]) => void,
  ) {
    let r!: AnalysisResult;
    for (let i = 0; i < samples; i++) {
      const l = expansionPose(id, stage, actor);
      edit?.(l);
      r = a.analyze(
        { landmarks: transform(l, width, height, rotation), width, height, timestamp: t },
        count,
      );
      results.push(r);
      if (r.event) events.push(r.event);
      t += dt;
    }
    return r;
  }
  function cycle(actor: "left" | "right" = "left", target: Stage = "target") {
    feed("base", 4, true, actor);
    if (id === "reverselunge") feed("step", 4, true, actor);
    feed("entry", 4, true, actor);
    feed(target, 4, true, actor);
    return feed("base", 4, true, actor);
  }
  return { a, feed, cycle, events, results };
}
for (const id of NEW_IDS) {
  test(`${id}: amplitude partial is classified, not silently accepted`, () => {
    const x = harness(id);
    x.cycle("left", "partial");
    expect(x.a.totalReps).toBe(1);
    expect(x.a.correctReps).toBe(0);
  });
  test(`${id}: reset, NaN and long gaps discard evidence and preserve finished counts`, () => {
    const x = harness(id);
    x.cycle();
    x.feed("base");
    if (id === "reverselunge") x.feed("step");
    x.feed("entry");
    x.a.resetPartial(10000);
    x.feed("base");
    expect(x.a.totalReps).toBe(1);
    x.feed("target", 2, true, "left", (l) => l.forEach((p) => (p.x = NaN)));
    x.feed("base");
    expect(x.a.totalReps).toBe(1);
    const g = harness(id);
    g.feed("base");
    if (id === "reverselunge") g.feed("step");
    g.feed("entry");
    g.a.analyze({
      landmarks: expansionPose(id, "target"),
      width: 1000,
      height: 1000,
      timestamp: 100000,
    });
    g.a.analyze({
      landmarks: expansionPose(id, "base"),
      width: 1000,
      height: 1000,
      timestamp: 100200,
    });
    expect(g.a.totalReps).toBe(0);
  });
  test(`${id}: existing ledger, storage, comparisons and exports accept its rep events`, async () => {
    const x = harness(id);
    x.cycle();
    const ledger = new SessionLedger(id);
    for (const e of x.events) {
      ledger.consume(e);
      ledger.consume(e);
    }
    const r = ledger.snapshot(3000);
    expect(r.totalReps).toBe(1);
    expect(r.type).toBe("REP_BASED");
    expect(isSessionReport(r)).toBe(true);
    const db = createHistoryStore(new IDBFactory());
    await db.save(r);
    expect(await db.list()).toEqual([r]);
    expect(isSessionReport(JSON.parse(JSON.stringify(r)))).toBe(true);
    expect(reportCsv(r)).toContain(EXERCISE_BY_ID[id].name);
    expect(printableReport(r)).toContain(EXERCISE_BY_ID[id].name);
    expect(historyTotals([r]).totalReps).toBe(1);
    expect(evolution([r], id, "all", cohort(r), new Date(Date.now() + 1000)).points).toHaveLength(
      1,
    );
    expect(comparison(r, { ...r, id: "previous" })).toMatchObject({
      compatible: true,
      totalReps: 0,
    });
  });
  test(`${id}: complete cycles across dimensions, roll, mirror, and cadence`, () => {
    for (const [w, h, r, dt] of [
      [1000, 1000, 0, 160],
      [1920, 1080, 5, 180],
      [1080, 1920, -5, 300],
    ]) {
      const x = harness(id, w, h, r, dt);
      const result = x.cycle();
      expect({ id, result, reps: x.a.totalReps }).toMatchObject({
        reps: 1,
        result: { correctReps: 1 },
      });
      expect(x.events.filter((e) => e?.type === "repetition")).toHaveLength(1);
    }
    const x = harness(id);
    x.feed("base", 4, true, "left", (l) => l.forEach((p) => (p.x = 1 - p.x)));
    if (id === "reverselunge")
      x.feed("step", 4, true, "left", (l) => l.forEach((p) => (p.x = 1 - p.x)));
    x.feed("entry", 4, true, "left", (l) => l.forEach((p) => (p.x = 1 - p.x)));
    x.feed("target", 4, true, "left", (l) => l.forEach((p) => (p.x = 1 - p.x)));
    x.feed("base", 4, true, "left", (l) => l.forEach((p) => (p.x = 1 - p.x)));
    expect(x.a.totalReps).toBe(1);
  });
  test(`${id}: no countdown, static, mid-cycle, lost tracking or single-frame counts`, () => {
    const prep = harness(id);
    for (const stage of ["base", "step", "entry", "target", "base"] as Stage[])
      prep.feed(stage, 8, false);
    expect(prep.a.totalReps).toBe(0);
    const mid = harness(id);
    mid.feed("target", 10);
    mid.feed("base", 5);
    expect(mid.a.totalReps).toBe(0);
    const hold = harness(id);
    hold.feed("base", 4);
    if (id === "reverselunge") hold.feed("step", 4);
    hold.feed("entry", 4);
    hold.feed("target", 30);
    expect(hold.a.totalReps).toBe(0);
    hold.feed("base", 5);
    expect(hold.a.totalReps).toBe(1);
    hold.feed("base", 25);
    expect(hold.a.totalReps).toBe(1);
    const loss = harness(id);
    loss.feed("base");
    if (id === "reverselunge") loss.feed("step");
    loss.feed("entry");
    loss.feed("target", 1, true, "left", (l) => l.forEach((p) => (p.visibility = 0)));
    loss.feed("base", 10);
    expect(loss.a.totalReps).toBe(0);
    const glitch = harness(id);
    glitch.feed("base", 10);
    glitch.feed("target", 1);
    glitch.feed("base", 10);
    expect(glitch.a.totalReps).toBe(0);
  });
}
test("mountain climber requires alternating completed knees, not sustained or repeated same-side frames", () => {
  const x = harness("mountainclimber");
  x.cycle("left");
  x.cycle("left");
  expect(x.a.totalReps).toBe(1);
  x.cycle("right");
  expect(x.a.totalReps).toBe(2);
  const y = harness("mountainclimber");
  y.feed("base");
  y.feed("target", 4, true, "left");
  y.feed("target", 4, true, "right");
  y.feed("base");
  expect(y.a.totalReps).toBe(0);
});
test("reverse lunge requires a backward step and feet-together reset", () => {
  const x = harness("reverselunge");
  x.feed("base");
  x.feed("target", 8);
  x.feed("base");
  expect(x.a.totalReps).toBe(0);
});

test("single-side exercises select either side and never switch during a cycle", () => {
  for (const id of [
    "glutebridge",
    "calfraise",
    "frontraise",
    "bentoverrow",
    "tricepskickback",
  ] as NewExerciseId[]) {
    const x = harness(id);
    const right = (l: Landmark[]) =>
      l.forEach((p, i) => {
        if (i % 2 === 1) p.visibility = 0.6;
      });
    expect(x.feed("base", 4, true, "left", right).side).toBe("right");
    expect(x.feed("entry").side).toBe("right");
    expect(
      x.feed("target", 1, true, "left", (l) => {
        l[12]!.visibility = 0;
      }).tracking,
    ).toBe(false);
    x.feed("base");
    expect(x.a.totalReps).toBe(0);
  }
});
test("calf raise ignores leaning and whole-body translation with flat feet", () => {
  const x = harness("calfraise");
  x.feed("base");
  x.feed("base", 10, true, "left", (l) => {
    l[11]!.x = 0.36;
    l[12]!.x = 0.36;
  });
  x.feed("base");
  expect(x.a.totalReps).toBe(0);
  const y = harness("calfraise");
  y.feed("base");
  y.feed("base", 8, true, "left", (l) => l.forEach((p) => (p.y -= 0.06)));
  y.feed("base");
  expect(y.a.totalReps).toBe(0);
});
test("row ignores rigid torso/arm motion; shoulder press requires both arms", () => {
  const x = harness("bentoverrow");
  x.feed("base");
  x.feed("base", 8, true, "left", (l) => {
    for (const i of [11, 12, 13, 14, 15, 16]) l[i]!.x += 0.03;
  });
  x.feed("base");
  expect(x.a.totalReps).toBe(0);
  const y = harness("shoulderpress");
  y.feed("base");
  const baseline = expansionPose("shoulderpress", "base");
  y.feed("target", 10, true, "left", (l) => {
    for (const i of [12, 14, 16]) l[i] = { ...baseline[i]! };
  });
  y.feed("base");
  expect(y.a.totalReps).toBe(0);
});
test("reverse lunge rejects a forward step", () => {
  const x = harness("reverselunge");
  x.feed("base");
  const forward = (l: Landmark[]) => {
    for (const i of [26, 28, 30, 32]) l[i]!.x += 0.5;
  };
  x.feed("step", 4, true, "left", forward);
  x.feed("entry", 4, true, "left", forward);
  x.feed("target", 4, true, "left", forward);
  x.feed("base");
  expect(x.a.totalReps).toBe(0);
});

test("row does not count an elbow curl without posterior upper-arm displacement", () => {
  const x = harness("bentoverrow");
  x.feed("base");
  const stationary = (l: Landmark[]) => {
    for (const o of [0, 1]) {
      l[13 + o] = { ...l[13 + o]!, x: 0.6, y: 0.48 };
      l[15 + o] = { ...l[15 + o]!, x: 0.48, y: 0.44 };
    }
  };
  x.feed("target", 10, true, "left", stationary);
  x.feed("base");
  expect(x.a.totalReps).toBe(0);
});

test("completion feedback uses the recorded issue, without inventing an amplitude problem", () => {
  const x = harness("frontraise");
  x.feed("base");
  x.feed("entry");
  x.feed("target", 8, true, "left", (l) => {
    for (const o of [0, 1]) l[15 + o] = { ...l[15 + o]!, x: 0.68, y: 0.18 };
  });
  x.feed("base");
  const done = x.results.find((r) => r.event?.type === "repetition");
  expect(done?.event).toMatchObject({
    type: "repetition",
    correct: false,
    issues: ["Evite dobrar o cotovelo na elevação frontal"],
  });
  expect(done?.message).toBe("Evite dobrar o cotovelo na elevação frontal");
  const good = harness("glutebridge");
  good.cycle();
  expect(good.results.find((r) => r.event?.type === "repetition")?.level).toBe("good");
});
