export const MIN_PASSWORD_LENGTH = 8;

/** Map service errors without displaying raw responses or account details. */
export function authErrorMessage(error: unknown): string {
  const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
  switch (code) {
    case "invalid_credentials":
      return "E-mail ou senha incorretos.";
    case "email_not_confirmed":
      return "Confirme seu e-mail antes de entrar. Confira também a pasta de spam.";
    case "user_already_exists":
    case "email_exists":
      return "Já existe uma conta com esse e-mail. Entre ou recupere sua senha.";
    case "weak_password":
      return "Use uma senha mais forte, com pelo menos 8 caracteres.";
    case "same_password":
      return "Escolha uma senha diferente da anterior.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
    case "signup_disabled":
      return "O cadastro está temporariamente indisponível.";
    default:
      return "Não foi possível concluir. Verifique sua conexão e tente novamente.";
  }
}

export function passwordError(password: string, confirmation: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return "Use pelo menos 8 caracteres na senha.";
  if (password !== confirmation) return "As senhas não coincidem.";
  return null;
}

/** Never carry service tokens or arbitrary redirect targets into UI navigation. */
export function authRedirect(origin: string, recovery = false): string {
  return `${new URL(origin).origin}/${recovery ? "?auth=recovery" : ""}`;
}
