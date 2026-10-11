import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { authConfigured, getSupabase } from "@/lib/supabase";

type AuthState = {
  session: Session | null;
  loading: boolean;
  configured: boolean;
  recovery: boolean;
  error: string;
  finishRecovery: () => void;
};
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovery, setRecovery] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let disposed = false;
    // Read only the presence of a callback error; never display service URL contents.
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    const failedLink = fragment.has("error") || query.has("error");
    if (failedLink) {
      setError("Este link é inválido ou expirou. Solicite um novo link e tente novamente.");
      window.history.replaceState(window.history.state, "", "/");
    }
    let subscription: { unsubscribe: () => void } | undefined;
    try {
      const supabase = getSupabase();
      if (!supabase) {
        setLoading(false);
        return;
      }
      const result = supabase.auth.onAuthStateChange((event, next) => {
        if (disposed) return;
        setSession(next);
        // Keep callbacks synchronous: awaiting Auth methods here can deadlock the SDK.
        if (event === "PASSWORD_RECOVERY") setRecovery(true);
        else if (event === "INITIAL_SESSION") {
          if (next && query.get("auth") === "recovery" && !failedLink) setRecovery(true);
          if (!next && query.get("auth") === "recovery" && !failedLink) {
            setError("Este link é inválido ou expirou. Solicite uma nova recuperação de senha.");
          }
        } else if (event === "SIGNED_OUT") setRecovery(false);
        setLoading(false);
      });
      subscription = result.data.subscription;
      void supabase.auth
        .getSession()
        .then((result) => {
          if (!disposed && result.error) {
            setError("Não foi possível recuperar sua sessão. Tente novamente.");
            setLoading(false);
          }
        })
        .catch(() => {
          if (!disposed) {
            setError("Não foi possível recuperar sua sessão. Tente novamente.");
            setLoading(false);
          }
        });
    } catch {
      setError("Não foi possível iniciar o login. Tente novamente mais tarde.");
      setLoading(false);
    }
    return () => {
      disposed = true;
      subscription?.unsubscribe();
    };
  }, []);
  function finishRecovery() {
    setRecovery(false);
    setError("");
    window.history.replaceState(window.history.state, "", "/");
  }
  return (
    <AuthContext.Provider
      value={{ session, loading, configured: authConfigured, recovery, error, finishRecovery }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const state = useContext(AuthContext);
  if (!state) throw new Error("AuthProvider ausente.");
  return state;
}
