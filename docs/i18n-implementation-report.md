# Torvik — implementação e validação de internacionalização

Data da consolidação: 16/10/2026 (UTC). Este relatório separa implementação, testes simulados e validação humana. Nenhum idioma é declarado completamente validado em dispositivos reais.

## Implementação

A análise inicial identificou React 19, TypeScript, TanStack Start/Router com SSR, Vite, Bun, Playwright, autenticação Supabase, histórico local em IndexedDB e preferências de voz em localStorage. O catálogo contém 30 exercícios. A fila de voz existente já possuía prioridades, expiração, cancelamento, limite de mensagens e controle de frequência; ela foi ampliada para vários idiomas. Não foi criado outro motor de voz.

- i18next e react-i18next compartilham 11 catálogos de traduções previamente escritas. Não há tradução automática em tempo real, serviço pago ou requisição de tradução por evento.
- Detecção ordenada de `navigator.languages`, alternativa `navigator.language`, correspondência regional e fallback inglês. Exemplos: pt-PT → pt-BR, en-GB → en, es-MX → es, fr-CA → fr.
- Preferência `auto` ou idioma manual em `torvik.language.v1`. Alterações de idioma do dispositivo só prevalecem em modo automático. Eventos entre abas são tratados. Falhas de armazenamento mantêm a sessão utilizável.
- Seletor com nomes nativos em Ajustes e no painel de câmera/voz durante o treino. A preferência de áudio permanece independente em `torvik.voice.v1`.
- Interface, catálogo, preparação, feedback, autenticação, configurações, histórico, estatísticas, CSV legível e relatório HTML traduzidos. Números, listas, datas, durações e percentuais usam Intl.
- Chaves naturais em português foram mantidas para resolver os identificadores legados de feedback. IDs de exercícios, registros históricos, nomes/e-mails fornecidos pelo usuário, enums e valores numéricos de exportações estruturadas não foram traduzidos.
- Árabe usa `dir="rtl"`, alinhamentos/propriedades lógicas e inversão individual de setas de navegação. Câmera, canvas, coordenadas corporais e animações não são espelhados pela mudança de idioma.
- Voz selecionada por variante regional, depois idioma base; preferência adicional por voz local. A lista assíncrona usa `voiceschanged`. Sem voz compatível, o treino mantém o feedback escrito e não fala em outro idioma. A camada de voz também recusa fallback textual em outro idioma.
- Trocar idioma cancela fala/fila antigas, limpa observações obsoletas e preserva os identificadores de repetições. Desativar voz cancela áudio. Ativação explícita, erros, bloqueio do navegador e timeout de reprodução preservam a análise dos movimentos.
- Mantidos os limites existentes: até 3 mensagens pendentes, intervalo de mensagens comuns de 8 segundos e repetição da mesma correção normalmente após 24 segundos, além de evidência temporal, prioridade, validade e expiração.
- Preferências são resolvidas antes da montagem das rotas interativas. O SSR entrega uma estrutura inicial estável; `useSyncExternalStore` sincroniza `lang` e `dir` sem perder alterações ocorridas durante a hidratação.
- Integração futura com Capacitor por adaptador opcional `LocaleProvider.nativeLanguage`, compatível com `Device.getLanguageTag`. Nenhuma dependência nativa foi instalada.

Os arquivos dos algoritmos em `src/lib/exercises/`, `biomech.ts`, `mediapipe.ts`, `camera.ts` e `session.ts` permanecem sem alterações. A nova camada consome eventos existentes, fora do processamento de cada frame. A arquitetura atual não possui sincronização de configurações por conta nem módulos sociais implementados; não foi acrescentado um backend paralelo.

## Catálogos e qualidade das traduções

**970 chaves por idioma; 10.670 valores no total.** A validação compara chaves ausentes/extras, valores vazios, multiconjuntos de variáveis interpoladas e caracteres inválidos (incluindo substituição Unicode e surrogates isolados). Asserções de interpolação e fallback complementam a verificação estrutural. Uma auditoria AST compara 804 chaves usadas no código com todos os catálogos, incluindo mensagens dinâmicas de análise, câmera, autenticação e dicas de preparação; isso detecta ausências comuns a todos os arquivos. A auditoria final acrescentou 16 mensagens por idioma (176 valores), registradas em `i18n-final-additions.json`.

