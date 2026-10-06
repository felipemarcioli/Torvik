import { EXERCISES } from "../components/torvik/data";
import { durationLabel, factualSummary, occurrences, proportion, sessionStats } from "./progress";
import type { HistorySession as SessionReport } from "./history";
const csvCell = (value: string | number) =>
  `"${String(value)
    .replace(/^(?=\s*[=+@-]|[\t\r\n])/, "'")
    .replaceAll('"', '""')}"`;
export function reportCsv(report: SessionReport) {
  const rows: (string | number)[][] = [
    ["campo", "valor"],
    ["exercicio", EXERCISES.find((e) => e.id === report.exercise)?.name ?? report.exercise],
    ["data_iso", report.createdAt],
    ["tempo_ativo_segundos", report.seconds],
    ["modalidade", report.type ?? "REP_BASED"],
    ...(report.type === "HOLD_BASED"
      ? [["tempo_postura_valida_segundos", report.validSeconds]]
      : [
          ["repeticoes_avaliadas", report.totalReps],
          ["repeticoes_nos_criterios", report.correctReps],
          ["repeticoes_fora_dos_criterios", report.totalReps - report.correctReps],
          ["proporcao_percentual", proportion(report) ?? "indisponivel"],
        ]),
    ["ciclos_interrompidos", report.interruptedCycles ?? "nao registrado"],
    ["perdas_rastreamento", report.trackingLosses ?? "nao registrado"],
    ...(report.sideResults
      ? Object.entries(report.sideResults).flatMap(([side, values]) => [
          [`lado_${side}_repeticoes`, values.totalReps],
          [`lado_${side}_nos_criterios`, values.correctReps],
          [`lado_${side}_tempo_valido_segundos`, values.validSeconds],
        ])
      : []),
    ["versao_regras", report.rulesVersion],
    ["versao_estimador", report.engineVersion],
    ...occurrences(report).map(([message, count]) => [`ocorrencia: ${message}`, count]),
    ...(report.repetitionLog?.events.flatMap((event, index) => [
      [`repeticao_${index + 1}_id`, event.id],
      ...(event.side ? [[`repeticao_${index + 1}_lado`, event.side]] : []),
      [`repeticao_${index + 1}_tempo_ativo_segundos`, event.activeSeconds],
      [`repeticao_${index + 1}_nos_criterios`, event.correct ? "sim" : "nao"],
      [`repeticao_${index + 1}_motivos`, event.issues.join("; ")],
    ]) ?? []),
  ];
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
export function downloadCsv(report: SessionReport) {
  const url = URL.createObjectURL(
    new Blob([reportCsv(report)], { type: "text/csv;charset=utf-8" }),
  );
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = `torvik-${report.id}.csv`;
    a.click();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
const escape = (s: string | number) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
export function printableReport(report: SessionReport) {
  const exercise = EXERCISES.find((e) => e.id === report.exercise)?.name ?? report.exercise;
  const rows = occurrences(report),
    ratio = proportion(report);
  return `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Torvik - ${escape(exercise)}</title><style>
  @page{size:A4;margin:18mm}*{box-sizing:border-box}body{font:14px/1.55 system-ui,sans-serif;color:#182532;margin:0;background:white}main{max-width:760px;margin:auto;padding:24px}header{border-bottom:3px solid #ff8a24;padding-bottom:18px}.brand{font-size:24px;letter-spacing:4px;font-weight:800;color:#b84b00}h1{font-size:28px;margin:8px 0}h2{font-size:19px;margin:24px 0 10px}p{margin:8px 0}.muted{color:#455869;font-size:12px}.stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:20px 0}.stat{border:1px solid #b9c7d2;border-radius:12px;padding:12px;break-inside:avoid}.stat strong{display:block;font-size:23px}.stat span{font-size:12px}table{width:100%;border-collapse:collapse}th,td{text-align:left;border-bottom:1px solid #cdd6df;padding:9px;overflow-wrap:anywhere}th:last-child,td:last-child{text-align:right}tr{break-inside:avoid}thead{display:table-header-group}.summary{padding:14px;border-left:3px solid #16825a;background:#eef6f3;break-inside:avoid}.versions{overflow-wrap:anywhere}.actions{display:flex;gap:10px;padding-bottom:18px}button{padding:12px;border-radius:8px;border:1px solid #344453;cursor:pointer;background:#182532;color:white}footer{margin-top:24px;border-top:1px solid #cdd6df;padding-top:12px}@media print{main{padding:0;max-width:none}.actions{display:none}} </style></head><body><main><div class="actions"><button id="print">Imprimir / Salvar como PDF</button></div>
  <header><div class="brand">TORVIK</div><h1>${escape(exercise)}</h1><p>Relatório de sessão • ${escape(new Date(report.createdAt).toLocaleString("pt-BR"))}</p></header>
  <div class="stats">${sessionStats(report)
    .map(
      ([label, value]) =>
        `<div class="stat"><strong>${escape(value!)}</strong><span>${escape(label!)}</span></div>`,
    )
    .join("")}</div>
  ${report.type === "HOLD_BASED" ? "" : `<p>Proporção nos critérios: <strong>${ratio === null ? "Dados insuficientes" : `${ratio.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}</strong></p>`}
${
  report.sideResults
    ? `<h2>Resultados por lado</h2><table><thead><tr><th>Lado</th><th>Resultado</th></tr></thead><tbody>${Object.entries(
        report.sideResults,
      )
        .map(
          ([side, value]) =>
            `<tr><td>${side === "left" ? "Esquerdo" : "Direito"}</td><td>${report.type === "HOLD_BASED" ? escape(durationLabel(value.validSeconds)) : `${value.totalReps} repetições · ${value.correctReps} nos critérios`}</td></tr>`,
        )
        .join("")}</tbody></table>`
    : ""
}
  <h2>Resumo da sessão</h2><p class="summary">${escape(factualSummary(report))}</p>
  <h2>Ocorrências registradas</h2>${rows.length ? `<table><thead><tr><th>Orientação / critério não atendido</th><th>${report.type === "HOLD_BASED" ? "Episódios" : "Repetições"}</th></tr></thead><tbody>${rows.map(([message, count]) => `<tr><td>${escape(message)}</td><td>${count}</td></tr>`).join("")}</tbody></table>` : report.feedbackCounts ? "<p>Nenhuma ocorrência registrada.</p>" : "<p>Detalhamento dos critérios não registrado nesta sessão.</p>"}
  <p class="muted">${report.type === "HOLD_BASED" ? "As ocorrências contam episódios persistentes. O tempo válido exclui intervalos de postura inválida." : "Uma repetição pode conter mais de uma ocorrência. O histórico não registra o atendimento individual de cada critério nem todas as orientações momentâneas."}</p>
  <p>Ciclos interrompidos: ${report.interruptedCycles ?? "não registrado"} • Perdas de rastreamento: ${report.trackingLosses ?? "não registrado"}</p>
  ${report.type === "HOLD_BASED" ? "" : report.repetitionLog ? `<h2>Repetições registradas</h2><table><thead><tr><th>Repetição / tempo ativo</th><th>Resultado registrado</th></tr></thead><tbody>${report.repetitionLog.events.map((event, index) => `<tr><td>${index + 1} · ${escape(durationLabel(event.activeSeconds))}${event.side ? ` · ${event.side === "left" ? "esquerdo" : "direito"}` : ""}</td><td>${event.correct ? "Dentro dos critérios" : escape(event.issues.join("; ") || "Fora dos critérios")}</td></tr>`).join("")}</tbody></table>` : '<p class="muted">Eventos individuais não registrados nesta sessão.</p>'}
  <footer><p class="muted versions">Regras: ${escape(report.rulesVersion)} • Estimador: ${escape(report.engineVersion)}</p><p class="muted">Resultados de regras automáticas do aplicativo. Não comprovam melhora biomecânica nem segurança da execução. Tempo ativo exclui preparação, pausas e períodos sem rastreamento. Dados salvos somente no navegador e dispositivo de origem.</p></footer>
  </main></body></html>`;
}
/** Browser-owned PDF printing: no server, paid service, canvas capture, or remote fonts. */
export function printReport(report: SessionReport) {
  const popup = window.open("", "_blank");
  if (!popup) throw new Error("Permita abrir a janela do relatório e tente novamente.");
  try {
    popup.opener = null;
    popup.document.open();
    popup.document.write(printableReport(report));
    popup.document.close();
    popup.document.getElementById("print")?.addEventListener("click", () => popup.print());
    popup.focus();
  } catch (err) {
    popup.close();
    throw err;
  }
}
