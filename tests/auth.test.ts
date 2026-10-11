import { expect, test } from "bun:test";
import { IDBFactory } from "fake-indexeddb";
import { authErrorMessage, authRedirect, passwordError } from "../src/lib/auth";
import { createHistoryStore } from "../src/lib/history";
import { SessionLedger } from "../src/lib/session";

test("histórico de contas e visitante permanece isolado, inclusive exclusão e gravação em andamento", async () => {
  const factory = new IDBFactory();
  const guest = createHistoryStore(factory);
  const alice = createHistoryStore(factory, "account-a");
  const bob = createHistoryStore(factory, "account-b");
  const report = { ...new SessionLedger("squat").snapshot(0), seconds: 10 };
  await guest.save(report);
  expect(await alice.list()).toEqual([]);
  expect(await bob.list()).toEqual([]);
  const saving = alice.save({ ...report, seconds: 20 });
  await bob.save({ ...report, seconds: 30 });
  await saving;
  expect((await createHistoryStore(factory, "account-a").list())[0]?.seconds).toBe(20);
  expect((await bob.list())[0]?.seconds).toBe(30);
  await alice.remove(report.id);
  expect(await alice.list()).toEqual([]);
  expect((await guest.list())[0]?.seconds).toBe(10);
  expect((await bob.list())[0]?.seconds).toBe(30);
});
test("mensagens não exibem respostas brutas nem detalhes de conta", () => {
  expect(authErrorMessage({ code: "invalid_credentials" })).toBe("E-mail ou senha incorretos.");
  expect(authErrorMessage({ code: "email_not_confirmed" })).toContain("Confirme seu e-mail");
  expect(authErrorMessage({ code: "user_already_exists" })).toContain("Já existe uma conta");
  expect(authErrorMessage({ code: "email_exists" })).toContain("Já existe uma conta");
  expect(authErrorMessage({ code: "over_email_send_rate_limit" })).toContain("Muitas tentativas");
  expect(
    authErrorMessage({ code: "unknown", message: "private@example.com token=secret" }),
  ).not.toContain("secret");
  expect(authErrorMessage(new Error("network"))).toContain("conexão");
});
test("cadastro e redefinição validam confirmação sem aparar a senha", () => {
  expect(passwordError("short", "short")).toContain("8 caracteres");
  expect(passwordError("valid-password", "different-password")).toContain("não coincidem");
  expect(passwordError(" with spaces ", " with spaces ")).toBeNull();
  expect(authRedirect("https://torvik-ai.vercel.app/arbitrary?next=https://other.example")).toBe(
    "https://torvik-ai.vercel.app/",
  );
  expect(authRedirect("http://localhost:4173", true)).toBe("http://localhost:4173/?auth=recovery");
});
