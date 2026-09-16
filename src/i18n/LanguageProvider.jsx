import { useEffect, useMemo, useState } from "react";
import { LanguageContext } from "./context";
import { translations } from "./translations";

const STORAGE_KEY = "jd-language";

function initialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && translations[saved]) return saved;
  } catch {
    // storage can be unavailable (private mode, blocked site data)
  }
  const browser = (navigator.language || "en").slice(0, 2).toLowerCase();
  if (browser === "fr") return "fr";
  if (browser === "rw" || browser === "ki") return "rw";
  return "en";
}

export default function LanguageProvider({ children }) {
  const [lang, setLang] = useState(initialLanguage);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore unavailable storage
    }
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t: translations[lang] }), [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
