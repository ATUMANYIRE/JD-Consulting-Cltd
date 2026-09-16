import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "../i18n/context";
import { languages } from "../i18n/translations";

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" />
    </svg>
  );
}

export default function LanguageSwitcher({ tone = "light" }) {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const current = languages.find((language) => language.code === lang);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (event.type === "keydown" ? event.key === "Escape" : !root.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const buttonTone = tone === "dark" ? "text-white/80 hover:text-white" : "border border-navy/15 text-navy hover:border-navy/40";

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t.nav.language}
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors ${buttonTone}`}
      >
        <GlobeIcon />
        {current.name}
        <svg viewBox="0 0 12 12" className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} fill="currentColor" aria-hidden="true">
          <path d="M2 4l4 4 4-4z" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label={t.nav.language}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-full z-50 mt-2 w-48 origin-top-right overflow-hidden rounded-2xl border border-navy/10 bg-white p-1.5 text-navy shadow-[0_20px_50px_-15px_rgba(14,41,62,0.45)]"
          >
            {languages.map((language) => {
              const active = language.code === lang;
              return (
                <li key={language.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    lang={language.code}
                    onClick={() => {
                      setLang(language.code);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                      active ? "bg-navy text-white" : "hover:bg-navy/5"
                    }`}
                  >
                    <span className="font-semibold">{language.name}</span>
                    <span className={`text-[10px] font-bold tracking-widest ${active ? "text-orange" : "text-navy/40"}`}>{language.short}</span>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