| Idioma | Código TTS | A: validade técnica | B: revisão semântica | C: integração TTS simulada | D: áudio real | E: pronúncia humana |
| --- | --- | --- | --- | --- | --- | --- |
| Português brasileiro (pt-BR) | pt-BR | 970; sem erros | Origem + 42 mensagens críticas por IA | Sim | Não testado | Pendente |
| English (en) | en-US | 970; sem erros | Revisão inicial + 42 críticas por IA | Sim | Não testado | Pendente |
| Español (es) | es-ES | 970; sem erros | Revisão inicial + 42 críticas por IA | Sim | Não testado | Pendente |
| Français (fr) | fr-FR | 970; sem erros | 181 chaves auditadas + revisão crítica por IA | Sim | Não testado | Pendente |
| Deutsch (de) | de-DE | 970; sem erros | 181 chaves auditadas + revisão crítica por IA | Sim | Não testado | Pendente |
| Italiano (it) | it-IT | 970; sem erros | Revisão inicial + 42 críticas por IA | Sim | Não testado | Pendente |
| 日本語 (ja) | ja-JP | 970; sem erros | Revisão inicial + 42 críticas por IA | Sim | Não testado | Pendente |
| 简体中文 (zh-CN) | zh-CN | 970; sem erros | Revisão inicial + 42 críticas por IA | Sim | Não testado | Pendente |
| 한국어 (ko) | ko-KR | 970; sem erros | 254 adições revisadas + 42 críticas por IA | Sim | Não testado | Pendente |
| हिन्दी (hi) | hi-IN | 970; sem erros | 255 adições revisadas + 42 críticas por IA | Sim | Não testado | Pendente |
| العربية (ar) | ar-SA | 970; sem erros | Revisão inicial + 42 críticas por IA | Sim | Não testado | Pendente |

As contagens semânticas têm sobreposição e **não devem ser somadas**. Revisão durante a tradução não equivale a uma segunda auditoria independente. Os registros iniciais descrevem inventários de 829–940 entradas; o inventário técnico final é 970. As 699 traduções previamente presentes em hindi/coreano não receberam nova auditoria semântica integral. Francês/alemão registram explicitamente 773 entradas fora da auditoria independente de 181 chaves.

Evidências de revisão: [inglês](i18n-review-en.md), [espanhol/italiano](i18n-review-es-it.md), [francês/alemão](i18n-review-fr-de.md), [japonês/chinês](i18n-review-ja-zh.md), [árabe](i18n-review-ar.md), [coreano](i18n-review-ko.md), [hindi](i18n-review-hi.md) [mensagens críticas](i18n-review-critical.md) e [16 adições finais](i18n-review-final-additions.md).

A auditoria crítica conferiu 36 mensagens faladas de postura e 7 referências, com uma sobreposição: **42 chaves × 11 idiomas = 462 valores**. Foram preservadas direção, anatomia, negações, preparação e ressalvas. Foram aplicados 15 esclarecimentos de flexão do cotovelo/proximidade do braço superior, mantendo as chaves estáveis. Outras 7 correções de precisão/naturalidade em francês/alemão estão documentadas no registro específico.

O [corpus de áudio](i18n-audio-reference.json) contém **77 frases**: início, preparação, postura, repetições, incentivo, segurança e finalização em cada idioma. Os indicadores de reprodução real e revisão humana continuam falsos. Testes verificam os textos encaminhados ao TTS, sem presumir captura do áudio sintetizado.

## Testes executados

