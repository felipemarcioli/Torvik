import { useTranslation } from "react-i18next";
import { translate as t, currentLanguage, formatNumber } from "@/lib/i18n";
import { BackButton } from "../AppNavigation";
import { useEffect, useRef } from "react";
import type { HistorySession } from "@/lib/history";
import { comparison, durationLabel, metricLabel, proportion } from "@/lib/progress";
import { EXERCISES } from "../data";
export function SessionComparison({
  a,
  b,
  onBack,
}: {
  a: HistorySession;
  b: HistorySession;
  onBack: () => void;
}) {
  useTranslation();

  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo(0, 0);
  }, []);
  const values = comparison(a, b),
    signed = (v: number | null, unit?: "second" | "percentage-point") => {
      if (v === null) return t("Não comparável");
      const value = formatNumber(v, {
        maximumFractionDigits: 1,
        signDisplay: "exceptZero",
        ...(unit === "second" ? ({ style: "unit", unit: "second" } as const) : {}),
      });
      return unit === "percentage-point" ? t("{{value}} p.p.", { value }) : value;
    };
  const hold = a.type === "HOLD_BASED" && b.type === "HOLD_BASED";
  const rows = hold
    ? [
        [
          t("Tempo em postura válida"),
          durationLabel(a.validSeconds!),
          durationLabel(b.validSeconds!),
          signed(values.validSeconds, "second"),
        ],
        [
          t("Tempo acompanhado"),
          durationLabel(a.seconds),
          durationLabel(b.seconds),
          signed(values.seconds, "second"),
        ],
      ]
    : [
        [t("Repetições avaliadas"), a.totalReps, b.totalReps, signed(values.totalReps)],
        [t("Nos critérios"), a.correctReps, b.correctReps, signed(values.correctReps)],
        [
          t("Proporção"),
          metricLabel(proportion(a), "proportion"),
          metricLabel(proportion(b), "proportion"),
          signed(values.proportion, "percentage-point"),
        ],
        [
          t("Tempo ativo"),
          durationLabel(a.seconds),
          durationLabel(b.seconds),
          signed(values.seconds, "second"),
        ],
      ];
  return (
    <div>
      <BackButton onClick={onBack}>{t("Voltar ao progresso")}</BackButton>
      <header className="progress-header">
        <p className="torvik-kicker">
          {t(EXERCISES.find((e) => e.id === a.exercise)?.name ?? a.exercise)}
        </p>
        <h1 ref={heading} tabIndex={-1}>
          {t("Comparar sessões")}
        </h1>
        <p>{t("Diferenças entre registros, sem classificação de melhora biomecânica.")}</p>
      </header>
      <section className="progress-panel">
        <div className="progress-comparison-dates">
          <div>
            <strong>{t("Sessão A")}</strong>
            <time>{new Date(a.createdAt).toLocaleString(currentLanguage())}</time>
          </div>
          <div>
            <strong>{t("Sessão B")}</strong>
            <time>{new Date(b.createdAt).toLocaleString(currentLanguage())}</time>
          </div>
        </div>
        {!values.compatible && (
          <p role="status" className="progress-error">
            {t(
              "Versões diferentes de regras ou estimador. Valores de atendimento são apresentados separadamente; suas diferenças não são calculadas.",
            )}
          </p>
        )}
        <div className="progress-comparison-labels">
          <span>{t("A")}</span>
          <span>{t("B")}</span>
          <span>{t("Diferença B − A")}</span>
        </div>
        {rows.map(([label, left, right, diff]) => (
          <div className="progress-comparison-row" key={t(String(label))}>
            <h2>{t(String(label))}</h2>
            <div>
              <span>{typeof left === "number" ? formatNumber(left) : left}</span>
              <span>{typeof right === "number" ? formatNumber(right) : right}</span>
              <strong>{diff}</strong>
            </div>
          </div>
        ))}
        <p className="progress-caption">
          {hold
            ? t("Tempo válido é a soma dos intervalos observados dentro dos critérios.")
            : t(
                "p.p. = pontos percentuais. Proporções sem repetições avaliadas não são comparáveis.",
              )}
        </p>
      </section>
      {a.sideResults && b.sideResults && (
        <section className="progress-panel">
          <h2>{t("Resultados por lado")}</h2>
          {(["left", "right"] as const).map((side) => {
            const av = hold ? a.sideResults![side].validSeconds : a.sideResults![side].totalReps;
            const bv = hold ? b.sideResults![side].validSeconds : b.sideResults![side].totalReps;
            return (
              <div className="progress-comparison-row" key={side}>
                <h3>{side === "left" ? t("Esquerdo") : t("Direito")}</h3>
                <div>
                  <span>{hold ? durationLabel(av) : formatNumber(av)}</span>
                  <span>{hold ? durationLabel(bv) : formatNumber(bv)}</span>
                  <strong>
                    {signed(values.compatible ? bv - av : null, hold ? "second" : undefined)}
                  </strong>
                </div>
              </div>
            );
          })}
        </section>
      )}
      <section className="progress-panel">
        <h2>{t("Ocorrências por critério")}</h2>
        {!values.compatible ? (
          <p className="progress-caption">
            {t("Comparação de ocorrências indisponível entre versões diferentes.")}
          </p>
        ) : !a.feedbackCounts || !b.feedbackCounts ? (
          <p className="progress-caption">
            {t("Uma das sessões não registrou o detalhamento das ocorrências.")}
          </p>
        ) : !values.issues.length ? (
          <p className="progress-caption">{t("Nenhuma ocorrência registrada nas duas sessões.")}</p>
        ) : (
          values.issues.map((row) => (
            <div className="progress-comparison-row" key={t(row.key)}>
              <h3>{t(row.key)}</h3>
              <div>
                <span>{formatNumber(row.a)}×</span>
                <span>{formatNumber(row.b)}×</span>
                <strong>{signed(row.difference)}</strong>
              </div>
            </div>
          ))
        )}
        <p className="progress-caption">
          {hold
            ? t("Cada número representa episódios persistentes daquela ocorrência.")
            : t(
                "Cada número representa repetições com aquela ocorrência; uma repetição pode aparecer em mais de um critério.",
              )}
        </p>
      </section>
      <details className="progress-panel">
        <summary>{t("Versões da análise")}</summary>
        <p className="progress-version">
          {t("A: regras {{value0}} · {{value1}}", {
            value0: a.rulesVersion,
            value1: a.engineVersion,
          })}
        </p>
        <p className="progress-version">
          {t("B: regras {{value0}} · {{value1}}", {
            value0: b.rulesVersion,
            value1: b.engineVersion,
          })}
        </p>
      </details>
    </div>
  );
}
