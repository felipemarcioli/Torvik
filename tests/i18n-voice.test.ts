import { afterEach, describe, expect, test } from "bun:test";
import { dictionaries, i18n } from "../src/lib/i18n";
import { LANGUAGES, speechLanguage, type Language } from "../src/lib/i18n/languages";
import {
  BrowserSpeech,
  compatibleVoice,
  DEFAULT_VOICE,
  SpeechQueue,
  type VoiceMessage,
} from "../src/lib/voice/speech";
import { WorkoutVoice } from "../src/lib/voice/workout-voice";
import { VOICE_REFERENCES } from "../src/lib/voice/reference";
import { translateVoice } from "../src/lib/i18n";
import type { AnalysisResult } from "../src/lib/biomech";

// Contract simulations only: these tests do not play, capture, or assess real audio.
const cleanups: (() => void)[] = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  await i18n.changeLanguage("pt-BR");
});
function replaceGlobal(key: string, value: unknown) {
  const original = Object.getOwnPropertyDescriptor(globalThis, key);
  Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  cleanups.push(() => {
    if (original) Object.defineProperty(globalThis, key, original);
    else Reflect.deleteProperty(globalThis, key);
  });
}
function voice(lang: string, localService = true, isDefault = false): SpeechSynthesisVoice {
  return { lang, localService, default: isDefault, name: lang, voiceURI: `mock:${lang}` };
}
class MockUtterance {
  voice: SpeechSynthesisVoice | null = null;
  lang = "";
  volume = 1;
  rate = 1;
  pitch = 1;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(readonly text: string) {}
}
function installSpeech(initialVoices: SpeechSynthesisVoice[] = []) {
  let voices = initialVoices;
  let active: MockUtterance | null = null;
  const calls: MockUtterance[] = [];
  const listeners = new Set<() => void>();
  let cancels = 0,
    overlaps = 0,
    throwOnSpeak = false;
  const synth = {
    getVoices: () => voices,
    addEventListener: (name: string, callback: () => void) => {
      if (name === "voiceschanged") listeners.add(callback);
    },
    removeEventListener: (name: string, callback: () => void) => {
      if (name === "voiceschanged") listeners.delete(callback);
    },
    speak: (utterance: MockUtterance) => {
      if (throwOnSpeak) throw new Error("not-allowed");
      if (active) overlaps++;
      calls.push(utterance);
      active = utterance;
      utterance.onstart?.();
    },
    cancel: () => {
      cancels++;
      active = null;
    },
  };
  replaceGlobal("window", { speechSynthesis: synth, SpeechSynthesisUtterance: MockUtterance });
  replaceGlobal("SpeechSynthesisUtterance", MockUtterance);
  return {
    calls,
    listeners,
    get cancels() {
      return cancels;
    },
    get overlaps() {
      return overlaps;
    },
    get active() {
      return active;
    },
    setVoices(next: SpeechSynthesisVoice[]) {
      voices = next;
      for (const listener of listeners) listener();
    },
    finish() {
      const ended = active;
      active = null;
      ended?.onend?.();
    },
    fail() {
      active?.onerror?.();
    },
    denySpeech() {
      throwOnSpeak = true;
    },
  };
}
const expectedCodes: Record<Language, string> = {
  "pt-BR": "pt-BR",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  it: "it-IT",
  ja: "ja-JP",
  "zh-CN": "zh-CN",
  ko: "ko-KR",
  hi: "hi-IN",
  ar: "ar-SA",
};
function expected(language: Language, key: string, count?: number) {
  const value = (dictionaries[language] as Record<string, string>)[key];
  expect(typeof value).toBe("string");
  return count === undefined
    ? value!
    : value!.replace("{{count}}", new Intl.NumberFormat(language).format(count));
}
function fixture(language: Language) {
  let now = 0;
  const native = installSpeech(LANGUAGES.map(({ speech }) => voice(speech)));
  const port = new BrowserSpeech(language);
  const queue = new SpeechQueue(port, () => now);
  const workout = new WorkoutVoice(queue, () => now);
  cleanups.push(() => queue.dispose());
  queue.connect();
  const baseline: AnalysisResult = {
    tracking: true,
    ready: true,
    state: "standing",
    message: "Pronto para a próxima repetição",
    level: "posture",
    totalReps: 0,
    correctReps: 0,
    event: null,
    side: "left",
  };
  const frame = (patch: Partial<AnalysisResult> = {}) =>
    workout.observe({ ...baseline, ...patch }, now);
  function advance(ms: number, patch: Partial<AnalysisResult> = {}) {
    for (let elapsed = 0; elapsed < ms; elapsed += 200) {
      now += 200;
      frame(patch);
      workout.tick();
    }
  }
  function run() {
    workout.begin();
    native.finish();
    workout.publish({ type: "phase", phase: "running" });
    frame();
    workout.tick();
    native.finish();
  }
  function repetition(total: number, issues: string[] = []) {
    frame();
    workout.publish({
      type: "repetition",
      total,
      event: {
        id: total,
        type: "repetition",
        correct: issues.length === 0,
        issues,
        timestamp: now,
      },
    });
    workout.tick();
  }
  return {
    native,
    queue,
    workout,
    frame,
    advance,
    run,
    repetition,
    now: () => now,
    setTime: (time: number) => {
      now = time;
    },
  };
}

