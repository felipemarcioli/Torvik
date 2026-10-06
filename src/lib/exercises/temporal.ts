/** Engineering defaults. Tune against consented, annotated recordings per exercise. */
export const MODERN_TIMING = {
  baselineMs: 300,
  transitionMs: 90,
  targetMs: 70,
  returnMs: 90,
  smoothingMs: 45,
  holdStableMs: 500,
  holdGraceMs: 250,
  maxGapMs: 500,
} as const;
export class Confirmations {
  private evidence = new Map<string, { start: number; last: number; samples: number }>();
  clear() {
    this.evidence.clear();
  }
  check(key: string, condition: boolean, now: number, duration: number) {
    if (!condition) {
      this.evidence.delete(key);
      return false;
    }
    const e = this.evidence.get(key) ?? { start: now, last: -Infinity, samples: 0 };
    if (now > e.last) {
      e.samples++;
      e.last = now;
    }
    this.evidence.set(key, e);
    return e.samples >= 2 && now - e.start >= duration;
  }
}
/** Smooth derived geometry only. Reset on interruption; duplicate timestamps never add evidence. */
export class MeasureFilter {
  private values = new Map<string, { value: number; at: number }>();
  clear() {
    this.values.clear();
  }
  value(key: string, value: number, now: number) {
    const previous = this.values.get(key);
    if (previous && now <= previous.at) return previous.value;
    const alpha = previous ? 1 - Math.exp(-(now - previous.at) / MODERN_TIMING.smoothingMs) : 1;
    const next = previous ? previous.value + alpha * (value - previous.value) : value;
    this.values.set(key, { value: next, at: now });
    return next;
  }
}
