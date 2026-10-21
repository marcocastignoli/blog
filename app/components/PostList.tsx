import { Link } from "react-router";
import type { Category, Summary } from "../site";
import { formatDate, t, type Lang } from "../i18n";

export function PostList({ posts, categories, lang }: { posts: Summary[]; categories: Category[]; lang: Lang }) {
  const s = t(lang);
  if (posts.length === 0) return <p className="post-list-empty">{s.noPosts}</p>;
  return (
    <ol className="post-list">
      {posts.map((p) => {
        const c = categories.find((x) => x.id === p.category);
        return (
          <li key={p.id} className="post-item" style={c ? ({ "--accent": c.accent } as React.CSSProperties) : undefined}>
            <div className="post-item-meta">
              <time dateTime={p.date}>{formatDate(p.date, lang)}</time>
              {c && (
                <>
                  {" · "}
                  <Link to={`/${c.slug[lang]}/`} className="post-item-category">{c.name[lang]}</Link>
                </>
              )}
              <span className="lang-mark" lang={p.lang} title={s.languageName[p.lang]}>{s.languageMark[p.lang]}</span>
            </div>
            <h2 className="post-item-title">
              <Link to={p.path} lang={p.lang}>{p.title}</Link>
            </h2>
            <p className="post-item-description" lang={p.lang}>{p.description}</p>
          </li>
        );
      })}
    </ol>
  );
}
