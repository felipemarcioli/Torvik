import type { Landmark } from "../../src/lib/biomech";
import type { AdditionId } from "../../src/lib/exercises/additions";
export type Stage = "base" | "entry" | "target" | "partial" | "air" | "landing" | "left" | "right";
/** Independently constructed skeletons, not recordings or calibration data. Coordinates in square-frame units. */
export function catalogPose(
  id: AdditionId,
  stage: Stage,
  actor: "left" | "right" = "left",
): Landmark[] {
  const l: Landmark[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0 }));
  const set = (i: number, x: number, y: number) => {
    l[i] = { x, y, z: 0, visibility: 1 };
  };
  const amount = stage === "base" ? 0 : stage === "entry" ? 0.5 : stage === "partial" ? 0.55 : 1;
  const rad = (d: number) => (d * Math.PI) / 180;
  const limb = (
    root: number,
    joint: number,
    tip: number,
    direction: number,
    size: number,
    angle: number,
    sign = 1,
  ) => {
    const p = l[root]!;
    set(joint, p.x + size * Math.cos(direction), p.y + size * Math.sin(direction));
    const q = l[joint]!,
      next = direction + sign * (Math.PI - rad(angle));
    set(tip, q.x + size * Math.cos(next), q.y + size * Math.sin(next));
  };
  for (const o of [0, 1]) {
    const moving = (actor === "left" ? 0 : 1) === o;
    set(11 + o, 0.5, 0.2);
    set(23 + o, 0.5, 0.45);
    set(25 + o, 0.5, 0.65);
    set(27 + o, 0.5, 0.85);
    set(13 + o, 0.5, 0.35);
    set(15 + o, 0.5, 0.5);
    set(29 + o, 0.48, 0.88);
    set(31 + o, 0.56, 0.88);
    if (id === "romaniandeadlift") {
      const angle = rad(amount * 75);
      set(11 + o, 0.5 + 0.25 * Math.sin(angle), 0.45 - 0.25 * Math.cos(angle));
      limb(11 + o, 13 + o, 15 + o, Math.PI / 2, 0.15, 180);
    } else if (id === "bulgariansquat") {
      const kneeAngle = 180 - amount * 90,
        dist = 0.52 * Math.sin(rad(kneeAngle / 2)),
        hy = 0.87 - Math.sqrt(dist * dist - 0.03 * 0.03);
      set(23 + o, 0.52, hy);
      set(11 + o, 0.52, hy - 0.22);
      if (moving) {
        const dx = 0.03,
          dy = 0.87 - hy,
          n = Math.hypot(dx, dy),
          off = Math.sqrt(0.26 * 0.26 - (n * n) / 4);
        set(25 + o, 0.535 + (dy / n) * off, (hy + 0.87) / 2 - (dx / n) * off);
        set(27 + o, 0.55, 0.87);
      } else {
        set(25 + o, 0.3, hy + 0.1);
        set(27 + o, 0.22, 0.72);
      }
    } else if (id === "floorpress") {
      set(11 + o, 0.3, 0.72);
      set(23 + o, 0.55, 0.72);
      set(25 + o, 0.68, 0.53);
      set(27 + o, 0.8, 0.72);
      limb(11 + o, 13 + o, 15 + o, -rad(10 + amount * 80), 0.17, 90 + amount * 90, -1);
    } else if (id === "lyinglegraise") {
      set(11 + o, 0.2, 0.7);
      set(23 + o, 0.45, 0.7);
      limb(23 + o, 25 + o, 27 + o, -rad(amount * 90), 0.21, 180);
    } else if (id === "deadbug" || id === "birddog") {
      const supine = id === "deadbug",
        sign = supine ? -1 : 1,
        v = moving ? amount : 0;
      set(11 + o, 0.65, 0.55);
      set(23 + o, 0.4, 0.55);
      const thigh = sign * rad(90 + v * 90);
      limb(23 + o, 25 + o, 27 + o, thigh, 0.16, 90 + v * 90, sign);
      const armAmount = moving ? 0 : amount;
      // Actor denotes the extending LEG; the opposite arm extends away from the hip.
      limb(11 + o, 13 + o, 15 + o, sign * rad(90 - armAmount * 90), 0.16, 180);
    } else if (id === "shouldertap") {
      const sx = o ? 0.56 : 0.44;
      set(11 + o, sx, 0.35);
      set(23 + o, sx, 0.58);
      set(25 + o, sx, 0.74);
      set(27 + o, sx, 0.91);
      // Front oblique projection: torso extends in x as well as depth.
      set(23 + o, sx - 0.24, 0.39);
      set(25 + o, sx - 0.4, 0.42);
      set(27 + o, sx - 0.55, 0.44);
      set(13 + o, sx, 0.51);
      set(15 + o, sx, 0.67);
      if (moving) {
        const otherX = o ? 0.44 : 0.56;
        set(15 + o, sx + (otherX - sx) * amount, 0.67 - 0.32 * amount);
        set(13 + o, sx + 0.04 * amount, 0.51 - 0.03 * amount);
      }
    } else if (id === "highknees") {
      const x = o ? 0.58 : 0.42;
      set(11 + o, x, 0.15);
      set(23 + o, x, 0.4);
      if (moving) {
        const dir = rad(90 - amount * 90);
        limb(23 + o, 25 + o, 27 + o, dir, 0.23, 180 - amount * 90, 1);
      } else limb(23 + o, 25 + o, 27 + o, Math.PI / 2, 0.23, 180);
    } else if (id === "buttkicks") {
      const x = o ? 0.53 : 0.47;
      set(11 + o, x, 0.15);
      set(23 + o, x, 0.4);
      limb(23 + o, 25 + o, 27 + o, Math.PI / 2, 0.23, 180 - (moving ? amount : 0) * 125, 1);
    } else if (id === "stepjack") {
      const x = o ? 0.55 : 0.45,
        move = moving ? amount : 0,
        sign = o ? 1 : -1;
      set(11 + o, x, 0.28);
      set(23 + o, x, 0.53);
      set(25 + o, x + sign * move * 0.08, 0.69);
      set(27 + o, 0.5 + sign * 0.025 + sign * move * 0.2, 0.88);
      limb(11 + o, 13 + o, 15 + o, rad(90 - sign * amount * 180), 0.18, 180);
    } else if (id === "jumpsquat") {
      const angle =
        stage === "target" ? 90 : stage === "entry" ? 125 : stage === "landing" ? 130 : 180;
      const air = stage === "air" ? 0.1 : 0,
        dist = 0.5 * Math.sin(rad(angle / 2)),
        hy = 0.87 - air - dist;
      set(23 + o, 0.5, hy);
      set(11 + o, 0.5, hy - 0.23);
      set(25 + o, 0.5 + 0.25 * Math.cos(rad(angle / 2)), hy + dist / 2);
      set(27 + o, 0.5, 0.87 - air);
      set(29 + o, 0.48, 0.89 - air);
      set(31 + o, 0.57, 0.89 - air);
    } else if (id === "skater") {
      const shift = stage === "right" ? 0.22 : stage === "left" ? -0.22 : 0,
        x = 0.5 + shift;
      set(11 + o, x + (o ? 0.05 : -0.05), 0.2);
      set(23 + o, x + (o ? 0.05 : -0.05), 0.45);
      const support = stage === "right" ? 1 : 0;
      set(25 + o, x + (o === support ? 0.1 : -0.02), 0.64);
      set(27 + o, x + (o === support ? 0.03 : support === 1 ? 0.09 : -0.03), 0.84);
    } else if (id === "wallsit") {
      set(11 + o, 0.4, 0.2);
      set(23 + o, 0.4, 0.45);
      set(25 + o, 0.65, 0.45);
      set(27 + o, 0.65, 0.7);
      if (stage === "partial") {
        set(25 + o, 0.4, 0.63);
        set(27 + o, 0.4, 0.82);
      }
    } else if (id === "sideplank") {
      const support = (actor === "left" ? 0 : 1) === o;
      set(11 + o, 0.7, support ? 0.45 : 0.32);
      set(23 + o, 0.46, support ? 0.45 : 0.32);
      set(25 + o, 0.26, support ? 0.45 : 0.32);
      set(27 + o, 0.06, support ? 0.45 : 0.32);
      set(13 + o, 0.7, support ? 0.62 : 0.15);
      set(15 + o, 0.85, support ? 0.62 : 0.15);
      if (stage === "partial") set(23 + o, 0.46, support ? 0.62 : 0.49);
    }
  }
  return l;
}