| Verificação | Resultado observado |
| --- | --- |
| TypeScript da aplicação e dos testes | Aprovado |
| ESLint | 0 erros; 8 avisos de exportação React Refresh (7 já existentes e 1 no provider) |
| Bun: testes unitários e de integração | **233 aprovados, 0 reprovados; 1.959 asserções** |
| Catálogos | **11 × 970 valores; 0 ausências, extras, vazios, erros de variáveis ou codificação** |
| Cobertura de fontes | **804 chaves extraídas do código presentes nos 11 catálogos** |
| Build de produção (`cloudflare-module`, preset padrão do projeto) | Aprovado |
| Build de hospedagem (`vercel`, Node 24.19.0) | Aprovado; não publicado |
| Playwright i18n, produção, desktop/mobile | **46 aprovados, 0 reprovados; 176 screenshots** |
| Playwright regressão dos fluxos existentes | **134 aprovados, 0 reprovados** |
| Playwright autenticação simulada e i18n de acesso | **34 aprovados, 0 reprovados; 66 screenshots de i18n** |

**Total final: 233 testes unitários/de integração e 214 testes de navegador aprovados; 0 reprovações nas execuções finais.** As rodadas de desenvolvimento anteriores tiveram falhas de hidratação, esperas de inicialização e expectativas antigas; as correções foram confirmadas nas execuções finais, sem ocultar essas falhas históricas.

Evidências locais: [check](../test-results/check-final.log), [cobertura JSON](../test-results/i18n-coverage.json), [i18n no navegador](../test-results/i18n-browser-final.log), [regressão](../test-results/regression-final.log) e [autenticação](../test-results/auth-final.log), [build Vercel](../test-results/vercel-build-final.log) e [resumo JSON](../test-results/i18n-final-summary.json). Artefatos de teste são ignorados pelo Git e preservados no workspace; o CI está configurado para publicá-los como artefatos da execução.

O build medido gerou um chunk principal de 1.466,73 kB (406,75 kB gzip), incluindo a infraestrutura existente e os catálogos. Isso mede tamanho de saída, não desempenho de execução.

Os testes de voz usam mocks da Web Speech API. Cobrem os 11 códigos regionais, as 77 frases de referência, descoberta assíncrona de vozes, escolha regional, ausência de voz, callbacks, cancelamento, mudança de idioma, mute, fila limitada, mensagens expiradas, cadência e erros. Eventos simulados incluem contagem regressiva, início, correção, repetição, isometria e finalização.

Os testes visuais percorrem início, categorias/cards, detalhes do exercício, ajustes, histórico e relatório nos 11 idiomas, em desktop e em viewport móvel. Verificam overflow horizontal, controles fora da viewport, seleção automática/manual, persistência, direção e erros JavaScript. Um segundo fluxo cobre preparação e controles de treino em cada idioma, alternando idioma/voz e comprovando que a mesma faixa de vídeo continua ativa.

As screenshots são evidências para inspeção; **não existe comparação automática com baselines de pixels nem aprovação humana de todas as imagens**. Os 134 testes de regressão terminaram em 15 minutos; o Playwright sinalizou arquivos lentos do catálogo, sem falhas. A validação de autenticação acrescenta telas de login com erro, cadastro e recuperação nos 11 idiomas, em desktop/mobile. Foram geradas **242 screenshots de i18n** (176 do aplicativo/treino e 66 de autenticação). Uma amostra de árabe e hindi foi inspecionada visualmente por IA, sem aprovação tipográfica humana. O Chromium usa câmera sintética e estimador controlado. Esses testes não comprovam precisão do MediaPipe em movimentos reais. Os testes de autenticação usam respostas Supabase simuladas.

### Falhas encontradas e corrigidas durante a implementação

