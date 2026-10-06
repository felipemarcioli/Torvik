# Torvik

Treino com câmera e estimativa de pose no navegador, sem cadastro. Agachamento, flexão e polichinelo usam regras determinísticas versionadas; os resultados representam os critérios do aplicativo, não uma avaliação clínica.

O catálogo tem **30 exercícios únicos**: 8 de pernas/glúteos, 8 de membros superiores,
7 de core e 7 de cardio. Preparação, equipamentos, câmera e definição de medição estão
no cadastro. Exercícios bilaterais continuam uma entrada e podem registrar resultados
por lado. Veja [expansão para 30 exercícios](docs/catalog-30.md) para regras, sprites e
limitações de validação.

A análise dos frames é local. Modelos e fontes são baixados de serviços externos; o editor Lovable pode receber diagnósticos técnicos sanitizados. O aplicativo não envia frames nem landmarks. Resumos só são guardados em IndexedDB quando a pessoa escolhe **Salvar sessão**; podem ser exportados em JSON e excluídos. Não há sincronização ou garantia de funcionamento offline.

## Desenvolvimento

Use Node **22.23.3** e Bun **1.3.10**, registrados em `.node-version` e `package.json`.
TanStack Start exige Node 22.12 ou posterior; o intervalo `22.x` também seleciona
Node 22 na Vercel, e a CI usa a versão registrada em `.node-version`.

```sh
bun install --frozen-lockfile
bun run dev
```

Abra o endereço indicado pelo Vite. A câmera exige HTTPS ou localhost e autorização no navegador. Para acesso por celular, use um preview HTTPS.

```sh
bun run typecheck
bun run lint
bun run test
bun run build
# Todos os comandos acima:
bun run check

bunx playwright install chromium
bun run test:e2e
# Build específico da Vercel, sem publicar:
NITRO_PRESET=vercel bun run build
bun audit
```

Os testes E2E usam câmera sintética e estimador controlado em Chromium, em perfis móvel e desktop. Não substituem testes de câmera em aparelhos reais. A CI faz instalação congelada, tipos, lint, unitários, build Vercel e E2E.

## Organização

- `src/lib/biomech.ts`: geometria, máquinas de estado e regras `2.0.0`, independentes de React.
- `src/lib/camera.ts` e `mediapipe.ts`: aquisição, inferência sequencial, recuperação e encerramento.
- `src/hooks/use-workout.ts`: preparação, contagem regressiva, pausa e sessão.
- `src/lib/session.ts` e `history.ts`: relógio monotônico, eventos únicos e resumos locais.
- `src/components/torvik`: apresentação, preservando cores e mascote.
- `tests`: regressões, integração com recursos simulados e fluxos de navegador.

## Laboratório experimental

Em desenvolvimento, `/lab` compara um vídeo local autorizado nos dois adaptadores: MediaPipe Pose legado e Tasks Vision em Worker. O treino mantém o motor legado. Em um build de avaliação, o laboratório pode ser habilitado com `VITE_ENABLE_POSE_LAB=true`; fica desativado por padrão em produção. Esse sinalizador não é um controle de acesso para dados sigilosos.

A comparação amostra os mesmos instantes a 15 frames/s, por até 60 segundos. Informe a contagem anotada nesse trecho. O resultado mostra erro absoluto de contagem, cobertura de rastreamento e latência. Não mede FPS real nem substitui anotações por repetição, avaliação profissional ou validação de dispositivos. O vídeo permanece no navegador e não é salvo no histórico.

Veja [implementação e validação](docs/validation.md) para limites, protocolo de dispositivos e condições para promover outro motor.

## Lovable e publicação

Este projeto mantém a configuração compartilhada do [Lovable](https://lovable.dev/projects/bd5e11ce-70fe-4949-9e7d-1f9d8eda2a3c). A publicação indicada originalmente é [torvik.lovable.app](https://torvik.lovable.app); sua equivalência com o código local não foi confirmada.

Trabalhe em branches `codex/…`, valide por Pull Request e Vercel Preview antes de integrar à produção. Confirme no painel as branches conectadas ao Lovable e à Vercel; o nome `main` no Git não comprova essa configuração. Evite alterações simultâneas nos mesmos arquivos pelo editor. Não reescreva commits publicados com force push, rebase, amend ou squash. Reverta mudanças com um novo commit de reversão. O build local não publica o aplicativo.
