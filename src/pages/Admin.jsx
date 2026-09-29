import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "../components/Logo";
import NavyPattern from "../components/NavyPattern";
import { translations } from "../i18n/translations";
import { serviceSlugs } from "../data/services";
import { updateCategories } from "../data/schema";

// The owner's private editor for Projects and Updates. There is no login: the private link carries a
// secret key (/admin#key=…), which is kept in this browser and checked by /api/content on every save.
// Owner-facing, so English only.

const KEY_STORAGE = "jd-admin-key";
const MAX_NEW_PHOTOS = 6;
const CATEGORY_LABELS = {
  company: "Company update",
  insights: "Industry insight",
  technical: "Technical article",
  esg: "ESG development",
  training: "Training announcement",
  projects: "Project update",
  events: "Event",
};

function readKey() {
  try {
    const fromLink = new URLSearchParams(window.location.hash.slice(1)).get("key");
    if (fromLink) {
      localStorage.setItem(KEY_STORAGE, fromLink);
      window.history.replaceState(null, "", "/admin");
      return fromLink;
    }
    return localStorage.getItem(KEY_STORAGE) ?? "";
  } catch {
    return new URLSearchParams(window.location.hash.slice(1)).get("key") ?? "";
  }
}

async function api(key, method, body) {
  const response = await fetch("/api/content", {
    method,
    headers: { "x-admin-key": key, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    // not JSON: an HTML page came back, so the editor server isn't deployed here
  }
  if (response.ok && !data) throw new Error("The editor server isn't available here. It only works on the live website once it has been set up.");
  data ??= {};
  if (!response.ok) {
    const error = new Error(data.error ?? (response.status === 404 ? "The editor server isn't available here. It only works on the live website." : `Server error (${response.status}).`));
    error.problems = data.problems;
    error.status = response.status;
    throw error;
  }
  return data;
}

async function getContent(key) {
  const data = await api(key, "GET");
  if (!Array.isArray(data.projects) || !Array.isArray(data.updates)) throw new Error("The editor server sent an unexpected reply. Try again in a moment.");
  return data;
}

// Shrink photos in the browser (max 1600 px, JPEG) so uploads stay small and fast on mobile data.
async function compress(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
  const data = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.readAsDataURL(blob);
  });
  return { contentType: "image/jpeg", data, preview: URL.createObjectURL(blob) };
}

const L = (value) => (value && typeof value === "object" ? { en: value.en ?? "", fr: value.fr ?? "", rw: value.rw ?? "" } : { en: value ?? "", fr: "", rw: "" });
function fromL(value) {
  const en = value.en.trim();
  const fr = value.fr.trim();
  const rw = value.rw.trim();
  if (!fr && !rw) return en;
  return { en, ...(fr ? { fr } : {}), ...(rw ? { rw } : {}) };
}
const today = () => new Date().toISOString().slice(0, 10);
const plain = (value) => (value && typeof value === "object" ? value.en : value) ?? "";

function toForm(type, entry) {
  if (type === "projects") {
    return {
      id: entry?.id ?? null,
      name: L(entry?.name),
      location: plain(entry?.location),
      year: entry?.year ?? new Date().getFullYear(),
      status: entry?.status ?? "",
      service: entry?.service ?? "",
      client: plain(entry?.client),
      clientPermission: Boolean(entry?.client),
      description: L(entry?.description),
      outcomes: entry?.outcomes?.length ? entry.outcomes.map(plain) : [""],
      media: (entry?.media ?? []).map((item) => ({ src: item.src, alt: item.alt ?? "", caption: item.caption ?? "" })),
    };
  }
  return {
    id: entry?.id ?? null,
    date: entry?.date ?? today(),
    category: entry?.category ?? "",
    title: L(entry?.title),
    summary: L(entry?.summary),
    url: entry?.url ?? "",
    media: entry?.cover ? [{ src: entry.cover.src, alt: entry.cover.alt ?? "", caption: "" }] : [],
  };
}

