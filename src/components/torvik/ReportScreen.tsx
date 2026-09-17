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
      <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-8 sm:px-5 sm:pb-20 sm:pt-12">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:gap-4">
          <img src="/torvik-image-2d.png" alt="Mascote Torvik" className="w-14 shrink-0 sm:w-20" />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-primary sm:text-sm sm:tracking-[0.3em]">
              Relatório
            </p>
            <h1 className="text-2xl font-bold sm:text-3xl">
              {exercise?.name ?? "Treino"} concluído
            </h1>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-4">
          <Stat label="Tempo total" value={formatTime(report.seconds)} />
          <Stat label="Repetições totais" value={String(report.totalReps)} />
          <Stat label="Repetições corretas" value={String(report.correctReps)} accent />
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-card p-4 sm:mt-6 sm:p-6">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-base font-bold sm:text-lg">Taxa de precisão</h2>
            <span className="shrink-0 text-2xl font-bold text-primary sm:text-3xl">{accuracy}%</span>
          </div>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-secondary sm:mt-4 sm:h-4">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${accuracy}%` }}
            />
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-card p-4 sm:mt-6 sm:p-6">
          <h2 className="text-base font-bold sm:text-lg">Pontos de atenção</h2>
          {ranking.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Nenhum alerta registrado. Execução limpa!
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {ranking.map(([message, count]) => (
                <li key={message}>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-sm">
                    <span className="min-w-0">{message}</span>
                    <span className="shrink-0 text-muted-foreground">{count}x</span>
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

        <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={onRestart}
            className="w-full rounded-xl bg-primary px-6 py-3.5 font-bold text-primary-foreground transition hover:brightness-110 sm:w-auto sm:py-3"
          >
            Novo treino
          </button>
          <button
            type="button"
            onClick={onHome}
            className="w-full rounded-xl border border-border px-6 py-3.5 font-semibold transition hover:bg-secondary sm:w-auto sm:py-3"
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
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold sm:mt-2 sm:text-3xl ${accent ? "text-success" : ""}`}>
        {value}
      </p>
    </div>
  );
}
