import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { HomeScreen } from "@/components/torvik/HomeScreen";
import { WorkoutScreen } from "@/components/torvik/WorkoutScreen";
import { ReportScreen, type SessionReport } from "@/components/torvik/ReportScreen";
import type { ExerciseId } from "@/lib/biomech";

const title = "Torvik — Treino guiado por análise biomecânica na webcam";
const description =
  "Conte e corrija agachamentos, flexões e polichinelos em tempo real pela webcam. Roda 100% no navegador, sem cadastro.";

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
  const [screen, setScreen] = useState<"home" | "workout" | "report">("home");
  const [exercise, setExercise] = useState<ExerciseId>("squat");
  const [report, setReport] = useState<SessionReport | null>(null);
  const [sessionKey, setSessionKey] = useState(0);

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
      selected={exercise}
      onSelect={setExercise}
      onStart={() => {
        setSessionKey((k) => k + 1);
        setScreen("workout");
      }}
    />
  );
}
