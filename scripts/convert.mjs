// Convert the WordPress export (export/wp-json/*.json) into Markdown posts and pages
// under content/, with front matter. Run once after scripts/export.mjs; re-running
// overwrites the generated files, so edit the export rules here, not the output.
// Usage: node scripts/convert.mjs
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { join } from "node:path";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const ROOT = new URL("..", import.meta.url).pathname;
const SITE = "https://www.castignoli.it";

const posts = JSON.parse(await readFile(join(ROOT, "export/wp-json/posts.json"), "utf8"));
const pages = JSON.parse(await readFile(join(ROOT, "export/wp-json/pages.json"), "utf8"));
const wpCategories = JSON.parse(await readFile(join(ROOT, "export/wp-json/categories.json"), "utf8"));
const categories = JSON.parse(await readFile(join(ROOT, "content/categories.json"), "utf8"));

// WordPress category slug -> category concept id
const conceptByWpSlug = new Map();
for (const c of categories) for (const wp of c.wordpress) conceptByWpSlug.set(wp, c.id);
const wpCategoryById = new Map(wpCategories.map((c) => [c.id, c]));

// Posts whose language the stopword heuristic cannot see (no text, only embeds).
const LANG_OVERRIDES = { 253: "it" };

// Bilingual posts: WordPress "page 2" holds the English text. They become two posts
// that share a translationKey. The English copy gets a new path; the old /2/ URL becomes an alias.
const SPLIT = {
  124: { key: "dialoghi-con-moad-haid", enTitle: "Dialogues with Moad Haid", enPath: "/short-stories/dialogues-with-moad-haid/" },
  113: { key: "hairesis", enTitle: "Haíresis", enPath: "/philosophising/hairesis/" },
};

const IT = new Set("il la di che e un una per non con sono del della le gli nel alla dei è ho mi ci più anche come".split(" "));
const EN = new Set("the of and to in is that it for with as are this was be on you have not by at from or an".split(" "));
function detectLang(html) {
  const words = decodeEntities(html.replace(/<[^>]+>/g, " ")).toLowerCase().match(/[a-zàèéìòù']+/g) || [];
  let it = 0, en = 0;
  for (const w of words) { if (IT.has(w)) it++; if (EN.has(w)) en++; }
  return en > it ? "en" : "it";
}

const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", ndash: "–", mdash: "—", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”" };
function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED[n] ?? m);
}

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

