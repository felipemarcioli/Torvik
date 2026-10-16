import { useTranslation } from "react-i18next";
import { translate as t, formatNumber } from "@/lib/i18n";
import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  cohort,
  evolution,
  METRICS,
  metricLabel,
  type ProgressMetric,
  type ProgressPeriod,
  type ProgressPoint,
} from "@/lib/progress";
import type { HistorySession as SessionReport } from "@/lib/history";
import type { ExerciseId } from "@/lib/biomech";
import { EXERCISES } from "../data";
export function EvolutionChart({ sessions }: { sessions: SessionReport[] }) {
  const { i18n } = useTranslation();

  const [exercise, setExercise] = useState<ExerciseId>(sessions[0]?.exercise ?? EXERCISES[0]!.id);
  const [period, setPeriod] = useState<ProgressPeriod>("30"),
    [chosenMetric, setMetric] = useState<ProgressMetric>("totalReps"),
    [version, setVersion] = useState(""),
    [selected, setSelected] = useState("");
  const [chosenSide, setSide] = useState<"all" | "left" | "right">("all");
  const sided = !!EXERCISES.find((e) => e.id === exercise)?.sideMode;
  const activeSide = sided ? chosenSide : "all";
  const hold = EXERCISES.find((e) => e.id === exercise)?.type === "HOLD_BASED";
  const metrics = Object.entries(METRICS).filter(
    ([key]) =>
      (activeSide === "all" || key !== "seconds") &&
      (hold ? key === "validSeconds" || key === "seconds" : key !== "validSeconds"),
  );
  const metric: ProgressMetric = metrics.some(([key]) => key === chosenMetric)
    ? chosenMetric
    : hold
      ? "validSeconds"
      : "totalReps";
  const versions = useMemo(
    () => [
      ...new Map(
        sessions.filter((r) => r.exercise === exercise).map((r) => [cohort(r), r]),
      ).entries(),
    ],
    [sessions, exercise],
  );
  const activeVersion = versions.some(([key]) => key === version)
    ? version
    : (versions[0]?.[0] ?? "");
  const { points, grouping } = useMemo(
    () =>
      evolution(
        sessions,
        exercise,
        period,
        activeVersion,
        new Date(),
        activeSide,
        i18n.resolvedLanguage,
      ),
    [sessions, exercise, period, activeVersion, activeSide, i18n.resolvedLanguage],
  );
  const point = points.find((p) => p.id === selected) ?? points.at(-1);
  const hasValues = points.some((p) => p[metric] !== null);
  const dot = ({ cx, cy, payload }: { cx?: number; cy?: number; payload?: ProgressPoint }) => {
    if (cx === undefined || cy === undefined || !payload || payload[metric] === null) return <g />;
    return (
      <g
        key={payload.id}
        role="button"
        tabIndex={0}
        aria-label={`${payload.label}: ${metricLabel(payload[metric], metric)}`}
        onClick={() => setSelected(payload.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setSelected(payload.id);
          }
        }}
        style={{ cursor: "pointer" }}
      >
        <circle cx={cx} cy={cy} r={22} fill="transparent" />
        <circle
          cx={cx}
          cy={cy}
          r={point?.id === payload.id ? 5 : 3}
          fill="var(--accent)"
          stroke="var(--background)"
          strokeWidth={2}
        />
      </g>
    );
  };
  return (
    <section className="progress-panel" aria-labelledby="evolution-title">
      <div className="progress-section-heading">
        <div>
          <p className="torvik-kicker">{t("Dados registrados")}</p>
          <h2 id="evolution-title">{t("Sua evolução")}</h2>
        </div>
        <span className="progress-tag">
          {grouping === "session"
            ? t("Por sessão")
            : grouping === "day"
              ? t("Por dia")
              : t("Por mês")}
        </span>
      </div>
      <div className="progress-chart-filters">
        <label>
          {t("Exercício do gráfico")}
          <select
            value={exercise}
            onChange={(e) => {
              setExercise(e.target.value as ExerciseId);
              setVersion("");
              setSelected("");
            }}
          >
            {EXERCISES.map((e) => (
              <option key={e.id} value={e.id}>
                {t(e.name)}
              </option>
            ))}
          </select>
        </label>
        {sided && (
          <label>
            {t("Lado do gráfico")}
            <select
              value={activeSide}
              onChange={(e) => setSide(e.target.value as "all" | "left" | "right")}
            >
              <option value="all">{t("Todos os lados")}</option>
              <option value="left">{t("Esquerdo")}</option>
              <option value="right">{t("Direito")}</option>
            </select>
          </label>
        )}
        <label>
          {t("Período")}
          <select value={period} onChange={(e) => setPeriod(e.target.value as ProgressPeriod)}>
            <option value="7">{t("Últimos 7 dias")}</option>
            <option value="30">{t("Últimos 30 dias")}</option>
            <option value="90">{t("Últimos 90 dias")}</option>
            <option value="all">{t("Todo o histórico")}</option>
          </select>
        </label>
        <label className="progress-metric-filter">
          {t("Métrica")}
          <select value={metric} onChange={(e) => setMetric(e.target.value as ProgressMetric)}>
            {metrics.map(([key, label]) => (
              <option key={key} value={key}>
                {t(label)}
              </option>
            ))}
          </select>
        </label>
        {versions.length > 1 && (
          <label className="progress-metric-filter">
            {t("Versão da análise")}
            <select value={activeVersion} onChange={(e) => setVersion(e.target.value)}>
              {versions.map(([key, r]) => (
                <option value={key} key={key}>
                  {t("Regras {{value0}} · {{value1}}", {
                    value0: r.rulesVersion,
                    value1: r.engineVersion,
                  })}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {hasValues ? (
        <>
          <div
            className="progress-chart"
            role="group"
            aria-label={t("Gráfico de {{value0}}", { value0: t(METRICS[metric]) })}
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart
                data={points}
                margin={{ top: 20, right: 16, bottom: 8, left: 0 }}
                accessibilityLayer
              >
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickFormatter={(value) => String(value).split(",")[0]!}
                  minTickGap={45}
                />
                <YAxis
                  width={48}
                  domain={metric === "proportion" ? [0, 100] : [0, "auto"]}
                  allowDecimals={metric === "proportion"}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickFormatter={(value) =>
                    metric === "seconds" || metric === "validSeconds"
                      ? Number(value) < 60
                        ? formatNumber(Number(value), {
                            style: "unit",
                            unit: "second",
                            unitDisplay: "narrow",
                          })
                        : formatNumber(Number(value) / 60, {
                            style: "unit",
                            unit: "minute",
                            unitDisplay: "narrow",
                            maximumFractionDigits: 1,
                          })
                      : formatNumber(Number(value))
                  }
                />
                <Tooltip
                  formatter={(value) => [metricLabel(Number(value), metric), t(METRICS[metric])]}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--foreground)",
                  }}
                />
                <Line
                  type="linear"
                  dataKey={metric}
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={dot}
                  activeDot={dot}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <label className="progress-point-select">
            {t("Consultar ponto")}
            <select value={point?.id ?? ""} onChange={(e) => setSelected(e.target.value)}>
              {points.map((p) => (
                <option value={p.id} key={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          {point && (
            <output className="progress-chart-reading" aria-live="polite">
              <span>
                {point.label} ·{" "}
                {t(point.sessions === 1 ? "{{count}} sessão" : "{{count}} sessões", {
                  count: point.sessions,
                })}
              </span>
              <strong>{metricLabel(point[metric], metric)}</strong>
            </output>
          )}
          {points.length === 1 && (
            <p className="progress-caption">
              {t(
                "Um registro disponível. São necessários mais registros para observar variações ao longo do tempo.",
              )}
            </p>
          )}
        </>
      ) : (
        <div className="progress-empty-inline">
          <p>
            {points.length
              ? t("Não há repetições avaliadas para calcular esta proporção.")
              : t("Nenhum registro neste período e nesta versão.")}
          </p>
          <span>{t("Experimente outro exercício ou período.")}</span>
        </div>
      )}
      <p className="progress-caption">
        {t(
          "{{value0}} {{value1}} Variações não comprovam melhora biomecânica. Dias sem registros não são tratados como zero.",
          {
            value0:
              versions.length > 1 ? t("O gráfico separa versões de regras e estimadores.") : "",
            value1: hold
              ? t("O gráfico soma os tempos registrados.")
              : t("A proporção usa o total de repetições do período, não a média dos percentuais."),
          },
        )}
      </p>
    </section>
  );
}
