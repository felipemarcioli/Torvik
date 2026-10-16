# Revisão de árabe e relatórios internacionalizados

Data: 15/10/2026.

## Catálogo árabe

Foram traduzidas 939 entradas do catálogo-fonte disponível nesta revisão: interface, autenticação, configurações, catálogo dos exercícios, instruções, feedbacks, limitações da análise, estatísticas, privacidade e voz. A chave contendo um documento HTML completo foi deliberadamente excluída; o responsável pela integração removerá essa chave indevida do catálogo-fonte.

Validação executada em Python comparando o catálogo árabe com `pt-BR`, excluindo somente a chave HTML completa:

- 939 chaves presentes; zero ausentes, extras ou valores vazios.
- Zero divergências entre variáveis `{{...}}` de origem e destino.
- Zero caracteres de substituição Unicode `U+FFFD`.
- Apenas `torvik`, `A` e `B` preservados literalmente por serem marca e identificadores de comparação.
- JSON lido e escrito em UTF-8. Essa checagem técnica não valida tipografia, pronúncia ou significado por si só.

## Revisão semântica assistida por IA

A tradução e a revisão contextual foram feitas por IA; não constituem revisão independente por falante nativo. Foi comparado o significado com o português, dando prioridade a direções opostas, nomes anatômicos, limites do detector, amplitude confortável e instruções de segurança.

| Origem | Árabe | Decisão da revisão |
| --- | --- | --- |
| Eleve um pouco o quadril. | ارفع الوركين قليلًا. | Preserva elevação, sem confundir com abaixar. |
| Abaixe um pouco o quadril. | اخفض الوركين قليلًا. | Preserva a instrução oposta. |
| Apoie os antebraços. | ارتكز على الساعدين. | Usa “antebraços”, não mãos nem braços inteiros. |
| Mantenha o braço superior estável no kickback. | حافظ على ثبات العضد في تمرين المدّ للخلف. | “عضد” corresponde ao braço superior; distingue-o do antebraço. |
| Estenda um braço e a perna oposta | مدّ ذراعًا والساق المقابلة | Preserva coordenação contralateral. |
| Use uma amplitude confortável. | استخدم مدى حركة مريحًا. | Preserva limite confortável; não acrescenta exigência de amplitude máxima. |
| A proximidade observada não comprova o toque real no ombro. | لا يثبت التقارب المرصود ملامسة الكتف فعليًا. | Mantém a limitação da inferência visual. |
| Não substitui avaliação profissional. | ولا يحل محل التقييم المتخصص. | Não transforma análise do aplicativo em orientação clínica. |

“Postura válida” foi traduzida como uma postura **que atende aos critérios**, evitando sugerir garantia clínica de segurança. Termos como `dead bug`, `bird dog`, `kickback` e `mountain climber` receberam nomes árabes contextualizados. A preferência de nomes comerciais/regionais de exercícios continua sujeita a revisão nativa.

Textos com números arbitrários foram redigidos, onde necessário, como rótulos neutros (“عدد التكرارات: {{count}}”) para evitar aplicar a flexão de plural de 3–10 a todos os números árabes. As variáveis originais foram preservadas.

Duas chaves legadas dizem expressamente “voz local em português”: foram traduzidas fielmente e sinalizadas ao integrador. O fluxo atual deve usar os novos estados genéricos relativos ao idioma selecionado.

## Inspeção estática RTL

A inspeção de `src/styles.css` identificou posicionamentos físicos em `.category-chevron`, `.camera-status`, `.auth-mascot-scene` e `.auth-scene-note`; foram comunicados ao integrador para avaliar propriedades lógicas. O marcador centralizado do calendário (`left: calc(50% - 2px)`) não precisa ser espelhado. Essa inspeção não substitui screenshots ou testes no navegador.

## Exportação e página de erro

`src/lib/history-export.ts` agora traduz texto humano dos relatórios imprimíveis, rótulos, instruções históricas e valores textuais do CSV. Datas, proporções e números do relatório usam o idioma atual. O HTML contém `lang` e `dir`, alinhamentos lógicos e borda lógica; mantém a impressão do navegador e o escape de HTML/fórmulas.

O CSV preserva seus IDs de campo, números, enumerações e sentinelas de máquina para não quebrar consumidores existentes. Nome do exercício e descrições de ocorrências são localizados. O texto de mensagens arbitrárias não catalogadas é preservado e escapado.

`src/lib/error-page.ts` aceita um idioma explícito e usa inglês por padrão no servidor, sem mudar estado global de idioma. As quatro mensagens são obtidas do catálogo e escapadas. Os chamadores existentes sem argumento continuam operando.

Dez novas mensagens necessárias à exportação foram coletadas em `docs/i18n-export-additions.json` para distribuição pelo integrador; não se presume que estejam traduzidas antes dessa distribuição.

Verificações efetivamente executadas:

- `node node_modules/typescript/bin/tsc --noEmit`: aprovado, saída zero.
- Formatação dos dois arquivos de código com Prettier: concluída.
- Script Bun de verificação de exportação, nos 11 idiomas: **176 asserções aprovadas** para idioma/direção, traduções já catalogadas, proporções localizadas, escape HTML, proteção contra fórmula CSV, estabilidade de IDs/números/enums e isolamento da página de erro. O script usou a instalação Bun em `/tmp/torvik-toolchain`; `bunx` não estava no PATH. O script não atesta as dez mensagens ainda em distribuição.

## Classificação de evidências

A. Traduções tecnicamente válidas: 939 entradas árabes na revisão registrada acima.

B. Revisão semântica: assistida por IA, incluindo instruções críticas e preservação das limitações do aplicativo. Aprovação por falante nativo pendente.

C. Integração com TTS: não testada por este agente; consultar o relatório consolidado dos testes de voz.

D. Reprodução real de áudio: não validada por este agente.

E. Pronúncia e naturalidade humanas: pendentes para árabe; faltam avaliação nativa da fala, disponibilidade das vozes e testes em Android/iOS/navegadores reais.

Também permanecem pendentes a inspeção humana de textos longos, conexão de glifos e sinais diacríticos em fontes reais e a leitura de combinações de árabe com nomes de versão, códigos e siglas latinas.
