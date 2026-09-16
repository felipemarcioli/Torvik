// Biomechanics analyzers — faithful TS port of the reference Python logic.

export type Landmark = { x: number; y: number; z: number; visibility: number };

export const VIS_THRESHOLD = 0.5;

// MediaPipe Pose landmark indices
export const LM = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const;

/** Angle (degrees) at vertex b formed by a-b-c, via dot product + arccos. */
export function calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const ba = { x: a.x - b.x, y: a.y - b.y };
  const bc = { x: c.x - b.x, y: c.y - b.y };
  const dot = ba.x * bc.x + ba.y * bc.y;
  const magBA = Math.hypot(ba.x, ba.y);
  const magBC = Math.hypot(bc.x, bc.y);
  if (magBA === 0 || magBC === 0) return 0;
  const cosine = Math.min(1, Math.max(-1, dot / (magBA * magBC)));
  return (Math.acos(cosine) * 180) / Math.PI;
}

/** Trunk inclination relative to the vertical axis, in degrees. */
export function verticalInclination(top: Landmark, bottom: Landmark): number {
  const dx = top.x - bottom.x;
  const dy = top.y - bottom.y;
  const mag = Math.hypot(dx, dy);
  if (mag === 0) return 0;
  const cosine = Math.min(1, Math.max(-1, -dy / mag));
  return (Math.acos(cosine) * 180) / Math.PI;
}

export type FeedbackLevel = "good" | "range" | "posture" | "warning";

export type AnalysisResult = {
  message: string;
  level: FeedbackLevel;
  state: string;
  totalReps: number;
  correctReps: number;
};

function visible(lms: Landmark[], idx: number[]): boolean {
  return idx.every((i) => lms[i] && lms[i].visibility >= VIS_THRESHOLD);
}

export abstract class Analyzer {
  totalReps = 0;
  correctReps = 0;
  state = "";
  abstract label: string;
  abstract analyze(lms: Landmark[]): AnalysisResult;

  protected result(message: string, level: FeedbackLevel): AnalysisResult {
    return {
      message,
      level,
      state: this.state,
      totalReps: this.totalReps,
      correctReps: this.correctReps,
    };
  }

  protected notVisible(): AnalysisResult {
    return this.result("Posicione-se totalmente na frente da câmera", "warning");
  }
}

const SQUAT_UP = 160;
const SQUAT_DOWN = 90;
const SQUAT_LEAN_LIMIT = 40;

export class SquatAnalyzer extends Analyzer {
  label = "Agachamento";
  state = "standing";
  private deepEnough = false;
  private leanFlag = false;

  override analyze(lms: Landmark[]): AnalysisResult {
    const need = [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE, LM.LEFT_SHOULDER];
    if (!visible(lms, need)) return this.notVisible();

    const knee = calculateAngle(g(lms, LM.LEFT_HIP), g(lms, LM.LEFT_KNEE), g(lms, LM.LEFT_ANKLE));
    const lean = verticalInclination(g(lms, LM.LEFT_SHOULDER), g(lms, LM.LEFT_HIP));

    let message = "Mantenha o ritmo";
    let level: FeedbackLevel = "posture";

    if (knee < SQUAT_UP && this.state === "standing") {
      this.state = "descending";
      this.deepEnough = false;
      this.leanFlag = false;
    }

    if (this.state === "descending" || this.state === "squat") {
      if (lean > SQUAT_LEAN_LIMIT) this.leanFlag = true;
      if (knee <= SQUAT_DOWN) {
        this.state = "squat";
        this.deepEnough = true;
      }
    }

    if (knee >= SQUAT_UP && (this.state === "descending" || this.state === "squat")) {
      this.totalReps += 1;
      if (this.deepEnough && !this.leanFlag) {
        this.correctReps += 1;
        message = "Ótima forma!";
        level = "good";
      } else if (!this.deepEnough) {
        message = "Agache mais fundo";
        level = "range";
      } else {
        message = "Mantenha o peito aberto";
        level = "posture";
      }
      this.state = "standing";
      this.deepEnough = false;
      this.leanFlag = false;
      return this.result(message, level);
    }

    if (lean > SQUAT_LEAN_LIMIT) return this.result("Mantenha o peito aberto", "posture");
    if (this.state === "descending") return this.result("Desça até 90°", "range");
    if (this.state === "squat") return this.result("Boa profundidade, suba!", "good");
    return this.result("Pronto para agachar", "posture");
  }
}

const PUSH_UP_UP = 160;
const PUSH_UP_DOWN = 90;
const HIP_DEVIATION_LIMIT = 25;

export class PushUpAnalyzer extends Analyzer {
  label = "Flexão de Braço";
  state = "high";
  private deepEnough = false;
  private hipFlag = false;

