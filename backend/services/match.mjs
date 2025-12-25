const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

const STATE_ABBREVIATIONS = {
  al: "alabama",
  ak: "alaska",
  az: "arizona",
  ar: "arkansas",
  ca: "california",
  co: "colorado",
  ct: "connecticut",
  de: "delaware",
  fl: "florida",
  ga: "georgia",
  hi: "hawaii",
  id: "idaho",
  il: "illinois",
  in: "indiana",
  ia: "iowa",
  ks: "kansas",
  ky: "kentucky",
  la: "louisiana",
  me: "maine",
  md: "maryland",
  ma: "massachusetts",
  mi: "michigan",
  mn: "minnesota",
  ms: "mississippi",
  mo: "missouri",
  mt: "montana",
  ne: "nebraska",
  nv: "nevada",
  nh: "new hampshire",
  nj: "new jersey",
  nm: "new mexico",
  ny: "new york",
  nc: "north carolina",
  nd: "north dakota",
  oh: "ohio",
  ok: "oklahoma",
  or: "oregon",
  pa: "pennsylvania",
  ri: "rhode island",
  sc: "south carolina",
  sd: "south dakota",
  tn: "tennessee",
  tx: "texas",
  ut: "utah",
  vt: "vermont",
  va: "virginia",
  wa: "washington",
  wv: "west virginia",
  wi: "wisconsin",
  wy: "wyoming",
  dc: "district of columbia",
};

const UNDERREPRESENTED_RACES = [
  "black",
  "african american",
  "hispanic",
  "latino",
  "latina",
  "latinx",
  "native american",
  "american indian",
  "alaska native",
  "native hawaiian",
  "pacific islander",
];

function toFiniteNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function normalizeString(value) {
  if (value === null || value === undefined) return "";
  return value.toString().trim();
}

function normalizeLower(value) {
  return normalizeString(value).toLowerCase();
}

function normalizeState(value) {
  const normalized = normalizeLower(value);
  if (!normalized) return "";
  return STATE_ABBREVIATIONS[normalized] ?? normalized;
}

function percentileValue(points, percentile) {
  return points?.find((p) => p.percentile === percentile)?.value ?? null;
}

function normalizedAcademicScore(value, p10, p90) {
  if (!Number.isFinite(value) || !Number.isFinite(p10) || !Number.isFinite(p90)) return null;
  const range = p90 - p10;
  if (range <= 0) return null;
  return clamp((value - p10) / range, 0, 1);
}

function isDisadvantaged(ses) {
  return normalizeLower(ses).includes("disadvantaged");
}

function isUnderrepresentedRace(race) {
  const normalized = normalizeLower(race);
  return UNDERREPRESENTED_RACES.some((entry) => normalized.includes(entry));
}

function schoolUrmPercent(school) {
  const demo = school.demographics ?? {};
  const values = [demo.raceHispanic, demo.raceBlack, demo.raceOther].filter((n) =>
    Number.isFinite(n)
  );
  if (!values.length) return null;
  return values.reduce((sum, n) => sum + n, 0);
}

export function parseProfile(raw) {
  const demographics = raw?.demographics ?? {};
  const gpa = toFiniteNumber(raw?.gpa ?? raw?.cumGPA);
  const mcat = toFiniteNumber(raw?.mcat);
  const extrasScore = toFiniteNumber(raw?.extrasScore ?? raw?.extras_score ?? demographics?.extrasScore);
  return {
    gpa,
    mcat,
    extrasScore,
    state: demographics?.state ?? raw?.state ?? null,
    race: demographics?.race ?? raw?.race ?? null,
    gender: demographics?.gender ?? raw?.gender ?? null,
    ses: demographics?.ses ?? raw?.ses ?? null,
    preferredRegions: demographics?.preferredRegions ?? raw?.preferredRegions ?? [],
  };
}

export function scoreSchool(profile, school) {
  const gpaP10 = percentileValue(school.gpaPercentiles, 10);
  const gpaP90 = percentileValue(school.gpaPercentiles, 90);
  const mcatP10 = percentileValue(school.mcatPercentiles, 10);
  const mcatP90 = percentileValue(school.mcatPercentiles, 90);

  const gpaScore = normalizedAcademicScore(profile.gpa, gpaP10, gpaP90);
  const mcatScore = normalizedAcademicScore(profile.mcat, mcatP10, mcatP90);

  const availableScores = [gpaScore, mcatScore].filter((n) => Number.isFinite(n));
  if (availableScores.length === 0) return null;

  const profileState = normalizeState(profile.state);
  const schoolState = normalizeState(school.state);

  const stateBonus = school.isPublic && profileState && schoolState && profileState === schoolState ? 0.1 : 0;
  const sesBonus = isDisadvantaged(profile.ses) ? 0.05 : 0;
  const urmPercent = schoolUrmPercent(school);
  const raceBonus =
    isUnderrepresentedRace(profile.race) && Number.isFinite(urmPercent) && urmPercent >= 20 ? 0.05 : 0;
  const extrasBonus = Number.isFinite(profile.extrasScore)
    ? clamp(profile.extrasScore, 0, 100) / 100 * 0.05
    : 0;

  const matchScore = clamp(
    (Number.isFinite(gpaScore) ? 0.4 * gpaScore : 0) +
      (Number.isFinite(mcatScore) ? 0.4 * mcatScore : 0) +
      stateBonus +
      sesBonus +
      raceBonus +
      extrasBonus,
    0,
    1
  );

  return {
    schoolId: school.schoolId,
    name: school.name,
    matchScore: Math.round(matchScore * 100),
    gpaScore: Number.isFinite(gpaScore) ? Math.round(gpaScore * 100) : null,
    mcatScore: Number.isFinite(mcatScore) ? Math.round(mcatScore * 100) : null,
    gpaMedian: school.gpa50 ?? null,
    mcatMedian: school.mcat50 ?? null,
  };
}

export function computeMatches(profile, schools, limit = 30) {
  const matches = schools
    .map((school) => scoreSchool(profile, school))
    .filter((x) => x && Number.isFinite(x.matchScore))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);

  return matches;
}
