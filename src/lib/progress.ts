import { isHold } from "./session";
import { translate as t, currentLanguage, formatDuration, formatNumber } from "./i18n";
import type { ExerciseId } from "./biomech";
import { comparableReports } from "./history";
import type { HistorySession as SessionReport } from "./history";
export type HistorySort = "recent" | "oldest" | "reps" | "time" | "hold";
export type ProgressMetric =
  "totalReps" | "correctReps" | "proportion" | "seconds" | "validSeconds";
export type ProgressPeriod = "7" | "30" | "90" | "all";
export const METRICS: Record<ProgressMetric, string> = {
  validSeconds: "Tempo em postura válida",
  totalReps: "Repetições avaliadas",
  correctReps: "Repetições nos critérios",
  proportion: "Proporção nos critérios",
  seconds: "Tempo ativo",
};
export function proportion(report: Pick<SessionReport, "correctReps" | "totalReps">) {
  return report.totalReps ? ((report.correctReps ?? 0) / report.totalReps) * 100 : null;
}
export function localDay(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function periodStart(period: ProgressPeriod, now: Date) {
  if (period === "all") return -Infinity;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - Number(period) + 1);
  return start.getTime();
}
export function historyTotals(sessions: SessionReport[]) {
  return sessions.reduce(
    (a, r) => ({
      sessions: a.sessions + 1,
      totalReps: a.totalReps + (r.totalReps ?? 0),
      correctReps: a.correctReps + (r.correctReps ?? 0),
      seconds: a.seconds + r.seconds,
      validSeconds: a.validSeconds + (r.validSeconds ?? 0),
    }),
    { sessions: 0, totalReps: 0, correctReps: 0, seconds: 0, validSeconds: 0 },
  );
}
export function filterHistory(
  sessions: SessionReport[],
  exercise: ExerciseId | "all",
  sort: HistorySort,
  day = "",
) {
  return sessions
    .filter(
      (r) =>
        (exercise === "all" || r.exercise === exercise) && (!day || localDay(r.createdAt) === day),
    )
    .sort((a, b) => {
      const time = Date.parse(b.createdAt) - Date.parse(a.createdAt);
      return (
        (sort === "oldest"
          ? -time
          : sort === "reps"
            ? (b.totalReps ?? -1) - (a.totalReps ?? -1) || time
            : sort === "hold"
              ? (b.validSeconds ?? -1) - (a.validSeconds ?? -1) || time
              : sort === "time"
                ? b.seconds - a.seconds || time
                : time) || a.id.localeCompare(b.id)
      );
    });
}
export function cohort(r: SessionReport) {
  return JSON.stringify([r.rulesVersion, r.engineVersion]);
}
export type ProgressPoint = {
  id: string;
  date: string;
  label: string;
  sessions: number;
  totalReps: number;
  correctReps: number;
  seconds: number;
  proportion: number | null;
  validSeconds: number;
};
export function evolution(
  sessions: SessionReport[],
  exercise: ExerciseId,
  period: ProgressPeriod,
  version: string,
  now = new Date(),
  side: "all" | "left" | "right" = "all",
  locale: string = currentLanguage(),
) {
  const rows = sessions
    .filter(
      (r) =>
        r.exercise === exercise &&
        (side === "all" || !!r.sideResults) &&
        cohort(r) === version &&
        Date.parse(r.createdAt) >= periodStart(period, now) &&
        Date.parse(r.createdAt) <= now.getTime(),
    )
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const grouping =
    period === "all" ? "month" : period === "7" && rows.length <= 120 ? "session" : "day";
  const map = new Map<string, ProgressPoint>();
  for (const r of rows) {
    const day = localDay(r.createdAt),
      key = grouping === "session" ? r.id : grouping === "month" ? day.slice(0, 7) : day;
    const label =
      grouping === "session"
        ? new Date(r.createdAt).toLocaleString(locale)
        : grouping === "month"
          ? new Date(`${key}-01T12:00:00`).toLocaleDateString(locale, {
              month: "long",
              year: "numeric",
            })
          : new Date(`${key}T12:00:00`).toLocaleDateString(locale);
    const point = map.get(key) ?? {
      id: key,
      date: r.createdAt,
      label,
      sessions: 0,
      totalReps: 0,
      correctReps: 0,
      seconds: 0,
      proportion: null,
      validSeconds: 0,
    };
    point.sessions++;
    point.totalReps += side === "all" ? (r.totalReps ?? 0) : r.sideResults![side].totalReps;
    point.correctReps += side === "all" ? (r.correctReps ?? 0) : r.sideResults![side].correctReps;
    point.validSeconds +=
      side === "all" ? (r.validSeconds ?? 0) : r.sideResults![side].validSeconds;
    point.seconds += r.seconds;
    point.proportion = proportion(point);
    map.set(key, point);
  }
  return { points: [...map.values()], grouping };
}
export function activity(sessions: SessionReport[], now = new Date()) {
  const recent = sessions.filter(
    (r) =>
      Date.parse(r.createdAt) >= periodStart("7", now) && Date.parse(r.createdAt) <= now.getTime(),
  );
  const counts = new Map<ExerciseId, number>();
  for (const r of sessions) counts.set(r.exercise, (counts.get(r.exercise) ?? 0) + 1);
  const max = Math.max(0, ...counts.values());
  return {
    recent: historyTotals(recent),
    days: new Set(recent.map((r) => localDay(r.createdAt))).size,
    most: [...counts].filter(([, n]) => n === max).map(([id]) => id),
  };
}
export function calendarDays(month: Date) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const offset = (start.getDay() + 6) % 7;
  return Array.from(
    { length: 42 },
    (_, index) => new Date(start.getFullYear(), start.getMonth(), 1 - offset + index, 12),
  );
}
export function occurrences(report: SessionReport) {
  return Object.entries(report.feedbackCounts ?? {})
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
export function factualSummary(report: SessionReport) {
  if (isHold(report))
    return report.validSeconds
      ? t("Você acumulou {{valid}} em postura válida durante {{duration}} de tempo acompanhado.", {
          valid: durationLabel(report.validSeconds),
          duration: durationLabel(report.seconds),
        })
      : t("Nenhum intervalo de postura válida registrado nesta sessão.");
  if (!report.totalReps)
    return t(
      "Nenhuma repetição completa foi avaliada nesta sessão. Não há proporção de atendimento aos critérios para calcular.",
    );
  const top = occurrences(report)[0];
  return (
    t(
      "Você realizou {{count}} repetições avaliadas, das quais {{correct}} atenderam aos critérios configurados para este exercício.",
      { count: report.totalReps, correct: report.correctReps },
    ) +
    " " +
    (top
      ? t("Ocorrência mais frequente: {{issue}} ({{count}} vezes).", {
          issue: t(top[0]),
          count: top[1],
        })
      : report.feedbackCounts
        ? t("Nenhuma ocorrência foi registrada nas repetições avaliadas.")
        : t("O detalhamento dos critérios não foi registrado nesta sessão."))
  );
}
export function comparison(a: SessionReport, b: SessionReport) {
  if (a.exercise !== b.exercise) throw new Error("Escolha duas sessões do mesmo exercício.");
  const compatible = comparableReports(a, b),
    pa = proportion(a),
    pb = proportion(b);
  return {
    compatible,
    totalReps: (b.totalReps ?? 0) - (a.totalReps ?? 0),
    validSeconds: compatible ? (b.validSeconds ?? 0) - (a.validSeconds ?? 0) : null,
    seconds: b.seconds - a.seconds,
    correctReps: compatible ? (b.correctReps ?? 0) - (a.correctReps ?? 0) : null,
    proportion: compatible && pa !== null && pb !== null ? pb - pa : null,
    issues:
      compatible && a.feedbackCounts && b.feedbackCounts
        ? [...new Set([...Object.keys(a.feedbackCounts), ...Object.keys(b.feedbackCounts)])]
            .sort()
            .map((key) => ({
              key,
              a: a.feedbackCounts![key] ?? 0,
              b: b.feedbackCounts![key] ?? 0,
              difference: (b.feedbackCounts![key] ?? 0) - (a.feedbackCounts![key] ?? 0),
            }))
        : [],
  };
}
export function durationLabel(seconds: number) {
  return formatDuration(seconds);
}
export function metricLabel(value: number | null, metric: ProgressMetric) {
  return value === null
    ? t("Sem repetições avaliadas")
    : metric === "proportion"
      ? formatNumber(value / 100, { style: "percent", maximumFractionDigits: 1 })
      : metric === "seconds" || metric === "validSeconds"
        ? durationLabel(value)
        : formatNumber(value);
}

export function sessionStats(report: SessionReport): [string, string | number][] {
  return report.type === "HOLD_BASED"
    ? [
        ["Tempo em postura válida", durationLabel(report.validSeconds)],
        ["Tempo acompanhado", durationLabel(report.seconds)],
      ]
    : [
        ["Repetições avaliadas", report.totalReps],
        ["Dentro dos critérios", report.correctReps],
        ["Fora dos critérios", report.totalReps - report.correctReps],
        ["Tempo ativo", durationLabel(report.seconds)],
      ];
}
