# Implementação e validação do Torvik

## Entrega local

A implementação preserva o framework, a configuração compartilhada do Lovable e a identidade visual. Não adiciona contas, backend de treinos ou upload de vídeo.

| Área               | Resultado                                                                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Câmera             | Controle por tentativa, limpeza idempotente, descarte de streams/modelos tardios, resultados ignorados após cancelamento, inferência sequencial e watchdog |
| Carregamento       | Script compartilhado entre chamadas simultâneas, timeout, remoção após erro e nova tentativa real                                                          |
| Geometria          | Coordenadas convertidas pelas dimensões reais do vídeo; medições não finitas ou degeneradas rejeitadas                                                     |
| Contagem           | Posição inicial confirmada, histerese, confirmação temporal, descarte de ciclos parciais após perda ou intervalo excessivo                                 |
| Exercícios         | Lado mais visível escolhido e mantido durante o ciclo de agachamento/flexão; abertura simultânea no polichinelo                                            |
| Sessão             | Preparação, câmera selecionável quando disponível, contagem regressiva, pausa, retomada consciente e pausa ao ocultar a página                             |
| Relatório          | Eventos deduplicados, duração ativa, critérios do app, interrupções separadas e estado de dados insuficientes                                              |
| Histórico          | Salvamento explícito, IndexedDB v1, exportação JSON, exclusão e comparação apenas entre versões compatíveis                                                |
| Interface          | Frame completo com vídeo/canvas alinhados, áreas próprias para ações, seleção por radio, instruções independentes, pt-BR e foco visível                    |
| Desempenho         | Canvas redimensionado apenas quando necessário, frames repetidos ignorados, atualização seletiva do HUD e mascotes WebP responsivos                        |
| Diagnóstico        | Removida correlação global de erros entre requisições; não registrar frames, landmarks ou erro bruto no bridge de preview                                  |
| Evolução do modelo | Adaptador comum e laboratório isolado; Tasks Vision ainda experimental, sem promoção ao treino                                                             |

## Regras iniciais, sem validação científica

A versão `2.0.0` define posição inicial estável por 300 ms; transições por 150 ms; amplitude por 100 ms; interrupção após intervalo superior a 750 ms. Agachamento e flexão iniciam abaixo de 150°, terminam a partir de 160° e usam 90° para o critério inicial de amplitude. As regras mantêm limites de inclinação/alinhamento de 40°/25°. Esses valores são parâmetros de engenharia para avaliação, não prescrição de exercício.

A duração ativa começa após a contagem regressiva e inclui somente períodos com rastreamento e posição inicial reconhecidos. Pausas, preparação e carregamento ficam excluídos. Frames congelados suspendem o relógio após a tolerância de 750 ms; o watchdog encerra a tentativa sem novos resultados após 20 segundos. A rotação que altera as dimensões do frame solicita nova preparação.

Se a inferência legada nunca resolver, as tracks são encerradas e seus resultados descartados, mas o fechamento do WASM aguarda essa operação terminar para evitar fechamento concorrente. Não há API de aborto do `send` legado. A requisição de permissão pode permanecer pendente até resposta do navegador; o cancelamento da tela é imediato e qualquer stream recebido depois é encerrado.

A suavização extra da aplicação foi removida; permanece a suavização do estimador legado. O efeito na latência e na qualidade precisa ser medido em aparelhos reais. A correção de escala 2D não corrige perspectiva ou oclusão, e coordenadas 3D estimadas não são adotadas nas regras.

## Verificações reproduzíveis

Ambiente utilizado: Node 20.20.2 e Bun 1.3.10. O baseline anterior passava em tipos/build, mas tinha 17 erros e 7 avisos de lint. A implementação elimina os erros; permanecem avisos de Fast Refresh em componentes auxiliares existentes.

Resultado da execução local em 22/09/2026: **24 testes unitários/integração e 8 E2E aprovados**, tipos aprovados, lint com zero erros e seis avisos, build Vercel aprovado. Os testes do laboratório cobrem métricas e cancelamento com modelos simulados, sem validar a inferência real dos motores.

