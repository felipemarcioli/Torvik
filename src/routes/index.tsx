import { useTranslation } from "react-i18next";
import { translate as t } from "@/lib/i18n";
import { useWorkoutVoice } from "@/hooks/use-workout-voice";
import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useState, useCallback, useRef, useEffect } from "react";
import { LoadingState } from "@/components/torvik/TorvikUI";
import { HomeScreen } from "@/components/torvik/HomeScreen";
import { WorkoutScreen } from "@/components/torvik/WorkoutScreen";
import { ReportScreen } from "@/components/torvik/ReportScreen";
const HistoryScreen = lazy(() =>
  import("@/components/torvik/HistoryScreen").then((m) => ({ default: m.HistoryScreen })),
);
import type { SessionReport } from "@/lib/session";
import { useAppNavigation } from "@/hooks/use-app-navigation";
import { AppNavigation, AppHeader, type MainTab } from "@/components/torvik/AppNavigation";
import { ExerciseDetailScreen } from "@/components/torvik/ExerciseDetailScreen";
import { SettingsScreen } from "@/components/torvik/SettingsScreen";
import type { ExerciseId } from "@/lib/biomech";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AuthScreen } from "@/components/torvik/AuthScreen";

const title = "Torvik — Acompanhe seu movimento pela câmera";
const description =
  "Acompanhe 30 exercícios com análise local de movimento. Treine com sua conta ou sem cadastro.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: t(title) },
      { name: "description", content: t(description) },
      { property: "og:title", content: t(title) },
      { property: "og:description", content: t(description) },
    ],
  }),
  component: Index,
});

function Index() {
  const { i18n } = useTranslation();
  useEffect(() => {
    document.title = t(title);
    for (const [selector, content] of [
      ['meta[name="description"]', t(description)],
      ['meta[property="og:title"]', t(title)],
      ['meta[property="og:description"]', t(description)],
    ]) {
      document.querySelector(selector!)?.setAttribute("content", content!);
    }
  }, [i18n.resolvedLanguage]);

  return (
    <AuthProvider>
      <AuthEntry />
    </AuthProvider>
  );
}

function AuthEntry() {
  useTranslation();

  const { session, loading, configured, recovery } = useAuth();
  const [guest, setGuest] = useState(false);
  const [open, setOpen] = useState(false);
  if (loading)
    return (
      <main className="auth-screen">
        <LoadingState>{t("Carregando Torvik…")}</LoadingState>
      </main>
    );
  if (recovery || (!session && (open || (configured && !guest)))) {
    return (
      <AuthScreen
        onGuest={() => {
          setGuest(true);
          setOpen(false);
        }}
      />
    );
  }
  return <TorvikApp key={session?.user.id ?? "guest"} onLogin={() => setOpen(true)} />;
}

function TorvikApp({ onLogin }: { onLogin: () => void }) {
  useTranslation();

  const voice = useWorkoutVoice();
  const navigation = useAppNavigation();
  const { view, navigate, back, guard } = navigation;
  const [selected, setSelected] = useState<ExerciseId | undefined>();
  const [search, setSearch] = useState("");
  const categoryPositions = useRef<Record<string, number>>({});
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
    const exercise = view.exercise ?? selected;
    if (!exercise) return;
    voice.controller.begin();
    setSessionKey((key) => key + 1);
    navigate({ ...view, screen: "workout", exercise }, replace);
  };
  const flow = view.screen === "workout" || view.screen === "report";
  const active =
    view.screen === "history" ? "history" : view.screen === "settings" ? "settings" : "home";
  const changeTab = (screen: MainTab) => {
    if (screen !== active) navigate({ screen });
    else if (screen === "home" && view.screen !== "home") goHome();
  };
  return (
    <div className={flow ? "app-flow" : "app-shell"}>
      {!flow && <AppHeader active={active} onChange={changeTab} />}
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
        <Suspense fallback={<LoadingState>{t("Carregando progresso…")}</LoadingState>}>
          <HistoryScreen
            key={view.detailId ?? "all"}
            initialDetailId={view.detailId ?? null}
            onHome={goHome}
            registerBack={registerBack}
          />
        </Suspense>
      ) : view.screen === "settings" ? (
        <SettingsScreen voice={voice} onLogin={onLogin} />
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
          onSelect={setSelected}
          onStart={() => start()}
          onHistory={() => navigate({ screen: "history" })}
          categoryPositions={categoryPositions}
          onDetails={(exercise) => {
            setSelected(exercise);
            navigate({ ...view, screen: "details", exercise });
          }}
        />
      )}
      {!flow && <AppNavigation active={active} onChange={changeTab} />}
    </div>
  );
}
