import { useTranslation } from "react-i18next";
import { translate as t, currentLanguage, formatList } from "@/lib/i18n";
import { useEffect, useState, type MutableRefObject } from "react";
import { Search, ChevronRight, ArrowRight, ScanLine, ShieldCheck } from "lucide-react";
import { Brand, Mascot } from "./TorvikUI";
import { ExercisePreview } from "./ExercisePreview";
import { EXERCISE_BY_ID } from "@/lib/exercises/catalog";
import { WorkoutGroupCard } from "./WorkoutGroupCard";
import { EXERCISES, EXERCISE_SECTIONS, CAMERA_TIPS, type Exercise } from "./data";
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
  useTranslation();

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
        <strong>{t(exercise.name)}</strong>
        {selected === exercise.id && <small className="text-primary">{t("Selecionado")}</small>}
        {exercise.equipment && (
          <small>
            {exercise.equipment.length
              ? exercise.equipment.map((item) => t(item)).join(" · ")
              : t("Sem equipamento")}
          </small>
        )}
      </span>
      <ChevronRight className="directional-icon" size={21} aria-hidden="true" />
      <span className="sr-only">{t("Ver detalhes")}</span>
    </button>
  );
}
type Props = {
  selected?: ExerciseId | undefined;
  onSelect: (id: ExerciseId) => void;
  onStart: () => void;
  onHistory: () => void;
  category?: string | undefined;
  onCategory: (id: string) => void;
  onBack: () => void;
  onDetails: (id: ExerciseId) => void;
  search: string;
  onSearch: (value: string) => void;
  categoryPositions: MutableRefObject<Record<string, number>>;
};
export function HomeScreen({
  selected,
  onSelect,
  onStart,
  onHistory,
  category,
  onCategory,
  onBack,
  onDetails,
  search,
  onSearch,
  categoryPositions,
}: Props) {
  useTranslation();

  const currentExercise = selected ? EXERCISE_BY_ID[selected] : undefined;
  const [interactive, setInteractive] = useState(false);
  const openGroup = category ?? null;
  const [openPreview, setOpenPreview] = useState<ExerciseId | null>(selected ?? null);
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase(currentLanguage());
  const results = EXERCISES.filter((item) =>
    normalize(t(item.name)).includes(normalize(search.trim())),
  );
  useEffect(() => setInteractive(true), []);
  useEffect(() => {
    if (!openGroup) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, [openGroup]);
  const togglePreview = (id: ExerciseId) => {
    onSelect(id);
    setOpenPreview((current) => (current === id ? null : id));
  };
  return (
    <main className="home-screen">
      <div className="home-content">
        <header className="home-header">
          <Brand />
          <button
            type="button"
            className="home-history-link"
            disabled={!interactive}
            onClick={onHistory}
          >
            {t("Meu histórico")}
            <ArrowRight className="directional-icon" size={17} aria-hidden="true" />
          </button>
        </header>
        <section className="home-welcome" aria-labelledby="welcome-title">
          <div className="welcome-copy">
            <p className="welcome-label">
              <ScanLine size={16} aria-hidden="true" /> {t("Seu assistente de treino")}
            </p>
            <h1 id="welcome-title">
              {t("Vamos nos")}
              <br />
              {t("movimentar")}
              <span>?</span>
            </h1>
            <p>
              {t("Você faz o movimento.")}
              <br />
              {t("O Torvik acompanha com você.")}
            </p>
            <span className="welcome-privacy">
              <ShieldCheck size={15} aria-hidden="true" /> {t("Câmera local. Sem gravação.")}
            </span>
          </div>
          <Mascot className="welcome-mascot" />
        </section>
        <section className="home-exercises" aria-labelledby="exercise-heading">
          <div className="flex items-end justify-between gap-4">
            <h2 id="exercise-heading" className="text-xl font-bold leading-tight">
              {t("Escolha o exercício")}
            </h2>
            <span className="catalog-count">
              {t("{{value0}} exercícios", { value0: EXERCISES.length })}
            </span>
          </div>
          <label className="exercise-search mt-3">
            <Search size={20} aria-hidden="true" />
            <span className="sr-only">{t("Buscar exercício por nome")}</span>
            <input
              type="search"
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              placeholder={t("Qual exercício você procura?")}
            />
          </label>
          {search.trim() && (
            <section aria-label={t("Resultados da busca")}>
              <p role="status" className="mb-3 text-sm text-muted-foreground">
                {t(
                  results.length === 1
                    ? "{{value0}} exercício encontrado"
                    : "{{value0}} exercícios encontrados",
                  { value0: results.length },
                )}
              </p>
              {!results.length && (
                <div className="search-empty">
                  <Mascot decorative />
                  <h3>{t("Vamos tentar outro nome?")}</h3>
                  <p>{t("Busque por um movimento, como agachamento ou flexão.")}</p>
                  <button type="button" className="torvik-secondary" onClick={() => onSearch("")}>
                    {t("Limpar busca")}
                  </button>
                </div>
              )}
              <div className="exercise-list">
                {results.map((exercise) => (
                  <ExerciseRow
                    key={exercise.id}
                    exercise={exercise}
                    selected={selected}
                    onOpen={onDetails}
                  />
                ))}
              </div>
            </section>
          )}
          <fieldset
            hidden={!!search.trim()}
            disabled={!interactive}
            className="workout-groups mt-3 sm:mt-5"
          >
            <legend className="sr-only">{t("Exercício para o próximo treino")}</legend>
            {EXERCISE_SECTIONS.map((section) => (
              <WorkoutGroupCard
                key={section.id}
                id={section.id}
                title={section.title}
                count={section.exercises.length}
                expanded={openGroup === section.id}
                onOpen={() => onCategory(section.id)}
                onClose={onBack}
                onStart={onStart}
                canStart={!!selected}
                scrollPosition={categoryPositions.current[section.id] ?? 0}
                onScroll={(position) => {
                  categoryPositions.current[section.id] = position;
                }}
              >
                {section.exercises.map((ex) => (
                  <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    active={selected === ex.id}
                    onDetails={() => onDetails(ex.id)}
                    onSelect={() => onSelect(ex.id)}
                    previewOpen={openPreview === ex.id}
                    previewVisible={openGroup === section.id}
                    onPreviewToggle={() => togglePreview(ex.id)}
                  />
                ))}
              </WorkoutGroupCard>
            ))}
          </fieldset>
        </section>
        <section className="home-preparation" aria-labelledby="preparation-heading">
          <h2 id="preparation-heading" className="torvik-kicker">
            {t("Preparação")}
          </h2>
          <div className="home-preparation-grid">
            <section
              className="current-exercise torvik-panel"
              aria-labelledby="current-exercise-heading"
            >
              <h3 id="current-exercise-heading" className="text-base font-bold">
                {t("Seu próximo exercício")}
              </h3>
              {currentExercise ? (
                <div className="current-exercise-content">
                  <div
                    className="current-exercise-preview"
                    role="img"
                    aria-label={t(currentExercise.previewAlt)}
                  >
                    <ExercisePreview exercise={currentExercise} animated={!openGroup} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold">
                      <span aria-hidden="true">{currentExercise.emoji} </span>
                      {t(currentExercise.name)}
                    </p>
                    <p className="mt-1 text-sm text-accent">{t(currentExercise.badge)}</p>
                    {currentExercise.previewAvailable === false && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t("Demonstração animada indisponível.")}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  {t("Escolha uma categoria acima para encontrar seu exercício.")}
                </p>
              )}
              <div aria-hidden={!!openGroup} inert={!!openGroup} className="home-action">
                <button
                  type="button"
                  className="torvik-primary w-full"
                  disabled={!interactive || !selected}
                  onClick={onStart}
                >
                  {t("Preparar câmera")}
                  <ArrowRight className="directional-icon" size={18} aria-hidden="true" />
                </button>
              </div>
            </section>
            <section
              className="preparation-guidance torvik-panel"
              aria-labelledby="camera-tips-heading"
            >
              <h3 id="camera-tips-heading" className="text-base font-bold">
                {t("Antes de começar")}
              </h3>
              <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
                {CAMERA_TIPS.map((tip) => (
                  <li key={t(tip)} className="flex gap-2">
                    <span aria-hidden="true" className="font-bold text-accent">
                      •
                    </span>
                    {t(tip)}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </section>
        <footer className="home-footer">
          <p>
            {t(
              "Seu vídeo não é gravado. Salve o resumo ao terminar para acompanhar seus treinos neste dispositivo.",
            )}
          </p>
          <p>
            {t(
              "O feedback é uma estimativa do movimento. Respeite seus limites e procure orientação profissional quando precisar.",
            )}
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
  onDetails,
  previewOpen,
  onPreviewToggle,
  previewVisible,
}: {
  exercise: Exercise;
  active: boolean;
  onSelect: () => void;
  onDetails: () => void;
  previewOpen: boolean;
  previewVisible: boolean;
  onPreviewToggle: () => void;
}) {
  useTranslation();

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
            {t(exercise.name)}
          </span>
          <span className="mt-0.5 block text-xs font-semibold text-accent">
            {t(exercise.badge)}
          </span>
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
            {t(exercise.name)}
          </span>
          <span className="mt-0.5 block text-[0.6875rem] font-semibold text-accent">
            {t(exercise.badge)}
          </span>
        </span>
        <span className="exercise-preview-chevron" aria-hidden="true">
          <svg viewBox="0 0 20 20" className="size-4" fill="none">
            <path d="m6 8 4 4 4-4" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </span>
      </label>
      <p className="exercise-summary mt-2 text-sm text-muted-foreground sm:mt-3">
        {t(exercise.summary)}
      </p>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`instructions-${exercise.id}`}
        className="exercise-instructions-button mt-1 min-h-11 rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="sm:hidden">{open ? t("Fechar") : t("Instruções")}</span>
        <span className="hidden sm:inline">
          {open ? t("Ocultar instruções") : t("Ver instruções")}
        </span>
      </button>
      <ul
        id={`instructions-${exercise.id}`}
        hidden={!open}
        className="mt-2 space-y-2 border-t border-border pt-3 text-sm text-muted-foreground"
      >
        {exercise.equipment && (
          <li>
            {t("Equipamentos: {{value0}}.", {
              value0: exercise.equipment.length
                ? formatList(exercise.equipment.map((item) => t(item)))
                : t("nenhum"),
            })}
          </li>
        )}
        {exercise.instructions.map((i) => (
          <li key={t(i)}>{t(i)}</li>
        ))}
        {exercise.analysisLimitations && (
          <li className="text-xs">{t(exercise.analysisLimitations)}</li>
        )}
      </ul>
      <button
        type="button"
        className="exercise-details-button torvik-secondary"
        onClick={onDetails}
      >
        <span className="sr-only">
          {t("Ver detalhes de {{value0}}", {
            value0: t(exercise.name).toLocaleLowerCase(currentLanguage()),
          })}
        </span>
        <span aria-hidden="true">{t("Instruções e demonstração")}</span>
        <ArrowRight className="directional-icon" size={16} aria-hidden="true" />
      </button>
      <div
        id={previewId}
        className="mobile-exercise-preview hidden"
        data-open={previewOpen}
        aria-hidden={!previewOpen}
      >
        <div className="mobile-exercise-preview-clip">
          <div className="mobile-exercise-preview-content">
            <div className="exercise-sprite-window" role="img" aria-label={t(exercise.previewAlt)}>
              <ExercisePreview exercise={exercise} animated={previewOpen && previewVisible} />
            </div>
            <p>
              {t(exercise.previewInstruction)}
              {exercise.previewAvailable === false && (
                <small className="block mt-2 text-muted-foreground">
                  {t("Demonstração animada indisponível.")}
                </small>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
