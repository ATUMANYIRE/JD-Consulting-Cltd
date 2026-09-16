import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageHero from "../components/PageHero";
import { Reveal, Stagger, TiltCard } from "../components/motion";
import NavyPattern from "../components/NavyPattern";
import { staggerItem } from "../components/variants";
import { StrataIllustration } from "../components/illustrations";
import { useLanguage } from "../i18n/context";

export default function About() {
  const { t } = useLanguage();

  return (
    <>
      <PageHero eyebrow={t.about.eyebrow} title={t.about.title} description={t.about.description} />

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-2">
        <Reveal x={-50} y={0}>
          <StrataIllustration className="w-full" />
        </Reveal>
        <Reveal delay={0.15}>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange">{t.about.whoEyebrow}</p>
          <h2 className="mt-3 text-3xl font-bold text-navy">{t.about.whoTitle}</h2>
          <p className="mt-5 text-navy/75">{t.about.p1}</p>
          <p className="mt-4 text-navy/75">{t.about.p2}</p>
        </Reveal>
      </section>

      <section className="px-3 sm:px-6">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-navy px-5 py-20 text-white *:relative sm:px-10 lg:px-14">
          <NavyPattern />
          <Reveal>
            <h2 className="text-3xl font-bold">{t.about.whereTitle}</h2>
          </Reveal>
          <div className="mt-10 flex flex-col items-stretch gap-4 md:flex-row">
            {t.about.intersections.map((item, i) => (
              <motion.div
                key={item}
                className="flex-1 rounded-3xl border-2 border-white/15 p-6 font-display text-xl font-bold"
                initial={{ opacity: 0, rotateX: -80 }}
                whileInView={{ opacity: 1, rotateX: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ delay: i * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformPerspective: 800, transformOrigin: "top" }}
                whileHover={{ borderColor: "#E28A2E", color: "#E28A2E" }}
              >
                <span className="block text-sm text-orange">{String(i + 1).padStart(2, "0")}</span>
                {item}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2">
          <Reveal>
            <TiltCard className="h-full bg-gradient-to-br from-orange-light to-orange p-8 text-navy">
              <h3 className="text-sm font-bold uppercase tracking-[0.25em]">{t.common.vision}</h3>
              <p className="mt-4 text-lg">{t.common.visionText}</p>
            </TiltCard>
          </Reveal>
          <Reveal delay={0.12}>
            <TiltCard className="h-full border-2 border-navy p-8">
              <h3 className="text-sm font-bold uppercase tracking-[0.25em] text-orange">{t.common.mission}</h3>
              <p className="mt-4 text-lg text-navy/85">{t.common.missionText}</p>
            </TiltCard>
          </Reveal>
        </div>

        <Reveal className="mt-20">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange">{t.about.serveEyebrow}</p>
        </Reveal>
        <Stagger className="mt-6 grid gap-5 md:grid-cols-3">
          {t.about.audiences.map((audience) => (
            <motion.div key={audience.title} variants={staggerItem} className="rounded-3xl border-2 border-navy/10 bg-white p-6 transition-colors hover:border-orange">
              <h3 className="text-xl font-bold text-navy">{audience.title}</h3>
              <p className="mt-2 text-sm text-navy/70">{audience.text}</p>
            </motion.div>
          ))}
        </Stagger>

        <Reveal className="mt-14">
          <Link to="/services" className="group inline-flex items-center gap-3 font-display text-lg font-semibold text-navy">
            <span className="border-b-2 border-orange">{t.about.seeHow}</span>
            <span className="text-orange transition-transform group-hover:translate-x-2">→</span>
          </Link>
        </Reveal>
      </section>
    </>
  );
}
