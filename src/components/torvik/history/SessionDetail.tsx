import { useTranslation } from "react-i18next";
import { translate as t, currentLanguage, formatNumber } from "@/lib/i18n";
import { BackButton } from "../AppNavigation";
import { useEffect, useRef, useState } from "react";
import { Download, FileText, Trash2 } from "lucide-react";
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
import { SideResults } from "./SideResults";
export function SessionDetail({
  report,
  onBack,
  onDelete,
}: {
  report: HistorySession;
  onBack: () => void;
  onDelete: (id: string) => Promise<void>;
}) {
  useTranslation();

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
      <BackButton onClick={onBack}>{t("Voltar ao progresso")}</BackButton>
      <header className="progress-header">
        <p className="torvik-kicker">{t("Relatório salvo")}</p>
        <h1 ref={heading} tabIndex={-1}>
          {t(EXERCISES.find((e) => e.id === report.exercise)?.name ?? report.exercise)}
        </h1>
        <p>{new Date(report.createdAt).toLocaleString(currentLanguage())}</p>
      </header>
      <section className="progress-panel">
        <h2>{t("Resultado da sessão")}</h2>
        <dl className="progress-detail-stats">
          {sessionStats(report).map(([label, value]) => (
            <div key={t(label)}>
              <dt>{t(label)}</dt>
              <dd>{typeof value === "number" ? formatNumber(value) : value}</dd>
            </div>
          ))}
        </dl>
        <SessionRatio report={report} />
        <p className="progress-caption">
          {t("Tempo ativo exclui preparação, pausas e períodos sem rastreamento.")}
        </p>
      </section>
      <section className="progress-panel">
        <p className="torvik-kicker">{t("Resumo factual")}</p>
        <h2>{t("O que ficou registrado")}</h2>
        <p className="progress-summary">{factualSummary(report)}</p>
        <p className="progress-caption">
          {t(
            "{{value0}} Esses resultados descrevem critérios do aplicativo; não comprovam melhora biomecânica ou segurança da execução.",
            {
              value0:
                ratio === null && report.type !== "HOLD_BASED"
                  ? t("Não há proporção para avaliar.")
                  : "",
            },
          )}
        </p>
      </section>
      <SideResults report={report} />
      <section className="progress-panel">
        <h2>{t("Análise da execução")}</h2>
        <p className="progress-caption">
          {report.type === "HOLD_BASED"
            ? t(
                "O tempo válido acumula apenas intervalos observados com postura dentro dos critérios.",
              )
            : t(
                "{{value0}} repetições atenderam ao conjunto de critérios. O atendimento de cada critério individual não foi registrado separadamente.",
                { value0: report.correctReps },
              )}
        </p>
        <h3 className="progress-subtitle">
          {t("Critérios não atendidos e orientações registradas")}
        </h3>
        {!report.feedbackCounts ? (
          <p className="progress-empty-inline">
            {t("Esta sessão antiga não contém o detalhamento das ocorrências.")}
          </p>
        ) : !rows.length ? (
          <p className="progress-caption">
            {report.type === "HOLD_BASED"
              ? t("Nenhuma ocorrência persistente registrada.")
              : report.totalReps
                ? t("Nenhuma ocorrência registrada nas repetições avaliadas.")
                : t("Nenhuma repetição completa para detalhar.")}
          </p>
        ) : (
          <ul className="progress-issues">
            {rows.map(([message, count]) => (
              <li key={t(message)}>
                <span>{t(message)}</span>
                <strong>{formatNumber(count)}×</strong>
              </li>
            ))}
          </ul>
        )}
        <p className="progress-caption">
          {report.type === "HOLD_BASED"
            ? t(
                "As ocorrências representam episódios de postura persistentes. Postura inválida, pausas e perdas de rastreamento não acumulam tempo válido.",
              )
            : t(
                "Uma repetição pode apresentar mais de uma ocorrência. Orientações momentâneas entre repetições não são armazenadas.",
              )}
        </p>
        <dl className="progress-interruptions">
          <div>
            <dt>{report.type === "HOLD_BASED" ? t("Interrupções") : t("Ciclos interrompidos")}</dt>
            <dd>
              {report.interruptedCycles == null
                ? t("Não registrado")
                : formatNumber(report.interruptedCycles)}
            </dd>
          </div>
          <div>
            <dt>{t("Perdas de rastreamento")}</dt>
            <dd>
              {report.trackingLosses == null
                ? t("Não registrado")
                : formatNumber(report.trackingLosses)}
            </dd>
          </div>
        </dl>
        <p className="progress-version">
          {t("Regras {{value0}} · Estimador {{value1}}", {
            value0: report.rulesVersion,
            value1: report.engineVersion,
          })}
        </p>
      </section>
      {report.type === "HOLD_BASED" ? null : report.repetitionLog ? (
        <details className="progress-panel">
          <summary>
            {t("Repetições registradas ({{value0}})", {
              value0: report.repetitionLog.events.length,
            })}
          </summary>
          <p className="progress-caption">{t("Instante aproximado no tempo ativo da sessão.")}</p>
          {!report.repetitionLog.events.length ? (
            <p className="progress-caption">{t("Nenhuma repetição concluída.")}</p>
          ) : (
            <ol className="progress-issues">
              {report.repetitionLog.events.slice(0, eventLimit).map((event, index) => (
                <li key={event.id}>
                  <span>
                    {t("Repetição")} {formatNumber(index + 1)} ·{" "}
                    {durationLabel(event.activeSeconds)}
                    {event.side
                      ? " · " +
                        t("Lado: {{side}}", {
                          side: t(event.side === "left" ? "Esquerdo" : "Direito"),
                        })
                      : ""}
                    <br />
                    {event.correct
                      ? t("Dentro dos critérios")
                      : event.issues.map((issue) => t(issue)).join(" · ") ||
                        t("Fora dos critérios")}
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
              {t("Mostrar mais repetições")}
            </button>
          )}
        </details>
      ) : (
        <p className="progress-caption">
          {t("Os eventos individuais das repetições não foram registrados nesta sessão.")}
        </p>
      )}
      <section className="progress-panel">
        <h2>{t("Guardar uma cópia")}</h2>
        <p className="progress-caption">
          {t(
            "O PDF usa a impressão do navegador. Na janela do relatório, escolha “Imprimir / Salvar como PDF”.",
          )}
        </p>
        <div className="progress-export-actions">
          <button type="button" onClick={() => exportFile(() => printReport(report))}>
            <FileText size={17} />
            {t("Salvar em PDF")}
          </button>
          <button type="button" onClick={() => exportFile(() => exportReport(report))}>
            <Download size={17} />
            {t("Exportar JSON")}
          </button>
          <button type="button" onClick={() => exportFile(() => downloadCsv(report))}>
            <Download size={17} />
            {t("Exportar CSV")}
          </button>
        </div>
        {error && (
          <p role="alert" className="progress-error">
            {t(error)}
          </p>
        )}
      </section>
      <button type="button" className="progress-delete" onClick={() => setConfirm(true)}>
        <Trash2 size={16} />
        {t("Excluir sessão")}
      </button>
      {confirm && (
        <section className="progress-panel" aria-label={t("Confirmar exclusão")}>
          <p>{t("Excluir somente esta sessão? Exporte antes se quiser uma cópia.")}</p>
          <div className="progress-export-actions">
            <button type="button" disabled={pending} onClick={() => setConfirm(false)}>
              {t("Manter sessão")}
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
              {pending ? t("Excluindo…") : t("Confirmar exclusão")}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
export function SessionRatio({ report }: { report: HistorySession }) {
  useTranslation();

  const ratio = proportion(report);
  if (report.type === "HOLD_BASED") return null;
  return (
    <div className="progress-ratio">
      {ratio === null ? (
        <p>{t("Dados insuficientes: nenhuma repetição avaliada.")}</p>
      ) : (
        <>
          <div>
            <span>
              {t("{{value0}} de {{value1}} nos critérios", {
                value0: report.correctReps,
                value1: report.totalReps,
              })}
            </span>
            <strong>
              {formatNumber(ratio / 100, { style: "percent", maximumFractionDigits: 0 })}
            </strong>
          </div>
          <progress aria-label={t("Proporção nos critérios")} max={100} value={ratio} />
        </>
      )}
    </div>
  );
}
