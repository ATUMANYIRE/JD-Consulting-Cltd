import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageHero from "../components/PageHero";
import EmptyState from "../components/EmptyState";
import NavyPattern from "../components/NavyPattern";
import { Reveal, Stagger } from "../components/motion";
import { staggerItem } from "../components/variants";
import { ServiceIllustration } from "../components/illustrations";
import { formatDate, localize, useLanguage, useServices } from "../i18n/context";
import { vacancies } from "../data/careers";
import { company } from "../data/company";

function Vacancy({ job }) {
  const { t, lang } = useLanguage();
  const meta = [
    [t.careersPage.location, localize(job.location, lang)],
    [t.careersPage.type, localize(job.type, lang)],
    [t.careersPage.closing, formatDate(job.closing, lang)],
  ].filter(([, value]) => value);

  return (
    <motion.li variants={staggerItem} className="flex flex-col gap-4 rounded-3xl border-2 border-navy/10 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-xl font-bold text-navy">{localize(job.title, lang)}</h3>
        <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {meta.map(([label, value]) => (
            <div key={label} className="flex gap-1.5">
              <dt className="text-navy/45">{label}</dt>
              <dd className="font-semibold text-navy/80">{value}</dd>
            </div>
          ))}
        </dl>
        {job.summary && <p className="mt-3 max-w-2xl text-navy/70">{localize(job.summary, lang)}</p>}
      </div>
      {job.applyUrl && (
        <a href={job.applyUrl} className="flex-none self-start rounded-full bg-navy px-6 py-2.5 font-display font-semibold text-white transition-colors hover:bg-navy-light sm:self-center">
          {t.careersPage.apply}
        </a>
      )}
    </motion.li>
  );
}

export default function Careers() {
  const { t } = useLanguage();
  const services = useServices();
  const interestHref = `mailto:${company.email}?subject=${encodeURIComponent(t.careersPage.interestSubject)}`;

  return (
    <>
      <PageHero eyebrow={t.careersPage.eyebrow} title={t.careersPage.title} description={t.careersPage.description}>
        <div className="p-6">
          <ServiceIllustration slug="tvet-workforce" className="h-56 w-full" />
        </div>
      </PageHero>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange">{t.careersPage.eyebrow}</p>
          <h2 className="mt-3 text-3xl font-bold text-navy">{t.careersPage.currentTitle}</h2>
        </Reveal>
        <div className="mt-8">
          {vacancies.length > 0 ? (
            <Stagger as="ul" className="space-y-4">
              {vacancies.map((job) => (
                <Vacancy key={job.id} job={job} />
              ))}
            </Stagger>
          ) : (
            <Reveal>
              <EmptyState title={t.careersPage.noVacancies} text={t.careersPage.noVacanciesText} />
            </Reveal>
          )}
        </div>
      </section>

      <section className="px-3 sm:px-6">
        <div className="relative mx-auto grid max-w-7xl gap-12 overflow-hidden rounded-[2.5rem] bg-navy px-5 py-20 text-white *:relative sm:px-10 lg:grid-cols-[1fr_1.1fr] lg:px-14">
          <NavyPattern />
          <Reveal>
            <h2 className="text-3xl font-bold">{t.careersPage.futureTitle}</h2>
            <p className="mt-4 max-w-md text-white/75">{t.careersPage.futureText}</p>
          </Reveal>
          <Stagger as="ul" className="space-y-2">
            {services.map((service, i) => (
              <motion.li key={service.slug} variants={staggerItem}>
                <Link
                  to={`/services/${service.slug}`}
                  className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 transition-colors hover:border-orange"
                >
                  <span className="font-display text-lg font-bold text-orange">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1 font-semibold">{service.title}</span>
                  <span className="text-orange opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100">→</span>
                </Link>
              </motion.li>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <Reveal className="grid items-center gap-8 rounded-3xl border-2 border-navy p-8 sm:p-10 md:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-2xl font-bold text-navy sm:text-3xl">{t.careersPage.interestTitle}</h2>
            <p className="mt-3 text-navy/70">{t.careersPage.interestText}</p>
          </div>
          <a
            href={interestHref}
            className="group flex items-center justify-between gap-3 rounded-full bg-navy py-2 pl-6 pr-2 font-display font-semibold text-white transition-colors hover:bg-navy-light md:justify-self-end"
          >
            {t.careersPage.interestButton}
            <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-orange text-navy transition-transform group-hover:-rotate-45">→</span>
          </a>
        </Reveal>
      </section>
    </>
  );
}
