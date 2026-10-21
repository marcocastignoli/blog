import { useEffect, useState } from "react";
import { getCategories, getPosts, toSummary } from "../content.server";
import { SITE_URL } from "../site";
import { t, type Lang } from "../i18n";
import { useLang } from "../root";
import { PostList } from "../components/PostList";

export function loader() {
  return { lang: "it" as Lang, posts: getPosts().map(toSummary), categories: getCategories() };
}

export function meta() {
  return [
    { title: "castignoli.it" },
    { name: "description", content: "Marco Castignoli: tecnologia, idee, racconti, diari di viaggio e filosofia, in italiano e in inglese." },
    { tagName: "link", rel: "canonical", href: `${SITE_URL}/` },
  ];
}

type Filter = "all" | Lang;
const STORAGE_KEY = "castignoli-lang-filter";

export default function Home({ loaderData }: { loaderData: ReturnType<typeof loader> }) {
  const { setLang } = useLang();
  const [filter, setFilter] = useState<Filter>("all");

  // The browser remembers the filter. Applied after hydration so the prerendered HTML matches.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "it" || saved === "en" || saved === "all") setFilter(saved);
    } catch {}
  }, []);

  const uiLang: Lang = filter === "en" ? "en" : "it";
  useEffect(() => setLang(uiLang), [uiLang, setLang]);

  function choose(f: Filter) {
    setFilter(f);
    try {
      localStorage.setItem(STORAGE_KEY, f);
    } catch {}
  }

  const s = t(uiLang);
  const posts = filter === "all" ? loaderData.posts : loaderData.posts.filter((p) => p.lang === filter);
  const options: { value: Filter; label: string }[] = [
    { value: "all", label: s.all },
    { value: "it", label: "Italiano" },
    { value: "en", label: "English" },
  ];

  return (
    <div className="home">
      <div className="lang-filter" role="group" aria-label={s.filterLabel}>
        {options.map((o) => (
          <button key={o.value} type="button" aria-pressed={filter === o.value} onClick={() => choose(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
      <PostList posts={posts} categories={loaderData.categories} lang={uiLang} />
    </div>
  );
}
