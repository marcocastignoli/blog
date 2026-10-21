// Serve build/client the way GitHub Pages does: directory index.html, 404.html for unknown paths,
// and a redirect from /path to /path/ when a directory exists. Usage: node scripts/serve-build.mjs [port]
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const ROOT = join(new URL("..", import.meta.url).pathname, "build/client");
const PORT = Number(process.argv[2] || 4173);
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json",
  ".xml": "application/xml", ".data": "text/x-script", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".txt": "text/plain",
};

async function fileOrNull(p) {
  try { const s = await stat(p); return s.isFile() ? s : null; } catch { return null; }
}

createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  let file = join(ROOT, path);
  let status = 200;
  if (path.endsWith("/")) file = join(file, "index.html");
  let s = await fileOrNull(file);
  if (!s && !path.endsWith("/") && (await fileOrNull(join(ROOT, path, "index.html")))) {
    res.writeHead(301, { Location: path + "/" + url.search });
    return res.end();
  }
  if (!s) {
    file = join(ROOT, "404.html");
    s = await fileOrNull(file);
    status = 404;
  }
  if (!s) {
    res.writeHead(404);
    return res.end("not found");
  }
  res.writeHead(status, { "Content-Type": TYPES[extname(file)] || "application/octet-stream", "Content-Length": s.size });
  createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`build/client on http://localhost:${PORT}/`));
