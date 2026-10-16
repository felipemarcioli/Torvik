# Revisão de francês e alemão

Data: 15/10/2026. Tradução e auditoria semântica assistidas por IA, por comparação direta com o português. Não houve revisão por falantes nativos nem validação clínica.

## Escopo efetivamente revisado

A auditoria carregou com Bun o catálogo em execução de `src/lib/exercises/catalog.ts` e o objeto completo `FEEDBACK` de `src/lib/exercises/feedback.ts`, incluindo as expansões importadas. Foram examinados, em ambos os idiomas:

- Todos os 30 exercícios: 104 ocorrências em `instructions`, 30 em `initialPosition` e as 14 ocorrências existentes de `analysisLimitations`. Após eliminar repetições, são 130 chaves distintas.
- Todas as 36 frases `FEEDBACK[*].voice`, distintas das 130 chaves acima.
- As dez novas chaves de exportação e as cinco novas chaves de interface.

Total: **181 chaves distintas revisadas semanticamente em cada idioma**, de um catálogo atual com 954 chaves. As 773 restantes não receberam auditoria semântica independente neste trabalho. Não foram revisados todos os campos `detail` de feedback nem todos os textos de interface. A lista exata das chaves revisadas está ao final deste documento.

## Resultado da auditoria e correções

Foram conferidos os segmentos anatômicos, flexão versus extensão, elevação versus descida, lado de apoio versus membro movimentado, coordenação contralateral, retorno da repetição e instruções de câmera. As ressalvas mantêm as limitações da análise 2D: não comprovar contato, carga, ativação muscular, curvatura da coluna ou segurança da execução; excluir perdas de rastreamento quando indicado. Nenhuma dessas afirmações foi transformada em garantia clínica.

Sete valores foram corrigidos para precisão ou naturalidade:

| Idioma | Chave | Antes | Depois |
| --- | --- | --- | --- |
| fr | Suba um pouco mais na rosca. | Montez un peu plus haut pendant le curl. | Fléchissez un peu plus le coude pendant le curl. |
| fr | Mantenha o braço próximo ao tronco. | Gardez le bras près du buste. | Gardez le haut du bras près du buste. |
| fr | Mantenha o corpo estável na panturrilha. | Gardez le corps stable pendant l’élévation des mollets. | Gardez le corps stable pendant les élévations des talons. |
| de | Suba um pouco mais na rosca. | Hebe den Arm beim Curl etwas weiter an. | Beuge den Ellbogen beim Curl etwas weiter. |
| de | Mantenha o braço próximo ao tronco. | Halte den Arm nah am Oberkörper. | Halte den Oberarm nah am Oberkörper. |
| de | Comece com os pés próximos e braços baixos. | Beginne mit geschlossenen Füßen und gesenkten Armen. | Beginne mit den Füßen nah beieinander und gesenkten Armen. |
| de | O salto é estimado pela elevação relativa ao nível inicial dos pés, sem comprovar contato real. Uma câmera móvel pode imitar essa elevação e causar contagem incorreta; mantenha-a fixa. Pés pequenos ou oclusão podem impedir a avaliação. | Der Sprung wird anhand der Anhebung relativ zur ursprünglichen Fußhöhe geschätzt, ohne tatsächlichen Kontakt zu bestätigen. Eine bewegte Kamera kann diese Anhebung nachahmen und Fehlzählungen verursachen; halte sie fest. Zu klein dargestellte oder verdeckte Füße können die Auswertung verhindern. | Der Sprung wird anhand der Anhebung relativ zur ursprünglichen Fußhöhe geschätzt, ohne tatsächlichen Kontakt zu bestätigen. Eine bewegte Kamera kann diese Anhebung nachahmen und Fehlzählungen verursachen; lasse sie fest stehen. Zu klein dargestellte oder verdeckte Füße können die Auswertung verhindern. |

Na rosca, o contexto de `Amplie a flexão do cotovelo` exige mais flexão do cotovelo; levantar o braço inteiro poderia sugerir movimento do ombro. A instrução de manter o braço junto ao tronco identifica agora explicitamente o braço superior. A frase francesa de panturrilha agora descreve a elevação dos calcanhares em vez de uma elevação literal dos músculos. Em alemão, pés “próximos” não obrigam a encostá-los; a câmera “fixa” deve permanecer apoiada e imóvel, e não ser segurada durante o salto.