- Unitários/integração: geometria conhecida em diferentes proporções; pontos inválidos; pequenas oscilações; início no meio do ciclo; amplitude parcial; ciclos completos; lado fixo; perdas e intervalos longos; polichinelo sem simultaneidade; permissões tardias; cancelamento durante criação/inferência; falha de reprodução; desconexão; timeout; repetição de frames; retry de script; eventos únicos; relógio e IndexedDB.
- E2E: seleção/instruções por teclado; preparação → contagem regressiva → repetição → pausa → retomada; sinal simulado de página oculta; relatório; salvamento; recarregamento; exclusão; relatório vazio; reinício; retry e enquadramento em 360×800, 390×844 e 844×390.
- Instalação congelada e build com `NITRO_PRESET=vercel`. O preset foi testado sem duplicar plugins Nitro na configuração Vite.
- Auditoria de dependências: correções limitadas no lockfile para `brace-expansion` (1.1.18 e 5.0.9), `nanoid` (3.3.18) e `js-yaml` (4.3.2); `bun audit` sem vulnerabilidades reportadas na execução local. Isso não constitui certificação de segurança.

## Validação ainda necessária antes de produção

A aprovação da primeira fase depende de preview e aparelhos reais. A emulação não prova permissões, campo de visão, WASM, temperatura, bateria ou desempenho da câmera. Nenhum teste físico Android/iPhone, avaliação profissional ou comparação com vídeos consentidos foi realizado nesta entrega. O novo adaptador foi compilado e tipado; sua compatibilidade de Worker/WASM deve ser comprovada antes de uso fora do laboratório.

1. Confirmar branches e runtime nos painéis Lovable/Vercel e criar um Preview da branch de implementação. Não presumir equivalência com a publicação atual.
2. Em Safari/iPhone e Chrome/Android, testar permitir/negar câmera, cancelar durante permissão e carga, câmera ocupada/removida, perda/restauração de conexão, troca frontal/traseira, rotação, segundo plano e várias sessões seguidas. Verificar o indicador de câmera após sair.
3. Conferir os quatro limites do frame e o esqueleto em retrato/paisagem, texto ampliado, teclado e VoiceOver/TalkBack. Medir contraste e legibilidade do feedback à distância.
4. Fazer sessões prolongadas nos mesmos dispositivos, registrando versão do navegador, resolução entregue, latência, falhas, aquecimento e bateria. Comparar resolução/suavização sem mudar múltiplos fatores de uma vez.
5. Inspecionar destinos, payloads e cabeçalhos em Preview, produção e editor. Confirmar ausência de frames/landmarks em rede e logs. Inventariar CSP e demais cabeçalhos da hospedagem antes de reforçá-los, incluindo compatibilidade com WASM, fontes e Lovable.
6. Confirmar remoção do histórico, armazenamento indisponível, exportação e recuperação após recarregar. O navegador pode remover dados locais; exportação serve de cópia manual.

## Protocolo para regras e estimadores

Formar um conjunto de vídeos com consentimento documentado, anotação por ciclo e revisão profissional. Separar desenvolvimento e avaliação; registrar exercício, aparelho, orientação, enquadramento, cadência, oclusão, contagem, início/fim e critérios por repetição. Não incluir vídeo ou dados pessoais no repositório. Começar cada vídeo com a posição inicial visível por pelo menos 300 ms.

Executar os dois motores sobre os mesmos arquivos e instantes. O laboratório fornece erro absoluto de contagem, proporção de frames rastreados e latências média/p95 internamente (p95 na interface). Para falsos positivos/negativos e concordância por repetição, é necessário acrescentar anotações temporais e correspondência de eventos; uma diferença de totais sozinha não mede esses indicadores.

Definir critérios de aceitação por aparelho/exercício antes de comparar: erro de contagem, falsos positivos/negativos, tempo sem rastreamento, concordância de critérios, latência e falhas. Promover Tasks Vision somente após satisfazê-los, mantendo reversão para o legado. Avaliar distribuição local de WASM/modelos e comparação 2D/3D como experimentos separados. Não divulgar precisão científica sem protocolo, dados e revisão que sustentem a alegação.

## Entrega e reversão

A CI valida Pull Requests; não faz deploy. O trabalho local não confirma a branch de produção nem altera serviços externos. Após aprovação do Preview e dos dispositivos, integrar sem reescrever histórico publicado. Reverter por novo commit e, se necessário, restaurar a implantação anterior na Vercel. O schema persistido é versionado; futuras migrações devem preservar dados ou apresentar recuperação explícita antes de mudar a versão do banco.

