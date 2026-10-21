import { createContext, useContext, useState, type ReactNode } from "react";
import { Link, Links, Meta, Outlet, Scripts, ScrollRestoration, isRouteErrorResponse, useMatches, useRouteError } from "react-router";
import { t, type Lang } from "./i18n";
import "./styles/base.css";
import "./styles/themes.css";

// The language of the page comes from the matched route's loader data. The home page can
// switch it on the client (its language filter) through this context.
const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "it", setLang: () => {} });
export const useLang = () => useContext(LangContext);

function pageLang(matches: ReturnType<typeof useMatches>): Lang {
  for (const m of [...matches].reverse()) {
    const data = (m as { loaderData?: unknown }).loaderData as { lang?: Lang } | undefined;
    if (data?.lang === "it" || data?.lang === "en") return data.lang;
  }
  return "it";
}

export function Layout({ children }: { children: ReactNode }) {
  const matches = useMatches();
  const initial = pageLang(matches);
  const [lang, setLang] = useState<Lang>(initial);
  const s = t(lang);
  return (
    <html lang={lang}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <link rel="icon" href="/wp-content/uploads/2022/10/logo-150x150.png" />
        <link rel="alternate" type="application/rss+xml" title={s.siteName} href="/feed.xml" />
        <Meta />
        <Links />
      </head>
      <body>
        <LangContext.Provider value={{ lang, setLang }}>
          <header className="site-header">
            <Link to="/" className="site-name">{s.siteName}</Link>
            <nav className="site-nav">
              <Link to="/poesie/">{s.poems}</Link>
              <a href="/feed.xml">{s.feed}</a>
            </nav>
          </header>
          <main className="site-main">{children}</main>
          <footer className="site-footer">
            <span>{s.writtenBy} {s.author}</span>
            <a href="https://github.com/marcocastignoli/blog">{s.source}</a>
          </footer>
        </LangContext.Provider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();
  const { lang } = useLang();
  const s = t(lang);
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  const title = notFound ? s.notFound : "Errore / Error";
  const body = notFound ? s.notFoundBody : error instanceof Error ? error.message : String(error);
  return (
    <article className="post" data-theme="base">
      <title>{`${title} · ${s.siteName}`}</title>
      <h1>{title}</h1>
      <p>{body}</p>
      <p><Link to="/">{s.backHome}</Link></p>
    </article>
  );
}
