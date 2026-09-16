import type { ExerciseId } from "@/lib/biomech";

export type Exercise = {
  id: ExerciseId;
  name: string;
  badge: string;
  emoji: string;
  summary: string;
  instructions: string[];
};

export const EXERCISES: Exercise[] = [
  {
    id: "squat",
    name: "Agachamento",
    badge: "Pernas & Glúteos",
    emoji: "🦵",
    summary: "Joelho a 90°, tronco ereto e subida completa.",
    instructions: [
      "Fique de lado para a câmera, corpo inteiro visível",
      "Desça até o joelho atingir 90°",
      "Mantenha o peito aberto (inclinação até 40°)",
    ],
  },
  {
    id: "pushup",
    name: "Flexão de Braço",
    badge: "Peito & Tríceps",
    emoji: "💪",
    summary: "Cotovelos a 90° e quadril alinhado com o corpo.",
    instructions: [
      "Posicione a câmera lateralmente, no nível do chão",
      "Desça até os cotovelos formarem 90°",
      "Evite quadril alto ou caído (desvio até 25°)",
    ],
  },
  {
    id: "jumpingjack",
    name: "Polichinelo",
    badge: "Cardio",
    emoji: "⚡",
    summary: "Braços acima da cabeça e pernas bem abertas.",
    instructions: [
      "Fique de frente, com espaço livre nas laterais",
      "Leve os pulsos acima da cabeça",
      "Abra os pés além da largura dos ombros",
    ],
  },
];

export const CAMERA_TIPS = [
  "Deixe o corpo inteiro dentro do quadro",
  "Use um ambiente bem iluminado, luz de frente",
  "Afaste-se cerca de 2 a 3 metros da câmera",
  "Prefira um fundo limpo, sem outras pessoas",
];
