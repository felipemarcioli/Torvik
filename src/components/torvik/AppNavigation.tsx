import { Dumbbell, ChartNoAxesCombined, Settings, ArrowLeft } from "lucide-react";
export type MainTab = "home" | "history" | "settings";
export function AppNavigation({
  active,
  onChange,
}: {
  active: MainTab;
  onChange: (tab: MainTab) => void;
}) {
  return (
    <nav className="app-bottom-nav" aria-label="Navegação principal">
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
