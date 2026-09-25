import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Download, FileText, Trash2 } from "lucide-react";
import { exportReport, type HistorySession } from "@/lib/history";
import { downloadCsv, printReport } from "@/lib/history-export";
import {
  durationLabel,
  factualSummary,
  occurrences,
  proportion,
  sessionStats,
} from "@/lib/progress";
import { EXERCISES } from "../data";
export function SessionDetail({
  report,
  onBack,
  onDelete,
}: {
  report: HistorySession;
  onBack: () => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const [confirm, setConfirm] = useState(false),
    [pending, setPending] = useState(false),
    [error, setError] = useState("");
  const [eventLimit, setEventLimit] = useState(20);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo(0, 0);
  }, [report.id]);
  const ratio = proportion(report),
    rows = occurrences(report);
  function exportFile(action: () => void) {
    setError("");
    try {
      action();
    } catch {
      setError(
        "Não foi possível exportar. Verifique se o navegador permite downloads e novas janelas e tente novamente.",
      );
    }
  }
  return (
    <div className="progress-detail">
      <button type="button" className="progress-back" onClick={onBack}>
        <ArrowLeft size={18} />
        Voltar ao progresso
      </button>
      <header className="progress-header">
        <p className="torvik-kicker">Relatório salvo</p>
        <h1 ref={heading} tabIndex={-1}>
          {EXERCISES.find((e) => e.id === report.exercise)?.name ?? report.exercise}
        </h1>
        <p>{new Date(report.createdAt).toLocaleString("pt-BR")}</p>
      </header>
      <section className="progress-panel">
        <h2>Resultado da sessão</h2>
        <dl className="progress-detail-stats">
          {sessionStats(report).map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <SessionRatio report={report} />
        <p className="progress-caption">
          Tempo ativo exclui preparação, pausas e períodos sem rastreamento.
        </p>
      </section>
      <section className="progress-panel">
        <p className="torvik-kicker">Resumo factual</p>
        <h2>O que ficou registrado</h2>
        <p className="progress-summary">{factualSummary(report)}</p>
        <p className="progress-caption">
          {ratio === null && report.type !== "HOLD_BASED" ? "Não há proporção para avaliar. " : ""}
          Esses resultados descrevem critérios do aplicativo; não comprovam melhora biomecânica ou
          segurança da execução.
        </p>
      </section>
      <section className="progress-panel">
        <h2>Análise da execução</h2>
        <p className="progress-caption">
          {report.type === "HOLD_BASED"
            ? "O tempo válido acumula apenas intervalos observados com postura dentro dos critérios."
            : `${report.correctReps} repetições atenderam ao conjunto de critérios. O atendimento de cada critério individual não foi registrado separadamente.`}
        </p>
        <h3 className="progress-subtitle">Critérios não atendidos e orientações registradas</h3>
        {!report.feedbackCounts ? (
          <p className="progress-empty-inline">
            Esta sessão antiga não contém o detalhamento das ocorrências.
          </p>
        ) : !rows.length ? (
          <p className="progress-caption">
            {report.type === "HOLD_BASED"
              ? "Nenhuma ocorrência persistente registrada."
              : report.totalReps
                ? "Nenhuma ocorrência registrada nas repetições avaliadas."
                : "Nenhuma repetição completa para detalhar."}
          </p>
        ) : (
          <ul className="progress-issues">
            {rows.map(([message, count]) => (
              <li key={message}>
                <span>{message}</span>
                <strong>{count}×</strong>
              </li>
            ))}
          </ul>
        )}
        <p className="progress-caption">
          {report.type === "HOLD_BASED"
            ? "As ocorrências representam episódios de postura persistentes. Postura inválida, pausas e perdas de rastreamento não acumulam tempo válido."
            : "Uma repetição pode apresentar mais de uma ocorrência. Orientações momentâneas entre repetições não são armazenadas."}
        </p>
        <dl className="progress-interruptions">
          <div>
            <dt>{report.type === "HOLD_BASED" ? "Interrupções" : "Ciclos interrompidos"}</dt>
            <dd>{report.interruptedCycles ?? "Não registrado"}</dd>
          </div>
          <div>
            <dt>Perdas de rastreamento</dt>
            <dd>{report.trackingLosses ?? "Não registrado"}</dd>
          </div>
        </dl>
        <p className="progress-version">
          Regras {report.rulesVersion} · Estimador {report.engineVersion}
        </p>
      </section>
      {report.type === "HOLD_BASED" ? null : report.repetitionLog ? (
        <details className="progress-panel">
          <summary>Repetições registradas ({report.repetitionLog.events.length})</summary>
          <p className="progress-caption">Instante aproximado no tempo ativo da sessão.</p>
          {!report.repetitionLog.events.length ? (
            <p className="progress-caption">Nenhuma repetição concluída.</p>
          ) : (
            <ol className="progress-issues">
              {report.repetitionLog.events.slice(0, eventLimit).map((event, index) => (
                <li key={event.id}>
                  <span>
                    Repetição {index + 1} · {durationLabel(event.activeSeconds)}
                    <br />
                    {event.correct
                      ? "Dentro dos critérios"
                      : event.issues.join(" · ") || "Fora dos critérios"}
                  </span>
                </li>
              ))}
            </ol>
          )}
          {report.repetitionLog.events.length > eventLimit && (
            <button
              type="button"
              className="progress-text-button"
              onClick={() => setEventLimit((n) => n + 20)}
            >
              Mostrar mais repetições
            </button>
          )}
        </details>
      ) : (
        <p className="progress-caption">
          Os eventos individuais das repetições não foram registrados nesta sessão.
        </p>
      )}
      <section className="progress-panel">
        <h2>Guardar uma cópia</h2>
        <p className="progress-caption">
          O PDF usa a impressão do navegador. Na janela do relatório, escolha “Imprimir / Salvar
          como PDF”.
        </p>
        <div className="progress-export-actions">
          <button type="button" onClick={() => exportFile(() => printReport(report))}>
            <FileText size={17} />
            Salvar em PDF
          </button>
          <button type="button" onClick={() => exportFile(() => exportReport(report))}>
            <Download size={17} />
            Exportar JSON
          </button>
          <button type="button" onClick={() => exportFile(() => downloadCsv(report))}>
            <Download size={17} />
            Exportar CSV
          </button>
        </div>
        {error && (
          <p role="alert" className="progress-error">
            {error}
          </p>
        )}
      </section>
      <button type="button" className="progress-delete" onClick={() => setConfirm(true)}>
        <Trash2 size={16} />
        Excluir sessão
      </button>
      {confirm && (
        <section className="progress-panel" aria-label="Confirmar exclusão">
          <p>Excluir somente esta sessão? Exporte antes se quiser uma cópia.</p>
          <div className="progress-export-actions">
            <button type="button" disabled={pending} onClick={() => setConfirm(false)}>
              Manter sessão
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={async () => {
                setPending(true);
                setError("");
                try {
                  await onDelete(report.id);
                } catch {
                  setError("Não foi possível excluir a sessão. Tente novamente.");
                  setPending(false);
                }
              }}
            >
              {pending ? "Excluindo…" : "Confirmar exclusão"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
export function SessionRatio({ report }: { report: HistorySession }) {
  const ratio = proportion(report);
  if (report.type === "HOLD_BASED") return null;
  return (
    <div className="progress-ratio">
      {ratio === null ? (
        <p>Dados insuficientes: nenhuma repetição avaliada.</p>
      ) : (
        <>
          <div>
            <span>
              {report.correctReps} de {report.totalReps} nos critérios
            </span>
            <strong>{Math.round(ratio)}%</strong>
          </div>
          <progress aria-label="Proporção nos critérios" max={100} value={ratio} />
        </>
      )}
    </div>
  );
}
