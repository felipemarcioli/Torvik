import { useState } from "react";
import { EXERCISES } from "./data";
import { formatTime, type SessionReport } from "@/lib/session";
import { createHistoryStore, exportReport } from "@/lib/history";
export function ReportScreen({
  report,
  onRestart,
  onHome,
}: {
  report: SessionReport;
  onRestart: () => void;
  onHome: () => void;
}) {
  const [saved, setSaved] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const exercise = EXERCISES.find((e) => e.id === report.exercise)!;
  const percent = report.totalReps
    ? Math.round((report.correctReps / report.totalReps) * 100)
    : null;
  const ranking = Object.entries(report.feedbackCounts).sort((a, b) => b[1] - a[1]);
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await createHistoryStore().save(report);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <main className="hero-glow min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <header className="flex items-center gap-4">
          <img
            src="/torvik-image-2d.webp"
            width="160"
            height="240"
            alt="Mascote Torvik"
            className="h-20 w-auto"
          />
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">Relatório local</p>
            <h1 className="text-2xl font-bold sm:text-3xl">{exercise.name} concluído</h1>
          </div>
        </header>
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Tempo ativo" value={formatTime(report.seconds)} />
          <Stat label="Repetições avaliadas" value={String(report.totalReps)} />
          <Stat label="Dentro dos critérios" value={String(report.correctReps)} />
        </dl>
        <section className="mt-4 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-bold">Repetições dentro dos critérios do app</h2>
          {percent === null ? (
            <p className="mt-3 text-muted-foreground">
              Dados insuficientes: nenhuma repetição completa foi avaliada.
            </p>
          ) : (
            <>
              <p className="mt-2 text-3xl font-bold text-primary">{percent}%</p>
              <progress
                className="mt-3 h-3 w-full accent-primary"
                max="100"
                value={percent}
                aria-label="Proporção de repetições dentro dos critérios"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                {report.correctReps} de {report.totalReps} repetições completas atenderam às regras
                do aplicativo.
              </p>
            </>
          )}
          <p className="mt-3 text-sm text-muted-foreground">
            Esta proporção descreve regras automáticas de movimento. Não mede precisão científica
            nem substitui avaliação profissional.
          </p>
        </section>
        <section className="mt-4 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-bold">Pontos de atenção</h2>
          {ranking.length ? (
            <ul className="mt-3 space-y-2">
              {ranking.map(([message, count]) => (
                <li key={message} className="flex justify-between gap-4 text-sm">
                  <span>{message}</span>
                  <span className="shrink-0 text-caution">{count}×</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              {report.totalReps
                ? "Nenhuma correção registrada nas repetições avaliadas."
                : "Complete um movimento para receber um resumo dos critérios."}
            </p>
          )}
          <p className="mt-3 text-sm text-muted-foreground">
            Ciclos interrompidos: {report.interruptedCycles} • Perdas de rastreamento:{" "}
            {report.trackingLosses}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Um ciclo pode ter mais de um ponto de atenção. Pausas, preparação e períodos sem
            rastreamento não entram no tempo ativo.
          </p>
        </section>
        <section className="mt-4 rounded-2xl border border-border p-5">
          <h2 className="font-bold">Seu histórico, neste dispositivo</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Salve apenas se quiser. Nenhum vídeo é gravado. Os dados podem ser apagados pelo
            navegador; exporte uma cópia para preservá-los.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="torvik-secondary"
              disabled={saving || saved}
              onClick={() => void save()}
            >
              {saved ? "Salvo neste dispositivo" : saving ? "Salvando…" : "Salvar sessão"}
            </button>
            <button type="button" className="torvik-secondary" onClick={() => exportReport(report)}>
              Exportar relatório
            </button>
          </div>
          <p role="status" className="mt-2 text-sm">
            {saved ? "Sessão salva." : ""}
          </p>
          {error && (
            <p role="alert" className="mt-2 text-sm text-caution">
              {error}
            </p>
          )}
        </section>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="torvik-primary" onClick={onRestart}>
            Novo treino
          </button>
          <button type="button" className="torvik-secondary" onClick={onHome}>
            Voltar ao início
          </button>
        </div>
      </div>
    </main>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-2xl font-bold">{value}</dd>
    </div>
  );
}
