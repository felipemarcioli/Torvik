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
