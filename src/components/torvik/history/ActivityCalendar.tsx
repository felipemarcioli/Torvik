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
          <strong>Seu ritmo de registros</strong>
          <small>
            {summary.recent.sessions} sessões em {summary.days} dias nos últimos 7 dias
          </small>
        </span>
      </summary>
      <div className="progress-calendar-content">
        <p className="progress-caption">
          Mais registrado:{" "}
          {summary.most.map((id) => EXERCISES.find((e) => e.id === id)?.name ?? id).join(" e ") ||
            "ainda sem registros"}
          . Dias vazios indicam ausência de registros, não ausência de treino.
        </p>
        <div className="progress-calendar-heading">
          <button
            type="button"
            aria-label="Mês anterior"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1, 12))}
          >
            <ChevronLeft size={20} />
          </button>
          <h3 aria-live="polite">
            {month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </h3>
          <button
            type="button"
            aria-label="Próximo mês"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1, 12))}
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="progress-calendar" role="group" aria-label="Calendário de sessões">
          {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => (
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
                aria-label={`${date.toLocaleDateString("pt-BR")}, ${count} sessões registradas`}
                onClick={() => onSelect(selected === key ? "" : key)}
              >
                <span>{date.getDate()}</span>
                {count > 0 && <i aria-hidden="true" />}
              </button>
            );
          })}
        </div>
        {selected && (
          <button type="button" className="progress-text-button" onClick={() => onSelect("")}>
            Limpar data selecionada
          </button>
        )}
      </div>
    </details>
  );
}
