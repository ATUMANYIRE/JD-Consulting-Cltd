// Company updates and insights, newest first. The owner manages them in /admin, which saves to
// the content database; pages read the live list through src/lib/liveContent.js. This bundled
// list (src/content/updates.json) is only the fallback shown while that loads or if it fails.
// Text fields take a plain string or { en, fr, rw, sw }.
//
// {
//   id: "unique-slug",
//   date: "2026-01-31",
//   category: "company",       // one of updateCategories
//   title: "Headline",
//   summary: "One or two sentences",
//   cover: { type: "image", src: "/media/updates/slug.jpg", alt: "…" }, // optional
//   url: "https://…",          // optional link to the full article or PDF
// }
import entries from "../content/updates.json";

export { updateCategories } from "./schema.js";
export const updates = entries;
