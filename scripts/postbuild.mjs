// Finish the static build in build/client for GitHub Pages:
// - /feed/ keeps serving the RSS feed (as feed/index.html, the only file Pages serves for /feed/)
// - every alias path of a post gets a small HTML page that redirects to the post
// - old WordPress category URLs (/category/<slug>/) redirect to the category index
// - 404.html is the SPA fallback that React Router wrote; .nojekyll keeps Pages from running Jekyll
import { copyFile, mkdir, readFile, readdir, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";

const ROOT = new URL("..", import.meta.url).pathname;
const OUT = join(ROOT, "build/client");
const SITE_URL = "https://www.castignoli.it";

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

function redirectPage(to, title) {
  const abs = SITE_URL + to;
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<title>${title}</title>
<meta http-equiv="refresh" content="0; url=${to}">
<link rel="canonical" href="${abs}">
<meta name="robots" content="noindex">
<script>location.replace(${JSON.stringify(to)})</script>
</head>
<body><p><a href="${to}">${abs}</a></p></body>
</html>
`;
}

async function writeRedirect(from, to, title) {
  const dir = join(OUT, from);
  if (await exists(join(dir, "index.html"))) {
    console.warn(`postbuild: ${from} already exists, redirect skipped`);
    return;
  }
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "index.html"), redirectPage(to, title));
  console.log(`postbuild: ${from} -> ${to}`);
}

async function main() {
  if (!(await exists(OUT))) throw new Error("build/client is missing; run react-router build first");

  // /feed/ (the WordPress feed URL)
  const feed = join(OUT, "feed.xml");
  if (await exists(feed)) {
    await mkdir(join(OUT, "feed"), { recursive: true });
    await copyFile(feed, join(OUT, "feed/index.html"));
    console.log("postbuild: feed/index.html");
  } else {
    console.warn("postbuild: feed.xml not found");
  }

  // Aliases from post and page front matter.
  for (const dir of ["content/posts", "content/pages"]) {
    for (const file of await readdir(join(ROOT, dir))) {
      if (!file.endsWith(".md")) continue;
      const { data } = matter(await readFile(join(ROOT, dir, file), "utf8"));
      for (const alias of data.aliases ?? []) await writeRedirect(alias, data.path, data.title ?? file);
    }
  }

  // Old category archives: /category/<wordpress slug>/ -> /<slug in that language>/
  const categories = JSON.parse(await readFile(join(ROOT, "content/categories.json"), "utf8"));
  for (const c of categories) {
    for (const wp of c.wordpress) {
      const lang = wp === c.slug.en ? "en" : "it";
      await writeRedirect(`/category/${wp}/`, `/${c.slug[lang]}/`, c.name[lang]);
    }
  }
  await writeRedirect("/author/admin/", "/", "castignoli.it");

  // GitHub Pages serves 404.html for unknown paths; React Router's fallback renders the 404 page.
  const fallback = join(OUT, "__spa-fallback.html");
  if (await exists(fallback)) {
    await copyFile(fallback, join(OUT, "404.html"));
    console.log("postbuild: 404.html");
  }
  await writeFile(join(OUT, ".nojekyll"), "");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
