import { Link, data } from "react-router";
import { getCategories, resolve } from "../content.server";
import { SITE_URL, type Category, type Doc, type Summary, type Translation } from "../site";
import { formatDate, t, type Lang } from "../i18n";
import { PostList } from "../components/PostList";
import { useLang } from "../root";

interface DocData {
  kind: "doc";
  lang: Lang;
  doc: Omit<Doc, "html"> & { html: string };
  translations: Translation[];
  category?: Category;
  categories: Category[];
}
interface CategoryData {
  kind: "category";
  lang: Lang;
  category: Category;
  posts: Summary[];
  categories: Category[];
}
type LoaderData = DocData | CategoryData;

export function loader({ params }: { params: Record<string, string | undefined> }): LoaderData {
  const hit = resolve(params["*"] ?? "/");
  if (!hit) throw data(null, { status: 404 });
  const categories = getCategories();
  if (hit.kind === "category") return { kind: "category", lang: hit.lang, category: hit.category, posts: hit.posts, categories };
  const category = categories.find((c) => c.id === hit.doc.category);
  return { kind: "doc", lang: hit.doc.lang, doc: hit.doc, translations: hit.translations, category, categories };
}

// On GitHub Pages an unknown path serves 404.html (the SPA fallback) and the router then asks for
// <path>/_.data, which does not exist. Turn that failure into a proper 404 for the error boundary.
export async function clientLoader({ serverLoader }: { serverLoader: () => Promise<LoaderData> }): Promise<LoaderData> {
  try {
    return await serverLoader();
  } catch {
    throw data(null, { status: 404 });
  }
}

export function meta({ loaderData }: { loaderData?: LoaderData }) {
  if (!loaderData) return [{ title: "castignoli.it" }];
  const s = t(loaderData.lang);
  if (loaderData.kind === "category") {
    const name = loaderData.category.name[loaderData.lang];
    return [
      { title: `${name} · ${s.siteName}` },
      { name: "description", content: `${s.postsIn} ${name}` },
      { tagName: "link", rel: "canonical", href: `${SITE_URL}/${loaderData.category.slug[loaderData.lang]}/` },
    ];
  }
  const { doc, translations } = loaderData;
  const url = SITE_URL + doc.path;
  const tags: Record<string, unknown>[] = [
    { title: `${doc.title} · ${s.siteName}` },
    { name: "description", content: doc.description },
    { property: "og:title", content: doc.title },
    { property: "og:description", content: doc.description },
    { property: "og:type", content: doc.kind === "post" ? "article" : "website" },
    { property: "og:url", content: url },
    { property: "og:locale", content: doc.lang === "it" ? "it_IT" : "en_GB" },
    { tagName: "link", rel: "canonical", href: url },
  ];
  if (translations.length) {
    tags.push({ tagName: "link", rel: "alternate", hrefLang: doc.lang, href: url });
    for (const tr of translations) tags.push({ tagName: "link", rel: "alternate", hrefLang: tr.lang, href: SITE_URL + tr.path });
    tags.push({ tagName: "link", rel: "alternate", hrefLang: "x-default", href: url });
  }
  if (doc.kind === "post") {
    tags.push({ property: "article:published_time", content: doc.date });
    if (doc.modified) tags.push({ property: "article:modified_time", content: doc.modified });
  }
  return tags;
}

export default function Document({ loaderData }: { loaderData: LoaderData }) {
  if (loaderData.kind === "category") return <CategoryIndex data={loaderData} />;
  return <Article data={loaderData} />;
}

function CategoryIndex({ data }: { data: CategoryData }) {
  const { filter } = useLang();
  return (
    <div className="home">
      <h1 className="category-title" style={{ "--accent": data.category.accent } as React.CSSProperties}>
        {data.category.name[data.lang]}
      </h1>
      <PostList posts={data.posts} categories={data.categories} lang={data.lang} highlight={filter} />
    </div>
  );
}

function Article({ data }: { data: DocData }) {
  const { doc, category, translations, lang } = data;
  const s = t(lang);
  const accent = doc.accent ?? category?.accent;
  const style = accent ? ({ "--accent": accent } as React.CSSProperties) : undefined;
  return (
    <article className="post" data-theme={doc.theme} data-post={doc.id} style={style}>
      {doc.style && <style>{`.post[data-post="${doc.id}"] .post-body { ${doc.style} }`}</style>}
      <header className="post-header">
        {category && (
          <p className="post-category">
            <Link to={`/${category.slug[lang]}/`}>{category.name[lang]}</Link>
          </p>
        )}
        <h1 className="post-title">{doc.title}</h1>
        {doc.kind === "post" && (
          <p className="post-date">
            <time dateTime={doc.date}>{formatDate(doc.date, lang)}</time>
            {doc.modified && doc.modified.slice(0, 10) !== doc.date.slice(0, 10) && (
              <span className="post-modified">
                {" · "}
                {s.updated} <time dateTime={doc.modified}>{formatDate(doc.modified, lang)}</time>
              </span>
            )}
          </p>
        )}
        {translations.length > 0 && (
          <p className="post-translation">
            {translations.map((tr) => (
              <span key={tr.lang}>
                {s.alsoIn} {s.languageName[tr.lang]}: <Link to={tr.path} hrefLang={tr.lang} lang={tr.lang}>{tr.title}</Link>
              </span>
            ))}
          </p>
        )}
      </header>
      <div className="post-body" dangerouslySetInnerHTML={{ __html: doc.html }} />
    </article>
  );
}
