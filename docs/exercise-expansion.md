# Catálogo com 16 exercícios

Oito novos exercícios por repetição reutilizam a captura, inferência, preparação automática,
voz, `SessionLedger`, contrato de sessão v2, IndexedDB e exportações existentes.
Os oito detectores anteriores e suas versões permanecem inalterados. A seleção de lado e a
distância em pixels foram apenas extraídas para um módulo compartilhado.

## Detectores e câmera

| Exercício / ID | Câmera | Evidência e fechamento do ciclo |
| --- | --- | --- |
| Ponte de glúteos / `glutebridge` | Lateral, próxima ao chão | Joelhos dobrados, extensão ombro–quadril–joelho e elevação relativa aos apoios; conta ao voltar com o quadril baixo. |
| Panturrilha em pé / `calfraise` | Lateral, corpo e pés nítidos | Elevação calcanhar–ponta normalizada pelo pé e projetada no eixo inicial do corpo; conta ao recuperar apoio. Inclinar o tronco com o pé plano não simula elevação. |
| Afundo reverso / `reverselunge` | Lateral levemente oblíqua; ambos os pés visíveis | Confirma passo para trás pela orientação dos pés e deslocamento relativo, flexão do joelho dianteiro e descida do traseiro; só fecha com os pés próximos novamente. |
| Desenvolvimento de ombros / `shoulderpress` | Frontal, dois braços inteiros | Extensão dos cotovelos e elevação dos punhos acima dos ombros, bilateralmente; conta no retorno à posição flexionada. |
| Elevação frontal / `frontraise` | Lateral, rosto e braço visíveis | Elevação anterior relativa ao tronco; direção inferida pela projeção do rosto. Acompanha um braço e sinaliza flexão persistente do cotovelo ou elevação excessiva. |
| Remada curvada / `bentoverrow` | Lateral, braço, quadril e joelho visíveis | Tronco inclinado, flexão do cotovelo com deslocamento em direção ao quadril e aproximação da mão; conta ao estender. Movimento do tronco sozinho não satisfaz o ciclo. |
| Tríceps kickback / `tricepskickback` | Lateral, braço, quadril e joelho visíveis | Tronco inclinado e braço superior junto ao corpo; extensão do cotovelo e retorno, com avaliação da estabilidade do braço superior. |
| Mountain Climber / `mountainclimber` | Lateral levemente oblíqua, mãos e dois joelhos visíveis | Prancha alta, aproximação de um joelho e retorno. Cada joelho vale uma repetição; depois do retorno, exige o lado oposto. |

Os exercícios de um lado escolhem a maior visibilidade antes do ciclo e não trocam de lado
durante sua execução. No afundo reverso a interface identifica o joelho dianteiro inferido;
no Mountain Climber identifica o lado do ciclo; no desenvolvimento bilateral não indica
um lado isolado.

As novas regras têm versão `1.0.0`, definida no catálogo. Os parâmetros estão em `NEW_RULES`.
Exigem posição inicial por 300 ms, transições por 150 ms (250 ms na panturrilha), amplitude
por 100 ms e ao menos duas amostras com timestamps distintos. Também confirmam excursão
mínima para que um pico isolado não registre uma repetição.

Perda de visibilidade, dimensões inválidas, NaN, pausa, troca de câmera e lacunas acima de
750 ms descartam evidência parcial. Preparação e countdown não contam. Ciclos com excursão
suficiente, mas sem amplitude alvo, são classificados fora dos critérios; ruído e retorno
incompleto não contam. Interrupções preservam os totais concluídos.

## Interface e dados

O catálogo foi ordenado por categoria sem mudar componentes, estilos ou controles. As 16
opções usam os cards e o accordion existentes. `back` foi acrescentada como categoria;
kickback usa `arms` com o rótulo Tríceps. Não foram acrescentados filtros.

Novos relatórios continuam `schemaVersion: 2`, `type: REP_BASED`, com eventos deduplicados,
mesmos totais, motivos, tempo ativo e versões. Não houve alteração de schema ou migração.
A prancha conserva sua modalidade de sustentação. A voz usa o dicionário compartilhado:
amplitude após duas repetições com o motivo, postura persistente e marcos a cada cinco reps.

## Assets

Foram gerados sprites com a ferramenta integrada de imagens, usando o mascote atual como
referência, e montados pelo conversor Pillow existente. Prompts e critérios de montagem
estão em `exercise-preview-prompts.json`.

Sete conjuntos foram aprovados: ponte, panturrilha, afundo reverso, desenvolvimento,
elevação frontal, remada e kickback. Cada conjunto em `public/exercise-previews/` contém:

- `torvik-{id}.webp`: oito quadros 256 × 256, loop de 1.600 ms com alpha real.
- `torvik-{id}-still.webp`: primeiro quadro para movimento reduzido.
- `torvik-{id}-sprite.webp`: faixa normalizada lossless para reprodução do processo.

Os arquivos animados ficam abaixo de 120 KB. Usam poses discretas, sem interpolação ou
mistura de transparência. A escala é única por sequência; não há redimensionamento individual
para preencher cada quadro. A revisão usa fundos claro e escuro e verifica margens, cauda,
orelhas, mãos, pés e halteres. Os assets antigos não foram alterados.

