import type { ExerciseId, Landmark } from "../../src/lib/biomech";
const p = (x: number, y: number, visibility = 1): Landmark => ({ x, y, z: 0, visibility });
/** Explicit 2D landmarks for deterministic rule tests, not a validation dataset. */
export function pose(id: ExerciseId, angle: number): Landmark[] {
  const l = Array.from({ length: 33 }, () => p(0.5, 0.5, 0));
  const rad = (angle * Math.PI) / 180;
  for (const o of [0, 1]) {
    const set = (i: number, x: number, y: number) => {
      l[i + o] = p(x, y, o ? 0.8 : 1);
    };
    if (id === "bicepscurl") {
      set(11, 0.5, 0.2);
      set(13, 0.5, 0.4);
      set(15, 0.5 + 0.16 * Math.sin(rad), 0.4 - 0.16 * Math.cos(rad));
      set(23, 0.5, 0.65);
    } else if (id === "situp") {
      set(23, 0.4, 0.7);
      set(27, 0.75, 0.7);
      set(25, 0.57, 0.55);
      set(11, 0.4 + 0.22 * Math.cos(rad), 0.7 - 0.22 * Math.sin(rad));
    } else if (id === "lateralraise") {
      const x = o ? 0.6 : 0.4,
        dir = o ? 1 : -1;
      set(11, x, 0.3);
      set(23, x, 0.65);
      set(13, x + dir * 0.15 * Math.sin(rad), 0.3 + 0.15 * Math.cos(rad));
      set(15, x + dir * 0.3 * Math.sin(rad), 0.3 + 0.3 * Math.cos(rad));
    } else if (id === "plank") {
      set(11, 0.7, 0.4);
      set(13, 0.7, 0.55);
      set(15, 0.85, 0.55);
      set(23, 0.5, angle);
      set(25, 0.3, 0.4);
      set(27, 0.1, 0.4);
    } else if (id === "lunge") {
      set(11, o ? 0.3 : 0.5, 0.1);
      set(23, o ? 0.3 : 0.5, 0.3);
      set(25, o ? 0.2 : 0.5, 0.5);
      set(27, o ? 0.1 : 0.5 + 0.2 * Math.sin(rad), o ? 0.7 : 0.5 - 0.2 * Math.cos(rad));
    }
  }
  return l;
}
export function transform(
  landmarks: Landmark[],
  width: number,
  height: number,
  rotation = 0,
): Landmark[] {
  const r = (rotation * Math.PI) / 180;
  return landmarks.map((p) => {
    const x = p.x - 0.5,
      y = p.y - 0.5;
    return {
      ...p,
      x: 0.5 + ((x * Math.cos(r) - y * Math.sin(r)) * 600) / width,
      y: 0.5 + ((x * Math.sin(r) + y * Math.cos(r)) * 600) / height,
    };
  });
}
