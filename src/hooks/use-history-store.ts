import { useMemo } from "react";
import { useAuth } from "./use-auth";
import { createHistoryStore } from "@/lib/history";

/** Capture an immutable account scope, including while an async save is in flight. */
export function useHistoryStore() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useMemo(() => createHistoryStore(globalThis.indexedDB, userId), [userId]);
}
