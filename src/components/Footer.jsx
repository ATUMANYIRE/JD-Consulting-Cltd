import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useLanguage, useServices } from "../i18n/context";
import { mulberry32 } from "../three/geometry";

const WIDTH = 1440;
const HEIGHT = 320;
const POINTS = 129;

// Midpoint-displacement ridgeline so each range reads like a real mountain silhouette.
function ridge(seed, base, amplitude, roughness = 0.55) {
  const rand = mulberry32(seed);
  const heights = new Array(POINTS).fill(0);
  heights[0] = (rand() - 0.5) * amplitude;
  heights[POINTS - 1] = (rand() - 0.5) * amplitude;
  let step = POINTS - 1;
  let scale = amplitude;
  while (step > 1) {
    const half = step / 2;
    for (let i = half; i < POINTS; i += step) {
      heights[i] = (heights[i - half] + heights[i + half]) / 2 + (rand() - 0.5) * scale;
    }
    scale *= roughness;
    step = half;
  }
  const ys = heights.map((h) => Math.min(HEIGHT, Math.max(24, base - h)));
  const path = `M0,${HEIGHT} ` + ys.map((y, i) => `L${((i / (POINTS - 1)) * WIDTH).toFixed(1)},${y.toFixed(1)}`).join(" ") + ` L${WIDTH},${HEIGHT} Z`;
  const line = ys.map((y, i) => `${i ? "L" : "M"}${((i / (POINTS - 1)) * WIDTH).toFixed(1)},${y.toFixed(1)}`).join(" ");
  const heightAt = (x) => ys[Math.round((x / WIDTH) * (POINTS - 1))];
  return { path, line, heightAt };
}

const FAR = ridge(11, 150, 280, 0.62);
const MID = ridge(27, 205, 210, 0.6);
const NEAR = ridge(42, 248, 130, 0.56);
const FRONT = ridge(7, 288, 50, 0.5);
const HEADFRAME_X = 1150;
const HEADFRAME_Y = FRONT.heightAt(HEADFRAME_X);

function Mountains() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const sunY = useTransform(scrollYProgress, [0, 1], [120, 0]);
  const farY = useTransform(scrollYProgress, [0, 1], [70, 0]);
  const midY = useTransform(scrollYProgress, [0, 1], [45, 0]);
  const nearY = useTransform(scrollYProgress, [0, 1], [22, 0]);

  return (
    <div ref={ref} className="relative -mb-px h-[220px] overflow-hidden sm:h-[360px]" aria-hidden="true">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="footer-sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#EA9534" />
            <stop offset="0.45" stopColor="#E28A2E" stopOpacity="0.9" />
            <stop offset="1" stopColor="#E28A2E" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="footer-mist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="footer-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b8c8d6" />
            <stop offset="1" stopColor="#dfe7ee" />
          </linearGradient>
          <linearGradient id="footer-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6d8aa2" />
            <stop offset="1" stopColor="#9fb3c4" />
          </linearGradient>
          <linearGradient id="footer-near" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#23445d" />
            <stop offset="1" stopColor="#2f5470" />
          </linearGradient>
        </defs>

        <motion.g style={{ y: sunY }}>
          <circle cx="980" cy="190" r="160" fill="url(#footer-sun)" opacity="0.6" />
          <circle cx="980" cy="190" r="44" fill="#EA9534" />
        </motion.g>
        <motion.g style={{ y: farY }}>
          <path d={FAR.path} fill="url(#footer-far)" />
          <path d={FAR.line} fill="none" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1.5" />
        </motion.g>
        <motion.g style={{ y: midY }}>
          <path d={MID.path} fill="url(#footer-mid)" />
          <rect x="0" y="170" width={WIDTH} height="110" fill="url(#footer-mist)" />
        </motion.g>
        <motion.path style={{ y: nearY }} d={NEAR.path} fill="url(#footer-near)" />
        <path d={FRONT.path} fill="#0E293E" />
        <rect x="0" y={HEIGHT - 4} width={WIDTH} height="4" fill="#0E293E" />

        <g transform={`translate(${HEADFRAME_X} ${HEADFRAME_Y + 6})`} fill="#0E293E" stroke="#0E293E">
          <path d="M-26 0 L-6 -78 L6 -78 L26 0" fill="none" strokeWidth="5" />
          <path d="M-18 -30 H18 M-12 -54 H12 M-18 -30 L12 -54 M18 -30 L-12 -54" fill="none" strokeWidth="3" />
          <circle cx="0" cy="-86" r="12" fill="none" strokeWidth="4" />
          <rect x="-40" y="-22" width="22" height="22" />
        </g>
        <circle cx={HEADFRAME_X} cy={HEADFRAME_Y - 80} r="3.5" fill="#EA9534" className="animate-pulse" />
      </svg>
    </div>
  );
}

export default function Footer() {
  const { t } = useLanguage();
  const services = useServices();
  const pages = [
    { to: "/", label: t.nav.home },
    { to: "/about", label: t.nav.about },
    { to: "/services", label: t.nav.services },
    { to: "/contact", label: t.nav.contact },
  ];

  return (
    <footer className="relative mt-24 text-white">
      <Mountains />
      <div className="bg-navy">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-6 border-b border-white/10 pb-12 pt-6 md:flex-row md:items-end">
            <h2 className="max-w-xl font-display text-3xl font-bold leading-tight sm:text-5xl">{t.contact.title}</h2>
            <Link
              to="/contact"
              className="group flex items-center gap-3 rounded-full bg-orange py-2 pl-6 pr-2 font-display font-semibold text-navy transition-colors hover:bg-orange-light"
            >
              {t.footer.cta}
              <span className="grid h-10 w-10 place-items-center rounded-full bg-navy text-white transition-transform group-hover:-rotate-45">→</span>
            </Link>
          </div>

          <div className="grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1.5fr_1.2fr]">
            <div>
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-white font-display text-lg font-bold text-navy">
                <span>
                  JD<span className="text-orange">.</span>
                </span>
              </span>
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/50">{t.footer.legalName}</p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/60">{t.footer.tagline}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-orange">{t.footer.company}</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {pages.map((page) => (
                  <li key={page.to}>
                    <Link to={page.to} className="text-white/70 transition-colors hover:text-orange">
                      {page.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-orange">{t.footer.services}</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {services.map((service) => (
                  <li key={service.slug}>
                    <Link to={`/services/${service.slug}`} className="text-white/70 transition-colors hover:text-orange">
                      {service.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-orange">{t.footer.reach}</p>
              <a href="mailto:contact@jdmining.rw" className="mt-4 block break-all font-display text-lg font-semibold transition-colors hover:text-orange">
                contact@jdmining.rw
              </a>
              <p className="mt-1 text-sm text-white/60">{t.contact.region}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 py-6 text-xs text-white/40">
            <span>
              © {new Date().getFullYear()} JD Mining Consulting Ltd. {t.footer.rights}
            </span>
            <span className="hidden sm:inline">{t.footer.sectors}</span>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 font-semibold text-white/70 transition-colors hover:border-orange hover:text-orange"
            >
              {t.footer.backToTop} ↑
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
