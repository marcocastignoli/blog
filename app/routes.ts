import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("feed.xml", "routes/feed.ts"),
  // Posts, pages and category indexes all resolve from content/ by their stored path.
  route("*", "routes/document.tsx"),
] satisfies RouteConfig;
