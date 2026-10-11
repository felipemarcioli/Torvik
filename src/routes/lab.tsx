import { createFileRoute, Link } from "@tanstack/react-router";
import { StatePage, LoadingState } from "@/components/torvik/TorvikUI";
import { lazy, Suspense } from "react";
const PoseLab = lazy(() =>
  import("@/components/torvik/PoseLab").then((module) => ({ default: module.PoseLab })),
);
export const Route = createFileRoute("/lab")({ component: Laboratory });
function Laboratory() {
  if (!import.meta.env.DEV && import.meta.env["VITE_ENABLE_POSE_LAB"] !== "true")
    return (
      <StatePage
        title="Laboratório experimental desativado"
        eyebrow="Torvik"
        actions={
          <Link to="/" className="torvik-primary">
            Voltar ao início
          </Link>
        }
      >
        A ferramenta de comparação de motores está desativada nesta versão. Seus treinos continuam
        disponíveis.
      </StatePage>
    );
  return (
    <Suspense fallback={<LoadingState>Carregando laboratório…</LoadingState>}>
      <PoseLab />
    </Suspense>
  );
}
