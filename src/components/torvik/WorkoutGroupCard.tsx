import { useLayoutEffect, useRef, type ReactNode } from "react";
import { ArrowLeft, Dumbbell, Footprints, Flame, Zap } from "lucide-react";

const ICONS = { upper: Dumbbell, legs: Footprints, core: Flame, cardio: Zap };
type Props = {
  id: string;
  title: string;
  count: number;
  expanded: boolean;
  onOpen: () => void;
  onClose: () => void;
  onStart: () => void;
  children: ReactNode;
};

export function WorkoutGroupCard({
  id,
  title,
  count,
  expanded,
  onOpen,
  onClose,
  onStart,
  children,
}: Props) {
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDialogElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const Icon = ICONS[id as keyof typeof ICONS] ?? Dumbbell;

  useLayoutEffect(() => {
    const dialog = panel.current;
    const card = trigger.current;
    if (!dialog || !card || (!expanded && !dialog.open)) return;
    // Measure before entering the top layer. Native dialog handles focus trapping
    // and makes the background inert without changing the exercise selection.
    const origin = card.getBoundingClientRect();
    if (expanded) {
      if (!dialog.open) dialog.showModal();
      if (content.current) content.current.scrollTop = 0;
      back.current?.focus({ preventScroll: true });
    }
    const destination = dialog.getBoundingClientRect();
    const collapsed = {
      transform: `translate(${origin.left - destination.left}px, ${origin.top - destination.top}px) scale(${origin.width / destination.width}, ${origin.height / destination.height})`,
      borderRadius: "20px",
      opacity: 0.8,
    };
    const full = { transform: "none", borderRadius: "24px", opacity: 1 };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof dialog.animate !== "function") {
      if (!expanded) dialog.close();
      return;
    }
    const animation = dialog.animate(expanded ? [collapsed, full] : [full, collapsed], {
      duration: 280,
      easing: "cubic-bezier(.22, .8, .25, 1)",
      fill: "both",
    });
    let cancelled = false;
    void animation.finished
      .then(() => {
        if (cancelled) return;
        if (!expanded) dialog.close();
        animation.cancel();
      })
      .catch(() => {
        /* Cancelled on navigation or a new transition. */
      });
    return () => {
      cancelled = true;
      animation.cancel();
    };
  }, [expanded]);

  return (
    <div className="workout-group">
      <button
        ref={trigger}
        type="button"
        id={`exercise-category-${id}`}
        className="workout-group-tile torvik-panel"
        aria-haspopup="dialog"
        aria-expanded={expanded}
        aria-controls={`workout-group-${id}`}
        onClick={onOpen}
      >
        <span className="workout-group-icon" aria-hidden="true">
          <Icon size={28} strokeWidth={1.8} />
        </span>
        <span className="workout-group-label">
          <span className="font-bold">{title}</span>
          <span className="text-xs text-muted-foreground">{count} exercícios</span>
        </span>
      </button>
      <dialog
        ref={panel}
        id={`workout-group-${id}`}
        className="workout-category-dialog"
        aria-labelledby={`workout-title-${id}`}
        aria-modal="true"
        inert={!expanded}
        onCancel={(event) => {
          event.preventDefault();
          onClose();
        }}
      >
        <header className="workout-category-header">
          <button
            ref={back}
            type="button"
            className="workout-category-back"
            onClick={onClose}
            aria-label="Voltar às categorias"
          >
            <ArrowLeft size={22} aria-hidden="true" />
          </button>
          <div className="workout-category-heading">
            <span className="workout-group-icon" aria-hidden="true">
              <Icon size={28} strokeWidth={1.8} />
            </span>
            <div>
              <h2 id={`workout-title-${id}`} className="workout-category-title">
                {title}
              </h2>
              <p className="text-sm text-muted-foreground">{count} exercícios</p>
            </div>
          </div>
        </header>
        <div ref={content} className="workout-category-scroll">
          <div className="workout-group-exercises">{children}</div>
        </div>
        <div className="workout-category-action">
          <button type="button" className="torvik-primary w-full" onClick={onStart}>
            Preparar câmera
          </button>
        </div>
      </dialog>
    </div>
  );
}
