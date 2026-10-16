import { useTranslation } from "react-i18next";
import { translate as t, currentLanguage, i18n } from "@/lib/i18n";
import { LocaleProvider } from "@/lib/i18n/provider";
import {
  Outlet,
  Link,
  createRootRoute,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { type ReactNode, useSyncExternalStore } from "react";

import { StatePage } from "@/components/torvik/TorvikUI";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  useTranslation();

  return (
    <StatePage
      title={t("Página não encontrada")}
      eyebrow={t("Vamos voltar ao treino")}
      actions={
        <Link to="/" className="torvik-primary">
          {t("Voltar ao início")}
        </Link>
      }
    >
      {t("A página não existe ou foi movida.")}
    </StatePage>
  );
}

function ErrorComponent({ reset }: ErrorComponentProps) {
  useTranslation();

  const router = useRouter();

  return (
    <StatePage
      title={t("Não foi possível carregar a página")}
      eyebrow={t("Vamos tentar de novo")}
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
            {t("Tentar novamente")}
          </button>
          <a href="/" className="torvik-secondary">
            {t("Voltar ao início")}
          </a>
        </>
      }
    >
      {t("Ocorreu um problema. Tente novamente ou volte ao início.")}
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
      { name: "description", content: t("Acompanhamento local de movimento pela câmera.") },
      { name: "author", content: "Torvik" },
      { property: "og:title", content: "Torvik" },
      { property: "og:description", content: t("Acompanhamento local de movimento pela câmera.") },
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

function subscribeLanguage(change: () => void) {
  i18n.on("languageChanged", change);
  return () => {
    i18n.off("languageChanged", change);
  };
}

function RootShell({ children }: { children: ReactNode }) {
  // Snapshot checking also catches locale changes before this shell subscribes.
  // The server snapshot stays deterministic while streamed boundaries hydrate.
  const language = useSyncExternalStore(subscribeLanguage, currentLanguage, () => "en");
  return (
    <html lang={language} dir={language === "ar" ? "rtl" : "ltr"}>
      <head>
        <HeadContent />
      </head>
      <body>
        <LocaleProvider>{children}</LocaleProvider>
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  useTranslation();

  return <Outlet />;
}
