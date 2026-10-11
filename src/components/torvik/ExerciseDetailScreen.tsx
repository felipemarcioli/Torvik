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
  const details = EXERCISE_BY_ID[exercise];
  return (
    <main className="train-screen hero-glow">
      <div className="app-content exercise-detail">
        <BackButton onClick={onBack} />
        <ScreenHeading title={details.name} eyebrow="Seu próximo treino">
          {details.summary}
        </ScreenHeading>
        <div
          className="detail-preview torvik-panel"
          id={`exercise-preview-${exercise}`}
          role="img"
          aria-label={details.previewAlt}
        >
          <ExercisePreview exercise={details} animated />
          {details.previewAvailable === false && <p>Demonstração animada indisponível.</p>}
        </div>
        <section className="detail-equipment">
          <h2 className="font-bold">
            <Package size={18} aria-hidden="true" /> Equipamento
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {details.equipment
              ? details.equipment.length
                ? details.equipment.join("; ")
                : "Nenhum"
              : "Não informado no catálogo"}
          </p>
        </section>
        <section className="detail-instructions">
          <h2 className="text-lg font-bold">Como fazer</h2>
          <ul>
            {details.instructions.slice(0, 3).map((instruction) => (
              <li key={instruction}>{instruction}</li>
            ))}
          </ul>
        </section>
        <button type="button" className="torvik-primary detail-start" onClick={onStart}>
          Preparar {details.name.toLocaleLowerCase("pt-BR")}{" "}
          <ArrowRight size={18} aria-hidden="true" />
        </button>
        <details className="app-disclosure">
          <summary>Posicionamento e detalhes da análise</summary>
          <div className="space-y-3 text-sm text-muted-foreground">
            {details.instructions.slice(3).map((instruction) => (
              <p key={instruction}>{instruction}</p>
            ))}
            <p>{details.previewInstruction}</p>
            {details.preparation && <p>{details.preparation}</p>}
            {details.execution && <p>{details.execution}</p>}
            {details.repDefinition && <p>{details.repDefinition}</p>}
            <p>
              {details.analysisLimitations ??
                "A análise estima o movimento em 2D segundo regras do aplicativo, sem validação clínica. Não substitui avaliação profissional."}
            </p>
          </div>
        </details>
      </div>
    </main>
  );
}
