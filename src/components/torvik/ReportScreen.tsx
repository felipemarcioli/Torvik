import { useTranslation } from "react-i18next";
import { translate as t, formatNumber } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { Mascot } from "./TorvikUI";
import { BackButton } from "./AppNavigation";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
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
import type { SessionReport } from "@/lib/session";
import { formatTimer } from "./format";
import { exportReport } from "@/lib/history";
import { useHistoryStore } from "@/hooks/use-history-store";

import { FEEDBACK } from "@/lib/exercises/feedback";
const issueDetails = Object.fromEntries(Object.entries(FEEDBACK).map(([k, v]) => [k, v.detail]));
export function ReportScreen({
  report,
  onRestart,
  onHome,
  onViewHistory,
  registerBack,
}: {
  report: SessionReport;
  onRestart: () => void;
  onHome: () => void;
  onViewHistory: (id?: string) => void;
  registerBack: (handler: () => boolean) => () => void;
}) {
  useTranslation();

  const history = useHistoryStore();
  const [saved, setSaved] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const [leaving, setLeaving] = useState<"back" | "restart" | "history" | null>(null);
  const exercise = EXERCISES.find((e) => e.id === report.exercise)!;
  const hold = report.type === "HOLD_BASED";
  const hasReps = hold ? report.validSeconds > 0 : report.totalReps > 0;
  const percent =
    !hold && hasReps ? Math.round((report.correctReps / report.totalReps) * 100) : null;
  const issues = Object.entries(report.feedbackCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const leave = (target: "back" | "restart" | "history") => {
    if (target === "back") onHome();
    else if (target === "restart") onRestart();
    else onViewHistory();
  };
  const hasProgress =
    hasReps ||
    report.seconds > 0 ||
    issues.length > 0 ||
    report.interruptedCycles > 0 ||
    report.trackingLosses > 0;
  const requestLeave = (target: "back" | "restart" | "history") => {
    if (!saved && hasProgress) setLeaving(target);
    else leave(target);
  };
  useEffect(() =>
    registerBack(() => {
      if (leaving) {
        setLeaving(null);
        return false;
      }
      if (!saved && hasProgress) {
        setLeaving("back");
        return false;
      }
      return true;
    }),
  );

  useEffect(() => {
    let disposed = false;
    void history
      .list()
      .then((items) => {
        if (disposed) return;
        if (items.some((item) => item.id === report.id)) setSaved(true);
      })
      .catch(() => {
        // Saving and exporting remain available if reading local history fails.
      });
    return () => {
      disposed = true;
    };
  }, [report.id, history]);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await history.save(report);
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
        <BackButton onClick={() => requestLeave("back")}>{t("Voltar ao exercício")}</BackButton>
        <header className={`report-header${hasReps ? "" : " report-header-empty"}`}>
          <Mascot decorative />
          <div>
            <p className="torvik-kicker">{hasReps ? t("Seu resultado") : t("Resumo da sessão")}</p>
            <h1>{hasReps ? t("Treino concluído!") : t("Sessão encerrada")}</h1>
            <p className="report-exercise">{t(exercise.name)}</p>
          </div>
        </header>

        <section
          className={`report-summary${hasReps ? "" : " report-summary-empty"}`}
          aria-labelledby="report-summary-heading"
        >
          {hold ? (
            <>
              <h2 id="report-summary-heading" className="report-section-title">
                {hasReps ? t("Resultado da sustentação") : t("Nenhum tempo válido registrado")}
              </h2>
              <dl className="report-metrics">
                <div className="report-metric-main">
                  <dt>{t("Tempo em postura válida")}</dt>
                  <dd>{formatTimer(report.validSeconds)}</dd>
                </div>
                <div className="report-metric-secondary">
                  <div>
                    <dt>{t("Tempo acompanhado")}</dt>
                    <dd>{formatTimer(report.seconds)}</dd>
                  </div>
                </div>
              </dl>
              <p className="report-history-note">
                {hasReps
                  ? t("Tempo acumulado enquanto a postura atendeu aos critérios do app.")
                  : t("Mantenha a postura por um instante para começar a acumular tempo.")}
              </p>
            </>
          ) : hasReps ? (
            <>
              <h2 id="report-summary-heading" className="report-section-title">
                {t("Resultado do treino")}
              </h2>
              <dl className="report-metrics">
                <div className="report-metric-main">
                  <dt>{t("Repetições avaliadas")}</dt>
                  <dd>{formatNumber(report.totalReps)}</dd>
                </div>
                <div className="report-metric-secondary">
                  <div>
                    <dt>
                      <Clock3 size={15} aria-hidden="true" /> {t("Tempo ativo")}
                    </dt>
                    <dd>{formatTimer(report.seconds)}</dd>
                  </div>
                  <div>
                    <dt>
                      <Check size={15} aria-hidden="true" /> {t("Nos critérios")}
                    </dt>
                    <dd>{formatNumber(report.correctReps)}</dd>
                  </div>
                </div>
              </dl>
              <div className="report-progress">
                <div className="report-progress-label">
                  <span>
                    {t("{{value0}} de {{value1}} nos critérios do app", {
                      value0: report.correctReps,
                      value1: report.totalReps,
                    })}
                  </span>
                  <strong>
                    {formatNumber(percent! / 100, { style: "percent", maximumFractionDigits: 0 })}
                  </strong>
                </div>
                <progress
                  max={100}
                  value={percent!}
                  aria-label={t("Proporção de repetições dentro dos critérios do app")}
                />
              </div>
            </>
          ) : (
            <div className="report-no-reps">
              <span className="report-no-reps-icon">
                <Activity size={23} aria-hidden="true" />
              </span>
              <div>
                <h2 id="report-summary-heading">{t("Nenhuma repetição avaliada")}</h2>
                <p>{t("Complete um movimento para gerar resultados de execução.")}</p>
                {report.seconds > 0 && (
                  <p className="report-no-reps-time">
                    <Clock3 size={15} aria-hidden="true" /> {t("Tempo ativo:")}{" "}
                    {formatTimer(report.seconds)}
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        {(hasReps || (hold && issues.length > 0)) && (
          <section className="report-review" aria-labelledby="report-review-heading">
            <div className="report-section-heading">
              <h2 id="report-review-heading">{t("Pontos de atenção")}</h2>
              <span>
                {issues.length
                  ? t(issues.length === 1 ? "{{count}} tipo" : "{{count}} tipos", {
                      count: issues.length,
                    })
                  : t("Resumo")}
              </span>
            </div>
            {issues.length ? (
              <>
                <ReportIssues issues={issues.slice(0, 3)} />
                {issues.length > 3 && (
                  <details className="app-disclosure">
                    <summary>
                      {t("Mais pontos de atenção ({{value0}})", { value0: issues.length - 3 })}
                    </summary>
                    <ReportIssues issues={issues.slice(3)} />
                  </details>
                )}
              </>
            ) : (
              <p className="report-review-empty">
                <Check size={18} aria-hidden="true" />{" "}
                {hold
                  ? t("Nenhum ponto de atenção registrado.")
                  : t("Nenhum ponto de atenção registrado nas repetições avaliadas.")}
              </p>
            )}
            {(report.interruptedCycles > 0 || report.trackingLosses > 0) && (
              <div className="report-interruptions">
                {report.interruptedCycles > 0 && (
                  <p>
                    <Activity size={16} aria-hidden="true" />{" "}
                    {t(
                      report.interruptedCycles === 1
                        ? "{{count}} ciclo interrompido"
                        : "{{count}} ciclos interrompidos",
                      { count: report.interruptedCycles },
                    )}
                  </p>
                )}
                {report.trackingLosses > 0 && (
                  <p>
                    <AlertCircle size={16} aria-hidden="true" />{" "}
                    {t(
                      report.trackingLosses === 1
                        ? "{{count}} perda de rastreamento"
                        : "{{count}} perdas de rastreamento",
                      { count: report.trackingLosses },
                    )}
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        <section className="report-save" aria-label={t("Guardar resultado")} data-saved={saved}>
          <button
            type="button"
            className="torvik-primary w-full"
            disabled={saving || saved}
            onClick={() => void save()}
          >
            {saved ? <Check size={18} aria-hidden="true" /> : <Save size={18} aria-hidden="true" />}
            {saved ? t("Salvo neste dispositivo") : saving ? t("Salvando…") : t("Salvar sessão")}
          </button>
          <p role="status" className="report-save-status">
            {saved
              ? t("Sessão salva. Você pode consultá-la em Progresso.")
              : t("Opcional: guarde o resumo neste dispositivo.")}
          </p>
          {error && (
            <p role="alert" className="report-error">
              {t(error)}
            </p>
          )}
          {saved && (
            <button
              type="button"
              className="report-history-all"
              onClick={() => onViewHistory(report.id)}
            >
              {t("Ver sessão salva")}
              <ArrowRight className="directional-icon" size={16} aria-hidden="true" />
            </button>
          )}
        </section>
        <div className="report-actions">
          <button
            type="button"
            className="torvik-secondary"
            onClick={() => requestLeave("restart")}
          >
            {hasReps ? t("Novo treino") : t("Tentar novamente")}
            <ArrowRight className="directional-icon" size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="torvik-secondary"
            onClick={() => requestLeave("history")}
          >
            {t("Ver Progresso")}
          </button>
        </div>
        <button type="button" className="report-history-all" onClick={() => exportReport(report)}>
          <Download size={17} aria-hidden="true" />
          {t("Exportar relatório")}
        </button>
        <AlertDialog
          open={leaving !== null}
          onOpenChange={(open) => {
            if (!open) setLeaving(null);
          }}
        >
          <AlertDialogContent className="app-confirm">
            <AlertDialogTitle>{t("Sair sem salvar?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "Esta sessão ainda não foi salva neste dispositivo. Volte ao resultado para salvar, se quiser manter o registro.",
              )}
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("Voltar ao resultado")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (leaving) leave(leaving);
                }}
              >
                {t("Sair sem salvar")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <SideResults report={report} />
        <details className="report-info">
          <summary>
            <Info size={18} aria-hidden="true" /> {t("Sobre este relatório e seus dados")}
          </summary>
          <div>
            <p>
              {hold
                ? t(
                    "Tempo válido é a soma de intervalos observados com postura dentro dos critérios. As ocorrências contam episódios persistentes, não repetições. Postura inválida e interrupções não somam tempo válido.",
                  )
                : t(
                    "Repetições avaliadas são movimentos completos identificados pelo app; ciclos interrompidos são registrados separadamente. Um ciclo pode ter mais de um ponto de atenção.",
                  )}
            </p>
            <p>
              {t(
                "A avaliação descreve regras automáticas de movimento. Não mede precisão científica nem substitui avaliação profissional. Pausas, preparação e períodos sem rastreamento não entram no tempo ativo.",
              )}
            </p>
            <p>
              {t(
                "Salvar a sessão é opcional. Nenhum vídeo é gravado. O histórico fica neste navegador e dispositivo e pode ser apagado pelo navegador; exporte uma cópia para preservá-lo.",
              )}
            </p>
          </div>
        </details>
      </div>
    </main>
  );
}

function ReportIssues({ issues }: { issues: [string, number][] }) {
  useTranslation();

  return (
    <ul className="report-issues">
      {issues.map(([message, count]) => (
        <li key={t(message)}>
          {issueDetails[message] ? (
            <details>
              <summary>
                <AlertCircle size={18} aria-hidden="true" />
                <span>{t(message)}</span>
                <strong>{formatNumber(count)}×</strong>
              </summary>
              <p>{t(issueDetails[message])}</p>
            </details>
          ) : (
            <div className="report-issue-plain">
              <AlertCircle size={18} aria-hidden="true" />
              <span>{t(message)}</span>
              <strong>{formatNumber(count)}×</strong>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
