import { useEffect, useState } from "react";
import {
  BrowserSpeech,
  DEFAULT_VOICE,
  readVoiceSettings,
  SpeechQueue,
  VOICE_STORAGE_KEY,
  type VoiceSettings,
} from "@/lib/voice/speech";
import { WorkoutVoice } from "@/lib/voice/workout-voice";
import { i18n, currentLanguage } from "@/lib/i18n";
export function useWorkoutVoice() {
  const [, refresh] = useState(0);
  const [settings, setSettings] = useState<VoiceSettings>({ ...DEFAULT_VOICE });
  const [voice] = useState(
    () =>
      new WorkoutVoice(
        new SpeechQueue(
          new BrowserSpeech(),
          () => performance.now(),
          () => refresh((n) => n + 1),
        ),
      ),
  );
  useEffect(() => {
    let saved = { ...DEFAULT_VOICE };
    try {
      saved = readVoiceSettings(window.localStorage);
    } catch {
      /* Memory-only settings. */
    }
    voice.configure(saved);
    setSettings(saved);
    voice.speech.connect();
    const languageChanged = () => voice.setLanguage(currentLanguage());
    languageChanged();
    i18n.on("languageChanged", languageChanged);
    const timer = window.setInterval(() => voice.tick(), 200);
    const hidden = () => {
      if (document.hidden) voice.speech.clear();
    };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", hidden);
      i18n.off("languageChanged", languageChanged);
      voice.stop();
      voice.speech.dispose();
    };
  }, [voice]);
  const update = (patch: Partial<VoiceSettings>) => {
    const next = { ...settings, ...patch };
    voice.configure(next);
    setSettings(next);
    try {
      localStorage.setItem(VOICE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* Memory-only settings. */
    }
    if (patch.enabled === true) voice.speech.activate();
  };
  return {
    controller: voice,
    settings,
    update,
    status: voice.speech.status,
    activate: () => voice.speech.activate(),
  };
}
export type WorkoutVoiceControls = ReturnType<typeof useWorkoutVoice>;
