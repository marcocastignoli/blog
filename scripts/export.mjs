// Export the WordPress site through its public REST API into export/ (JSON backup)
// and download every media file into public/wp-content/uploads/ (same paths as WordPress).
// Usage: node scripts/export.mjs
import { mkdir, writeFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";

const SITE = "https://www.castignoli.it";
const API = `${SITE}/wp-json/wp/v2`;
const ROOT = new URL("..", import.meta.url).pathname;
const EXPORT_DIR = join(ROOT, "export");
const UPLOADS_DIR = join(ROOT, "public");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchAll(endpoint, params = "") {
  const items = [];
  let page = 1;
  let totalPages = 1;
  do {
    const url = `${API}/${endpoint}?per_page=100&page=${page}${params}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} -> ${res.status}`);
    totalPages = Number(res.headers.get("x-wp-totalpages") || 1);
    items.push(...(await res.json()));
    page++;
  } while (page <= totalPages);
  return items;
}

async function saveJson(name, data) {
  const file = join(EXPORT_DIR, "wp-json", `${name}.json`);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2));
  console.log(`saved ${name}: ${Array.isArray(data) ? data.length + " items" : "object"}`);
}

async function saveText(name, text) {
  const file = join(EXPORT_DIR, name);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, text);
  console.log(`saved ${name}: ${text.length} chars`);
}

// Collect every URL of a file that lives on the WordPress host (uploads, legacy /content/, img/).
function collectFileUrls(html, baseUrl) {
  const urls = new Set();
  const attr = /(?:src|href|poster)="([^"]+)"/g;
  for (const m of html.matchAll(attr)) {
    const raw = m[1].replace(/&#038;|&amp;/g, "&");
    let u;
    try {
      u = new URL(raw, baseUrl);
    } catch {
      continue;
    }
    if (!/castignoli\.it$/.test(u.hostname)) continue;
    if (!/\.(jpe?g|png|gif|webp|svg|mp4|webm|mp3|m4a|ogg|pdf)$/i.test(u.pathname)) continue;
    urls.add(u.href);
  }
  for (const m of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const part of m[1].split(",")) {
      const src = part.trim().split(/\s+/)[0];
      try {
        const u = new URL(src, baseUrl);
        if (/castignoli\.it$/.test(u.hostname)) urls.add(u.href);
      } catch {}
    }
  }
  return urls;
}

async function download(url, manifest) {
  const u = new URL(url);
  const local = join(UPLOADS_DIR, decodeURIComponent(u.pathname));
  const entry = { url, local: local.replace(ROOT, ""), status: null, bytes: 0 };
  manifest.push(entry);
  try {
    const s = await stat(local);
    if (s.size > 0) {
      entry.status = "cached";
      entry.bytes = s.size;
      return;
    }
  } catch {}
  // one.com rate-limits bursts with 429: pace the downloads and back off when it happens.
  let res;
  for (let attempt = 0; attempt < 6; attempt++) {
    await sleep(attempt === 0 ? 1500 : 5000 * 2 ** (attempt - 1));
    res = await fetch(url);
    if (res.status !== 429) break;
    console.warn(`  429 on ${u.pathname}, retrying`);
  }
  entry.status = res.status;
  if (!res.ok) {
    console.warn(`  MISSING ${res.status} ${url}`);
    return;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(local), { recursive: true });
  await writeFile(local, buf);
  entry.bytes = buf.length;
  console.log(`  ${buf.length} bytes ${u.pathname}`);
}

async function main() {
  await mkdir(EXPORT_DIR, { recursive: true });

  const siteRes = await fetch(`${SITE}/wp-json/`);
  const site = await siteRes.json();
  await saveJson("site", {
    name: site.name,
    description: site.description,
    url: site.url,
    home: site.home,
    timezone_string: site.timezone_string,
    gmt_offset: site.gmt_offset,
    exported_at: new Date().toISOString(),
  });

  const posts = await fetchAll("posts", "&_embed&status=publish");
  await saveJson("posts", posts);
  const pages = await fetchAll("pages", "&_embed");
  await saveJson("pages", pages);
  await saveJson("categories", await fetchAll("categories"));
  await saveJson("tags", await fetchAll("tags"));
  const media = await fetchAll("media");
  await saveJson("media", media);
  await saveJson("users", await fetchAll("users"));

  const feed = await (await fetch(`${SITE}/feed/`)).text();
  await saveText("feed.xml", feed);
  const home = await (await fetch(`${SITE}/`)).text();
  await saveText("home.html", home);

  // Media: every library item plus every file referenced from post and page HTML.
  const urls = new Set();
  for (const m of media) {
    if (m.source_url) urls.add(m.source_url);
    const sizes = m.media_details?.sizes || {};
    for (const s of Object.values(sizes)) if (s.source_url) urls.add(s.source_url);
  }
  for (const p of [...posts, ...pages]) {
    for (const u of collectFileUrls(p.content.rendered, p.link)) urls.add(u);
  }
  console.log(`downloading ${urls.size} files`);
  const manifest = [];
  for (const url of [...urls].sort()) await download(url, manifest);
  await saveJson("media-manifest", manifest);
  const missing = manifest.filter((m) => m.status !== 200 && m.status !== "cached");
  console.log(`done: ${manifest.length} files, ${missing.length} missing`);
  for (const m of missing) console.log(`  missing ${m.status} ${m.url}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
