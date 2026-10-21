// Client-safe site constants and content types (no Node imports).
import type { Lang } from "./i18n";

export const SITE_URL = "https://www.castignoli.it";
export const SITE_NAME = "castignoli.it";
export const AUTHOR = "Marco Castignoli";

export interface Category {
  id: string;
  slug: Record<Lang, string>;
  name: Record<Lang, string>;
  wordpress: string[];
  accent: string;
  theme: string;
}

export interface Doc {
  kind: "post" | "page";
  /** file name without extension, e.g. 2026-10-06-my-own-personal-whim */
  id: string;
  title: string;
  date: string;
  modified?: string;
  lang: Lang;
  category?: string;
  path: string;
  translationKey?: string;
  /** name of a ready theme (defaults to the category theme) */
  theme: string;
  /** free CSS for this article only, nested under its body */
  style?: string;
  /** accent colour override */
  accent?: string;
  aliases: string[];
  /** pinned posts come first in every listing */
  pinned: boolean;
  description: string;
  html: string;
  wpId?: number;
}

/** What a listing needs: no body. */
export interface Summary {
  id: string;
  title: string;
  date: string;
  lang: Lang;
  category?: string;
  path: string;
  pinned: boolean;
  translationKey?: string;
  description: string;
}

export interface Translation {
  lang: Lang;
  title: string;
  path: string;
}
