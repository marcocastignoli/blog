import { useState } from "react";
import { forListing, getCategories, getPinnedPages, getPosts } from "../content.server";
import { SITE_URL } from "../site";
import { t, type Lang } from "../i18n";
import { useLang } from "../lang-context";
import { PostList } from "../components/PostList";

export function loader() {
  return { kind: "home" as const, lang: "it" as Lang, posts: forListing([...getPosts(), ...getPinnedPages()]), categories: getCategories() };
}

export function meta() {
  return [
    { title: "castignoli.it" },
    { name: "description", content: "Marco Castignoli: tecnologia, idee, racconti, diari di viaggio e filosofia, in italiano e in inglese." },
    { tagName: "link", rel: "canonical", href: `${SITE_URL}/` },
  ];
}

export default function Home({ loaderData }: { loaderData: ReturnType<typeof loader> }) {
  // The language highlight lives in the header (root.tsx); the category filter is local to the home.
  const { lang, filter } = useLang();
  const [category, setCategory] = useState<string>("all");
  const s = t(lang);

  const posts = category === "all" ? loaderData.posts : loaderData.posts.filter((p) => p.category === category);

  return (
    <div className="home">
      <img
        className="site-motto"
        src="/wp-content/uploads/2022/10/banner-1024x241.png"
        srcSet="/wp-content/uploads/2022/10/banner-768x181.png 768w, /wp-content/uploads/2022/10/banner-1024x241.png 1024w, /wp-content/uploads/2022/10/banner-1536x361.png 1536w, /wp-content/uploads/2022/10/banner.png 1700w"
        sizes="(max-width: 40rem) calc(100vw - 2.5rem), 38rem"
        width="1700"
        height="400"
        alt="What if the child was right, but had no words to say it?"
        fetchPriority="high"
      />
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
      <PostList posts={posts} categories={loaderData.categories} lang={lang} highlight={filter} />
    </div>
  );
}
