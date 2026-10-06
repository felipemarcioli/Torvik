import { ADDITIONS, type AdditionId } from "./additions";
export type ExerciseId =
  | AdditionId
  | "squat"
  | "pushup"
  | "jumpingjack"
  | "lunge"
  | "bicepscurl"
  | "lateralraise"
  | "situp"
  | "plank"
  | "glutebridge"
  | "calfraise"
  | "reverselunge"
  | "shoulderpress"
  | "frontraise"
  | "bentoverrow"
  | "tricepskickback"
  | "mountainclimber";
export type ExerciseType = "REP_BASED" | "HOLD_BASED";
export type Exercise = {
  id: ExerciseId;
  name: string;
  category: "legs" | "chest" | "arms" | "shoulders" | "core" | "cardio" | "back";
  type: ExerciseType;
  badge: string;
  emoji: string;
  summary: string;
  instructions: string[];
  initialPosition: string;
  rulesVersion: string;
  landmarks: readonly number[];
  previewAnimation: string;
  previewStill: string;
  previewAlt: string;
  previewInstruction: string;
  previewAvailable?: boolean;
  equipment?: readonly string[];
  preparation?: string;
  execution?: string;
  repDefinition?: string;
  cameraGuidance?: string;
  sideMode?: "selected" | "alternating";
  analysisLimitations?: string;
  previewSprite?: string;
};
const existing: Omit<
  Exercise,
  "category" | "type" | "initialPosition" | "rulesVersion" | "landmarks"
