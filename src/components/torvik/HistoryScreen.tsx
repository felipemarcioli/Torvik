import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Activity, CheckCheck, Clock3, Layers, GitCompareArrows } from "lucide-react";
import { createHistoryStore, type HistorySession } from "@/lib/history";
import { durationLabel, filterHistory, historyTotals, type HistorySort } from "@/lib/progress";
import type { ExerciseId } from "@/lib/biomech";
import { EXERCISES } from "./data";
import { EvolutionChart } from "./history/EvolutionChart";
import { ActivityCalendar } from "./history/ActivityCalendar";
import { SessionDetail, SessionRatio } from "./history/SessionDetail";
import { SessionComparison } from "./history/SessionComparison";
export function HistoryScreen({
  onHome,
  initialDetailId = null,
  registerBack,
}: {
  onHome: () => void;
  initialDetailId?: string | null;
  registerBack: (handler: () => boolean) => () => void;
}) {
  const [sessions, setSessions] = useState<HistorySession[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  const [exercise, setExercise] = useState<ExerciseId | "all">("all"),
    [sort, setSort] = useState<HistorySort>("recent"),
    [day, setDay] = useState(""),
    [limit, setLimit] = useState(5);
  const [detail, setDetail] = useState<string | null>(initialDetailId),
    [selecting, setSelecting] = useState(false),
    [selected, setSelected] = useState<string[]>([]),
    [comparing, setComparing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const listScroll = useRef(0);
  useEffect(() =>
    registerBack(() => {
      if (filtersOpen) setFiltersOpen(false);
      else if (detail) setDetail(null);
      else if (comparing) setComparing(false);
      else return true;
      return false;
    }),
  );
  const heading = useRef<HTMLHeadingElement>(null),
    returnFocus = useRef("");
  useEffect(() => {
    let disposed = false;
    setLoading(true);
    setError("");
    void createHistoryStore()
      .list()
      .then((rows) => {
        if (!disposed) setSessions(rows);
      })
      .catch(() => {
        if (!disposed)
          setError(
            "Histórico indisponível neste navegador. Você ainda pode treinar e exportar relatórios.",
          );
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, [attempt]);
  useEffect(() => {
    if (!loading && !detail && !comparing) {
      const target = returnFocus.current
        ? (document.getElementById(returnFocus.current) ?? heading.current)
        : heading.current;
      target?.focus({ preventScroll: true });
      if (returnFocus.current) window.scrollTo(0, listScroll.current);
      returnFocus.current = "";
    }
  }, [detail, comparing, loading]);
  const totals = useMemo(() => historyTotals(sessions), [sessions]);
  const filtered = useMemo(
    () => filterHistory(sessions, exercise, sort, day),
    [sessions, exercise, sort, day],
  );
  const current = sessions.find((r) => r.id === detail);
  const picked = selected
    .map((id) => sessions.find((r) => r.id === id))
    .filter((r): r is HistorySession => !!r)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  async function remove(id: string) {
    await createHistoryStore().remove(id);
    setSessions((rows) => rows.filter((r) => r.id !== id));
    setSelected((ids) => ids.filter((value) => value !== id));
    setDetail(null);
  }
  function choose(id: string) {
    setSelected((ids) => {
      if (ids.includes(id)) return ids.filter((value) => value !== id);
      const next = sessions.find((r) => r.id === id);
      const first = sessions.find((r) => r.id === ids[0]);
      if (!next || ids.length >= 2 || (first && first.exercise !== next.exercise)) return ids;
      return [...ids, id];
    });
  }
  const filter = (id: ExerciseId | "all") => {
    setSort("recent");
    setExercise(id);
    setLimit(5);
  };
  if (detail && loading)
    return (
      <main className="progress-screen hero-glow min-h-screen">
        <div className="progress-content">
          <p role="status" className="progress-panel">
            Carregando sessão…
          </p>
        </div>
      </main>
    );
  return (
    <main className="progress-screen hero-glow min-h-screen">
      <div className="progress-content">
        {current ? (
          <SessionDetail
            key={current.id}
            report={current}
            onBack={() => setDetail(null)}
            onDelete={remove}
          />
        ) : comparing && picked.length === 2 ? (
          <SessionComparison a={picked[0]!} b={picked[1]!} onBack={() => setComparing(false)} />
        ) : (
          <>
            <header className="progress-header">
              <p className="torvik-kicker">Torvik · Neste dispositivo</p>
              <h1 ref={heading} tabIndex={-1}>
                Progresso
              </h1>
              <p>Seus treinos registrados, uma sessão de cada vez.</p>
            </header>
            {loading ? (
              <p role="status" className="progress-panel">
                Carregando seu progresso…
              </p>
            ) : error ? (
              <section className="progress-panel">
                <p role="alert" className="progress-error">
                  {error}
                </p>
                <div className="progress-export-actions">
                  <button type="button" onClick={() => setAttempt((n) => n + 1)}>
                    Tentar novamente
                  </button>
                  <button type="button" onClick={onHome}>
                    Iniciar um treino
                  </button>
                </div>
              </section>
            ) : (
              <>
                {!!sessions.length && (
                  <dl className="progress-totals" aria-label="Resumo de todas as sessões">
                    {[
                      [Layers, "Sessões registradas", totals.sessions],
                      ...(sessions.some((r) => r.type !== "HOLD_BASED") || !sessions.length
                        ? [
                            [Activity, "Repetições avaliadas", totals.totalReps],
                            [CheckCheck, "Nos critérios", totals.correctReps],
                          ]
                        : []),
                      ...(sessions.some((r) => r.type === "HOLD_BASED")
                        ? [[Clock3, "Tempo em postura válida", durationLabel(totals.validSeconds)]]
                        : []),
                      [Clock3, "Tempo ativo total", durationLabel(totals.seconds)],
                    ].map(([Icon, label, value]) => {
                      const Symbol = Icon as typeof Layers;
                      return (
                        <div key={String(label)}>
                          <dt>
                            <Symbol size={18} aria-hidden="true" />
                            {String(label)}
                          </dt>
                          <dd>
                            {typeof value === "number"
                              ? value.toLocaleString("pt-BR")
                              : String(value)}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                )}
                {!sessions.length ? (
                  <section className="progress-panel progress-empty">
                    <img src="/torvik-image-2d.webp" width="160" height="240" alt="" />
                    <h2>Seu próximo treino começa esta história</h2>
                    <p>
                      Nenhuma sessão salva. Ao terminar um treino, escolha “Salvar sessão” para
                      acompanhar seus registros aqui.
                    </p>
                    <button type="button" className="torvik-primary" onClick={onHome}>
                      Iniciar um treino
                      <ArrowRight size={18} />
                    </button>
                  </section>
                ) : (
                  <>
                    <section className="progress-sessions" aria-labelledby="sessions-title">
                      <div className="progress-section-heading">
                        <div>
                          <p className="torvik-kicker">Explore seus registros</p>
                          <h2 id="sessions-title">Sessões recentes</h2>
                        </div>
                        <button
                          type="button"
                          className="progress-text-button"
                          aria-pressed={selecting}
                          onClick={() => {
                            setSelecting((v) => !v);
                            setSelected([]);
                          }}
                        >
                          <GitCompareArrows size={17} />
                          {selecting ? "Cancelar comparação" : "Comparar"}
                        </button>
                      </div>
                      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                        <SheetTrigger asChild>
                          <button type="button" className="torvik-secondary">
                            Filtrar
                            {exercise !== "all"
                              ? ` · ${EXERCISES.find((item) => item.id === exercise)?.name}`
                              : ""}
                          </button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="app-sheet">
                          <SheetTitle>Filtrar sessões</SheetTitle>
                          <SheetDescription>
                            Exercícios com registros neste dispositivo.
                          </SheetDescription>
                          <div
                            className="progress-exercise-filters"
                            role="group"
                            aria-label="Filtrar sessões por exercício"
                          >
                            <button
                              type="button"
                              aria-pressed={exercise === "all"}
                              onClick={() => {
                                filter("all");
                                setFiltersOpen(false);
                              }}
                            >
                              Todos
                            </button>
                            {EXERCISES.filter((e) =>
                              sessions.some((session) => session.exercise === e.id),
                            ).map((e) => (
                              <button
                                type="button"
                                key={e.id}
                                aria-pressed={exercise === e.id}
                                onClick={() => {
                                  filter(e.id);
                                  setFiltersOpen(false);
                                }}
                              >
                                {e.name}
                              </button>
                            ))}
                          </div>
                        </SheetContent>
                      </Sheet>
                      <div className="progress-list-options">
                        <p role="status">
                          {filtered.length}{" "}
                          {filtered.length === 1 ? "sessão encontrada" : "sessões encontradas"}
                          {day && (
                            <> em {new Date(`${day}T12:00:00`).toLocaleDateString("pt-BR")}</>
                          )}
                        </p>
                        <label>
                          Ordenar
                          <select
                            value={sort}
                            onChange={(e) => {
                              setSort(e.target.value as HistorySort);
                              setLimit(5);
                            }}
                          >
                            <option value="recent">Mais recentes</option>
                            <option value="oldest">Mais antigas</option>
                            {exercise !== "plank" && <option value="reps">Mais repetições</option>}
                            {(exercise === "all" || exercise === "plank") && (
                              <option value="hold">Maior tempo em postura válida</option>
                            )}
                            <option value="time">Maior tempo ativo</option>
                          </select>
                        </label>
                      </div>
                      {day && (
                        <button
                          type="button"
                          className="progress-text-button"
                          onClick={() => setDay("")}
                        >
                          Limpar filtro de data
                        </button>
                      )}
                      {selecting && (
                        <div className="progress-compare-bar">
                          <p>
                            Selecione duas sessões do mesmo exercício ({selected.length}/2).{" "}
                            {picked[0] &&
                              `Exercício: ${EXERCISES.find((e) => e.id === picked[0]!.exercise)?.name}.`}
                          </p>
                          <button
                            id="compare-selected"
                            type="button"
                            className="torvik-secondary"
                            disabled={picked.length !== 2}
                            onClick={() => {
                              listScroll.current = window.scrollY;
                              returnFocus.current = "compare-selected";
                              setComparing(true);
                            }}
                          >
                            Comparar selecionadas
                          </button>
                        </div>
                      )}
                      {!filtered.length ? (
                        <div className="progress-panel progress-empty-inline">
                          <h3>Nenhuma sessão com estes filtros</h3>
                          <p>Escolha outro exercício ou limpe a data selecionada.</p>
                          <button
                            type="button"
                            className="progress-text-button"
                            onClick={() => {
                              filter("all");
                              setDay("");
                            }}
                          >
                            Ver todas as sessões
                          </button>
                        </div>
                      ) : (
                        <ul className="progress-session-list">
                          {filtered.slice(0, limit).map((r) => {
                            const locked =
                              !selected.includes(r.id) &&
                              (selected.length >= 2 ||
                                (!!picked[0] && picked[0].exercise !== r.exercise));
                            return (
                              <li key={r.id} className="progress-session-card">
                                <div className="progress-card-heading">
                                  <div>
                                    <h3>
                                      {EXERCISES.find((e) => e.id === r.exercise)?.name ??
                                        r.exercise}
                                    </h3>
                                    <time dateTime={r.createdAt}>
                                      {new Date(r.createdAt).toLocaleString("pt-BR")}
                                    </time>
                                  </div>
                                  <span aria-hidden="true" className="progress-exercise-icon">
                                    {EXERCISES.find((e) => e.id === r.exercise)?.emoji}
                                  </span>
                                </div>
                                <dl className="progress-card-stats">
                                  {r.type === "HOLD_BASED" ? (
                                    <>
                                      <div>
                                        <dt>Postura válida</dt>
                                        <dd>{durationLabel(r.validSeconds)}</dd>
                                      </div>
                                      <div>
                                        <dt>Tempo acompanhado</dt>
                                        <dd>{durationLabel(r.seconds)}</dd>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div>
                                        <dt>Avaliadas</dt>
                                        <dd>{r.totalReps}</dd>
                                      </div>
                                      <div>
                                        <dt>Nos critérios</dt>
                                        <dd>{r.correctReps}</dd>
                                      </div>
                                      <div>
                                        <dt>Tempo ativo</dt>
                                        <dd>{durationLabel(r.seconds)}</dd>
                                      </div>
                                    </>
                                  )}
                                </dl>
                                <SessionRatio report={r} />
                                <div className="progress-card-actions">
                                  {selecting && (
                                    <label>
                                      <input
                                        type="checkbox"
                                        disabled={locked}
                                        checked={selected.includes(r.id)}
                                        onChange={() => choose(r.id)}
                                      />
                                      Comparar esta sessão
                                    </label>
                                  )}
                                  <button
                                    id={`session-${r.id}`}
                                    type="button"
                                    onClick={() => {
                                      listScroll.current = window.scrollY;
                                      returnFocus.current = `session-${r.id}`;
                                      setDetail(r.id);
                                    }}
                                  >
                                    Ver detalhes
                                    <ArrowRight size={16} />
                                  </button>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      {filtered.length > limit && (
                        <button
                          type="button"
                          className="torvik-secondary progress-load-more"
                          onClick={() => setLimit((n) => n + 20)}
                        >
                          Mostrar mais sessões ({filtered.length - limit} restantes)
                        </button>
                      )}
                    </section>
                    <details className="app-disclosure">
                      <summary>Gráficos de evolução</summary>
                      <EvolutionChart sessions={sessions} />
                    </details>
                    <ActivityCalendar
                      sessions={sessions}
                      selected={day}
                      onSelect={(value) => {
                        setDay(value);
                        setExercise("all");
                        setLimit(5);
                      }}
                    />
                  </>
                )}
              </>
            )}
            <footer className="progress-footer">
              Somente sessões salvas neste navegador e dispositivo. Nenhum vídeo é armazenado. O
              navegador pode remover dados locais; exporte uma cópia para preservá-los.
            </footer>
          </>
        )}
      </div>
    </main>
  );
}
