import { Link } from "react-router";
import type { Category, Summary } from "../site";
import { formatDate, t, type Lang } from "../i18n";

/**
 * With a language highlighted, a translated article appears once, in that language, and a pinned
 * translation group keeps its place whichever version is shown. Without a highlight every post is listed.
 */
export function arrange(posts: Summary[], highlight: "all" | Lang): Summary[] {
  if (highlight === "all") return posts;
  const groups = new Map<string, Summary[]>();
  for (const p of posts) if (p.translationKey) groups.set(p.translationKey, [...(groups.get(p.translationKey) ?? []), p]);
  const out: Summary[] = [];
  for (const p of posts) {
    const group = p.translationKey ? groups.get(p.translationKey) : undefined;
    if (!group || group.length < 2) {
      out.push(p);
      continue;
    }
    const wanted = group.find((g) => g.lang === highlight) ?? group[0];
    if (p !== wanted) continue; // the twin in the other language stays hidden
    out.push(group.some((g) => g.pinned) ? { ...p, pinned: true } : p);
  }
  return out.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date));
}

/** A small push-pin, in the accent colour, with the label for assistive technology. */
function PinIcon({ label }: { label: string }) {
  return (
    <span className="pin-mark" role="img" aria-label={label} title={label}>
      <svg viewBox="0 0 16 16" width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false">
        <path d="M5 1h6v1.5H5z M6.5 2.5h3V7l2.5 2v1.5H4V9l2.5-2z M7.5 10.5h1V15l-.5 1-.5-1z" />
      </svg>
    </span>
  );
}

export function PostList({ posts: all, categories, lang, highlight = "all" }: { posts: Summary[]; categories: Category[]; lang: Lang; highlight?: "all" | Lang }) {
  const s = t(lang);
  const posts = arrange(all, highlight);
  if (posts.length === 0) return <p className="post-list-empty">{s.noPosts}</p>;
  return (
    <ol className="post-list">
      {posts.map((p) => {
        const c = categories.find((x) => x.id === p.category);
        return (
          <li key={p.id} className={["post-item", p.pinned && "pinned", highlight !== "all" && p.lang !== highlight && "dimmed"].filter(Boolean).join(" ")} style={c ? ({ "--accent": c.accent } as React.CSSProperties) : undefined}>
            <div className="post-item-meta">
              {p.pinned && <PinIcon label={s.pinned} />}
              {p.kind === "post" && <time dateTime={p.date}>{formatDate(p.date, lang)}</time>}
              {p.kind === "post" && c && (
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
