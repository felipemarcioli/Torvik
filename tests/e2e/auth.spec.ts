import { test, expect, type Page } from "@playwright/test";

test.skip(process.env["TORVIK_AUTH_TEST"] !== "1", "Requires the dedicated mock Auth environment.");
const endpoint = "https://torvik-auth-test.supabase.co/auth/v1";
const user = {
  id: "7f451e09-271e-4436-b003-a11598e72a17",
  aud: "authenticated",
  role: "authenticated",
  email: "felipe@example.com",
  email_confirmed_at: "2026-01-01T00:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: { display_name: "Felipe" },
  identities: [],
};
function session() {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const expires = Math.floor(Date.now() / 1000) + 3600;
  return {
    access_token: `${part({ alg: "HS256", typ: "JWT" })}.${part({ sub: user.id, exp: expires, role: "authenticated" })}.test-signature`,
    refresh_token: "test-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: expires,
    user,
  };
}
async function mockAuth(page: Page) {
  await page.route(`${endpoint}/**`, async (route) => {
    const url = new URL(route.request().url());
    const body = route.request().postDataJSON();
    if (url.pathname.endsWith("/token")) {
      if (body?.password === "incorrect-password") {
        await route.fulfill({
          status: 400,
          headers: {
            "X-Supabase-Api-Version": "2024-01-01",
            "Access-Control-Expose-Headers": "X-Supabase-Api-Version",
          },
          json: { code: "invalid_credentials", msg: "Invalid login credentials" },
        });
      } else await route.fulfill({ json: session() });
    } else if (url.pathname.endsWith("/signup"))
      await route.fulfill({ json: { user, session: null } });
    else if (url.pathname.endsWith("/user")) await route.fulfill({ json: user });
    else if (url.pathname.endsWith("/logout")) await route.fulfill({ status: 204 });
    else if (url.pathname.endsWith("/recover")) await route.fulfill({ json: {} });
    else await route.fulfill({ status: 404, json: {} });
  });
}
async function login(page: Page, password = "correct-password") {
  await page.getByLabel("E-mail", { exact: true }).fill(user.email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
}
async function settings(page: Page) {
  await page.getByRole("button", { name: "Ajustes", exact: true }).last().click();
}

test.beforeEach(async ({ page }) => {
  await mockAuth(page);
});

test("login: erro, sessão persistente, saída e nova entrada", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Bom ter você de volta" })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
  await page.screenshot({ path: test.info().outputPath("auth-screen.png"), fullPage: true });
  await login(page, "incorrect-password");
  await expect(page.getByRole("alert")).toHaveText("E-mail ou senha incorretos.");
  await login(page);
  await settings(page);
  await expect(page.getByText(user.email, { exact: true })).toBeVisible();
  await page.reload();
  await settings(page);
  await expect(page.getByText(user.email, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sair da conta", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Bom ter você de volta" })).toBeVisible();
  await expect(page.getByText(user.email, { exact: true })).toHaveCount(0);
  await login(page);
  await settings(page);
  await expect(page.getByText(user.email, { exact: true })).toBeVisible();
});

test("login: modo sem conta e retorno ao cadastro nos ajustes", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Continuar sem conta", exact: true }).click();
  await settings(page);
  await expect(page.getByRole("heading", { name: "Treinando sem conta" })).toBeVisible();
  await page.getByRole("button", { name: "Entrar ou criar conta" }).click();
  await expect(page.getByRole("heading", { name: "Bom ter você de volta" })).toBeVisible();
});

test("cadastro: confirma senha e envia nome e URL de retorno", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ainda não tem conta? Cadastre-se" }).click();
  await page.getByLabel("Como você quer ser chamado?").fill("Felipe");
  await page.getByLabel("E-mail", { exact: true }).fill(user.email);
  await page.getByLabel("Senha", { exact: true }).fill("correct-password");
  await page.getByLabel("Confirmar senha").fill("different-password");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("As senhas não coincidem.");
  await page.getByLabel("Confirmar senha").fill("correct-password");
  const request = page.waitForRequest((r) => r.url().startsWith(`${endpoint}/signup`));
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  const sent = await request;
  expect(sent.postDataJSON().data.display_name).toBe("Felipe");
  expect(new URL(sent.url()).searchParams.get("redirect_to")).toBe("http://127.0.0.1:4173/");
  await expect(page.getByRole("status")).toContainText("Confira seu e-mail");
  await expect(page.getByLabel("Senha", { exact: true })).toHaveValue("");
});

