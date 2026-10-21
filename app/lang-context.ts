// Shared between the layout (root.tsx) and the routes. Kept out of the route modules on purpose:
// React Router splits route modules, so a context created inside one can exist twice in dev.
import { createContext, useContext } from "react";
import type { Lang } from "./i18n";
import type { Category } from "./site";

/** "all" means no language highlighted. */
export type LangFilter = "all" | Lang;

export const LANG_FILTER_STORAGE_KEY = "castignoli-lang-filter";

/** What every route's loader tells the layout about the page. */
export interface PageInfo {
  kind: "home" | "category" | "doc";
  lang: Lang;
  category?: Category;
}

export const LangContext = createContext<{ lang: Lang; filter: LangFilter; setFilter: (f: LangFilter) => void }>({
  lang: "it",
  filter: "all",
  setFilter: () => {},
});

export const useLang = () => useContext(LangContext);
