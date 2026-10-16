import { useTranslation } from "react-i18next";
import { translate as t } from "@/lib/i18n";
import type { WorkoutVoiceControls } from "@/hooks/use-workout-voice";
import { VoiceControls } from "./VoiceControls";
import { CAMERA_TIPS } from "./data";
import { ScreenHeading } from "./TorvikUI";
import { AccountCard } from "./AccountCard";
import { LanguageControls } from "./LanguageControls";
export function SettingsScreen({
  voice,
  onLogin,
}: {
  voice: WorkoutVoiceControls;
  onLogin: () => void;
}) {
  useTranslation();

  return (
    <main className="settings-screen">
      <div className="app-content settings-content">
        <ScreenHeading title={t("Ajustes")} eyebrow={t("Do seu jeito")}>
          {t("Preferências e ajuda para seu treino.")}
        </ScreenHeading>
        <AccountCard onLogin={onLogin} />
        <LanguageControls />
        <section className="settings-voice" aria-label={t("Preferências de voz")}>
          <h2 className="settings-section-title">{t("Durante o treino")}</h2>
          <VoiceControls voice={voice} expanded showLanguage={false} />
        </section>
        <h2 className="settings-section-title">{t("Ajuda e privacidade")}</h2>
        <details className="app-disclosure">
          <summary>{t("Ajuda para usar a câmera")}</summary>
          <ul className="space-y-3">
            {CAMERA_TIPS.map((tip) => (
              <li key={t(tip)}>{t(tip)}</li>
            ))}
          </ul>
          <p className="mt-3">
            {t(
              "A câmera exige HTTPS ou localhost e autorização do navegador. Durante a preparação, o treino inicia automaticamente após detectar o corpo e contar cinco segundos. Pausar preserva o progresso; Continuar prepara a retomada.",
            )}
          </p>
        </details>
        <details className="app-disclosure">
          <summary>{t("Como interpretar os resultados")}</summary>
          <p>
            {t(
              "Repetições e tempo válido representam os critérios do app. A análise usa regras automáticas e estimativas de movimento em 2D, sem validação clínica. Não substitui avaliação profissional. Pausas, preparação e períodos sem rastreamento não entram no tempo ativo. Adapte o exercício às suas condições e procure orientação profissional quando necessário.",
            )}
          </p>
        </details>
        <details className="app-disclosure">
          <summary>{t("Privacidade e armazenamento")}</summary>
          <div className="space-y-3">
            <p>
              {t(
                "O vídeo é analisado neste dispositivo e não é gravado pelo Torvik. O aplicativo não envia imagens nem pontos do corpo. Modelos e fontes são baixados de serviços externos. A hospedagem e o editor podem registrar diagnósticos técnicos sanitizados, sem imagens da câmera.",
              )}
            </p>
            <p>
              {t(
                "Salvar sessão é opcional e acontece somente quando você escolhe essa ação no relatório. Os resumos ficam neste navegador e dispositivo, em IndexedDB. Consulte, exporte ou exclua uma sessão em Progresso. O histórico fica separado por conta; os treinos feitos sem conta permanecem no modo sem conta. Ao sair, o histórico da conta deixa de aparecer, mas continua neste dispositivo. As preferências de voz ficam no armazenamento local do navegador.",
              )}
            </p>
            <p>
              {t(
                "O navegador pode apagar os dados locais. Exporte uma cópia para preservá-los. Não há sincronização de treinos nem garantia de funcionamento offline. Ao criar uma conta, seu e-mail, nome escolhido e dados de autenticação são enviados ao Supabase. O navegador guarda uma sessão de acesso para manter você conectado. A senha não é salva pelo código do Torvik.",
              )}
            </p>
          </div>
        </details>
      </div>
    </main>
  );
}