// Media URLs: same host -> root-relative, and sized variants (-1024x429) -> the original file when we have it.
async function localMediaUrl(raw, baseUrl) {
  let u;
  try { u = new URL(raw.replace(/&#038;|&amp;/g, "&"), baseUrl); } catch { return raw; }
  if (!/castignoli\.it$/.test(u.hostname)) return u.href;
  let path = decodeURIComponent(u.pathname);
  // Legacy relative references from the 2015-2017 posts, e.g. img/lago.jpg -> /img/lago.jpg
  if (/^\/[^/]+\/[^/]+\/img\//.test(path)) path = path.replace(/^\/[^/]+\/[^/]+\/img\//, "/img/");
  const m = path.match(/^(.*)-\d+x\d+(\.[a-z0-9]+)$/i);
  if (m && (await exists(join(ROOT, "public", m[1] + m[2])))) path = m[1] + m[2];
  return path;
}

function cleanAttr(el, name) {
  const v = el.getAttribute(name);
  return v ? decodeEntities(v).replace(/"/g, "&quot;") : null;
}

function makeTurndown(baseUrl, mediaMap) {
  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "*",
    br: "\\",
  });
  td.use(gfm);
  td.remove(["script", "style"]);

  // <img>: root-relative URL, no size attributes (width/height/srcset/style are presentation).
  td.addRule("image", {
    filter: "img",
    replacement: (_c, node) => {
      const src = mediaMap.get(node.getAttribute("src")) ?? node.getAttribute("src");
      const alt = decodeEntities(node.getAttribute("alt") || "").replace(/[\[\]]/g, "");
      return `![${alt}](${src})`;
    },
  });
  // <figure class="wp-block-image"><img><figcaption> -> image + italic caption line
  td.addRule("figureImage", {
    filter: (node) => node.nodeName === "FIGURE" && node.querySelector("img"),
    replacement: (_c, node) => {
      const img = node.querySelector("img");
      const src = mediaMap.get(img.getAttribute("src")) ?? img.getAttribute("src");
      const alt = decodeEntities(img.getAttribute("alt") || "").replace(/[\[\]]/g, "");
      const cap = node.querySelector("figcaption");
      const caption = cap ? `\n*${td.turndown(cap.innerHTML).trim()}*` : "";
      return `\n\n![${alt}](${src})${caption}\n\n`;
    },
  });
  // Embeds (Spotify etc.): keep a clean <iframe>.
  td.addRule("iframe", {
    filter: (node) => node.nodeName === "IFRAME" || (node.nodeName === "FIGURE" && node.querySelector("iframe")),
    replacement: (_c, node) => {
      const f = node.nodeName === "IFRAME" ? node : node.querySelector("iframe");
      const attrs = ["title", "src", "width", "height", "allow", "loading"]
        .map((a) => [a, cleanAttr(f, a)])
        .filter(([, v]) => v)
        .map(([a, v]) => `${a}="${v}"`);
      if (f.hasAttribute("allowfullscreen")) attrs.push("allowfullscreen");
      return `\n\n<iframe ${attrs.join(" ")}></iframe>\n\n`;
    },
  });
  // Videos: keep a clean <video>.
  td.addRule("video", {
    filter: (node) => node.nodeName === "VIDEO" || (node.nodeName === "FIGURE" && node.querySelector("video")),
    replacement: (_c, node) => {
      const v = node.nodeName === "VIDEO" ? node : node.querySelector("video");
      const src = mediaMap.get(v.getAttribute("src")) ?? v.getAttribute("src");
      const w = v.getAttribute("width"), h = v.getAttribute("height");
      const size = w && h ? ` width="${w}" height="${h}"` : "";
      return `\n\n<video controls playsinline preload="metadata" src="${src}"${size}></video>\n\n`;
    },
  });
  // Aligned paragraphs (datelines in the stories) keep their alignment as a small HTML block.
  td.addRule("alignedParagraph", {
    filter: (node) => node.nodeName === "P" && /has-text-align-(right|center)/.test(node.className),
    replacement: (_c, node) => {
      const align = node.className.match(/has-text-align-(right|center)/)[1];
      const inner = node.innerHTML.replace(/\s+class="[^"]*"/g, "").trim();
      return `\n\n<p class="align-${align}">${inner}</p>\n\n`;
    },
  });
  td.addRule("separator", { filter: "hr", replacement: () => "\n\n---\n\n" });
  return td;
}

async function buildMediaMap(html, baseUrl) {
  const map = new Map();
  for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const raw = m[1];
    if (!/\.(jpe?g|png|gif|webp|svg|mp4|webm|mp3|m4a|ogg|pdf)(\?|$)/i.test(raw)) continue;
    map.set(raw, await localMediaUrl(raw, baseUrl));
  }
  return map;
}

function tidyMarkdown(md) {
  return md
    .replace(/\r/g, "")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim() + "\n";
}

function yamlString(s) {
  return JSON.stringify(s);
}

function frontMatter(obj) {
  const lines = ["---"];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      if (v.length === 0) continue;
      lines.push(`${k}:`);
      for (const x of v) lines.push(`  - ${yamlString(x)}`);
    } else if (typeof v === "number" || typeof v === "boolean") {
      lines.push(`${k}: ${v}`);
    } else {
      lines.push(`${k}: ${yamlString(v)}`);
    }
  }
  lines.push("---");
  return lines.join("\n");
}

async function convertHtml(html, baseUrl) {
  const mediaMap = await buildMediaMap(html, baseUrl);
  const td = makeTurndown(baseUrl, mediaMap);
  return tidyMarkdown(td.turndown(html));
}

