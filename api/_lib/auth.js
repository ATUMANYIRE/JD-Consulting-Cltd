import { Buffer } from "node:buffer";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { HttpError, clientIp, readCookie } from "./http.js";

// Administrator accounts for /admin. Visitors never sign up: creating an account (or resetting a
// forgotten password) needs the setup code that only the developer and the owner hold
// (ADMIN_SETUP_CODE). Passwords are hashed with scrypt; sessions are random tokens kept in an
// HttpOnly cookie that is only sent to /api, and stored hashed.

const scryptAsync = promisify(scrypt);
const COOKIE = "jd_admin";
const SESSION_DAYS = 30;
const MIN_PASSWORD = 10;
const LOGIN_LIMIT = 8; // failed attempts per email per 15 minutes
const IP_LIMIT = 30;

const userKey = (email) => `admin:user:${email}`;
const sessionKey = (token) => `admin:session:${createHash("sha256").update(token).digest("hex")}`;
const normalizeEmail = (email) => String(email ?? "").trim().toLowerCase();

function equal(a, b) {
  const x = Buffer.from(String(a ?? ""));
  const y = Buffer.from(String(b ?? ""));
  return x.length === y.length && timingSafeEqual(x, y);
}

async function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = (await scryptAsync(password, salt, 64)).toString("hex");
  return { salt, hash };
}

function cookieHeader(value, maxAge, secure) {
  return `${COOKIE}=${value}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}

export function createAuth({ store, setupCode, secureCookies = true }) {
  async function throttle(req, email) {
    const [byEmail, byIp] = await Promise.all([store.incr(`admin:fail:${email}`, 900), store.incr(`admin:fail-ip:${clientIp(req)}`, 900)]);
    if (byEmail > LOGIN_LIMIT || byIp > IP_LIMIT) throw new HttpError(429, "Too many attempts. Wait 15 minutes and try again.");
  }

  async function startSession(email) {
    const token = randomBytes(32).toString("base64url");
    await store.set(sessionKey(token), { email }, { ttl: SESSION_DAYS * 86400 });
    return cookieHeader(token, SESSION_DAYS * 86400, secureCookies);
  }

  return {
    async signup(req, { name, email, password, code }) {
      email = normalizeEmail(email);
      if (!setupCode || setupCode.length < 12) throw new HttpError(503, "Account creation is not set up yet. The developer needs to add ADMIN_SETUP_CODE in Vercel.");
      await throttle(req, email || "signup");
      if (!equal(code, setupCode)) throw new HttpError(403, "The setup code is not correct.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Enter a valid email address.");
      if (String(password ?? "").length < MIN_PASSWORD) throw new HttpError(400, `Choose a password of at least ${MIN_PASSWORD} characters.`);
      const existing = await store.get(userKey(email));
      const { salt, hash } = await hashPassword(String(password));
      const user = { email, name: String(name ?? "").trim().slice(0, 80) || existing?.name || email, salt, hash, createdAt: existing?.createdAt ?? new Date().toISOString() };
      await store.set(userKey(email), user);
      await store.del(`admin:fail:${email}`);
      return { user: { email, name: user.name }, reset: Boolean(existing), cookie: await startSession(email) };
    },

    async login(req, { email, password }) {
      email = normalizeEmail(email);
      await throttle(req, email || "login");
      const user = email ? await store.get(userKey(email)) : null;
      // Hash even for unknown emails so the response time doesn't reveal which accounts exist.
      const { hash } = await hashPassword(String(password ?? ""), user?.salt ?? "no-such-user-salt");
      if (!user || !equal(hash, user.hash)) throw new HttpError(401, "Email or password is not correct.");
      await store.del(`admin:fail:${email}`);
      return { user: { email, name: user.name }, cookie: await startSession(email) };
    },

    async logout(req) {
      const token = readCookie(req, COOKIE);
      if (token) await store.del(sessionKey(token));
      return cookieHeader("", 0, secureCookies);
    },

    // The signed-in administrator, or null.
    async current(req) {
      const token = readCookie(req, COOKIE);
      if (!token) return null;
      const session = await store.get(sessionKey(token));
      if (!session) return null;
      const user = await store.get(userKey(session.email));
      return user ? { email: user.email, name: user.name } : null;
    },

    async require(req) {
      const user = await this.current(req);
      if (!user) throw new HttpError(401, "Please sign in again.");
      return user;
    },
  };
}
