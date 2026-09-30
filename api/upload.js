import { HttpError, assertSameSite, readJson, send, sendError } from "./_lib/http.js";
import { UPLOAD_PATH, UPLOAD_TYPES } from "./_lib/media.js";
import { setup } from "./_lib/setup.js";

// Photo and video uploads from the /admin editor (signed-in administrators only).
// Vercel Blob: the browser's upload() asks this endpoint for a short-lived token, then sends the
// file straight to Blob storage. Local dev: the browser POSTs the raw bytes here instead.
export function createUploadHandler(options) {
  return async function handler(req, res) {
    try {
      const api = setup(options);
      api.assertReady();
      if (req.method !== "POST") throw new HttpError(405, "Method not allowed.");
      await api.auth.require(req);

      if (api.media.mode === "local") {
        const url = new URL(req.url, "http://localhost");
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const src = await api.media.write(url.searchParams.get("folder"), String(req.headers["content-type"] ?? "").split(";")[0], Buffer.concat(chunks));
        return send(res, 200, { url: src });
      }

      assertSameSite(req);
      const body = await readJson(req);
      if (body.type !== "blob.generate-client-token") throw new HttpError(400, "Unsupported upload event.");
      const { handleUpload } = await import("@vercel/blob/client");
      const result = await handleUpload({
        body,
        request: req,
        token: api.media.token,
        onBeforeGenerateToken: async (pathname, clientPayload) => {
          const contentType = JSON.parse(clientPayload || "{}").contentType;
          const type = UPLOAD_TYPES[contentType];
          if (!type || !UPLOAD_PATH.test(pathname)) throw new HttpError(400, "Photos must be JPEG, PNG or WebP; videos MP4, WebM or MOV.");
          return { allowedContentTypes: [contentType], maximumSizeInBytes: type.max, addRandomSuffix: true };
        },
      });
      return send(res, 200, result);
    } catch (error) {
      sendError(res, error);
    }
  };
}

export default createUploadHandler();
