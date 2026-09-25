import { describe, expect, test } from "bun:test";
import {
  DEFAULT_VOICE,
  localPortugueseVoice,
  readVoiceSettings,
  SpeechQueue,
  type SpeechPort,
  type VoiceMessage,
} from "../src/lib/voice/speech";
import { WorkoutVoice } from "../src/lib/voice/workout-voice";
import type { AnalysisResult } from "../src/lib/biomech";
class FakeSpeech implements SpeechPort {
  available = true;
  calls: { text: string; volume: number; callbacks: Parameters<SpeechPort["speak"]>[2] }[] = [];
  cancels = 0;
  disconnects = 0;
  change = (_: boolean) => {};
  connect(change: (available: boolean) => void) {
    this.change = change;
    change(this.available);
    return () => this.disconnects++;
  }
  speak(text: string, volume: number, callbacks: Parameters<SpeechPort["speak"]>[2]) {
    this.calls.push({ text, volume, callbacks });
    callbacks.start();
  }
  cancel() {
    this.cancels++;
  }
  end() {
    this.calls.at(-1)?.callbacks.end();
  }
}
function fixture() {
  let time = 0;
  const port = new FakeSpeech(),
    queue = new SpeechQueue(port, () => time),
    voice = new WorkoutVoice(queue, () => time);
  queue.connect();
  voice.begin();
  port.end();
  const result: AnalysisResult = {
    message: "Pronto para a próxima repetição",
    level: "posture",
    state: "standing",
    tracking: true,
    ready: true,
    totalReps: 0,
    correctReps: 0,
    event: null,
    side: "left",
  };
  const frame = (patch: Partial<AnalysisResult> = {}) =>
    voice.observe({ ...result, ...patch }, time);
  const advance = (ms: number, patch: Partial<AnalysisResult> = {}) => {
    for (let t = 0; t < ms; t += 200) {
      time += 200;
      frame(patch);
      voice.tick();
    }
  };
  const run = () => {
    voice.publish({ type: "phase", phase: "running" });
    frame();
    voice.tick();
    port.end();
  };
  const rep = (id: number, issues: string[] = [], total = id) => {
    frame();
    voice.publish({
      type: "repetition",
      total,
      event: { id, type: "repetition", correct: !issues.length, issues, timestamp: time },
    });
    voice.tick();
    port.end();
  };
  return {
    port,
    queue,
    voice,
    frame,
    advance,
    run,
    rep,
    now: () => time,
    setTime: (value: number) => (time = value),
  };
}
test("preferência somente por vozes locais em português e configuração inválida", () => {
  const v = (lang: string, localService: boolean) =>
    ({ lang, localService }) as SpeechSynthesisVoice;
  const pt = v("pt-PT", true),
    br = v("pt-BR", true);
  expect(localPortugueseVoice([v("pt-BR", false), v("en-US", true)])).toBeUndefined();
  expect(localPortugueseVoice([pt, br])).toBe(br);
  expect(localPortugueseVoice([pt])).toBe(pt);
  expect(
    readVoiceSettings({
      getItem: () => {
        throw Error();
      },
    }),
  ).toEqual(DEFAULT_VOICE);
  expect(
    readVoiceSettings({ getItem: () => '{"volume":9,"mode":"invalid","enabled":false}' }),
  ).toEqual({ enabled: false, mode: "full", volume: 1 });
});
describe("gerenciador de fala", () => {
  test("prioridade, fila limitada, expiração e callbacks antigos", () => {
    const f = fixture();
    const msg = (key: string, priority: number, common = false): VoiceMessage => ({
      key,
      text: key,
      priority,
      common,
      expires: f.now() + 3000,
      valid: () => true,
    });
    f.queue.offer(msg("correction", 20, true));
    const old = f.port.calls.at(-1)!.callbacks;
    f.queue.offer(msg("start", 100));
    expect(f.port.calls.at(-1)!.text).toBe("start");
    old.end();
    expect(f.port.calls.at(-1)!.text).toBe("start");
    for (let i = 0; i < 5; i++) f.queue.offer(msg(`queued${i}`, 60));
    f.port.end();
    f.port.end();
    f.port.end();
    f.port.end();
    expect(f.port.calls.filter((c) => c.text.startsWith("queued"))).toHaveLength(3);
    f.queue.offer(msg("blocking", 100));
    f.queue.offer(msg("expired", 60));
    f.setTime(4000);
    f.port.end();
    expect(f.port.calls.some((c) => c.text === "expired")).toBe(false);
  });
  test("vozes tardias exigem novo gesto e falhas não repetem automaticamente", () => {
    const f = fixture();
    f.port.change(false);
    f.queue.activate();
    const count = f.port.calls.length;
    f.port.change(true);
    expect(f.queue.status).toBe("needs-activation");
    f.queue.tick();
    expect(f.port.calls).toHaveLength(count);
    f.queue.activate();
    f.port.calls.at(-1)!.callbacks.error();
    expect(f.queue.status).toBe("blocked");
    f.queue.tick();
    expect(f.port.calls).toHaveLength(count + 1);
    f.queue.activate();
    expect(f.queue.status).toBe("ready");
    f.queue.dispose();
    expect(f.port.disconnects).toBe(1);
  });
  test("watchdog de início, volume e modo básico", () => {
    const f = fixture();
    f.port.speak = (text, volume, callbacks) => {
      f.port.calls.push({ text, volume, callbacks });
    };
    f.queue.activate();
    f.setTime(3200);
    f.queue.tick();
    expect(f.queue.status).toBe("blocked");
    f.queue.configure({ ...DEFAULT_VOICE, volume: 0.4 });
    f.queue.activate();
    expect(f.port.calls.at(-1)!.volume).toBe(0.4);
    f.queue.configure({ ...DEFAULT_VOICE, volume: 0 });
    const count = f.port.calls.length;
    f.queue.activate();
    expect(f.port.calls).toHaveLength(count);
    f.queue.configure({ ...DEFAULT_VOICE, mode: "basic" });
    f.queue.offer({
      key: "correction",
      text: "No",
      priority: 20,
      common: true,
      expires: 9000,
      valid: () => true,
    });
    expect(f.port.calls).toHaveLength(count);
  });
});
describe("política do treino", () => {
  test("marcos são únicos, sem retrospectiva ao ativar e sem perder total em pausa", () => {
    const f = fixture();
    f.run();
    f.rep(5);
    f.rep(5);
    expect(f.port.calls.filter((c) => c.text === "5 repetições!")).toHaveLength(1);
    f.voice.configure({ ...DEFAULT_VOICE, enabled: false });
    f.rep(10);
    f.voice.configure(DEFAULT_VOICE);
    f.queue.activate();
    f.port.end();
    f.rep(10);
    f.rep(15);
    expect(f.port.calls.some((c) => c.text === "10 repetições!")).toBe(false);
    expect(f.port.calls.some((c) => c.text === "15 repetições!")).toBe(true);
    f.voice.publish({ type: "interrupt" });
    f.voice.publish({ type: "phase", phase: "paused" });
    f.voice.tick();
    f.run();
    f.rep(15);
    expect(f.port.calls.filter((c) => c.text === "15 repetições!")).toHaveLength(1);
  });
  test("postura requer estabilidade, respeita intervalos e ignora orientação visual de descida", () => {
    const f = fixture();
    f.run();
    const patch = { message: "Revise o alinhamento do corpo" };
    f.advance(1000, patch);
    expect(f.port.calls.some((c) => c.text === "Mantenha o corpo alinhado.")).toBe(false);
    f.advance(600, patch);
    expect(f.port.calls.filter((c) => c.text === "Mantenha o corpo alinhado.")).toHaveLength(1);
    f.port.end();
    f.advance(8000, patch);
    expect(f.port.calls.filter((c) => c.text === "Mantenha o corpo alinhado.")).toHaveLength(1);
    f.advance(16000, patch);
    expect(f.port.calls.filter((c) => c.text === "Mantenha o corpo alinhado.")).toHaveLength(2);
    f.port.end();
    f.advance(26000, { message: "Continue a descida com controle" });
    expect(f.port.calls.filter((c) => c.text.includes("amplitude"))).toHaveLength(0);
  });
  test("amplitude requer duas repetições consecutivas e rastreamento perdido reinicia evidência", () => {
    const f = fixture();
    f.run();
    const issues = ["Amplie a descida do agachamento"];
    f.rep(1, issues);
    expect(f.port.calls.some((c) => c.text.includes("amplitude"))).toBe(false);
    f.rep(2, issues);
    expect(f.port.calls.filter((c) => c.text.includes("amplitude"))).toHaveLength(1);
    f.advance(25000);
    f.voice.publish({ type: "tracking-lost" });
    f.voice.tick();
    f.rep(3, issues);
    expect(f.port.calls.filter((c) => c.text.includes("amplitude"))).toHaveLength(1);
  });
  test("contagem cancelada não acumula números e retomada não duplica início", () => {
    const f = fixture();
    f.voice.publish({ type: "phase", phase: "countdown" });
    f.voice.publish({ type: "countdown", value: 3 });
    f.voice.tick();
    f.port.end();
    f.voice.tick();
    expect(f.port.calls.filter((c) => c.text === "Três")).toHaveLength(1);
    f.voice.publish({ type: "phase", phase: "preparing" });
    f.voice.tick();
    f.voice.publish({ type: "phase", phase: "countdown" });
    f.voice.publish({ type: "countdown", value: 3 });
    f.voice.tick();
    expect(f.port.calls.filter((c) => c.text === "Três")).toHaveLength(1);
    f.run();
    f.run();
    expect(f.port.calls.filter((c) => c.text === "Vamos começar!")).toHaveLength(1);
    f.voice.publish({ type: "phase", phase: "paused" });
    f.voice.tick();
    f.run();
    expect(f.port.calls.at(-1)!.text).toBe("Vamos continuar!");
  });
  test("perda sustentada e frames desatualizados não geram correção de articulações", () => {
    const f = fixture();
    f.run();
    f.advance(1000, { tracking: false });
    expect(f.port.calls.some((c) => c.text.includes("enquadramento"))).toBe(false);
    f.advance(1000, { tracking: false });
    expect(f.port.calls.some((c) => c.text.includes("enquadramento"))).toBe(true);
    f.frame({ message: "Revise a inclinação do tronco" });
    f.setTime(f.now() + 2000);
    f.voice.tick();
    expect(f.port.calls.some((c) => c.text.includes("tronco"))).toBe(false);
  });
  test("encerramento sobrevive à tela de treino mas cancela ao sair ou começar nova sessão", () => {
    const f = fixture();
    f.run();
    f.voice.finish();
    expect(f.port.calls.at(-1)!.text).toBe("Treino encerrado");
    const old = f.port.calls.at(-1)!.callbacks;
    f.voice.stop();
    old.end();
    const count = f.port.calls.length;
    f.voice.tick();
    expect(f.port.calls).toHaveLength(count);
    f.voice.begin();
    f.port.end();
    f.run();
    f.rep(5);
    expect(f.port.calls.at(-1)!.text).toBe("5 repetições!");
  });
});