>[] = [
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

const metadata = {
  squat: { category: "legs", initialPosition: "Comece em pé.", landmarks: [11, 23, 25, 27] },
  pushup: {
    category: "chest",
    initialPosition: "Comece na posição alta da flexão.",
    landmarks: [11, 13, 15, 23, 25],
  },
  jumpingjack: {
    category: "cardio",
    initialPosition: "Comece com braços baixos e pés juntos.",
    landmarks: [0, 11, 12, 15, 16, 27, 28],
  },
} as const;
function extra(
  id: ExerciseId,
  name: string,
  category: Exercise["category"],
  badge: string,
  emoji: string,
  initialPosition: string,
  instructions: string[],
  previewInstruction: string,
  landmarks: number[],
): Exercise {
  return {
    id,
    name,
    category,
    badge,
    emoji,
    type: id === "plank" ? "HOLD_BASED" : "REP_BASED",
    rulesVersion: "1.0.0",
    initialPosition,
    instructions,
    summary: previewInstruction,
    previewInstruction,
    landmarks,
    previewAnimation: `/exercise-previews/torvik-${id}.webp`,
    previewStill: `/exercise-previews/torvik-${id}-still.webp`,
    previewAlt: `Torvik demonstrando ${name.toLowerCase()}`,
    previewAvailable: true,
  };
}
const DEFINITIONS: readonly Exercise[] = [
  ...ADDITIONS,
  ...existing.map((e) => ({
    ...e,
    ...metadata[e.id as keyof typeof metadata],
    type: "REP_BASED" as const,
    rulesVersion: "2.0.0",
  })),
  extra(
    "lunge",
    "Afundo",
    "legs",
    "Pernas & Glúteos",
    "🦵",
    "Comece em pé, com os pés em posição de passada.",
    [
      "Fique de lado, com a perna acompanhada mais próxima da câmera",
      "Mantenha ambos os joelhos e tornozelos visíveis",
      "Desça e suba sem deslocar os pés; troque a perna entre ciclos",
    ],
    "Mantenha a base em passada e desça com controle.",
    [11, 23, 25, 27, 24, 26, 28],
  ),
  extra(
    "bicepscurl",
    "Rosca bíceps",
    "arms",
    "Bíceps",
    "💪",
    "Comece com o braço acompanhado estendido.",
    [
      "Fique de lado ou levemente na diagonal",
      "Deixe ombro, cotovelo, punho e quadril visíveis",
      "O app acompanha um braço por vez e não mede a carga",
    ],
    "Flexione e estenda o braço, mantendo o cotovelo próximo ao corpo.",
    [11, 13, 15, 23],
  ),
  extra(
    "lateralraise",
    "Elevação lateral",
    "shoulders",
    "Ombros",
    "🏋️",
    "Comece com os dois braços ao lado do corpo.",
    [
      "Fique de frente, com espaço nas laterais",
      "Mantenha os dois braços e quadris visíveis",
      "Eleve os braços até perto da altura dos ombros; o app não mede a carga",
    ],
    "Eleve os dois braços até a altura dos ombros.",
    [11, 12, 13, 14, 15, 16, 23, 24],
  ),
  extra(
    "situp",
    "Abdominal",
    "core",
    "Abdômen",
    "🔥",
    "Comece deitado, com os joelhos dobrados.",
    [
      "Posicione a câmera lateralmente, próxima ao chão",
      "Mantenha ombro, quadril, joelho e tornozelo visíveis",
      "Eleve o tronco até perto da posição sentada e retorne",
    ],
    "Eleve o tronco com os joelhos dobrados e retorne com controle.",
    [11, 23, 25, 27],
  ),
  extra(
    "plank",
    "Prancha",
    "core",
    "Core · tempo",
    "⏱️",
    "Apoie os antebraços e estenda as pernas.",
    [
      "Posicione a câmera de lado, próxima ao chão",
      "Deixe ombro, cotovelo, punho, quadril, joelho e tornozelo visíveis",
      "O tempo válido avança somente enquanto a postura atende aos critérios",
    ],
    "Mantenha o corpo alinhado, apoiado nos antebraços.",
    [11, 13, 15, 23, 25, 27],
  ),
  extra(
    "glutebridge",
    "Ponte de glúteos",
    "legs",
    "Pernas & Glúteos",
    "🦵",
    "Comece deitado de costas, com joelhos dobrados e quadril baixo.",
    [
      "Posicione a câmera de lado, próxima ao chão",
      "Deixe ombro, quadril, joelho e tornozelo visíveis",
      "Eleve o quadril e retorne à posição inicial, mantendo os pés apoiados",
    ],
    "Eleve o quadril com os pés apoiados e retorne.",
    [11, 23, 25, 27],
  ),
  extra(
    "calfraise",
    "Panturrilha em pé",
    "legs",
    "Pernas & Glúteos",
    "🦵",
    "Comece em pé, com os calcanhares apoiados.",
    [
      "Posicione a câmera de lado, mostrando o corpo inteiro e os pés",
      "Calcanhar e ponta do pé precisam estar nítidos; ajuste a distância se necessário",
      "Eleve os calcanhares e volte ao apoio; o app acompanha um lado por vez",
    ],
    "Eleve os calcanhares e retorne ao apoio.",
    [11, 23, 25, 27, 29, 31],
  ),
  extra(
    "reverselunge",
    "Afundo reverso",
    "legs",
    "Pernas & Glúteos",
    "🦵",
    "Comece em pé, com os pés próximos.",
    [
      "Fique de lado ou levemente na diagonal, com os dois pés visíveis",
      "Leve um pé para trás, flexione os joelhos e retorne com os pés próximos",
      "Mantenha ombros, quadris, joelhos, tornozelos e pontas dos pés visíveis",
    ],
    "Dê um passo para trás, desça e volte à posição inicial.",
    [11, 12, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32],
  ),
  extra(
    "shoulderpress",
    "Desenvolvimento de ombros",
    "shoulders",
    "Ombros",
    "🏋️",
    "Comece com os cotovelos flexionados e as mãos junto aos ombros.",
    [
      "Fique de frente, com os dois braços inteiros visíveis",
      "Estenda os dois braços acima da cabeça e retorne",
      "O app acompanha o corpo; não identifica nem mede a carga",
    ],
    "Estenda os braços acima da cabeça e retorne.",
    [11, 12, 13, 14, 15, 16, 23, 24],
  ),
  extra(
    "frontraise",
    "Elevação frontal",
    "shoulders",
    "Ombros",
    "🏋️",
    "Comece com o braço ao lado do corpo.",
    [
      "Fique de lado para mostrar a elevação à frente do corpo",
      "Mantenha ombro, cotovelo, punho, quadril e rosto visíveis",
      "Eleve o braço até a altura do ombro e retorne; o app acompanha um lado e não mede carga",
    ],
    "Eleve o braço à frente até a altura do ombro.",
    [0, 11, 13, 15, 23],
  ),
  extra(
    "bentoverrow",
    "Remada curvada",
    "back",
    "Costas",
    "💪",
    "Incline o tronco pelo quadril e deixe o braço estendido.",
    [
      "Posicione a câmera de lado, mostrando ombro, braço, quadril e joelho",
      "Puxe o cotovelo para trás e aproxime a mão do tronco; depois estenda o braço",
      "Mantenha o tronco estável; o app acompanha um lado e não mede carga",
    ],
    "Puxe o cotovelo para trás mantendo o tronco estável.",
    [11, 13, 15, 23, 25],
  ),
  extra(
    "tricepskickback",
    "Tríceps kickback",
    "arms",
    "Tríceps",
    "💪",
    "Incline o tronco e mantenha o cotovelo flexionado junto ao corpo.",
    [
      "Fique de lado, com ombro, cotovelo, punho, quadril e joelho visíveis",
      "Mantenha o braço superior próximo ao tronco; estenda o cotovelo e retorne",
      "O app acompanha um braço por vez e não mede carga",
    ],
    "Estenda o cotovelo mantendo o braço superior estável.",
    [11, 13, 15, 23, 25],
  ),
  extra(
    "mountainclimber",
    "Mountain Climber",
    "cardio",
    "Cardio / Core",
    "⚡",
    "Comece em prancha alta, com braços e pernas estendidos.",
    [
      "Posicione a câmera de lado, levemente na diagonal para mostrar os dois joelhos",
      "Aproxime um joelho do tronco e estenda a perna antes de alternar",
      "Cada aproximação e retorno conta uma repetição; mantenha mãos e pés visíveis",
    ],
    "Aproxime um joelho, retorne e alterne o lado.",
    [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28],
  ),
];
const CATEGORY_ORDER: Exercise["category"][] = [
  "legs",
  "chest",
  "arms",
  "shoulders",
  "back",
  "core",
  "cardio",
];
export const EXERCISES: readonly Exercise[] = [...DEFINITIONS].sort(
  (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category),
);
export const EXERCISE_BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e])) as Record<
  ExerciseId,
  Exercise
