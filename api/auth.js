import { HttpError, assertSameSite, readJson, send, sendError } from "./_lib/http.js";
import { setup } from "./_lib/setup.js";

// Administrator sign-in for /admin.
//   GET                               → { user, uploads, ready }
//   POST { action: "login", email, password }
//   POST { action: "signup", name, email, password, code }   (code = ADMIN_SETUP_CODE; also resets a password)
//   POST { action: "logout" }
export function createAuthHandler(options) {
  return async function handler(req, res) {
    try {
      const api = setup(options);
      if (req.method === "GET") {
        const user = api.auth ? await api.auth.current(req) : null;
        return send(res, 200, { user, ready: api.ready, uploads: api.media?.mode ?? null });
      }
      if (req.method !== "POST") throw new HttpError(405, "Method not allowed.");
      assertSameSite(req);
      api.assertReady();
      const body = await readJson(req);
      if (body.action === "logout") return send(res, 200, { ok: true }, { "Set-Cookie": await api.auth.logout(req) });
      if (body.action === "login") {
        const { user, cookie } = await api.auth.login(req, body);
        return send(res, 200, { user }, { "Set-Cookie": cookie });
      }
      if (body.action === "signup") {
        const { user, reset, cookie } = await api.auth.signup(req, body);
        return send(res, 200, { user, reset }, { "Set-Cookie": cookie });
      }
      throw new HttpError(400, "Unknown action.");
    } catch (error) {
      sendError(res, error);
    }
  };
}

export default createAuthHandler();
