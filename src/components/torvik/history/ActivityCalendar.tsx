import { useTranslation } from "react-i18next";
import { translate as t, currentLanguage, formatNumber, formatList } from "@/lib/i18n";
import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { activity, calendarDays, localDay } from "@/lib/progress";
import type { HistorySession as SessionReport } from "@/lib/history";
import { EXERCISES } from "../data";
export function ActivityCalendar({
  sessions,
  selected,
  onSelect,
}: {
  sessions: SessionReport[];
  selected: string;
  onSelect: (day: string) => void;
}) {
  useTranslation();

  const [month, setMonth] = useState(() => new Date());
  const summary = useMemo(() => activity(sessions), [sessions]);
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of sessions) {
      const day = localDay(r.createdAt);
      map.set(day, (map.get(day) ?? 0) + 1);
    }
    return map;
  }, [sessions]);
  return (
    <details className="progress-panel progress-activity">
      <summary>
        <CalendarDays size={20} aria-hidden="true" />
        <span>
          <strong>{t("Seu ritmo de registros")}</strong>
          <small>
            {t("{{value0}} sessões em {{value1}} dias nos últimos 7 dias", {
              value0: summary.recent.sessions,
              value1: summary.days,
            })}
          </small>
        </span>
      </summary>
      <div className="progress-calendar-content">
        <p className="progress-caption">
          {t(
            "Mais registrado: {{value0}} . Dias vazios indicam ausência de registros, não ausência de treino.",
            {
              value0:
                formatList(
                  summary.most.map((id) => t(EXERCISES.find((e) => e.id === id)?.name ?? id)),
                ) || t("ainda sem registros"),
            },
          )}
        </p>
        <div className="progress-calendar-heading">
          <button
            type="button"
            aria-label={t("Mês anterior")}
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1, 12))}
          >
            <ChevronLeft className="directional-icon" size={20} />
          </button>
          <h3 aria-live="polite">
            {month.toLocaleDateString(currentLanguage(), { month: "long", year: "numeric" })}
          </h3>
          <button
            type="button"
            aria-label={t("Próximo mês")}
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1, 12))}
          >
            <ChevronRight className="directional-icon" size={20} />
          </button>
        </div>
        <div className="progress-calendar" role="group" aria-label={t("Calendário de sessões")}>
          {Array.from({ length: 7 }, (_, index) =>
            new Intl.DateTimeFormat(currentLanguage(), { weekday: "short" }).format(
              new Date(2026, 0, 5 + index),
            ),
          ).map((day) => (
            <span className="progress-weekday" key={day}>
              {day}
            </span>
          ))}
          {calendarDays(month).map((date) => {
            const key = localDay(date),
              count = counts.get(key) ?? 0;
            return (
              <button
                type="button"
                key={key}
                disabled={!count}
                data-outside={date.getMonth() !== month.getMonth()}
                data-recorded={count > 0}
                aria-pressed={selected === key}
                aria-label={t("{{value0}}, {{value1}} sessões registradas", {
                  value0: date.toLocaleDateString(currentLanguage()),
                  value1: count,
                })}
                onClick={() => onSelect(selected === key ? "" : key)}
              >
                <span>{formatNumber(date.getDate())}</span>
                {count > 0 && <i aria-hidden="true" />}
              </button>
            );
          })}
        </div>
        {selected && (
          <button type="button" className="progress-text-button" onClick={() => onSelect("")}>
            {t("Limpar data selecionada")}
          </button>
        )}
      </div>
    </details>
  );
}
