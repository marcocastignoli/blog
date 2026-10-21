import { buildFeed } from "../content.server";

// Resource route: the build writes its response to build/client/feed.xml.
export function loader() {
  return new Response(buildFeed(), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
