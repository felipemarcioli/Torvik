import { useTranslation } from "react-i18next";
import { translate as t } from "@/lib/i18n";
import type { HistorySession } from "@/lib/history";
import { durationLabel } from "@/lib/progress";
export function SideResults({ report }: { report: HistorySession }) {
  useTranslation();

  if (!report.sideResults) return null;
  return (
    <section className="progress-panel" aria-label={t("Resultados por lado")}>
      <h2>{t("Resultados por lado")}</h2>
      <dl className="progress-detail-stats">
        {(["left", "right"] as const).map((side) => (
          <div key={side}>
            <dt>
              {t("Lado {{value0}}", { value0: side === "left" ? t("esquerdo") : t("direito") })}
            </dt>
            <dd>
              {report.type === "HOLD_BASED"
                ? durationLabel(report.sideResults![side].validSeconds)
                : t("{{value0}} repetições · {{value1}} nos critérios", {
                    value0: report.sideResults![side].totalReps,
                    value1: report.sideResults![side].correctReps,
                  })}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
