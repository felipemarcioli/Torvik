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
      <div className="mx-auto w-full max-w-6xl px-5 pb-20 pt-10">
        <section className="grid items-center gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              Análise biomecânica em tempo real
            </p>
            <h1 className="mt-4 text-5xl font-bold leading-[1.05] md:text-6xl">
              Treine com o <span className="text-primary">Torvik</span> vendo cada repetição.
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground">
              Tudo roda direto no seu navegador, pela webcam. Nada é enviado para servidores e não
              precisa de cadastro.
            </p>

            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {CAMERA_TIPS.map((tip) => (
                <li
                  key={tip}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card/70 px-4 py-3 text-sm text-muted-foreground"
                >
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-accent" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative flex items-end justify-center">
            <div className="absolute -top-2 right-2 max-w-xs rounded-2xl border border-primary/40 bg-card px-5 py-4 text-sm shadow-[var(--shadow-glow)] md:right-0">
              <span className="absolute -bottom-2 left-10 size-4 rotate-45 border-b border-r border-primary/40 bg-card" />
              Olá, me chamo <strong className="text-primary">Torvik</strong>, sou seu assistente de
              treino em tempo real. Escolhe o exercício que eu conto e corrijo cada repetição com
              você!
            </div>
            <img
              src={mascot.url}
              alt="Torvik, o canguru mascote do app, em pose shaka"
              className="mt-24 w-[280px] drop-shadow-2xl md:w-[340px]"
            />
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-bold">Escolha o exercício</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
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
            className="mt-8 w-full rounded-2xl bg-primary px-8 py-5 text-lg font-bold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:brightness-110 md:w-auto"
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
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl border p-5 text-left transition ${
        active
          ? "border-primary bg-primary/10 shadow-[var(--shadow-glow)]"
          : "border-border bg-card hover:border-accent/60"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-3xl">{exercise.emoji}</span>
        <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
          {exercise.badge}
        </span>
      </div>
      <h3 className="mt-4 text-xl font-bold">{exercise.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{exercise.summary}</p>
      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
        {exercise.instructions.map((i) => (
          <li key={i} className="flex gap-2">
            <span className="text-primary">›</span>
            {i}
          </li>
        ))}
      </ul>
    </button>
  );
}
