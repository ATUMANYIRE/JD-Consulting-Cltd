import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { HttpError } from "./http.js";

// Where the editor's photos and videos go. The browser uploads straight to Vercel Blob (so large
// videos never pass through a serverless function); under `npm run dev` they go to public/media/.

export const UPLOAD_TYPES = {
  "image/jpeg": { ext: "jpg", max: 10 * 1024 * 1024 },
  "image/png": { ext: "png", max: 10 * 1024 * 1024 },
  "image/webp": { ext: "webp", max: 10 * 1024 * 1024 },
  "video/mp4": { ext: "mp4", max: 250 * 1024 * 1024 },
  "video/webm": { ext: "webm", max: 250 * 1024 * 1024 },
  "video/quicktime": { ext: "mov", max: 250 * 1024 * 1024 },
};

// "media/projects/…" or "media/updates/…", lowercase letters, digits, dots and dashes only.
export const UPLOAD_PATH = /^media\/(projects|updates)\/[a-z0-9][a-z0-9._-]{0,100}$/;

export function blobMedia({ token }) {
  const owns = (src) => {
    try {
      const url = new URL(src);
      return url.protocol === "https:" && url.hostname.endsWith(".public.blob.vercel-storage.com") && url.pathname.startsWith("/media/");
    } catch {
      return false;
    }
  };
  return {
    mode: "blob",
    token,
    owns,
    async exists(src) {
      const { head } = await import("@vercel/blob");
      try {
        await head(src, { token });
        return true;
      } catch {
        return false;
      }
    },
    async remove(src) {
      const { del } = await import("@vercel/blob");
      await del(src, { token });
    },
  };
}

export function localMedia(root) {
  const base = resolve(root, "public");
  const full = (src) => {
    const target = resolve(base, `.${src}`);
    if (!target.startsWith(base + sep)) throw new HttpError(400, "Invalid file path.");
    return target;
  };
  return {
    mode: "local",
    owns: (src) => typeof src === "string" && src.startsWith("/media/") && !src.includes(".."),
    exists: async (src) => existsSync(full(src)),
    remove: (src) => rm(full(src), { force: true }),
    // Local stand-in for the Blob upload: the browser sends the raw file bytes.
    async write(folder, contentType, bytes) {
      const type = UPLOAD_TYPES[contentType];
      if (!type) throw new HttpError(400, "Photos must be JPEG, PNG or WebP; videos MP4, WebM or MOV.");
      if (!["projects", "updates"].includes(folder)) throw new HttpError(400, "Unknown folder.");
      if (!bytes.length || bytes.length > type.max) throw new HttpError(400, "That file is too large.");
      const src = `/media/${folder}/${Date.now().toString(36)}-${randomBytes(4).toString("hex")}.${type.ext}`;
      await mkdir(dirname(full(src)), { recursive: true });
      await writeFile(full(src), bytes);
      return src;
    },
  };
}
