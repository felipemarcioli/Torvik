import { useTranslation } from "react-i18next";
import { translate as t } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { StatePage, LoadingState } from "@/components/torvik/TorvikUI";
import { lazy, Suspense } from "react";
const PoseLab = lazy(() =>
  import("@/components/torvik/PoseLab").then((module) => ({ default: module.PoseLab })),
);
export const Route = createFileRoute("/lab")({ component: Laboratory });
function Laboratory() {
  useTranslation();

  if (!import.meta.env.DEV && import.meta.env["VITE_ENABLE_POSE_LAB"] !== "true")
    return (
      <StatePage
        title={t("Laboratório experimental desativado")}
        eyebrow="Torvik"
        actions={
          <Link to="/" className="torvik-primary">
            {t("Voltar ao início")}
          </Link>
        }
      >
        {t(
          "A ferramenta de comparação de motores está desativada nesta versão. Seus treinos continuam disponíveis.",
        )}
      </StatePage>
    );
  return (
    <Suspense fallback={<LoadingState>{t("Carregando laboratório…")}</LoadingState>}>
      <PoseLab />
    </Suspense>
  );
}
