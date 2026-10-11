# Interface do Torvik

A interface usa azul profundo (`#0c1727`), superfícies azuis (`#142338`) e laranja
(`#ff914d`) para as ações principais. Inter e Archivo continuam sendo as fontes
existentes. Os tokens, controles e layouts ficam em `src/styles.css`.

`TorvikUI.tsx` reúne marca, mascote responsivo, títulos e carregamento. A navegação
principal mantém Treinar, Progresso e Ajustes: inferior no celular, no cabeçalho a
partir de 768 px. Preparação, treino e relatório ocupam uma área própria.

## Telas e estados

| Área           | Telas e estados preservados                                                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Acesso         | Login, cadastro básico, recuperação, nova senha, senha visível, envio, erro, sucesso e modo sem conta                                                 |
| Treinar        | Boas-vindas, quatro categorias, busca com e sem resultados, seleção, demonstração, instruções e detalhes dos 30 exercícios                            |
| Câmera         | Carregamento do modelo e vídeo, solicitação e recusa de permissão, erro, nova tentativa, escolha de câmera e posicionamento                           |
| Treino         | Preparação, início automático e manual, contagem regressiva, repetições, sustentação, feedback, pausa, retomada, voz, lados e confirmação de descarte |
| Resultado      | Sessão sem movimentos, repetições, sustentação, resultados por lado, pontos de atenção, salvar, erro, sucesso, exportar e sair sem salvar             |
| Progresso      | Carregando, erro, vazio, resumos locais, filtros, ordenação, mais sessões, gráficos, calendário, detalhe, comparação, exportação e exclusão           |
| Ajustes        | Conta ou visitante, saída, voz, volume, ajuda de câmera e privacidade                                                                                 |
| Outras páginas | Página não encontrada, erro de carregamento, fallback SSR e laboratório experimental (ativo ou desativado)                                            |

Os gestos de navegação preservam a seleção e a posição das listas. Diálogos usam
os componentes Radix existentes ou o diálogo nativo das categorias. Os controles
principais têm 48–54 px de altura; campos mantêm 16 px para leitura e teclado
móvel. Os controles de voz usam colunas que podem encolher e volume em uma linha
própria para acomodar texto ampliado. Áreas seguras, paisagem, texto ampliado, foco visível e movimento reduzido
são tratados nos estilos. Animações de categorias duram 180–240 ms e são omitidas
com movimento reduzido; demonstrações usam as imagens estáticas existentes.

## Dados e limites

A renovação não altera os motores de pose, regras, relógio de sessão, Supabase ou
armazenamento. O cadastro continua com entrada imediata quando a confirmação de
e-mail está desativada no Supabase. O histórico é local e separado por usuário;
registros do visitante continuam no banco original. Não há sincronização de
sessões, novas métricas, vídeos salvos ou recursos sociais.

Os testes de navegador usam câmera sintética e estimadores controlados. A
verificação responsiva em Chromium não substitui a câmera real em iOS e Android.
