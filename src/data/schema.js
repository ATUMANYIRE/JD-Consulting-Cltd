import { serviceSlugs } from "./services.js";

// Shared rules for editable content, used by `npm run content:check`, the /admin editor and the
// /api/content function, so a bad entry is caught the same way everywhere.
export const projectStatuses = ["ongoing", "completed"];
export const updateCategories = ["company", "insights", "technical", "esg", "training", "projects", "events"];

// Text may be a plain string or { en, fr, rw, sw } with at least the English version.
function checkText(report, field, value, required = true) {
  if (value === null || value === undefined || value === "") {
    if (required) report(`"${field}" is missing`);
    return;
  }
  if (typeof value === "string") return;
  if (typeof value === "object" && typeof value.en === "string" && value.en.trim()) return;
  report(`"${field}" must be text, or { en: "…", fr: "…", rw: "…" } with at least "en"`);
}

function checkDate(report, field, value, required = true) {
  if (!value) {
    if (required) report(`"${field}" is missing`);
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(new Date(`${value}T00:00:00`).getTime())) {
    report(`"${field}" must be a date written like "2026-01-31" (got "${value}")`);
  }
}

function checkMedia(report, item, fileExists) {
  if (!item) return;
  if (!item.src) return report(`a photo/video entry has no "src"`);
  // Only files under /media/ (plain names, no "..") or https:// addresses, so a path can never reach other files.
  if (!/^\/media\/[a-z0-9-]+\/[a-z0-9][a-z0-9._-]*\.(jpe?g|png|webp|mp4|webm)$/i.test(item.src) || item.src.includes("..")) {
    if (!/^https:\/\/[^\s"<>]+$/.test(item.src)) return report(`"${item.src}" must be a file in public/media/ (e.g. "/media/projects/site-visit.jpg") or an https:// address`);
  }
  if (item.type && !["image", "video"].includes(item.type)) report(`media type must be "image" or "video" (got "${item.type}")`);
  if (fileExists && item.src.startsWith("/") && !fileExists(item.src)) report(`file not found: public${item.src}`);
  if ((item.type ?? "image") === "image" && !item.alt) report(`image ${item.src} needs an "alt" description`);
}

function collect(label, entry, index, check) {
  const problems = [];
  const where = `${label} #${index + 1}${entry?.id ? ` (${entry.id})` : ""}`;
  check((message) => problems.push(`${where}: ${message}`));
  return problems;
}

function duplicateIds(list, label) {
  const seen = new Set();
  const problems = [];
  list.forEach((entry, i) => {
    if (!entry.id) problems.push(`${label} #${i + 1}: "id" is missing`);
    else if (seen.has(entry.id)) problems.push(`${label} #${i + 1} (${entry.id}): "id" is used twice`);
    seen.add(entry.id);
  });
  return problems;
}

export function validateProjects(list, { fileExists } = {}) {
  return [
    ...duplicateIds(list, "Project"),
    ...list.flatMap((project, i) =>
      collect("Project", project, i, (report) => {
        checkText(report, "name", project.name);
        checkText(report, "location", project.location);
        checkText(report, "description", project.description);
        checkText(report, "client", project.client, false);
        if (!Number.isInteger(project.year) || project.year < 2000 || project.year > 2100) report(`"year" must be a number like 2026`);
        if (!projectStatuses.includes(project.status)) report(`"status" must be one of: ${projectStatuses.join(", ")}`);
        if (!serviceSlugs.includes(project.service)) report(`"service" must be one of: ${serviceSlugs.join(", ")}`);
        (project.media ?? []).forEach((item) => checkMedia(report, item, fileExists));
        (project.outcomes ?? []).forEach((outcome) => checkText(report, "outcomes", outcome));
      })
    ),
  ];
}

export function validateUpdates(list, { fileExists } = {}) {
  return [
    ...duplicateIds(list, "Update"),
    ...list.flatMap((item, i) =>
      collect("Update", item, i, (report) => {
        checkDate(report, "date", item.date);
        if (!updateCategories.includes(item.category)) report(`"category" must be one of: ${updateCategories.join(", ")}`);
        checkText(report, "title", item.title);
        checkText(report, "summary", item.summary);
        checkMedia(report, item.cover, fileExists);
        if (item.url && !/^(https?:\/\/|\/)/.test(item.url)) report(`"url" must start with https:// or /`);
      })
    ),
  ];
}

export function validateVacancies(list) {
  return [
    ...duplicateIds(list, "Vacancy"),
    ...list.flatMap((job, i) =>
      collect("Vacancy", job, i, (report) => {
        checkText(report, "title", job.title);
        checkText(report, "location", job.location);
        checkText(report, "type", job.type, false);
        checkText(report, "summary", job.summary, false);
        checkDate(report, "closing", job.closing, false);
        if (job.applyUrl && !/^(mailto:|https?:\/\/)/.test(job.applyUrl)) report(`"applyUrl" must start with mailto: or https://`);
      })
    ),
  ];
}

export function validateMedia(label, item, fileExists) {
  const problems = [];
  checkMedia((message) => problems.push(`${label}: ${message}`), item, fileExists);
  return problems;
}
