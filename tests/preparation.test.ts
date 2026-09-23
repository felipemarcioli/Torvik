import { expect, test } from "bun:test";
import { PreparationStart } from "../src/lib/preparation";
function visible(gate: PreparationStart, from: number, to: number) {
  for (let now = from; now <= to; now += 100) gate.observe(true, now);
}
test("dois segundos contínuos iniciam cinco segundos e o treino só inicia uma vez", () => {
  const gate = new PreparationStart();
  visible(gate, 0, 1900);
  expect(gate.phase).toBe("preparing");
  gate.observe(true, 2000);
  expect(gate.phase).toBe("countdown");
  expect(gate.remaining(2000)).toBe(5);
  visible(gate, 2100, 6900);
  expect(gate.tick(6999)).toBe("countdown");
  gate.observe(true, 7000);
  expect(gate.tick(7000)).toBe("running");
  gate.manual(7100);
  gate.observe(false, 7200);
  expect(gate.tick(20000)).toBe("running");
});
test("perda de pontos cancela contagem e exige novamente dois segundos", () => {
  const gate = new PreparationStart();
  visible(gate, 0, 2000);
  gate.observe(false, 2100);
  expect(gate.phase).toBe("preparing");
  visible(gate, 2200, 4100);
  expect(gate.phase).toBe("preparing");
  gate.observe(true, 4200);
  expect(gate.remaining(4200)).toBe(5);
  expect(gate.phase).toBe("countdown");
});
test("manual funciona fora do quadro e não inicia sessão sem rastreamento", () => {
  const gate = new PreparationStart();
  gate.observe(false, 0);
  gate.manual(0);
  for (let now = 100; now <= 5000; now += 100) gate.observe(false, now);
  expect(gate.phase).toBe("countdown");
  expect(gate.tick(5000)).toBe("preparing");
  gate.manual(5100);
  visible(gate, 5500, 10000);
  expect(gate.tick(10100)).toBe("running");
});
test("manual ignora cliques repetidos e cancela se perder corpo já detectado", () => {
  const gate = new PreparationStart();
  gate.manual(0);
  gate.manual(1000);
  expect(gate.remaining(1000)).toBe(4);
  gate.observe(true, 1000);
  gate.observe(false, 1100);
  expect(gate.phase).toBe("preparing");
});
test("frames interrompidos não acumulam estabilidade nem concluem contagem", () => {
  const gate = new PreparationStart();
  visible(gate, 0, 1000);
  gate.observe(true, 2000);
  expect(gate.phase).toBe("preparing");
  visible(gate, 2100, 4000);
  expect(gate.phase).toBe("countdown");
  expect(gate.tick(5000)).toBe("preparing");
});
test("reset em cancelamento, pausa ou troca descarta prazo antigo", () => {
  const gate = new PreparationStart();
  visible(gate, 0, 2000);
  gate.reset();
  expect(gate.tick(7000)).toBe("preparing");
  visible(gate, 7100, 9000);
  expect(gate.phase).toBe("preparing");
  gate.observe(true, 9100);
  expect(gate.remaining(9100)).toBe(5);
});
