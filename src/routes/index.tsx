import { useWorkoutVoice } from "@/hooks/use-workout-voice";
import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useState, useCallback } from "react";
import { HomeScreen } from "@/components/torvik/HomeScreen";
import { WorkoutScreen } from "@/components/torvik/WorkoutScreen";
import { ReportScreen } from "@/components/torvik/ReportScreen";
const HistoryScreen = lazy(() =>
  import("@/components/torvik/HistoryScreen").then((m) => ({ default: m.HistoryScreen })),
);
import type { SessionReport } from "@/lib/session";
import { useAppNavigation } from "@/hooks/use-app-navigation";
import { AppNavigation } from "@/components/torvik/AppNavigation";
import { ExerciseDetailScreen } from "@/components/torvik/ExerciseDetailScreen";
import { SettingsScreen } from "@/components/torvik/SettingsScreen";
import type { ExerciseId } from "@/lib/biomech";

const title = "Torvik — Acompanhe seu movimento pela câmera";
const description =
  "Acompanhe 30 exercícios, por repetições ou tempo, com análise local de movimento. Sem cadastro.";

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
  const navigation = useAppNavigation();
  const { view, navigate, back, guard } = navigation;
  const [selected, setSelected] = useState<ExerciseId | undefined>();
  const [search, setSearch] = useState("");
  const [report, setReport] = useState<SessionReport | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const registerBack = useCallback(
    (handler: () => boolean) => {
      guard.current = handler;
      return () => {
        if (guard.current === handler) guard.current = null;
      };
    },
    [guard],
  );
  const goHome = () => {
    voice.controller.stop();
    navigate({ screen: "home" });
  };
  const start = (replace = false) => {
    if (!view.exercise) return;
    voice.controller.begin();
    setSessionKey((key) => key + 1);
    navigate({ ...view, screen: "workout" }, replace);
  };
  const flow = view.screen === "workout" || view.screen === "report";
  const active =
    view.screen === "history" ? "history" : view.screen === "settings" ? "settings" : "home";
  return (
    <div className={flow ? "app-flow" : "app-shell"}>
      {view.screen === "workout" && view.exercise ? (
        <WorkoutScreen
          key={sessionKey}
          exercise={view.exercise}
          voice={voice}
          registerBack={registerBack}
          onCancel={() => {
            voice.controller.stop();
            back(true);
          }}
          onFinish={(result) => {
            voice.controller.finish();
            setReport(result);
            navigate({ ...view, screen: "report" }, true);
          }}
        />
      ) : view.screen === "report" && report ? (
        <ReportScreen
          report={report}
          registerBack={registerBack}
          onRestart={() => start(true)}
          onHome={() => back(true)}
          onViewHistory={(id) => {
            voice.controller.stop();
            navigate({ screen: "history", ...(id ? { detailId: id } : {}) });
          }}
        />
      ) : view.screen === "history" ? (
        <Suspense
          fallback={
            <p role="status" className="p-6">
              Carregando progresso…
            </p>
          }
        >
          <HistoryScreen
            key={view.detailId ?? "all"}
            initialDetailId={view.detailId ?? null}
            onHome={goHome}
            registerBack={registerBack}
          />
        </Suspense>
      ) : view.screen === "settings" ? (
        <SettingsScreen voice={voice} />
      ) : view.screen === "details" && view.exercise ? (
        <ExerciseDetailScreen
          exercise={view.exercise}
          onBack={() => back()}
          onStart={() => start()}
        />
      ) : (
        <HomeScreen
          search={search}
          onSearch={setSearch}
          selected={selected}
          category={view.screen === "category" ? view.category : undefined}
          onBack={() => back()}
          onCategory={(category) => navigate({ screen: "category", category })}
          onOpen={(exercise) => {
            setSelected(exercise);
            navigate({ ...view, screen: "details", exercise });
          }}
        />
      )}
      {!flow && (
        <AppNavigation
          active={active}
          onChange={(screen) => {
            if (screen !== active) navigate({ screen });
            else if (screen === "home" && view.screen !== "home") goHome();
          }}
        />
      )}
    </div>
  );
}
