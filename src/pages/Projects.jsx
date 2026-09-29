import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import PageHero from "../components/PageHero";
import EmptyState from "../components/EmptyState";
import MediaFrame from "../components/MediaFrame";
import { Reveal, Stagger } from "../components/motion";
import { staggerItem } from "../components/variants";
import { ServiceIllustration } from "../components/illustrations";
import { localize, useLanguage, useServices } from "../i18n/context";
import { projects } from "../data/projects";
import { projectStatuses } from "../data/schema";

function ProjectCard({ project }) {
  const { t, lang } = useLanguage();
  const services = useServices();
  const service = services.find((item) => item.slug === project.service);
  const [cover, ...gallery] = project.media ?? [];
  const meta = [
    [t.projectsPage.location, localize(project.location, lang)],
    [t.projectsPage.year, project.year],
    [t.projectsPage.client, localize(project.client, lang)],
  ].filter(([, value]) => value);

  return (
    <motion.article variants={staggerItem} className="flex flex-col overflow-hidden rounded-3xl border-2 border-navy/10 bg-white">
      <MediaFrame media={cover} label={t.projectsPage.photo} aspect="aspect-[16/10]" rounded="rounded-none" className="border-x-0 border-t-0" />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${project.status === "ongoing" ? "bg-navy text-white" : "bg-navy/[0.06] text-navy"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${project.status === "ongoing" ? "animate-pulse bg-orange" : "bg-navy/40"}`} />
          {t.projectsPage[project.status]}
        </span>
        {service && (
          <Link to={`/services/${service.slug}`} className="self-start rounded-full bg-orange/15 px-3 py-1 text-xs font-semibold text-navy hover:bg-orange/25">
            {service.title}
          </Link>
        )}
        </div>
        <h2 className="mt-4 text-xl font-bold text-navy">{localize(project.name, lang)}</h2>
        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {meta.map(([label, value]) => (
            <div key={label} className="flex gap-1.5">
              <dt className="text-navy/45">{label}</dt>
              <dd className="font-semibold text-navy/80">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-navy/70">{localize(project.description, lang)}</p>
        {project.outcomes?.length > 0 && (
          <div className="mt-5 border-t border-navy/10 pt-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange">{t.projectsPage.outcomes}</p>
            <ul className="mt-2 space-y-1.5">
              {project.outcomes.map((outcome) => (
                <li key={localize(outcome, "en")} className="flex gap-3 text-sm text-navy/80">
                  <span className="mt-1.5 h-2 w-2 flex-none rotate-45 bg-orange" />
                  {localize(outcome, lang)}
                </li>
              ))}
            </ul>
          </div>
        )}
        {gallery.length > 0 && (
          <div className="mt-5 grid grid-cols-3 gap-2">
            {gallery.map((media) => (
              <MediaFrame key={media.src} media={media} aspect="aspect-square" rounded="rounded-xl" />
            ))}
          </div>
        )}
      </div>
    </motion.article>
  );
}

function StatusTabs({ status, onChange, counts }) {
  const { t } = useLanguage();
  return (
    <div role="tablist" aria-label={t.projectsPage.tabsLabel} className="inline-flex rounded-full bg-navy/[0.06] p-1.5">
      {projectStatuses.map((value) => {
        const active = value === status;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(value)}
            className={`relative flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-sm font-semibold transition-colors ${active ? "text-white" : "text-navy/60 hover:text-navy"}`}
          >
            {active && <motion.span layoutId="project-status" className="absolute inset-0 rounded-full bg-navy" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
            <span className="relative">{t.projectsPage[value]}</span>
            <span className={`relative grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] ${active ? "bg-orange text-navy" : "bg-navy/10"}`}>{counts[value]}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function Projects() {
  const { t } = useLanguage();
  const counts = Object.fromEntries(projectStatuses.map((value) => [value, projects.filter((project) => project.status === value).length]));
  const [status, setStatus] = useState(counts.ongoing > 0 || counts.completed === 0 ? "ongoing" : "completed");
  const shown = projects.filter((project) => project.status === status);

  return (
    <>
      <PageHero eyebrow={t.projectsPage.eyebrow} title={t.projectsPage.title} description={t.projectsPage.description}>
        <div className="p-6">
          <ServiceIllustration slug="esg-compliance" className="h-56 w-full" />
        </div>
      </PageHero>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal>
          <StatusTabs status={status} onChange={setStatus} counts={counts} />
        </Reveal>
        <AnimatePresence mode="wait">
          <motion.div key={status} className="mt-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            {shown.length > 0 ? (
              <Stagger className="grid gap-6 md:grid-cols-2">
                {shown.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </Stagger>
            ) : (
              <EmptyState
                title={projects.length ? t.projectsPage[status === "ongoing" ? "emptyOngoing" : "emptyCompleted"] : t.projectsPage.emptyTitle}
                text={t.projectsPage.emptyText}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-16 grid gap-10 md:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange">{t.projectsPage.eyebrow}</p>
            <h2 className="mt-3 text-3xl font-bold text-navy">{t.projectsPage.standardsTitle}</h2>
          </Reveal>
          <Stagger as="ul" className="grid gap-3 sm:grid-cols-2">
            {t.projectsPage.standards.map((item, i) => (
              <motion.li key={item} variants={staggerItem} className="group rounded-3xl border-2 border-navy/10 p-5 transition-colors hover:border-orange">
                <span className="font-display text-sm font-bold text-orange">{String(i + 1).padStart(2, "0")}</span>
                <p className="mt-2 font-semibold text-navy">{item}</p>
              </motion.li>
            ))}
          </Stagger>
        </div>

        <Reveal className="mt-16 flex flex-col items-start justify-between gap-6 rounded-3xl bg-navy/[0.04] p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-navy">{t.projectsPage.ctaTitle}</h2>
            <p className="mt-2 text-navy/70">{t.projectsPage.ctaText}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/services" className="rounded-full border-2 border-navy px-6 py-2.5 font-display font-semibold text-navy transition hover:border-orange hover:text-orange">
              {t.hero.secondary}
            </Link>
            <Link to="/contact" className="rounded-full bg-navy px-6 py-2.5 font-display font-semibold text-white transition-colors hover:bg-navy-light">
              {t.nav.cta}
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
