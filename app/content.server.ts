// Build-time content model. Runs only in Node (prerender and the dev server), never in the browser.
// Reads content/categories.json, content/posts/*.md and content/pages/*.md.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import type { Lang } from "./i18n";

import { SITE_URL, SITE_NAME, AUTHOR, type Category, type Doc, type Summary, type Translation } from "./site";
export { SITE_URL, SITE_NAME, AUTHOR };
export type { Category, Doc, Summary, Translation };

const ROOT = process.cwd();

marked.use({ gfm: true, breaks: false });

function normalizePath(p: string): string {
  let out = "/" + p.replace(/^\/+|\/+$/g, "");
  if (out !== "/") out += "/";
  return out;
}

function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function describe(html: string, max = 160): string {
  const text = plainText(html);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")) + "…";
}

interface Content {
  categories: Category[];
  docs: Doc[];
}

let cache: Content | null = null;

function readDocs(dir: string, kind: Doc["kind"], categories: Category[]): Doc[] {
  const full = join(ROOT, "content", dir);
  const docs: Doc[] = [];
  for (const file of readdirSync(full).filter((f) => f.endsWith(".md")).sort()) {
    const id = file.replace(/\.md$/, "");
    const { data, content } = matter(readFileSync(join(full, file), "utf8"));
    const lang: Lang = data.lang === "en" ? "en" : "it";
    const category = categories.find((c) => c.id === data.category);
    if (kind === "post" && !category) throw new Error(`${file}: unknown category "${data.category}"`);
    const slug = id.replace(/^\d{4}-\d{2}-\d{2}-/, "");
    const path = normalizePath(data.path ?? (category ? `/${category.slug[lang]}/${slug}/` : `/${slug}/`));
    const html = marked.parse(content) as string;
    docs.push({
      kind,
      id,
      title: String(data.title ?? slug),
      date: new Date(data.date ?? "1970-01-01").toISOString(),
      modified: data.modified ? new Date(data.modified).toISOString() : undefined,
      lang,
      category: category?.id,
      path,
      translationKey: data.translationKey ? String(data.translationKey) : undefined,
      theme: String(data.theme ?? category?.theme ?? "base"),
      style: data.style ? String(data.style) : undefined,
      accent: data.accent ? String(data.accent) : undefined,
      aliases: Array.isArray(data.aliases) ? data.aliases.map(normalizePath) : [],
      pinned: data.pinned === true,
      description: data.description ? String(data.description) : describe(html),
      html,
      wpId: typeof data.wpId === "number" ? data.wpId : undefined,
    });
  }
  return docs;
}

export function load(): Content {
  if (cache && !import.meta.env?.DEV) return cache;
  const categories: Category[] = JSON.parse(readFileSync(join(ROOT, "content/categories.json"), "utf8"));
  const docs = [...readDocs("posts", "post", categories), ...readDocs("pages", "page", categories)];
  const seen = new Map<string, string>();
  for (const d of docs) {
    for (const p of [d.path, ...d.aliases]) {
      if (seen.has(p)) throw new Error(`path ${p} is used by both ${seen.get(p)} and ${d.id}`);
      seen.set(p, d.id);
    }
  }
  cache = { categories, docs };
  return cache;
}

export function getCategories(): Category[] {
  return load().categories;
}

export function getCategory(id: string | undefined): Category | undefined {
  return load().categories.find((c) => c.id === id);
}

export function categoryPath(c: Category, lang: Lang): string {
  return `/${c.slug[lang]}/`;
}

export function toSummary(d: Doc): Summary {
  return { id: d.id, title: d.title, date: d.date, lang: d.lang, category: d.category, path: d.path, pinned: d.pinned, translationKey: d.translationKey, description: d.description };
}

/** Listing order: pinned posts first, then newest first. */
export function forListing(posts: Doc[]): Summary[] {
  return [...posts].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date)).map(toSummary);
}

/** Published posts, newest first. */
export function getPosts(): Doc[] {
  return load()
    .docs.filter((d) => d.kind === "post")
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPages(): Doc[] {
  return load().docs.filter((d) => d.kind === "page");
}

export function translationsOf(d: Doc): Translation[] {
  if (!d.translationKey) return [];
  return load()
    .docs.filter((o) => o.translationKey === d.translationKey && o.id !== d.id)
    .map((o) => ({ lang: o.lang, title: o.title, path: o.path }));
}

export type Resolved =
  | { kind: "doc"; doc: Doc; translations: Translation[] }
  | { kind: "category"; category: Category; lang: Lang; posts: Summary[] }
  | null;

/** Map a URL path to what lives there: a post, a page or a category index in one language. */
export function resolve(rawPath: string): Resolved {
  const path = normalizePath(decodeURIComponent(rawPath));
  const { categories, docs } = load();
  const doc = docs.find((d) => d.path === path);
  if (doc) return { kind: "doc", doc, translations: translationsOf(doc) };
  for (const category of categories) {
    for (const lang of ["it", "en"] as Lang[]) {
      if (categoryPath(category, lang) === path) {
        const posts = forListing(getPosts().filter((p) => p.category === category.id));
        return { kind: "category", category, lang, posts };
      }
    }
  }
  return null;
}

/** Every URL the build writes as an HTML file, plus the feed. */
export function prerenderPaths(): string[] {
  const paths = new Set<string>(["/", "/feed.xml"]);
  for (const c of getCategories()) for (const lang of ["it", "en"] as Lang[]) paths.add(categoryPath(c, lang));
  for (const d of load().docs) paths.add(d.path);
  return [...paths];
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** RSS 2.0 feed with the full content of every post, newest first. */
export function buildFeed(): string {
  const posts = getPosts();
  const items = posts
    .map((p) => {
      const url = SITE_URL + p.path;
      const cat = getCategory(p.category);
      const html = p.html.replace(/(src|href)="\//g, `$1="${SITE_URL}/`);
      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <dc:creator>${escapeXml(AUTHOR)}</dc:creator>
      <dc:language>${p.lang}</dc:language>
      ${cat ? `<category>${escapeXml(cat.name[p.lang])}</category>` : ""}
      <description>${escapeXml(p.description)}</description>
      <content:encoded><![CDATA[${html}]]></content:encoded>
    </item>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME}</title>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <link>${SITE_URL}/</link>
    <description>${escapeXml(AUTHOR)}</description>
    <language>it</language>
    <lastBuildDate>${new Date(posts[0]?.date ?? Date.now()).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
}
