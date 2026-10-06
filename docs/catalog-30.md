# Expansão para 30 exercícios

A base inspecionada continha 16 IDs: 5 pernas, 7 superiores, 2 core e 2 cardio.
Foram acrescentados 14, sem remoções ou substituições, chegando a **8/8/7/7**.
Peito, costas, braços e ombros continuam subcategorias no grupo superior. Os
analisadores e arquivos de imagem dos 16 exercícios anteriores foram preservados.

## Cadastro e integração

`additions.ts` contém nomes em português, equipamentos, preparação, execução,
definição de repetição/tempo, câmera e limitações específicas. `catalog.ts` combina
as definições e `data.ts` conserva os grupos da seleção. Todas as novas opções usam
os mesmos fluxos de preparação, countdown, treino, voz, relatório e salvamento.

| ID                 | Medição                                    | Evidência observável e câmera                                                                                                                                    |
| ------------------ | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `romaniandeadlift` | Repetições                                 | Flexão do quadril com braços estendidos, tronco inclinado e joelhos pouco flexionados; retorno ereto. Câmera lateral na altura do quadril.                       |
| `bulgariansquat`   | Repetições por perna dianteira selecionada | Base assimétrica e tornozelo traseiro elevado; flexão e extensão do joelho dianteiro. Câmera lateral diagonal mostrando ambos os pés.                            |
| `wallsit`          | Tempo válido                               | Tronco aproximadamente vertical, quadril e joelho flexionados. Câmera lateral na altura dos joelhos. Não comprova contato com parede.                            |
| `floorpress`       | Repetições                                 | Tronco horizontal; extensão bilateral dos cotovelos com punhos elevados, seguida do retorno flexionado. Câmera baixa lateral diagonal, ambos os braços visíveis. |
| `sideplank`        | Tempo por lado de apoio selecionado        | Eixo corporal estendido, antebraço flexionado e ombros separados verticalmente. Câmera baixa diante da lateral exposta.                                          |
| `deadbug`          | Repetições por perna estendida             | Tronco horizontal com membros de apoio apontando acima; extensão coordenada de braço e perna opostos e retorno. Câmera diagonal elevada.                         |
| `birddog`          | Repetições por perna estendida             | Tronco horizontal com mão/joelho de apoio abaixo; extensão de membros opostos e retorno aos quatro apoios. Câmera diagonal lateral baixa.                        |
| `lyinglegraise`    | Repetições                                 | Tronco horizontal; pernas estendidas sobem juntas e retornam juntas. Câmera lateral baixa diagonal.                                                              |
| `shouldertap`      | Repetições por mão                         | Prancha alta; mão aproxima-se do ombro oposto e retorna ao apoio com braço estendido. Câmera frontal diagonal baixa. Proximidade não comprova toque.             |
| `highknees`        | Repetições alternadas e duração ativa      | Elevação relativa ao quadril com flexão de joelho e retorno. Câmera frontal oblíqua mostrando ambas as pernas.                                                   |
| `buttkicks`        | Repetições alternadas e duração ativa      | Flexão do joelho e aproximação tornozelo–quadril com coxa baixa; retorno estendido. Câmera lateral oblíqua.                                                      |
| `skater`           | Cada chegada lateral concluída             | Deslocamento do quadril, troca da perna de apoio inferida e chegada estabilizada com perna cruzada. Câmera frontal fixa com espaço lateral. Não comprova salto.  |
| `stepjack`         | Cada abertura e retorno por lado           | Um pé desloca-se enquanto outro permanece próximo da referência, braços elevados; fechamento e braços baixos. Câmera frontal fixa.                               |
| `jumpsquat`        | Ciclo agachamento–elevação–retorno         | Flexão dos dois joelhos, elevação do quadril e dos quatro pontos dos pés, chegada e retorno ereto. Câmera fixa lateral diagonal, pés em boa resolução.           |

Nos movimentos alternados, a repetição só é emitida no retorno. O próximo ciclo exige
o lado oposto. No patinador, a chegada é a conclusão. Os rótulos usam o lado anatômico
do modelo, inclusive quando a imagem é espelhada. Na troca explícita de lado, a sessão
preserva os totais concluídos, descarta evidência parcial e prepara a outra posição.

## Regras iniciais e limites

`catalog-analyzers.ts`, `movement-measures.ts`, `temporal.ts` e `isometrics.ts` implementam
as novas regras `1.0.0`. São heurísticas de engenharia **sem validação com movimentos
reais**. `PARAMETERS` reúne limiares por movimento; `MODERN_TIMING` reúne os tempos:
posição inicial 300 ms, entrada/retorno 90 ms, alvo 70 ms, suavização exponencial de
medidas com constante 45 ms, aquisição de isometria 500 ms, tolerância de oscilação
250 ms e interrupção por lacuna acima de 500 ms. Transições exigem pelo menos dois
timestamps distintos. Entrada e saída usam limiares diferentes.

Ângulos consideram a proporção do vídeo; distâncias são normalizadas pelo tronco,
perna ou pé. São exigidos pontos relevantes dentro do quadro, finitos e com
visibilidade >= 0,65, além de um tronco de pelo menos 20 pixels. Falta de pose ou
confiança insuficiente interrompe evidência parcial e pede enquadramento. Oclusões
em exercícios no chão podem tornar o enquadramento incompatível; a diagonal deve
mostrar os dois pares de membros. Preparação, frames repetidos e ciclos parciais
não acrescentam repetições.

