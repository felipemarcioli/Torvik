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
  useEffect(() => setInteractive(true), []);
  return (
    <main className="hero-glow min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex items-center justify-between gap-3">
          <p className="font-display text-xl font-extrabold tracking-wide text-primary">TORVIK</p>
          <button
            type="button"
            className="torvik-secondary"
            disabled={!interactive}
            onClick={onHistory}
          >
            Meu histórico
          </button>
        </header>
        <section className="mt-5 grid grid-cols-[minmax(0,1fr)_100px] items-center gap-3 sm:grid-cols-[minmax(0,1fr)_180px] md:grid-cols-[minmax(0,1fr)_220px]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Seu treino, com atenção ao movimento
            </p>
            <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-5xl">
              Cada repetição conta.
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              Escolha um exercício. O Torvik acompanha seu movimento pela câmera e ajuda a revisar a
              execução.
            </p>
          </div>
          <img
            src="/torvik-image-3d-360.webp"
            srcSet="/torvik-image-3d-180.webp 180w, /torvik-image-3d-360.webp 360w"
            sizes="(min-width: 768px) 220px, (min-width: 640px) 180px, 100px"
            width="360"
            height="540"
            alt="Torvik, o canguru assistente de treino"
            className="h-auto w-full drop-shadow-xl"
          />
        </section>
        <section className="mt-6" aria-labelledby="exercise-heading">
          <h2 id="exercise-heading" className="text-xl font-bold sm:text-2xl">
            Escolha o exercício
          </h2>
          <fieldset disabled={!interactive} className="mt-4 grid gap-3 md:grid-cols-3">
            <legend className="sr-only">Exercício para o próximo treino</legend>
            {EXERCISES.map((ex) => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                active={selected === ex.id}
                onSelect={() => onSelect(ex.id)}
              />
            ))}
          </fieldset>
          <button
            type="button"
            className="torvik-primary mt-5 w-full py-4 sm:w-auto"
            disabled={!interactive}
            onClick={onStart}
          >
            Preparar câmera
          </button>
        </section>
        <section className="mt-8 rounded-2xl border border-border bg-card/70 p-4">
          <h2 className="font-bold">Antes de começar</h2>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            {CAMERA_TIPS.map((tip) => (
              <li key={tip} className="flex gap-2">
                <span aria-hidden="true" className="text-accent">
                  •
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </section>
        <footer className="mt-6 max-w-3xl text-xs leading-relaxed text-muted-foreground">
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
}: {
  exercise: Exercise;
  active: boolean;
  onSelect: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`rounded-2xl border p-4 transition ${active ? "border-primary bg-primary/10" : "border-border bg-card"}`}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="radio"
          name="exercise"
          value={exercise.id}
          checked={active}
          onChange={onSelect}
          className="mt-1 size-5 shrink-0 accent-primary"
        />
        <span className="min-w-0">
          <span className="block text-lg font-bold">
            <span aria-hidden="true">{exercise.emoji} </span>
            {exercise.name}
          </span>
          <span className="mt-1 block text-xs font-semibold text-accent">{exercise.badge}</span>
        </span>
      </label>
      <p className="mt-3 text-sm text-muted-foreground">{exercise.summary}</p>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`instructions-${exercise.id}`}
        className="mt-2 min-h-11 text-sm font-semibold text-primary"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Ocultar instruções" : "Ver instruções"}
      </button>
      <ul
        id={`instructions-${exercise.id}`}
        hidden={!open}
        className="mt-2 space-y-2 text-sm text-muted-foreground"
      >
        {exercise.instructions.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
