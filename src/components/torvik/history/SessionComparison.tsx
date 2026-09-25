import { useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import type { HistorySession } from "@/lib/history";
import { comparison, durationLabel, metricLabel, proportion } from "@/lib/progress";
import { EXERCISES } from "../data";
export function SessionComparison({
  a,
  b,
  onBack,
}: {
  a: HistorySession;
  b: HistorySession;
  onBack: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo(0, 0);
  }, []);
  const values = comparison(a, b),
    signed = (v: number | null, suffix = "") =>
      v === null
        ? "Não comparável"
        : `${v > 0 ? "+" : ""}${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}${suffix}`;
  const hold = a.type === "HOLD_BASED" && b.type === "HOLD_BASED";
  const rows = hold
    ? [
        [
          "Tempo em postura válida",
          durationLabel(a.validSeconds!),
          durationLabel(b.validSeconds!),
          signed(values.validSeconds, " s"),
        ],
        [
          "Tempo acompanhado",
          durationLabel(a.seconds),
          durationLabel(b.seconds),
          signed(values.seconds, " s"),
        ],
      ]
    : [
        ["Repetições avaliadas", a.totalReps, b.totalReps, signed(values.totalReps)],
        ["Nos critérios", a.correctReps, b.correctReps, signed(values.correctReps)],
        [
          "Proporção",
          metricLabel(proportion(a), "proportion"),
          metricLabel(proportion(b), "proportion"),
          signed(values.proportion, " p.p."),
        ],
        [
          "Tempo ativo",
          durationLabel(a.seconds),
          durationLabel(b.seconds),
          signed(values.seconds, " s"),
        ],
      ];
  return (
    <div>
      <button type="button" className="progress-back" onClick={onBack}>
        <ArrowLeft size={18} />
        Voltar ao progresso
      </button>
      <header className="progress-header">
        <p className="torvik-kicker">{EXERCISES.find((e) => e.id === a.exercise)?.name}</p>
        <h1 ref={heading} tabIndex={-1}>
          Comparar sessões
        </h1>
        <p>Diferenças entre registros, sem classificação de melhora biomecânica.</p>
      </header>
      <section className="progress-panel">
        <div className="progress-comparison-dates">
          <div>
            <strong>Sessão A</strong>
            <time>{new Date(a.createdAt).toLocaleString("pt-BR")}</time>
          </div>
          <div>
            <strong>Sessão B</strong>
            <time>{new Date(b.createdAt).toLocaleString("pt-BR")}</time>
          </div>
        </div>
        {!values.compatible && (
          <p role="status" className="progress-error">
            Versões diferentes de regras ou estimador. Valores de atendimento são apresentados
            separadamente; suas diferenças não são calculadas.
          </p>
        )}
        <div className="progress-comparison-labels">
          <span>A</span>
          <span>B</span>
          <span>Diferença B − A</span>
        </div>
        {rows.map(([label, left, right, diff]) => (
          <div className="progress-comparison-row" key={label}>
            <h2>{label}</h2>
            <div>
              <span>{left}</span>
              <span>{right}</span>
              <strong>{diff}</strong>
            </div>
          </div>
        ))}
        <p className="progress-caption">
          {hold
            ? "Tempo válido é a soma dos intervalos observados dentro dos critérios."
            : "p.p. = pontos percentuais. Proporções sem repetições avaliadas não são comparáveis."}
        </p>
      </section>
      <section className="progress-panel">
        <h2>Ocorrências por critério</h2>
        {!values.compatible ? (
          <p className="progress-caption">
            Comparação de ocorrências indisponível entre versões diferentes.
          </p>
        ) : !a.feedbackCounts || !b.feedbackCounts ? (
          <p className="progress-caption">
            Uma das sessões não registrou o detalhamento das ocorrências.
          </p>
        ) : !values.issues.length ? (
          <p className="progress-caption">Nenhuma ocorrência registrada nas duas sessões.</p>
        ) : (
          values.issues.map((row) => (
            <div className="progress-comparison-row" key={row.key}>
              <h3>{row.key}</h3>
              <div>
                <span>{row.a}×</span>
                <span>{row.b}×</span>
                <strong>{signed(row.difference)}</strong>
              </div>
            </div>
          ))
        )}
        <p className="progress-caption">
          {hold
            ? "Cada número representa episódios persistentes daquela ocorrência."
            : "Cada número representa repetições com aquela ocorrência; uma repetição pode aparecer em mais de um critério."}
        </p>
      </section>
      <details className="progress-panel">
        <summary>Versões da análise</summary>
        <p className="progress-version">
          A: regras {a.rulesVersion} · {a.engineVersion}
        </p>
        <p className="progress-version">
          B: regras {b.rulesVersion} · {b.engineVersion}
        </p>
      </details>
    </div>
  );
}
