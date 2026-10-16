/** Reference corpus for device/human listening review, never proof of real audio playback. */
export const VOICE_REFERENCES = [
  { event: "start", key: "Vamos começar!" },
  { event: "preparation", key: "Comece em pé." },
  { event: "posture", key: "Mantenha o corpo alinhado." },
  { event: "repetitions", key: "{{count}} repetições!", values: { count: 10 } },
  { event: "encouragement", key: "Muito bem, continue!" },
  { event: "safety", key: "Mantenha o movimento confortável e controlado" },
  { event: "finish", key: "Treino encerrado" },
] as const;
