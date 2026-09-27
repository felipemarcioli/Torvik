import { NEW_FEEDBACK } from "./expansion";
/** Keys remain the original, persisted messages, including legacy reports. */
export const FEEDBACK: Record<string, { voice: string; detail: string; posture?: boolean }> = {
  "Amplie a descida do agachamento": {
    voice: "Tente aumentar a amplitude do agachamento.",
    detail: "A descida não alcançou o limite de amplitude configurado para esta repetição.",
  },
  "Amplie a descida da flexão": {
    voice: "Tente aumentar a amplitude da flexão.",
    detail: "A descida não alcançou o limite de amplitude configurado para esta repetição.",
  },
  "Revise a inclinação do tronco": {
    voice: "Revise a inclinação do tronco.",
    detail: "A inclinação estimada do tronco ultrapassou o limite configurado durante o ciclo.",
    posture: true,
  },
  "Revise o alinhamento do corpo": {
    voice: "Mantenha o corpo alinhado.",
    detail:
      "O alinhamento estimado entre ombro, quadril e joelho ultrapassou o limite configurado durante o ciclo.",
    posture: true,
  },
  "Eleve os braços acima da cabeça": {
    voice: "Eleve os braços acima da cabeça.",
    detail: "Os pulsos não ficaram acima da cabeça durante a abertura observada.",
  },
  "Abra mais as pernas": {
    voice: "Abra mais as pernas.",
    detail: "A distância entre os pés não atingiu a abertura configurada durante o ciclo.",
  },
  "Abra braços e pernas ao mesmo tempo": {
    voice: "Abra braços e pernas ao mesmo tempo.",
    detail: "Braços e pernas não ficaram abertos juntos pelo intervalo exigido.",
  },
  "Amplie a descida do afundo": {
    voice: "Desça um pouco mais no afundo.",
    detail: "O joelho acompanhado não atingiu a amplitude configurada.",
  },
  "Mantenha o tronco estável no afundo": {
    voice: "Mantenha o tronco estável.",
    detail: "A inclinação estimada do tronco excedeu o limite durante o ciclo.",
    posture: true,
  },
  "Amplie a flexão do cotovelo": {
    voice: "Suba um pouco mais na rosca.",
    detail: "O cotovelo não atingiu o ângulo de flexão configurado.",
  },
  "Mantenha o braço próximo ao tronco": {
    voice: "Mantenha o braço próximo ao tronco.",
    detail: "O braço se deslocou em relação ao tronco além do limite configurado.",
    posture: true,
  },
  "Eleve os braços até a altura dos ombros": {
    voice: "Eleve os braços até a altura dos ombros.",
    detail: "Os dois braços não atingiram juntos a faixa de elevação configurada.",
  },
  "Não eleve os braços demais": {
    voice: "Não eleve os braços demais.",
    detail: "A elevação ultrapassou o limite configurado por um intervalo persistente.",
    posture: true,
  },
  "Mantenha os braços simétricos": {
    voice: "Mantenha os braços simétricos.",
    detail: "A diferença estimada de elevação dos braços ultrapassou o limite configurado.",
    posture: true,
  },
  "Suba mais o tronco": {
    voice: "Suba um pouco mais o tronco.",
    detail: "A elevação do tronco não atingiu a amplitude configurada para o abdominal.",
  },
  "Eleve um pouco o quadril": {
    voice: "Eleve um pouco o quadril.",
    detail: "O quadril ficou deslocado para o lado do apoio em relação ao eixo ombro–tornozelo.",
    posture: true,
  },
  "Abaixe um pouco o quadril": {
    voice: "Abaixe um pouco o quadril.",
    detail: "O quadril ficou deslocado para longe do apoio em relação ao eixo ombro–tornozelo.",
    posture: true,
  },
  "Alinhe o corpo na prancha": {
    voice: "Alinhe o corpo na prancha.",
    detail: "O alinhamento do corpo ou dos joelhos não atendeu aos limites configurados.",
    posture: true,
  },
  "Apoie os antebraços": {
    voice: "Apoie os antebraços.",
    detail: "A posição relativa do cotovelo e do antebraço não correspondeu ao apoio configurado.",
    posture: true,
  },
};

