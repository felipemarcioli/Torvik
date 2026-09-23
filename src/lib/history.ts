import type { SessionReport } from "./session";
const DATABASE = "torvik-history";
const STORE = "sessions";
export function isSessionReport(value: unknown): value is SessionReport {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const nonnegative = (n: unknown) =>
    typeof n === "number" && Number.isFinite(n) && Number.isInteger(n) && n >= 0;
  return (
    v["schemaVersion"] === 1 &&
    typeof v["id"] === "string" &&
    typeof v["createdAt"] === "string" &&
    Number.isFinite(Date.parse(v["createdAt"])) &&
    ["squat", "pushup", "jumpingjack"].includes(String(v["exercise"])) &&
    nonnegative(v["seconds"]) &&
    nonnegative(v["totalReps"]) &&
    nonnegative(v["correctReps"]) &&
    Number(v["correctReps"]) <= Number(v["totalReps"]) &&
    nonnegative(v["interruptedCycles"]) &&
    nonnegative(v["trackingLosses"]) &&
    typeof v["rulesVersion"] === "string" &&
    typeof v["engineVersion"] === "string" &&
    !!v["feedbackCounts"] &&
    typeof v["feedbackCounts"] === "object" &&
    !Array.isArray(v["feedbackCounts"]) &&
    Object.values(v["feedbackCounts"]).every(nonnegative)
  );
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
    async list(): Promise<SessionReport[]> {
      const values: unknown[] = await run("readonly", (s) => s.getAll());
      return values.filter(isSessionReport).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
export function exportReport(report: SessionReport) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `torvik-${report.createdAt.slice(0, 10)}-${report.id}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function comparableReports(a: SessionReport, b: SessionReport) {
  return (
    a.exercise === b.exercise &&
    a.rulesVersion === b.rulesVersion &&
    a.engineVersion === b.engineVersion
  );
}
