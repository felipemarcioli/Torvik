import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

export function Brand() {
  return (
    <span className="torvik-brand">
      <img src="/torvik-image-logo.png" width="40" height="40" alt="" />
      <span>
        torvik<span className="brand-dot">.</span>
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
  return (
    <img
      src="/torvik-image-3d-360.webp"
      srcSet="/torvik-image-3d-180.webp 180w, /torvik-image-3d-360.webp 360w"
      sizes="(min-width: 768px) 200px, 120px"
      width="360"
      height="540"
      alt={decorative ? "" : "Torvik, seu canguru assistente de treino"}
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
  return (
    <header className="app-heading">
      {eyebrow && <p className="torvik-kicker">{eyebrow}</p>}
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </header>
  );
}
export function LoadingState({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="loading-state">
      <LoaderCircle size={24} className="loading-spinner" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
