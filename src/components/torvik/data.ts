import type { ExerciseId } from "@/lib/biomech";

export type Exercise = {
  id: ExerciseId;
  name: string;
  badge: string;
  emoji: string;
  summary: string;
  instructions: string[];
  previewAnimation: string;
  previewStill: string;
  previewAlt: string;
  previewInstruction: string;
};

export const EXERCISES: Exercise[] = [
  {
    id: "squat",
    name: "Agachamento",
    badge: "Pernas & Glúteos",
    emoji: "🦵",
    summary: "Descida controlada e retorno à posição inicial.",
    previewAnimation: "/exercise-previews/torvik-squat.webp",
    previewStill: "/exercise-previews/torvik-squat-still.webp",
    previewAlt: "Torvik demonstrando o movimento de agachar e subir",
    previewInstruction: "Mantenha os pés alinhados e desça com controle.",
    instructions: [
      "Fique de lado para a câmera, corpo inteiro visível",
      "O app estima a amplitude da descida em 2D",
      "Mantenha o movimento confortável e controlado",
    ],
  },
  {
    id: "pushup",
    name: "Flexão de Braço",
    badge: "Peito & Tríceps",
    emoji: "💪",
    summary: "Descida controlada e corpo alinhado.",
    previewAnimation: "/exercise-previews/torvik-pushup.webp",
    previewStill: "/exercise-previews/torvik-pushup-still.webp",
    previewAlt: "Torvik demonstrando uma flexão de braço",
    previewInstruction: "Mantenha o corpo reto e desça de forma controlada.",
    instructions: [
      "Posicione a câmera lateralmente, no nível do chão",
      "Deixe ombro, cotovelo, punho, quadril e joelho visíveis",
      "Observe o alinhamento do tronco e do quadril",
    ],
  },
  {
    id: "jumpingjack",
    name: "Polichinelo",
    badge: "Cardio",
    emoji: "⚡",
    summary: "Braços acima da cabeça e pernas bem abertas.",
    previewAnimation: "/exercise-previews/torvik-jumpingjack.webp",
    previewStill: "/exercise-previews/torvik-jumpingjack-still.webp",
    previewAlt: "Torvik demonstrando um polichinelo completo",
    previewInstruction: "Abra braços e pernas ao mesmo tempo em um ritmo constante.",
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
