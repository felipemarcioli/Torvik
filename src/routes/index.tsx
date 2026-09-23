import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { HomeScreen } from "@/components/torvik/HomeScreen";
import { WorkoutScreen } from "@/components/torvik/WorkoutScreen";
import { ReportScreen } from "@/components/torvik/ReportScreen";
import { HistoryScreen } from "@/components/torvik/HistoryScreen";
import type { SessionReport } from "@/lib/session";
import { useEffect, useRef } from "react";
import type { ExerciseId } from "@/lib/biomech";

const title = "Torvik — Acompanhe seu movimento pela câmera";
const description =
  "Acompanhe agachamentos, flexões e polichinelos com análise local de movimento. Sem cadastro.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Index,
});

function Index() {
  const [screen, setScreen] = useState<"home" | "workout" | "report" | "history">("home");
  const [exercise, setExercise] = useState<ExerciseId>("squat");
  const [report, setReport] = useState<SessionReport | null>(null);
  const [sessionKey, setSessionKey] = useState(0);

  const previousScreen = useRef(screen);
  useEffect(() => {
    if (previousScreen.current === screen) return;
    previousScreen.current = screen;
    window.scrollTo(0, 0);
    const heading = document.querySelector<HTMLElement>("h1");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  }, [screen, sessionKey]);

  if (screen === "history") return <HistoryScreen onHome={() => setScreen("home")} />;

  if (screen === "workout") {
    return (
      <WorkoutScreen
        key={sessionKey}
        exercise={exercise}
        onFinish={(r) => {
          setReport(r);
          setScreen("report");
        }}
        onCancel={() => setScreen("home")}
      />
    );
  }

  if (screen === "report" && report) {
    return (
      <ReportScreen
        report={report}
        onRestart={() => {
          setSessionKey((k) => k + 1);
          setScreen("workout");
        }}
        onHome={() => setScreen("home")}
      />
    );
  }

  return (
    <HomeScreen
      onHistory={() => setScreen("history")}
      selected={exercise}
      onSelect={setExercise}
      onStart={() => {
        setSessionKey((k) => k + 1);
        setScreen("workout");
      }}
    />
  );
}
