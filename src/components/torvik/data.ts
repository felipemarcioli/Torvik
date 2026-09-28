import { EXERCISE_BY_ID, type ExerciseId } from "@/lib/exercises/catalog";
export { EXERCISES, type Exercise } from "@/lib/exercises/catalog";

// Presentation order only; cards reuse the complete catalog entries and their IDs.
const SECTIONS: { id: string; title: string; exerciseIds: ExerciseId[] }[] = [
  {
    id: "legs",
    title: "Pernas & Glúteos",
    exerciseIds: ["squat", "lunge", "reverselunge", "glutebridge", "calfraise"],
  },
  { id: "chest", title: "Peito & Tríceps", exerciseIds: ["pushup"] },
  { id: "biceps", title: "Bíceps", exerciseIds: ["bicepscurl"] },
  { id: "triceps", title: "Tríceps", exerciseIds: ["tricepskickback"] },
  {
    id: "shoulders",
    title: "Ombros",
    exerciseIds: ["lateralraise", "shoulderpress", "frontraise"],
  },
  { id: "back", title: "Costas", exerciseIds: ["bentoverrow"] },
  { id: "core", title: "Abdômen / Core", exerciseIds: ["situp", "plank"] },
  { id: "cardio", title: "Cardio", exerciseIds: ["jumpingjack", "mountainclimber"] },
];
export const EXERCISE_SECTIONS = SECTIONS.map(({ exerciseIds, ...section }) => ({
  ...section,
  exercises: exerciseIds.map((id) => EXERCISE_BY_ID[id]),
}));

export const CAMERA_TIPS = [
  "Deixe o corpo inteiro dentro do quadro",
  "Use um ambiente bem iluminado, luz de frente",
  "Afaste-se cerca de 2 a 3 metros da câmera",
  "Prefira um fundo limpo, sem outras pessoas",
];
