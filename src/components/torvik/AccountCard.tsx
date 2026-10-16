import { useTranslation } from "react-i18next";
import { translate as t } from "@/lib/i18n";
import { useState } from "react";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getSupabase } from "@/lib/supabase";
import { authErrorMessage } from "@/lib/auth";

export function AccountCard({ onLogin }: { onLogin: () => void }) {
  useTranslation();

  const { session, configured } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const name: unknown = session?.user.user_metadata["display_name"];
  async function signOut() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error(t("Login indisponível"));
      // This device only: do not log out other devices unexpectedly.
      const result = await supabase.auth.signOut({ scope: "local" });
      if (result.error) throw result.error;
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="torvik-panel account-card" aria-labelledby="account-heading">
      <div className="account-heading">
        <UserRound size={22} aria-hidden="true" />
        <h2 id="account-heading">{session ? t("Sua conta") : t("Treinando sem conta")}</h2>
      </div>
      {session ? (
        <>
          {typeof name === "string" && name && <p className="account-name">{name}</p>}
          <p className="account-email">{session.user.email}</p>
          <p>{t("Seu histórico está separado para esta conta neste dispositivo.")}</p>
          <button
            type="button"
            disabled={pending}
            className="torvik-secondary"
            onClick={() => void signOut()}
          >
            <LogOut size={18} aria-hidden="true" />
            {pending ? t("Saindo…") : t("Sair da conta")}
          </button>
        </>
      ) : (
        <>
          <p>
            {configured
              ? t("Entre ou crie uma conta para ter seu próprio histórico neste dispositivo.")
              : t("O login estará disponível em breve. Seus treinos continuam disponíveis.")}
          </p>
          {configured && (
            <button type="button" className="torvik-primary" onClick={onLogin}>
              <LogIn size={18} aria-hidden="true" />
              {t("Entrar ou criar conta")}
            </button>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="auth-error">
          {t(error)}
        </p>
      )}
    </section>
  );
}
