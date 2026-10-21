# castignoli.it

Marco Castignoli's personal blog: Markdown content in `content/`, a React Router 8 app in `app/` that the build prerenders to one HTML file per page, published on GitHub Pages at https://www.castignoli.it by a GitHub Actions workflow on every push to `main`. No server, no database.

## Layout

- `content/categories.json`: the category concepts. Each has an `id`, a `slug` and a `name` per language (`it`, `en`), an `accent` colour and a default `theme`.
- `content/posts/YYYY-MM-DD-slug.md`: one file per article, front matter plus Markdown. Raw HTML is allowed in the body (embeds, videos).
- `content/pages/slug.md`: standalone pages (for example `poesie.md`). A page has no category and is listed on the home only when pinned.
- `public/`: files served as they are. `public/CNAME` names the domain. Media lives under `public/wp-content/uploads/<year>/<month>/`; keep that path, article bodies link to it.
- `app/root.tsx`: the layout. Header with the site name and one right-hand slot (language selector on listings, back link on articles), footer, `<html lang>`, error boundary (404).
- `app/routes.ts`: three routes: `/` (home), `/feed.xml` (resource route), `*` (`routes/document.tsx`, which resolves a path to a post, a page or a category index from the content).
- `app/content.server.ts`: the build-time content model (Node only, never in the browser): reads the content, renders Markdown with `marked`, resolves paths, lists the prerender paths, builds the RSS feed.
- `app/site.ts`: client-safe constants and types. `app/i18n.ts`: every interface string in both languages plus date formatting. `app/lang-context.ts`: the language highlight shared by layout and routes.
- `app/components/PostList.tsx`: the listing, with the pin icon and the language rules below.
- `app/styles/base.css`: the shared style. `app/styles/themes.css`: the per-article themes.
- `scripts/postbuild.mjs`: after `react-router build`, writes `feed/index.html`, the redirect pages for `aliases` and old category URLs, `404.html` and `.nojekyll`.
- `scripts/serve-build.mjs`: serves `build/client/` like GitHub Pages does (`pnpm preview`).
- `scripts/export.mjs` and `scripts/convert.mjs`, `export/`: the one-time import of the existing articles and its backup. Not part of the build; do not edit `export/`.
- `build/`: the generated site (ignored by git). `.react-router/`: generated types (ignored).

## Publishing a post

1. Create `content/posts/YYYY-MM-DD-slug.md` with this front matter and the Markdown body below it:

   ```markdown
   ---
   title: "Titolo"
   date: "2026-10-21T10:00:00Z"
   lang: "it"
   category: "tecnologia"
   ---
   ```

   The URL becomes `/<category slug in lang>/slug/` (`/tecnologia/slug/` for Italian, `/technology/slug/` for English). Set `path` only to force another URL. Add `pinned: true`, `theme`, `translationKey` or `style` when wanted (see the table below).
2. Put images and videos under `public/wp-content/uploads/YYYY/MM/` and link them root-relative: `![alt](/wp-content/uploads/2026/10/photo.jpg)`. A `<video controls src="...">` or an `<iframe>` embed can be written as raw HTML in the body.
3. Check it with `pnpm dev` (http://localhost:5173/) or `pnpm build && pnpm preview`. The build fails on a duplicate path.
4. Commit on a branch, push, open a pull request, merge. The workflow deploys `main` within about a minute; the site is at https://www.castignoli.it.

A translation is a second file with the other `lang`, its own `title` and the same `translationKey`; both posts then link to each other and the listings show one of them when a language is highlighted. A standalone page goes in `content/pages/` and appears on the home only when pinned.

## Front matter

| Field | Meaning |
|---|---|
| `title` | Shown as is. |
| `date` | ISO 8601, UTC. Listings sort by it. |
| `modified` | Optional. Shown on the article when the day differs from `date`. |
| `lang` | `it` or `en`. Sets `<html lang>`, the interface language of the article page, the date format and the category name and slug used on that page. |
| `category` | A category `id` from `categories.json`. Required for posts. |
| `path` | The permalink, with leading and trailing slash. Defaults to `/<category slug in lang>/<file slug>/`. Never change the path of a published post. |
| `aliases` | Other paths that must lead here; each becomes a small redirect page. Use it when a URL moves. |
| `translationKey` | Posts sharing a key are translations of each other. Each shows a line at the top linking to the other, and the head gets `hreflang` alternates. |
| `pinned` | `true` lists the document first on the home (and in its category index). |
| `theme` | A ready theme: `tech`, `ideas`, `travel-diary`, `short-story`, `philosophy`, `podcast`, `base`. Defaults to the category's theme. |
| `style` | Free CSS for this article only, nested under its body (`.post-body { ... }`). |
| `accent` | Colour override for this article (`--accent`). |
| `description` | Optional meta description. Defaults to the first 160 characters of the body. |

The file name is free; the date prefix only keeps the folder sorted. The build fails if two documents share a path or an alias.

## How listings behave

- Pinned documents first, then newest first.
- The header selector on the home and category pages has Tutti/All (default), Italiano and English. The choice is remembered by the browser. With a language chosen, posts in the other language are dimmed, a translated article appears once in the chosen language, and a pinned translation group keeps its place with that version. With Tutti/All every document is listed.
- The home interface follows the chosen language, or the browser language when Tutti/All is selected. Category pages take their language from the slug used (`/tecnologia/` is Italian, `/technology/` is English). Article pages use the article's language. Category names, labels and dates always follow the language of the page.
- The home also has a category filter (chips), which hides the other categories.

## Themes

A theme only touches the article (`.post[data-theme="..."]`); header, navigation and footer are the shared base. Light and dark follow the system; every theme must work in both. One accent colour per category, set inline as `--accent`. Add a theme in `app/styles/themes.css` and give it a name in the `theme` row above. The short-story drop cap skips a leading aligned paragraph (`<p class="align-right">`, used for datelines).

## Commands

```sh
pnpm install
pnpm dev          # http://localhost:5173/ with hot reload
pnpm build        # react-router build + postbuild, output in build/client/
pnpm preview      # serve build/client/ like GitHub Pages, http://localhost:4173/
pnpm typecheck    # react-router typegen + tsc
```

The dev server renders loaders in Node; the production build runs every loader once at build time, so the content model must stay in `content.server.ts` and route modules may import it only for `loader`.

## Deploy and domain

`.github/workflows/deploy.yml` builds on every push to `main` and publishes `build/client` with `actions/deploy-pages`. The Pages source is GitHub Actions and the custom domain `www.castignoli.it` is set in the repository settings. The DNS records live at one.com and are listed in `DNS.md`; never change DNS from here. `/feed.xml` is the feed; `/feed/` serves the same XML as HTML because Pages cannot set its content type.

## Rules

- Work on a branch and open a pull request; never push to `main` directly.
- Keep URLs stable: never change a published `path`; add `aliases` when something moves.
- Before writing custom code, look for an existing tool or library and say what you found. Check the latest version of a package before pinning it.
- Markdown prose is one paragraph per line, never hard-wrapped.
- Reply in English.