describe("BrowserSpeech multilingual API contract (mock audio)", () => {
  for (const { code } of LANGUAGES) {
    test(`${code}: all seven reference phrases reach TTS in the selected language`, async () => {
      await i18n.changeLanguage(code);
      const native = installSpeech([voice(expectedCodes[code])]);
      const port = new BrowserSpeech(code);
      cleanups.push(port.connect(() => {}));
      for (const reference of VOICE_REFERENCES) {
        const values = "values" in reference ? reference.values : undefined;
        const text = translateVoice(reference.key, values);
        expect(text).toBe(expected(code, reference.key, values?.count));
        expect(text.trim()).not.toBe("");
        port.speak(text, 1, {
          start() {},
          end() {},
          error() {
            throw new Error("Unexpected TTS failure");
          },
        });
        expect(native.calls.at(-1)!.text).toBe(text);
        expect(native.calls.at(-1)!.lang).toBe(expectedCodes[code]);
        native.finish();
      }
      expect(native.calls).toHaveLength(7);
      expect(native.overlaps).toBe(0);
    });
    test(`${code}: exact speech code, translated instruction and async voices`, async () => {
      await i18n.changeLanguage(code);
      const native = installSpeech();
      const port = new BrowserSpeech(code);
      const availability: boolean[] = [];
      cleanups.push(port.connect((available) => availability.push(available)));
      expect(availability).toEqual([false]);
      // Browser voice discovery may complete after connection.
      await Promise.resolve();
      const exact = voice(expectedCodes[code]);
      native.setVoices([voice("nl-NL"), exact]);
      expect(availability).toEqual([false, true]);
      let started = 0,
        ended = 0,
        errors = 0;
      const text = expected(code, "Mantenha o corpo alinhado.");
      port.speak(text, 0.6, { start: () => started++, end: () => ended++, error: () => errors++ });
      expect(native.calls).toHaveLength(1);
      expect(native.calls[0]!.text).toBe(text);
      expect(native.calls[0]!.lang).toBe(expectedCodes[code]);
      expect(String(speechLanguage(code))).toBe(expectedCodes[code]);
      expect(native.calls[0]!.voice).toBe(exact);
      expect(native.calls[0]!.volume).toBe(0.6);
      expect(started).toBe(1);
      native.finish();
      expect(ended).toBe(1);
      expect(errors).toBe(0);
      expect(native.overlaps).toBe(0);
    });
    test(`${code}: absent compatible voice never speaks in another language`, () => {
      const native = installSpeech([voice("nl-NL")]);
      const port = new BrowserSpeech(code);
      const availability: boolean[] = [];
      cleanups.push(port.connect((available) => availability.push(available)));
      let errors = 0;
      port.speak("A written instruction remains available", 1, {
        start() {},
        end() {},
        error: () => errors++,
      });
      expect(availability).toEqual([false]);
      expect(native.calls).toHaveLength(0);
      expect(errors).toBe(1);
    });
  }
  test("prefers exact region, then local compatible base; ignores other languages", () => {
    const gb = voice("en-GB", true, true),
      usRemote = voice("en-US", false),
      usLocal = voice("en_US", true);
    expect(compatibleVoice([gb, usRemote], "en")).toBe(usRemote);
    expect(compatibleVoice([usRemote, gb, usLocal], "en")).toBe(usLocal);
    expect(compatibleVoice([voice("pt-PT"), gb], "en")).toBe(gb);
    expect(compatibleVoice([gb], "ja")).toBeUndefined();
    for (const { code } of LANGUAGES) {
      const sameBase = voice(`${code.split("-")[0]}-ZZ`);
      expect(compatibleVoice([voice("nl-NL"), sameBase], code)).toBe(sameBase);
    }
  });
  test("missing API is nonfatal, disconnect removes listeners, cancel detaches callbacks", () => {
    replaceGlobal("window", {});
    let available = true;
    new BrowserSpeech("en").connect((value) => {
      available = value;
    })();
    expect(available).toBe(false);
    const native = installSpeech([voice("en-US")]);
    const port = new BrowserSpeech("en");
    const disconnect = port.connect(() => {});
    let ended = 0;
    port.speak("Hello", 1, { start() {}, end: () => ended++, error() {} });
    const old = native.calls[0]!;
    port.cancel();
    expect(old.onstart).toBeNull();
    expect(old.onend).toBeNull();
    expect(old.onerror).toBeNull();
    native.finish();
    expect(ended).toBe(0);
    disconnect();
    expect(native.listeners.size).toBe(0);
  });
});

