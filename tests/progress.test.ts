import { expect, test } from "bun:test";
import { IDBFactory } from "fake-indexeddb";
import { SessionLedger } from "../src/lib/session";
import { createHistoryStore, type HistorySession } from "../src/lib/history";
import {
  activity,
  calendarDays,
  cohort,
  comparison,
  durationLabel,
  evolution,
  factualSummary,
  filterHistory,
  historyTotals,
  localDay,
  periodStart,
  proportion,
} from "../src/lib/progress";
import { printableReport, reportCsv } from "../src/lib/history-export";
const now = new Date(2026, 8, 24, 14);
function session(patch: Partial<HistorySession> = {}): HistorySession {
  return {
    schemaVersion: 1,
    id: "a",
    createdAt: new Date(2026, 8, 24, 10).toISOString(),
    exercise: "squat",
    seconds: 90,
    totalReps: 10,
    correctReps: 8,
    feedbackCounts: { Amplitude: 2 },
    interruptedCycles: 1,
    trackingLosses: 2,
    rulesVersion: "v1",
    engineVersion: "pose1",
    ...patch,
  };
}
function withoutFeedback(report = session()) {
  const copy = { ...report };
  delete copy.feedbackCounts;
  return copy;
}
test("totais, duração e proporções usam contagens reais, inclusive sessões vazias", () => {
  expect(
    historyTotals([session(), session({ id: "b", totalReps: 0, correctReps: 0, seconds: 0 })]),
  ).toEqual({ sessions: 2, totalReps: 10, correctReps: 8, seconds: 90 });
  expect(proportion(session())).toBe(80);
  expect(proportion(session({ totalReps: 0, correctReps: 0 }))).toBeNull();
  expect(durationLabel(3661)).toBe("1h 1min 1s");
  expect(factualSummary(session({ totalReps: 0, correctReps: 0 }))).toContain("Nenhuma repetição");
  expect(factualSummary(withoutFeedback())).toContain("não foi registrado");
});
test("filtros, ordenação cronológica e datas locais não modificam a entrada", () => {
  const rows = [
    session(),
    session({
      id: "b",
      exercise: "pushup",
      totalReps: 20,
      seconds: 120,
      createdAt: new Date(2026, 8, 23, 10).toISOString(),
    }),
  ];
  expect(filterHistory(rows, "all", "oldest").map((r) => r.id)).toEqual(["b", "a"]);
  expect(filterHistory(rows, "all", "reps")[0]!.id).toBe("b");
  expect(filterHistory(rows, "all", "time")[0]!.id).toBe("b");
  expect(filterHistory(rows, "squat", "recent").length).toBe(1);
  expect(filterHistory(rows, "all", "recent", "2026-09-23")[0]!.id).toBe("b");
  expect(rows[0]!.id).toBe("a");
  expect(localDay(new Date(2026, 8, 24, 0, 1))).toBe("2026-09-24");
  expect(periodStart("7", now)).toBe(new Date(2026, 8, 18).getTime());
});
test("gráfico pondera proporções, não inventa dias e separa versões", () => {
  const a = session({ totalReps: 2, correctReps: 2 });
  const rows = [
    a,
    session({ id: "b", totalReps: 8, correctReps: 4 }),
    session({ id: "other", rulesVersion: "v2" }),
    session({ id: "future", createdAt: new Date(2026, 8, 25).toISOString() }),
  ];
  const daily = evolution(rows, "squat", "30", cohort(a), now);
  expect(daily.points.length).toBe(1);
  expect(daily.points[0]!.proportion).toBe(60);
  expect(daily.points[0]!.sessions).toBe(2);
  expect(evolution(rows, "squat", "7", cohort(a), now).points.length).toBe(2);
  expect(evolution(rows, "pushup", "all", cohort(a), now).points).toEqual([]);
  expect(
    evolution([session({ totalReps: 0, correctReps: 0 })], "squat", "all", cohort(a), now)
      .points[0]!.proportion,
  ).toBeNull();
  const many = Array.from({ length: 1000 }, (_, i) => session({ id: String(i) }));
  expect(evolution(many, "squat", "7", cohort(a), now).grouping).toBe("day");
  expect(evolution(many, "squat", "all", cohort(a), now).points[0]!.sessions).toBe(1000);
});
test("comparações guardam versões, ausência de métricas e zero repetições", () => {
  const a = session(),
    b = session({
      totalReps: 20,
      correctReps: 18,
      seconds: 120,
      feedbackCounts: { Amplitude: 1, Postura: 1 },
    });
  expect(comparison(a, b)).toMatchObject({
    compatible: true,
    totalReps: 10,
    correctReps: 10,
    proportion: 10,
    seconds: 30,
  });
  expect(comparison(a, b).issues[0]).toEqual({ key: "Amplitude", a: 2, b: 1, difference: -1 });
  expect(comparison(a, { ...b, engineVersion: "other" })).toMatchObject({
    compatible: false,
    correctReps: null,
    proportion: null,
    issues: [],
  });
  expect(comparison(a, withoutFeedback(b)).issues).toEqual([]);
  expect(comparison(a, { ...b, totalReps: 0, correctReps: 0 }).proportion).toBeNull();
  expect(() => comparison(a, { ...b, exercise: "pushup" })).toThrow();
});
test("atividade e calendário usam apenas datas registradas, com empates", () => {
  const rows = [
    session(),
    session({ id: "b", exercise: "pushup" }),
    session({ id: "c", createdAt: new Date(2026, 7, 1).toISOString(), exercise: "jumpingjack" }),
  ];
  expect(activity(rows, now)).toMatchObject({
    days: 1,
    recent: { sessions: 2 },
    most: ["squat", "pushup", "jumpingjack"],
  });
  expect(activity([], now).days).toBe(0);
  const days = calendarDays(new Date(2026, 8, 1));
  expect(days).toHaveLength(42);
  expect(days[0]!.getDay()).toBe(1);
  expect(new Set(days.map(localDay)).size).toBe(42);
});
test("histórico lê registros anteriores incompletos sem modificar o banco", async () => {
  const factory = new IDBFactory();
  const store = createHistoryStore(factory);
  await store.list();
  const old = session();
  delete old.feedbackCounts;
  delete old.trackingLosses;
  delete old.interruptedCycles;
  const db = await new Promise<IDBDatabase>((resolve) => {
    const r = factory.open("torvik-history", 1);
    r.onsuccess = () => resolve(r.result);
  });
  await new Promise<void>((resolve) => {
    const t = db.transaction("sessions", "readwrite");
    t.objectStore("sessions").put(old);
    t.oncomplete = () => resolve();
  });
  expect(await store.list()).toEqual([old]);
  const raw = await new Promise<unknown>((resolve) => {
    const r = db.transaction("sessions").objectStore("sessions").get(old.id);
    r.onsuccess = () => resolve(r.result);
  });
  expect(raw).toEqual(old);
  db.close();
});
test("eventos futuros são únicos, relativos ao tempo ativo e independentes do snapshot", async () => {
  const ledger = new SessionLedger("squat");
  ledger.clock.setRunning(true, 1000);
  const event = {
    type: "repetition" as const,
    id: 1,
    timestamp: 4000,
    correct: false,
    issues: ["Amplitude", "Amplitude"],
  };
  ledger.consume(event);
  ledger.consume(event);
  ledger.clock.setRunning(false, 5000);
  ledger.clock.setRunning(true, 10000);
  ledger.consume({ ...event, id: 2, timestamp: 11000, correct: true, issues: [] });
  const result = ledger.snapshot(11000);
  expect(result.repetitionLog!.events.map((e) => e.activeSeconds)).toEqual([3, 5]);
  expect(result.repetitionLog!.events[0]!.issues).toEqual(["Amplitude"]);
  result.repetitionLog!.events[0]!.issues.push("changed");
  expect(ledger.snapshot(11000).repetitionLog!.events[0]!.issues).toEqual(["Amplitude"]);
  const store = createHistoryStore(new IDBFactory());
  await store.save(ledger.snapshot(11000));
  expect((await store.list())[0]!.repetitionLog!.events).toHaveLength(2);
});
test("CSV e relatório imprimível preservam conteúdo e escapam fórmulas/HTML", () => {
  const r = session({
    rulesVersion: " =1+1",
    feedbackCounts: { '<script>alert("x")</script>': 2 },
  });
  const csv = reportCsv(r),
    html = printableReport(r);
  expect(csv.startsWith("\uFEFF")).toBe(true);
  expect(csv).toContain('"\' =1+1"');
  expect(csv).toContain('alert(""x"")');
  expect(html).not.toContain("<script>alert");
  expect(html).toContain("&lt;script&gt;");
  expect(html).toContain("80%");
  expect(printableReport(withoutFeedback())).toContain("não registrado");
  expect(reportCsv(session({ totalReps: 0, correctReps: 0 }))).toContain("indisponivel");
});
