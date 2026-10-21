export type Lang = "it" | "en";

export const LANGS: Lang[] = ["it", "en"];

const strings = {
  it: {
    siteName: "castignoli.it",
    author: "Marco Castignoli",
    home: "Home",
    feed: "Feed RSS",
    filterLabel: "Lingua",
    all: "Tutti",
    languageName: { it: "italiano", en: "inglese" } as Record<Lang, string>,
    languageMark: { it: "IT", en: "EN" } as Record<Lang, string>,
    alsoIn: "Questo articolo è disponibile anche in",
    postsIn: "Articoli in",
    updated: "aggiornato il",
    notFound: "Pagina non trovata",
    notFoundBody: "Questa pagina non esiste. Forse è stata spostata.",
    backHome: "Torna alla home",
    writtenBy: "Scritto da",
    source: "Codice sorgente",
    noPosts: "Nessun articolo.",
    back: "Indietro",
    pinned: "In evidenza",
    categoryFilterLabel: "Categoria",
    allCategories: "Tutte",
  },
  en: {
    siteName: "castignoli.it",
    author: "Marco Castignoli",
    home: "Home",
    feed: "RSS feed",
    filterLabel: "Language",
    all: "All",
    languageName: { it: "Italian", en: "English" } as Record<Lang, string>,
    languageMark: { it: "IT", en: "EN" } as Record<Lang, string>,
    alsoIn: "This article is also available in",
    postsIn: "Posts in",
    updated: "updated on",
    notFound: "Page not found",
    notFoundBody: "This page does not exist. It may have moved.",
    backHome: "Back to the home page",
    writtenBy: "Written by",
    source: "Source code",
    noPosts: "No posts.",
    back: "Back",
    pinned: "Pinned",
    categoryFilterLabel: "Category",
    allCategories: "All",
  },
};

export type Strings = (typeof strings)["it"];

export function t(lang: Lang): Strings {
  return strings[lang] ?? strings.it;
}

export function formatDate(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "it" ? "it-IT" : "en-GB", {
    dateStyle: "long",
    timeZone: "Europe/Rome",
  }).format(new Date(iso));
}
