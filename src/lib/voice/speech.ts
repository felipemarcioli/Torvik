import { translateVoice, currentLanguage } from "../i18n";
import { speechLanguage, type Language } from "../i18n/languages";
export type VoiceStatus = "unavailable" | "needs-activation" | "ready" | "blocked";
export interface SpeechPort {
  setLanguage?(language: Language): void;
  connect(change: (available: boolean) => void): () => void;
  speak(
    text: string,
    volume: number,
    callbacks: { start(): void; end(): void; error(): void },
  ): void;
  cancel(): void;
}
export function localPortugueseVoice(voices: SpeechSynthesisVoice[]) {
  const local = voices.filter((v) => v.localService && /^pt(?:[-_]|$)/i.test(v.lang));
  return local.find((v) => /^pt[-_]br$/i.test(v.lang)) ?? local[0];
}
export function compatibleVoice(voices: SpeechSynthesisVoice[], language: Language) {
  const target = speechLanguage(language).toLowerCase();
  const base = target.split("-")[0];
  const compatible = voices.filter(
    (voice) => voice.lang.replaceAll("_", "-").toLowerCase().split("-")[0] === base,
  );
  return compatible.sort((a, b) => {
    const score = (voice: SpeechSynthesisVoice) =>
      (voice.lang.replaceAll("_", "-").toLowerCase() === target ? 4 : 0) +
      (voice.localService ? 2 : 0) +
      (voice.default ? 1 : 0);
    return score(b) - score(a);
  })[0];
}
export class BrowserSpeech implements SpeechPort {
  private language: Language;
  private refresh = () => {};
  constructor(language: Language = currentLanguage()) {
    this.language = language;
  }
  setLanguage(language: Language) {
    if (this.language === language) return;
    this.cancel();
    this.language = language;
    this.refresh();
  }
  private synth: SpeechSynthesis | undefined;
  private voice: SpeechSynthesisVoice | undefined;
  private utterance: SpeechSynthesisUtterance | null = null;
  connect(change: (available: boolean) => void) {
    if (
      typeof window === "undefined" ||
      !window.speechSynthesis ||
      !window.SpeechSynthesisUtterance
    ) {
      change(false);
      return () => {};
    }
    const synth = (this.synth = window.speechSynthesis);
    const update = () => {
      try {
        this.voice = compatibleVoice(synth.getVoices(), this.language);
      } catch {
        this.voice = undefined;
      }
      change(!!this.voice);
    };
    synth.addEventListener("voiceschanged", update);
    this.refresh = update;
    update();
    return () => {
      synth.removeEventListener("voiceschanged", update);
      this.refresh = () => {};
      this.cancel();
    };
  }
  speak(text: string, volume: number, callbacks: { start(): void; end(): void; error(): void }) {
    if (!this.synth || !this.voice) {
      callbacks.error();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    this.utterance = utterance;
    utterance.voice = this.voice;
    utterance.lang = speechLanguage(this.language);
    utterance.rate = utterance.pitch = 1;
    utterance.volume = volume;
    utterance.onstart = callbacks.start;
    utterance.onend = callbacks.end;
    utterance.onerror = callbacks.error;
    try {
      this.synth.speak(utterance);
    } catch {
      callbacks.error();
    }
  }
  cancel() {
    if (this.utterance) {
      this.utterance.onstart = this.utterance.onend = this.utterance.onerror = null;
      this.utterance = null;
      try {
        this.synth?.cancel();
      } catch {
        /* Audio failures must not interrupt camera cleanup. */
      }
    }
  }
}
export type VoiceSettings = { enabled: boolean; mode: "basic" | "full"; volume: number };
export const DEFAULT_VOICE: VoiceSettings = { enabled: true, mode: "full", volume: 1 };
export const VOICE_STORAGE_KEY = "torvik.voice.v1";
export function readVoiceSettings(storage?: Pick<Storage, "getItem">): VoiceSettings {
  try {
    const saved = JSON.parse(
      storage?.getItem(VOICE_STORAGE_KEY) ?? "null",
    ) as Partial<VoiceSettings> | null;
    return {
      enabled: typeof saved?.enabled === "boolean" ? saved.enabled : true,
      mode: saved?.mode === "basic" ? "basic" : "full",
      volume:
        typeof saved?.volume === "number" && Number.isFinite(saved.volume)
          ? Math.max(0, Math.min(1, saved.volume))
          : 1,
    };
  } catch {
    return { ...DEFAULT_VOICE };
  }
}
export type VoiceMessage = {
  key: string;
  text: string;
  priority: number;
  expires: number;
  common?: boolean;
  repeatMs?: number;
  valid: () => boolean;
  done?: () => void;
};
/** Owns the only native utterance; pending messages stay in our bounded queue. */
export class SpeechQueue {
  settings = { ...DEFAULT_VOICE };
  status: VoiceStatus = "unavailable";
  private available = false;
  private disconnect: (() => void) | null = null;
  private pending: VoiceMessage[] = [];
  private active: {
    message: VoiceMessage;
    generation: number;
    started: boolean;
    since: number;
  } | null = null;
  private generation = 0;
  private commonAt = -Infinity;
  private spoken = new Map<string, number>();
  constructor(
    private port: SpeechPort,
    private now = () => performance.now(),
    private change = () => {},
  ) {}
  connect() {
    this.disconnect?.();
    this.disconnect = this.port.connect((available) => {
      const changed = available !== this.available;
      this.available = available;
      if (!available) {
        this.clear();
        this.status = "unavailable";
      } else if (changed || this.status === "unavailable") this.status = "needs-activation";
      this.change();
    });
  }
  setLanguage(language: Language) {
    const wasReady = this.status === "ready";
    this.clear();
    this.spoken.clear();
    this.commonAt = -Infinity;
    this.port.setLanguage?.(language);
    if (wasReady && this.available) this.status = "ready";
    this.change();
  }
  activate() {
    if (!this.available || !this.settings.enabled || this.settings.volume === 0) return;
    this.clear();
    this.status = "ready";
    this.change();
    this.offer({
      key: "activation",
      text: translateVoice("Voz ativada"),
      priority: 100,
      expires: this.now() + 3000,
      valid: () => true,
    });
  }
  configure(settings: VoiceSettings) {
    this.settings = settings;
    if (!settings.enabled || settings.volume === 0) this.clear();
    else if (settings.mode === "basic") this.remove((m) => !!m.common);
  }
  offer(message: VoiceMessage) {
    if (!message.text.trim()) return;
    if (
      !this.allowed(message) ||
      this.active?.message.key === message.key ||
      this.pending.some((m) => m.key === message.key)
    )
      return;
    if (this.active?.message.common && message.priority > this.active.message.priority)
      this.stopActive();
    this.pending.push(message);
    this.pending.sort((a, b) => b.priority - a.priority);
    this.pending = this.pending.slice(0, 3);
    this.tick();
  }
  private allowed(m: VoiceMessage) {
    const now = this.now();
    return (
      this.status === "ready" &&
      this.settings.enabled &&
      this.settings.volume > 0 &&
      m.expires > now &&
      m.valid() &&
      (!m.common ||
        (this.settings.mode === "full" &&
          now - this.commonAt >= 8000 &&
          now - (this.spoken.get(m.key) ?? -Infinity) >= (m.repeatMs ?? 24000)))
    );
  }
  tick() {
    this.pending = this.pending.filter((m) => this.allowed(m));
    if (this.active && !this.active.message.valid()) this.stopActive();
    if (this.active && this.now() - this.active.since > (this.active.started ? 15000 : 3000)) {
      this.fail();
      return;
    }
    if (this.active) return;
    const message = this.pending.shift();
    if (!message) return;
    const generation = ++this.generation;
    this.active = { message, generation, started: false, since: this.now() };
    const current = () => this.active?.generation === generation;
    this.port.speak(message.text, this.settings.volume, {
      start: () => {
        if (!current()) return;
        this.active!.started = true;
        if (message.common) {
          this.commonAt = this.now();
          this.spoken.set(message.key, this.now());
        }
      },
      end: () => {
        if (current()) {
          this.active = null;
          message.done?.();
          this.tick();
        }
      },
      error: () => {
        if (current()) this.fail();
      },
    });
  }
  private fail() {
    this.clear();
    this.status = "blocked";
    this.change();
  }
  private stopActive() {
    this.active = null;
    ++this.generation;
    this.port.cancel();
  }
  remove(matches: (m: VoiceMessage) => boolean) {
    this.pending = this.pending.filter((m) => !matches(m));
    if (this.active && matches(this.active.message)) this.stopActive();
  }
  clear() {
    this.pending = [];
    this.stopActive();
  }
  dispose() {
    this.clear();
    this.disconnect?.();
    this.disconnect = null;
    this.available = false;
    this.status = "unavailable";
  }
}
