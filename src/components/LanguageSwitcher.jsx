import { motion } from "framer-motion";
import { useLanguage } from "../i18n/context";
import { languages } from "../i18n/translations";

// All three languages stay visible as one segmented control, so switching is a single tap.
export default function LanguageSwitcher({ tone = "light", className = "" }) {
  const { lang, setLang, t } = useLanguage();
  const dark = tone === "dark";

  return (
    <div role="group" aria-label={t.nav.language} className={`flex rounded-full p-1 ${dark ? "bg-white/10" : "bg-navy/[0.06]"} ${className}`}>
      {languages.map((language) => {
        const active = language.code === lang;
        return (
          <button
            key={language.code}
            type="button"
            lang={language.code}
            aria-pressed={active}
            title={language.name}
            aria-label={language.name}
            onClick={() => setLang(language.code)}
            className={`relative h-8 min-w-11 rounded-full px-2.5 text-xs font-bold tracking-wide transition-colors ${
              active ? (dark ? "text-navy" : "text-white") : dark ? "text-white/70 hover:text-white" : "text-navy/60 hover:text-navy"
            }`}
          >
            {active && (
              <motion.span
                layoutId={`lang-pill-${tone}`}
                className={`absolute inset-0 rounded-full ${dark ? "bg-orange" : "bg-navy"}`}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{language.short}</span>
          </button>
        );
      })}
    </div>
  );
}
