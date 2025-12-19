import fs from "fs/promises";

function normalizeHeader(h) {
  return h.toString().trim().toLowerCase();
}

function normalizeName(name) {
  return name ? name.toString().trim().toLowerCase() : "";
}

export async function loadSchoolsCsv(fileUrl) {
  const raw = await fs.readFile(fileUrl, "utf8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { list: [], mapById: new Map(), mapByName: new Map() };

  const header = lines[0].split(",").map(normalizeHeader);
  const rows = lines.slice(1);

  const list = rows.map((line, idx) => {
    const cols = line.split(",");
    const obj = {};
    for (let i = 0; i < header.length; i++) {
      obj[header[i]] = (cols[i] || "").trim();
    }

    const schoolName = obj["school"] || obj["school name"] || obj["schoolname"] || `unknown-${idx}`;
    const schoolId = (obj["school"] || schoolName).toString().trim();

    const mcat50 = Number(obj["mcat p50 (median)"] ?? obj["mcat p50"] ?? obj["mcat p50(median)"] ?? obj["mcat p50 (median)"] ?? 0) || 0;
    const gpa50 = Number(obj["gpa p50 (median)"] ?? obj["gpa p50"] ?? obj["gpa p50 (median)"] ?? 0) || 0;

    const entry = {
      schoolId: schoolId,
      name: schoolName,
      normName: normalizeName(schoolName),
      raw: obj,
      mcat50,
      gpa50,
    };

    return entry;
  });

  const mapById = new Map(list.map(s => [s.schoolId.toString().toLowerCase(), s]));
  const mapByName = new Map();
  for (const s of list) {
    const key = s.normName;
    if (!mapByName.has(key)) mapByName.set(key, []);
    mapByName.get(key).push(s);
  }

  return { list, mapById, mapByName };
}

export function searchSchools(data, query) {
  const q = normalizeName(query);
  if (!q) return [];
  // exact name matches first
  const exact = data.mapByName.get(q) ?? [];
  // substring matches
  const substring = data.list.filter(s => s.normName.includes(q) && !(exact.includes(s)));
  return exact.concat(substring);
}

export function findSchoolById(data, id) {
  if (!id) return null;
  return data.mapById.get(id.toString().toLowerCase()) || null;
}
