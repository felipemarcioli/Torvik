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
    <main className="mx-auto max-w-4xl p-6">
      <a href="/" className="text-primary underline">
        Voltar ao Torvik
      </a>
      <h1 className="mt-6 text-3xl font-bold">Laboratório local de pose</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Área experimental. Compare o mesmo vídeo nos dois motores, a 15 amostras por segundo, até 60
        segundos. O arquivo permanece no navegador; os modelos são baixados pela internet. Estes
        resultados não validam capacidade clínica.
      </p>
      <label className="mt-5 block">
        Vídeo autorizado
        <input
          type="file"
          accept="video/*"
          disabled={busy}
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setConsent(false);
          }}
          className="mt-2 block w-full"
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
        className="mt-4 max-h-64 w-full bg-black object-contain"
      />
      <label className="mt-4 flex gap-3">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          disabled={busy}
        />
        Tenho autorização para usar este vídeo nesta avaliação local.
      </label>
      <div className="mt-4 flex flex-wrap gap-4">
        <label>
          Exercício
          <select
            disabled={busy}
            value={exercise}
            onChange={(e) => setExercise(e.target.value as ExerciseId)}
            className="ml-2 rounded border bg-card p-2"
          >
            {EXERCISES.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Repetições anotadas nos primeiros 60s
          <input
            type="number"
            min="0"
            step="1"
            value={expected}
            disabled={busy}
            onChange={(e) => setExpected(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
            className="ml-2 w-20 rounded border bg-card p-2"
          />
        </label>
      </div>
      <div className="mt-5 flex gap-3">
        <button
          type="button"
          className="torvik-primary"
          disabled={!loaded || !consent || busy}
          onClick={() => void run()}
        >
          Comparar motores
        </button>
        {busy && (
          <button type="button" className="torvik-secondary" onClick={() => abort.current?.abort()}>
            Cancelar comparação
          </button>
        )}
      </div>
      <p role="status" className="mt-3">
        {progress}
      </p>
      {error && (
        <p role="alert" className="mt-3 text-caution">
          {error}
        </p>
      )}
      {results.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="mb-3 text-left">
              Métricas deste vídeo; execução amostrada, não um teste de FPS em tempo real.
            </caption>
            <thead>
              <tr>
                <th>Motor</th>
                <th>Contagem</th>
                <th>Erro absoluto</th>
                <th>Frames rastreados</th>
                <th>Latência p95</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.engine}>
                  <td className="py-3 pr-3">{r.engine}</td>
                  <td>{r.totalReps}</td>
                  <td>{r.absoluteCountError}</td>
                  <td>{Math.round(r.trackingCoverage * 100)}%</td>
                  <td>{r.p95Ms.toFixed(1)} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