- Inventário incompleto, textos dinâmicos fora dos catálogos e chave contendo HTML integral: catálogo normalizado, chave HTML removida, textos integrados e variáveis preservadas.
- Métodos fixos de data/duração e textos de exportação: formatação Intl e templates traduzidos, preservando formatos de dados estruturados.
- Hidratação SSR: troca de idioma antes da hidratação de rotas lazy causava divergência de textos; a estrutura raiz agora recebe snapshots de idioma e direção. Corrigido com inicialização anterior às rotas e assinatura de snapshots. Nos testes de desenvolvimento, carregar 252 recursos podia exceder 5 segundos; a espera explícita de inicialização foi ampliada e a validação final usa o build de produção.
- Seletor oculto na variante expandida dos controles de treino: corrigido sem duplicá-lo na tela de Ajustes.
- Ambiguidades anatômicas em prompts: esclarecimentos registrados na revisão crítica e na revisão francês/alemão.
- Expectativas antigas nos testes: ajustadas ao espaçamento produzido por Intl (`6 min 30 s`), nomes próprios dos exercícios nos botões e mensagens de voz agora válidas para qualquer idioma.
- Importação JSON pelos testes Node: adicionados atributos de tipo JSON.
- Execuções iniciais bloqueadas por sockets do sandbox ou por fixture incompatível com o preset de build: não contabilizadas como testes aprovados; execução final de i18n usa o build de produção/Chromium com permissão de rede do sandbox.

## Limitações e validação pendente

1. Não houve reprodução real, captura, escuta, avaliação de pronúncia ou naturalidade em nenhum idioma. É necessária revisão por falantes nativos, especialmente anatomia e instruções de segurança.
2. Android/iOS físicos, Safari/WebKit, Firefox e uma aplicação Capacitor empacotada não foram testados. Emulação móvel do Chromium não representa esses ambientes.
3. Vozes dependem do navegador/sistema e podem usar serviço online. Offline e disponibilidade de todos os idiomas não são garantidos. Bloqueios de reprodução são tratados, mas comportamento real de ativação exige ensaio em cada plataforma.
4. Fontes CJK, árabe e devanágari usam fallback do sistema. Overflow pode ser verificado automaticamente; forma dos glifos, ligaduras, tipografia e leitura RTL precisam de inspeção humana nos dispositivos finais. Os testes bloqueiam o download de fontes Google para serem reproduzíveis.
5. Os 11 catálogos são carregados com o aplicativo para evitar atrasos/requisições em trocas durante o treino. O custo inicial está registrado no build; não foi realizado benchmark de latência, memória ou FPS em celulares físicos. Carregamento por idioma é uma evolução possível se o catálogo crescer.
6. Preferências ficam neste navegador/dispositivo, sem sincronização com a conta. Sem JavaScript, a estrutura SSR inicial não oferece os fluxos interativos do aplicativo.
7. Textos fornecidos pelo usuário e rótulos nativos das câmeras permanecem como recebidos. Componentes genéricos de UI não utilizados por telas atuais ainda podem conter rótulos padrão em inglês; devem ser internacionalizados se forem incorporados ao produto.

### Protocolo para revisão humana e dispositivos

Para cada idioma, registrar modelo/OS/navegador, data, nome/idioma/localidade da voz, disponibilidade online/offline e revisor. Executar as 7 frases do corpus após interação explícita, verificar texto mostrado, reprodução, interrupção, troca de idioma, mute e ausência de voz. Avaliar anatomia, sentido, ritmo, números, pronúncia e naturalidade; registrar problemas por chave. Conferir screenshots e telas reais com textos longos, menus e leitura RTL. Captura externa de áudio só quando disponível e autorizada; a Web Speech API não fornece garantia de captura direta.

## Reprodução dos testes

```bash
bun install --frozen-lockfile
bun run check
bun run test:e2e:i18n
bun run test:e2e
TORVIK_AUTH_TEST=1 VITE_SUPABASE_URL=https://torvik-auth-test.supabase.co \
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_test \
bun run test:e2e tests/e2e/auth.spec.ts tests/e2e/i18n-auth.spec.ts
bun scripts/audio-reference.ts
```

No ambiente de execução, Bun 1.3.10 foi disponibilizado em `/workspace/.torvik-tools/node_modules/.bin` e Chromium em `/usr/bin/chromium`; `TORVIK_CHROMIUM_PATH` seleciona esse navegador. O Node principal disponível é 24.19.0. O pacote local de ferramentas também trouxe Node 20.20.2, usado no processo de autenticação de desenvolvimento e no primeiro build final; o projeto/CI fixa a série 22. O build Vercel final foi executado com Node 24.19.0. A série 22 não foi executada localmente; isso é uma limitação da matriz de versões, não uma alteração dos requisitos do projeto. O CI usa `bun run check`, incluindo validação de traduções, e guarda os artefatos de navegador também em execuções bem-sucedidas. Resultados do CI remoto não foram presumidos.

