# Melhorias de interface para celular

O app funciona bem no computador, mas em telas de celular alguns elementos ficam grandes demais, o vídeo da câmera fica pequeno e os botões flutuantes atrapalham a leitura dos números.

## Tela inicial

- Título e textos com tamanho reduzido no celular, crescendo só em telas maiores.
- Mascote e balão de fala reorganizados: balão acima do mascote, em coluna, sem sobreposição; mascote menor.
- Dicas de câmera em uma coluna, com texto mais compacto.
- Cards de exercício empilhados, com as instruções recolhidas por padrão e um toque para expandir (evita cartões muito altos).
- Botão "Iniciar Treino" fixo na largura total, sempre acessível.

## Tela de treino

- Vídeo passa a ocupar a tela inteira no celular (formato vertical), em vez de uma faixa em 16:9 com bordas pretas.
- Câmera traseira/frontal: manter a frontal, mas preencher a tela corretamente sem cortar demais.
- HUD reorganizado no celular: uma linha superior compacta com tempo, exercício e estado; o contador de repetições em destaque, menor que hoje mas ainda legível.
- Mensagem de feedback ancorada acima dos botões, com texto menor e sem quebrar o layout.
- Botões "Cancelar" e "Finalizar" numa barra inferior segura, respeitando a área do notch/barra de gestos do celular.
- Aviso quando o telefone estiver na vertical sugerindo girar para paisagem para melhor enquadramento do corpo inteiro (dispensável).

## Tela de relatório

- Números e títulos com escala menor no celular.
- Blocos de estatística empilhados com espaçamento reduzido.
- Botões finais em largura total, empilhados.

## Detalhes técnicos

- Apenas alterações de apresentação: classes Tailwind responsivas (base mobile, `sm:`/`md:` para telas maiores), nenhuma mudança na lógica biomecânica ou de contagem.
- Usar `100dvh` em vez de `min-h-screen` nas telas de treino para evitar corte pela barra do navegador móvel.
- Aplicar `env(safe-area-inset-bottom)` nos controles inferiores.
- Padrão de linha com texto + widget: `grid grid-cols-[minmax(0,1fr)_auto]` com `min-w-0` e `shrink-0`.
- Detecção de orientação via `matchMedia("(orientation: portrait)")` para o aviso de girar a tela.
- Verificação final com capturas em 390x844 nas três telas.
