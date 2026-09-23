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
      <div className="mx-auto max-w-4xl px-4 py-8">
        <button type="button" className="torvik-secondary" onClick={onHome}>
          Voltar ao início
        </button>
        <h1 className="mt-6 text-3xl font-bold">Seu histórico</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Somente as sessões que você escolheu salvar neste navegador. Compare resultados sob os
          mesmos critérios; diferenças não comprovam melhora biomecânica.
        </p>
        {loading && (
          <p role="status" className="mt-6">
            Carregando histórico…
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 text-caution">
            {error}
          </p>
        )}
        {!loading && !error && !sessions.length && (
          <p className="mt-6 rounded-2xl border border-border bg-card p-5">
            Nenhuma sessão salva. Ao terminar um treino, escolha “Salvar sessão”.
          </p>
        )}
        <ul className="mt-6 space-y-4">
          {sessions.map((r, index) => {
            const previous = sessions.slice(index + 1).find((other) => comparableReports(r, other));
            return (
              <li key={r.id} className="rounded-2xl border border-border bg-card p-5">
                <h2 className="text-lg font-bold">
                  {EXERCISES.find((e) => e.id === r.exercise)?.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {new Date(r.createdAt).toLocaleString("pt-BR")} • {formatTime(r.seconds)} ativos
                </p>
                <p className="mt-3">
                  {r.totalReps} repetições avaliadas • {r.correctReps} dentro dos critérios
                </p>
                {previous && (
                  <p className="mt-2 text-sm text-muted-foreground">
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
                  <button
                    type="button"
                    className="torvik-secondary"
                    onClick={() => setDeleting(r.id)}
                  >
                    Excluir
                  </button>
                </div>
                {deleting === r.id && (
                  <div className="mt-3 rounded-xl border border-caution/50 p-3">
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
                        className="torvik-primary"
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