As demais chaves do escopo foram mantidas após a comparação, sem divergência de sentido identificada por esta revisão assistida por IA. Exemplos verificados:

| Situação | Evidência de sentido preservado |
| --- | --- |
| Terra romeno | Quadril para trás, braços estendidos, retorno ereto e amplitude confortável; não propõe arredondar a coluna. |
| Afundo búlgaro | Repetição atribuída à perna dianteira escolhida; estabilidade do banco não é comprovada pela câmera. |
| Prancha | Subir e baixar o quadril continuam comandos opostos; apoio é nos antebraços. |
| Dead bug e bird dog | Braço e perna opostos; lado da repetição corresponde à perna estendida. |
| Toque no ombro | Ombro oposto, retorno ao apoio, lado da mão movimentada e ausência de comprovação do toque. |
| Supino no chão | Dois cotovelos e punhos visíveis; o eixo da câmera não deve ficar ao longo dos braços. |
| Saltos | Contato real e fase aérea não são tratados como comprovados; a referência depende de câmera imóvel. |
| Exportação | Resultados automáticos não comprovam melhora biomecânica ou segurança; dados ficam no navegador e dispositivo de origem. |

## Verificação técnica e limites

Comparação Python com `pt-BR`: 954 chaves em cada catálogo, nenhuma ausente ou extra, nenhum valor vazio, nenhuma divergência nos multiconjuntos de variáveis `{{...}}` e nenhum caractere de substituição Unicode ou controle inválido. Todas as 166 chaves de exercício/voz revisadas têm valores de origem iguais às próprias chaves em português. A chave obsoleta do documento HTML completo não está presente.

A atualização preservou os valores existentes, exceto pelas sete correções registradas. A verificação estrutural cobre o catálogo completo, mas não equivale à revisão semântica completa. Não foram realizados testes de renderização, integração TTS, reprodução real de voz ou avaliação humana da pronúncia neste trabalho; consultar o relatório de integração para testes executados por outros responsáveis.

| Classificação | Francês | Alemão |
| --- | --- | --- |
| A. Estrutura do catálogo | Verificada nas 954 entradas | Verificada nas 954 entradas |
| B. Semântica | 181 chaves revisadas por IA; 773 restantes pendentes | 181 chaves revisadas por IA; 773 restantes pendentes |
| C. Integração TTS | Não testada neste trabalho | Não testada neste trabalho |
| D. Reprodução real de áudio | Não testada | Não testada |
| E. Pronúncia e naturalidade humanas | Pendente | Pendente |

Nenhum dos idiomas é declarado completamente validado. A revisão por falantes nativos familiarizados com treino permanece pendente, inclusive para as chaves revisadas por IA.

## Inventário exato revisado

### Catálogo: 130 chaves distintas

