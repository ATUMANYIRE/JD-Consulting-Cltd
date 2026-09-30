// Small helpers shared by the /api functions. Files under api/_lib are never deployed as endpoints.

export class HttpError extends Error {
  constructor(status, message, problems) {
    super(message);
    this.status = status;
    this.problems = problems;
  }
}

export function send(res, status, payload, headers = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
  res.end(JSON.stringify(payload));
}

export function sendError(res, error) {
  const known = error instanceof HttpError;
  if (!known) console.error(error);
  send(res, known ? error.status : 500, { error: known ? error.message : "Something went wrong on the server.", problems: error.problems });
}

// Vercel parses JSON bodies into req.body; the local dev server passes the raw string.
export async function readJson(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  let raw = typeof req.body === "string" ? req.body : "";
  if (!raw && req.body === undefined) {
    for await (const chunk of req) raw += chunk;
  }
  try {
    return JSON.parse(raw || "{}");
  } catch {
    throw new HttpError(400, "The request was not valid JSON.");
  }
}

export function readCookie(req, name) {
  const header = req.headers.cookie ?? "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

// Changes must come from this site's own pages: a JSON content type (which forces a CORS preflight
// from any other origin) and, when the browser sends one, an Origin matching this host.
export function assertSameSite(req) {
  if (!String(req.headers["content-type"] ?? "").includes("application/json")) throw new HttpError(415, "Expected JSON.");
  const origin = req.headers.origin;
  if (origin) {
    let host;
    try {
      host = new URL(origin).host;
    } catch {
      throw new HttpError(403, "Request refused.");
    }
    if (host !== req.headers.host && host !== req.headers["x-forwarded-host"]) throw new HttpError(403, "Request refused.");
  }
}

export function clientIp(req) {
  return String(req.headers["x-forwarded-for"] ?? req.socket?.remoteAddress ?? "unknown").split(",")[0].trim();
}
