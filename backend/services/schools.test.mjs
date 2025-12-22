import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";

import { loadSchoolsCsv, searchSchools, findSchoolById } from "./schools.mjs";

async function createCsv(lines) {
  const dir = await mkdtemp(path.join(tmpdir(), "schools-"));
  const filePath = path.join(dir, "schools.csv");
  await writeFile(filePath, lines.join("\n"), "utf8");
  return pathToFileURL(filePath);
}

test("loads CSV data and indexes normalized names", async () => {
  const fileUrl = await createCsv([
    "School,GPA P50 (Median),MCAT P50 (Median)",
    "School One,3.5,510",
    "School Two,3.6,515",
  ]);

  const data = await loadSchoolsCsv(fileUrl);

  assert.strictEqual(data.list.length, 2);
  assert.strictEqual(data.mapById.get("school one").mcat50, 510);
  assert.strictEqual(data.mapByName.get("school two")[0].gpa50, 3.6);
});

test("search is case-insensitive and prioritizes exact matches", async () => {
  const fileUrl = await createCsv([
    "School,GPA P50 (Median),MCAT P50 (Median)",
    "School,3.1,500",
    "Medical School,3.2,505",
    "Another School,3.3,510",
  ]);

  const data = await loadSchoolsCsv(fileUrl);
  const results = searchSchools(data, "SCHOOL");

  assert.strictEqual(results[0].name, "School");
  assert.ok(results.some((s) => s.name === "Medical School"));
  assert.ok(results.some((s) => s.name === "Another School"));
});

test("findSchoolById performs case-insensitive lookups", async () => {
  const fileUrl = await createCsv([
    "School,GPA P50 (Median),MCAT P50 (Median)",
    "Example School,3.8,518",
  ]);

  const data = await loadSchoolsCsv(fileUrl);

  assert.strictEqual(findSchoolById(data, "example school")?.name, "Example School");
  assert.strictEqual(findSchoolById(data, "missing"), null);
});