function toRequest(type, form) {
  const uploads = [];
  const media = form.media.map((item) => {
    if (!item.upload) return { type: "image", src: item.src, alt: item.alt.trim(), ...(item.caption.trim() ? { caption: item.caption.trim() } : {}) };
    uploads.push({ contentType: item.upload.contentType, data: item.upload.data });
    return { type: "image", src: `upload:${uploads.length - 1}`, alt: item.alt.trim(), ...(item.caption.trim() ? { caption: item.caption.trim() } : {}) };
  });
  const entry =
    type === "projects"
      ? {
          id: form.id ?? undefined,
          name: fromL(form.name),
          location: form.location.trim(),
          year: Number(form.year),
          status: form.status,
          service: form.service,
          client: form.client.trim() || undefined,
          description: fromL(form.description),
          outcomes: form.outcomes.map((item) => item.trim()).filter(Boolean),
          media,
        }
      : {
          id: form.id ?? undefined,
          date: form.date,
          category: form.category,
          title: fromL(form.title),
          summary: fromL(form.summary),
          url: form.url.trim() || undefined,
          cover: media[0],
        };
  return { entry, uploads };
}

const inputClass =
  "w-full rounded-2xl border-2 border-transparent bg-[#f1f4f7] px-4 py-3 text-base text-navy outline-none transition placeholder:text-navy/35 focus:border-orange focus:bg-white sm:text-sm";

const ease = [0.22, 1, 0.36, 1];

// The editor is English only, whatever language the visitor last chose on the site.
const SERVICES = serviceSlugs.map((slug) => ({ slug, ...translations.en.pillars[slug] }));

function Icon({ name, className = "h-4 w-4" }) {
  const paths = {
    plus: "M12 5v14M5 12h14",
    edit: "M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4",
    trash: "M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
    pin: "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
    calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
    photo: "M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15.5 9.5h.01",
    check: "M5 12.5l4.5 4.5L19 7.5",
    arrow: "M7 17L17 7M9 7h8v8",
    back: "M15 18l-6-6 6-6",
    shield: "M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3z",
    close: "M6 6l12 12M18 6L6 18",
    project: "M3 20l6-11 4 6 3-4 5 9H3zM15 6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
    news: "M5 4h11v16H5zM16 8h3v10a2 2 0 0 1-2 2M8 8h5M8 12h5M8 16h3",
  };
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

function Section({ number, title, hint, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease, delay: number * 0.05 }}
      className="rounded-[1.75rem] bg-white p-5 shadow-[0_18px_40px_-30px_rgba(14,41,62,0.45)] sm:p-7"
    >
      <div className="flex items-start gap-4">
        <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-navy font-display text-sm font-bold text-orange">{String(number).padStart(2, "0")}</span>
        <div>
          <h3 className="font-display text-lg font-bold text-navy">{title}</h3>
          {hint && <p className="mt-0.5 text-sm text-navy/55">{hint}</p>}
        </div>
      </div>
      <div className="mt-6 space-y-5">{children}</div>
    </motion.section>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-navy">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-navy/50">{hint}</span>}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

