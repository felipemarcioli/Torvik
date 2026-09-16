import mascot from "@/assets/torvik-flat.png.asset.json";
import { EXERCISES } from "./data";
import type { ExerciseId } from "@/lib/biomech";

export type SessionReport = {
  exercise: ExerciseId;
  seconds: number;
  totalReps: number;
  correctReps: number;
  feedbackCounts: Record<string, number>;
};

export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function ReportScreen({
  report,
  onRestart,
  onHome,
}: {
  report: SessionReport;
  onRestart: () => void;
  onHome: () => void;
}) {
  const exercise = EXERCISES.find((e) => e.id === report.exercise);
  const accuracy = report.totalReps ? Math.round((report.correctReps / report.totalReps) * 100) : 0;
  const ranking = Object.entries(report.feedbackCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxCount = ranking[0]?.[1] ?? 1;

  return (
    <div className="hero-glow min-h-screen">
      <div className="mx-auto w-full max-w-4xl px-5 pb-20 pt-12">
        <div className="flex items-center gap-4">
          <img src={mascot.url} alt="Mascote Torvik" className="w-20" />
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-primary">Relatório</p>
            <h1 className="text-3xl font-bold">{exercise?.name ?? "Treino"} concluído</h1>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat label="Tempo total" value={formatTime(report.seconds)} />
          <Stat label="Repetições totais" value={String(report.totalReps)} />
          <Stat label="Repetições corretas" value={String(report.correctReps)} accent />
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-end justify-between">
            <h2 className="text-lg font-bold">Taxa de precisão</h2>
            <span className="text-3xl font-bold text-primary">{accuracy}%</span>
          </div>
          <div className="mt-4 h-4 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${accuracy}%` }}
            />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold">Pontos de atenção</h2>
          {ranking.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Nenhum alerta registrado. Execução limpa!
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {ranking.map(([message, count]) => (
                <li key={message}>
                  <div className="flex justify-between text-sm">
                    <span>{message}</span>
                    <span className="text-muted-foreground">{count}x</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onRestart}
            className="rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground transition hover:brightness-110"
          >
            Novo treino
          </button>
          <button
            type="button"
            onClick={onHome}
            className="rounded-xl border border-border px-6 py-3 font-semibold transition hover:bg-secondary"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent ? "text-success" : ""}`}>{value}</p>
    </div>
  );
}
