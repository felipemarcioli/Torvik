import { expect, test } from "bun:test";
import { IDBFactory } from "fake-indexeddb";
import { ActiveClock, SessionLedger, formatTime } from "../src/lib/session";
import { createHistoryStore, comparableReports } from "../src/lib/history";
test("relógio exclui preparação e pausas; eventos são únicos e snapshots independentes", () => {
  const c = new ActiveClock();
  expect(c.seconds(10000)).toBe(0);
  c.setRunning(true, 10000);
  c.setRunning(false, 12500);
  expect(c.seconds(20000)).toBe(2);
  c.setRunning(true, 20000);
  expect(c.seconds(21500)).toBe(4);
  const l = new SessionLedger("squat");
  const event = {
    id: 1,
    type: "repetition" as const,
    correct: false,
    issues: ["Amplitude", "Postura", "Postura"],
    timestamp: 1,
  };
  l.consume(event);
  l.consume(event);
  const r = l.snapshot(0);
  expect(r.totalReps).toBe(1);
  expect(r.feedbackCounts).toEqual({ Amplitude: 1, Postura: 1 });
  r.feedbackCounts["Outro"] = 4;
  expect(l.snapshot(0).feedbackCounts["Outro"]).toBeUndefined();
  expect(formatTime(65.9)).toBe("01:05");
});
test("histórico salva explicitamente, persiste entre conexões, atualiza sem duplicar e exclui", async () => {
  const factory = new IDBFactory();
  const a = createHistoryStore(factory),
    b = createHistoryStore(factory);
  const report = new SessionLedger("squat").snapshot(0);
  expect(await a.list()).toEqual([]);
  await a.save(report);
  await a.save(report);
  expect((await b.list()).length).toBe(1);
  expect((await b.list())[0]).toEqual(report);
  expect(comparableReports(report, { ...report, rulesVersion: "other" })).toBe(false);
  expect(comparableReports(report, { ...report, engineVersion: "other" })).toBe(false);
  await b.remove(report.id);
  expect(await a.list()).toEqual([]);
});
test("histórico rejeita dados inválidos e armazenamento indisponível", async () => {
  const store = createHistoryStore(new IDBFactory());
  await expect(
    store.save({ ...new SessionLedger("squat").snapshot(0), seconds: NaN }),
  ).rejects.toThrow();
  await expect(createHistoryStore(undefined).list()).rejects.toThrow();
});
