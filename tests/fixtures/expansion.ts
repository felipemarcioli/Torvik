import type { Landmark } from "../../src/lib/biomech";
import type { NewExerciseId } from "../../src/lib/exercises/expansion";
export const NEW_IDS: NewExerciseId[] = [
  "glutebridge",
  "calfraise",
  "reverselunge",
  "shoulderpress",
  "frontraise",
  "bentoverrow",
  "tricepskickback",
  "mountainclimber",
];
export type Stage = "base" | "entry" | "target" | "partial" | "step";
/** Independent synthetic landmarks; not recordings or evidence of real-world accuracy. */
export function expansionPose(
  id: NewExerciseId,
  stage: Stage,
  actor: "left" | "right" = "left",
): Landmark[] {
  const l = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0 }));
  const t =
    stage === "base"
      ? 0
      : stage === "step"
        ? 0.15
        : stage === "entry"
          ? 0.5
          : stage === "partial"
            ? id === "mountainclimber"
              ? 0.45
              : 0.65
            : 1;
  const set = (i: number, x: number, y: number) => {
    l[i] = { x, y, z: 0, visibility: i % 2 === 0 ? 0.9 : 1 };
  };
  for (const o of [0, 1]) {
    const p = (i: number, x: number, y: number) => set(i + o, x, y);
    if (id === "glutebridge") {
      p(11, 0.15, 0.72);
      p(23, 0.35 + 0.01 * t, 0.8 - 0.22 * t);
      p(25, 0.6, 0.45);
      p(27, 0.7, 0.8);
    } else if (id === "calfraise") {
      p(11, 0.5, 0.15 - 0.03 * t);
      p(23, 0.5, 0.45 - 0.03 * t);
      p(25, 0.5, 0.65 - 0.03 * t);
      p(27, 0.5, 0.82 - 0.03 * t);
      p(29, 0.47, 0.88 - 0.08 * t);
      p(31, 0.6, 0.88);
    } else if (id === "shoulderpress") {
      const sign = o ? 1 : -1,
        x = o ? 0.6 : 0.4;
      p(11, x, 0.4);
      p(23, x, 0.72);
      p(13, x + sign * 0.13 * (1 - t), 0.4 - 0.16 * t);
      p(15, x + sign * 0.13 * (1 - t), 0.27 - 0.19 * t);
    } else if (id === "frontraise") {
      const rad = (t * Math.PI) / 2;
      set(0, 0.58, 0.18);
      p(11, 0.5, 0.3);
      p(23, 0.5, 0.65);
      p(13, 0.5 + 0.18 * Math.sin(rad), 0.3 + 0.18 * Math.cos(rad));
      p(15, 0.5 + 0.36 * Math.sin(rad), 0.3 + 0.36 * Math.cos(rad));
    } else if (id === "bentoverrow") {
      p(11, 0.6, 0.3);
      p(23, 0.35, 0.55);
      p(25, 0.38, 0.78);
      const arm = -Math.PI / 2 + t * 0.75; // elbow moves backward toward the hip
      const ex = 0.6 + Math.cos(arm) * -0.18,
        ey = 0.3 - Math.sin(arm) * 0.18;
      p(13, ex, ey);
      // forearm rotates from down to forward/up, elbow goes from 180 to 70 degrees.
      const forearm = Math.PI / 2 + t * (0.75 - (110 * Math.PI) / 180);
      p(15, ex + Math.cos(forearm) * 0.18, ey + Math.sin(forearm) * 0.18);
    } else if (id === "tricepskickback") {
      p(11, 0.6, 0.3);
      p(23, 0.35, 0.55);
      p(25, 0.38, 0.78);
      const ex = 0.46,
        ey = 0.44,
        theta = Math.PI / 4 + (t * Math.PI) / 2;
      p(13, ex, ey);
      p(15, ex + 0.17 * Math.cos(theta), ey + 0.17 * Math.sin(theta));
    } else if (id === "reverselunge") {
      const back = o === 1,
        stepped = stage !== "base",
        bent = stage === "target" ? 1 : stage === "partial" ? 0.14 : stage === "entry" ? 0.1 : 0;
      const hipX = stepped ? 0.5 : 0.55,
        hipY = (stepped ? 0.34 : 0.27) + 0.24 * bent,
        ankleX = back && stepped ? 0.27 : 0.58,
        ankleY = 0.86;
      p(11, hipX, hipY - 0.25);
      p(23, hipX, hipY);
      // Two-link inverse kinematics keeps leg length fixed across the step and descent.
      const dx = ankleX - hipX,
        dy = ankleY - hipY,
        dist = Math.hypot(dx, dy),
        half = dist / 2;
      const offset = Math.sqrt(Math.max(0, 0.3 * 0.3 - half * half));
      p(25, (hipX + ankleX) / 2 + (dy / dist) * offset, (hipY + ankleY) / 2 - (dx / dist) * offset);
      p(27, ankleX, ankleY);
      p(29, ankleX - 0.025, ankleY + 0.015);
      p(31, ankleX + 0.09, ankleY + 0.015);
    } else {
      const moving = (actor === "left" ? 0 : 1) === o;
      const r = moving ? t : 0;
      p(11, 0.7, 0.35);
      p(13, 0.7, 0.52);
      p(15, 0.7, 0.7);
      p(23, 0.45, 0.35);
      p(25, 0.25 + 0.37 * r, 0.35 + 0.15 * r);
      p(27, 0.05 + 0.38 * r, 0.35 + 0.23 * r);
    }
  }
  return l;
}
