# Login do Torvik

Supabase Auth no navegador: cadastro com nome, e-mail e senha, entrada imediata,
sessão persistente e saída apenas neste dispositivo. O escopo atual usa cadastro
sem confirmação de e-mail. Treinar sem conta continua disponível. O código também
suporta confirmação e recuperação/redefinição de senha, caso sejam usadas depois.

## Conectar um projeto

O projeto do Torvik é `https://tmzwgwfiysqyvsxksmpt.supabase.co`.
O arquivo `.env.example` contém sua configuração pública pronta para copiar.
A publishable key identifica o projeto no frontend e não concede acesso de
administração. Cadastro e login por e-mail estão habilitados. Para o fluxo básico,
desative a confirmação no painel conforme o passo 4. Essa configuração é remota;
o código não pode alterá-la usando uma chave pública.

1. Crie um projeto no plano Free em https://supabase.com/dashboard.
2. Copie a URL do projeto e a **publishable key** em Connect/API Keys. Nunca use
   uma chave `secret` ou `service_role` no frontend.
3. Para o projeto do Torvik, copie `.env.example` para `.env.local`.
   Para outro projeto, substitua os valores:

   ```dotenv
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

4. Em Authentication → Sign In / Providers → Email, mantenha Email habilitado,
   desative **Confirm email** e salve. Mantenha novos cadastros permitidos.
   Configure senha mínima de 8 caracteres ou mais. Sem confirmação, `signUp`
   devolve a sessão e o Torvik abre o app imediatamente, sem exigir um e-mail.
5. Em Authentication → URL Configuration, use como Site URL
   `https://torvik-ai.vercel.app` e autorize os retornos exatos:
   - `https://torvik-ai.vercel.app/`
   - `https://torvik-ai.vercel.app/?auth=recovery`
   - `http://localhost:4173/`
   - `http://localhost:4173/?auth=recovery`
     Adicione também as URLs exatas do Vercel Preview usado para testar. Ajuste a
     porta local conforme o Vite. O código retorna à origem atual, nunca a uma URL
     fornecida pelo usuário.
6. Configure as duas variáveis também na Vercel para Preview e, quando validado,
   Production. Faça um novo build: variáveis `VITE_*` são incorporadas ao frontend
   na compilação. Reinicie o Vite depois de alterá-las.

Sem as duas variáveis, o app mantém o funcionamento sem cadastro e informa em
Ajustes que o login ainda não está disponível.

O cadastro e o login básicos não precisam de SMTP com **Confirm email** desativado.
A recuperação de senha por e-mail é um recurso adicional e continua dependendo
de entrega de e-mail. O serviço padrão do Supabase só envia para membros da
organização e limita os envios. Se usar recuperação para outros usuários ou
reativar confirmação no futuro, configure SMTP. Consulte as restrições atuais em
https://supabase.com/docs/guides/auth/auth-smtp.

## Dados e limites desta etapa

- E-mail, nome escolhido e autenticação ficam no Supabase; o SDK guarda e renova
  a sessão no navegador. O Torvik não guarda a senha.
- O cliente Supabase é criado somente no navegador. A renderização SSR é pública
  e não lê sessões de outros usuários. Não há endpoints privados nesta etapa.
- Treinos continuam em IndexedDB, separados por ID de usuário. Dados anteriores
  permanecem no modo sem conta e não são atribuídos automaticamente a ninguém.
  Sair ou trocar de conta desmonta a interface anterior, encerra a câmera/voz e
  limpa os resultados em memória; os registros locais permanecem guardados.
- Essa separação evita misturar contas na interface; não é criptografia ou
  controle de acesso contra alguém com acesso ao perfil do navegador. Exporte ou
  exclua sessões antes de compartilhar esse perfil.
- Não há sincronização de treinos, tabela de perfis, ranking, login social ou
  integração nativa de links do Capacitor. Para armazenamento na nuvem, implemente
  tabelas e políticas RLS que validem `auth.uid()`; esconder uma tela não protege
  dados de backend. A análise da câmera continua local.

## Verificação

Execute `bun run check`. Os testes unitários incluem isolamento de contas,
preservação dos dados sem conta, validação de senha e mensagens sanitizadas.

Os testes de UI usam o SDK real com respostas HTTP simuladas:

```sh
TORVIK_AUTH_TEST=1 VITE_SUPABASE_URL=https://torvik-auth-test.supabase.co \
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_test bun run test:e2e tests/e2e/auth.spec.ts
```

Use um servidor novo, sem outro Vite na porta 4173. Não configure esses valores
na Vercel. Os outros testes de UI devem usar o app sem essas variáveis.

No Preview conectado ao projeto real, verifique cadastro sem confirmação e
entrada imediata, e-mail já cadastrado, senha incorreta, recarregamento da página,
saída e duas contas no mesmo navegador. Se usar confirmação ou recuperação por
e-mail, valide também os links reais: respostas simuladas não validam SMTP nem a
configuração do projeto remoto.

Referências: https://supabase.com/docs/guides/auth/passwords e
https://supabase.com/docs/reference/javascript/auth-onauthstatechange.
