import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const PoseLab = lazy(() =>
  import("@/components/torvik/PoseLab").then((module) => ({ default: module.PoseLab })),
);
export const Route = createFileRoute("/lab")({ component: Laboratory });
function Laboratory() {
  if (!import.meta.env.DEV && import.meta.env["VITE_ENABLE_POSE_LAB"] !== "true")
    return (
      <main className="p-8">
        <h1>Laboratório experimental desativado</h1>
        <Link to="/" className="text-primary underline">
          Voltar ao início
        </Link>
      </main>
    );
  return (
    <Suspense
      fallback={
        <p role="status" className="p-8">
          Carregando laboratório…
        </p>
      }
    >
      <PoseLab />
    </Suspense>
  );
}