describe("exercise events → translated queue → browser TTS (mock audio)", () => {
  for (const { code } of LANGUAGES)
    test(`${code}: countdown, start, posture, repetition, hold and finish`, async () => {
      await i18n.changeLanguage(code);
      const f = fixture(code);
      f.workout.begin();
      expect(f.native.calls.at(-1)!.text).toBe(expected(code, "Voz ativada"));
      f.native.finish();
      f.workout.publish({ type: "phase", phase: "countdown" });
      f.workout.publish({ type: "countdown", value: 3 });
      f.workout.tick();
      expect(f.native.calls.at(-1)!.text).toBe(expected(code, "Três"));
      f.native.finish();
      f.workout.publish({ type: "phase", phase: "running" });
      f.frame();
      f.workout.tick();
      expect(f.native.calls.at(-1)!.text).toBe(expected(code, "Vamos começar!"));
      f.native.finish();
      f.advance(1600, { message: "Revise o alinhamento do corpo" });
      expect(f.native.calls.at(-1)!.text).toBe(expected(code, "Mantenha o corpo alinhado."));
      f.native.finish();
      f.repetition(5);
      expect(f.native.calls.at(-1)!.text).toBe(expected(code, "{{count}} repetições!", 5));
      f.native.finish();
      f.frame({ measurement: { type: "HOLD_BASED", valid: true, validMs: 15000 } });
      f.workout.tick();
      expect(f.native.calls.at(-1)!.text).toBe(
        expected(code, "{{count}} segundos em postura válida!", 15),
      );
      f.native.finish();
      f.workout.finish();
      expect(f.native.calls.at(-1)!.text).toBe(expected(code, "Treino encerrado"));
      expect(f.native.calls.every((call) => call.lang === expectedCodes[code])).toBe(true);
      expect(f.native.overlaps).toBe(0);
    });
  test("language change cancels active and pending speech and invalidates old callbacks", async () => {
    await i18n.changeLanguage("pt-BR");
    const f = fixture("pt-BR");
    f.run();
    f.repetition(5);
    const oldEnd = f.native.calls.at(-1)!.onend;
    f.repetition(10); // Waiting behind the current milestone.
    const before = f.native.calls.length;
    const cancellations = f.native.cancels;
    await i18n.changeLanguage("ja");
    f.workout.setLanguage("ja");
    expect(f.native.cancels).toBeGreaterThan(cancellations);
    oldEnd?.();
    f.workout.tick();
    expect(f.native.calls).toHaveLength(before);
    f.repetition(15);
    expect(f.native.calls.at(-1)!.text).toBe(expected("ja", "{{count}} repetições!", 15));
    expect(f.native.calls.at(-1)!.lang).toBe("ja-JP");
    expect(
      f.native.calls.some((call) => call.text === expected("pt-BR", "{{count}} repetições!", 10)),
    ).toBe(false);
    expect(f.native.overlaps).toBe(0);
  });
  test("switching to an unavailable language preserves workout flow and stays silent", async () => {
    await i18n.changeLanguage("en");
    const f = fixture("en");
    f.native.setVoices([voice("en-US")]);
    f.run();
    await i18n.changeLanguage("ko");
    f.workout.setLanguage("ko");
    const before = f.native.calls.length;
    f.repetition(5);
    f.advance(1600, { message: "Revise o alinhamento do corpo" });
    expect(f.queue.status).toBe("unavailable");
    expect(f.native.calls).toHaveLength(before);
    // Late voice discovery requires deliberate activation; it does not replay history.
    f.native.setVoices([voice("ko-KR")]);
    expect(f.queue.status).toBe("needs-activation");
    f.workout.tick();
    expect(f.native.calls).toHaveLength(before);
    f.queue.activate();
    expect(f.native.calls.at(-1)!.lang).toBe("ko-KR");
  });
  test("mute cancels speech independently of language and does not replay old milestones", async () => {
    await i18n.changeLanguage("de");
    const f = fixture("de");
    f.run();
    f.repetition(5);
    f.workout.configure({ ...DEFAULT_VOICE, enabled: false });
    expect(f.native.active).toBeNull();
    const before = f.native.calls.length;
    await i18n.changeLanguage("ar");
    f.workout.setLanguage("ar");
    f.repetition(10);
    f.queue.activate();
    expect(f.native.calls).toHaveLength(before);
    f.workout.configure(DEFAULT_VOICE);
    f.queue.activate();
    f.native.finish();
    f.repetition(10);
    expect(
      f.native.calls.some((call) => call.text === expected("ar", "{{count}} repetições!", 10)),
    ).toBe(false);
    f.repetition(15);
    expect(f.native.calls.at(-1)!.text).toBe(expected("ar", "{{count}} repetições!", 15));
  });
  test("persistent corrections require evidence and obey repeat throttling", async () => {
    await i18n.changeLanguage("es");
    const f = fixture("es");
    f.run();
    const patch = { message: "Revise o alinhamento do corpo" };
    const count = () =>
      f.native.calls.filter((call) => call.text === expected("es", "Mantenha o corpo alinhado."))
        .length;
    f.advance(1000, patch);
    expect(count()).toBe(0);
    f.advance(600, patch);
    expect(count()).toBe(1);
    f.native.finish();
    f.advance(8000, patch);
    expect(count()).toBe(1);
    f.advance(16000, patch);
    expect(count()).toBe(2);
    f.workout.publish({ type: "tracking-lost" });
    expect(f.native.active).toBeNull();
    expect(f.native.overlaps).toBe(0);
  });
  test("queue discards invalid, expired and duplicate instructions and limits pending work", async () => {
    await i18n.changeLanguage("fr");
    const f = fixture("fr");
    f.run();
    const message = (key: string, patch: Partial<VoiceMessage> = {}): VoiceMessage => ({
      key,
      text: key,
      priority: 60,
      expires: f.now() + 3000,
      valid: () => true,
      ...patch,
    });
    const before = f.native.calls.length;
    f.queue.offer(message("invalid", { valid: () => false }));
    f.queue.offer(message("expired", { expires: f.now() }));
    f.queue.offer(message("empty", { text: " " }));
    expect(f.native.calls).toHaveLength(before);
    f.queue.offer(message("active"));
    f.queue.offer(message("active"));
    for (let i = 0; i < 5; i++) f.queue.offer(message(`pending:${i}`));
    for (let i = 0; i < 4; i++) f.native.finish();
    expect(f.native.calls.filter((call) => call.text.startsWith("pending:"))).toHaveLength(3);
    expect(f.native.calls.filter((call) => call.text === "active")).toHaveLength(1);
    f.queue.offer(message("blocking"));
    f.queue.offer(message("stale"));
    f.setTime(4000);
    f.native.finish();
    expect(f.native.calls.some((call) => call.text === "stale")).toBe(false);
    expect(f.native.overlaps).toBe(0);
  });
  test("browser denial and playback errors block audio without throwing into workout analysis", async () => {
    await i18n.changeLanguage("hi");
    const f = fixture("hi");
    f.run();
    f.repetition(5);
    f.native.fail();
    expect(f.queue.status).toBe("blocked");
    expect(() => {
      f.frame();
      f.workout.tick();
    }).not.toThrow();
    const before = f.native.calls.length;
    f.repetition(10);
    expect(f.native.calls).toHaveLength(before);
    f.native.denySpeech();
    expect(() => f.queue.activate()).not.toThrow();
    expect(f.queue.status).toBe("blocked");
  });
});
