import type { WorkoutVoiceControls } from "@/hooks/use-workout-voice";
import { VoiceControls } from "./VoiceControls";
import { CAMERA_TIPS } from "./data";
export function SettingsScreen({ voice }: { voice: WorkoutVoiceControls }) {
  return (
    <main className="hero-glow">
      <div className="app-content">
        <header className="app-heading">
          <p className="torvik-kicker">Torvik</p>
          <h1>Ajustes</h1>
          <p>Preferências e ajuda para seu treino.</p>
        </header>
        <section aria-label="Preferências de voz">
          <VoiceControls voice={voice} expanded />
        </section>
        <details className="app-disclosure">
          <summary>Ajuda para usar a câmera</summary>
          <ul className="space-y-3">
            {CAMERA_TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
          <p className="mt-3">
            A câmera exige HTTPS ou localhost e autorização do navegador. Durante a preparação, o
            treino inicia automaticamente após detectar o corpo e contar cinco segundos. Pausar
            preserva o progresso; Continuar prepara a retomada.
          </p>
        </details>
        <details className="app-disclosure">
          <summary>Como interpretar os resultados</summary>
          <p>
            Repetições e tempo válido representam os critérios do app. A análise usa regras
            automáticas e estimativas de movimento em 2D, sem validação clínica. Não substitui
            avaliação profissional. Pausas, preparação e períodos sem rastreamento não entram no
            tempo ativo. Adapte o exercício às suas condições e procure orientação profissional
            quando necessário.
          </p>
        </details>
        <details className="app-disclosure">
          <summary>Privacidade e armazenamento</summary>
          <div className="space-y-3">
            <p>
              O vídeo é analisado neste dispositivo e não é gravado pelo Torvik. O aplicativo não
              envia imagens nem pontos do corpo. Modelos e fontes são baixados de serviços externos.
              A hospedagem e o editor podem registrar diagnósticos técnicos sanitizados, sem imagens
              da câmera.
            </p>
            <p>
              Salvar sessão é opcional e acontece somente quando você escolhe essa ação no
              relatório. Os resumos ficam neste navegador e dispositivo, em IndexedDB. Consulte,
              exporte ou exclua uma sessão em Progresso. As preferências de voz ficam no
              armazenamento local do navegador.
            </p>
            <p>
              O navegador pode apagar os dados locais. Exporte uma cópia para preservá-los. Não há
              sincronização nem garantia de funcionamento offline.
            </p>
          </div>
        </details>
      </div>
    </main>
  );
}
