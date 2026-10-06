import { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Check,
  Clock3,
  Download,
  Info,
  Save,
} from "lucide-react";
import { EXERCISES } from "./data";
import { SideResults } from "./history/SideResults";
import { formatTime, type SessionReport } from "@/lib/session";
import { createHistoryStore, exportReport, type HistorySession } from "@/lib/history";

import { FEEDBACK } from "@/lib/exercises/feedback";
const issueDetails = Object.fromEntries(Object.entries(FEEDBACK).map(([k, v]) => [k, v.detail]));
export function ReportScreen({
  report,
  onRestart,
  onHome,
  onViewHistory,
}: {
  report: SessionReport;
  onRestart: () => void;
  onHome: () => void;
  onViewHistory: (id?: string) => void;
}) {
  const [saved, setSaved] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const [history, setHistory] = useState<HistorySession[] | null>(null);
  const [historyError, setHistoryError] = useState(false);
  const exercise = EXERCISES.find((e) => e.id === report.exercise)!;
  const hold = report.type === "HOLD_BASED";
  const hasReps = hold ? report.validSeconds > 0 : report.totalReps > 0;
  const percent =
    !hold && hasReps ? Math.round((report.correctReps / report.totalReps) * 100) : null;
  const issues = Object.entries(report.feedbackCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const previous = history?.filter((item) => item.id !== report.id).slice(0, 2);

  useEffect(() => {
    let disposed = false;
    void createHistoryStore()
      .list()
      .then((items) => {
        if (disposed) return;
        setHistory(items);
        if (items.some((item) => item.id === report.id)) setSaved(true);
      })
      .catch(() => {
        if (!disposed) setHistoryError(true);
      });
    return () => {
      disposed = true;
    };
  }, [report.id]);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await createHistoryStore().save(report);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="report-screen hero-glow min-h-screen">
      <div className="report-content">
        <header className={`report-header${hasReps ? "" : " report-header-empty"}`}>
          <img
            src="/torvik-image-2d.webp"
            width="160"
            height="240"
            alt="Torvik, mascote do treino"
          />
          <div>
            <p className="torvik-kicker">{hasReps ? "Seu resultado" : "Resumo da sessão"}</p>
            <h1>{hasReps ? "Treino concluído!" : "Sessão encerrada"}</h1>
            <p className="report-exercise">{exercise.name}</p>
          </div>
        </header>

        <section
          className={`report-summary${hasReps ? "" : " report-summary-empty"}`}
          aria-labelledby="report-summary-heading"
        >
          {hold ? (
            <>
              <h2 id="report-summary-heading" className="report-section-title">
                {hasReps ? "Resultado da sustentação" : "Nenhum tempo válido registrado"}
              </h2>
              <dl className="report-metrics">
                <div className="report-metric-main">
                  <dt>Tempo em postura válida</dt>
                  <dd>{formatTime(report.validSeconds)}</dd>
                </div>
                <div className="report-metric-secondary">
                  <div>
                    <dt>Tempo acompanhado</dt>
                    <dd>{formatTime(report.seconds)}</dd>
                  </div>
                </div>
              </dl>
              <p className="report-history-note">
                {hasReps
                  ? "Tempo acumulado enquanto a postura atendeu aos critérios do app."
                  : "Mantenha a postura por um instante para começar a acumular tempo."}
              </p>
            </>
          ) : hasReps ? (
            <>
              <h2 id="report-summary-heading" className="report-section-title">
                Resultado do treino
              </h2>
              <dl className="report-metrics">
                <div className="report-metric-main">
                  <dt>Repetições avaliadas</dt>
                  <dd>{report.totalReps}</dd>
                </div>
                <div className="report-metric-secondary">
                  <div>
                    <dt>
                      <Clock3 size={15} aria-hidden="true" /> Tempo ativo
                    </dt>
                    <dd>{formatTime(report.seconds)}</dd>
                  </div>
                  <div>
                    <dt>
                      <Check size={15} aria-hidden="true" /> Nos critérios
                    </dt>
                    <dd>{report.correctReps}</dd>
                  </div>
                </div>
              </dl>
              <div className="report-progress">
                <div className="report-progress-label">
                  <span>
                    {report.correctReps} de {report.totalReps} nos critérios do app
                  </span>
                  <strong>{percent}%</strong>
                </div>
                <progress
                  max={100}
                  value={percent!}
                  aria-label="Proporção de repetições dentro dos critérios do app"
                />
              </div>
            </>
          ) : (
            <div className="report-no-reps">
              <span className="report-no-reps-icon">
                <Activity size={23} aria-hidden="true" />
              </span>
              <div>
                <h2 id="report-summary-heading">Nenhuma repetição avaliada</h2>
                <p>Complete um movimento para gerar resultados de execução.</p>
                {report.seconds > 0 && (
                  <p className="report-no-reps-time">
                    <Clock3 size={15} aria-hidden="true" /> Tempo ativo:{" "}
                    {formatTime(report.seconds)}
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
        <SideResults report={report} />

        {(hasReps || (hold && issues.length > 0)) && (
          <section className="report-review" aria-labelledby="report-review-heading">
            <div className="report-section-heading">
              <h2 id="report-review-heading">Pontos de atenção</h2>
              <span>
                {issues.length
                  ? `${issues.length} ${issues.length === 1 ? "tipo" : "tipos"}`
                  : "Resumo"}
              </span>
            </div>
            {issues.length ? (
              <ul className="report-issues">
                {issues.map(([message, count]) => (
                  <li key={message}>
                    {issueDetails[message] ? (
                      <details>
                        <summary>
                          <AlertCircle size={18} aria-hidden="true" />
                          <span>{message}</span>
                          <strong>{count}×</strong>
                        </summary>
                        <p>{issueDetails[message]}</p>
                      </details>
                    ) : (
                      <div className="report-issue-plain">
                        <AlertCircle size={18} aria-hidden="true" />
                        <span>{message}</span>
                        <strong>{count}×</strong>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="report-review-empty">
                <Check size={18} aria-hidden="true" />{" "}
                {hold
                  ? "Nenhum ponto de atenção registrado."
                  : "Nenhum ponto de atenção registrado nas repetições avaliadas."}
              </p>
            )}
            {(report.interruptedCycles > 0 || report.trackingLosses > 0) && (
              <div className="report-interruptions">
                {report.interruptedCycles > 0 && (
                  <p>
                    <Activity size={16} aria-hidden="true" /> {report.interruptedCycles}{" "}
                    {report.interruptedCycles === 1 ? "ciclo interrompido" : "ciclos interrompidos"}
                  </p>
                )}
                {report.trackingLosses > 0 && (
                  <p>
                    <AlertCircle size={16} aria-hidden="true" /> {report.trackingLosses}{" "}
                    {report.trackingLosses === 1
                      ? "perda de rastreamento"
                      : "perdas de rastreamento"}
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        <div className="report-actions">
          <button type="button" className="torvik-primary" onClick={onRestart}>
            {hasReps ? "Novo treino" : "Tentar novamente"}
            <ArrowRight size={18} aria-hidden="true" />
          </button>
          <button type="button" className="torvik-secondary" onClick={onHome}>
            Voltar ao início
          </button>
        </div>

        <section className="report-history" aria-labelledby="report-history-heading">
          <div className="report-section-heading">
            <h2 id="report-history-heading">Seus treinos salvos</h2>
          </div>
          {historyError ? (
            <p className="report-history-note">Histórico indisponível neste navegador.</p>
          ) : history === null ? (
            <p className="report-history-note" role="status">
              Carregando histórico…
            </p>
          ) : previous?.length ? (
            <ul className="report-history-list">
              {previous.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onViewHistory(item.id)}
                    aria-label={`Ver detalhes de ${EXERCISES.find((entry) => entry.id === item.exercise)?.name ?? item.exercise}, ${new Date(item.createdAt).toLocaleDateString("pt-BR")}`}
                  >
                    <span className="report-history-item-title">
                      <strong>
                        {EXERCISES.find((entry) => entry.id === item.exercise)?.name ??
                          item.exercise}
                      </strong>
                      <time dateTime={item.createdAt}>
                        {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                      </time>
                    </span>
                    <span className="report-history-item-meta">
                      {item.type === "HOLD_BASED"
                        ? `${formatTime(item.validSeconds)} em postura válida`
                        : `${item.totalReps} ${item.totalReps === 1 ? "repetição" : "repetições"}`}{" "}
                      · {formatTime(item.seconds)}
                      <ArrowRight size={16} aria-hidden="true" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="report-history-note">Nenhuma sessão anterior salva neste dispositivo.</p>
          )}
          {saved && (
            <button
              type="button"
              className="report-history-all"
              onClick={() => onViewHistory(report.id)}
            >
              Ver sessão salva <ArrowRight size={16} aria-hidden="true" />
            </button>
          )}
          {history && history.length > 0 && (
            <button type="button" className="report-history-all" onClick={() => onViewHistory()}>
              Ver todo o histórico <ArrowRight size={16} aria-hidden="true" />
            </button>
          )}
          <div className="report-history-actions">
            <button
              type="button"
              className="torvik-secondary"
              disabled={saving || saved}
              onClick={() => void save()}
            >
              <Save size={17} aria-hidden="true" />
              {saved ? "Salvo neste dispositivo" : saving ? "Salvando…" : "Salvar sessão"}
            </button>
            <button type="button" className="torvik-secondary" onClick={() => exportReport(report)}>
              <Download size={17} aria-hidden="true" />
              Exportar relatório
            </button>
          </div>
          <p role="status" className="report-save-status">
            {saved ? "Sessão salva." : ""}
          </p>
          {error && (
            <p role="alert" className="report-error">
              {error}
            </p>
          )}
        </section>

        <details className="report-info">
          <summary>
            <Info size={18} aria-hidden="true" /> Sobre este relatório e seus dados
          </summary>
          <div>
            <p>
              {hold
                ? "Tempo válido é a soma de intervalos observados com postura dentro dos critérios. As ocorrências contam episódios persistentes, não repetições. Postura inválida e interrupções não somam tempo válido."
                : "Repetições avaliadas são movimentos completos identificados pelo app; ciclos interrompidos são registrados separadamente. Um ciclo pode ter mais de um ponto de atenção."}
            </p>
            <p>
              A avaliação descreve regras automáticas de movimento. Não mede precisão científica nem
              substitui avaliação profissional. Pausas, preparação e períodos sem rastreamento não
              entram no tempo ativo.
            </p>
            <p>
              Salvar a sessão é opcional. Nenhum vídeo é gravado. O histórico fica neste navegador e
              dispositivo e pode ser apagado pelo navegador; exporte uma cópia para preservá-lo.
            </p>
          </div>
        </details>
      </div>
    </main>
  );
}
