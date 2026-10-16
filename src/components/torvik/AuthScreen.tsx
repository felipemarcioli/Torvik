import { useTranslation } from "react-i18next";
import { translate as t } from "@/lib/i18n";
import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  ChartNoAxesCombined,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ScanLine,
  UserRound,
} from "lucide-react";
import { Brand, Mascot } from "./TorvikUI";
import { useAuth } from "@/hooks/use-auth";
import { getSupabase } from "@/lib/supabase";
import { authErrorMessage, authRedirect, passwordError, MIN_PASSWORD_LENGTH } from "@/lib/auth";

type Mode = "login" | "signup" | "reset";
export function AuthScreen({ onGuest }: { onGuest: () => void }) {
  useTranslation();

  const auth = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const recovery = auth.recovery && Boolean(auth.session);
  const newPassword = recovery || mode === "signup";
  const heading = recovery
    ? t("Crie uma nova senha")
    : mode === "signup"
      ? t("Comece sua jornada")
      : mode === "reset"
        ? t("Recupere sua senha")
        : t("Bom ter você de volta");
  const action = recovery
    ? t("Salvar nova senha")
    : mode === "signup"
      ? t("Criar conta")
      : mode === "reset"
        ? t("Enviar link de recuperação")
        : t("Entrar");
  function changeMode(next: Mode) {
    setMode(next);
    setPassword("");
    setConfirmation("");
    setError("");
    setMessage("");
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setError("");
    setMessage("");
    if (newPassword) {
      const invalid = passwordError(password, confirmation);
      if (invalid) {
        setError(invalid);
        return;
      }
    }
    setPending(true);
    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error(t("Login indisponível"));
      if (recovery) {
        const result = await supabase.auth.updateUser({ password });
        if (result.error) throw result.error;
        setPassword("");
        setConfirmation("");
        auth.finishRecovery();
      } else if (mode === "signup") {
        const result = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { display_name: name.trim() },
            emailRedirectTo: authRedirect(window.location.origin),
          },
        });
        if (result.error) throw result.error;
        setPassword("");
        setConfirmation("");
        if (!result.data.session)
          setMessage(
            "Confira seu e-mail para confirmar o cadastro. Se já tem uma conta, entre ou recupere a senha.",
          );
      } else if (mode === "reset") {
        const result = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: authRedirect(window.location.origin, true),
        });
        if (result.error) throw result.error;
        setMessage(
          "Se existe uma conta com esse e-mail, você receberá um link para criar uma nova senha.",
        );
      } else {
        const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (result.error) throw result.error;
        setPassword("");
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="auth-screen">
      <div className="auth-layout">
        <section className="auth-intro" aria-label="Torvik">
          <div className="auth-brand">
            <Brand />
          </div>
          <div className="auth-intro-copy">
            <p className="auth-eyebrow">{t("Seu treino, no seu ritmo")}</p>
            <h2>
              {t("Seu movimento.")}
              <br />
              <span>{t("Sua evolução.")}</span>
            </h2>
            <p>
              {t(
                "Um treino de cada vez. Acompanhe seus movimentos e veja até onde você pode chegar.",
              )}
            </p>
          </div>
          <div className="auth-mascot-scene">
            <Mascot />
            <div className="auth-scene-note">
              <span>
                <ScanLine size={18} aria-hidden="true" />
              </span>
              <div>
                <strong>{t("Treine com a câmera")}</strong>
                <p>{t("Feedback em tempo real")}</p>
              </div>
            </div>
          </div>
          <div className="auth-intro-footer">
            <ChartNoAxesCombined size={18} aria-hidden="true" />
            <p>{t("Encontre seu ritmo. Construa sua rotina.")}</p>
          </div>
        </section>
        <section className="auth-panel" aria-labelledby="auth-heading">
          <div className="auth-form-heading">
            <p className="auth-eyebrow">
              {recovery
                ? t("Um novo começo")
                : mode === "signup"
                  ? t("Faça parte do Torvik")
                  : mode === "reset"
                    ? t("Vamos te ajudar")
                    : t("Vamos treinar?")}
            </p>
            <h1 id="auth-heading">{heading}</h1>
            <p className="auth-description">
              {recovery
                ? t("Escolha uma nova senha para acessar sua conta.")
                : mode === "reset"
                  ? t("Informe seu e-mail para receber o link de recuperação.")
                  : mode === "signup"
                    ? t("Crie sua conta e dê o primeiro passo no seu próximo treino.")
                    : t("Entre na sua conta e continue no seu ritmo.")}
            </p>
          </div>
          {auth.error && (
            <p role="alert" className="auth-error">
              {t(auth.error)}
            </p>
          )}
          {!auth.configured && (
            <p role="status">
              {t("O login estará disponível em breve. Você já pode treinar sem conta.")}
            </p>
          )}
          <form onSubmit={(event) => void submit(event)} aria-busy={pending}>
            <fieldset disabled={pending || !auth.configured}>
              {!recovery && mode === "signup" && (
                <label htmlFor="auth-name">
                  {t("Como você quer ser chamado?")}
                  <span className="auth-input-wrap">
                    <UserRound size={18} aria-hidden="true" />
                    <input
                      id="auth-name"
                      placeholder={t("Seu nome")}
                      autoComplete="nickname"
                      required
                      maxLength={60}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </span>
                </label>
              )}
              {!recovery && (
                <label htmlFor="auth-email">
                  {t("E-mail")}
                  <span className="auth-input-wrap">
                    <Mail size={18} aria-hidden="true" />
                    <input
                      id="auth-email"
                      placeholder="name@example.com"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </span>
                </label>
              )}
              {(recovery || mode !== "reset") && (
                <>
                  <label htmlFor="auth-password">
                    {recovery ? t("Nova senha") : t("Senha")}
                    <span className="auth-input-wrap auth-password">
                      <LockKeyhole size={18} aria-hidden="true" />
                      <input
                        id="auth-password"
                        placeholder={newPassword ? t("Crie uma senha") : t("Sua senha")}
                        type={visible ? "text" : "password"}
                        autoComplete={newPassword ? "new-password" : "current-password"}
                        required
                        minLength={newPassword ? MIN_PASSWORD_LENGTH : undefined}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                      />
                      <button
                        type="button"
                        aria-label={visible ? t("Ocultar senha") : t("Mostrar senha")}
                        aria-pressed={visible}
                        onClick={() => setVisible((value) => !value)}
                      >
                        {visible ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </span>
                  </label>
                  {newPassword && (
                    <label htmlFor="auth-confirmation">
                      {t("Confirmar senha")}
                      <span className="auth-input-wrap">
                        <LockKeyhole size={18} aria-hidden="true" />
                        <input
                          id="auth-confirmation"
                          placeholder={t("Repita sua senha")}
                          type={visible ? "text" : "password"}
                          autoComplete="new-password"
                          required
                          minLength={MIN_PASSWORD_LENGTH}
                          value={confirmation}
                          onChange={(event) => setConfirmation(event.target.value)}
                        />
                      </span>
                      <span className="auth-hint">{t("Use pelo menos 8 caracteres.")}</span>
                    </label>
                  )}
                </>
              )}
              {!recovery && mode === "login" && (
                <button
                  type="button"
                  className="auth-link auth-forgot"
                  onClick={() => changeMode("reset")}
                >
                  {t("Esqueci minha senha")}
                </button>
              )}
              {error && (
                <p role="alert" className="auth-error">
                  {t(error)}
                </p>
              )}
              {message && (
                <p role="status" className="auth-message">
                  <Mail size={18} aria-hidden="true" />
                  {t(message)}
                </p>
              )}
              <button type="submit" className="torvik-primary w-full">
                {pending ? t("Aguarde…") : action}
                <ArrowRight className="directional-icon" size={18} aria-hidden="true" />
              </button>
            </fieldset>
          </form>
          {!recovery && (
            <>
              <button
                type="button"
                disabled={pending}
                className="auth-link auth-switch"
                onClick={() => changeMode(mode === "login" ? "signup" : "login")}
              >
                <span>{mode === "login" ? t("Ainda não tem conta?") : t("Já tem conta?")}</span>{" "}
                <strong>{mode === "login" ? t("Cadastre-se") : t("Entrar")}</strong>
              </button>
              <div className="auth-divider" aria-hidden="true">
                <span>{t("ou")}</span>
              </div>
              <button
                type="button"
                disabled={pending}
                className="torvik-secondary auth-guest w-full"
                onClick={onGuest}
              >
                {t("Continuar sem conta")}
              </button>
            </>
          )}
          <p className="auth-footnote">
            <LockKeyhole size={14} aria-hidden="true" />
            <span>{t("Histórico local, separado por conta. Sem sincronização.")}</span>
          </p>
        </section>
      </div>
    </main>
  );
}
