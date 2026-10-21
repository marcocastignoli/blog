# castignoli.it

Marco Castignoli's blog, moved from WordPress to a static site on GitHub Pages. The articles are Markdown files in this repository; the build renders each one to its own HTML page.

## How it works

- `content/posts/*.md`: one file per article, with front matter (`title`, `date`, `lang`, `category`, `path`, optional `translationKey`, `theme`, `style`, `accent`, `aliases`). The body is Markdown; raw HTML (embeds, videos) is allowed.
- `content/pages/*.md`: standalone pages (`/poesie/`).
- `content/categories.json`: the category concepts. Each has a slug and a name per language, an accent colour and a default theme.
- `public/`: static files served as they are, including the WordPress media under `public/wp-content/uploads/` (same URLs as before) and the `CNAME` file.
- `app/`: the site. React Router 8 in framework mode with `ssr: false` and `prerender`, so the build writes `<path>/index.html` for every post, page and category, plus `feed.xml`. React hydrates the page for client-side navigation; the HTML works without JavaScript.
- `scripts/export.mjs` and `scripts/convert.mjs`: the one-time export from the WordPress REST API (backup in `export/`) and the HTML-to-Markdown conversion.
- `scripts/postbuild.mjs`: writes `feed/index.html`, the redirect stubs for aliases and old category URLs, `404.html` and `.nojekyll`.

## Writing a post

Create `content/posts/YYYY-MM-DD-slug.md`:

```markdown
---
title: "Titolo"
date: "2026-10-21T10:00:00Z"
lang: "it"
category: "tecnologia"
# path defaults to /<category slug in lang>/<slug>/, e.g. /tecnologia/slug/
# translationKey: "shared-key"   # posts with the same key are translations of each other
# theme: "tech"                   # tech, ideas, travel-diary, short-story, philosophy, podcast, base
# accent: "#1f6feb"
# style: "p { font-family: var(--font-mono); }"   # free CSS, scoped to this article's body
---

Testo in Markdown.
```

Posts exported from WordPress carry their original `path`, so their URLs do not change. New posts get the default path from the category slug in their language.

## Commands

```sh
pnpm install
pnpm dev        # dev server with hot reload, http://localhost:5173/
pnpm build      # static site in build/client/
pnpm preview    # serve build/client like GitHub Pages, http://localhost:4173/
pnpm typecheck
```

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`, which builds the site and publishes `build/client` with `actions/deploy-pages`. The DNS records to point the domain at GitHub Pages are listed in `DNS.md`.