- `Câmera de lado, fixa na altura do quadril; mostre ombro, mãos, quadril, joelhos e pés.`
- `Fique em pé, pés na largura do quadril, halteres à frente das coxas e joelhos suavemente flexionados.`
- `Leve o quadril para trás, incline o tronco com os braços estendidos e volte a ficar ereto. Use uma amplitude confortável.`
- `Uma inclinação reconhecida pelo quadril e retorno completo à posição ereta contam uma repetição.`
- `A análise acompanha a flexão do quadril e o retorno; não reconhece os halteres, carga, ativação muscular ou curvatura da coluna.`
- `Câmera de lado, levemente na diagonal; mostre as duas pernas e o apoio, com a perna dianteira visível.`
- `Escolha a perna dianteira. Apoie o pé traseiro em um banco estável e encontre uma base confortável.`
- `Flexione o joelho dianteiro, desça e retorne à posição alta. Use os controles de lado antes de inverter as pernas.`
- `Uma descida reconhecida e retorno à posição alta contam uma repetição da perna dianteira selecionada.`
- `O app estima a base assimétrica e a flexão da perna escolhida. Não comprova contato, altura ou estabilidade do banco.`
- `Câmera lateral, fixa, na altura dos joelhos; mostre tronco, quadril, joelhos e tornozelos.`
- `Apoie as costas numa parede estável e deslize até uma posição de agachamento confortável.`
- `Sustente a posição com os pés firmes. Ajuste a altura caso necessário; saia da posição com controle.`
- `O tempo válido começa após reconhecer uma postura estável e pausa quando a postura ou a visibilidade ficam insuficientes.`
- `A câmera estima a posição do tronco e das pernas; não comprova contato com a parede.`
- `Fique de lado para a câmera, corpo inteiro visível`
- `O app estima a amplitude da descida em 2D`
- `Mantenha o movimento confortável e controlado`
- `Comece em pé.`
- `Fique de lado, com a perna acompanhada mais próxima da câmera`
- `Mantenha ambos os joelhos e tornozelos visíveis`
- `Desça e suba sem deslocar os pés; troque a perna entre ciclos`
- `Comece em pé, com os pés em posição de passada.`
- `Posicione a câmera de lado, próxima ao chão`
- `Deixe ombro, quadril, joelho e tornozelo visíveis`
- `Eleve o quadril e retorne à posição inicial, mantendo os pés apoiados`
- `Comece deitado de costas, com joelhos dobrados e quadril baixo.`
- `Posicione a câmera de lado, mostrando o corpo inteiro e os pés`
- `Calcanhar e ponta do pé precisam estar nítidos; ajuste a distância se necessário`
- `Eleve os calcanhares e volte ao apoio; o app acompanha um lado por vez`
- `Comece em pé, com os calcanhares apoiados.`
- `Fique de lado ou levemente na diagonal, com os dois pés visíveis`
- `Leve um pé para trás, flexione os joelhos e retorne com os pés próximos`
- `Mantenha ombros, quadris, joelhos, tornozelos e pontas dos pés visíveis`
- `Comece em pé, com os pés próximos.`
- `Câmera baixa, na diagonal ao lado do tronco; mantenha os dois cotovelos e punhos visíveis, sem olhar ao longo dos braços.`
- `Deite de costas, dobre os joelhos e segure os halteres com cotovelos flexionados ao lado do tronco.`
- `Estenda os dois braços sobre o peito e retorne com controle à posição flexionada.`
- `Extensão dos dois braços e retorno dos dois cotovelos à posição inicial contam uma repetição.`
- `A câmera estima posições em 2D; oclusões podem suspender a avaliação. Não reconhece contato real com o chão nem detalhes da coluna. Não reconhece halteres, carga nem contato dos cotovelos com o chão.`
- `Posicione a câmera lateralmente, no nível do chão`
- `Deixe ombro, cotovelo, punho, quadril e joelho visíveis`
- `Observe o alinhamento do tronco e do quadril`
- `Comece na posição alta da flexão.`
- `Fique de lado ou levemente na diagonal`
- `Deixe ombro, cotovelo, punho e quadril visíveis`
- `O app acompanha um braço por vez e não mede a carga`
- `Comece com o braço acompanhado estendido.`
- `Fique de lado, com ombro, cotovelo, punho, quadril e joelho visíveis`
- `Mantenha o braço superior próximo ao tronco; estenda o cotovelo e retorne`
- `O app acompanha um braço por vez e não mede carga`
- `Incline o tronco e mantenha o cotovelo flexionado junto ao corpo.`
- `Fique de frente, com espaço nas laterais`
- `Mantenha os dois braços e quadris visíveis`
- `Eleve os braços até perto da altura dos ombros; o app não mede a carga`
- `Comece com os dois braços ao lado do corpo.`
- `Fique de frente, com os dois braços inteiros visíveis`
- `Estenda os dois braços acima da cabeça e retorne`
- `O app acompanha o corpo; não identifica nem mede a carga`
- `Comece com os cotovelos flexionados e as mãos junto aos ombros.`
- `Fique de lado para mostrar a elevação à frente do corpo`
- `Mantenha ombro, cotovelo, punho, quadril e rosto visíveis`
- `Eleve o braço até a altura do ombro e retorne; o app acompanha um lado e não mede carga`
- `Comece com o braço ao lado do corpo.`
- `Posicione a câmera de lado, mostrando ombro, braço, quadril e joelho`
- `Puxe o cotovelo para trás e aproxime a mão do tronco; depois estenda o braço`
- `Mantenha o tronco estável; o app acompanha um lado e não mede carga`
- `Incline o tronco pelo quadril e deixe o braço estendido.`
- `Câmera baixa diante da lateral exposta do corpo; deixe os dois ombros, cotovelo de apoio, quadril e pernas visíveis.`
- `Escolha o lado de apoio. Deite de lado, posicione o cotovelo abaixo do ombro e estenda as pernas.`
- `Eleve o quadril e sustente o alinhamento do corpo. Apoie a mão livre na cintura; use os controles de lado para mudar o apoio.`
- `Tempo válido registrado separadamente para cada lado de apoio selecionado, após postura estável.`
- `A câmera estima posições em 2D; oclusões podem suspender a avaliação. Não reconhece contato real com o chão nem detalhes da coluna. A sobreposição dos ombros pode impedir distinguir esta postura de outra prancha; ajuste a diagonal.`
- `Câmera diagonal elevada, mostrando os dois braços e as duas pernas; evite sobreposição dos membros.`
- `Deite de costas, braços apontando para cima e quadris e joelhos flexionados.`
- `Estenda um braço e a perna oposta, volte à posição inicial e alterne. Use uma amplitude confortável.`
- `Extensão coordenada de braço e perna opostos e retorno contam uma repetição; o lado é o da perna estendida.`
- `A câmera estima posições em 2D; oclusões podem suspender a avaliação. Não reconhece contato real com o chão nem detalhes da coluna.`
- `Câmera baixa em diagonal lateral; mostre as mãos, os dois joelhos e os pés sem sobreposição.`
- `Comece em quatro apoios, com mãos abaixo dos ombros e joelhos abaixo do quadril.`
- `Estenda um braço e a perna oposta, retorne aos quatro apoios e alterne.`
- `Câmera lateral baixa, levemente na diagonal; ombros, quadris, joelhos e tornozelos das duas pernas devem estar visíveis.`
- `Deite de costas com braços ao lado do corpo e pernas estendidas em posição baixa confortável.`
- `Eleve as duas pernas e desça com controle até a posição inicial, sem exigir contato com o chão.`
- `Elevação das duas pernas e retorno conjunto à posição baixa contam uma repetição.`
- `Câmera frontal em diagonal, baixa, mostrando ombros, punhos, quadril e pés; evite mãos ocultas pelo tronco.`
- `Comece em prancha alta, braços estendidos e pés numa base confortável.`
- `Leve uma mão ao ombro oposto, retorne ao apoio e alterne a mão.`
- `Uma aproximação da mão ao ombro oposto e retorno à posição de apoio contam uma repetição; o lado é o da mão movimentada.`
- `A câmera estima posições em 2D; oclusões podem suspender a avaliação. Não reconhece contato real com o chão nem detalhes da coluna. A proximidade observada não comprova o toque real no ombro.`
- `Posicione a câmera lateralmente, próxima ao chão`
- `Mantenha ombro, quadril, joelho e tornozelo visíveis`
- `Eleve o tronco até perto da posição sentada e retorne`
- `Comece deitado, com os joelhos dobrados.`
- `Deixe ombro, cotovelo, punho, quadril, joelho e tornozelo visíveis`
- `O tempo válido avança somente enquanto a postura atende aos critérios`
- `Apoie os antebraços e estenda as pernas.`
- `Câmera frontal levemente oblíqua, fixa; mostre os dois joelhos e pés, com margem acima da cabeça.`
- `Fique em pé com espaço livre e corpo inteiro visível.`
- `Eleve alternadamente os joelhos e retorne cada perna. Mantenha um ritmo que a câmera consiga acompanhar.`
- `Cada elevação reconhecida de um joelho e retorno contam uma repetição desse lado. Registra também o tempo ativo acompanhado.`
- `Cadências muito rápidas, oclusão das pernas ou poucos frames podem impedir a contagem. O tempo ativo exclui perdas de rastreamento.`
- `Câmera lateral levemente oblíqua, fixa; deixe os dois joelhos, tornozelos e quadris visíveis.`
- `Fique em pé, com os dois pés visíveis e espaço livre.`
- `Flexione alternadamente os joelhos levando os calcanhares em direção aos glúteos e retorne.`
- `Cada flexão reconhecida e retorno de uma perna contam uma repetição desse lado. Registra também o tempo ativo acompanhado.`
- `A câmera observa aproximação, sem comprovar contato do calcanhar. Cadências rápidas ou pernas sobrepostas podem impedir a contagem.`
- `Câmera frontal fixa; deixe margem nos dois lados e mostre todo o trajeto, inclusive os pés.`
- `Fique em pé com espaço livre nos dois lados e joelhos suavemente flexionados.`
- `Salte lateralmente para uma perna, leve a outra atrás, estabilize e desloque-se para o lado oposto.`
- `Cada deslocamento lateral com troca de perna e chegada estabilizada conta uma repetição do lado de chegada.`
- `A análise reconhece deslocamento e troca de perna em 2D, sem comprovar fase aérea ou contato com o chão. Câmera móvel invalida a referência.`
- `Câmera frontal fixa; mantenha mãos acima da cabeça e os dois pés dentro do quadro.`
- `Comece com os pés próximos e braços baixos.`
- `Abra uma perna para o lado elevando os dois braços, retorne os pés e braços e alterne a perna.`
- `Abertura lateral de uma perna com elevação dos braços e retorno fechado contam uma repetição do lado da perna movimentada.`
- `A câmera acompanha a abertura e o retorno; não comprova ausência de salto. Precisa distinguir o pé que abre do que fica estável.`
- `Câmera lateral fixa; corpo inteiro e pés nítidos, com margem acima da cabeça durante o salto.`
- `Comece em pé, com espaço para agachar e saltar e câmera fixa.`
- `Agache, estenda as pernas para saltar, retorne e estabilize antes do próximo ciclo.`
- `Agachamento, elevação observada do corpo e dos dois pés, descida e retorno estabilizado contam um ciclo. Agachamento sem elevação dos pés não conta.`
- `O salto é estimado pela elevação relativa ao nível inicial dos pés, sem comprovar contato real. Uma câmera móvel pode imitar essa elevação e causar contagem incorreta; mantenha-a fixa. Pés pequenos ou oclusão podem impedir a avaliação.`
- `Fique de frente, com espaço livre nas laterais`
- `Leve os pulsos acima da cabeça`
- `Abra os pés além da largura dos ombros`
- `Comece com braços baixos e pés juntos.`
- `Posicione a câmera de lado, levemente na diagonal para mostrar os dois joelhos`
- `Aproxime um joelho do tronco e estenda a perna antes de alternar`
- `Cada aproximação e retorno conta uma repetição; mantenha mãos e pés visíveis`
- `Comece em prancha alta, com braços e pernas estendidos.`

