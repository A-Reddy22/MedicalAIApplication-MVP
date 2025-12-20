const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

function toFiniteNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function parseProfile(raw) {
  const gpa = toFiniteNumber(raw?.gpa ?? raw?.cumGPA);
  const mcat = toFiniteNumber(raw?.mcat);
  return { gpa, mcat };
}

export function percentileScore(value, cutoffs = []) {
  if (!Number.isFinite(value)) return null;

  const points = cutoffs
    .filter((p) => Number.isFinite(p?.value) && Number.isFinite(p?.percentile))
    .sort((a, b) => a.percentile - b.percentile);

  if (points.length === 0) return null;

  const first = points[0];
  if (value <= first.value) {
    if (first.value === 0) return clamp(first.percentile, 0, 100);
    const scaled = (value / first.value) * first.percentile;
    return clamp(scaled, 0, 100);
  }

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    if (value <= curr.value) {
      const range = curr.value - prev.value;
      const ratio = range === 0 ? 0 : (value - prev.value) / range;
      const pct = prev.percentile + ratio * (curr.percentile - prev.percentile);
      return clamp(pct, 0, 100);
    }
  }

  const last = points[points.length - 1];
  const tailRange = last.value === 0 ? 0 : value - last.value;
  const tailRatio = tailRange <= 0 || last.value === 0 ? 0 : tailRange / last.value;
  const extrapolated = last.percentile + tailRatio * (100 - last.percentile);
  return clamp(extrapolated, 0, 100);
}

export function scoreSchool(profile, school) {
  const gpaScore = percentileScore(profile.gpa, school.gpaPercentiles);
  const mcatScore = percentileScore(profile.mcat, school.mcatPercentiles);

  const availableScores = [gpaScore, mcatScore].filter((n) => Number.isFinite(n));
  if (availableScores.length === 0) return null;

  const matchScore = availableScores.reduce((sum, n) => sum + n, 0) / availableScores.length;

  return {
    schoolId: school.schoolId,
    name: school.name,
    matchScore: Math.round(matchScore),
    gpaScore: Number.isFinite(gpaScore) ? Math.round(gpaScore) : null,
    mcatScore: Number.isFinite(mcatScore) ? Math.round(mcatScore) : null,
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
