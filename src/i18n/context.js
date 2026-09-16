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
