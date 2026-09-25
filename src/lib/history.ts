import { EXERCISE_BY_ID, isExerciseId } from "./exercises/catalog";
import type { SessionReport } from "./session";
type Historical<T> = T extends SessionReport
  ? Omit<T, "feedbackCounts" | "interruptedCycles" | "trackingLosses"> &
      Partial<Pick<T, "feedbackCounts" | "interruptedCycles" | "trackingLosses">>
  : never;
export type HistorySession = Historical<SessionReport>;
const DATABASE = "torvik-history";
const STORE = "sessions";
function validRepetitionLog(value: unknown) {
  if (value === undefined) return true;
  if (!value || typeof value !== "object") return false;
  const log = value as Record<string, unknown>;
  return (
    log["version"] === 1 &&
    Array.isArray(log["events"]) &&
    log["events"].every((entry: unknown) => {
      if (!entry || typeof entry !== "object") return false;
      const e = entry as Record<string, unknown>;
      return (
        Number.isSafeInteger(e["id"]) &&
        Number(e["id"]) >= 0 &&
        Number.isSafeInteger(e["activeSeconds"]) &&
        Number(e["activeSeconds"]) >= 0 &&
        typeof e["correct"] === "boolean" &&
        Array.isArray(e["issues"]) &&
        e["issues"].every((issue: unknown) => typeof issue === "string")
      );
    })
  );
}
export function isSessionReport(value: unknown): value is SessionReport {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const nonnegative = (n: unknown) =>
    typeof n === "number" && Number.isFinite(n) && Number.isInteger(n) && n >= 0;
  return (
    (v["schemaVersion"] === 1 || v["schemaVersion"] === 2) &&
    typeof v["id"] === "string" &&
    typeof v["createdAt"] === "string" &&
    Number.isFinite(Date.parse(v["createdAt"])) &&
    isExerciseId(v["exercise"]) &&
    (v["schemaVersion"] !== 1 || ["squat", "pushup", "jumpingjack"].includes(v["exercise"])) &&
    nonnegative(v["seconds"]) &&
    (v["type"] === "HOLD_BASED"
      ? v["schemaVersion"] === 2 &&
        EXERCISE_BY_ID[v["exercise"]].type === "HOLD_BASED" &&
        typeof v["validSeconds"] === "number" &&
        Number.isFinite(v["validSeconds"]) &&
        v["validSeconds"] >= 0 &&
        v["validSeconds"] < Number(v["seconds"]) + 1 &&
        v["totalReps"] === undefined &&
        v["correctReps"] === undefined &&
        v["repetitionLog"] === undefined
      : EXERCISE_BY_ID[v["exercise"]].type === "REP_BASED" &&
        (v["schemaVersion"] === 1
          ? v["type"] === undefined || v["type"] === "REP_BASED"
          : v["type"] === "REP_BASED") &&
        v["validSeconds"] === undefined &&
        nonnegative(v["totalReps"]) &&
        nonnegative(v["correctReps"]) &&
        Number(v["correctReps"]) <= Number(v["totalReps"])) &&
    nonnegative(v["interruptedCycles"]) &&
    nonnegative(v["trackingLosses"]) &&
    typeof v["rulesVersion"] === "string" &&
    typeof v["engineVersion"] === "string" &&
    !!v["feedbackCounts"] &&
    typeof v["feedbackCounts"] === "object" &&
    !Array.isArray(v["feedbackCounts"]) &&
    Object.values(v["feedbackCounts"]).every(nonnegative) &&
    validRepetitionLog(v["repetitionLog"])
  );
}
/** Read-only compatibility: absent optional metrics remain absent in the returned record. */
export function isHistorySession(value: unknown): value is HistorySession {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return isSessionReport({
    ...v,
    feedbackCounts: v["feedbackCounts"] === undefined ? {} : v["feedbackCounts"],
    interruptedCycles: v["interruptedCycles"] === undefined ? 0 : v["interruptedCycles"],
    trackingLosses: v["trackingLosses"] === undefined ? 0 : v["trackingLosses"],
  });
}
export function createHistoryStore(factory: IDBFactory | undefined = globalThis.indexedDB) {
  async function open(): Promise<IDBDatabase> {
    if (!factory) throw new Error("O armazenamento local não está disponível neste navegador.");
    return new Promise((resolve, reject) => {
      const request = factory.open(DATABASE, 1);
      let done = false;
      const fail = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        reject(
          new Error(
            "Não foi possível abrir o histórico. Feche outras abas ou verifique o armazenamento do navegador.",
          ),
        );
      };
      const timer = setTimeout(fail, 5000);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE))
          request.result.createObjectStore(STORE, { keyPath: "id" });
      };
      request.onerror = fail;
      request.onblocked = fail;
      request.onsuccess = () => {
        if (done) {
          request.result.close();
          return;
        }
        done = true;
        clearTimeout(timer);
        const db = request.result;
        db.onversionchange = () => db.close();
        resolve(db);
      };
    });
  }
  async function run<T>(
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const db = await open();
    return new Promise((resolve, reject) => {
      let transaction: IDBTransaction;
      try {
        transaction = db.transaction(STORE, mode);
        const request = action(transaction.objectStore(STORE));
        transaction.oncomplete = () => {
          db.close();
          resolve(request.result);
        };
        transaction.onabort = transaction.onerror = () => {
          db.close();
          reject(
            new Error(
              "Não foi possível acessar o histórico local. O espaço pode estar indisponível.",
            ),
          );
        };
      } catch {
        db.close();
        reject(new Error("Não foi possível acessar o histórico local."));
      }
    });
  }
  return {
    async list(): Promise<HistorySession[]> {
      const values: unknown[] = await run("readonly", (s) => s.getAll());
      return values
        .filter(isHistorySession)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    },
    async save(report: SessionReport) {
      if (!isSessionReport(report)) throw new Error("Relatório inválido.");
      await run("readwrite", (s) => s.put(report));
    },
    async remove(id: string) {
      await run("readwrite", (s) => s.delete(id));
    },
  };
}
export function exportReport(report: HistorySession) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `torvik-${report.createdAt.slice(0, 10)}-${report.id}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function comparableReports(a: HistorySession, b: HistorySession) {
  return (
    a.exercise === b.exercise &&
    (a.type ?? "REP_BASED") === (b.type ?? "REP_BASED") &&
    a.rulesVersion === b.rulesVersion &&
    a.engineVersion === b.engineVersion
  );
}
