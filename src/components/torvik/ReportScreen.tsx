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
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-12">
        <header className="flex items-center gap-4 border-b border-border pb-5">
          <img
            src="/torvik-image-2d.webp"
            width="160"
            height="240"
            alt="Mascote Torvik"
            className="h-16 w-auto sm:h-20"
          />
          <div>
            <p className="torvik-kicker">Relatório local</p>
            <h1 className="mt-1 text-2xl font-bold leading-tight sm:text-3xl">
              {exercise.name} concluído
            </h1>
          </div>
        </header>
        <section className="torvik-panel mt-6 overflow-hidden">
          <div className="border-b border-border p-5 sm:p-7">
            <p className="torvik-kicker">Resultado da sessão</p>
            <h2 className="mt-2 text-lg font-bold">Repetições dentro dos critérios do app</h2>
            {percent === null ? (
              <p className="mt-3 text-lg font-semibold text-muted-foreground">
                Dados insuficientes: nenhuma repetição completa foi avaliada.
              </p>
            ) : (
              <>
                <p className="mt-1 font-display text-5xl font-extrabold leading-none text-primary tabular-nums sm:text-6xl">
                  {percent}%
                </p>
                <progress
                  className="mt-4 h-2 w-full accent-primary"
                  max="100"
                  value={percent}
                  aria-label="Proporção de repetições dentro dos critérios"
                />
                <p className="mt-3 text-sm text-muted-foreground">
                  {report.correctReps} de {report.totalReps} repetições completas atenderam às
                  regras do aplicativo.
                </p>
              </>
            )}
            <p className="mt-3 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Esta proporção descreve regras automáticas de movimento. Não mede precisão científica
              nem substitui avaliação profissional.
            </p>
          </div>
          <dl className="grid grid-cols-3 divide-x divide-border">
            <Stat label="Tempo ativo" value={formatTime(report.seconds)} />
            <Stat label="Repetições avaliadas" value={String(report.totalReps)} />
            <Stat label="Dentro dos critérios" value={String(report.correctReps)} />
          </dl>
        </section>
        <section className="torvik-panel mt-4 p-5 sm:p-6">
          <p className="torvik-kicker">Revisão</p>
          <h2 className="mt-1 text-xl font-bold">Pontos de atenção</h2>
          {ranking.length ? (
            <ul className="mt-3 space-y-2">
              {ranking.map(([message, count]) => (
                <li
                  key={message}
                  className="flex justify-between gap-4 border-b border-border py-2 text-sm last:border-0"
                >
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
          <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">
            Ciclos interrompidos: {report.interruptedCycles} • Perdas de rastreamento:{" "}
            {report.trackingLosses}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Um ciclo pode ter mais de um ponto de atenção. Pausas, preparação e períodos sem
            rastreamento não entram no tempo ativo.
          </p>
        </section>
        <section className="torvik-panel mt-4 p-5 sm:p-6">
          <h2 className="text-xl font-bold">Seu histórico, neste dispositivo</h2>
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
        <div className="mt-6 flex flex-wrap gap-3 pb-[env(safe-area-inset-bottom)]">
          <button type="button" className="torvik-primary flex-1 sm:flex-none" onClick={onRestart}>
            Novo treino
          </button>
          <button type="button" className="torvik-secondary flex-1 sm:flex-none" onClick={onHome}>
            Voltar ao início
          </button>
        </div>
      </div>
    </main>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-2 py-4 text-center sm:p-5">
      <dt className="text-[0.65rem] leading-tight text-muted-foreground sm:text-xs">{label}</dt>
      <dd className="mt-1 font-display text-xl font-bold tabular-nums sm:text-2xl">{value}</dd>
    </div>
  );
}
