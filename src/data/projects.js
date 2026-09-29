// Documented engagements, newest first. The owner adds and edits them from the private /admin
// page, which saves to src/content/projects.json; you can also edit that file by hand (see
// CONTENT.md). Text fields take a plain string or { en, fr, rw }.
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
