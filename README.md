# Torvik Pose Coach

Crie o web app Torvik: aplicativo de análise biomecânica em tempo real via webcam executado 100% no cliente com MediaPipe Pose e Tailwind CSS no tema dark mode com paleta em laranja vibrante e azul de contraste.

Requisitos e Especificações:

1. Identidade e Assets:

- Nome do app: Torvik.
- Mascote: Torvik (o canguru estiloso dos anexos). Utilize as imagens anexadas no cabeçalho/logo e na tela inicial com um balão de fala receptivo e motivador ("Olá, me chamo Torvik, sou seu assistente de treino em tempo real...").
- UI moderna, esportiva, clean, sem necessidade de login.

2. Fluxo de Telas (SPA):

- Tela Inicial:
  - Apresentação do Torvik com dicas rápidas para posicionamento da câmera.
  - Seletor de exercício em cards interativos com badge e instruções: Agachamento (Squat), Flexão de Braço (Push-up) e Polichinelo (Jumping Jack).
  - Botão de destaque "Iniciar Treino".
- Tela de Treino (HUD):
  - Feed da webcam ocupando a área principal, com canvas sobreposto desenhando o esqueleto corporal (landmarks e conexões coloridas com suavização).
  - Feedback em tempo real com alertas visuais destacados (Verde para 'Ótima forma!', Amarelo para correções de amplitude como 'Agache mais fundo' ou 'Desça mais o tronco', Azul para correções posturais como 'Mantenha o corpo alinhado' ou 'Mantenha o peito aberto', Cinza/Aviso quando a pessoa não estiver visível).
  - HUD overlay com: Cronômetro em tempo real, contador gigante de repetições (total e corretas) e indicador de estado do movimento.
  - Botão flutuante para "Finalizar Treino" e "Cancelar/Voltar".
- Tela de Relatório:
  - Tempo total de treino formatado (mm:ss).
  - Repetições totais vs. Repetições corretas.
  - Taxa de precisão (%) com barra de progresso.
  - Resumo de feedbacks com ranking dos pontos de atenção mais frequentes.
  - Botão para iniciar novo treino ou voltar ao início.

3. Lógica Biomecânica Fiel ao Código Python Fornecido:

- Implementar em TypeScript/JavaScript o cálculo vetorial de ângulos no vértice b para 3 pontos (usando produto escalar e arco-cosseno com proteção contra divisão por zero e clamp [-1, 1]).
- Tolerância de visibilidade de landmark: >= 0.5.
- Agachamento (SquatAnalyzer):
  - Ângulo do joelho esquerdo (LEFT_HIP, LEFT_KNEE, LEFT_ANKLE).
  - SQUAT_UP = 160°, SQUAT_DOWN = 90°.
  - Estados: standing -> descending -> squat -> standing.
  - Inclinação do tronco em relação à vertical (LEFT_SHOULDER vs LEFT_HIP): limite de inclinação SQUAT_LEAN_LIMIT = 40°. Alerta: "Mantenha o peito aberto".
  - Se subir antes de 90°: soma repetição total mas não correta, alerta: "Agache mais fundo".
  - Se atingir <= 90° e retornar para >= 160°: conta correta e total, feedback: "Ótima forma!".
- Flexão (PushUpAnalyzer):
  - Ângulo dos cotovelos (média entre lado esquerdo e direito de SHOULDER, ELBOW, WRIST).
  - PUSH_UP_UP = 160°, PUSH_UP_DOWN = 90°.
  - Estados: high -> descending -> low -> high.
  - Alinhamento de quadril: ângulo LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE; desvio maior que 25° de 180° gera aviso "Mantenha o corpo alinhado".
  - Se subir antes de 90°: alerta "Desça mais o tronco".
- Polichinelo (JumpingJackAnalyzer):
  - Braços acima da cabeça (pulsos com y < nariz). Braços abaixo dos ombros (pulsos com y > ombros).
  - Pés abertos se distância tornozelos > largura ombros * 1.2; pés juntos se < largura ombros * 0.9.
  - Estados: closed -> opening -> open -> closed.
  - Validação de braços e pernas com contagem correta e feedbacks: "Abra mais as pernas" / "Eleve os braços acima da cabeça".

4. Integração do MediaPipe:

- Carregar @mediapipe/pose e @mediapipe/camera_utils ou usar Pose via CDN / script tag resiliente para compatibilidade total no browser. Incluir tratamento de permissão de câmera gracioso com instruções caso seja negada ou indisponível.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://torvik.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bd5e11ce-70fe-4949-9e7d-1f9d8eda2a3c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