test("remontagem do controlador remove conexão anterior e descarta callbacks", () => {
  const f = fixture();
  f.queue.activate();
  const old = f.port.calls.at(-1)!.callbacks;
  f.voice.stop();
  f.queue.dispose();
  f.queue.connect();
  f.voice.begin();
  old.error();
  expect(f.queue.status).toBe("ready");
  expect(f.port.disconnects).toBe(1);
  f.port.end();
  f.run();
  f.rep(5);
  expect(f.port.calls.filter((c) => c.text === "5 repetições!")).toHaveLength(1);
});

test("oito segundos entre orientações distintas, básico cancela orientação e dados desconhecidos ficam silenciosos", () => {
  const f = fixture();
  f.run();
  f.rep(1, ["Amplie a descida da flexão"]);
  f.rep(2, ["Amplie a descida da flexão"]);
  f.rep(3, ["Abra mais as pernas"]);
  f.rep(4, ["Abra mais as pernas"]);
  expect(f.port.calls.filter((c) => c.text === "Abra mais as pernas.")).toHaveLength(0);
  f.advance(8200);
  f.rep(6, ["Abra mais as pernas"]);
  expect(f.port.calls.filter((c) => c.text === "Abra mais as pernas.")).toHaveLength(1);
  const cancelled = f.port.cancels;
  f.voice.configure({ ...DEFAULT_VOICE, mode: "basic" });
  f.advance(30000, { message: "Revise o alinhamento do corpo" });
  expect(f.port.calls.some((c) => c.text === "Mantenha o corpo alinhado.")).toBe(false);
  expect(f.port.cancels).toBeGreaterThanOrEqual(cancelled);
  f.voice.configure(DEFAULT_VOICE);
  f.rep(7, ["Problema desconhecido"]);
  f.rep(8, ["Problema desconhecido"]);
  expect(f.port.calls.some((c) => c.text.includes("desconhecido"))).toBe(false);
});
test("prancha anuncia marcos de tempo uma vez, sem retrospectiva e respeita pausa", () => {
  const f = fixture();
  f.run();
  const held = (seconds: number) => ({
    measurement: { type: "HOLD_BASED" as const, valid: true, validMs: seconds * 1000 },
    message: "Boa postura. Continue assim.",
  });
  f.frame(held(15));
  f.voice.tick();
  f.port.end();
  f.frame(held(15.5));
  f.voice.tick();
  expect(f.port.calls.filter((c) => c.text === "15 segundos em postura válida!")).toHaveLength(1);
  f.voice.configure({ ...DEFAULT_VOICE, enabled: false });
  f.frame(held(30));
  f.voice.tick();
  f.voice.configure(DEFAULT_VOICE);
  f.frame(held(31));
  f.voice.tick();
  expect(f.port.calls.some((c) => c.text.startsWith("30 segundos"))).toBe(false);
  f.queue.activate();
  f.port.end();
  f.frame(held(45));
  f.voice.tick();
  f.port.end();
  expect(f.port.calls.filter((c) => c.text.startsWith("45 segundos"))).toHaveLength(1);
  f.voice.publish({ type: "phase", phase: "paused" });
  f.voice.tick();
  f.voice.publish({ type: "phase", phase: "running" });
  f.frame(held(45));
  f.voice.tick();
  f.port.end();
  expect(f.port.calls.filter((c) => c.text.startsWith("45 segundos"))).toHaveLength(1);
});
test("novas correções usam a evidência temporal existente e ficam silenciosas no básico", () => {
  const f = fixture();
  f.run();
  const issue = { message: "Mantenha o braço próximo ao tronco", level: "posture" as const };
  f.advance(1000, issue);
  expect(f.port.calls.some((c) => c.text === issue.message + ".")).toBe(false);
  f.advance(600, issue);
  expect(f.port.calls.some((c) => c.text === issue.message + ".")).toBe(true);
  f.port.end();
  f.voice.configure({ ...DEFAULT_VOICE, mode: "basic" });
  f.advance(30000, { message: "Eleve um pouco o quadril", level: "posture" });
  expect(f.port.calls.some((c) => c.text === "Eleve um pouco o quadril.")).toBe(false);
});
