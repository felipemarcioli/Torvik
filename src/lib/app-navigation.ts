import type { ExerciseId } from "./biomech";

export type AppView = {
  screen: "home" | "category" | "details" | "workout" | "report" | "history" | "settings";
  category?: string;
  exercise?: ExerciseId;
  detailId?: string;
};
export type NavigationEntry = { view: AppView; index: number; key: number };
export type NavigationPort = {
  push: (entry: NavigationEntry) => void;
  replace: (entry: NavigationEntry) => void;
  back: () => void;
  go: (delta: number) => void;
  scrollY: () => number;
};
export const INITIAL_ENTRY: NavigationEntry = { view: { screen: "home" }, index: 0, key: 0 };

/** Presentation navigation only. The port is the boundary for a future native back button. */
export class AppNavigator {
  current = INITIAL_ENTRY;
  guard: (() => boolean) | null = null;
  private serial = 0;
  private bypass = false;
  private restoring = false;
  private positions = new Map<number, number>();
  constructor(
    private port: NavigationPort,
    private change: (entry: NavigationEntry) => void,
  ) {}

  navigate(view: AppView, replace = false) {
    this.rememberPosition();
    const next = { view, index: this.current.index + (replace ? 0 : 1), key: ++this.serial };
    // Category dialogs expand over the home without moving the card underneath.
    if (view.screen === "category") this.positions.set(next.key, this.port.scrollY());
    if (replace) this.port.replace(next);
    else this.port.push(next);
    this.commit(next);
  }
  back(force = false) {
    if (this.restoring || this.bypass) return;
    if (!force && this.guard && !this.guard()) return;
    if (this.current.index === 0) return;
    this.rememberPosition();
    this.bypass = true;
    this.port.back();
  }
  pop(next: NavigationEntry | undefined) {
    if (this.restoring) {
      this.restoring = false;
      return;
    }
    if (!next) return;
    if (!this.bypass && this.guard && !this.guard()) {
      this.restoring = true;
      this.port.go(this.current.index - next.index);
      return;
    }
    this.bypass = false;
    this.rememberPosition();
    this.commit(next);
  }
  get scrollPosition() {
    return this.positions.get(this.current.key) ?? 0;
  }
  private rememberPosition() {
    this.positions.set(this.current.key, this.port.scrollY());
  }
  private commit(next: NavigationEntry) {
    this.current = next;
    this.change(next);
  }
}
