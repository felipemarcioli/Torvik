import { test, expect } from "./build-fixture";
import type { Page } from "@playwright/test";
import type { HistorySession } from "../../src/lib/history";
function fixtures(count = 4): HistorySession[] {
  const at = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(10, 0, 0, 0);
    return d.toISOString();
  };
  const a: HistorySession = {
    schemaVersion: 1,
    id: "a",
    exercise: "squat",
    createdAt: at(1),
    seconds: 90,
    totalReps: 10,
    correctReps: 8,
    feedbackCounts: { Amplitude: 2 },
    interruptedCycles: 1,
    trackingLosses: 1,
    rulesVersion: "v1",
    engineVersion: "pose1",
  };
  if (count > 4) return Array.from({ length: count }, (_, i) => ({ ...a, id: String(i) }));
  const rows: HistorySession[] = [
    a,
    { ...a, id: "b", createdAt: at(2), totalReps: 20, correctReps: 18, seconds: 120 },
    {
      ...a,
      id: "c",
      exercise: "pushup",
    },
    {
      ...a,
      id: "d",
      createdAt: at(3),
      rulesVersion: "v2",
      totalReps: 0,
      correctReps: 0,
      feedbackCounts: {},
    },
  ];
  delete rows[2]!.feedbackCounts;
  delete rows[2]!.trackingLosses;
  delete rows[2]!.interruptedCycles;
  return rows.slice(0, count);
}
async function seed(page: Page, rows = fixtures()) {
  await page.route("https://fonts.googleapis.com/**", (r) => r.abort());
  await page.goto("/");
  await page.evaluate(async (records) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("torvik-history", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("sessions", { keyPath: "id" });
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("sessions", "readwrite");
      for (const record of records) tx.objectStore("sessions").put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, rows);
  await page.getByRole("button", { name: "Progresso", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Progresso", exact: true })).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByText("Carregando seu progresso…")).toHaveCount(0);
}
const card = (page: Page, id: string) => page.locator(`.progress-session-card:has(#session-${id})`);
test("dashboard calcula totais, filtra, ordena, consulta gráfico e calendário", async ({
  page,
}) => {
  await seed(page);
  await expect(page.locator(".progress-totals dd")).toHaveText(["4", "40", "34", "6 min 30 s"]);
  await expect(page.locator(".progress-session-card")).toHaveCount(4);
  await page.getByRole("button", { name: /^Filtrar/ }).click();
  await expect(page.getByRole("group", { name: "Filtrar sessões" }).getByRole("button")).toHaveText(
    ["Todos", "Agachamento", "Flexão de Braço"],
  );
  await page
    .getByRole("group", { name: "Filtrar sessões" })
    .getByRole("button", { name: "Flexão de Braço" })
    .click();
  await expect(page.locator(".progress-session-card")).toHaveCount(1);
  await page.getByRole("button", { name: /^Filtrar/ }).click();
  await page
    .getByRole("group", { name: "Filtrar sessões" })
    .getByRole("button", { name: "Todos", exact: true })
    .click();
  await page.getByRole("combobox", { name: "Ordenar", exact: true }).selectOption("reps");
  await expect(page.locator(".progress-session-card").first().locator("button")).toHaveAttribute(
    "id",
    "session-b",
  );
  await page.getByText("Gráficos de evolução", { exact: true }).click();
  await page.getByLabel("Exercício do gráfico").selectOption("squat");
  await page.getByRole("combobox", { name: "Métrica", exact: true }).selectOption("proportion");
  await expect(page.locator(".progress-chart-reading")).toContainText("80%");
  await page.getByLabel("Consultar ponto").selectOption({ index: 0 });
  await expect(page.locator(".progress-chart-reading")).toContainText("90%");
  await page.getByText("Seu ritmo de registros", { exact: true }).click();
  const date = new Date(fixtures()[0]!.createdAt).toLocaleDateString("pt-BR");
  await page
    .locator(".progress-calendar")
    .getByRole("button", { name: new RegExp(date.replaceAll("/", "\\/")) })
    .click();
  await expect(page.locator(".progress-session-card")).toHaveCount(2);
  await page.getByRole("button", { name: "Limpar filtro de data" }).click();
  await expect(page.locator(".progress-session-card")).toHaveCount(4);
});
test("comparação é restrita ao exercício e protege versões incompatíveis", async ({ page }) => {
  await seed(page);
  await page.getByRole("button", { name: "Comparar", exact: true }).click();
  await card(page, "a").getByRole("checkbox").check();
  await expect(card(page, "c").getByRole("checkbox")).toBeDisabled();
  await card(page, "b").getByRole("checkbox").check();
  await expect(card(page, "d").getByRole("checkbox")).toBeDisabled();
  await page.getByRole("button", { name: "Comparar selecionadas" }).click();
  await expect(page.getByRole("heading", { name: "Comparar sessões" })).toBeVisible();
  await expect(page.getByText("−10 p.p.").or(page.getByText("-10 p.p."))).toBeVisible();
  await page.getByRole("button", { name: "Voltar ao progresso" }).click();
  await card(page, "b").getByRole("checkbox").uncheck();
  await card(page, "d").getByRole("checkbox").check();
  await page.getByRole("button", { name: "Comparar selecionadas" }).click();
  await expect(page.getByText(/Versões diferentes de regras/)).toBeVisible();
  await expect(page.getByText("Não comparável", { exact: true })).toHaveCount(2);
});
test("detalhes preservam dados antigos, exportam e excluem só a sessão escolhida", async ({
  page,
}, info) => {
  await seed(page);
  await page.locator("#session-c").click();
  await expect(
    page.getByText("Esta sessão antiga não contém o detalhamento das ocorrências."),
  ).toBeVisible();
  await expect(page.getByText("Não registrado", { exact: true })).toHaveCount(2);
  const downloadJson = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar JSON", exact: true }).click();
  const json = await downloadJson;
  expect(json.suggestedFilename()).toMatch(/\.json$/);
  const stream = await json.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  expect(JSON.parse(Buffer.concat(chunks).toString()).id).toBe("c");
  const downloadCsv = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar CSV", exact: true }).click();
  expect((await downloadCsv).suggestedFilename()).toMatch(/\.csv$/);
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Salvar em PDF" }).click();
  const popup = await popupPromise;
  await expect(popup.getByRole("heading", { name: "Flexão de Braço" })).toBeVisible();
  await expect(
    popup.getByText("Detalhamento dos critérios não registrado nesta sessão."),
  ).toBeVisible();
  if (info.project.name === "desktop-chromium")
    await popup.pdf({
      path: "/tmp/torvik-history-report.pdf",
      format: "A4",
      printBackground: true,
    });
  await popup.close();
  await page.getByRole("button", { name: "Excluir sessão", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar exclusão" }).click();
  await expect(page.locator(".progress-session-card")).toHaveCount(3);
  await page.reload();
  await page.getByRole("button", { name: "Progresso", exact: true }).click();
  await expect(page.locator(".progress-session-card")).toHaveCount(3);
  await expect(page.locator("#session-a")).toBeVisible();
});
test("vazio, armazenamento indisponível e exportação bloqueada são recuperáveis", async ({
  page,
}) => {
  await seed(page, []);
  await expect(page.getByText(/Nenhuma sessão salva/)).toBeVisible();
  await page.getByRole("button", { name: "Iniciar um treino" }).click();
  await expect(page.getByRole("heading", { name: "Escolha o exercício" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Preparar câmera", exact: true })).toBeDisabled();
  await seed(page, fixtures(1));
  await page.locator("#session-a").click();
  await page.evaluate(() => {
    window.open = () => null;
  });
  await page.getByRole("button", { name: "Salvar em PDF" }).click();
  await expect(page.getByRole("alert")).toContainText("Não foi possível exportar");
  await page.addInitScript(() => Object.defineProperty(window, "indexedDB", { value: undefined }));
  await page.reload();
  await page.getByRole("button", { name: "Progresso", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Histórico indisponível");
  await expect(page.getByRole("button", { name: "Tentar novamente" })).toBeVisible();
});
test("mil sessões paginam e layout não transborda com texto ampliado", async ({ page }, info) => {
  await seed(page, fixtures(1000));
  await expect(page.locator(".progress-session-card")).toHaveCount(5);
  await page.getByRole("button", { name: /Mostrar mais sessões/ }).click();
  await expect(page.locator(".progress-session-card")).toHaveCount(25);
  for (const [width, height] of [
    [360, 800],
    [390, 844],
    [430, 932],
    [844, 390],
    [768, 1024],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width: width!, height: height! });
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
    if (info.project.name === "desktop-chromium")
      await page.screenshot({ path: `/tmp/torvik-progress-${width}.png`, fullPage: false });
  }
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addStyleTag({ content: "html { font-size: 32px !important; }" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
