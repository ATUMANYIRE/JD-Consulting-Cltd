import { Link, Navigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import PageHero from "../components/PageHero";
import { Reveal, Stagger } from "../components/motion";
import NavyPattern from "../components/NavyPattern";
import { staggerItem } from "../components/variants";
import { ServiceIllustration } from "../components/illustrations";
import { useLanguage, useServices } from "../i18n/context";

export default function ServiceDetail() {
  const { slug } = useParams();
  const { t } = useLanguage();
  const services = useServices();
  const index = services.findIndex((item) => item.slug === slug);
  const service = services[index];

  if (!service) {
    return <Navigate to="/services" replace />;
  }

  const next = services[(index + 1) % services.length];

  return (
    <>
      <PageHero eyebrow={`${t.common.pillar} ${String(index + 1).padStart(2, "0")}`} title={service.title} description={service.summary}>
        <div className="p-6">
          <ServiceIllustration key={service.slug} slug={service.slug} className="h-60 w-full" />
        </div>
      </PageHero>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange">{t.detail.capabilitiesEyebrow}</p>
          <h2 className="mt-3 text-3xl font-bold text-navy">{t.detail.capabilitiesTitle}</h2>
        </Reveal>
        <Stagger as="ul" className="mt-10 grid gap-5 md:grid-cols-2">
          {service.points.map((point, i) => (
            <motion.li
              key={point}
              variants={staggerItem}
              whileHover={{ y: -6 }}
              className="group relative rounded-3xl border-l-8 border-orange bg-navy/[0.04] p-6 transition-colors hover:bg-navy hover:text-white"
            >
              <span className="font-display text-sm font-bold text-orange">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-2 text-navy/85 group-hover:text-white/90">{point}</p>
            </motion.li>
          ))}
        </Stagger>

        <Reveal className="mt-14 flex flex-wrap gap-4">
          <Link to="/contact" className="rounded-full bg-gradient-to-br from-orange-light to-orange px-7 py-3 font-display font-semibold text-navy transition hover:brightness-110">
            {t.detail.request}
          </Link>
          <Link to="/services" className="rounded-full border-2 border-navy px-7 py-3 font-display font-semibold text-navy transition hover:border-orange hover:text-orange">
            {t.detail.all}
          </Link>
        </Reveal>
      </section>

      <div className="px-3 sm:px-6">
        <Link to={`/services/${next.slug}`} className="group relative mx-auto block max-w-7xl overflow-hidden rounded-[2rem] bg-navy py-12 text-white *:relative">
          <NavyPattern />
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 sm:px-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange">{t.detail.next}</p>
              <p className="mt-2 font-display text-2xl font-bold transition-colors group-hover:text-orange sm:text-3xl">{next.title}</p>
            </div>
            <span className="font-display text-4xl text-orange transition-transform group-hover:translate-x-3">→</span>
          </div>
        </Link>
      </div>
    </>
  );
}
