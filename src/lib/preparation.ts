import { RULES } from "./biomech";
export const PREPARATION_STABLE_MS = 2000;
export const COUNTDOWN_MS = 5000;
/** Uses tracking continuity, not immobility or exercise angles. No timers of its own. */
export class PreparationStart {
  phase: "preparing" | "countdown" | "running" = "preparing";
  private stableSince: number | null = null;
  private lastFrame: number | null = null;
  private tracking = false;
  private deadline: number | null = null;
  private acquiredDuringCountdown = false;
  reset() {
    this.phase = "preparing";
    this.stableSince = this.lastFrame = this.deadline = null;
    this.tracking = this.acquiredDuringCountdown = false;
  }
  private begin(now: number) {
    this.phase = "countdown";
    this.deadline = now + COUNTDOWN_MS;
    this.acquiredDuringCountdown = this.tracking;
  }
  manual(now: number) {
    if (this.phase !== "preparing") return;
    // A person at the phone gets the full countdown to enter the frame.
    this.tracking =
      this.tracking && this.lastFrame !== null && now - this.lastFrame <= RULES.maxGapMs;
    this.begin(now);
  }
  observe(tracking: boolean, now: number) {
    if (this.phase === "running") return;
    if (this.lastFrame !== null && now - this.lastFrame > RULES.maxGapMs) this.reset();
    this.lastFrame = now;
    this.tracking = tracking;
    if (!tracking) {
      this.stableSince = null;
      if (this.phase === "countdown" && this.acquiredDuringCountdown) this.reset();
      return;
    }
    if (this.phase === "countdown") {
      this.acquiredDuringCountdown = true;
      return;
    }
    this.stableSince ??= now;
    if (now - this.stableSince >= PREPARATION_STABLE_MS) this.begin(now);
  }
  tick(now: number) {
    if (this.phase === "running") return this.phase;
    if (this.lastFrame !== null && now - this.lastFrame > RULES.maxGapMs) this.reset();
    if (this.phase === "countdown" && this.deadline !== null && now >= this.deadline) {
      if (this.tracking) {
        this.phase = "running";
        this.deadline = null;
      } else this.reset();
    }
    return this.phase;
  }
  remaining(now: number) {
    return this.deadline === null ? 5 : Math.max(1, Math.ceil((this.deadline - now) / 1000));
  }
}
