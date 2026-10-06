import type { HistorySession } from "@/lib/history";
import { durationLabel } from "@/lib/progress";
export function SideResults({ report }: { report: HistorySession }) {
  if (!report.sideResults) return null;
  return (
    <section className="progress-panel" aria-label="Resultados por lado">
      <h2>Resultados por lado</h2>
      <dl className="progress-detail-stats">
        {(["left", "right"] as const).map((side) => (
          <div key={side}>
            <dt>Lado {side === "left" ? "esquerdo" : "direito"}</dt>
            <dd>
              {report.type === "HOLD_BASED"
                ? durationLabel(report.sideResults![side].validSeconds)
                : `${report.sideResults![side].totalReps} repetições · ${report.sideResults![side].correctReps} nos critérios`}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
