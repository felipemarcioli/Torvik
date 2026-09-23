import { useEffect, useState } from "react";
import { comparableReports, createHistoryStore, exportReport } from "@/lib/history";
import { formatTime, type SessionReport } from "@/lib/session";
import { EXERCISES } from "./data";
export function HistoryScreen({ onHome }: { onHome: () => void }) {
  const [sessions, setSessions] = useState<SessionReport[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [deleting, setDeleting] = useState<string | null>(null),
    [pending, setPending] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void createHistoryStore()
      .list()
      .then((list) => {
        if (!cancelled) setSessions(list);
      })
      .catch(() => {
        if (!cancelled)
          setError(
            "Histórico indisponível neste navegador. Você ainda pode treinar e exportar relatórios.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  async function remove(id: string) {
    setPending(id);
    setError("");
    try {
      await createHistoryStore().remove(id);
      setSessions((list) => list.filter((r) => r.id !== id));
      setDeleting(null);
    } catch {
      setError("Não foi possível excluir a sessão. Tente novamente.");
    } finally {
      setPending(null);
    }
  }
  return (
    <main className="hero-glow min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-12">
        <button type="button" className="torvik-secondary text-sm" onClick={onHome}>
          Voltar ao início
        </button>
        <p className="torvik-kicker mt-7">Neste dispositivo</p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Seu histórico</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Somente as sessões que você escolheu salvar neste navegador. Compare resultados sob os
          mesmos critérios; diferenças não comprovam melhora biomecânica.
        </p>
        {loading && (
          <p role="status" className="torvik-panel mt-6 p-5">
            Carregando histórico…
          </p>
        )}
        {error && (
          <p role="alert" className="torvik-panel mt-4 border-caution/50 p-5 text-caution">
            {error}
          </p>
        )}
        {!loading && !error && !sessions.length && (
          <section className="torvik-panel mt-6 flex items-center gap-5 p-6 sm:p-8">
            <img
              src="/torvik-image-2d.webp"
              width="160"
              height="240"
              alt=""
              className="h-20 w-auto shrink-0 opacity-90"
            />
            <div>
              <h2 className="text-xl font-bold">Nenhuma sessão salva</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Ao terminar um treino, escolha “Salvar sessão”. Seus resultados aparecerão aqui.
              </p>
            </div>
          </section>
        )}
        <ul className="mt-6 space-y-4">
          {sessions.map((r, index) => {
            const previous = sessions.slice(index + 1).find((other) => comparableReports(r, other));
            return (
              <li key={r.id} className="torvik-panel p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="torvik-kicker">Sessão salva</p>
                    <h2 className="mt-1 text-xl font-bold">
                      {EXERCISES.find((e) => e.id === r.exercise)?.name}
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-y border-border py-4 text-center sm:gap-4">
                  <div>
                    <p className="font-display text-2xl font-bold tabular-nums">{r.totalReps}</p>
                    <p className="text-xs text-muted-foreground">avaliadas</p>
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold text-success tabular-nums">
                      {r.correctReps}
                    </p>
                    <p className="text-xs text-muted-foreground">nos critérios</p>
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold tabular-nums">
                      {formatTime(r.seconds)}
                    </p>
                    <p className="text-xs text-muted-foreground">tempo ativo</p>
                  </div>
                </div>
                <p className="sr-only">
                  {r.totalReps} repetições avaliadas • {r.correctReps} dentro dos critérios
                </p>
                {previous && (
                  <p className="mt-3 rounded-lg bg-background px-3 py-2 text-sm text-muted-foreground">
                    Sessão anterior comparável: {previous.totalReps} avaliadas,{" "}
                    {previous.correctReps} dentro dos critérios.
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="torvik-secondary"
                    onClick={() => exportReport(r)}
                  >
                    Exportar
                  </button>
                  <button type="button" className="torvik-danger" onClick={() => setDeleting(r.id)}>
                    Excluir
                  </button>
                </div>
                {deleting === r.id && (
                  <div className="mt-3 rounded-xl border border-caution/50 bg-background p-4">
                    <p id={`delete-${r.id}`} className="text-sm">
                      Excluir esta sessão do dispositivo? Exporte antes se quiser uma cópia.
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        className="torvik-secondary"
                        onClick={() => setDeleting(null)}
                      >
                        Manter sessão
                      </button>
                      <button
                        type="button"
                        disabled={pending === r.id}
                        aria-describedby={`delete-${r.id}`}
                        className="torvik-danger"
                        onClick={() => void remove(r.id)}
                      >
                        {pending === r.id ? "Excluindo…" : "Confirmar exclusão"}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
