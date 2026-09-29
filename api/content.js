import { Buffer } from "node:buffer";
import { timingSafeEqual } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve as resolvePath, sep } from "node:path";
import { validateProjects, validateUpdates } from "../src/data/schema.js";

// Backend for the owner's private /admin editor (a Vercel serverless function). Each save becomes one
// GitHub commit (content JSON + photos), and Vercel redeploys the site from it about a minute later.
//
// Environment variables (Vercel → Project → Settings → Environment Variables):
//   ADMIN_KEY      the secret inside the owner's private link (at least 16 characters)
//   GITHUB_TOKEN   fine-grained token with Contents: read & write on the repository
//   GITHUB_REPO    "owner/repository", e.g. "ATUMANYIRE/JD-Consulting-Cltd"
//   GITHUB_BRANCH  the branch Vercel deploys (default "main")

const TYPES = {
  projects: {
    file: "src/content/projects.json",
    folder: "media/projects",
    fields: ["id", "name", "status", "client", "location", "year", "service", "description", "media", "outcomes"],
    validate: validateProjects,
    label: (entry) => textOf(entry.name),
    sort: (a, b) => (b.year ?? 0) - (a.year ?? 0),
  },
  updates: {
    file: "src/content/updates.json",
    folder: "media/updates",
    fields: ["id", "date", "category", "title", "summary", "cover", "url"],
    validate: validateUpdates,
    label: (entry) => textOf(entry.title),
    sort: (a, b) => String(b.date).localeCompare(String(a.date)),
  },
};
const IMAGE_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;
const MAX_UPLOADS = 8;

class HttpError extends Error {
  constructor(status, message, problems) {
    super(message);
    this.status = status;
    this.problems = problems;
  }
}

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

function mediaOf(entry) {
  return [...(entry?.media ?? []), ...(entry?.cover ? [entry.cover] : [])].map((item) => item.src).filter(Boolean);
}

