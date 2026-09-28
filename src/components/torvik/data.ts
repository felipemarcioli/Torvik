import { EXERCISE_BY_ID, type ExerciseId } from "@/lib/exercises/catalog";
export { EXERCISES, type Exercise } from "@/lib/exercises/catalog";

// Presentation order only; cards reuse the complete catalog entries and their IDs.
const SECTIONS: { id: string; title: string; icon: string; exerciseIds: ExerciseId[] }[] = [
  {
    id: "upper",
    title: "Treino Superior",
    icon: "💪",
    exerciseIds: [
      "pushup",
      "bicepscurl",
      "tricepskickback",
      "lateralraise",
      "shoulderpress",
      "frontraise",
      "bentoverrow",
    ],
  },
  {
    id: "legs",
    title: "Treino de Pernas",
    icon: "🦵",
    exerciseIds: ["squat", "lunge", "reverselunge", "glutebridge", "calfraise"],
  },
  { id: "core", title: "Core", icon: "🔥", exerciseIds: ["situp", "plank"] },
  { id: "cardio", title: "Cardio", icon: "⚡", exerciseIds: ["jumpingjack", "mountainclimber"] },
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
