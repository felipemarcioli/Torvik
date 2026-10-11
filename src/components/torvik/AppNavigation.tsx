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
  return (
    <nav
      className={placement === "mobile" ? "app-bottom-nav" : "app-header-nav"}
      aria-label="Navegação principal"
    >
      {(
        [
          ["home", "Treinar", Dumbbell],
          ["history", "Progresso", ChartNoAxesCombined],
          ["settings", "Ajustes", Settings],
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
  return (
    <header className="app-desktop-header">
      <div className="app-desktop-header-content">
        <button
          type="button"
          className="app-brand font-display"
          onClick={() => onChange("home")}
          aria-label="Torvik · Treinar"
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
  children = "Voltar",
}: {
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button type="button" className="app-back" onClick={onClick}>
      <ArrowLeft size={20} aria-hidden="true" />
      {children}
    </button>
  );
}
