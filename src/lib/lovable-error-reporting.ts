type LovableErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

type LovableEvents = {
  track?: (event: string, properties?: Record<string, unknown>) => string | null;
  captureException?: (
    error: unknown,
    context?: Record<string, unknown>,
    options?: LovableErrorOptions,
  ) => void;
};

declare global {
  interface Window {
    __lovableEvents?: LovableEvents;
    __lovableReportRuntimeError?: (payload: {
      message: string;
      stack?: string;
      filename?: string;
    }) => void;
  }
}

/** Only categorical diagnostics leave the app: no raw errors, URLs, frames or landmarks. */
export function reportLovableError(_error: unknown, _context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const message = "Torvik: interface unavailable";
  const sanitized = new Error(message);
  sanitized.stack = message;
  window.__lovableEvents?.captureException?.(
    sanitized,
    {
      source: "react_error_boundary",
    },
    { mechanism: "react_error_boundary", handled: false, severity: "error" },
  );
  window.__lovableReportRuntimeError?.({ message });
}