function authorized(given, expected) {
  if (!expected || expected.length < 16) return false;
  const a = Buffer.from(String(given ?? ""));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function github({ token, repo, branch, fetchImpl }) {
  async function call(path, init = {}) {
    const response = await fetchImpl(`https://api.github.com/repos/${repo}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    if (response.status === 404 && init.allow404) return null;
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new HttpError(response.status === 409 || response.status === 422 ? 409 : 502, `GitHub responded ${response.status}`, detail ? [detail.slice(0, 300)] : undefined);
    }
    return response.status === 204 ? null : response.json();
  }

  return {
    async head() {
      const ref = await call(`/git/ref/heads/${branch}`);
      return ref.object.sha;
    },
    async readList(path, commit) {
      const file = await call(`/contents/${path}?ref=${commit}`, { allow404: true });
      if (!file) return [];
      const list = JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
      if (!Array.isArray(list)) throw new HttpError(500, `${path} is not a list`);
      return list;
    },
    async exists(path, commit) {
      return Boolean(await call(`/contents/${path}?ref=${commit}`, { method: "GET", allow404: true }));
    },
    // One commit with every change; fails with 409 if the branch moved since `parent`.
    async commit(parent, files, message) {
      const base = await call(`/git/commits/${parent}`);
      const tree = [];
      for (const file of files) {
        if (file.delete) {
          tree.push({ path: file.path, mode: "100644", type: "blob", sha: null });
        } else {
          const blob = await call(`/git/blobs`, { method: "POST", body: JSON.stringify({ content: file.content, encoding: file.encoding }) });
          tree.push({ path: file.path, mode: "100644", type: "blob", sha: blob.sha });
        }
      }
      const newTree = await call(`/git/trees`, { method: "POST", body: JSON.stringify({ base_tree: base.tree.sha, tree }) });
      const newCommit = await call(`/git/commits`, { method: "POST", body: JSON.stringify({ message, tree: newTree.sha, parents: [parent] }) });
      await call(`/git/refs/heads/${branch}`, { method: "PATCH", body: JSON.stringify({ sha: newCommit.sha, force: false }) });
      return newCommit.sha;
    },
  };
}

// The same interface over the local working copy, for trying the editor under `npm run dev`
// (see vite.config.js). A "commit" just writes the files; nothing is pushed anywhere.
export function localRepo(root) {
  const base = resolvePath(root);
  const full = (path) => {
    const target = resolvePath(base, path);
    if (!target.startsWith(base + sep)) throw new HttpError(400, "Invalid file path.");
    return target;
  };
  return {
    async head() {
      return "local";
    },
    async readList(path) {
      if (!existsSync(full(path))) return [];
      const list = JSON.parse(await readFile(full(path), "utf8"));
      if (!Array.isArray(list)) throw new HttpError(500, `${path} is not a list`);
      return list;
    },
    async exists(path) {
      return existsSync(full(path));
    },
    async commit(parent, files) {
      for (const file of files) {
        if (file.delete) {
          await rm(full(file.path), { force: true });
        } else {
          await mkdir(dirname(full(file.path)), { recursive: true });
          await writeFile(full(file.path), Buffer.from(file.content, file.encoding === "base64" ? "base64" : "utf8"));
        }
      }
      return "local";
    },
  };
}

function pick(entry, fields) {
  return Object.fromEntries(fields.filter((field) => entry[field] !== undefined && entry[field] !== null && entry[field] !== "").map((field) => [field, entry[field]]));
}

async function save({ repo, type, body }) {
  const config = TYPES[type];
  const parent = await repo.head();
  const list = await repo.readList(config.file, parent);
  const incoming = body.entry;
  if (!incoming || typeof incoming !== "object") throw new HttpError(400, "No entry was sent.");

  const index = incoming.id ? list.findIndex((item) => item.id === incoming.id) : -1;
  if (incoming.id && index === -1) throw new HttpError(404, "That entry no longer exists. Reload the editor.");
  const previous = index >= 0 ? list[index] : null;
  const entry = pick(incoming, config.fields);
  if (!previous) {
    const base = slugify(type === "projects" ? entry.name : entry.title) + (entry.year ? `-${entry.year}` : entry.date ? `-${entry.date.slice(0, 4)}` : "");
    let id = base;
    for (let n = 2; list.some((item) => item.id === id); n++) id = `${base}-${n}`;
    entry.id = id;
  }

  // Photos arrive as base64 and are referenced from the entry as "upload:<index>".
  const uploads = Array.isArray(body.uploads) ? body.uploads : [];
  if (uploads.length > MAX_UPLOADS) throw new HttpError(400, `At most ${MAX_UPLOADS} new photos per save.`);
  const files = [];
  const uploaded = new Map();
  const stamp = Date.now().toString(36);
  uploads.forEach((upload, i) => {
    const ext = IMAGE_TYPES[upload?.contentType];
    if (!ext) throw new HttpError(400, "Photos must be JPEG, PNG or WebP images.");
    const bytes = Buffer.from(String(upload.data ?? ""), "base64");
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new HttpError(400, "Each photo must be smaller than 1.5 MB.");
    const src = `/${config.folder}/${entry.id}-${stamp}-${i + 1}.${ext}`;
    uploaded.set(`upload:${i}`, src);
    files.push({ path: `public${src}`, content: bytes.toString("base64"), encoding: "base64" });
  });
  const resolve = (item) => (item && uploaded.has(item.src) ? { ...item, src: uploaded.get(item.src) } : item);
  if (Array.isArray(entry.media)) entry.media = entry.media.map(resolve);
  if (entry.cover) entry.cover = resolve(entry.cover);

  const next = [...list];
  if (index >= 0) next[index] = entry;
  else next.push(entry);
  next.sort(config.sort);

  // Photos must be newly uploaded, already used by an entry, or already in the repository.
  const known = new Set([...list.flatMap(mediaOf), ...uploaded.values()]);
  const unknown = mediaOf(entry).filter((src) => src.startsWith("/") && !known.has(src));
  for (const src of unknown) if (await repo.exists(`public${src}`, parent)) known.add(src);
  const problems = config.validate(next, { fileExists: (src) => known.has(src) });
  if (problems.length) throw new HttpError(400, "Please fix these problems and save again.", problems);

  // Remove photos this edit dropped, unless another entry still uses them.
  const stillUsed = new Set(next.flatMap(mediaOf));
  for (const src of mediaOf(previous)) {
    if (!stillUsed.has(src) && src.startsWith(`/${config.folder}/`)) files.push({ path: `public${src}`, delete: true });
  }

  files.push({ path: config.file, content: `${JSON.stringify(next, null, 2)}\n`, encoding: "utf-8" });
  const verb = previous ? "Update" : "Add";
  await repo.commit(parent, files, `Website editor: ${verb.toLowerCase()} ${type === "projects" ? "project" : "update"} "${config.label(entry)}"`);
  return { id: entry.id, created: !previous };
}

async function remove({ repo, type, id }) {
  const config = TYPES[type];
  const parent = await repo.head();
  const list = await repo.readList(config.file, parent);
  const entry = list.find((item) => item.id === id);
  if (!entry) throw new HttpError(404, "That entry no longer exists. Reload the editor.");
  const next = list.filter((item) => item.id !== id);
  const stillUsed = new Set(next.flatMap(mediaOf));
  const files = mediaOf(entry)
    .filter((src) => !stillUsed.has(src) && src.startsWith(`/${config.folder}/`))
    .map((src) => ({ path: `public${src}`, delete: true }));
  files.push({ path: config.file, content: `${JSON.stringify(next, null, 2)}\n`, encoding: "utf-8" });
  await repo.commit(parent, files, `Website editor: delete ${type === "projects" ? "project" : "update"} "${config.label(entry)}"`);
  return { id };
}

// `repo` replaces GitHub (e.g. localRepo for local testing); without it the GitHub variables are required.
export function createHandler({ env = process.env, fetchImpl = fetch, repo: fixedRepo } = {}) {
  return async function handler(req, res) {
    const send = (status, payload) => {
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");
      res.end(JSON.stringify(payload));
    };

    try {
      if (!env.ADMIN_KEY || (!fixedRepo && (!env.GITHUB_TOKEN || !env.GITHUB_REPO))) {
        throw new HttpError(503, "The website editor is not set up yet. The developer needs to add ADMIN_KEY, GITHUB_TOKEN and GITHUB_REPO in Vercel.");
      }
      if (!authorized(req.headers["x-admin-key"], env.ADMIN_KEY)) throw new HttpError(401, "This editor link is not valid. Ask the developer for the current private link.");

      const repo = fixedRepo ?? github({ token: env.GITHUB_TOKEN, repo: env.GITHUB_REPO, branch: env.GITHUB_BRANCH || "main", fetchImpl });

      if (req.method === "GET") {
        const head = await repo.head();
        const [projects, updates] = await Promise.all([repo.readList(TYPES.projects.file, head), repo.readList(TYPES.updates.file, head)]);
        return send(200, { projects, updates });
      }
      if (req.method !== "POST") throw new HttpError(405, "Method not allowed.");

      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body ?? {};
      if (!TYPES[body.type]) throw new HttpError(400, 'Unknown content type (expected "projects" or "updates").');

      const run = () => (body.action === "delete" ? remove({ repo, type: body.type, id: body.id }) : save({ repo, type: body.type, body }));
      let result;
      try {
        result = await run();
      } catch (error) {
        // Someone else changed the site at the same moment: start again from the latest version once.
        if (error.status !== 409) throw error;
        result = await run();
      }
      return send(200, { ok: true, ...result });
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      return send(status, { error: error instanceof HttpError ? error.message : "Something went wrong on the server.", problems: error.problems });
    }
  };
}

export default createHandler();
