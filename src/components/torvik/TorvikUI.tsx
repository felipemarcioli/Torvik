import { useTranslation } from "react-i18next";
import { translate as t } from "@/lib/i18n";
import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

export function Brand() {
  useTranslation();

  return (
    <span className="torvik-brand">
      <img src="/torvik-image-logo.png" width="40" height="40" alt="" />
      <span>
        {t("torvik")}
        <span className="brand-dot">.</span>
      </span>
    </span>
  );
}
export function Mascot({
  className = "",
  decorative = false,
}: {
  className?: string;
  decorative?: boolean;
}) {
  useTranslation();

  return (
    <img
      src="/torvik-image-3d-360.webp"
      srcSet="/torvik-image-3d-180.webp 180w, /torvik-image-3d-360.webp 360w"
      sizes="(min-width: 768px) 200px, 120px"
      width="360"
      height="540"
      alt={decorative ? "" : t("Torvik, seu canguru assistente de treino")}
      className={`torvik-mascot ${className}`}
    />
  );
}
export function ScreenHeading({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children?: ReactNode;
}) {
  useTranslation();

  return (
    <header className="app-heading">
      {eyebrow && <p className="torvik-kicker">{eyebrow}</p>}
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </header>
  );
}
export function LoadingState({ children }: { children: ReactNode }) {
  useTranslation();

  return (
    <div role="status" className="loading-state">
      <LoaderCircle size={24} className="loading-spinner" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

export function StatePage({
  title,
  eyebrow = "Torvik",
  children,
  actions,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  actions: ReactNode;
}) {
  useTranslation();

  return (
    <main className="app-state-screen">
      <section className="app-state-content">
        <Mascot decorative />
        <ScreenHeading title={title} eyebrow={eyebrow}>
          {children}
        </ScreenHeading>
        <div className="app-state-actions">{actions}</div>
      </section>
    </main>
  );
}
