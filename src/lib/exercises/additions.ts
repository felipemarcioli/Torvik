import type { Exercise } from "./catalog";
export const ADDITION_IDS = [
  "romaniandeadlift",
  "bulgariansquat",
  "wallsit",
  "floorpress",
  "sideplank",
  "deadbug",
  "birddog",
  "lyinglegraise",
  "shouldertap",
  "highknees",
  "buttkicks",
  "skater",
  "stepjack",
  "jumpsquat",
] as const;
export type AdditionId = (typeof ADDITION_IDS)[number];
type Definition = {
  id: AdditionId;
  name: string;
  category: Exercise["category"];
  equipment: string[];
  preparation: string;
  execution: string;
  repDefinition: string;
  cameraGuidance: string;
  analysisLimitations: string;
  sideMode?: NonNullable<Exercise["sideMode"]>;
  type?: Exercise["type"];
  landmarks?: number[];
};
const FLOOR =
  "A câmera estima posições em 2D; oclusões podem suspender a avaliação. Não reconhece contato real com o chão nem detalhes da coluna.";
const definitions: Definition[] = [
  {
    id: "romaniandeadlift",
    name: "Levantamento terra romeno com halteres",
    category: "legs",
    equipment: ["Halteres"],
    preparation:
      "Fique em pé, pés na largura do quadril, halteres à frente das coxas e joelhos suavemente flexionados.",
    execution:
      "Leve o quadril para trás, incline o tronco com os braços estendidos e volte a ficar ereto. Use uma amplitude confortável.",
    repDefinition:
      "Uma inclinação reconhecida pelo quadril e retorno completo à posição ereta contam uma repetição.",
    cameraGuidance:
      "Câmera de lado, fixa na altura do quadril; mostre ombro, mãos, quadril, joelhos e pés.",
    analysisLimitations:
      "A análise acompanha a flexão do quadril e o retorno; não reconhece os halteres, carga, ativação muscular ou curvatura da coluna.",
  },
  {
    id: "bulgariansquat",
    name: "Agachamento búlgaro",
    category: "legs",
    equipment: ["Banco ou apoio estável", "Halteres opcionais"],
    sideMode: "selected",
    preparation:
      "Escolha a perna dianteira. Apoie o pé traseiro em um banco estável e encontre uma base confortável.",
    execution:
      "Flexione o joelho dianteiro, desça e retorne à posição alta. Use os controles de lado antes de inverter as pernas.",
    repDefinition:
      "Uma descida reconhecida e retorno à posição alta contam uma repetição da perna dianteira selecionada.",
    cameraGuidance:
      "Câmera de lado, levemente na diagonal; mostre as duas pernas e o apoio, com a perna dianteira visível.",
    analysisLimitations:
      "O app estima a base assimétrica e a flexão da perna escolhida. Não comprova contato, altura ou estabilidade do banco.",
  },
  {
    id: "wallsit",
    name: "Agachamento isométrico na parede",
    category: "legs",
    equipment: ["Parede"],
    type: "HOLD_BASED",
    preparation:
      "Apoie as costas numa parede estável e deslize até uma posição de agachamento confortável.",
    execution:
      "Sustente a posição com os pés firmes. Ajuste a altura caso necessário; saia da posição com controle.",
    repDefinition:
      "O tempo válido começa após reconhecer uma postura estável e pausa quando a postura ou a visibilidade ficam insuficientes.",
    cameraGuidance:
      "Câmera lateral, fixa, na altura dos joelhos; mostre tronco, quadril, joelhos e tornozelos.",
    analysisLimitations:
      "A câmera estima a posição do tronco e das pernas; não comprova contato com a parede.",
  },
  {
    id: "floorpress",
    name: "Supino com halteres no chão",
    category: "chest",
    equipment: ["Halteres"],
    preparation:
      "Deite de costas, dobre os joelhos e segure os halteres com cotovelos flexionados ao lado do tronco.",
    execution: "Estenda os dois braços sobre o peito e retorne com controle à posição flexionada.",
    repDefinition:
      "Extensão dos dois braços e retorno dos dois cotovelos à posição inicial contam uma repetição.",
    cameraGuidance:
      "Câmera baixa, na diagonal ao lado do tronco; mantenha os dois cotovelos e punhos visíveis, sem olhar ao longo dos braços.",
    analysisLimitations:
      FLOOR + " Não reconhece halteres, carga nem contato dos cotovelos com o chão.",
  },
  {
    id: "sideplank",
    name: "Prancha lateral com apoio no antebraço",
    category: "core",
    equipment: [],
    sideMode: "selected",
    type: "HOLD_BASED",
    preparation:
      "Escolha o lado de apoio. Deite de lado, posicione o cotovelo abaixo do ombro e estenda as pernas.",
    execution:
      "Eleve o quadril e sustente o alinhamento do corpo. Apoie a mão livre na cintura; use os controles de lado para mudar o apoio.",
    repDefinition:
      "Tempo válido registrado separadamente para cada lado de apoio selecionado, após postura estável.",
    cameraGuidance:
      "Câmera baixa diante da lateral exposta do corpo; deixe os dois ombros, cotovelo de apoio, quadril e pernas visíveis.",
    analysisLimitations:
      FLOOR +
      " A sobreposição dos ombros pode impedir distinguir esta postura de outra prancha; ajuste a diagonal.",
  },
  {
    id: "deadbug",
    name: "Dead bug",
    category: "core",
    equipment: [],
    sideMode: "alternating",
    preparation: "Deite de costas, braços apontando para cima e quadris e joelhos flexionados.",
    execution:
      "Estenda um braço e a perna oposta, volte à posição inicial e alterne. Use uma amplitude confortável.",
    repDefinition:
      "Extensão coordenada de braço e perna opostos e retorno contam uma repetição; o lado é o da perna estendida.",
    cameraGuidance:
      "Câmera diagonal elevada, mostrando os dois braços e as duas pernas; evite sobreposição dos membros.",
    analysisLimitations: FLOOR,
  },
  {
    id: "birddog",
    name: "Bird dog",
    category: "core",
    equipment: [],
    sideMode: "alternating",
    preparation: "Comece em quatro apoios, com mãos abaixo dos ombros e joelhos abaixo do quadril.",
    execution: "Estenda um braço e a perna oposta, retorne aos quatro apoios e alterne.",
    repDefinition:
      "Extensão coordenada de braço e perna opostos e retorno contam uma repetição; o lado é o da perna estendida.",
    cameraGuidance:
      "Câmera baixa em diagonal lateral; mostre as mãos, os dois joelhos e os pés sem sobreposição.",
    analysisLimitations: FLOOR,
  },
  {
    id: "lyinglegraise",
    name: "Elevação de pernas deitado",
    category: "core",
    equipment: [],
    preparation:
      "Deite de costas com braços ao lado do corpo e pernas estendidas em posição baixa confortável.",
    execution:
      "Eleve as duas pernas e desça com controle até a posição inicial, sem exigir contato com o chão.",
    repDefinition:
      "Elevação das duas pernas e retorno conjunto à posição baixa contam uma repetição.",
    cameraGuidance:
      "Câmera lateral baixa, levemente na diagonal; ombros, quadris, joelhos e tornozelos das duas pernas devem estar visíveis.",
    analysisLimitations: FLOOR,
  },
  {
    id: "shouldertap",
    name: "Prancha alta com toque alternado nos ombros",
    category: "core",
    equipment: [],
    sideMode: "alternating",
    preparation: "Comece em prancha alta, braços estendidos e pés numa base confortável.",
    execution: "Leve uma mão ao ombro oposto, retorne ao apoio e alterne a mão.",
    repDefinition:
      "Uma aproximação da mão ao ombro oposto e retorno à posição de apoio contam uma repetição; o lado é o da mão movimentada.",
    cameraGuidance:
      "Câmera frontal em diagonal, baixa, mostrando ombros, punhos, quadril e pés; evite mãos ocultas pelo tronco.",
    analysisLimitations: FLOOR + " A proximidade observada não comprova o toque real no ombro.",
  },
  {
    id: "highknees",
    name: "Corrida estacionária com joelhos altos",
    category: "cardio",
    equipment: [],
    sideMode: "alternating",
    preparation: "Fique em pé com espaço livre e corpo inteiro visível.",
    execution:
      "Eleve alternadamente os joelhos e retorne cada perna. Mantenha um ritmo que a câmera consiga acompanhar.",
    repDefinition:
      "Cada elevação reconhecida de um joelho e retorno contam uma repetição desse lado. Registra também o tempo ativo acompanhado.",
    cameraGuidance:
      "Câmera frontal levemente oblíqua, fixa; mostre os dois joelhos e pés, com margem acima da cabeça.",
    analysisLimitations:
      "Cadências muito rápidas, oclusão das pernas ou poucos frames podem impedir a contagem. O tempo ativo exclui perdas de rastreamento.",
  },
  {
    id: "buttkicks",
    name: "Corrida estacionária com calcanhares aos glúteos",
    category: "cardio",
    equipment: [],
    sideMode: "alternating",
    preparation: "Fique em pé, com os dois pés visíveis e espaço livre.",
    execution:
      "Flexione alternadamente os joelhos levando os calcanhares em direção aos glúteos e retorne.",
    repDefinition:
      "Cada flexão reconhecida e retorno de uma perna contam uma repetição desse lado. Registra também o tempo ativo acompanhado.",
    cameraGuidance:
      "Câmera lateral levemente oblíqua, fixa; deixe os dois joelhos, tornozelos e quadris visíveis.",
    analysisLimitations:
      "A câmera observa aproximação, sem comprovar contato do calcanhar. Cadências rápidas ou pernas sobrepostas podem impedir a contagem.",
  },
  {
    id: "skater",
    name: "Patinador lateral",
    category: "cardio",
    equipment: [],
    sideMode: "alternating",
    preparation: "Fique em pé com espaço livre nos dois lados e joelhos suavemente flexionados.",
    execution:
      "Salte lateralmente para uma perna, leve a outra atrás, estabilize e desloque-se para o lado oposto.",
    repDefinition:
      "Cada deslocamento lateral com troca de perna e chegada estabilizada conta uma repetição do lado de chegada.",
    cameraGuidance:
      "Câmera frontal fixa; deixe margem nos dois lados e mostre todo o trajeto, inclusive os pés.",
    analysisLimitations:
      "A análise reconhece deslocamento e troca de perna em 2D, sem comprovar fase aérea ou contato com o chão. Câmera móvel invalida a referência.",
  },
  {
    id: "stepjack",
    name: "Polichinelo sem salto (step jack)",
    category: "cardio",
    equipment: [],
    sideMode: "alternating",
    preparation: "Comece com os pés próximos e braços baixos.",
    execution:
      "Abra uma perna para o lado elevando os dois braços, retorne os pés e braços e alterne a perna.",
    repDefinition:
      "Abertura lateral de uma perna com elevação dos braços e retorno fechado contam uma repetição do lado da perna movimentada.",
    cameraGuidance:
      "Câmera frontal fixa; mantenha mãos acima da cabeça e os dois pés dentro do quadro.",
    analysisLimitations:
      "A câmera acompanha a abertura e o retorno; não comprova ausência de salto. Precisa distinguir o pé que abre do que fica estável.",
  },
  {
    id: "jumpsquat",
    name: "Agachamento com salto",
    category: "cardio",
    equipment: [],
    preparation: "Comece em pé, com espaço para agachar e saltar e câmera fixa.",
    execution:
      "Agache, estenda as pernas para saltar, retorne e estabilize antes do próximo ciclo.",
    repDefinition:
      "Agachamento, elevação observada do corpo e dos dois pés, descida e retorno estabilizado contam um ciclo. Agachamento sem elevação dos pés não conta.",
    cameraGuidance:
      "Câmera lateral fixa; corpo inteiro e pés nítidos, com margem acima da cabeça durante o salto.",
    analysisLimitations:
      "O salto é estimado pela elevação relativa ao nível inicial dos pés, sem comprovar contato real. Uma câmera móvel pode imitar essa elevação e causar contagem incorreta; mantenha-a fixa. Pés pequenos ou oclusão podem impedir a avaliação.",
  },
];
export const ADDITIONS: readonly Exercise[] = definitions.map((d) => ({
  ...d,
  type: d.type ?? "REP_BASED",
  rulesVersion: "1.0.0",
  badge:
    d.category === "legs"
      ? "Pernas & Glúteos"
      : d.category === "chest"
        ? "Peito"
        : d.category === "core"
          ? "Core"
          : "Cardio",
  emoji:
    d.category === "legs"
      ? "🦵"
      : d.category === "chest"
        ? "💪"
        : d.category === "core"
          ? "🔥"
          : "⚡",
  summary: d.execution,
  initialPosition: d.preparation,
  landmarks: d.landmarks ?? [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28],
  instructions: [d.cameraGuidance, d.preparation, d.execution, d.repDefinition],
  previewAnimation: `/exercise-previews/torvik-${d.id}.webp`,
  previewStill: `/exercise-previews/torvik-${d.id}-still.webp`,
  previewSprite: `/exercise-previews/torvik-${d.id}-sprite.webp`,
  previewAlt: `Torvik demonstrando ${d.name.toLowerCase()}`,
  previewInstruction: d.execution,
  previewAvailable: true,
}));
