import { useState } from "react";
import mascot from "@/assets/torvik-mascot.png.asset.json";
import { EXERCISES, CAMERA_TIPS, type Exercise } from "./data";
import type { ExerciseId } from "@/lib/biomech";

type Props = {
  selected: ExerciseId;
  onSelect: (id: ExerciseId) => void;
  onStart: () => void;
};

export function HomeScreen({ selected, onSelect, onStart }: Props) {
  return (
    <div className="hero-glow min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-5 sm:pt-10">
        <section className="grid items-center gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary sm:text-sm sm:tracking-[0.3em]">
              Análise biomecânica em tempo real
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-[1.1] sm:text-5xl md:text-6xl md:leading-[1.05]">
              Treine com o <span className="text-primary">Torvik</span> vendo cada repetição.
            </h1>
            <p className="mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
              Tudo roda direto no seu navegador, pela webcam. Nada é enviado para servidores e não
              precisa de cadastro.
            </p>

            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
              {CAMERA_TIPS.map((tip) => (
                <li
                  key={tip}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card/70 px-3.5 py-2.5 text-[13px] text-muted-foreground sm:px-4 sm:py-3 sm:text-sm"
                >
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />
                  <span className="min-w-0">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="order-first flex flex-col items-center gap-3 md:order-none md:gap-0">
            <div className="relative w-full max-w-sm rounded-2xl border border-primary/40 bg-card px-4 py-3 text-sm shadow-[var(--shadow-glow)] sm:px-5 sm:py-4 md:max-w-xs md:self-end">
              <span className="absolute -bottom-2 left-10 size-4 rotate-45 border-b border-r border-primary/40 bg-card" />
              Olá, me chamo <strong className="text-primary">Torvik</strong>, sou seu assistente de
              treino em tempo real. Escolhe o exercício que eu conto e corrijo cada repetição com
              você!
            </div>
            <img
              src="/torvik-image-3d.png"
              alt="Torvik, o canguru mascote do app, em pose shaka"
              className="w-[180px] drop-shadow-2xl sm:w-[240px] md:mt-6 md:w-[340px]"
            />
          </div>
        </section>

        <section className="mt-10 sm:mt-14">
          <h2 className="text-xl font-bold sm:text-2xl">Escolha o exercício</h2>
          <div className="mt-4 grid gap-3 sm:mt-5 sm:gap-4 md:grid-cols-3">
            {EXERCISES.map((ex) => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                active={selected === ex.id}
                onClick={() => onSelect(ex.id)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={onStart}
            className="mt-7 w-full rounded-2xl bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:brightness-110 sm:py-5 sm:text-lg md:mt-8 md:w-auto"
          >
            Iniciar Treino
          </button>
        </section>
      </div>
    </div>
  );
}

function ExerciseCard({
  exercise,
  active,
  onClick,
}: {
  exercise: Exercise;
  active: boolean;
  onClick: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={active}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`cursor-pointer rounded-2xl border p-4 text-left transition sm:p-5 ${
        active
          ? "border-primary bg-primary/10 shadow-[var(--shadow-glow)]"
          : "border-border bg-card hover:border-accent/60"
      }`}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="shrink-0 text-2xl sm:text-3xl">{exercise.emoji}</span>
          <h3 className="truncate text-lg font-bold sm:text-xl">{exercise.name}</h3>
        </div>
        <span className="shrink-0 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
          {exercise.badge}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{exercise.summary}</p>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        className="mt-3 text-sm font-semibold text-primary md:hidden"
      >
        {open ? "Ocultar instruções" : "Ver instruções"}
      </button>

      <ul
        className={`mt-3 space-y-2 text-sm text-muted-foreground md:mt-4 md:block ${
          open ? "block" : "hidden"
        }`}
      >
        {exercise.instructions.map((i) => (
          <li key={i} className="flex gap-2">
            <span className="text-primary">›</span>
            <span className="min-w-0">{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