>;
export const isExerciseId = (id: unknown): id is ExerciseId =>
  typeof id === "string" && Object.hasOwn(EXERCISE_BY_ID, id);
export const MOVEMENT_LABELS: Record<string, string> = {
  airborne: "Elevação observada",
  landing: "Estabilizando o retorno",
  positioning: "Posicionando",
  standing: "Em pé",
  high: "Prancha alta",
  descending: "Descendo",
  squat: "Agachado",
  low: "Embaixo",
  closed: "Fechado",
  opening: "Abrindo",
  open: "Aberto",
  baseline: "Posição inicial",
  moving: "Em movimento",
  target: "Amplitude reconhecida",
  holding: "Contando",
  adjusting: "Ajuste a postura",
};
export const THRESHOLDS = {
  lunge: { baseline: 155, enter: 140, target: 110, excursion: 25, stance: 0.35, torso: 40 },
  bicepscurl: { baseline: 155, enter: 140, target: 65, excursion: 40, armDrift: 25 },
  situp: { baseline: 160, enter: 145, target: 100, excursion: 35, kneeMin: 45, kneeMax: 135 },
  lateralraise: {
    baseline: 20,
    enter: 35,
    target: 75,
    targetMax: 105,
    tooHigh: 115,
    asymmetry: 20,
    excursion: 40,
  },
  plank: {
    alignment: 165,
    knee: 160,
    exitAlignment: 160,
    exitKnee: 155,
    elbowMin: 60,
    elbowMax: 120,
    forearmMax: 30,
    bodyTiltMax: 35,
  },
} as const;
