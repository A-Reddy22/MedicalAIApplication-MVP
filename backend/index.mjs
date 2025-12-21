import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { nanoid } from "nanoid";
import { z } from "zod";
import { loadSchoolsCsv, searchSchools, findSchoolById } from "./services/schools.mjs";
import { computeMatches, parseProfile } from "./services/match.mjs";

const app = express();
app.use(helmet());
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  })
);
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 30,
  })
);

const experienceSchema = z.object({
  id: z.union([z.string(), z.number()]),
  type: z.string().min(1),
  title: z.string().optional(),
  hours: z.string().optional(),
  description: z.string().optional(),
});

const demographicsSchema = z.object({
  age: z.string().optional(),
  state: z.string().optional(),
  preferredRegions: z.array(z.string()).optional(),
  missionPreferences: z.array(z.string()).optional(),
});

const essaysSchema = z.object({
  personalStatement: z.string().max(5300).optional(),
});

const schema = z.object({
  name: z.string().min(1).max(200),
  userId: z.string().optional(),
  undergrad: z.string().optional(),
  major: z.string().optional(),
  cumGPA: z.string().optional(),
  scienceGPA: z.string().optional(),
  mcat: z.string().optional(),
  gradYear: z.string().optional(),
  experiences: z.array(experienceSchema).optional(),
  demographics: demographicsSchema.optional(),
  essays: essaysSchema.optional(),
});

const adapter = new JSONFile(new URL("./db.json", import.meta.url));
const defaultData = { profiles: [] };
const db = new Low(adapter, defaultData);
await db.read();
// ensure data is initialized
db.data ||= defaultData;

const DEFAULT_MATCH_LIMIT = 30;

function coerceLimit(rawLimit, fallback = DEFAULT_MATCH_LIMIT) {
  const limit = Number.parseInt(rawLimit ?? fallback, 10);
  return Number.isFinite(limit) && limit > 0 ? limit : fallback;
}

async function findStoredProfile(profileId) {
  await db.read();
  return db.data.profiles.find((p) => p.id === profileId);
}

function ensureHasNumericScores(profile) {
  return Number.isFinite(profile.gpa) || Number.isFinite(profile.mcat);
}

app.post("/api/profile", async (req, res) => {
  const parse = schema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors });

  const profile = {
    id: nanoid(),
    userId: parse.data.userId ?? null,
    ...parse.data,
    experiences: parse.data.experiences ?? [],
    demographics: parse.data.demographics ?? {},
    essays: parse.data.essays ?? {},
    createdAt: new Date().toISOString(),
  };

  db.data.profiles.push(profile);
  await db.write();

  res.status(201).json({ id: profile.id });
});

app.get("/api/profile/:id", async (req, res) => {
  const id = req.params.id;
  await db.read();
  const p = db.data.profiles.find((x) => x.id === id);
  if (!p) return res.status(404).json({ error: "not found" });
  res.json({ profile: p });
});

app.get("/api/profile/user/:userId", async (req, res) => {
  const userId = req.params.userId;
  await db.read();
  const userProfiles = db.data.profiles.filter((p) => p.userId === userId);
  if (!userProfiles.length) return res.status(404).json({ error: "not found" });
  const latestProfile = userProfiles[userProfiles.length - 1];
  res.json({ profile: latestProfile, history: userProfiles });
});

// load schools data
let schoolsData = { list: [], mapById: new Map(), mapByName: new Map() };
try {
  schoolsData = await loadSchoolsCsv(new URL("./data/schools.csv", import.meta.url));
  console.log(`Loaded ${schoolsData.list.length} schools`);
} catch (err) {
  console.warn("Could not load schools data:", err.message);
}

app.get("/api/schools", (req, res) => {
  res.json({ count: schoolsData.list.length });
});

app.get("/api/schools/search", (req, res) => {
  const q = req.query.q?.toString() || "";
  const results = searchSchools(schoolsData, q).slice(0, 50).map(s => ({ schoolId: s.schoolId, name: s.name, mcat50: s.mcat50, gpa50: s.gpa50 }));
  res.json({ results });
});

app.get("/api/schools/:id", (req, res) => {
  const id = req.params.id;
  const s = findSchoolById(schoolsData, id);
  if (!s) return res.status(404).json({ error: "not found" });
  res.json({ school: s });
});

app.post("/api/match", async (req, res) => {
  const safeLimit = coerceLimit(req.body?.limit);

  let profileInput = req.body?.profile ?? req.body ?? {};

  if (req.body?.profileId) {
    const stored = await findStoredProfile(req.body.profileId);
    if (!stored) return res.status(404).json({ error: "profile not found" });
    profileInput = stored;
  }

  const profile = parseProfile(profileInput);

  if (!ensureHasNumericScores(profile)) {
    return res.status(400).json({ error: "Provide a numeric gpa/cumGPA and/or mcat" });
  }

  const matches = computeMatches(profile, schoolsData.list, safeLimit);
  res.json({ matches });
});

app.get("/api/match", async (req, res) => {
  const safeLimit = coerceLimit(req.query.limit);

  let profileInput = {
    gpa: req.query.gpa ?? req.query.cumGPA,
    mcat: req.query.mcat,
  };

  const profileId = req.query.profileId?.toString();
  if (profileId) {
    const stored = await findStoredProfile(profileId);
    if (!stored) return res.status(404).json({ error: "profile not found" });
    profileInput = stored;
  }

  const profile = parseProfile(profileInput);

  if (!ensureHasNumericScores(profile)) {
    return res.status(400).json({ error: "Provide a numeric gpa/cumGPA and/or mcat" });
  }

  const matches = computeMatches(profile, schoolsData.list, safeLimit);
  res.json({ matches });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
