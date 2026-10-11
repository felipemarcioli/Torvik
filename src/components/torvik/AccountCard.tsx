import { useState } from "react";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getSupabase } from "@/lib/supabase";
import { authErrorMessage } from "@/lib/auth";

export function AccountCard({ onLogin }: { onLogin: () => void }) {
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
      if (!supabase) throw new Error("Login indisponível");
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
        <h2 id="account-heading">{session ? "Sua conta" : "Treinando sem conta"}</h2>
      </div>
      {session ? (
        <>
          {typeof name === "string" && name && <p className="account-name">{name}</p>}
          <p className="account-email">{session.user.email}</p>
          <p>Seu histórico está separado para esta conta neste dispositivo.</p>
          <button
            type="button"
            disabled={pending}
            className="torvik-secondary"
            onClick={() => void signOut()}
          >
            <LogOut size={18} aria-hidden="true" />
            {pending ? "Saindo…" : "Sair da conta"}
          </button>
        </>
      ) : (
        <>
          <p>
            {configured
              ? "Entre ou crie uma conta para ter seu próprio histórico neste dispositivo."
              : "O login estará disponível em breve. Seus treinos continuam disponíveis."}
          </p>
          {configured && (
            <button type="button" className="torvik-primary" onClick={onLogin}>
              <LogIn size={18} aria-hidden="true" />
              Entrar ou criar conta
            </button>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="auth-error">
          {error}
        </p>
      )}
    </section>
  );
}