function LangField({ label, hint, value, onChange, multiline, translations }) {
  const Tag = multiline ? "textarea" : "input";
  const set = (lang) => (event) => onChange({ ...value, [lang]: event.target.value });
  const rows = multiline ? 4 : undefined;
  return (
    <div>
      <Field label={label} hint={hint}>
        <Tag value={value.en} onChange={set("en")} rows={rows} className={`${inputClass} ${multiline ? "resize-y" : ""}`} placeholder={translations ? "English" : ""} />
      </Field>
      <AnimatePresence initial={false}>
        {translations && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="grid gap-2 pt-2 sm:grid-cols-2">
              {[
                ["fr", "FR", "Français"],
                ["rw", "KIN", "Kinyarwanda"],
              ].map(([lang, short, name]) => (
                <div key={lang} className="relative">
                  <span className="pointer-events-none absolute left-3 top-3 rounded-md bg-navy/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-navy/60">{short}</span>
                  <Tag value={value[lang]} onChange={set(lang)} rows={rows} lang={lang} className={`${inputClass} pl-14`} placeholder={`${name} (optional)`} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Big tap targets instead of dropdowns: easier on a phone and every option stays visible.
function Choice({ options, value, onChange, columns = "sm:grid-cols-2" }) {
  return (
    <div className={`grid gap-2.5 ${columns}`}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`relative flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors ${
              active ? "border-navy bg-navy text-white" : "border-navy/10 bg-white text-navy hover:border-navy/30"
            }`}
          >
            <span className={`mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full border-2 transition-colors ${active ? "border-orange bg-orange text-navy" : "border-navy/20"}`}>
              {active && <Icon name="check" className="h-3 w-3" />}
            </span>
            <span className="min-w-0">
              <span className="block font-semibold leading-snug">{option.label}</span>
              {option.hint && <span className={`mt-0.5 block text-xs ${active ? "text-white/65" : "text-navy/50"}`}>{option.hint}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Chips({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors ${active ? "border-orange bg-orange text-navy" : "border-navy/10 bg-white text-navy/75 hover:border-navy/30"}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ checked, onChange, children }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-center gap-3 rounded-2xl bg-[#f1f4f7] px-4 py-3 text-left text-sm text-navy">
      <span className={`relative h-6 w-11 flex-none rounded-full transition-colors ${checked ? "bg-orange" : "bg-navy/20"}`}>
        <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 32 }} className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow ${checked ? "right-1" : "left-1"}`} />
      </span>
      {children}
    </button>
  );
}

function Photos({ media, onChange, single }) {
  const [busy, setBusy] = useState(false);
  const newCount = media.filter((item) => item.upload).length;
  const limit = single ? 1 : 12;

  async function add(event) {
    const files = [...event.target.files].slice(0, Math.max(0, Math.min(limit - media.length, MAX_NEW_PHOTOS - newCount)));
    event.target.value = "";
    if (!files.length) return;
    setBusy(true);
    try {
      const added = [];
      for (const file of files) {
        const upload = await compress(file);
        added.push({ upload, preview: upload.preview, alt: "", caption: "" });
      }
      onChange([...media, ...added]);
    } finally {
      setBusy(false);
    }
  }

  const update = (i, patch) => onChange(media.map((item, j) => (j === i ? { ...item, ...patch } : item)));

  return (
    <div>
      <div className={`grid gap-3 ${single ? "" : "sm:grid-cols-2"}`}>
        <AnimatePresence initial={false}>
          {media.map((item, i) => (
            <motion.div
              key={item.src ?? item.preview}
              layout
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="overflow-hidden rounded-2xl border-2 border-navy/10 bg-white"
            >
              <div className="relative">
                <img src={item.preview ?? item.src} alt="" className="aspect-[16/10] w-full bg-navy/5 object-cover" />
                {i === 0 && !single && <span className="absolute left-2 top-2 rounded-full bg-navy/85 px-2.5 py-1 text-[11px] font-semibold text-white">Main photo</span>}
                <button
                  type="button"
                  onClick={() => onChange(media.filter((_, j) => j !== i))}
                  aria-label="Remove photo"
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-red-700 shadow transition hover:bg-white"
                >
                  <Icon name="close" className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2 p-2.5">
                <input value={item.alt} onChange={(event) => update(i, { alt: event.target.value })} className={inputClass} placeholder="What does the photo show? (required)" />
                {!single && <input value={item.caption} onChange={(event) => update(i, { caption: event.target.value })} className={inputClass} placeholder="Caption (optional)" />}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {media.length < limit && (
          <label
            className={`flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-navy/20 bg-[#f7f9fb] px-4 py-8 text-center transition hover:border-orange hover:bg-orange/5 ${busy ? "opacity-60" : ""}`}
          >
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple={!single} onChange={add} disabled={busy} className="sr-only" />
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-orange shadow-sm">
              <Icon name="photo" className="h-6 w-6" />
            </span>
            <span className="font-semibold text-navy">{busy ? "Preparing photos…" : single ? "Add a cover photo" : "Add photos"}</span>
            <span className="text-xs text-navy/50">From your phone or computer · resized automatically</span>
          </label>
        )}
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-navy/50">
        <Icon name="shield" className="h-3.5 w-3.5 flex-none text-orange" />
        Only genuine photos from JD Mining Consulting&apos;s own work.
      </p>
    </div>
  );
}

// How the entry will look on the website, updated as the owner types.
function Preview({ type, form, services }) {
  const photo = form.media[0];
  const service = services.find((item) => item.slug === form.service);
  const title = type === "projects" ? form.name.en : form.title.en;
  const text = type === "projects" ? form.description.en : form.summary.en;
  return (
    <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_30px_60px_-35px_rgba(14,41,62,0.55)]">
      <div className="relative aspect-[16/10] bg-[#eef2f6]">
        {photo ? (
          <img src={photo.preview ?? photo.src} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-navy/25">
            <Icon name="photo" className="h-10 w-10" />
          </div>
        )}
      </div>
      <div className="space-y-3 p-5">
        <div className="flex flex-wrap gap-1.5">
          {type === "projects" ? (
            <>
              {form.status && (
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${form.status === "ongoing" ? "bg-navy text-white" : "bg-navy/[0.07] text-navy"}`}>
                  {form.status === "ongoing" ? "Ongoing" : "Completed"}
                </span>
              )}
              {service && <span className="rounded-full bg-orange/15 px-2.5 py-1 text-[11px] font-semibold text-navy">{service.title}</span>}
            </>
          ) : (
            form.category && <span className="rounded-full bg-orange/15 px-2.5 py-1 text-[11px] font-semibold text-navy">{CATEGORY_LABELS[form.category]}</span>
          )}
        </div>
        <p className={`font-display text-lg font-bold leading-snug ${title ? "text-navy" : "text-navy/25"}`}>{title || (type === "projects" ? "Project name" : "Headline")}</p>
        <p className="text-xs font-semibold text-navy/50">{type === "projects" ? [form.location, form.year].filter(Boolean).join(" · ") : form.date}</p>
        <p className={`line-clamp-4 text-sm ${text ? "text-navy/70" : "text-navy/25"}`}>{text || (type === "projects" ? "What was done…" : "Summary…")}</p>
      </div>
    </div>
  );
}

function Editor({ type, entry, keyValue, onDone, onCancel }) {
  const [form, setForm] = useState(() => toForm(type, entry));
  const [translations, setTranslations] = useState(() => {
    const f = toForm(type, entry);
    return [f.name, f.description, f.title, f.summary].some((value) => value && (value.fr || value.rw));
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const setInput = (key) => (event) => set(key)(event.target.type === "checkbox" ? event.target.checked : event.target.value);
  const isProject = type === "projects";

  async function submit(event) {
    event.preventDefault();
    setError(null);
    const local = [];
    if (isProject) {
      if (!form.status) local.push("Choose whether the project is ongoing or completed.");
      if (!form.service) local.push("Choose the service provided.");
      if (form.client.trim() && !form.clientPermission) local.push("Tick the box confirming the client has agreed to be named, or leave the client empty.");
    } else if (!form.category) local.push("Choose a category.");
    if (form.media.some((item) => !item.alt.trim())) local.push("Describe every photo in a few words.");
    if (local.length) return setError({ message: "Almost there. Please check:", problems: local });

    setSaving(true);
    try {
      const { entry: payload, uploads } = toRequest(type, form);
      await api(keyValue, "POST", { action: "save", type, entry: payload, uploads });
      onDone(form.id ? "Changes saved." : "Published.");
    } catch (failure) {
      setError({ message: failure.message, problems: failure.problems?.map((problem) => problem.replace(/^[^:]+: /, "")) });
    } finally {
      setSaving(false);
    }
  }

  const noun = isProject ? "project" : "update";

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.35, ease }}
      className="pb-28"
    >
      <div className="flex items-center gap-3">
        <button type="button" onClick={onCancel} aria-label="Back" className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-white text-navy shadow-sm transition hover:text-orange">
          <Icon name="back" className="h-5 w-5" />
        </button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange">{isProject ? "Projects" : "Updates & news"}</p>
          <h2 className="font-display text-2xl font-bold text-navy">{form.id ? `Edit ${noun}` : `New ${noun}`}</h2>
        </div>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <Toggle checked={translations} onChange={setTranslations}>
            <span>
              <span className="block font-semibold">Also write French & Kinyarwanda</span>
              <span className="text-xs text-navy/55">Optional. Without it, the English text shows in every language.</span>
            </span>
          </Toggle>

          {isProject ? (
            <>
              <Section number={1} title="The project" hint="What it is and where it stands.">
                <LangField label="Project name" value={form.name} onChange={set("name")} translations={translations} />
                <div>
                  <span className="text-sm font-semibold text-navy">Status</span>
                  <div className="mt-2">
                    <Choice
                      value={form.status}
                      onChange={set("status")}
                      options={[
                        { value: "ongoing", label: "Ongoing", hint: "Work is still in progress" },
                        { value: "completed", label: "Completed", hint: "The engagement has finished" },
                      ]}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
                  <Field label="Location" hint="District and country, e.g. Rulindo, Rwanda">
                    <input value={form.location} onChange={setInput("location")} className={inputClass} />
                  </Field>
                  <Field label={form.status === "ongoing" ? "Year started" : "Year"} hint="e.g. 2026">
                    <input type="number" inputMode="numeric" min="2000" max="2100" value={form.year} onChange={setInput("year")} className={inputClass} />
                  </Field>
                </div>
              </Section>

              <Section number={2} title="The work" hint="Which service, and what was done.">
                <div>
                  <span className="text-sm font-semibold text-navy">Service provided</span>
                  <div className="mt-2">
                    <Choice value={form.service} onChange={set("service")} options={SERVICES.map((service) => ({ value: service.slug, label: service.title }))} />
                  </div>
                </div>
                <LangField label="What was done" hint="Two or three sentences." value={form.description} onChange={set("description")} multiline translations={translations} />
              </Section>

              <Section number={3} title="Evidence" hint="Optional. Only what you can back up.">
                <Field label="Client name (optional)" hint="Only with the client's written permission.">
                  <input value={form.client} onChange={setInput("client")} className={inputClass} />
                </Field>
                {form.client.trim() && (
                  <label className="flex items-start gap-3 rounded-2xl bg-orange/10 p-4 text-sm text-navy">
                    <input type="checkbox" checked={form.clientPermission} onChange={setInput("clientPermission")} className="mt-0.5 h-5 w-5 flex-none accent-[#E28A2E]" />
                    The client has agreed in writing to be named on the website.
                  </label>
                )}
                <div>
                  <span className="text-sm font-semibold text-navy">Results (optional)</span>
                  <span className="mt-0.5 block text-xs text-navy/50">One result per line, e.g. &quot;Traceability system in use at 3 sites&quot;.</span>
                  <div className="mt-2 space-y-2">
                    {form.outcomes.map((outcome, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          value={outcome}
                          onChange={(event) => set("outcomes")(form.outcomes.map((item, j) => (j === i ? event.target.value : item)))}
                          className={inputClass}
                        />
                        {form.outcomes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => set("outcomes")(form.outcomes.filter((_, j) => j !== i))}
                            aria-label="Remove result"
                            className="grid w-11 flex-none place-items-center rounded-2xl text-red-700 hover:bg-red-50"
                          >
                            <Icon name="close" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => set("outcomes")([...form.outcomes, ""])} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-orange">
                    <Icon name="plus" /> Add a result
                  </button>
                </div>
              </Section>

              <Section number={4} title="Photos" hint="The first photo is the main one.">
                <Photos media={form.media} onChange={set("media")} />
              </Section>
            </>
          ) : (
            <>
              <Section number={1} title="The update" hint="When and what kind of news.">
                <Field label="Date">
                  <input type="date" value={form.date} onChange={setInput("date")} className={inputClass} />
                </Field>
                <div>
                  <span className="text-sm font-semibold text-navy">Category</span>
                  <div className="mt-2">
                    <Chips value={form.category} onChange={set("category")} options={updateCategories.map((key) => ({ value: key, label: CATEGORY_LABELS[key] }))} />
                  </div>
                </div>
              </Section>

              <Section number={2} title="The story">
                <LangField label="Headline" value={form.title} onChange={set("title")} translations={translations} />
                <LangField label="Summary" hint="One or two sentences." value={form.summary} onChange={set("summary")} multiline translations={translations} />
                <Field label="Link to the full article (optional)" hint="A web address starting with https://">
                  <input type="url" inputMode="url" value={form.url} onChange={setInput("url")} className={inputClass} placeholder="https://" />
                </Field>
              </Section>

              <Section number={3} title="Cover photo" hint="Optional.">
                <Photos media={form.media} onChange={set("media")} single />
              </Section>
            </>
          )}
        </div>

        <aside className="hidden lg:sticky lg:top-6 lg:block">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-navy/45">Preview on the website</p>
          <Preview type={type} form={form} services={SERVICES} />
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-navy/10 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <AnimatePresence>
            {error && (
              <motion.div
                role="alert"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mb-3 max-h-40 overflow-y-auto rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                <p className="font-semibold">{error.message}</p>
                {error.problems?.length > 0 && (
                  <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
                    {error.problems.map((problem) => (
                      <li key={problem}>{problem}</li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="rounded-full border-2 border-navy/15 px-6 py-3 font-display font-semibold text-navy transition hover:border-navy/40">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="group flex flex-1 items-center justify-center gap-3 rounded-full bg-navy py-3 font-display font-semibold text-white transition hover:bg-navy-light disabled:opacity-60"
            >
              {saving ? "Saving…" : form.id ? "Save changes" : "Publish"}
              {!saving && (
                <span className="grid h-7 w-7 place-items-center rounded-full bg-orange text-navy transition-transform group-hover:-rotate-45">
                  <Icon name="arrow" className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.form>
  );
}

function EntryCard({ type, entry, onEdit, onDelete, deleting, services }) {
  const [confirming, setConfirming] = useState(false);
  const isProject = type === "projects";
  const title = plain(isProject ? entry.name : entry.title);
  const photo = isProject ? entry.media?.[0] : entry.cover;
  const service = services.find((item) => item.slug === entry.service);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, ease }}
      className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_18px_40px_-30px_rgba(14,41,62,0.45)]"
    >
      <div className="flex gap-4 p-3 sm:p-4">
        <div className="h-24 w-24 flex-none overflow-hidden rounded-2xl bg-[#eef2f6] sm:h-28 sm:w-36">
          {photo ? (
            <img src={photo.src} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-navy/25">
              <Icon name={isProject ? "project" : "news"} className="h-8 w-8" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 py-1">
          <div className="flex flex-wrap gap-1.5">
            {isProject ? (
              <>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${entry.status === "ongoing" ? "bg-navy text-white" : "bg-navy/[0.07] text-navy"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${entry.status === "ongoing" ? "animate-pulse bg-orange" : "bg-navy/40"}`} />
                  {entry.status === "ongoing" ? "Ongoing" : "Completed"}
                </span>
                {service && <span className="hidden rounded-full bg-orange/15 px-2.5 py-1 text-[11px] font-semibold text-navy sm:inline">{service.title}</span>}
              </>
            ) : (
              <span className="rounded-full bg-orange/15 px-2.5 py-1 text-[11px] font-semibold text-navy">{CATEGORY_LABELS[entry.category] ?? entry.category}</span>
            )}
          </div>
          <p className="mt-2 line-clamp-2 font-display font-bold leading-snug text-navy">{title}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-navy/50">
            <Icon name={isProject ? "pin" : "calendar"} className="h-3.5 w-3.5" />
            {isProject ? `${plain(entry.location)} · ${entry.year}` : entry.date}
          </p>
        </div>
      </div>
      <div className="flex border-t border-navy/[0.06]">
        <AnimatePresence mode="wait" initial={false}>
          {confirming ? (
            <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-1 items-center gap-2 bg-red-50 px-4 py-2.5">
              <p className="flex-1 text-sm font-semibold text-red-800">Delete from the website?</p>
              <button type="button" onClick={() => setConfirming(false)} className="rounded-full px-3 py-1.5 text-sm font-semibold text-navy">
                Keep
              </button>
              <button type="button" onClick={() => onDelete(entry.id)} disabled={deleting} className="rounded-full bg-red-700 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60">
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </motion.div>
          ) : (
            <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-1">
              <button type="button" onClick={onEdit} className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold text-navy transition hover:bg-navy/[0.03] hover:text-orange">
                <Icon name="edit" /> Edit
              </button>
              <span className="w-px bg-navy/[0.06]" />
              <button type="button" onClick={() => setConfirming(true)} className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold text-navy/55 transition hover:bg-red-50 hover:text-red-700">
                <Icon name="trash" /> Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.li>
  );
}

const TABS = [
  { key: "projects", label: "Projects", icon: "project", text: "Ongoing and completed work" },
  { key: "updates", label: "Updates & news", icon: "news", text: "Industry updates and company news" },
];

const RULES = [
  "Publish only real, documented work.",
  "Name a client only with their written permission.",
  "Report results only when you have evidence.",
  "Use only genuine photos of your own work.",
];

function Toast({ notice, onClose }) {
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [notice, onClose]);

  return (
    <AnimatePresence>
      {notice && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.96 }}
          transition={{ duration: 0.3, ease }}
          className="fixed inset-x-4 bottom-5 z-30 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-navy px-4 py-3.5 text-sm text-white shadow-[0_25px_50px_-20px_rgba(14,41,62,0.8)]"
        >
          <span className={`grid h-8 w-8 flex-none place-items-center rounded-full ${notice.tone === "error" ? "bg-red-500" : "bg-orange text-navy"}`}>
            <Icon name={notice.tone === "error" ? "close" : "check"} />
          </span>
          <p className="flex-1">{notice.text}</p>
          <button type="button" onClick={onClose} aria-label="Dismiss" className="text-white/50 hover:text-white">
            <Icon name="close" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Admin() {
  const [keyValue] = useState(readKey);
  const [tab, setTab] = useState("projects");
  const [content, setContent] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const closeNotice = useCallback(() => setNotice(null), []);

  useEffect(() => {
    document.title = "Website editor · JD Mining Consulting";
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex, nofollow";
    document.head.appendChild(robots);
    return () => robots.remove();
  }, []);

  const load = useCallback(async () => {
    try {
      setContent(await getContent(keyValue));
      setLoadError(null);
    } catch (failure) {
      setLoadError(failure.message);
    }
  }, [keyValue]);

  useEffect(() => {
    if (!keyValue) return undefined;
    let active = true;
    getContent(keyValue)
      .then((data) => active && setContent(data))
      .catch((failure) => active && setLoadError(failure.message));
    return () => {
      active = false;
    };
  }, [keyValue]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [editing]);

  async function remove(id) {
    setDeleting(id);
    try {
      await api(keyValue, "POST", { action: "delete", type: tab, id });
      setNotice({ text: "Deleted. The website updates in about a minute." });
      await load();
    } catch (failure) {
      setNotice({ text: failure.message, tone: "error" });
    } finally {
      setDeleting(null);
    }
  }

  const list = content?.[tab] ?? [];
  const current = TABS.find((item) => item.key === tab);
  const noun = tab === "projects" ? "project" : "update";

  return (
    <div className="min-h-screen bg-[#eef2f6] text-navy">
      <header className="relative overflow-hidden bg-navy text-white">
        <NavyPattern />
        <div className="relative mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <Logo tone="white" showName={false} />
            <div>
              <p className="font-display font-bold leading-tight">Website editor</p>
              <p className="text-xs text-white/55">JD Mining Consulting</p>
            </div>
          </div>
          <Link to="/" className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/20">
            View website <Icon name="arrow" className="h-3.5 w-3.5 text-orange" />
          </Link>
        </div>
        {!editing && keyValue && (
          <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-6 sm:pt-10">
            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="font-display text-3xl font-bold sm:text-4xl">
              What would you like to publish?
            </motion.h1>
            <p className="mt-2 max-w-lg text-sm text-white/60">Add, edit or delete projects and news. Changes appear on the website about a minute after you save.</p>
          </div>
        )}
      </header>

      <main className={`relative mx-auto max-w-5xl px-4 pb-16 ${editing || !keyValue ? "pt-6" : "-mt-12"}`}>
        {!keyValue ? (
          <div className="mx-auto max-w-md rounded-[1.75rem] bg-white p-8 text-center shadow-sm">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-navy text-orange">
              <Icon name="shield" className="h-7 w-7" />
            </span>
            <p className="mt-4 font-display text-xl font-bold">This page needs your private link</p>
            <p className="mt-2 text-sm text-navy/60">Open the editor link you were given (it ends with #key=…). After that, this browser remembers it.</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {editing ? (
              <Editor
                key={editing.entry?.id ?? "new"}
                type={tab}
                entry={editing.entry}
                keyValue={keyValue}
                onCancel={() => setEditing(null)}
                onDone={(message) => {
                  setEditing(null);
                  setNotice({ text: `${message} The website updates in about a minute.` });
                  load();
                }}
              />
            ) : (
              <motion.div key="dashboard" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35, ease }}>
                <div className="grid grid-cols-2 gap-3">
                  {TABS.map((item) => {
                    const active = item.key === tab;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setTab(item.key)}
                        aria-pressed={active}
                        className={`relative overflow-hidden rounded-[1.75rem] p-4 text-left transition-colors sm:p-6 ${
                          active ? "bg-white text-navy shadow-[0_25px_50px_-30px_rgba(14,41,62,0.6)]" : "bg-[#f7f9fb] text-navy/55 shadow-[0_18px_40px_-30px_rgba(14,41,62,0.45)] hover:text-navy"
                        }`}
                      >
                        <span className={`grid h-11 w-11 place-items-center rounded-2xl transition-colors ${active ? "bg-orange text-navy" : "bg-navy/[0.06]"}`}>
                          <Icon name={item.icon} className="h-5 w-5" />
                        </span>
                        <span className="mt-4 flex items-baseline justify-between gap-2">
                          <span className="font-display text-base font-bold sm:text-lg">{item.label}</span>
                          <span className="font-display text-2xl font-bold text-orange sm:text-3xl">{content ? content[item.key].length : "–"}</span>
                        </span>
                        <span className="mt-1 hidden text-xs text-navy/50 sm:block">{item.text}</span>
                        {active && <motion.span layoutId="admin-tab" className="absolute inset-x-6 bottom-0 h-1 rounded-t-full bg-orange" />}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_18rem]">
                  <div>
                    <button
                      type="button"
                      onClick={() => setEditing({ entry: null })}
                      className="group flex w-full items-center gap-4 rounded-[1.75rem] bg-orange p-4 text-left text-navy shadow-[0_20px_40px_-25px_rgba(226,138,46,0.9)] transition hover:bg-orange-light sm:p-5"
                    >
                      <span className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-navy text-white transition-transform group-hover:rotate-90">
                        <Icon name="plus" className="h-6 w-6" />
                      </span>
                      <span className="flex-1">
                        <span className="block font-display text-lg font-bold">Add a new {noun}</span>
                        <span className="text-sm text-navy/70">Takes about two minutes</span>
                      </span>
                    </button>

                    <p className="mb-3 mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-navy/45">Published {current.label.toLowerCase()}</p>
                    {loadError ? (
                      <div className="rounded-[1.75rem] bg-white p-6 text-sm">
                        <p className="font-semibold text-red-800">{loadError}</p>
                        <button type="button" onClick={load} className="mt-3 rounded-full bg-navy px-5 py-2 font-semibold text-white">
                          Try again
                        </button>
                      </div>
                    ) : !content ? (
                      <div className="space-y-3">
                        {[0, 1].map((i) => (
                          <div key={i} className="h-40 animate-pulse rounded-[1.75rem] bg-white/70" />
                        ))}
                      </div>
                    ) : list.length === 0 ? (
                      <div className="rounded-[1.75rem] border-2 border-dashed border-navy/15 px-6 py-12 text-center">
                        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-navy/30">
                          <Icon name={current.icon} className="h-7 w-7" />
                        </span>
                        <p className="mt-4 font-display text-lg font-bold">No {current.label.toLowerCase()} yet</p>
                        <p className="mt-1 text-sm text-navy/55">Your first {noun} will appear here after you publish it.</p>
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        <AnimatePresence initial={false}>
                          {list.map((entry) => (
                            <EntryCard
                              key={entry.id}
                              type={tab}
                              entry={entry}
                              services={SERVICES}
                              onEdit={() => setEditing({ entry })}
                              onDelete={remove}
                              deleting={deleting === entry.id}
                            />
                          ))}
                        </AnimatePresence>
                      </ul>
                    )}
                  </div>

                  <aside className="rounded-[1.75rem] bg-navy p-6 text-white">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange text-navy">
                      <Icon name="shield" className="h-5 w-5" />
                    </span>
                    <p className="mt-4 font-display text-lg font-bold">Before you publish</p>
                    <ul className="mt-4 space-y-3">
                      {RULES.map((rule) => (
                        <li key={rule} className="flex gap-3 text-sm text-white/75">
                          <Icon name="check" className="mt-0.5 h-4 w-4 flex-none text-orange" />
                          {rule}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-5 border-t border-white/10 pt-4 text-xs text-white/45">Keep this link private. Anyone who has it can publish on the website.</p>
                  </aside>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      <Toast notice={notice} onClose={closeNotice} />
    </div>
  );
}
