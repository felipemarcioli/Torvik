export * from "./exercises/core";
export { SquatAnalyzer, PushUpAnalyzer, JumpingJackAnalyzer } from "./exercises/legacy";
export { createAnalyzer } from "./exercises/analyzers";
export const POSE_CONNECTIONS: [number, number][] = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
  [27, 31],
  [28, 32],
  [27, 29],
  [28, 30],
  [29, 31],
  [30, 32],
  [0, 11],
  [0, 12],
];