### Feedback de voz: 36 chaves distintas

- `Tente aumentar a amplitude do agachamento.`
- `Tente aumentar a amplitude da flexão.`
- `Revise a inclinação do tronco.`
- `Mantenha o corpo alinhado.`
- `Eleve os braços acima da cabeça.`
- `Abra mais as pernas.`
- `Abra braços e pernas ao mesmo tempo.`
- `Desça um pouco mais no afundo.`
- `Mantenha o tronco estável.`
- `Suba um pouco mais na rosca.`
- `Mantenha o braço próximo ao tronco.`
- `Eleve os braços até a altura dos ombros.`
- `Não eleve os braços demais.`
- `Mantenha os braços simétricos.`
- `Suba um pouco mais o tronco.`
- `Eleve um pouco o quadril.`
- `Abaixe um pouco o quadril.`
- `Alinhe o corpo na prancha.`
- `Apoie os antebraços.`
- `Eleve mais o quadril na ponte.`
- `Suba mais o calcanhar.`
- `Mantenha o corpo estável na panturrilha.`
- `Amplie a descida do afundo reverso.`
- `Mantenha o tronco ereto no afundo reverso.`
- `Estenda mais os dois braços.`
- `Eleve o braço à frente até a altura do ombro.`
- `Evite dobrar o cotovelo na elevação frontal.`
- `Revise a altura da elevação frontal.`
- `Puxe mais o cotovelo para trás.`
- `Mantenha o tronco estável na remada.`
- `Estenda mais o cotovelo no kickback.`
- `Mantenha o braço superior estável no kickback.`
- `Aproxime mais o joelho do tronco.`
- `Mantenha o quadril estável no mountain climber.`
- `Revise a flexão dos joelhos.`
- `Revise o alinhamento do corpo.`

### Exportação: dez chaves distintas

- `Imprimir / Salvar como PDF`
- `Relatório de sessão`
- `Resultado`
- `Ocorrências registradas`
- `Orientação / critério não atendido`
- `Repetições registradas`
- `Repetição / tempo ativo`
- `Resultado registrado`
- `Estimador`
- `Resultados de regras automáticas do aplicativo. Não comprovam melhora biomecânica nem segurança da execução. Tempo ativo exclui preparação, pausas e períodos sem rastreamento. Dados salvos somente no navegador e dispositivo de origem.`

### Interface: cinco chaves distintas

- `{{count}} sessão`
- `{{count}} sessões`
- `{{engine}}: carregando…`
- `{{value}} p.p.`
- `{{value0}} exercício encontrado`
