import {
  Outlet,
  Link,
  createRootRoute,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="hero-glow flex min-h-screen items-center justify-center px-4">
      <div className="torvik-panel w-full max-w-md p-8 text-center sm:p-10">
        <p className="torvik-kicker">Torvik</p>
        <h1 className="mt-2 font-display text-7xl font-extrabold text-primary">404</h1>
        <h2 className="mt-3 text-2xl font-semibold">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">A página não existe ou foi movida.</p>
        <div className="mt-6">
          <Link to="/" className="torvik-primary">
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="hero-glow flex min-h-screen items-center justify-center px-4">
      <div className="torvik-panel w-full max-w-md p-8 text-center sm:p-10">
        <p className="torvik-kicker text-caution">Atenção</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Não foi possível carregar a página
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ocorreu um problema. Tente novamente ou volte ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="torvik-primary"
          >
            Tentar novamente
          </button>
          <a href="/" className="torvik-secondary">
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Torvik" },
      { name: "description", content: "Acompanhamento local de movimento pela câmera." },
      { name: "author", content: "Torvik" },
      { property: "og:title", content: "Torvik" },
      { property: "og:description", content: "Acompanhamento local de movimento pela câmera." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