## Expansão para 30 exercícios — 06/10/2026

Implementação em `codex/catalog-30`. O código confirma 30 IDs únicos e grupos
8 pernas/glúteos, 8 superiores, 7 core e 7 cardio. Os 16 IDs anteriores, suas regras
e 48 arquivos de preview foram preservados. Regras específicas, câmeras, parâmetros
e limitações dos 14 novos exercícios estão em [catalog-30.md](catalog-30.md).

Ambiente: Node 20.20.2, Bun 1.3.10, Pillow 12.3 e Chromium instalado no ambiente.
Manifesto e lockfile não foram alterados. As verificações finais foram:

| Verificação                            | Resultado                                                                                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun run typecheck`                    | Aprovado, incluindo os testes.                                                                                                                          |
| `bun run lint`                         | Zero erros, seis avisos de Fast Refresh preexistentes nos componentes UI.                                                                               |
| `bun run test`                         | **156 testes aprovados**, 944 asserções, incluindo 41 testes novos e regressões anteriores.                                                             |
| `bun run build`                        | Aprovado para cliente, SSR e Nitro.                                                                                                                     |
| `NITRO_PRESET=vercel bun run build`    | Aprovado, sem publicação.                                                                                                                               |
| Playwright em Chromium móvel e desktop | **110 cenários únicos aprovados em execuções por grupos**: 74 anteriores e 36 novos.                                                                    |
| Assets novos                           | 42 arquivos presentes e decodificados: 14 animações, 14 miniaturas e 14 faixas lossless. Alpha, margens, loop, dimensões, duração e hashes verificados. |
| Assets anteriores                      | Os 48 arquivos permanecem idênticos por SHA-256.                                                                                                        |
| Largura e reprodução                   | 14 previews animados em 360/390px, movimento reduzido, troca de lado e cronômetros; inspeção visual adicional em 390×844.                               |
| Layout final do treino                 | Seis cenários direcionados aprovados após limitar a coluna do grid: isometrias em 360/390px e câmera/ações em retrato e paisagem.                       |
| `git diff --check`                     | Aprovado.                                                                                                                                               |

O ambiente usou `node_modules/.cloud-playwright.mjs` para apontar ao Chromium
instalado, câmera sintética e estimador controlado. O servidor local e o navegador
exigiram permissão de execução fora do sandbox; isso não publica o aplicativo.
As regressões finais corrigem seletores ambíguos de Agachamento/Polichinelo e a
contagem anterior de sete membros superiores. Os prazos de execução locais foram
ajustados para incluir recarregamento e revisão de todos os previews.

Os testes cobrem ciclos completos/parciais, preparação, ausência de pose, confiança
baixa, valores inválidos, lacunas, jitter, espelhamento, lados alternados/selecionados,
membros opostos, flexão simultânea indevida nas corridas, aquisição/pausa das
isometrias, troca de lado com tempos separados, persistência, exportação e evolução.
Nenhuma mudança promoveu Tasks Vision ao treino.

**Análise implementada e verificada com dados sintéticos; não validada com
movimentos reais.** Continuam pendentes vídeos consentidos anotados por ciclo/lado,
calibração dos limiares, avaliação de falsos positivos/negativos e erro do tempo
válido, além de câmera, desempenho e acessibilidade em Android/Chrome e iPhone/Safari.
O patinador não comprova fase aérea; o agachamento com salto estima elevação em 2D e
pode confundir movimento vertical da câmera. Ambos exigem câmera fixa. As demais
limitações específicas são apresentadas antes do início e na documentação.

Na entrega local inicial, ainda não havia commit, push ou deploy. Arquivos temporários de revisão permanecem fora
do repositório em `/workspace/work/torvik-catalog30`.

### Revalidação para integrar à main — 06/10/2026

A implementação foi salva no commit `9a840b1`. Após atualizar as referências,
`origin/main` estava em `01470b61187ae30f00a017a817e6ff52f204e4c5`, ancestral da
implementação. A integração local foi por fast-forward, sem conflitos ou
reescrita de histórico, conforme autorização para publicação direta na main.

Foram repetidos tipos, lint, os 156 testes unitários, os builds padrão e Vercel,
a decodificação e os hashes dos 42 assets novos, além da integridade dos 48
anteriores. Todos passaram; o lint manteve os seis avisos preexistentes.

A execução simultânea de dois navegadores foi interrompida após falhas de início
automático sob limitação de CPU. Com um único worker, a suíte completa teve
108 aprovações e duas falhas: amostragem do ciclo sintético de calcanhares aos
glúteos e rolagem da orientação sob a ação fixa. Os testes agora aguardam amostras
contínuas de cada pose, incluindo a posição inicial, e centralizam a orientação
antes de avaliar sua posição em relação ao botão. Os limiares e as regras do
produto não foram alterados.

Após esses ajustes, tipos e lint passaram novamente. A repetição direcionada
teve **12 aprovações**, cobrindo os dois cenários que falharam, patinador, salto e
trocas de lado nos perfis móvel e desktop. Somando a suíte completa e a repetição,
os **110 cenários únicos** tiveram execuções aprovadas. Não houve uma única
execução da suíte completa com 110 aprovações. A validação prática com movimentos
reais e dispositivos físicos continua pendente, conforme descrito acima.

### Atualização de segurança do TanStack Start — 06/10/2026

Para corrigir o bloqueio de implantação informado para CVE-2026-102989,
`@tanstack/react-start` foi atualizado de `1.168.32` para `1.168.60`.
`@tanstack/react-router` passou a `1.170.41` e `@tanstack/router-plugin` a
`1.168.42`, acompanhando as dependências exatas do Start e compartilhando
`@tanstack/router-core@1.171.34`. O `bun.lock` foi regenerado com Bun 1.3.10;
há uma única resolução de Start, na versão corrigida, sem cópia de `1.168.32`.

O Start atualizado exige Node 22.12 ou posterior. `.node-version` agora registra
22.23.3, utilizado pela CI existente, e `engines.node` seleciona `22.x` na Vercel.
A configuração gerada em `.vc-config.json` confirmou `nodejs22.x`. A configuração
compartilhada do Lovable continua compatível. O componente de erro raiz usa agora
`ErrorComponentProps`, pois o Router atualizado tipa o erro recebido como
`unknown`; os diagnósticos continuam sanitizados.

Verificações executadas em Node 22.23.3 e Bun 1.3.10:

- Instalação com `bun install --frozen-lockfile`: aprovada, sem alterar o lockfile.
- Tipos: aprovados após ajustar o tipo do componente de erro.
- Lint: zero erros; os mesmos seis avisos de Fast Refresh dos componentes UI.
- Testes unitários: **156 aprovados**, com 944 asserções.
- Builds padrão e `NITRO_PRESET=vercel`: aprovados para cliente, SSR e Nitro.
- SSR da saída Vercel, servido localmente por adaptador HTTP: página inicial
  respondeu 200 e rota inexistente respondeu 404, com os respectivos conteúdos.
- Playwright: **oito cenários direcionados aprovados**, quatro em Chromium móvel
  e quatro em desktop, usando essa saída de produção. Cobrem supino no chão,
  troca de lado e tempos separados da prancha lateral, filtros/gráfico/calendário
  do histórico, preparação, treino, pausa, relatório, salvamento e reinício.
  Nesta atualização não foi repetida a suíte completa de 110 cenários.
- `git diff --check`: aprovado.

`bun audit --json` não reportou vulnerabilidades no TanStack Start ou nos demais
pacotes TanStack resolvidos. O comando continua retornando status 1 por avisos
preexistentes em `brace-expansion` (1.1.18 e 5.0.9), `shell-quote` (1.10.0) e
`source-map-js` (1.2.1), cujas versões já estavam no lockfile anterior e foram
preservadas. Esses achados independentes permanecem pendentes.

No ambiente local, a resolução inicial de metadados em cache ficou parada;
`bun install --no-cache --network-concurrency=1` concluiu a atualização pela mesma
origem npm e pelo proxy configurado. A instalação congelada posterior não precisou
desse ajuste. Ferramentas, logs e adaptadores usados na revisão permanecem fora
dos arquivos versionados.
