import { createAuth } from "./auth.js";
import { createContent } from "./content.js";
import { HttpError } from "./http.js";
import { blobMedia } from "./media.js";
import { storeFromEnv } from "./store.js";

// Builds everything the /api functions need from the environment variables set in Vercel:
//   KV_REST_API_URL, KV_REST_API_TOKEN   Upstash Redis (Vercel → Storage → Upstash for Redis)
//   BLOB_READ_WRITE_TOKEN                Vercel Blob (Vercel → Storage → Blob, public access)
//   ADMIN_SETUP_CODE                     code needed to create an administrator or reset a password
// Tests and `npm run dev` pass their own `store` and `media` instead.
export function setup({ env = process.env, store, media, fetchImpl, secureCookies = true } = {}) {
  store ??= storeFromEnv(env, fetchImpl);
  media ??= env.BLOB_READ_WRITE_TOKEN ? blobMedia({ token: env.BLOB_READ_WRITE_TOKEN }) : null;
  const missing = [...(store ? [] : ["KV_REST_API_URL / KV_REST_API_TOKEN (Upstash Redis)"]), ...(media ? [] : ["BLOB_READ_WRITE_TOKEN (Vercel Blob)"])];
  return {
    store,
    media,
    ready: missing.length === 0,
    assertReady() {
      if (missing.length) throw new HttpError(503, `The website editor is not set up yet. The developer needs to connect: ${missing.join(", ")}.`);
    },
    auth: store ? createAuth({ store, setupCode: env.ADMIN_SETUP_CODE, secureCookies }) : null,
    content: store && media ? createContent({ store, media }) : null,
  };
}
