import { useEffect, useRef, useState } from "react";
import {
  AppNavigator,
  INITIAL_ENTRY,
  type AppView,
  type NavigationEntry,
} from "@/lib/app-navigation";

/** Preserve URL routing while handling the app's presentation screens and back guards. */
export function useAppNavigation() {
  const [entry, setEntry] = useState(INITIAL_ENTRY);
  const controller = useRef<AppNavigator | null>(null);
  const guard = useRef<(() => boolean) | null>(null);
  useEffect(() => {
    const navigationId = crypto.randomUUID();
    const stateFor = (next: NavigationEntry, push = false) => ({
      ...window.history.state,
      torvik: next,
      torvikNavigationId: navigationId,
      // Give the existing TanStack history distinct keys and valid direction metadata.
      __TSR_index: Number(window.history.state?.__TSR_index ?? 0) + (push ? 1 : 0),
      __TSR_key: `torvik-${crypto.randomUUID()}`,
    });
    const app = new AppNavigator(
      {
        push: (next) => window.history.pushState(stateFor(next, true), ""),
        replace: (next) => window.history.replaceState(stateFor(next), ""),
        back: () => window.history.back(),
        go: (delta) => window.history.go(delta),
        scrollY: () => window.scrollY,
      },
      setEntry,
    );
    app.guard = () => guard.current?.() ?? true;
    controller.current = app;
    window.history.replaceState(stateFor(INITIAL_ENTRY), "");
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const pop = (event: PopStateEvent) => {
      // A reload starts a new presentation stack; never reopen an expired camera or report.
      if (event.state?.torvikNavigationId === navigationId) app.pop(event.state?.torvik);
    };
    window.addEventListener("popstate", pop);
    return () => {
      window.removeEventListener("popstate", pop);
      window.history.scrollRestoration = previousRestoration;
      controller.current = null;
    };
  }, []);
  useEffect(() => {
    const position = controller.current?.scrollPosition ?? 0;
    // Let the router finish its own history notification before restoring the list.
    const frame = requestAnimationFrame(() => {
      window.scrollTo(0, position);
      const heading = document.querySelector<HTMLElement>("h1");
      heading?.setAttribute("tabindex", "-1");
      heading?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [entry]);
  return {
    view: entry.view,
    navigate: (view: AppView, replace = false) => controller.current?.navigate(view, replace),
    back: (force = false) => controller.current?.back(force),
    guard,
  };
}
