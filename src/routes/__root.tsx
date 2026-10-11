import {
  Outlet,
  Link,
  createRootRoute,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { StatePage } from "@/components/torvik/TorvikUI";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <StatePage
      title="Página não encontrada"
      eyebrow="Vamos voltar ao treino"
      actions={
        <Link to="/" className="torvik-primary">
          Voltar ao início
        </Link>
      }
    >
      A página não existe ou foi movida.
    </StatePage>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <StatePage
      title="Não foi possível carregar a página"
      eyebrow="Vamos tentar de novo"
      actions={
        <>
          <button
            type="button"
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
        </>
      }
    >
      Ocorreu um problema. Tente novamente ou volte ao início.
    </StatePage>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content",
      },
      { title: "Torvik" },
      { name: "theme-color", content: "#0c1727" },
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