## Arquivos criados e modificados

Inventário da implementação: **42 arquivos criados e 41 modificados**. Artefatos gerados em `test-results/`, `.output/` e `.vercel/` não integram esse inventário.

### Criados

- [`docs/i18n-additional-source.json`](../docs/i18n-additional-source.json)
- [`docs/i18n-audio-reference.json`](../docs/i18n-audio-reference.json)
- [`docs/i18n-export-additions.json`](../docs/i18n-export-additions.json)
- [`docs/i18n-final-additions.json`](../docs/i18n-final-additions.json)
- [`docs/i18n-implementation-report.md`](../docs/i18n-implementation-report.md)
- [`docs/i18n-review-ar.md`](../docs/i18n-review-ar.md)
- [`docs/i18n-review-critical.md`](../docs/i18n-review-critical.md)
- [`docs/i18n-review-en.md`](../docs/i18n-review-en.md)
- [`docs/i18n-review-es-it.md`](../docs/i18n-review-es-it.md)
- [`docs/i18n-review-final-additions.md`](../docs/i18n-review-final-additions.md)
- [`docs/i18n-review-fr-de.md`](../docs/i18n-review-fr-de.md)
- [`docs/i18n-review-hi.md`](../docs/i18n-review-hi.md)
- [`docs/i18n-review-ja-zh.md`](../docs/i18n-review-ja-zh.md)
- [`docs/i18n-review-ko.md`](../docs/i18n-review-ko.md)
- [`docs/i18n-ui-additions.json`](../docs/i18n-ui-additions.json)
- [`scripts/audio-reference.ts`](../scripts/audio-reference.ts)
- [`scripts/check-translations.ts`](../scripts/check-translations.ts)
- [`scripts/translation-source.ts`](../scripts/translation-source.ts)
- [`src/components/torvik/LanguageControls.tsx`](../src/components/torvik/LanguageControls.tsx)
- [`src/components/torvik/format.ts`](../src/components/torvik/format.ts)
- [`src/lib/i18n/index.ts`](../src/lib/i18n/index.ts)
- [`src/lib/i18n/languages.ts`](../src/lib/i18n/languages.ts)
- [`src/lib/i18n/provider.tsx`](../src/lib/i18n/provider.tsx)
- [`src/lib/i18n/validation.ts`](../src/lib/i18n/validation.ts)
- [`src/lib/voice/reference.ts`](../src/lib/voice/reference.ts)
- [`src/locales/ar/translation.json`](../src/locales/ar/translation.json)
- [`src/locales/de/translation.json`](../src/locales/de/translation.json)
- [`src/locales/en/translation.json`](../src/locales/en/translation.json)
- [`src/locales/es/translation.json`](../src/locales/es/translation.json)
- [`src/locales/fr/translation.json`](../src/locales/fr/translation.json)
- [`src/locales/hi/translation.json`](../src/locales/hi/translation.json)
- [`src/locales/it/translation.json`](../src/locales/it/translation.json)
- [`src/locales/ja/translation.json`](../src/locales/ja/translation.json)
- [`src/locales/ko/translation.json`](../src/locales/ko/translation.json)
- [`src/locales/pt-BR/translation.json`](../src/locales/pt-BR/translation.json)
- [`src/locales/zh-CN/translation.json`](../src/locales/zh-CN/translation.json)
- [`tests/e2e/i18n-auth.spec.ts`](../tests/e2e/i18n-auth.spec.ts)
- [`tests/e2e/i18n-workout.spec.ts`](../tests/e2e/i18n-workout.spec.ts)
- [`tests/e2e/i18n.spec.ts`](../tests/e2e/i18n.spec.ts)
- [`tests/i18n-voice.test.ts`](../tests/i18n-voice.test.ts)
- [`tests/i18n.test.ts`](../tests/i18n.test.ts)
- [`tests/locale-setup.ts`](../tests/locale-setup.ts)

