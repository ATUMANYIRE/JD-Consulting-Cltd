// Translation helpers for native-speaker review.
//   node scripts/i18n.mjs check   → lists keys missing from French or Kinyarwanda (exit 1 if any)
//   node scripts/i18n.mjs export  → writes translations-review.csv (key, en, fr, rw) for a reviewer
import { writeFileSync } from "node:fs";
import { translations } from "../src/i18n/translations.js";

function flatten(value, prefix = "", out = {}) {
  if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) flatten(child, prefix ? `${prefix}.${key}` : key, out);
  } else {
    out[prefix] = value;
  }
  return out;
}

const flat = Object.fromEntries(Object.entries(translations).map(([lang, tree]) => [lang, flatten(tree)]));
const keys = Object.keys(flat.en);
const mode = process.argv[2] ?? "check";

if (mode === "check") {
  let missing = 0;
  for (const lang of Object.keys(flat).filter((l) => l !== "en")) {
    for (const key of keys) {
      if (!(key in flat[lang])) {
        console.log(`${lang}: missing ${key}`);
        missing++;
      }
    }
    for (const key of Object.keys(flat[lang])) {
      if (!(key in flat.en)) console.log(`${lang}: extra ${key} (not in en)`);
    }
  }
  console.log(missing ? `${missing} missing translation(s)` : "All languages have every key.");
  process.exit(missing ? 1 : 0);
}

if (mode === "export") {
  const cell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const rows = [["key", "en", "fr", "rw"], ...keys.map((key) => [key, flat.en[key], flat.fr[key], flat.rw[key]])];
  writeFileSync("translations-review.csv", "﻿" + rows.map((row) => row.map(cell).join(",")).join("\r\n"));
  console.log(`Wrote translations-review.csv (${keys.length} strings)`);
}
