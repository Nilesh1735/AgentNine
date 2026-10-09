import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const sqlDirectory = join(root, "supabase");
const manifestPath = join(sqlDirectory, "MIGRATIONS.md");
const manifest = readFileSync(manifestPath, "utf8");
const entries = [...manifest.matchAll(/^\|\s*(\d{3})\s*\|\s*`([^`]+\.sql)`\s*\|/gm)]
  .map(([, id, filename]) => ({ id, filename }));
const retiredIds = [...manifest.matchAll(/^\|\s*(\d{3})\s*\|\s*Retired\s*\|/gm)]
  .map(([, id]) => id);
const intentionallyRetiredIds = ["003", "004", "005"];
const errors = [];

if (entries.length === 0) errors.push("No numbered SQL migration entries were found in supabase/MIGRATIONS.md.");

for (const id of intentionallyRetiredIds) {
  if (!retiredIds.includes(id)) errors.push(`Retired migration ID ${id} is missing from supabase/MIGRATIONS.md.`);
}
for (const id of retiredIds) {
  if (!intentionallyRetiredIds.includes(id)) errors.push(`Unexpected retired migration ID ${id}.`);
}

const ids = new Set();
const filenames = new Set();
entries.forEach((entry, index) => {
  const expectedNumber = index < 2 ? index + 1 : index + 4;
  const expectedId = String(expectedNumber).padStart(3, "0");
  if (entry.id !== expectedId) errors.push(`Expected migration ${expectedId} in position ${index + 1}, found ${entry.id}.`);
  if (ids.has(entry.id)) errors.push(`Migration ID ${entry.id} is listed more than once.`);
  if (filenames.has(entry.filename)) errors.push(`${entry.filename} is listed more than once.`);
  ids.add(entry.id);
  filenames.add(entry.filename);
  const filePath = join(sqlDirectory, entry.filename);
  if (!statSync(filePath, { throwIfNoEntry: false })?.isFile()) errors.push(`Manifest entry ${entry.id} references missing file ${entry.filename}.`);
});

const sqlFiles = readdirSync(sqlDirectory)
  .filter((filename) => filename.toLowerCase().endsWith(".sql"))
  .map((filename) => basename(filename));
for (const filename of sqlFiles) {
  if (!filenames.has(filename)) errors.push(`SQL file ${filename} is not listed in supabase/MIGRATIONS.md.`);
}

for (const filename of filenames) {
  if (!sqlFiles.includes(filename)) errors.push(`Manifest references SQL file ${filename}, but it is not present in supabase/.`);
}

if (errors.length) {
  console.error("Migration manifest validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Migration manifest matches ${entries.length} ordered SQL files (001-${entries.at(-1).id}). This check does not inspect live Supabase state.`);
}
