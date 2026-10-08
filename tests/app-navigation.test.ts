import { test, expect } from "bun:test";
import { AppNavigator, INITIAL_ENTRY, type NavigationEntry } from "../src/lib/app-navigation";

function browser() {
  const entries = [INITIAL_ENTRY];
  let cursor = 0,
    y = 0;
  const rendered: NavigationEntry[] = [];
  const app = new AppNavigator(
    {
      push: (entry) => {
        entries.splice(cursor + 1);
        entries.push(entry);
        cursor++;
      },
      replace: (entry) => {
        entries[cursor] = entry;
      },
      back: () => {
        cursor--;
        app.pop(entries[cursor]);
      },
      go: (delta) => {
        cursor += delta;
        app.pop(entries[cursor]);
      },
      scrollY: () => y,
    },
    (entry) => {
      rendered.push(entry);
      y = app.scrollPosition;
    },
  );
  return {
    app,
    entries,
    rendered,
    scroll: (position: number) => {
      y = position;
    },
    browserBack: () => {
      cursor--;
      app.pop(entries[cursor]);
    },
    browserForward: () => {
      cursor++;
      app.pop(entries[cursor]);
    },
  };
}

test("no default exercise; category, details and back preserve choice and scroll", () => {
  const { app, scroll, browserForward } = browser();
  expect(app.current.view.exercise).toBeUndefined();
  app.navigate({ screen: "category", category: "legs" });
  scroll(460);
  app.navigate({ screen: "details", category: "legs", exercise: "wallsit" });
  app.back();
  expect(app.current.view).toEqual({ screen: "category", category: "legs" });
  expect(app.scrollPosition).toBe(460);
  browserForward();
  expect(app.current.view.exercise).toBe("wallsit");
  expect(app.scrollPosition).toBe(0);
});

test("report replaces workout so back never restores a finished camera session", () => {
  const { app, entries } = browser();
  app.navigate({ screen: "details", exercise: "squat" });
  app.navigate({ screen: "workout", exercise: "squat" });
  app.navigate({ screen: "report", exercise: "squat" }, true);
  expect(entries.map((entry) => entry.view.screen)).toEqual(["home", "details", "report"]);
  app.back();
  expect(app.current.view).toEqual({ screen: "details", exercise: "squat" });
});

test("browser back opens pause or confirmation without leaving; explicit discard goes back once", () => {
  const { app, browserBack, entries, rendered } = browser();
  app.navigate({ screen: "details", exercise: "plank" });
  app.navigate({ screen: "workout", exercise: "plank" });
  let paused = false,
    confirmation = false;
  app.guard = () => {
    if (!paused) paused = true;
    else confirmation = true;
    return false;
  };
  browserBack();
  expect(paused).toBe(true);
  expect(app.current.view.screen).toBe("workout");
  browserBack();
  expect(confirmation).toBe(true);
  expect(app.current.view.screen).toBe("workout");
  expect(rendered.map((entry) => entry.view.screen)).toEqual(["details", "workout"]);
  app.back(true);
  expect(app.current.view.screen).toBe("details");
  expect(entries.length).toBe(3);
});

test("safe back is accepted directly and forward branches discard stale entries", () => {
  const { app, browserBack, entries } = browser();
  app.navigate({ screen: "details", exercise: "pushup" });
  app.navigate({ screen: "workout", exercise: "pushup" });
  app.guard = () => true;
  browserBack();
  expect(app.current.view.screen).toBe("details");
  app.navigate({ screen: "settings" });
  expect(entries.map((entry) => entry.view.screen)).toEqual(["home", "details", "settings"]);
});

test("back in progress details consumes the local view without skipping the main tab", () => {
  const { app, browserBack } = browser();
  app.navigate({ screen: "history" });
  let detailOpen = true;
  app.guard = () => {
    if (detailOpen) {
      detailOpen = false;
      return false;
    }
    return true;
  };
  browserBack();
  expect(detailOpen).toBe(false);
  expect(app.current.view.screen).toBe("history");
  browserBack();
  expect(app.current.view.screen).toBe("home");
});