  override analyze(lms: Landmark[]): AnalysisResult {
    const need = [
      LM.LEFT_SHOULDER,
      LM.LEFT_ELBOW,
      LM.LEFT_WRIST,
      LM.RIGHT_SHOULDER,
      LM.RIGHT_ELBOW,
      LM.RIGHT_WRIST,
      LM.LEFT_HIP,
      LM.LEFT_KNEE,
    ];
    if (!visible(lms, need)) return this.notVisible();

    const left = calculateAngle(g(lms, LM.LEFT_SHOULDER), g(lms, LM.LEFT_ELBOW), g(lms, LM.LEFT_WRIST));
    const right = calculateAngle(g(lms, LM.RIGHT_SHOULDER), g(lms, LM.RIGHT_ELBOW), g(lms, LM.RIGHT_WRIST));
    const elbow = (left + right) / 2;
    const hipAngle = calculateAngle(g(lms, LM.LEFT_SHOULDER), g(lms, LM.LEFT_HIP), g(lms, LM.LEFT_KNEE));
    const hipOff = Math.abs(180 - hipAngle);

    if (elbow < PUSH_UP_UP && this.state === "high") {
      this.state = "descending";
      this.deepEnough = false;
      this.hipFlag = false;
    }

    if (this.state === "descending" || this.state === "low") {
      if (hipOff > HIP_DEVIATION_LIMIT) this.hipFlag = true;
      if (elbow <= PUSH_UP_DOWN) {
        this.state = "low";
        this.deepEnough = true;
      }
    }

    if (elbow >= PUSH_UP_UP && (this.state === "descending" || this.state === "low")) {
      this.totalReps += 1;
      let message = "Ótima forma!";
      let level: FeedbackLevel = "good";
      if (this.deepEnough && !this.hipFlag) {
        this.correctReps += 1;
      } else if (!this.deepEnough) {
        message = "Desça mais o tronco";
        level = "range";
      } else {
        message = "Mantenha o corpo alinhado";
        level = "posture";
      }
      this.state = "high";
      this.deepEnough = false;
      this.hipFlag = false;
      return this.result(message, level);
    }

    if (hipOff > HIP_DEVIATION_LIMIT) return this.result("Mantenha o corpo alinhado", "posture");
    if (this.state === "descending") return this.result("Desça mais o tronco", "range");
    if (this.state === "low") return this.result("Boa profundidade, empurre!", "good");
    return this.result("Pronto para flexionar", "posture");
  }
}

export class JumpingJackAnalyzer extends Analyzer {
  label = "Polichinelo";
  state = "closed";
  private armsOk = false;
  private legsOk = false;

  override analyze(lms: Landmark[]): AnalysisResult {
    const need = [
      LM.NOSE,
      LM.LEFT_SHOULDER,
      LM.RIGHT_SHOULDER,
      LM.LEFT_WRIST,
      LM.RIGHT_WRIST,
      LM.LEFT_ANKLE,
      LM.RIGHT_ANKLE,
    ];
    if (!visible(lms, need)) return this.notVisible();

    const nose = g(lms, LM.NOSE);
    const ls = g(lms, LM.LEFT_SHOULDER);
    const rs = g(lms, LM.RIGHT_SHOULDER);
    const lw = g(lms, LM.LEFT_WRIST);
    const rw = g(lms, LM.RIGHT_WRIST);
    const la = g(lms, LM.LEFT_ANKLE);
    const ra = g(lms, LM.RIGHT_ANKLE);

    const armsUp = lw.y < nose.y && rw.y < nose.y;
    const armsDown = lw.y > ls.y && rw.y > rs.y;
    const shoulderWidth = Math.abs(ls.x - rs.x);
    const ankleDist = Math.abs(la.x - ra.x);
    const feetOpen = ankleDist > shoulderWidth * 1.2;
    const feetClosed = ankleDist < shoulderWidth * 0.9;

    if (this.state === "closed" && (armsUp || feetOpen)) {
      this.state = "opening";
      this.armsOk = false;
      this.legsOk = false;
    }

    if (this.state === "opening" || this.state === "open") {
      if (armsUp) this.armsOk = true;
      if (feetOpen) this.legsOk = true;
      if (armsUp && feetOpen) this.state = "open";
    }

    if ((this.state === "opening" || this.state === "open") && armsDown && feetClosed) {
      this.totalReps += 1;
      let message = "Ótima forma!";
      let level: FeedbackLevel = "good";
      if (this.armsOk && this.legsOk) {
        this.correctReps += 1;
      } else if (!this.legsOk) {
        message = "Abra mais as pernas";
        level = "range";
      } else {
        message = "Eleve os braços acima da cabeça";
        level = "range";
      }
      this.state = "closed";
      this.armsOk = false;
      this.legsOk = false;
      return this.result(message, level);
    }

    if (this.state === "open") return this.result("Boa abertura, feche!", "good");
    if (this.state === "opening") {
      if (!this.legsOk) return this.result("Abra mais as pernas", "range");
      if (!this.armsOk) return this.result("Eleve os braços acima da cabeça", "range");
      return this.result("Continue o movimento", "posture");
    }
    return this.result("Pronto para o polichinelo", "posture");
  }
}

export type ExerciseId = "squat" | "pushup" | "jumpingjack";

export function createAnalyzer(id: ExerciseId): Analyzer {
  if (id === "squat") return new SquatAnalyzer();
  if (id === "pushup") return new PushUpAnalyzer();
  return new JumpingJackAnalyzer();
}

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
