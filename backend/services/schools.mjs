import fs from "fs/promises";

function normalizeHeader(h) {
  return h.toString().trim().toLowerCase();
}

function normalizeName(name) {
  return name ? name.toString().trim().toLowerCase() : "";
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

async function parseCsv(fileUrl) {
  const raw = await fs.readFile(fileUrl, "utf8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { header: [], rows: [] };

  const header = lines[0].split(",").map(normalizeHeader);
  const rows = lines.slice(1).map((line) => {
    const cols = line.split(",");
    const obj = {};
    for (let i = 0; i < header.length; i++) {
      obj[header[i]] = (cols[i] || "").trim();
    }
    return obj;
  });

  return { header, rows };
}

export async function loadSchoolsCsv(academicUrl, demographicsUrl) {
  const academic = await parseCsv(academicUrl);
  const demographics = demographicsUrl ? await parseCsv(demographicsUrl) : { rows: [] };

  if (academic.rows.length === 0) {
    return { list: [], mapById: new Map(), mapByName: new Map() };
  }

  const list = academic.rows.map((obj, idx) => {
    const demo = demographics.rows[idx] ?? {};

    const schoolName = obj["school"] || obj["school name"] || obj["schoolname"] || `unknown-${idx}`;
    const schoolId = (obj["school"] || schoolName).toString().trim();

    const gpaPercentiles = [
      { percentile: 10, value: toNumber(obj["gpa p10"]) },
      { percentile: 25, value: toNumber(obj["gpa p25"]) },
      { percentile: 50, value: toNumber(obj["gpa p50 (median)"] ?? obj["gpa p50"] ?? obj["gpa p50 (median)"]) },
      { percentile: 75, value: toNumber(obj["gpa p75"]) },
      { percentile: 90, value: toNumber(obj["gpa p90"]) },
    ];

    const mcatPercentiles = [
      { percentile: 10, value: toNumber(obj["mcat p10"]) },
      { percentile: 25, value: toNumber(obj["mcat p25"]) },
      { percentile: 50, value: toNumber(obj["mcat p50 (median)"] ?? obj["mcat p50"] ?? obj["mcat p50(median)"]) },
      { percentile: 75, value: toNumber(obj["mcat p75"]) },
      { percentile: 90, value: toNumber(obj["mcat p90"]) },
    ];

    const mcat50 = mcatPercentiles.find((p) => p.percentile === 50)?.value ?? 0;
    const gpa50 = gpaPercentiles.find((p) => p.percentile === 50)?.value ?? 0;

    const publicPrivate = demo["public / private"] ?? "";
    const publicFlag = publicPrivate.toString().trim().toLowerCase();

    const entry = {
      schoolId: schoolId,
      name: schoolName,
      normName: normalizeName(schoolName),
      raw: obj,
      demographicsRaw: demo,
      mcat50,
      gpa50,
      gpaPercentiles,
      mcatPercentiles,
      state: demo["state"] || null,
      region: demo["region"] || null,
      publicPrivate: publicPrivate || null,
      isPublic: publicFlag.startsWith("public"),
      demographics: {
        degreeMd: toNumber(demo["d_degree_md"]),
        degreeMdPhd: toNumber(demo["d_degree_md_phd"]),
        degreeCombined: toNumber(demo["d_md_combined"]),
        raceHispanic: toNumber(demo["d_hispanic"]),
        raceBlack: toNumber(demo["d_black"]),
        raceWhite: toNumber(demo["d_white"]),
        raceAsian: toNumber(demo["d_asian"]),
        raceOther: toNumber(demo["d_other"]),
        genderMale: toNumber(demo["d_male"]),
        genderFemale: toNumber(demo["d_female"]),
        genderOther: toNumber(demo["d_gender_other"]),
        sesNonDisadvantaged: toNumber(demo["ses_non_dis"]),
        sesDisadvantaged: toNumber(demo["ses_disadvantaged"]),
        totalApplicants: toNumber(demo["total_applicants"]),
        applicantsInterviewed: toNumber(demo["applicants interviewed"]),
        applicantsAccepted: toNumber(demo["applicants_accepted"]),
      },
    };

    return entry;
  });

  const mapById = new Map(list.map((s) => [s.schoolId.toString().toLowerCase(), s]));
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