**Pendente: animação do Mountain Climber.** Três tentativas não demonstraram consistentemente
a alternância; uma também trouxe fundo opaco. Elas não foram incluídas nos assets públicos.
O card usa o fallback já existente, com mascote estático, instrução textual e aviso de
demonstração indisponível. O detector e os demais fluxos desse exercício estão implementados.

Para reencodar um conjunto aprovado, com Python e Pillow 12.x:

```sh
python3 scripts/build-exercise-preview.py public/exercise-previews/torvik-glutebridge-sprite.webp glutebridge --rows 1 --output /tmp/torvik-preview-check
```

O conversor rejeita silhuetas sobrepostas, componentes grandes sem atribuição e personagens
tocando a borda; requer revisão visual da folha original antes da extração. Nunca corta
automaticamente por células fixas. As poses geradas podem conter pequenas variações de
aparência entre quadros; não são uma referência biomecânica validada.

## Arquivos

- `src/lib/exercises/catalog.ts`: oito definições, categorias e previews.
- `src/lib/exercises/expansion.ts` (novo): regras e máquina de ciclos dos novos exercícios.
- `src/lib/exercises/side.ts` (novo): auxiliares extraídos sem alterar o comportamento anterior.
- `src/lib/exercises/analyzers.ts`: registro das novas fábricas e importação dos auxiliares.
- `src/lib/exercises/core.ts`: nomes dos landmarks de calcanhar e ponta do pé.
- `src/lib/exercises/feedback.ts`: mensagens compartilhadas com voz e relatórios.
- `scripts/build-exercise-preview.py`: novos identificadores aceitos pelo conversor.
- `tests/fixtures/expansion.ts`, `tests/expansion.test.ts`, `tests/e2e/expansion.spec.ts` (novos).
- `tests/exercises.test.ts`, `tests/voice.test.ts`, `tests/e2e/exercises.spec.ts`: catálogo,
  feedback e seleção inequívoca entre Afundo e Afundo reverso.
- 21 arquivos WebP, este documento e o registro de prompts.

## Limitações e validação física

Heurísticas em imagem 2D não medem carga, força, profundidade real, precisão clínica ou
segurança de execução. Oclusão de membros, pouca luz, pés pequenos no frame e perspectiva
podem impedir ou distorcer a contagem. Panturrilha é particularmente sensível à resolução
dos pés. Elevação frontal depende da orientação lateral e da projeção do rosto; afundo
reverso depende da orientação visível dos pés. Mountain Climber exige ver os dois joelhos
e retornar à prancha entre aproximações, podendo rejeitar cadências muito rápidas.

Não há detecção de velocidade de descida, ritmo, carga, impulso ou alinhamento tridimensional
dos joelhos. Esses itens não são apresentados como erros detectados.

Testes sintéticos e câmera simulada não substituem validação com pessoas e vídeos consentidos.
Continuam pendentes sessões físicas em Chrome/Android e Safari/iPhone, diferentes corpos,
cadências e posições de câmera, bem como som real e desempenho térmico.

## Resultado da verificação local — 27/09/2026

Ambiente: Node 20.20.2, Bun 1.3.10 e Pillow 12.3.0. Dependências instaladas pelo lockfile
congelado; manifesto e lockfile não foram alterados.

- `bun run typecheck`: aprovado, incluindo os tipos dos testes.
- `bun run lint`: zero erros; seis avisos de Fast Refresh nos componentes UI preexistentes.
- `bun test tests/*.test.ts`: **115 testes aprovados**, incluindo regressões dos oito
  exercícios anteriores, geometria, contagem, câmera, preparação, voz e persistência.
- `bun run test:e2e --workers=2 --reporter=line`: **66 cenários aprovados** em Chromium mobile
  e desktop. Abrangem seleção, enquadramento, countdown, repetições, pausa, cancelamento,
  voz ligada/desligada, relatórios, histórico, exportação, teclado, layouts e movimento reduzido.
- `bun run build`: aprovado para cliente, SSR e Nitro, com avisos existentes de configuração
  de plugins. Nenhuma implantação foi executada.
- Assets: os sete arquivos animados têm alpha real, oito quadros, duração de 1.600 ms,
  loop infinito, 256 × 256 e margens transparentes em todos os quadros. Revisão visual em
  fundos claro/escuro concluída; assets originais anteriores preservados.

Na revisão foram acrescentadas regressões para impedir uma rosca de cotovelo estacionário
de contar como remada e para o feedback não inventar um problema de amplitude quando o
único motivo registrado é postural. A mensagem positiva também usa o estado visual positivo.
O ajuste final de apresentação do feedback teve nova execução unitária, tipos, lint e build,
seguida de quatro testes direcionados aprovados dos fluxos de ponte e elevação frontal no navegador.

Os seletores E2E de Afundo passaram a usar o identificador para não confundir o nome com
Afundo reverso; o seletor de Métrica usa o papel de combobox, mantendo sua verificação.
Não foram feitas alterações em componentes de interface, hooks de câmera, MediaPipe,
armazenamento ou algoritmos dos exercícios anteriores. Sem commit, push ou deploy.
