import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import { useServices } from "../i18n/context";
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
  "w-full rounded-xl border-2 border-navy/15 bg-white px-3.5 py-2.5 text-base text-navy outline-none transition focus:border-orange sm:text-sm";

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-navy">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-navy/55">{hint}</span>}
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

function LangField({ label, hint, value, onChange, multiline, translations, required = true }) {
  const Tag = multiline ? "textarea" : "input";
  const set = (lang) => (event) => onChange({ ...value, [lang]: event.target.value });
  return (
    <div className="space-y-2">
      <Field label={`${label}${required ? "" : " (optional)"}`} hint={hint}>
        <Tag value={value.en} onChange={set("en")} rows={multiline ? 4 : undefined} className={inputClass} placeholder="English" />
      </Field>
      {translations && (
        <div className="grid gap-2 border-l-4 border-orange/40 pl-3 sm:grid-cols-2">
          <Tag value={value.fr} onChange={set("fr")} rows={multiline ? 4 : undefined} className={inputClass} placeholder="Français (optional)" lang="fr" />
          <Tag value={value.rw} onChange={set("rw")} rows={multiline ? 4 : undefined} className={inputClass} placeholder="Kinyarwanda (optional)" lang="rw" />
        </div>
      )}
    </div>
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
    <div className="space-y-3">
      {media.map((item, i) => (
        <div key={item.src ?? item.preview} className="flex gap-3 rounded-2xl border-2 border-navy/10 p-2.5">
          <img src={item.preview ?? item.src} alt="" className="h-20 w-20 flex-none rounded-xl bg-navy/5 object-cover" />
          <div className="min-w-0 flex-1 space-y-2">
            <input value={item.alt} onChange={(event) => update(i, { alt: event.target.value })} className={inputClass} placeholder="Describe the photo (required)" />
            {!single && <input value={item.caption} onChange={(event) => update(i, { caption: event.target.value })} className={inputClass} placeholder="Caption (optional)" />}
          </div>
          <button type="button" onClick={() => onChange(media.filter((_, j) => j !== i))} className="self-start rounded-full px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50">
            Remove
          </button>
        </div>
      ))}
      {media.length < limit && (
        <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-navy/20 px-4 py-4 text-sm font-semibold text-navy transition hover:border-orange ${busy ? "opacity-60" : ""}`}>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple={!single} onChange={add} disabled={busy} className="sr-only" />
          {busy ? "Preparing photos…" : single ? "+ Add a cover photo" : "+ Add photos"}
        </label>
      )}
      <p className="text-xs text-navy/50">Only genuine photos from JD Mining Consulting&apos;s own work. Photos are resized automatically.</p>
    </div>
  );
}

function Editor({ type, entry, keyValue, onDone, onCancel }) {
  const services = useServices();
  const [form, setForm] = useState(() => toForm(type, entry));
  const [translations, setTranslations] = useState(() => {
    const f = toForm(type, entry);
    return [f.name, f.description, f.title, f.summary].some((value) => value && (value.fr || value.rw));
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const setInput = (key) => (event) => set(key)(event.target.type === "checkbox" ? event.target.checked : event.target.value);

  async function submit(event) {
    event.preventDefault();
    setError(null);
    const local = [];
    if (type === "projects") {
      if (!form.service) local.push("Choose the service provided.");
      if (!form.status) local.push("Choose whether the project is ongoing or completed.");
      if (form.client.trim() && !form.clientPermission) local.push("Tick the box confirming the client has agreed to be named, or leave the client empty.");
    } else if (!form.category) local.push("Choose a category.");
    if (form.media.some((item) => !item.alt.trim())) local.push("Describe every photo in a few words.");
    if (local.length) return setError({ message: "Please check the form:", problems: local });

    setSaving(true);
    try {
      const { entry: payload, uploads } = toRequest(type, form);
      await api(keyValue, "POST", { action: "save", type, entry: payload, uploads });
      onDone(form.id ? "Saved." : "Published.");
    } catch (failure) {
      setError({ message: failure.message, problems: failure.problems?.map((problem) => problem.replace(/^[^:]+: /, "")) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6 rounded-3xl border-2 border-navy/10 bg-white p-5 sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-navy">{form.id ? "Edit" : "New"} {type === "projects" ? "project" : "update"}</h2>
        <button type="button" onClick={onCancel} className="text-sm font-semibold text-navy/60 hover:text-navy">
          Cancel
        </button>
      </div>

      <label className="flex items-center gap-2.5 rounded-xl bg-navy/[0.04] px-3.5 py-2.5 text-sm text-navy">
        <input type="checkbox" checked={translations} onChange={(event) => setTranslations(event.target.checked)} className="h-4 w-4 accent-[#E28A2E]" />
        Also write French and Kinyarwanda versions (otherwise the English shows in every language)
      </label>

      {type === "projects" ? (
        <>
          <LangField label="Project name" value={form.name} onChange={set("name")} translations={translations} />
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <Field label="Location" hint="District and country, e.g. Rulindo, Rwanda">
              <input value={form.location} onChange={setInput("location")} className={inputClass} />
            </Field>
            <Field label="Year">
              <input type="number" min="2000" max="2100" value={form.year} onChange={setInput("year")} className={inputClass} />
            </Field>
          </div>
          <Field label="Status" hint="Ongoing projects use the year they started.">
            <select value={form.status} onChange={setInput("status")} className={inputClass}>
              <option value="">Choose a status…</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </Field>
          <Field label="Service provided">
            <select value={form.service} onChange={setInput("service")} className={inputClass}>
              <option value="">Choose a service…</option>
              {services.map((service) => (
                <option key={service.slug} value={service.slug}>
                  {service.title}
                </option>
              ))}
            </select>
          </Field>
          <LangField label="What was done" hint="Two or three sentences." value={form.description} onChange={set("description")} multiline translations={translations} />
          <div className="space-y-2">
            <Field label="Client (optional)" hint="Name a client only with their written permission.">
              <input value={form.client} onChange={setInput("client")} className={inputClass} />
            </Field>
            {form.client.trim() && (
              <label className="flex items-start gap-2.5 text-sm text-navy">
                <input type="checkbox" checked={form.clientPermission} onChange={setInput("clientPermission")} className="mt-0.5 h-4 w-4 accent-[#E28A2E]" />
                The client has agreed in writing to be named on the website.
              </label>
            )}
          </div>
          <div className="space-y-2">
            <span className="text-sm font-semibold text-navy">Results (optional)</span>
            <span className="block text-xs text-navy/55">Only results you can back up with evidence.</span>
            {form.outcomes.map((outcome, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={outcome}
                  onChange={(event) => set("outcomes")(form.outcomes.map((item, j) => (j === i ? event.target.value : item)))}
                  className={inputClass}
                />
                {form.outcomes.length > 1 && (
                  <button type="button" onClick={() => set("outcomes")(form.outcomes.filter((_, j) => j !== i))} className="px-2 text-sm font-semibold text-red-700">
                    ×
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => set("outcomes")([...form.outcomes, ""])} className="text-sm font-semibold text-orange">
              + Add a result
            </button>
          </div>
          <div className="space-y-2">
            <span className="text-sm font-semibold text-navy">Photos</span>
            <Photos media={form.media} onChange={set("media")} />
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date">
              <input type="date" value={form.date} onChange={setInput("date")} className={inputClass} />
            </Field>
            <Field label="Category">
              <select value={form.category} onChange={setInput("category")} className={inputClass}>
                <option value="">Choose a category…</option>
                {updateCategories.map((key) => (
                  <option key={key} value={key}>
                    {CATEGORY_LABELS[key]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <LangField label="Headline" value={form.title} onChange={set("title")} translations={translations} />
          <LangField label="Summary" hint="One or two sentences." value={form.summary} onChange={set("summary")} multiline translations={translations} />
          <Field label="Link to the full article (optional)" hint="A web address starting with https://">
            <input type="url" value={form.url} onChange={setInput("url")} className={inputClass} placeholder="https://" />
          </Field>
          <div className="space-y-2">
            <span className="text-sm font-semibold text-navy">Cover photo (optional)</span>
            <Photos media={form.media} onChange={set("media")} single />
          </div>
        </>
      )}

      {error && (
        <div role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-semibold">{error.message}</p>
          {error.problems?.length > 0 && (
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
              {error.problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <button type="submit" disabled={saving} className="w-full rounded-full bg-navy py-3.5 font-display font-semibold text-white transition hover:bg-navy-light disabled:opacity-60">
        {saving ? "Saving…" : form.id ? "Save changes" : "Publish"}
      </button>
    </form>
  );
}

function EntryRow({ type, entry, onEdit, onDelete, deleting }) {
  const [confirming, setConfirming] = useState(false);
  const title = plain(type === "projects" ? entry.name : entry.title);
  const meta = type === "projects" ? `${plain(entry.location)} · ${entry.year}${entry.status ? ` · ${entry.status}` : ""}` : `${entry.date} · ${CATEGORY_LABELS[entry.category] ?? entry.category}`;
  return (
    <li className="flex flex-col gap-3 rounded-2xl border-2 border-navy/10 bg-white p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-navy">{title}</p>
        <p className="mt-0.5 text-sm text-navy/55">{meta}</p>
      </div>
      <div className="flex gap-2">
        {confirming ? (
          <>
            <button type="button" onClick={() => onDelete(entry.id)} disabled={deleting} className="rounded-full bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {deleting ? "Deleting…" : "Yes, delete"}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="rounded-full border-2 border-navy/15 px-4 py-2 text-sm font-semibold text-navy">
              Keep
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={onEdit} className="rounded-full border-2 border-navy/15 px-4 py-2 text-sm font-semibold text-navy hover:border-orange">
              Edit
            </button>
            <button type="button" onClick={() => setConfirming(true)} className="rounded-full px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
              Delete
            </button>
          </>
        )}
      </div>
    </li>
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

  async function remove(id) {
    setDeleting(id);
    try {
      await api(keyValue, "POST", { action: "delete", type: tab, id });
      setNotice("Deleted. The website will update in about a minute.");
      await load();
    } catch (failure) {
      setNotice(failure.message);
    } finally {
      setDeleting(null);
    }
  }

  const list = content?.[tab] ?? [];

  return (
    <div className="min-h-screen bg-[#f3f6f9] pb-16 text-navy">
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo tone="white" showName={false} />
            <div>
              <p className="font-display font-bold leading-tight">Website editor</p>
              <p className="text-xs text-white/60">JD Mining Consulting</p>
            </div>
          </div>
          <Link to="/" className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold hover:border-orange">
            View website
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 pt-6">
        {!keyValue ? (
          <div className="rounded-3xl bg-white p-6 text-center">
            <p className="text-lg font-bold">This page needs the private editor link.</p>
            <p className="mt-2 text-sm text-navy/60">Open the link you were given (it ends with #key=…). After that, this browser remembers it.</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border-l-4 border-orange bg-white px-4 py-3 text-sm text-navy/75">
              Publish only real, documented work. Name a client only with their written permission, and report results only when you have evidence. Changes appear on the website about a minute after saving.
            </div>

            {notice && (
              <p role="status" className="flex items-start justify-between gap-3 rounded-2xl bg-orange/15 px-4 py-3 text-sm font-semibold">
                {notice}
                <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className="text-navy/50">
                  ×
                </button>
              </p>
            )}

            {editing ? (
              <Editor
                key={editing.entry?.id ?? "new"}
                type={tab}
                entry={editing.entry}
                keyValue={keyValue}
                onCancel={() => setEditing(null)}
                onDone={(message) => {
                  setEditing(null);
                  setNotice(`${message} The website will update in about a minute.`);
                  load();
                }}
              />
            ) : (
              <>
                <div className="flex gap-2">
                  {[
                    ["projects", "Projects"],
                    ["updates", "Updates & news"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTab(key)}
                      className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors ${tab === key ? "bg-navy text-white" : "bg-white text-navy"}`}
                    >
                      {label}
                      {content && <span className="ml-1.5 opacity-60">{content[key].length}</span>}
                    </button>
                  ))}
                </div>

                <button type="button" onClick={() => setEditing({ entry: null })} className="w-full rounded-full bg-orange py-3.5 font-display font-semibold text-navy transition hover:bg-orange-light">
                  + New {tab === "projects" ? "project" : "update"}
                </button>

                {loadError ? (
                  <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
                    <p className="font-semibold">{loadError}</p>
                    <button type="button" onClick={load} className="mt-2 font-semibold underline">
                      Try again
                    </button>
                  </div>
                ) : !content ? (
                  <p className="text-center text-sm text-navy/50">Loading…</p>
                ) : list.length === 0 ? (
                  <p className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-navy/55">Nothing published yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {list.map((entry) => (
                      <EntryRow key={entry.id} type={tab} entry={entry} onEdit={() => setEditing({ entry })} onDelete={remove} deleting={deleting === entry.id} />
                    ))}
                  </ul>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