test("cadastro sem confirmação: e-mail duplicado, entrada imediata e sessão persistente", async ({
  page,
}) => {
  let duplicate = true;
  await page.route(`${endpoint}/signup**`, async (route) => {
    if (duplicate) {
      duplicate = false;
      await route.fulfill({
        status: 400,
        headers: {
          "X-Supabase-Api-Version": "2024-01-01",
          "Access-Control-Expose-Headers": "X-Supabase-Api-Version",
        },
        json: { code: "user_already_exists", msg: "User already registered" },
      });
    } else await route.fulfill({ json: session() });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Ainda não tem conta? Cadastre-se" }).click();
  await page.getByLabel("Como você quer ser chamado?").fill("Felipe");
  await page.getByLabel("E-mail", { exact: true }).fill(user.email);
  await page.getByLabel("Senha", { exact: true }).fill("correct-password");
  await page.getByLabel("Confirmar senha").fill("correct-password");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "Já existe uma conta com esse e-mail. Entre ou recupere sua senha.",
  );
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await settings(page);
  await expect(page.getByText(user.email, { exact: true })).toBeVisible();
  await expect(page.getByText(/Confira seu e-mail para confirmar/)).toHaveCount(0);
  await page.reload();
  await settings(page);
  await expect(page.getByText(user.email, { exact: true })).toBeVisible();
});

test("recuperação: mensagem neutra e link expirado permite continuar sem conta", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Esqueci minha senha" }).click();
  await page.getByLabel("E-mail", { exact: true }).fill(user.email);
  const request = page.waitForRequest((r) => r.url().startsWith(`${endpoint}/recover`));
  await page.getByRole("button", { name: "Enviar link de recuperação" }).click();
  expect(new URL((await request).url()).searchParams.get("redirect_to")).toBe(
    "http://127.0.0.1:4173/?auth=recovery",
  );
  await expect(page.getByRole("status")).toContainText("Se existe uma conta");
  await page.goto(
    "/?auth=recovery#error=access_denied&error_code=otp_expired&error_description=private-information",
  );
  await expect(page.getByRole("alert")).toContainText("link é inválido ou expirou");
  await expect(page.getByRole("alert")).not.toContainText("private-information");
  await page.getByRole("button", { name: "Continuar sem conta", exact: true }).click();
  await settings(page);
  await expect(page.getByRole("heading", { name: "Treinando sem conta" })).toBeVisible();
});

test("recuperação: callback, recarga e atualização autenticada da senha", async ({ page }) => {
  const value = session();
  const hash = new URLSearchParams({
    access_token: value.access_token,
    refresh_token: value.refresh_token,
    expires_in: "3600",
    token_type: "bearer",
    type: "recovery",
  });
  await page.goto(`/?auth=recovery#${hash}`);
  await expect(page.getByRole("heading", { name: "Crie uma nova senha" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Crie uma nova senha" })).toBeVisible();
  await page.getByLabel("Nova senha", { exact: true }).fill("new-correct-password");
  await page.getByLabel("Confirmar senha").fill("new-correct-password");
  const request = page.waitForRequest(
    (r) => r.url() === `${endpoint}/user` && r.method() === "PUT",
  );
  await page.getByRole("button", { name: "Salvar nova senha" }).click();
  const sent = await request;
  expect(sent.postDataJSON().password).toBe("new-correct-password");
  expect(sent.headers()["authorization"]).toBe(`Bearer ${value.access_token}`);
  await settings(page);
  await expect(page.getByText(user.email, { exact: true })).toBeVisible();
  expect(new URL(page.url()).search).toBe("");
});
