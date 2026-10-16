import { useTranslation } from "react-i18next";
import { translate as t } from "@/lib/i18n";
import { Dumbbell, ChartNoAxesCombined, Settings, ArrowLeft } from "lucide-react";
import { Brand } from "./TorvikUI";
export type MainTab = "home" | "history" | "settings";
export function AppNavigation({
  active,
  onChange,
  placement = "mobile",
}: {
  active: MainTab;
  onChange: (tab: MainTab) => void;
  placement?: "mobile" | "desktop";
}) {
  useTranslation();

  return (
    <nav
      className={placement === "mobile" ? "app-bottom-nav" : "app-header-nav"}
      aria-label={t("Navegação principal")}
    >
      {(
        [
          ["home", t("Treinar"), Dumbbell],
          ["history", t("Progresso"), ChartNoAxesCombined],
          ["settings", t("Ajustes"), Settings],
        ] as const
      ).map(([tab, name, Icon]) => (
        <button
          key={tab}
          type="button"
          aria-current={active === tab ? "page" : undefined}
          onClick={() => onChange(tab)}
        >
          <Icon size={23} aria-hidden="true" />
          <span>{name}</span>
        </button>
      ))}
    </nav>
  );
}
export function AppHeader({
  active,
  onChange,
}: {
  active: MainTab;
  onChange: (tab: MainTab) => void;
}) {
  useTranslation();

  return (
    <header className="app-desktop-header">
      <div className="app-desktop-header-content">
        <button
          type="button"
          className="app-brand font-display"
          onClick={() => onChange("home")}
          aria-label={`Torvik · ${t("Treinar")}`}
        >
          <Brand />
        </button>
        <AppNavigation active={active} onChange={onChange} placement="desktop" />
      </div>
    </header>
  );
}
export function BackButton({
  onClick,
  children = t("Voltar"),
}: {
  onClick: () => void;
  children?: React.ReactNode;
}) {
  useTranslation();

  return (
    <button type="button" className="app-back" onClick={onClick}>
      <ArrowLeft className="directional-icon" size={20} aria-hidden="true" />
      {children}
    </button>
  );
}
