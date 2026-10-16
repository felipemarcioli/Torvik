import { useTranslation } from "react-i18next";
import { translate as t, formatNumber } from "@/lib/i18n";
import { useEffect, useRef, useState } from "react";
import { createPose } from "@/lib/mediapipe";
import type { ExerciseId } from "@/lib/biomech";
import { evaluateVideo, type EvaluationResult } from "@/lib/pose/evaluation";
import { ScreenHeading } from "./TorvikUI";
import { EXERCISES } from "./data";
export function PoseLab() {
  useTranslation();

  const video = useRef<HTMLVideoElement>(null),
    abort = useRef<AbortController | null>(null);
  const [file, setFile] = useState<File | null>(null),
    [consent, setConsent] = useState(false),
    [loaded, setLoaded] = useState(false),
    [exercise, setExercise] = useState<ExerciseId>("squat"),
    [expected, setExpected] = useState(0),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState<{ engine: string; fraction?: number } | "complete" | null>(
      null,
    ),
    [error, setError] = useState(""),
    [results, setResults] = useState<EvaluationResult[]>([]);
  useEffect(() => {
    if (!file || !video.current) return;
    setLoaded(false);
    setResults([]);
    const url = URL.createObjectURL(file);
    video.current.src = url;
    return () => {
      abort.current?.abort();
      URL.revokeObjectURL(url);
    };
  }, [file]);
  useEffect(() => () => abort.current?.abort(), []);
  async function run() {
    if (!consent || !loaded || !video.current || busy) return;
    setBusy(true);
    setResults([]);
    setError("");
    const signal = new AbortController();
    abort.current = signal;
    try {
      const factories = [
        { label: "Motor atual", create: createPose },
        {
          label: "Motor experimental",
          create: async () => {
            const m = await import("@/lib/pose/tasks");
            return m.createTasksPose();
          },
        },
      ];
      for (const item of factories) {
        signal.signal.throwIfAborted();
        setProgress({ engine: item.label });
        const result = await evaluateVideo(
          video.current,
          item.create,
          exercise,
          expected,
          signal.signal,
          (fraction) => setProgress({ engine: item.label, fraction }),
        );
        setResults((previous) => [...previous, result]);
      }
      setProgress("complete");
    } catch {
      setError(
        signal.signal.aborted
          ? "Comparação cancelada."
          : "A comparação não pôde terminar. Verifique o vídeo, a conexão e a compatibilidade com Worker/WASM.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="lab-screen">
      <div className="app-content">
        <a href="/" className="torvik-secondary text-sm">
          {t("Voltar ao Torvik")}
        </a>
        <ScreenHeading
          title={t("Laboratório local de pose")}
          eyebrow={t("Ferramenta experimental")}
        >
          {t(
            "Compare o mesmo vídeo nos dois motores, a 15 amostras por segundo, até 60 segundos. O arquivo permanece no navegador. Os resultados não validam capacidade clínica.",
          )}
        </ScreenHeading>
        <div className="torvik-panel mt-6 p-5 sm:p-6">
          <label className="block font-semibold">
            {t("Vídeo autorizado")}
            <input
              type="file"
              accept="video/*"
              disabled={busy}
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setConsent(false);
              }}
              className="torvik-control mt-2 block w-full cursor-pointer text-sm file:me-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1 file:font-semibold file:text-foreground"
            />
          </label>
          <video
            ref={video}
            muted
            playsInline
            onLoadedData={() => setLoaded(true)}
            onError={() => {
              setLoaded(false);
              setError("Não foi possível ler este formato de vídeo.");
            }}
            className="mt-4 aspect-video max-h-80 w-full rounded-xl bg-black object-contain"
          />
          <label className="mt-4 flex items-start gap-3 text-sm leading-relaxed">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              disabled={busy}
              className="mt-1 size-5 shrink-0 accent-primary"
            />
            {t("Tenho autorização para usar este vídeo nesta avaliação local.")}
          </label>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-semibold">
              {t("Exercício")}
              <select
                disabled={busy}
                value={exercise}
                onChange={(e) => setExercise(e.target.value as ExerciseId)}
                className="torvik-control font-normal"
              >
                {EXERCISES.map((e) => (
                  <option key={e.id} value={e.id}>
                    {t(e.name)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              {EXERCISES.find((e) => e.id === exercise)?.type === "HOLD_BASED"
                ? t("Segundos de postura válida anotados nos primeiros 60s")
                : t("Repetições anotadas nos primeiros 60s")}
              <input
                type="number"
                min="0"
                step="1"
                value={expected}
                disabled={busy}
                onChange={(e) => setExpected(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                className="torvik-control w-full font-normal sm:w-28"
              />
            </label>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              className="torvik-primary flex-1 sm:flex-none"
              disabled={!loaded || !consent || busy}
              onClick={() => void run()}
            >
              {t("Comparar motores")}
            </button>
            {busy && (
              <button
                type="button"
                className="torvik-secondary"
                onClick={() => abort.current?.abort()}
              >
                {t("Cancelar comparação")}
              </button>
            )}
          </div>
          <p role="status" className="mt-3 text-sm text-muted-foreground">
            {progress === "complete"
              ? t("Comparação concluída.")
              : progress
                ? progress.fraction === undefined
                  ? t("{{engine}}: carregando…", { engine: t(progress.engine) })
                  : `${t(progress.engine)}: ${formatNumber(progress.fraction, { style: "percent", maximumFractionDigits: 0 })}`
                : ""}
          </p>
        </div>
        {error && (
          <p role="alert" className="torvik-panel mt-4 border-caution/50 p-4 text-caution">
            {t(error)}
          </p>
        )}
        {results.length > 0 && (
          <div className="torvik-panel mt-6 overflow-x-auto p-5 sm:p-6">
            <table className="w-full min-w-[34rem] text-start text-sm">
              <caption className="mb-4 text-start font-semibold">
                {t("Métricas deste vídeo; execução amostrada, não um teste de FPS em tempo real.")}
              </caption>
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th>{t("Motor")}</th>
                  <th>
                    {EXERCISES.find((e) => e.id === exercise)?.type === "HOLD_BASED"
                      ? t("Tempo válido")
                      : t("Contagem")}
                  </th>
                  <th>{t("Erro absoluto")}</th>
                  <th>{t("Frames rastreados")}</th>
                  <th>{t("Latência p95")}</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.engine} className="border-b border-border last:border-0">
                    <td className="py-3 pe-3">{r.engine}</td>
                    <td>
                      {r.type === "HOLD_BASED"
                        ? formatNumber(r.validSeconds ?? 0, {
                            style: "unit",
                            unit: "second",
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          })
                        : formatNumber(r.totalReps)}
                    </td>
                    <td>
                      {r.type === "HOLD_BASED"
                        ? formatNumber(r.absoluteTimeError ?? 0, {
                            style: "unit",
                            unit: "second",
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          })
                        : formatNumber(r.absoluteCountError)}
                    </td>
                    <td>
                      {formatNumber(r.trackingCoverage, {
                        style: "percent",
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td>
                      {formatNumber(r.p95Ms, {
                        style: "unit",
                        unit: "millisecond",
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
