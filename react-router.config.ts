import type { Config } from "@react-router/dev/config";
import { prerenderPaths } from "./app/content.server";

// Static site: no runtime server. Every route is rendered to HTML at build time
// (one <path>/index.html per article, page, category and the home) and served by GitHub Pages.
export default {
  ssr: false,
  prerender: () => prerenderPaths(),
} satisfies Config;
