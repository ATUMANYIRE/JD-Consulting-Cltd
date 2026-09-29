// Company updates and insights, newest first. The owner adds and edits them from the private
// /admin page, which saves to src/content/updates.json; you can also edit that file by hand (see
// CONTENT.md). Text fields take a plain string or { en, fr, rw }.
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
