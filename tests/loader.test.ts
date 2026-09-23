import { expect, test } from "bun:test";
import { loadScript } from "../src/lib/mediapipe";
test("falha de script limpa o elemento e permite novo download; chamadas simultâneas compartilham promessa", async () => {
  const old = Object.getOwnPropertyDescriptor(globalThis, "document");
  const nodes: Array<{
    onload: null | (() => void);
    onerror: null | (() => void);
    remove: () => void;
    removed: boolean;
  }> = [];
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      createElement: () => ({
        onload: null,
        onerror: null,
        removed: false,
        remove() {
          this.removed = true;
        },
      }),
      head: { appendChild: (el: (typeof nodes)[number]) => nodes.push(el) },
    },
  });
  try {
    const a = loadScript("https://example.test/pose.js", 100);
    const duplicate = loadScript("https://example.test/pose.js", 100);
    expect(duplicate).toBe(a);
    nodes[0]!.onerror!();
    await expect(a).rejects.toThrow();
    expect(nodes[0]!.removed).toBe(true);
    const retry = loadScript("https://example.test/pose.js", 100);
    expect(nodes.length).toBe(2);
    nodes[1]!.onload!();
    await retry;
    const timeout = loadScript("https://example.test/timeout.js", 5);
    await expect(timeout).rejects.toThrow();
    expect(nodes[2]!.removed).toBe(true);
  } finally {
    if (old) Object.defineProperty(globalThis, "document", old);
    else Reflect.deleteProperty(globalThis, "document");
  }
});
