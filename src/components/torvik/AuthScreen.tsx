import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, Mail } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getSupabase } from "@/lib/supabase";
import { authErrorMessage, authRedirect, passwordError, MIN_PASSWORD_LENGTH } from "@/lib/auth";

type Mode = "login" | "signup" | "reset";
export function AuthScreen({ onGuest }: { onGuest: () => void }) {
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
    ? "Crie uma nova senha"
    : mode === "signup"
      ? "Comece sua jornada"
      : mode === "reset"
        ? "Recupere sua senha"
        : "Bom ter você de volta";
  const action = recovery
    ? "Salvar nova senha"
    : mode === "signup"
      ? "Criar conta"
      : mode === "reset"
        ? "Enviar link de recuperação"
        : "Entrar";
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
      if (!supabase) throw new Error("Login indisponível");
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
    <main className="auth-screen hero-glow">
      <div className="auth-layout">
        <section className="auth-intro" aria-label="Torvik">
          <p className="torvik-kicker">Torvik</p>
          <h2>
            Seu movimento.
            <br />
            Sua evolução.
          </h2>
          <p>Treine com a câmera, acompanhe seus resultados e encontre seu ritmo.</p>
          <img
            src="/torvik-image-2d.webp"
            width="160"
            height="240"
            alt="Torvik, mascote do treino"
          />
        </section>
        <section className="torvik-panel auth-panel" aria-labelledby="auth-heading">
          <p className="torvik-kicker">
            {recovery ? "Nova senha" : mode === "signup" ? "Sua conta Torvik" : "Vamos treinar?"}
          </p>
          <h1 id="auth-heading">{heading}</h1>
          <p className="auth-description">
            {recovery
              ? "Escolha uma senha para voltar à sua conta."
              : mode === "reset"
                ? "Enviaremos um link para o e-mail da sua conta."
                : "Seu histórico fica separado por conta neste dispositivo."}
          </p>
          {auth.error && (
            <p role="alert" className="auth-error">
              {auth.error}
            </p>
          )}
          {!auth.configured && (
            <p role="status">O login estará disponível em breve. Você já pode treinar sem conta.</p>
          )}
          <form onSubmit={(event) => void submit(event)} aria-busy={pending}>
            <fieldset disabled={pending || !auth.configured}>
              {!recovery && mode === "signup" && (
                <label htmlFor="auth-name">
                  Como você quer ser chamado?
                  <input
                    id="auth-name"
                    autoComplete="nickname"
                    required
                    maxLength={60}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>
              )}
              {!recovery && (
                <label htmlFor="auth-email">
                  E-mail
                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>
              )}
              {(recovery || mode !== "reset") && (
                <>
                  <label htmlFor="auth-password">
                    {recovery ? "Nova senha" : "Senha"}
                    <span className="auth-password">
                      <input
                        id="auth-password"
                        type={visible ? "text" : "password"}
                        autoComplete={newPassword ? "new-password" : "current-password"}
                        required
                        minLength={newPassword ? MIN_PASSWORD_LENGTH : undefined}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                      />
                      <button
                        type="button"
                        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
                        aria-pressed={visible}
                        onClick={() => setVisible((value) => !value)}
                      >
                        {visible ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </span>
                  </label>
                  {newPassword && (
                    <label htmlFor="auth-confirmation">
                      Confirmar senha
                      <input
                        id="auth-confirmation"
                        type={visible ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        minLength={MIN_PASSWORD_LENGTH}
                        value={confirmation}
                        onChange={(event) => setConfirmation(event.target.value)}
                      />
                      <span className="auth-hint">Use pelo menos 8 caracteres.</span>
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
                  Esqueci minha senha
                </button>
              )}
              {error && (
                <p role="alert" className="auth-error">
                  {error}
                </p>
              )}
              {message && (
                <p role="status" className="auth-message">
                  <Mail size={18} aria-hidden="true" />
                  {message}
                </p>
              )}
              <button type="submit" className="torvik-primary w-full">
                {pending ? "Aguarde…" : action}
                <ArrowRight size={18} aria-hidden="true" />
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
                {mode === "login" ? "Ainda não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
              </button>
              <button
                type="button"
                disabled={pending}
                className="torvik-secondary w-full"
                onClick={onGuest}
              >
                Continuar sem conta
              </button>
            </>
          )}
          <p className="auth-footnote">
            A câmera é analisada no dispositivo. Seus treinos ainda não são sincronizados na nuvem.
          </p>
        </section>
      </div>
    </main>
  );
}