### Modificados

- [`.github/workflows/check.yml`](../.github/workflows/check.yml)
- [`README.md`](../README.md)
- [`bun.lock`](../bun.lock)
- [`bunfig.toml`](../bunfig.toml)
- [`package.json`](../package.json)
- [`playwright.config.ts`](../playwright.config.ts)
- [`src/components/torvik/AccountCard.tsx`](../src/components/torvik/AccountCard.tsx)
- [`src/components/torvik/AppNavigation.tsx`](../src/components/torvik/AppNavigation.tsx)
- [`src/components/torvik/AuthScreen.tsx`](../src/components/torvik/AuthScreen.tsx)
- [`src/components/torvik/ExerciseDetailScreen.tsx`](../src/components/torvik/ExerciseDetailScreen.tsx)
- [`src/components/torvik/HistoryScreen.tsx`](../src/components/torvik/HistoryScreen.tsx)
- [`src/components/torvik/HomeScreen.tsx`](../src/components/torvik/HomeScreen.tsx)
- [`src/components/torvik/PoseLab.tsx`](../src/components/torvik/PoseLab.tsx)
- [`src/components/torvik/ReportScreen.tsx`](../src/components/torvik/ReportScreen.tsx)
- [`src/components/torvik/SettingsScreen.tsx`](../src/components/torvik/SettingsScreen.tsx)
- [`src/components/torvik/TorvikUI.tsx`](../src/components/torvik/TorvikUI.tsx)
- [`src/components/torvik/VoiceControls.tsx`](../src/components/torvik/VoiceControls.tsx)
- [`src/components/torvik/WorkoutGroupCard.tsx`](../src/components/torvik/WorkoutGroupCard.tsx)
- [`src/components/torvik/WorkoutScreen.tsx`](../src/components/torvik/WorkoutScreen.tsx)
- [`src/components/torvik/history/ActivityCalendar.tsx`](../src/components/torvik/history/ActivityCalendar.tsx)
- [`src/components/torvik/history/EvolutionChart.tsx`](../src/components/torvik/history/EvolutionChart.tsx)
- [`src/components/torvik/history/SessionComparison.tsx`](../src/components/torvik/history/SessionComparison.tsx)
- [`src/components/torvik/history/SessionDetail.tsx`](../src/components/torvik/history/SessionDetail.tsx)
- [`src/components/torvik/history/SideResults.tsx`](../src/components/torvik/history/SideResults.tsx)
- [`src/components/ui/dialog.tsx`](../src/components/ui/dialog.tsx)
- [`src/components/ui/sheet.tsx`](../src/components/ui/sheet.tsx)
- [`src/hooks/use-workout-voice.ts`](../src/hooks/use-workout-voice.ts)
- [`src/lib/error-page.ts`](../src/lib/error-page.ts)
- [`src/lib/history-export.ts`](../src/lib/history-export.ts)
- [`src/lib/progress.ts`](../src/lib/progress.ts)
- [`src/lib/voice/speech.ts`](../src/lib/voice/speech.ts)
- [`src/lib/voice/workout-voice.ts`](../src/lib/voice/workout-voice.ts)
- [`src/routes/__root.tsx`](../src/routes/__root.tsx)
- [`src/routes/index.tsx`](../src/routes/index.tsx)
- [`src/routes/lab.tsx`](../src/routes/lab.tsx)
- [`src/styles.css`](../src/styles.css)
- [`tests/e2e/history.spec.ts`](../tests/e2e/history.spec.ts)
- [`tests/e2e/navigation.spec.ts`](../tests/e2e/navigation.spec.ts)
- [`tests/e2e/workout.spec.ts`](../tests/e2e/workout.spec.ts)
- [`tests/progress.test.ts`](../tests/progress.test.ts)
- [`tests/voice.test.ts`](../tests/voice.test.ts)
