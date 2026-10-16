import { useTranslation } from "react-i18next";
import { translate as t, formatList } from "@/lib/i18n";
import { EXERCISE_BY_ID } from "@/lib/exercises/catalog";
import type { ExerciseId } from "@/lib/biomech";
import { ExercisePreview } from "./ExercisePreview";
import { ScreenHeading } from "./TorvikUI";
import { ArrowRight, Package } from "lucide-react";
import { BackButton } from "./AppNavigation";
export function ExerciseDetailScreen({
  exercise,
  onBack,
  onStart,
}: {
  exercise: ExerciseId;
  onBack: () => void;
  onStart: () => void;
}) {
  useTranslation();

  const details = EXERCISE_BY_ID[exercise];
  return (
    <main className="train-screen hero-glow">
      <div className="app-content exercise-detail">
        <BackButton onClick={onBack} />
        <ScreenHeading title={t(details.name)} eyebrow={t("Seu próximo treino")}>
          {t(details.summary)}
        </ScreenHeading>
        <div
          className="detail-preview torvik-panel"
          id={`exercise-preview-${exercise}`}
          role="img"
          aria-label={t(details.previewAlt)}
        >
          <ExercisePreview exercise={details} animated />
          {details.previewAvailable === false && <p>{t("Demonstração animada indisponível.")}</p>}
        </div>
        <section className="detail-equipment">
          <h2 className="font-bold">
            <Package size={18} aria-hidden="true" /> {t("Equipamento")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {details.equipment
              ? details.equipment.length
                ? formatList(details.equipment.map((item) => t(item)))
                : t("Nenhum")
              : t("Não informado no catálogo")}
          </p>
        </section>
        <section className="detail-instructions">
          <h2 className="text-lg font-bold">{t("Como fazer")}</h2>
          <ul>
            {details.instructions.slice(0, 3).map((instruction) => (
              <li key={t(instruction)}>{t(instruction)}</li>
            ))}
          </ul>
        </section>
        <button type="button" className="torvik-primary detail-start" onClick={onStart}>
          {t("Preparar {{exercise}}", { exercise: t(details.name) })}{" "}
          <ArrowRight className="directional-icon" size={18} aria-hidden="true" />
        </button>
        <details className="app-disclosure">
          <summary>{t("Posicionamento e detalhes da análise")}</summary>
          <div className="space-y-3 text-sm text-muted-foreground">
            {details.instructions.slice(3).map((instruction) => (
              <p key={t(instruction)}>{t(instruction)}</p>
            ))}
            <p>{t(details.previewInstruction)}</p>
            {details.preparation && <p>{t(details.preparation)}</p>}
            {details.execution && <p>{t(details.execution)}</p>}
            {details.repDefinition && <p>{t(details.repDefinition)}</p>}
            <p>
              {(details.analysisLimitations ? t(details.analysisLimitations) : undefined) ??
                t(
                  "A análise estima o movimento em 2D segundo regras do aplicativo, sem validação clínica. Não substitui avaliação profissional.",
                )}
            </p>
          </div>
        </details>
      </div>
    </main>
  );
}
