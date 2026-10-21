import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { Link, Links, Meta, Outlet, Scripts, ScrollRestoration, isRouteErrorResponse, useMatches, useNavigate, useRouteError } from "react-router";
import { t, type Lang } from "./i18n";
import { LANG_FILTER_STORAGE_KEY as STORAGE_KEY, LangContext, useLang, type LangFilter, type PageInfo } from "./lang-context";
import "./styles/base.css";
import "./styles/themes.css";

function pageInfo(matches: ReturnType<typeof useMatches>): PageInfo | undefined {
  for (const m of [...matches].reverse()) {
    const data = (m as { loaderData?: unknown }).loaderData as PageInfo | undefined;
    if (data && (data.lang === "it" || data.lang === "en")) return data;
  }
  return undefined;
}

function LangSelector({ page, filter, setFilter, lang }: { page: PageInfo; filter: LangFilter; setFilter: (f: LangFilter) => void; lang: Lang }) {
  const navigate = useNavigate();
  const s = t(lang);
  const options: { value: Lang; label: string }[] = [
    { value: "it", label: "Italiano" },
    { value: "en", label: "English" },
  ];
  // Every post stays listed: the chosen language is highlighted, the other one is dimmed.
  // Choosing the highlighted language again clears the choice.
  function choose(l: Lang) {
    const f: LangFilter = filter === l ? "all" : l;
    setFilter(f);
    // A category index exists in both languages: follow the chosen one.
    if (page.kind === "category" && page.category && f !== "all" && f !== page.lang) navigate(`/${page.category.slug[f]}/`);
  }
  return (
    <div className="lang-filter" role="group" aria-label={s.filterLabel}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={filter === o.value} onClick={() => choose(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function BackLink({ lang }: { lang: Lang }) {
  const navigate = useNavigate();
  const s = t(lang);
  // Go back in history when the reader came from inside the site, otherwise to the home page.
  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    const idx = typeof window !== "undefined" ? (window.history.state?.idx as number | undefined) : undefined;
    if (idx && idx > 0) {
      e.preventDefault();
      navigate(-1);
    }
  }
  return (
    <Link to="/" className="back-link" onClick={onClick}>
      <span aria-hidden="true">←</span> {s.back}
    </Link>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const matches = useMatches();
  const page = pageInfo(matches);
  const [filter, setFilterState] = useState<LangFilter>("all");

  // Applied after hydration so the prerendered HTML matches on first paint.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "it" || saved === "en" || saved === "all") setFilterState(saved);
    } catch {}
  }, []);

  function setFilter(f: LangFilter) {
    setFilterState(f);
    try {
      localStorage.setItem(STORAGE_KEY, f);
    } catch {}
  }

  const lang: Lang = page?.kind === "home" ? (filter === "en" ? "en" : "it") : (page?.lang ?? "it");
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
        <LangContext.Provider value={{ lang, filter, setFilter }}>
          <header className="site-header">
            <Link to="/" className="site-name">{s.siteName}</Link>
            <div className="site-tools">
              {page?.kind === "doc" ? <BackLink lang={lang} /> : page ? <LangSelector page={page} filter={filter} setFilter={setFilter} lang={lang} /> : null}
            </div>
          </header>
          <main className="site-main">{children}</main>
          <footer className="site-footer">
            <span>{s.writtenBy} {s.author}</span>
            <nav className="footer-nav">
              <Link to="/poesie/">{s.poems}</Link>
              <a href="/feed.xml">{s.feed}</a>
              <a href="https://github.com/marcocastignoli/blog">{s.source}</a>
            </nav>
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