// New identifiers use the same persisted message / voice contract.
Object.assign(FEEDBACK, {
  [NEW_FEEDBACK.bridgeRange]: {
    voice: NEW_FEEDBACK.bridgeRange + ".",
    detail: "O quadril não atingiu a extensão configurada durante a ponte.",
    posture: false,
  },
  [NEW_FEEDBACK.calfRange]: {
    voice: NEW_FEEDBACK.calfRange + ".",
    detail: "A elevação relativa do calcanhar ficou abaixo do limite configurado.",
    posture: false,
  },
  [NEW_FEEDBACK.calfPosture]: {
    voice: NEW_FEEDBACK.calfPosture + ".",
    detail: "O tronco inclinou ou o apoio do pé se deslocou durante a elevação.",
    posture: true,
  },
  [NEW_FEEDBACK.reverseRange]: {
    voice: NEW_FEEDBACK.reverseRange + ".",
    detail:
      "A flexão do joelho ou a descida do joelho traseiro não atingiu o critério configurado.",
    posture: false,
  },
  [NEW_FEEDBACK.reversePosture]: {
    voice: NEW_FEEDBACK.reversePosture + ".",
    detail: "O tronco ultrapassou a inclinação configurada durante o afundo reverso.",
    posture: true,
  },
  [NEW_FEEDBACK.pressRange]: {
    voice: NEW_FEEDBACK.pressRange + ".",
    detail: "A extensão e a elevação dos dois braços não atingiram juntas o critério configurado.",
    posture: false,
  },
  [NEW_FEEDBACK.frontRange]: {
    voice: NEW_FEEDBACK.frontRange + ".",
    detail: "O braço não atingiu a faixa de elevação anterior configurada.",
    posture: false,
  },
  [NEW_FEEDBACK.frontElbow]: {
    voice: NEW_FEEDBACK.frontElbow + ".",
    detail: "O cotovelo permaneceu flexionado além do limite configurado durante a elevação.",
    posture: true,
  },
  [NEW_FEEDBACK.frontHigh]: {
    voice: NEW_FEEDBACK.frontHigh + ".",
    detail: "A elevação do braço ultrapassou a faixa configurada.",
    posture: true,
  },
  [NEW_FEEDBACK.rowRange]: {
    voice: NEW_FEEDBACK.rowRange + ".",
    detail: "A flexão e o deslocamento posterior do cotovelo não atingiram o critério configurado.",
    posture: false,
  },
  [NEW_FEEDBACK.rowPosture]: {
    voice: NEW_FEEDBACK.rowPosture + ".",
    detail: "A inclinação do tronco variou além do limite configurado durante a remada.",
    posture: true,
  },
  [NEW_FEEDBACK.kickRange]: {
    voice: NEW_FEEDBACK.kickRange + ".",
    detail: "O cotovelo não atingiu a extensão configurada.",
    posture: false,
  },
  [NEW_FEEDBACK.kickPosture]: {
    voice: NEW_FEEDBACK.kickPosture + ".",
    detail: "A posição do braço superior ou do tronco variou além do limite configurado.",
    posture: true,
  },
  [NEW_FEEDBACK.climberRange]: {
    voice: NEW_FEEDBACK.climberRange + ".",
    detail: "A aproximação do joelho não atingiu a flexão configurada.",
    posture: false,
  },
  [NEW_FEEDBACK.climberPosture]: {
    voice: NEW_FEEDBACK.climberPosture + ".",
    detail: "O quadril se deslocou em relação ao ombro além da tolerância configurada.",
    posture: true,
  },
});
