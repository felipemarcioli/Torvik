import { useEffect, useRef, useState } from "react";
import { createPose } from "@/lib/mediapipe";
import type { ExerciseId } from "@/lib/biomech";
import { evaluateVideo, type EvaluationResult } from "@/lib/pose/evaluation";
import { EXERCISES } from "./data";
export function PoseLab() {
  const video = useRef<HTMLVideoElement>(null),
    abort = useRef<AbortController | null>(null);
  const [file, setFile] = useState<File | null>(null),
    [consent, setConsent] = useState(false),
    [loaded, setLoaded] = useState(false),
    [exercise, setExercise] = useState<ExerciseId>("squat"),
    [expected, setExpected] = useState(0),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(""),
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
        setProgress(`${item.label}: carregando…`);
        const result = await evaluateVideo(
          video.current,
          item.create,
          exercise,
          expected,
          signal.signal,
          (fraction) => setProgress(`${item.label}: ${Math.round(fraction * 100)}%`),
        );
        setResults((previous) => [...previous, result]);
      }
      setProgress("Comparação concluída.");
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
    <main className="hero-glow min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-12">
        <a href="/" className="torvik-secondary text-sm">
          Voltar ao Torvik
        </a>
        <p className="torvik-kicker mt-8">Ferramenta experimental</p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Laboratório local de pose</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Área experimental. Compare o mesmo vídeo nos dois motores, a 15 amostras por segundo, até
          60 segundos. O arquivo permanece no navegador; os modelos são baixados pela internet.
          Estes resultados não validam capacidade clínica.
        </p>
        <div className="torvik-panel mt-6 p-5 sm:p-6">
          <label className="block font-semibold">
            Vídeo autorizado
            <input
              type="file"
              accept="video/*"
              disabled={busy}
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setConsent(false);
              }}
              className="torvik-control mt-2 block w-full cursor-pointer text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1 file:font-semibold file:text-foreground"
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
            Tenho autorização para usar este vídeo nesta avaliação local.
          </label>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Exercício
              <select
                disabled={busy}
                value={exercise}
                onChange={(e) => setExercise(e.target.value as ExerciseId)}
                className="torvik-control font-normal"
              >
                {EXERCISES.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              {EXERCISES.find((e) => e.id === exercise)?.type === "HOLD_BASED"
                ? "Segundos de postura válida anotados nos primeiros 60s"
                : "Repetições anotadas nos primeiros 60s"}
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
              Comparar motores
            </button>
            {busy && (
              <button
                type="button"
                className="torvik-secondary"
                onClick={() => abort.current?.abort()}
              >
                Cancelar comparação
              </button>
            )}
          </div>
          <p role="status" className="mt-3 text-sm text-muted-foreground">
            {progress}
          </p>
        </div>
        {error && (
          <p role="alert" className="torvik-panel mt-4 border-caution/50 p-4 text-caution">
            {error}
          </p>
        )}
        {results.length > 0 && (
          <div className="torvik-panel mt-6 overflow-x-auto p-5 sm:p-6">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <caption className="mb-4 text-left font-semibold">
                Métricas deste vídeo; execução amostrada, não um teste de FPS em tempo real.
              </caption>
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th>Motor</th>
                  <th>
                    {EXERCISES.find((e) => e.id === exercise)?.type === "HOLD_BASED"
                      ? "Tempo válido"
                      : "Contagem"}
                  </th>
                  <th>Erro absoluto</th>
                  <th>Frames rastreados</th>
                  <th>Latência p95</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.engine} className="border-b border-border last:border-0">
                    <td className="py-3 pr-3">{r.engine}</td>
                    <td>
                      {r.type === "HOLD_BASED" ? `${r.validSeconds?.toFixed(1)} s` : r.totalReps}
                    </td>
                    <td>
                      {r.type === "HOLD_BASED"
                        ? `${r.absoluteTimeError?.toFixed(1)} s`
                        : r.absoluteCountError}
                    </td>
                    <td>{Math.round(r.trackingCoverage * 100)}%</td>
                    <td>{r.p95Ms.toFixed(1)} ms</td>
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
