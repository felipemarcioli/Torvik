# Revisão semântica das mensagens críticas de voz

Data: 2026-10-16. Método: revisão assistida por IA, por comparação direta com o português e com o contexto do evento. Não houve revisão por falante nativo, avaliação clínica, escuta ou reprodução real de áudio nesta revisão.

## Escopo e evidência

Foram lidos os 36 mapeamentos de `FEEDBACK` em `src/lib/exercises/feedback.ts`, incluindo os identificadores de `NEW_FEEDBACK`, as descrições portuguesas do critério e a mensagem `voice` correspondente. Cada mensagem de voz foi comparada com seu valor nos 11 catálogos. Também foram lidos os sete itens de `VOICE_REFERENCES` em `src/lib/voice/reference.ts` nos mesmos catálogos.

O conjunto contém **42 chaves únicas por idioma**, porque a referência de postura reutiliza `Mantenha o corpo alinhado.`: **462 valores revisados**, dos quais 42 são do português de origem e 420 são traduções. Idiomas: `pt-BR`, `en`, `es`, `fr`, `de`, `it`, `hi`, `ko`, `ar`, `ja`, `zh-CN`. Esta revisão não abrange semanticamente todas as 954 entradas de cada catálogo nem todas as instruções longas dos 30 exercícios. As descrições portuguesas dos critérios foram usadas como contexto; suas traduções longas não integram a contagem de 462.

As verificações assistidas consideraram parte anatômica, direção do movimento, negação, distinção entre flexão e extensão, estabilidade do segmento corporal, nome do exercício, preparação e preservação de `{{count}}`. A revisão foi direta; não se utilizou tradução reversa como prova de qualidade. A extração foi feita importando `FEEDBACK`, `VOICE_REFERENCES` e `dictionaries` com Bun e imprimindo os valores por chave e idioma; a leitura semântica foi realizada sobre essa extração, não inferida da aprovação de testes.

## Resultado

Não foi identificada inversão clara de direção, perda de negação ou substituição de articulação no conjunto. Por exemplo, as instruções de elevar/abaixar o quadril permanecem distintas; puxar o cotovelo para trás não virou movimento para frente; a extensão do cotovelo no kickback é diferente da flexão no curl; e o apoio continua nos antebraços, não nas mãos ou nos braços superiores.

As mensagens de aumentar amplitude permanecem orientações relativas ao exercício. A referência de segurança conserva movimento confortável e controlado. Não foi acrescentada promessa de segurança clínica. As instruções de manter o braço superior estável no kickback usam termos específicos nos cinco idiomas de foco: `ऊपरी बाँह`, `위팔`, `العضد`, `上腕`, `上臂`.

Dois pontos podem ser mais precisos: a própria origem portuguesa usa uma instrução de subir no curl sem nomear a articulação e usa “braço” numa orientação que se refere principalmente ao braço superior. As traduções seguem essa ambiguidade. São sugestões de esclarecimento contextual, não evidência de que todas as versões atuais estão erradas. Os valores franceses e alemães do curl e os valores ingleses, franceses e alemães de proximidade do braço já explicitam a anatomia.

**As 15 propostas abaixo foram aplicadas na integração final**, mantendo as chaves existentes e os algoritmos. As tabelas preservam os valores observados e os novos valores para auditoria. Os catálogos e o corpus de áudio foram novamente validados/gerados após a aplicação; os resultados técnicos constam no relatório final.

## Sugestão 1: explicitar flexão do cotovelo no curl

Chave estável: `Suba um pouco mais na rosca.`. Evento: `Amplie a flexão do cotovelo`. A descrição do critério informa que o cotovelo não atingiu o ângulo de flexão configurado. “Levantar mais” pode ser interpretado como elevar o braço inteiro pelo ombro. A formulação proposta aponta a articulação sem modificar o algoritmo nem acrescentar uma amplitude obrigatória.

| Idioma | Valor observado | Proposta de valor |
| --- | --- | --- |
| pt-BR | Suba um pouco mais na rosca. | Flexione um pouco mais o cotovelo na rosca. |
| en | Curl a little higher. | Bend your elbow a little more during the curl. |
| es | Sube un poco más en el curl. | Flexiona un poco más el codo durante el curl. |
| it | Solleva un po' di più nel curl. | Fletti un po' di più il gomito durante il curl. |
| hi | कर्ल में थोड़ा और ऊपर उठाएँ। | कर्ल करते समय कोहनी थोड़ा और मोड़ें। |
| ko | 컬 동작에서 조금 더 올리세요. | 컬 동작에서 팔꿈치를 조금 더 굽히세요. |
| ar | ارفع أكثر قليلًا في تمرين ثني العضلة ذات الرأسين. | اثنِ المرفق قليلًا أكثر أثناء تمرين العضلة ذات الرأسين. |
| ja | カールでもう少し腕を曲げて上げてください。 | カールで肘をもう少し曲げてください。 |
| zh-CN | 弯举时再抬高一些。 | 弯举时肘部再弯曲一些。 |

Francês e alemão já usam, respectivamente, `Fléchissez un peu plus le coude pendant le curl.` e `Beuge den Ellbogen beim Curl etwas weiter.`. Não foi proposta mudança nesses valores.

