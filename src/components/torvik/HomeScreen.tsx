import { useEffect, useState } from "react";
import { EXERCISES, CAMERA_TIPS, type Exercise } from "./data";
import type { ExerciseId } from "@/lib/biomech";
type Props = {
  selected: ExerciseId;
  onSelect: (id: ExerciseId) => void;
  onStart: () => void;
  onHistory: () => void;
};
export function HomeScreen({ selected, onSelect, onStart, onHistory }: Props) {
  const [interactive, setInteractive] = useState(false);
  const [openPreview, setOpenPreview] = useState<ExerciseId | null>(null);
  useEffect(() => setInteractive(true), []);
  const togglePreview = (id: ExerciseId) => {
    onSelect(id);
    setOpenPreview((current) => (current === id ? null : id));
  };
  return (
    <main className="home-screen hero-glow min-h-screen">
      <div className="home-content mx-auto max-w-6xl px-4 pt-4 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-8 sm:pb-12">
        <header className="home-header flex items-center justify-between gap-3 border-b border-border/70 pb-4">
          <p className="font-display text-xl font-extrabold tracking-[0.12em] text-primary">
            TORVIK
          </p>
          <button
            type="button"
            className="torvik-secondary text-sm"
            disabled={!interactive}
            onClick={onHistory}
          >
            Meu histórico
          </button>
        </header>
        <section className="home-mobile-welcome hidden" aria-labelledby="mobile-welcome-title">
          <h1 id="mobile-welcome-title" className="sr-only">
            Treine com o Torvik
          </h1>
          <img
            src="/torvik-image-3d-360.webp"
            srcSet="/torvik-image-3d-180.webp 180w, /torvik-image-3d-360.webp 360w"
            sizes="132px"
            width="360"
            height="540"
            alt="Torvik, o canguru assistente de treino"
            className="home-mobile-mascot"
          />
          <div className="home-speech-bubble">
            <p>
              Olá, me chamo <strong>Torvik</strong>, sou seu assistente de treino em tempo real.
              Escolhe o exercício que eu conto e corrijo cada repetição com você!
            </p>
          </div>
        </section>
        <section className="home-hero mt-5 hidden items-center gap-3 sm:mt-8 sm:grid sm:grid-cols-[minmax(0,1fr)_150px] md:grid-cols-[minmax(0,1fr)_190px]">
          <div>
            <p className="torvik-kicker">Seu treino, com atenção ao movimento</p>
            <h1 className="mt-2 max-w-lg text-[clamp(1.8rem,7vw,3rem)] font-bold leading-[1.08]">
              Cada repetição conta.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Escolha um exercício. O Torvik acompanha seu movimento pela câmera e ajuda a revisar a
              execução.
            </p>
          </div>
          <img
            src="/torvik-image-3d-360.webp"
            srcSet="/torvik-image-3d-180.webp 180w, /torvik-image-3d-360.webp 360w"
            sizes="(min-width: 768px) 190px, (min-width: 640px) 150px, 76px"
            width="360"
            height="540"
            alt="Torvik, o canguru assistente de treino"
            className="h-auto w-full drop-shadow-lg"
          />
        </section>
        <section className="home-exercises mt-6 sm:mt-8" aria-labelledby="exercise-heading">
          <div className="flex items-end justify-between gap-4">
            <h2 id="exercise-heading" className="text-2xl font-bold leading-tight sm:text-3xl">
              Escolha o exercício
            </h2>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {EXERCISES.length} opções
            </span>
          </div>
          <fieldset
            disabled={!interactive}
            className="mt-3 grid gap-2 sm:mt-5 sm:gap-4 md:grid-cols-3"
          >
            <legend className="sr-only">Exercício para o próximo treino</legend>
            {EXERCISES.map((ex) => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                active={selected === ex.id}
                onSelect={() => onSelect(ex.id)}
                previewOpen={openPreview === ex.id}
                onPreviewToggle={() => togglePreview(ex.id)}
              />
            ))}
          </fieldset>
        </section>
        <div className="home-action fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-18px_40px_-24px_#000] backdrop-blur-lg sm:static sm:mt-6 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none">
          <div className="mx-auto max-w-6xl">
            <button
              type="button"
              className="torvik-primary w-full sm:w-auto sm:min-w-56"
              disabled={!interactive}
              onClick={onStart}
            >
              Preparar câmera
            </button>
          </div>
        </div>
        <section className="home-tips torvik-panel mt-8 p-5 sm:mt-10 sm:p-6">
          <p className="torvik-kicker">Preparação</p>
          <h2 className="mt-1 text-xl font-bold">Antes de começar</h2>
          <ul className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            {CAMERA_TIPS.map((tip) => (
              <li key={tip} className="flex gap-2">
                <span aria-hidden="true" className="font-bold text-accent">
                  •
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </section>
        <footer className="mt-6 max-w-3xl border-t border-border/70 pt-5 text-xs leading-relaxed text-muted-foreground">
          <p>
            O vídeo é analisado neste dispositivo e não é gravado pelo Torvik. O navegador baixa o
            modelo e as fontes pela internet. A hospedagem e o editor podem registrar diagnósticos
            técnicos, sem imagens da câmera.
          </p>
          <p className="mt-2">
            As orientações são estimativas baseadas em regras automáticas, sem validação clínica.
            Adapte o exercício às suas condições e procure orientação profissional quando
            necessário.
          </p>
        </footer>
      </div>
    </main>
  );
}
function ExerciseCard({
  exercise,
  active,
  onSelect,
  previewOpen,
  onPreviewToggle,
}: {
  exercise: Exercise;
  active: boolean;
  onSelect: () => void;
  previewOpen: boolean;
  onPreviewToggle: () => void;
}) {
  const [open, setOpen] = useState(false);
  const previewId = `exercise-preview-${exercise.id}`;
  return (
    <div
      className="exercise-card torvik-panel p-4 sm:p-5"
      data-selected={active}
      data-preview-open={previewOpen}
    >
      <label className="desktop-exercise-select flex cursor-pointer items-start gap-3">
        <input
          type="radio"
          name="exercise"
          value={exercise.id}
          checked={active}
          onChange={onSelect}
          className="mt-1 size-5 shrink-0 accent-primary"
        />
        <span className="min-w-0">
          <span className="block text-base font-bold sm:text-lg">
            <span aria-hidden="true">{exercise.emoji} </span>
            {exercise.name}
          </span>
          <span className="mt-0.5 block text-xs font-semibold text-accent">{exercise.badge}</span>
        </span>
      </label>
      <label
        className="mobile-exercise-select hidden cursor-pointer items-center gap-3"
        onClick={(event) => {
          if (event.target instanceof HTMLInputElement) return;
          event.preventDefault();
          onPreviewToggle();
        }}
      >
        <input
          type="radio"
          name="mobile-exercise"
          value={exercise.id}
          checked={active}
          aria-expanded={previewOpen}
          aria-controls={previewId}
          onChange={onPreviewToggle}
          onKeyDown={(event) => {
            if (event.key === " " && active) {
              event.preventDefault();
              onPreviewToggle();
            }
          }}
          className="size-5 shrink-0 accent-primary"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-[0.9375rem] font-bold leading-tight">
            <span aria-hidden="true">{exercise.emoji} </span>
            {exercise.name}
          </span>
          <span className="mt-0.5 block text-[0.6875rem] font-semibold text-accent">
            {exercise.badge}
          </span>
        </span>
        <span className="exercise-preview-chevron" aria-hidden="true">
          <svg viewBox="0 0 20 20" className="size-4" fill="none">
            <path d="m6 8 4 4 4-4" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </span>
      </label>
      <p className="exercise-summary mt-2 text-sm text-muted-foreground sm:mt-3">
        {exercise.summary}
      </p>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`instructions-${exercise.id}`}
        className="exercise-instructions-button mt-1 min-h-11 rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="sm:hidden">{open ? "Fechar" : "Instruções"}</span>
        <span className="hidden sm:inline">{open ? "Ocultar instruções" : "Ver instruções"}</span>
      </button>
      <ul
        id={`instructions-${exercise.id}`}
        hidden={!open}
        className="mt-2 space-y-2 border-t border-border pt-3 text-sm text-muted-foreground"
      >
        {exercise.instructions.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
      <div
        id={previewId}
        className="mobile-exercise-preview hidden"
        data-open={previewOpen}
        aria-hidden={!previewOpen}
      >
        <div className="mobile-exercise-preview-clip">
          <div className="mobile-exercise-preview-content">
            <div className="exercise-sprite-window" role="img" aria-label={exercise.previewAlt}>
              <picture>
                <source
                  media="(prefers-reduced-motion: reduce)"
                  srcSet={
                    exercise.previewAvailable === false
                      ? "/torvik-image-3d-180.webp"
                      : exercise.previewStill
                  }
                />
                <img
                  src={
                    exercise.previewAvailable === false
                      ? "/torvik-image-3d-180.webp"
                      : previewOpen
                        ? exercise.previewAnimation
                        : exercise.previewStill
                  }
                  width="256"
                  height="256"
                  alt=""
                  aria-hidden="true"
                  className="exercise-preview-animation"
                />
              </picture>
            </div>
            <p>
              {exercise.previewInstruction}
              {exercise.previewAvailable === false && (
                <small className="block mt-2 text-muted-foreground">
                  Demonstração animada indisponível.
                </small>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
