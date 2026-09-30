// Documented engagements, newest first. The owner manages them in /admin, which saves to the
// content database; pages read the live list through src/lib/liveContent.js. This bundled list
// (src/content/projects.json) is only the fallback shown while that loads or if it fails.
// Text fields take a plain string or { en, fr, rw, sw }.
//
// {
//   id: "unique-slug",
//   name: "Project name",
//   client: null,              // only with the client's written permission
//   location: "District, Country",
//   year: 2026,
//   service: "technical-advisory", // a pillar slug from ./services.js
//   description: "What was done",
//   media: [{ type: "image", src: "/media/projects/slug-1.jpg", alt: "…", caption: "…" }],
//   outcomes: [],              // only results backed by evidence
// }
import entries from "../content/projects.json";

export const projects = entries;
