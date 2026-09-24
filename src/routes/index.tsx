import { useWorkoutVoice } from "@/hooks/use-workout-voice";
import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { HomeScreen } from "@/components/torvik/HomeScreen";
import { WorkoutScreen } from "@/components/torvik/WorkoutScreen";
import { ReportScreen } from "@/components/torvik/ReportScreen";
const HistoryScreen = lazy(() =>
  import("@/components/torvik/HistoryScreen").then((m) => ({ default: m.HistoryScreen })),
);
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
  const voice = useWorkoutVoice();
  const goHome = () => {
    voice.controller.stop();
    setScreen("home");
  };
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

  if (screen === "history")
    return (
      <Suspense
        fallback={
          <p role="status" className="p-6">
            Carregando progresso…
          </p>
        }
      >
        <HistoryScreen onHome={goHome} />
      </Suspense>
    );

  if (screen === "workout") {
    return (
      <WorkoutScreen
        key={sessionKey}
        exercise={exercise}
        voice={voice}
        onFinish={(r) => {
          voice.controller.finish();
          setReport(r);
          setScreen("report");
        }}
        onCancel={goHome}
      />
    );
  }

  if (screen === "report" && report) {
    return (
      <ReportScreen
        report={report}
        onRestart={() => {
          voice.controller.begin();
          setSessionKey((k) => k + 1);
          setScreen("workout");
        }}
        onHome={goHome}
      />
    );
  }

  return (
    <HomeScreen
      onHistory={() => setScreen("history")}
      selected={exercise}
      onSelect={setExercise}
      onStart={() => {
        voice.controller.begin();
        setSessionKey((k) => k + 1);
        setScreen("workout");
      }}
    />
  );
}
