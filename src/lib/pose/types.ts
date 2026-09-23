import type { Landmark } from "../biomech";
export type PoseResult = { landmarks: Landmark[]; worldLandmarks?: Landmark[] };
export interface PoseEngine {
  readonly id: string;
  process(video: HTMLVideoElement, timestamp: number): Promise<PoseResult>;
  close(): Promise<void>;
}
