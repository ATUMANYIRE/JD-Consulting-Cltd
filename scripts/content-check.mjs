// Checks the editable content before it goes live (also runs as part of `npm run build`).
//   npm run content:check
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { company } from "../src/data/company.js";
import { vacancies } from "../src/data/careers.js";
import { founder } from "../src/data/profile.js";
import { validateMedia, validateProjects, validateUpdates, validateVacancies } from "../src/data/schema.js";

const fileExists = (src) => existsSync(join("public", src));

function readList(path) {
  try {
    const list = JSON.parse(readFileSync(path, "utf8"));
    if (!Array.isArray(list)) throw new Error("the file must contain a list: [ … ]");
    return { list, problems: [] };
  } catch (error) {
    return { list: [], problems: [`${path}: ${error.message}`] };
  }
}

const projects = readList("src/content/projects.json");
const updates = readList("src/content/updates.json");

const problems = [
  ...projects.problems,
  ...updates.problems,
  ...validateProjects(projects.list, { fileExists }),
  ...validateUpdates(updates.list, { fileExists }),
  ...validateVacancies(vacancies),
  ...validateMedia("Founder profile", founder.photo, fileExists),
];
if (company.logo && company.logo.startsWith("/") && !fileExists(company.logo)) problems.push(`Company: logo file not found: public${company.logo}`);

if (problems.length) {
  console.error(`Content check found ${problems.length} problem(s):\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log(`Content OK: ${projects.list.length} project(s), ${updates.list.length} update(s), ${vacancies.length} vacancy(ies).`);
