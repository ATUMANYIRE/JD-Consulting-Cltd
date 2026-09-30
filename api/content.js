import { TYPES } from "./_lib/content.js";
import { HttpError, assertSameSite, readJson, send, sendError } from "./_lib/http.js";
import { setup } from "./_lib/setup.js";

// Projects and updates.
//   GET                                          → { projects, updates } (public: the website reads this)
//   POST { action: "save", type, entry }          (signed-in administrators only)
//   POST { action: "delete", type, id }
export function createContentHandler(options) {
  return async function handler(req, res) {
    try {
      const api = setup(options);
      api.assertReady();
      if (req.method === "GET") return send(res, 200, await api.content.read());
      if (req.method !== "POST") throw new HttpError(405, "Method not allowed.");
      assertSameSite(req);
      await api.auth.require(req);
      const body = await readJson(req);
      if (!TYPES[body.type]) throw new HttpError(400, 'Unknown content type (expected "projects" or "updates").');
      const result = body.action === "delete" ? await api.content.remove(body.type, body.id) : await api.content.save(body.type, body.entry);
      return send(res, 200, { ok: true, ...result });
    } catch (error) {
      sendError(res, error);
    }
  };
}

export default createContentHandler();
