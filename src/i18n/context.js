import { createContext, useContext } from "react";
import { serviceSlugs } from "../data/services";

export const LanguageContext = createContext(null);

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useServices() {
  const { t } = useLanguage();
  return serviceSlugs.map((slug) => ({ slug, ...t.pillars[slug] }));
}

// Content from src/data (or a CMS later) may be a plain string or { en, fr, rw }.
export function localize(value, lang) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value[lang] ?? value.en ?? "";
  return value ?? "";
}

export function formatDate(iso, lang) {
  if (!iso) return "";
  const date = new Date(`${iso}T00:00:00`);
  try {
    return new Intl.DateTimeFormat(lang === "rw" ? "rw-RW" : lang, { day: "numeric", month: "long", year: "numeric" }).format(date);
  } catch {
    return iso;
  }
}
