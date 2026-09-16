import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useLanguage } from "../i18n/context";
import LanguageSwitcher from "./LanguageSwitcher";
import { languages } from "../i18n/translations";

function Logo() {
  return (
    <Link to="/" aria-label="JD Mining Consulting Ltd" className="group">
      <span className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-navy font-display text-lg font-bold text-white transition-transform group-hover:-rotate-6">
        JD
        <span className="absolute bottom-2 right-2 h-1.5 w-1.5 rounded-full bg-orange" />
      </span>
    </Link>
  );
}

export default function Navbar() {
  const { t, lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const links = [
    { to: "/", label: t.nav.home },
    { to: "/about", label: t.nav.about },
    { to: "/services", label: t.nav.services },
    { to: "/contact", label: t.nav.contact },
  ];

  useMotionValueEvent(scrollY, "change", (value) => setScrolled(value > 40));

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40">
      <div className={`border-b bg-white/95 backdrop-blur transition-shadow ${scrolled ? "border-navy/10 shadow-[0_10px_30px_-18px_rgba(14,41,62,0.5)]" : "border-transparent"}`}>
        <nav className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />

          <div className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  `group relative px-4 py-2 text-sm font-semibold transition-colors ${isActive ? "text-navy" : "text-navy/55 hover:text-navy"}`
                }
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    <span
                      className={`absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-orange transition-all ${
                        isActive ? "scale-100 opacity-100" : "scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-40"
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
            <Link
              to="/contact"
              className="group hidden items-center gap-3 rounded-full bg-navy py-1.5 pl-5 pr-1.5 text-sm font-semibold text-white transition-colors hover:bg-navy-light md:flex"
            >
              {t.nav.cta}
              <span className="grid h-8 w-8 place-items-center rounded-full bg-orange text-navy transition-transform group-hover:rotate-[-45deg]">→</span>
            </Link>
            <button
              type="button"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={t.nav.menu}
              onClick={() => setOpen(true)}
              className="grid h-11 w-11 place-items-center rounded-xl bg-navy md:hidden"
            >
              <span className="flex flex-col items-end gap-1.5">
                <span className="h-0.5 w-5 rounded bg-white" />
                <span className="h-0.5 w-3 rounded bg-orange" />
              </span>
            </button>
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-navy px-6 pb-8 pt-5 text-white md:hidden"
            initial={{ clipPath: "circle(0% at 100% 0%)" }}
            animate={{ clipPath: "circle(150% at 100% 0%)" }}
            exit={{ clipPath: "circle(0% at 100% 0%)" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-2xl font-bold">
                JD<span className="text-orange">.</span>
              </span>
              <button
                type="button"
                aria-label={t.nav.close}
                onClick={() => setOpen(false)}
                className="grid h-11 w-11 place-items-center rounded-xl border border-white/20 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <nav className="mt-12 flex flex-col gap-2">
              {links.map((link, i) => (
                <motion.div key={link.to} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.06 }}>
                  <NavLink
                    to={link.to}
                    end={link.to === "/"}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) => `flex items-baseline gap-4 py-2 font-display text-4xl font-bold ${isActive ? "text-orange" : "text-white"}`}
                  >
                    <span className="text-sm text-white/40">{String(i + 1).padStart(2, "0")}</span>
                    {link.label}
                  </NavLink>
                </motion.div>
              ))}
            </nav>
            <div className="mt-auto space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">{t.nav.language}</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {languages.map((language) => {
                    const active = language.code === lang;
                    return (
                      <button
                        key={language.code}
                        type="button"
                        lang={language.code}
                        aria-pressed={active}
                        onClick={() => setLang(language.code)}
                        className={`min-w-0 rounded-2xl border px-2.5 py-3 text-left transition-colors ${active ? "border-orange bg-orange text-navy" : "border-white/15 text-white hover:border-white/40"}`}
                      >
                        <span className="block text-[10px] font-bold tracking-widest opacity-60">{language.short}</span>
                        <span className="block text-xs font-semibold">{language.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <a href="mailto:contact@jdmining.rw" className="block text-white/70">
                contact@jdmining.rw
              </a>
              <Link to="/contact" onClick={() => setOpen(false)} className="block rounded-full bg-orange py-3.5 text-center font-display font-semibold text-navy">
                {t.nav.cta}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
