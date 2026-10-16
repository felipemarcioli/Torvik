# Revisão de traduções — japonês e chinês simplificado

Data: 15/10/2026. Idiomas: `ja` (voz `ja-JP`) e `zh-CN` (voz `zh-CN`).

## Escopo e evidência técnica

Foram traduzidas 939 chaves em cada idioma (1.878 valores), incluindo interface, acessibilidade, erros, configurações, privacidade, relatórios, nomes e instruções dos 30 exercícios, feedback de postura e mensagens de voz. As chaves originais em português foram preservadas para compatibilidade com a integração existente.

Validação executada com Python, comparando cada JSON com `src/locales/pt-BR/translation.json`:

- Paridade: 939 chaves por idioma, nenhuma ausente ou extra.
- Nenhuma tradução vazia.
- Todas as variáveis `{{...}}` preservadas, comparadas incluindo sua multiplicidade.
- Nenhum caractere de substituição Unicode U+FFFD ou caractere de controle inválido.
- Únicos valores idênticos ao português: `torvik`, `A` e `B` (marca/identificadores, intencional).
- A chave contendo um documento HTML completo (`<!doctype...`) foi excluída desta comparação e não foi adicionada aos idiomas. O responsável pela integração foi avisado para removê-la do inventário de origem.

Esta verificação é estrutural. Não executa o renderizador React, não comprova substituição em tempo de execução, pronúncia, áudio real nem ausência de problemas visuais. Esses resultados devem ser associados, no relatório consolidado, aos testes de integração efetivamente executados.

## Revisão semântica assistida por IA

Os textos foram traduzidos e revisados comparando o significado com o português durante a elaboração. Não houve tradução automática em tempo real nem uso de tradução reversa como garantia. A revisão não é uma revisão humana independente.

Pontos críticos verificados:

| Grupo | Decisão de tradução e significado preservado |
| --- | --- |
| Postura e anatomia | Distinção entre braço superior (上腕 / 上臂), antebraço (前腕 / 前臂), cotovelo (肘 / 肘), punho (手首 / 腕), quadril/articulação do quadril (腰/股関節 / 髋部/髋关节), joelho e tornozelo. Em japonês, 腰 é usado para a orientação visual da região do quadril; 股関節 para flexão/extensão articular. |
| Prancha | Correções opostas “eleve” e “abaixe” preservadas. A descrição técnica de deslocamento mantém a relação com o eixo ombro–tornozelo e a direção em relação ao apoio. |
| Exercícios unilaterais | O lado contado permanece o da perna estendida, mão movimentada, perna dianteira ou apoio, conforme cada exercício. Trocas de lado não foram convertidas em instrução de trocar a câmera. |
| Terra romeno e remada | Inclinação a partir do quadril, flexão suave dos joelhos e estabilidade do tronco preservadas; sem acrescentar promessa de detectar curvatura da coluna. |
| Segurança e amplitude | “Amplitude confortável”, controle do retorno, respeito aos limites e orientação profissional preservados. Não foram acrescentadas ordens para forçar amplitude ou ignorar dor. |
| Limites da análise | Mantidas todas as ressalvas de estimativa 2D, ausência de validação clínica, incapacidade de comprovar contato, carga, ativação muscular, segurança ou melhora biomecânica. |
| Estatísticas | Distinção entre repetições, ciclos interrompidos e episódios persistentes preservada. Tempo ativo e tempo em postura dentro dos critérios permanecem conceitos separados. |
| Privacidade | Preservada a distinção entre imagens não enviadas, modelos/fontes externos, dados de autenticação no Supabase, armazenamento local por conta e ausência de sincronização. |
| Nomes fitness | Japonês usa nomes correntes como スクワット, デッドバグ e マウンテンクライマー. Chinês usa 深蹲, 死虫式 e 登山跑. “Abdominal” foi traduzido como シットアップ / 仰卧起坐 porque a instrução original eleva o tronco até próximo da posição sentada. |

As chaves legadas “Voz local em português indisponível neste navegador. O treino continua normalmente.” e “Voz local em português pronta.” foram traduzidas semanticamente como disponibilidade de voz **no idioma selecionado**. Manter uma referência a português nesses idiomas seria incorreto. A necessidade de generalizar a origem foi comunicada ao integrador.

## Frases de referência para revisão da fala

Os exemplos abaixo estão armazenados no catálogo. `{{count}}` é substituído antes da síntese; não deve ser lido literalmente.

| Contexto | Chave original | Japonês | Chinês simplificado |
| --- | --- | --- | --- |
| Início | Vamos começar! | 始めましょう！ | 开始吧！ |
| Preparação | Prepare-se. O treino já vai começar. | 準備してください。もうすぐ始まります。 | 请做好准备，训练即将开始。 |
| Postura | Mantenha o corpo alinhado. | 体を一直線に保ってください。 | 保持身体对齐。 |
| Repetições | {{count}} repetições! | {{count}}回です！ | {{count}} 次了！ |
| Incentivo | Muito bem, continue! | いい調子です。そのまま続けましょう！ | 很好，继续！ |
| Segurança | O feedback é uma estimativa do movimento. Respeite seus limites e procure orientação profissional quando precisar. | フィードバックは動きの推定に基づきます。無理をせず、必要に応じて専門家の指導を受けてください。 | 反馈基于动作估算。请量力而行，需要时寻求专业指导。 |
| Finalização | Treino concluído! | ワークアウト完了！ | 训练完成！ |

## Estado de validação

| Classificação | ja | zh-CN |
| --- | --- | --- |
| A — Traduções tecnicamente válidas | Validado estruturalmente: 939 chaves | Validado estruturalmente: 939 chaves |
| B — Traduções semanticamente revisadas | Revisão assistida por IA; revisão nativa pendente | Revisão assistida por IA; revisão nativa pendente |
| C — Integração TTS automatizada | Não executada neste trabalho de tradução; consultar relatório consolidado | Não executada neste trabalho de tradução; consultar relatório consolidado |
| D — Reprodução real | Não testada | Não testada |
| E — Pronúncia/naturalidade por humanos | Pendente | Pendente |

Revisão humana necessária nos dois idiomas: adequação das instruções anatômicas ao vocabulário local de educação física, distinção entre região do quadril e articulação em japonês, nomenclatura de exercícios, duração/concisão das orientações durante movimento e naturalidade dos numerais falados. Testar fontes CJK, quebra de linhas em botões e relatórios, e disponibilidade/pronúncia de vozes reais em Android, iOS e navegadores de desktop. Não se afirma validação completa de nenhum dos dois idiomas.
