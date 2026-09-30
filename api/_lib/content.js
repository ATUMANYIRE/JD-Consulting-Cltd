import { validateProjects, validateUpdates } from "../../src/data/schema.js";
import { HttpError } from "./http.js";

// Projects and updates live in the store as two JSON lists, so a save is live the moment it
// succeeds (no rebuild). The public pages read them through GET /api/content; the lists bundled
// from src/content/*.json are only a fallback while that request is loading or if it fails.

export const TYPES = {
  projects: {
    key: "content:projects",
    fields: ["id", "name", "status", "client", "location", "year", "service", "description", "media", "outcomes"],
    validate: validateProjects,
    sort: (a, b) => (b.year ?? 0) - (a.year ?? 0),
  },
  updates: {
    key: "content:updates",
    fields: ["id", "date", "category", "title", "summary", "cover", "url"],
    validate: validateUpdates,
    sort: (a, b) => String(b.date).localeCompare(String(a.date)),
  },
};

const VIDEO_LINK = /^https:\/\/(www\.)?(youtube\.com\/watch\?v=[\w-]{6,}|youtu\.be\/[\w-]{6,}|vimeo\.com\/\d+)/;

function textOf(value) {
  return typeof value === "object" && value ? value.en ?? "" : String(value ?? "");
}

function slugify(text) {
  return (
    textOf(text)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "entry"
  );
}

const mediaOf = (entry) => [...(entry?.media ?? []), ...(entry?.cover ? [entry.cover] : [])];
const srcsOf = (entry) => mediaOf(entry).map((item) => item.src).filter(Boolean);

function pick(entry, fields) {
  return Object.fromEntries(fields.filter((field) => entry[field] !== undefined && entry[field] !== null && entry[field] !== "").map((field) => [field, entry[field]]));
}

// `media` knows where uploads live: `owns(src)` is true for files the editor uploaded (and may
// delete), `exists(src)` checks a local file, and `remove(src)` deletes one.
export function createContent({ store, media }) {
  async function readList(type) {
    const list = await store.get(TYPES[type].key);
    return Array.isArray(list) ? list : [];
  }

  async function checkMedia(entry, previousSrcs) {
    const problems = [];
    for (const item of mediaOf(entry)) {
      const src = String(item.src ?? "");
      if (item.type === "video" && VIDEO_LINK.test(src)) continue;
      if (previousSrcs.has(src)) continue;
      if (media.owns(src) && (await media.exists(src))) continue;
      problems.push(`"${src.slice(0, 80)}" was not uploaded through the editor. Add the photo or video again.`);
    }
    return problems;
  }

  return {
    async read() {
      const [projects, updates] = await Promise.all([readList("projects"), readList("updates")]);
      return { projects, updates };
    },

    async save(type, incoming) {
      const config = TYPES[type];
      if (!incoming || typeof incoming !== "object") throw new HttpError(400, "No entry was sent.");
      const list = await readList(type);
      const index = incoming.id ? list.findIndex((item) => item.id === incoming.id) : -1;
      if (incoming.id && index === -1) throw new HttpError(404, "That entry no longer exists. Reload the editor.");
      const previous = index >= 0 ? list[index] : null;

      const entry = pick(incoming, config.fields);
      if (!previous) {
        const base = slugify(type === "projects" ? entry.name : entry.title) + (entry.year ? `-${entry.year}` : entry.date ? `-${String(entry.date).slice(0, 4)}` : "");
        let id = base;
        for (let n = 2; list.some((item) => item.id === id); n++) id = `${base}-${n}`;
        entry.id = id;
      }

      const next = [...list];
      if (index >= 0) next[index] = entry;
      else next.push(entry);
      next.sort(config.sort);

      const problems = [...(await checkMedia(entry, new Set(srcsOf(previous)))), ...config.validate(next, {})];
      if (problems.length) throw new HttpError(400, "Please fix these problems and save again.", problems);

      await store.set(config.key, next);
      await this.cleanup(srcsOf(previous));
      return { id: entry.id, created: !previous };
    },

    async remove(type, id) {
      const list = await readList(type);
      const entry = list.find((item) => item.id === id);
      if (!entry) throw new HttpError(404, "That entry no longer exists. Reload the editor.");
      const next = list.filter((item) => item.id !== id);
      await store.set(TYPES[type].key, next);
      await this.cleanup(srcsOf(entry));
      return { id };
    },

    // Delete uploaded files that no entry uses any more. A failure here never undoes the save.
    async cleanup(srcs) {
      if (!srcs.length) return;
      const { projects, updates } = await this.read();
      const used = new Set([...projects, ...updates].flatMap(srcsOf));
      for (const src of srcs) {
        if (used.has(src) || !media.owns(src)) continue;
        try {
          await media.remove(src);
        } catch (error) {
          console.error("Could not delete media", src, error);
        }
      }
    },
  };
}
