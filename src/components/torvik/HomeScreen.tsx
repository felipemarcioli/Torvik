import { Search, ChevronRight } from "lucide-react";
import { EXERCISES, EXERCISE_SECTIONS, type Exercise } from "./data";
import { WorkoutGroupCard } from "./WorkoutGroupCard";
import { BackButton } from "./AppNavigation";
import type { ExerciseId } from "@/lib/biomech";
export function ExerciseRow({
  exercise,
  selected,
  onOpen,
}: {
  exercise: Exercise;
  selected?: ExerciseId | undefined;
  onOpen: (id: ExerciseId) => void;
}) {
  return (
    <button
      type="button"
      className="exercise-row torvik-panel"
      data-selected={selected === exercise.id}
      aria-current={selected === exercise.id ? "true" : undefined}
      onClick={() => onOpen(exercise.id)}
    >
      <span aria-hidden="true" className="exercise-row-emoji">
        {exercise.emoji}
      </span>
      <span>
        <strong>{exercise.name}</strong>
        {selected === exercise.id && <small className="text-primary">Selecionado</small>}
        {exercise.equipment && (
          <small>
            {exercise.equipment.length ? exercise.equipment.join(" · ") : "Sem equipamento"}
          </small>
        )}
      </span>
      <ChevronRight size={21} aria-hidden="true" />
      <span className="sr-only">Ver detalhes</span>
    </button>
  );
}
export function HomeScreen({
  search,
  onSearch,
  selected,
  onOpen,
  onCategory,
  category,
  onBack,
}: {
  search: string;
  onSearch: (value: string) => void;
  selected?: ExerciseId | undefined;
  onOpen: (id: ExerciseId) => void;
  onCategory: (id: string) => void;
  category?: string | undefined;
  onBack: () => void;
}) {
  const section = EXERCISE_SECTIONS.find((item) => item.id === category);
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
  const results = EXERCISES.filter((item) =>
    normalize(item.name).includes(normalize(search.trim())),
  );
  return (
    <main className="train-screen hero-glow">
      <div className="app-content">
        {section ? (
          <>
            <BackButton onClick={onBack}>Voltar às categorias</BackButton>
            <header className="app-heading">
              <p className="torvik-kicker">Escolha seu exercício</p>
              <h1>{section.title}</h1>
              <p>{section.exercises.length} exercícios</p>
            </header>
            <div className="exercise-list">
              {section.exercises.map((exercise) => (
                <ExerciseRow
                  key={exercise.id}
                  exercise={exercise}
                  selected={selected}
                  onOpen={onOpen}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <header className="app-heading">
              <p className="torvik-kicker">TORVIK</p>
              <h1>Vamos treinar?</h1>
            </header>
            <section className="train-welcome torvik-panel">
              <img
                src="/torvik-image-3d-180.webp"
                width="180"
                height="270"
                alt="Torvik, seu canguru assistente de treino"
              />
              <p>Oi! Escolha um exercício e eu acompanho seu movimento.</p>
            </section>
            <label className="exercise-search">
              <Search size={20} aria-hidden="true" />
              <span className="sr-only">Buscar exercício por nome</span>
              <input
                type="search"
                value={search}
                onChange={(event) => onSearch(event.target.value)}
                placeholder="Buscar exercício"
              />
            </label>
            {search.trim() ? (
              <section aria-label="Resultados da busca">
                <p role="status" className="mb-3 text-sm text-muted-foreground">
                  {results.length} exercícios encontrados
                </p>
                <div className="exercise-list">
                  {results.map((exercise) => (
                    <ExerciseRow
                      key={exercise.id}
                      exercise={exercise}
                      selected={selected}
                      onOpen={onOpen}
                    />
                  ))}
                </div>
              </section>
            ) : (
              <section aria-labelledby="categories-title">
                <h2 id="categories-title" className="mb-3 text-lg font-bold">
                  Escolha uma categoria
                </h2>
                <div className="workout-groups">
                  {EXERCISE_SECTIONS.map((item) => (
                    <WorkoutGroupCard
                      key={item.id}
                      id={item.id}
                      title={item.title}
                      count={item.exercises.length}
                      onOpen={() => onCategory(item.id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
