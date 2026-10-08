import { ChevronRight, Dumbbell, Footprints, Flame, Zap } from "lucide-react";
const ICONS = { upper: Dumbbell, legs: Footprints, core: Flame, cardio: Zap };
export function WorkoutGroupCard({
  id,
  title,
  count,
  onOpen,
}: {
  id: string;
  title: string;
  count: number;
  onOpen: () => void;
}) {
  const Icon = ICONS[id as keyof typeof ICONS] ?? Dumbbell;
  return (
    <div className="workout-group">
      <button type="button" className="workout-group-tile" onClick={onOpen}>
        <span className="workout-group-icon">
          <Icon size={28} aria-hidden="true" />
        </span>
        <span className="workout-group-label">
          {title}
          <small>{count} exercícios</small>
        </span>
        <ChevronRight size={20} aria-hidden="true" />
      </button>
    </div>
  );
}