function slugOf(path) {
  return path.replace(/\/+$/, "").split("/").pop();
}

const report = [];
const missingMedia = new Set();

async function writePost(meta, markdown) {
  const date = meta.date.slice(0, 10);
  const file = join(ROOT, "content/posts", `${date}-${slugOf(meta.path)}${meta.lang === "en" && meta.translationKey ? "" : ""}.md`);
  await writeFile(file, `${frontMatter(meta)}\n\n${markdown}`);
  report.push(`${meta.lang} ${meta.category.padEnd(18)} ${meta.path}`);
  for (const m of markdown.matchAll(/\]\((\/[^)]+)\)|src="(\/[^"]+)"/g)) {
    const p = m[1] ?? m[2];
    if (!(await exists(join(ROOT, "public", p)))) missingMedia.add(`${meta.path} -> ${p}`);
  }
  return file;
}

await mkdir(join(ROOT, "content/posts"), { recursive: true });
await mkdir(join(ROOT, "content/pages"), { recursive: true });

for (const p of posts.sort((a, b) => a.date.localeCompare(b.date))) {
  const title = decodeEntities(p.title.rendered);
  const path = new URL(p.link).pathname;
  const wpSlugs = p.categories.map((id) => wpCategoryById.get(id)?.slug).filter(Boolean);
  const concept = wpSlugs.map((s) => conceptByWpSlug.get(s)).find((c) => c && c !== conceptByWpSlug.get("uncategorised"))
    ?? wpSlugs.map((s) => conceptByWpSlug.get(s)).find(Boolean);
  if (!concept) throw new Error(`no category concept for post ${p.id} (${wpSlugs})`);
  const category = categories.find((c) => c.id === concept);
  const date = p.date_gmt + "Z";
  const modified = p.modified_gmt + "Z";
  let html = p.content.rendered;
  const aliases = [];
  if (path.startsWith("/uncategorised/")) aliases.push(`/${category.slug.it}/${slugOf(path)}/`);

  const split = SPLIT[p.id];
  if (split) {
    const [itHtml, enHtml] = html.split("<!--nextpage-->");
    const itClean = itHtml.replace(/^\s*<p[^>]*><em>For the english version[^<]*<\/em><\/p>\s*<hr[^>]*\/?>/i, "");
    const itMeta = { title, date, modified, lang: "it", category: concept, path, translationKey: split.key, wpId: p.id, aliases };
    await writePost(itMeta, await convertHtml(itClean, p.link));
    const enMeta = {
      title: split.enTitle, date, modified, lang: "en", category: concept, path: split.enPath, translationKey: split.key, wpId: p.id,
      aliases: [`${path}2/`],
    };
    await writePost(enMeta, await convertHtml(enHtml, p.link));
    continue;
  }

  const lang = LANG_OVERRIDES[p.id] ?? detectLang(html);
  const meta = { title, date, modified, lang, category: concept, path, wpId: p.id, aliases };
  await writePost(meta, await convertHtml(html, p.link));
}

for (const p of pages) {
  const path = new URL(p.link).pathname;
  if (path.startsWith("/events/")) continue; // booking plugin pages, dropped
  const title = decodeEntities(p.title.rendered);
  const meta = { title, date: p.date_gmt + "Z", modified: p.modified_gmt + "Z", lang: detectLang(p.content.rendered), path, wpId: p.id };
  const md = await convertHtml(p.content.rendered, p.link);
  await writeFile(join(ROOT, "content/pages", `${slugOf(path)}.md`), `${frontMatter(meta)}\n\n${md}`);
  report.push(`${meta.lang} page               ${path}`);
}

console.log(report.join("\n"));
console.log(`\n${report.length} documents written`);
if (missingMedia.size) {
  console.log(`\nreferenced files that do not exist under public/ (${missingMedia.size}):`);
  for (const m of [...missingMedia].sort()) console.log("  " + m);
}
