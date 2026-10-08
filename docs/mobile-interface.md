# Interface e navegação para celular

A alteração fica na apresentação. `use-workout`, aquisição da câmera, analisadores,
catálogo, voz, ledger, IndexedDB e formatos de exportação mantêm o comportamento
existente. Nenhum pacote Capacitor foi instalado.

- **Treinar:** composição da home anterior (`be849cb`): hero “Cada repetição conta.”
  no desktop, mascote com balão no celular, quatro cards de categorias com contagem
  e expansão animada, seleção, instruções e sprites. Preparação mostra Exercício
  atual e Antes de começar; Preparar câmera usa a escolha explícita da pessoa.
  Busca local e acesso aos detalhes completos continuam disponíveis, sem exercício
  selecionado automaticamente. Detalhes preservam equipamento, três instruções do
  catálogo e preparação identificada pelo nome. Explicações ficam em Ver mais.
- **Treino:** navegação própria; voltar durante execução/contagem leva à pausa.
  Continuar mantém a preparação e contagem regressiva existentes. Finalizar gera
  o relatório. Sair com progresso exige confirmação. Câmera, lado e voz ficam
  no painel Controles, com ajuda de posicionamento e limitações da análise.
- **Relatório:** resultado, até três pontos de atenção em destaque e salvamento
  opcional explícito antes de Novo treino. Outros pontos, explicações e exportação
  são secundários. A confirmação de salvamento leva à sessão em Progresso.
- **Progresso:** convite antes de qualquer indicador no estado vazio; resumo e
  cinco sessões recentes quando há registros, com paginação. Filtros em painel
  exibem somente exercícios registrados e Todos. Gráficos e calendário começam
  recolhidos. Consulta, ordenação, comparação, exportação e exclusão continuam
  disponíveis, incluindo sessões antigas sem detalhamento.
- **Ajustes:** preferências de voz já existentes, ajuda, privacidade e armazenamento.

`AppNavigator` é a fronteira da navegação de apresentação. O adaptador web mantém
os metadados do TanStack e as posições de rolagem; um adaptador nativo futuro pode
usar o mesmo método `back()` e seus guardas. Finalizar substitui a entrada de treino
pelo relatório para que voltar nunca restaure uma câmera encerrada. Uma recarga
inicia uma nova pilha de apresentação; as sessões salvas continuam em IndexedDB.
Categorias usam a pilha atual para fechar com Voltar/Escape e preservam a rolagem
da home e da lista ao retornar de detalhes ou preparação. A barra inferior aparece
abaixo de 768 px. A partir de 768 px, TORVIK e Treinar/Progresso/Ajustes ficam no
cabeçalho. Detalhes e relatório usam colunas; progresso usa um contêiner mais amplo.
A partir de 1024 px, o treino exibe câmera e controles lado a lado. As regras de
pausa, retomada, confirmação de saída e salvamento explícito foram mantidas.

## Validação desta alteração

- Tipos: `tsc --noEmit` e `tsc -p tsconfig.tests.json` passaram.
- Lint: passou, com seis avisos preexistentes de Fast Refresh em componentes UI.
- Builds Vite de produção e Vercel: passaram. A resposta SSR do build retornou
  HTTP 200 com o hero, balão, Preparação, quatro cards e 30 exercícios, sem seleção
  inicial. O CSS anterior à reformulação foi preservado integralmente.
- 162 testes passaram na restauração: 156 regressões existentes e seis testes de navegação.
  Bun não estava disponível no executor. Para validar, cópias temporárias dos
  testes usaram `test`/`expect` do Playwright sob Node 24; `describe` foi mapeado
  para `test.describe`. Os testes originais continuam usando Bun, sem alterações
  de dependências ou de lockfile.
- Os E2E foram adaptados para a home restaurada, incluindo seleção direta,
  categorias, instruções, detalhes, busca, Voltar/Escape e rolagem. A reexecução foi bloqueada
  na inicialização do Chromium por `setsockopt: Operation not permitted`; o sandbox
  também impediu o servidor local. As asserções visuais não chegaram a executar.
  Portanto, layouts de 360/390/768/1366/1920 px, tela baixa, orientação horizontal,
  texto ampliado e câmera real ainda precisam de confirmação em ambiente com
  navegador habilitado. Esses cenários estão na suíte de navegação/treino; os testes
  capturam e anexam screenshots da home quando o navegador está disponível.
  Nenhuma screenshot desta restauração pôde ser produzida no executor atual.

Para executar os checks habituais em um ambiente habilitado:

```sh
bun run check
bun run test:e2e
```

A suíte também aceita validação do build Cloudflare padrão sem servidor HTTP:

```sh
bun run build
TORVIK_BUILD_VALIDATION=1 TORVIK_CHROMIUM_PATH=/usr/bin/chromium bun run test:e2e
```

Esse modo entrega a resposta SSR e os assets reais via interceptação do Playwright.
Não substitui validação de HTTPS, câmera e voz em aparelhos reais. Sem essas
variáveis, a configuração E2E mantém o servidor de desenvolvimento habitual.