Isometrias somam somente intervalos entre dois frames válidos consecutivos após
aquisição estável. Oscilações breves conservam a aquisição, mas **não somam tempo
inválido nem atravessam a lacuna**. Após a tolerância, é necessário adquirir novamente.
Perda de confiança, pausa ou troca de lado exige nova aquisição. A tolerância pode
ser configurada no construtor do analisador.

Limitações especialmente relevantes:

- A prancha lateral exige separação projetada dos ombros para distingui-la de uma
  prancha frontal; vista com ombros sobrepostos será rejeitada.
- O patinador avalia deslocamento e chegada, não comprova fase aérea. A contagem não
  permite afirmar que cada deslocamento foi um salto real.
- O agachamento com salto depende de pés nítidos e câmera imóvel. Uma translação
  vertical da imagem depois de um agachamento pode imitar a evidência de elevação;
  a câmera de pose não determina contato físico. Saltos muito curtos podem ser perdidos.
- Corridas alternadas muito rápidas podem ser rejeitadas pelos tempos de confirmação
  ou pelo retorno incompleto entre lados. É necessário calibrar com vídeos reais.
- Nenhuma regra reconhece carga, ativação muscular, estabilidade de banco, contato
  real com chão/parede ou detalhes da coluna. Instruções gerais são apresentadas
  separadamente das mensagens sobre evidência observada.

## Histórico e compatibilidade

Eventos de repetição podem incluir `side`. Sessões de exercícios com lados podem
incluir `sideResults` com repetições, repetições dentro dos critérios e segundos
válidos por lado. Relatório, detalhe, comparação, CSV e relatório imprimível mostram
esses dados. O gráfico de evolução permite filtrar lado; resumos antigos sem essa
informação não recebem valores inventados. Exportação JSON conserva os novos campos.

O contrato continua `schemaVersion: 2`, com campos opcionais validados e eventos
deduplicados; IndexedDB continua na versão 1. Leitores antigos de schema 1 e sessões
anteriores de schema 2 continuam cobertos pelas regressões. Duração ativa e tempo
válido de sustentação são métricas diferentes.

## Animações

Cada novo exercício tem animação própria, miniatura e faixa lossless em
`public/exercise-previews/torvik-{id}{,-still,-sprite}.webp`. A reprodução continua
em `ExercisePreview`, por WebP animado nativo; movimento reduzido usa a miniatura.
O catálogo referencia os três arquivos e não usa placeholders.

As folhas foram geradas com a ferramenta integrada de imagens usando o Torvik
existente como referência. As revisões preservam o personagem, óculos, colete,
cores e acabamento 3D e distinguem os pares alternados. Os movimentos dependentes
incluem halteres, banco ou parede. São poses discretas para ensinar preparação,
execução e retorno; não uma simulação anatômica contínua.

O conversor Pillow existente recebeu modo de grade revisada, limpeza de pequenos
fragmentos de alpha, escala única sem distorção, alinhamento das linhas e ordem
explícita de reprodução. A origem é conservada dentro de cada linha para preservar
altura de salto e deslocamento. Folhas que cortam corpos na borda são rejeitadas.
Prompts, ordens e metadados de codificação estão em `catalog-30-preview-prompts.json`.

Os 14 arquivos animados somam 1.114.338 bytes e cada um fica abaixo de 98 KB.
Todos têm oito quadros 256 × 256, loop infinito de 1.920 ms e alpha real. A leitura
dos 42 arquivos verificou dimensão, margem transparente, duração e reprodução;
os 48 assets anteriores permanecem idênticos por SHA-256. O inventário de arquivos,
tamanhos e hashes está em `catalog-30-preview-assets.json`.

Para reencodar uma faixa normalizada aprovada, sem mover ou redimensionar quadros:

```sh
python3 scripts/build-exercise-preview.py public/exercise-previews/torvik-birddog-sprite.webp birddog --normalized --frame-ms 240 --output /tmp/torvik-preview-check
```

## Verificação e validação prática

`tests/catalog-30.test.ts` e suas fixtures exercitam ciclos completos/parciais,
posição inicial, perdas de pose, confiança baixa, NaN, lacunas, timestamps repetidos,
ruído, proporções, espelhamento, alternância, troca explícita, membros opostos,
aquisição/pausa das isometrias, deduplicação e histórico/exportação por lado.
`tests/e2e/catalog-30.spec.ts` cobre seleção, preparação, medição com estimador
controlado, relatório, salvamento, recarregamento e CSV para os 14 exercícios,
mais troca de lado, animação, movimento reduzido e larguras móveis 360/390.

Nenhum vídeo de pessoa nem câmera real foi usado para avaliar as novas regras.
Ainda são necessárias gravações consentidas com ciclos e lados anotados, testes
Android/Chrome e iPhone/Safari, diferentes corpos/cadências/diagonais, oclusão e
iluminação. Medir falsos positivos/negativos por ciclo e erro de tempo válido antes
de divulgar precisão. Usar `/lab` para comparar contagem e cobertura no mesmo trecho;
ele não mede concordância por repetição sem anotações temporais adicionais.

Os resultados finais dos comandos desta entrega estão em `validation.md`.