## Sugestão 2: distinguir braço superior de antebraço

Chave estável: `Mantenha o braço próximo ao tronco.`. Contexto: estabilidade do braço no curl. Nos idiomas de foco, os termos atuais podem indicar o braço inteiro. A proposta preserva a proximidade do braço superior e evita sugerir que o antebraço deva ficar imóvel junto ao tronco enquanto o cotovelo flexiona.

| Idioma | Valor observado | Proposta de valor |
| --- | --- | --- |
| pt-BR | Mantenha o braço próximo ao tronco. | Mantenha a parte superior do braço próxima ao tronco. |
| hi | बाँह धड़ के पास रखें। | ऊपरी बाँह धड़ के पास रखें। |
| ko | 팔을 몸통 가까이에 유지하세요. | 위팔을 몸통 가까이에 유지하세요. |
| ar | أبقِ الذراع قريبة من الجذع. | أبقِ العضد قريبًا من الجذع. |
| ja | 腕を体の近くに保ってください。 | 上腕を体の近くに保ってください。 |
| zh-CN | 保持手臂靠近躯干。 | 保持上臂靠近躯干。 |

Inglês (`upper arm`), francês (`haut du bras`) e alemão (`Oberarm`) já fazem essa distinção. Espanhol `brazo` e italiano `braccio` podem designar anatomicamente o segmento superior; não foi classificado erro nesses dois valores. Um revisor nativo pode decidir se vale explicitar a expressão para usuários leigos.

## Inventário exato das chaves revisadas

As primeiras 36 são as mensagens `voice` de `FEEDBACK`; as últimas seis são as referências adicionais. A referência de postura é a quarta chave desta lista.

1. `Tente aumentar a amplitude do agachamento.`
2. `Tente aumentar a amplitude da flexão.`
3. `Revise a inclinação do tronco.`
4. `Mantenha o corpo alinhado.`
5. `Eleve os braços acima da cabeça.`
6. `Abra mais as pernas.`
7. `Abra braços e pernas ao mesmo tempo.`
8. `Desça um pouco mais no afundo.`
9. `Mantenha o tronco estável.`
10. `Suba um pouco mais na rosca.`
11. `Mantenha o braço próximo ao tronco.`
12. `Eleve os braços até a altura dos ombros.`
13. `Não eleve os braços demais.`
14. `Mantenha os braços simétricos.`
15. `Suba um pouco mais o tronco.`
16. `Eleve um pouco o quadril.`
17. `Abaixe um pouco o quadril.`
18. `Alinhe o corpo na prancha.`
19. `Apoie os antebraços.`
20. `Eleve mais o quadril na ponte.`
21. `Suba mais o calcanhar.`
22. `Mantenha o corpo estável na panturrilha.`
23. `Amplie a descida do afundo reverso.`
24. `Mantenha o tronco ereto no afundo reverso.`
25. `Estenda mais os dois braços.`
26. `Eleve o braço à frente até a altura do ombro.`
27. `Evite dobrar o cotovelo na elevação frontal.`
28. `Revise a altura da elevação frontal.`
29. `Puxe mais o cotovelo para trás.`
30. `Mantenha o tronco estável na remada.`
31. `Estenda mais o cotovelo no kickback.`
32. `Mantenha o braço superior estável no kickback.`
33. `Aproxime mais o joelho do tronco.`
34. `Mantenha o quadril estável no mountain climber.`
35. `Revise a flexão dos joelhos.`
36. `Revise o alinhamento do corpo.`
37. `Vamos começar!`
38. `Comece em pé.`
39. `{{count}} repetições!`
40. `Muito bem, continue!`
41. `Mantenha o movimento confortável e controlado`
42. `Treino encerrado`

## Pendências de revisão humana e escuta

Todos os 11 idiomas ainda exigem avaliação humana da naturalidade e da pronúncia em vozes reais. A familiaridade com nomes transliterados, como curl, kickback, calf raise e mountain climber, pode variar por região e público. O Hindi usa termos anatômicos como `अग्रबाहु`; sua compreensão no contexto de instrução curta deve ser conferida com usuários. Japonês `腰` é uma escolha contextual comum para a região do quadril, mas deve ser avaliado junto à demonstração do movimento. Árabe usa imperativos masculinos convencionais; adequação editorial ao público deve ser avaliada por falantes nativos. O chinês simplificado precisa de revisão da naturalidade de instruções como “身体对齐” no contexto fitness.

Os sete itens do corpus são referências de escuta, não uma sequência universal: `Comece em pé.` aplica-se à referência escolhida e não deve virar preparação genérica para exercícios no chão. Esta revisão não afirma que cada referência é disparada como evento de treino; esse comportamento pertence à integração existente.

Classificação desta evidência: **B — revisão semântica assistida por IA, com escopo de 42 chaves por idioma e sugestões registradas**. Ela não substitui A (validação técnica dos arquivos), C (testes de integração TTS), D (reprodução real) ou E (pronúncia/naturalidade revisadas por humanos). Não houve aprovação humana de qualquer idioma nesta atividade.
