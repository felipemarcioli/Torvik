# Revisão de espanhol e italiano

Data: 15/10/2026. Tradução e revisão assistidas por IA, sem aprovação de falantes nativos.

## Escopo e evidências

Foram traduzidos todos os valores das 940 chaves do inventário `pt-BR` disponível nesta revisão para `es` e `it`: interface, preparação, catálogo de 30 exercícios, feedbacks de análise, voz, erros, privacidade, estatísticas e relatórios. Os IDs legados em português foram preservados. A chave do documento HTML integral também foi traduzida, mas está prevista sua remoção pelo integrador; portanto, a contagem final poderá diminuir em uma chave por idioma.

Verificação Python executada nos dois arquivos:

- 940 chaves por idioma; 0 ausentes e 0 extras em comparação com a origem.
- 0 valores vazios.
- 0 divergências de variáveis de interpolação; comparação de multiconjuntos de `{{...}}`, incluindo repetições.
- JSON lido e gravado em UTF-8; 0 caracteres de substituição Unicode e 0 caracteres de controle inválidos.
- Valores idênticos à origem foram inspecionados. Espanhol e português compartilham palavras corretas como “Preparar”, “Filtrar”, “Idioma”, “tipo” e “Automático”; italiano compartilha “Volume” e “tipo”. Nomes internacionais como “Dead bug”, “Bird dog”, “Cardio”, unidades e marca permanecem iguais intencionalmente.

Esta verificação confirma a estrutura dos catálogos; não comprova a renderização dos componentes, funcionamento de fallback, áudio real ou pronúncia. Esses testes pertencem à integração e ao relatório geral.

## Revisão semântica assistida por IA

A revisão comparou o sentido das orientações de preparação, postura, anatomia e segurança com o original, sem depender de tradução reversa. Foram mantidos os comandos direcionais, o lado acompanhado, os critérios de repetição e as ressalvas da análise 2D. Não foram acrescentadas promessas de segurança, diagnóstico ou validação clínica.

| Original / conceito | Espanhol | Italiano | Decisão semântica |
| --- | --- | --- | --- |
| Levantamento terra romeno | Peso muerto rumano | Stacco rumeno | Nomes usuais no contexto de treino; não confundir com agachamento. |
| Flexão de Braço | Flexiones de brazos | Piegamenti sulle braccia | Evitar a ambiguidade entre exercício e flexão articular. |
| Afundo reverso | Zancada hacia atrás | Affondo indietro | Preservado o passo para trás. |
| Eleve um pouco o quadril. | Eleva un poco las caderas. | Solleva un po’ il bacino. | Preservada a direção de elevação; “bacino” usado para orientação global da pelve. |
| Abaixe um pouco o quadril. | Baja un poco las caderas. | Abbassa un po’ il bacino. | Comando inverso claramente distinto, sem trocar com elevação. |
| Apoie os antebraços. | Apoya los antebrazos. | Appoggia gli avambracci. | Antebraço diferenciado de braço superior e mão. |
| Mantenha o braço superior estável. | Mantén estable la parte superior del brazo. | Mantieni stabile la parte superiore del braccio. | Preservado o segmento anatômico no kickback. |
| Estenda um braço e a perna oposta | Extiende un brazo y la pierna contraria | Distendi un braccio e la gamba opposta | Coordenação contralateral preservada no dead bug e bird dog. |
| Ombro–tornozelo | Hombro–tobillo | Spalla–caviglia | Eixo anatômico preservado; aproximação/afastamento do apoio não invertidos. |
| Último ciclo do lado esquerdo/direito | Último ciclo del lado izquierdo/derecho | Ultimo ciclo del lato sinistro/destro | Lateralidade mantida. |
| Oclusões podem suspender a avaliação | Las oclusiones pueden suspender la evaluación | Le occlusioni possono sospendere la valutazione | Mantida a limitação de visibilidade. |
| Não comprova contato real | No verifica el contacto real | Non verifica il contatto reale | Estimativa visual não convertida em comprovação física. |
| Use uma amplitude confortável. | Usa un rango de movimiento cómodo. | Usa un’ampiezza di movimento confortevole. | Orientação de conforto preservada; sem exigir amplitude máxima. |
| Respeite seus limites e procure orientação profissional | Respeta tus límites y busca orientación profesional | Rispetta i tuoi limiti e chiedi assistenza professionale | Ressalva de segurança mantida. |

A distinção entre “ocorrências/episódios persistentes” e “repetições” foi preservada: `incidencias/episodios persistentes` em espanhol e `anomalie/episodi persistenti` em italiano. “Nos critérios” corresponde aos critérios configurados no aplicativo, sem inferir correção clínica ou melhora biomecânica. O tempo ativo permanece distinto do tempo em postura válida.

A indicação de câmera no supino “sem olhar ao longo dos braços” foi interpretada pelo contexto como orientação do eixo da câmera, não do olhar do usuário: espanhol “sin orientar la cámara a lo largo de los brazos”; italiano “senza inquadrare lungo l’asse delle braccia”. Recomenda-se conferir essa formulação com a demonstração visual.

## Validação humana pendente

Ambos os idiomas precisam de revisão por falantes nativos familiarizados com treino, especialmente comandos de amplitude, nomenclatura de exercícios, segmentos anatômicos, apoio e eixo ombro–tornozelo. O espanhol usa tratamento informal singular e terminologia amplamente compreensível, com código de voz regional definido pela integração; avaliar preferências regionais se necessário.

Frases de referência para reprodução e escuta humana incluem “Vamos começar!”, “Prepare-se. O treino já vai começar.”, “Mantenha o corpo alinhado.”, “Apoie os antebraços.”, “Eleve um pouco o quadril.”, “Abaixe um pouco o quadril.”, “{{count}} repetições!”, “Muito bem, continue!” e “Treino concluído!”. Usar os valores traduzidos dos catálogos, com variáveis preenchidas, em dispositivo real.

| Classificação | Espanhol | Italiano |
| --- | --- | --- |
| A. Validade técnica de catálogo | Verificada por Python nesta revisão | Verificada por Python nesta revisão |
| B. Revisão semântica | Assistida por IA; exemplos críticos documentados | Assistida por IA; exemplos críticos documentados |
| C. Integração TTS automatizada | Não executada por este agente; consultar relatório geral | Não executada por este agente; consultar relatório geral |
| D. Reprodução real de áudio | Não testada | Não testada |
| E. Pronúncia e naturalidade humanas | Pendente | Pendente |

Nenhum dos dois idiomas é declarado completamente validado.
