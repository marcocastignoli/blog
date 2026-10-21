import { useState } from "react";
import { forListing, getCategories, getPosts } from "../content.server";
import { SITE_URL } from "../site";
import { t, type Lang } from "../i18n";
import { useLang } from "../root";
import { PostList } from "../components/PostList";

export function loader() {
  return { kind: "home" as const, lang: "it" as Lang, posts: forListing(getPosts()), categories: getCategories() };
}

export function meta() {
  return [
    { title: "castignoli.it" },
    { name: "description", content: "Marco Castignoli: tecnologia, idee, racconti, diari di viaggio e filosofia, in italiano e in inglese." },
    { tagName: "link", rel: "canonical", href: `${SITE_URL}/` },
  ];
}

export default function Home({ loaderData }: { loaderData: ReturnType<typeof loader> }) {
  // The language filter lives in the header (root.tsx); the category filter is local to the home.
  const { lang, filter } = useLang();
  const [category, setCategory] = useState<string>("all");
  const s = t(lang);

  const posts = loaderData.posts.filter((p) => (filter === "all" || p.lang === filter) && (category === "all" || p.category === category));

  return (
    <div className="home">
      <div className="category-filter" role="group" aria-label={s.categoryFilterLabel}>
        <button type="button" aria-pressed={category === "all"} onClick={() => setCategory("all")}>
          {s.allCategories}
        </button>
        {loaderData.categories.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={category === c.id}
            style={{ "--accent": c.accent } as React.CSSProperties}
            onClick={() => setCategory(category === c.id ? "all" : c.id)}
          >
            {c.name[lang]}
          </button>
        ))}
      </div>
      <PostList posts={posts} categories={loaderData.categories} lang={lang} />
    </div>
  );
}
