import { existsSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { HttpError } from "./http.js";

// A tiny key-value store with the few operations the editor needs: get, set (optionally expiring),
// del and incr. Values are JSON. Production uses Upstash Redis over its REST API (added from the
// Vercel Marketplace, which sets KV_REST_API_URL / KV_REST_API_TOKEN); `npm run dev` uses a JSON file.

export function redisStore({ url, token, fetchImpl = fetch }) {
  async function command(...args) {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.error) throw new HttpError(502, "The content database did not respond. Try again in a moment.");
    return data.result;
  }
  return {
    async get(key) {
      const value = await command("GET", key);
      return value == null ? null : JSON.parse(value);
    },
    async set(key, value, { ttl } = {}) {
      await command("SET", key, JSON.stringify(value), ...(ttl ? ["EX", String(ttl)] : []));
    },
    async del(key) {
      await command("DEL", key);
    },
    async incr(key, ttl) {
      const count = await command("INCR", key);
      if (count === 1 && ttl) await command("EXPIRE", key, String(ttl));
      return count;
    },
  };
}

// Same interface over one JSON file, for trying the editor on your own computer.
export function fileStore(path) {
  let queue = Promise.resolve();
  const now = () => Date.now();
  async function load() {
    if (!existsSync(path)) return {};
    return JSON.parse(await readFile(path, "utf8"));
  }
  async function save(data) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(`${path}.tmp`, JSON.stringify(data, null, 2));
    await rename(`${path}.tmp`, path);
  }
  // Serialize every operation so concurrent requests don't overwrite each other's writes.
  function run(task) {
    const next = queue.then(async () => {
      const data = await load();
      for (const [key, entry] of Object.entries(data)) if (entry.expires && entry.expires < now()) delete data[key];
      return task(data);
    });
    queue = next.catch(() => {});
    return next;
  }
  return {
    get: (key) => run((data) => data[key]?.value ?? null),
    set: (key, value, { ttl } = {}) =>
      run(async (data) => {
        data[key] = { value, ...(ttl ? { expires: now() + ttl * 1000 } : {}) };
        await save(data);
      }),
    del: (key) =>
      run(async (data) => {
        delete data[key];
        await save(data);
      }),
    incr: (key, ttl) =>
      run(async (data) => {
        const entry = data[key] ?? { value: 0, ...(ttl ? { expires: now() + ttl * 1000 } : {}) };
        entry.value += 1;
        data[key] = entry;
        await save(data);
        return entry.value;
      }),
  };
}

export function storeFromEnv(env, fetchImpl) {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return redisStore({ url, token, fetchImpl });
}
