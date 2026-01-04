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
import { OAuth2Client } from "google-auth-library";

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

const academicSchema = z.object({
  fullName: z.string().min(1),
  undergradInstitution: z.string().min(1),
  major: z.string().min(1),
  cumulativeGPA: z.coerce.number(),
  scienceGPA: z.coerce.number(),
  mcatTotal: z.coerce.number(),
  mcatBreakdown: z.object({
    chemPhys: z.coerce.number(),
    cars: z.coerce.number(),
    bioBiochem: z.coerce.number(),
    psychSoc: z.coerce.number(),
  }),
  graduationYear: z.coerce.number(),
});

const demographicsSchema = z.object({
  age: z.coerce.number(),
  stateOfResidence: z.string().min(1),
  raceEthnicity: z.string().min(1),
  gender: z.string().min(1),
  socioeconomicStatus: z.string().min(1),
  geographicPreferences: z.array(z.string()).min(1),
  missionPreferences: z.array(z.string()).min(1),
});

const applicantProfileSchema = z.object({
  academic: academicSchema,
  demographics: demographicsSchema,
});

const essaysSchema = z.object({
  personalStatement: z.string().max(5300).optional(),
});

const schema = z.object({
  applicantProfile: applicantProfileSchema,
  userId: z.string().optional(),
  experiences: z.array(experienceSchema).optional(),
  extrasScore: z.union([z.string(), z.number()]).optional(),
  essays: essaysSchema.optional(),
});

const adapter = new JSONFile(new URL("./db.json", import.meta.url));
const defaultData = { profiles: [] };
const db = new Low(adapter, defaultData);
await db.read();
// ensure data is initialized
db.data ||= defaultData;

const DEFAULT_MATCH_LIMIT = 30;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
const oauthClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "ENTER_API_KEY_HERE";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash-001";
const GEMINI_TEMPERATURE = 0.3;
const GEMINI_MAX_OUTPUT_TOKENS = 900;
const ESSAY_MAX_LENGTH = 5300;
const ESSAY_RATE_LIMIT = rateLimit({
  windowMs: 60_000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
});
const ESSAY_SYSTEM_PROMPT = `You are an experienced U.S. medical school admissions reviewer evaluating AMCAS personal statements for MD programs.
Be professional, honest, and realistic.
Do not rewrite the essay.
Do not provide line edits.
Do not assume any applicant information beyond what is written.
Treat each essay as a brand-new submission with no memory of prior feedback.`;
const ESSAY_USER_PROMPT_TEMPLATE = `Analyze the following medical school personal statement.

Provide feedback using this exact structure and keep the total response under 500 words:

1. Overall Impression (3–4 sentences)

2. Strengths (Pros) (up to 10 bullet points, fewer if appropriate)

3. Weaknesses / Areas for Improvement (Cons) (up to 10 bullet points, fewer if appropriate)

4. Essay Rating (numeric score out of 10, realistic and harsh, may use decimals)

5. Security Vulnerabilities (bullet points, if any; explain why each item is a risk)

Rules:
- Do NOT rewrite the essay
- Do NOT provide example sentences
- Do NOT compare to previous versions
- Do NOT assume GPA, MCAT, or experiences not stated
- Be realistic, not inflated

Essay:
"""
{{ESSAY_TEXT}}
"""`;

const essayAnalyzeSchema = z.object({
  essay: z.string().trim().min(1, "Essay is required").max(ESSAY_MAX_LENGTH, "Essay exceeds 5,300 characters"),
});

async function verifyGoogleIdToken(idToken) {
  if (!oauthClient) {
    throw new Error("Google auth is not configured (set GOOGLE_CLIENT_ID)");
  }
  const ticket = await oauthClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  if (!payload?.sub) throw new Error("Invalid id token payload");
  return {
    userId: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };
}

function resolveUserId(req) {
  return (
    req.headers["x-user-id"]?.toString() ||
    req.body?.userId?.toString?.() ||
    req.params?.userId?.toString?.() ||
    req.query?.userId?.toString?.() ||
    null
  );
}

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (oauthClient && header?.startsWith("Bearer ")) {
    const token = header.replace(/^Bearer\s+/i, "");
    try {
      const user = await verifyGoogleIdToken(token);
      req.authUser = user;
      req.userId = user.userId;
    } catch (err) {
      console.error("Auth failed", err.message);
      return res.status(401).json({ error: "Invalid Google ID token" });
    }
  }

  if (!req.userId) {
    const fallback = resolveUserId(req);
    if (!fallback) return res.status(400).json({ error: "userId required" });
    req.userId = fallback;
  }

  next();
}

async function attachAuthIfPresent(req, res, next) {
  if (oauthClient) {
    const header = req.headers.authorization;
    if (header) {
      if (!header.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Invalid Authorization header" });
      }
      try {
        const user = await verifyGoogleIdToken(header.replace(/^Bearer\s+/i, ""));
        req.authUser = user;
        req.userId = user.userId;
      } catch (err) {
        console.error("Optional auth failed", err.message);
        return res.status(401).json({ error: "Invalid Google ID token" });
      }
    }
  }

  if (!req.userId) {
    const fallback = resolveUserId(req);
    if (fallback) {
      req.userId = fallback;
    }
  }

  next();
}

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

app.post("/api/profile", requireAuth, async (req, res) => {
  const parse = schema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors });

  // Store the applicant profile as a single document to keep academic + demographics in sync.
  const profile = {
    id: nanoid(),
    ...parse.data,
    userId: req.userId ?? null,
    experiences: parse.data.experiences ?? [],
    applicantProfile: parse.data.applicantProfile,
    essays: parse.data.essays ?? {},
    createdAt: new Date().toISOString(),
  };

  db.data.profiles.push(profile);
  await db.write();

  res.status(201).json({ id: profile.id });
});

app.get("/api/profile/:id", requireAuth, async (req, res) => {
  const id = req.params.id;
  await db.read();
  const p = db.data.profiles.find((x) => x.id === id);
  if (!p) return res.status(404).json({ error: "not found" });
  if (p.userId && p.userId !== req.userId) return res.status(403).json({ error: "forbidden" });
  res.json({ profile: p });
});

app.get("/api/profile/user/:userId", requireAuth, async (req, res) => {
  const userId = req.params.userId;
  if (userId !== req.userId) return res.status(403).json({ error: "forbidden" });
  await db.read();
  const userProfiles = db.data.profiles.filter((p) => p.userId === userId);
  if (!userProfiles.length) return res.status(404).json({ error: "not found" });
  const latestProfile = userProfiles[userProfiles.length - 1];
  res.json({ profile: latestProfile, history: userProfiles });
});

// load schools data
let schoolsData = { list: [], mapById: new Map(), mapByName: new Map() };
try {
  schoolsData = await loadSchoolsCsv(
    new URL("./data/schools.csv", import.meta.url),
    new URL("./data/CSV_Data - DEMOGRAPHICS.csv", import.meta.url)
  );
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

app.post("/api/match", attachAuthIfPresent, async (req, res) => {
  const safeLimit = coerceLimit(req.body?.limit);

  let profileInput = req.body?.profile ?? req.body ?? {};

  if (req.body?.profileId) {
    const stored = await findStoredProfile(req.body.profileId);
    if (!stored) return res.status(404).json({ error: "profile not found" });
    if (stored.userId) {
      if (!req.userId) return res.status(401).json({ error: "Authentication required for saved profiles" });
      if (stored.userId !== req.userId) return res.status(403).json({ error: "forbidden" });
    }
    profileInput = stored;
  }

  const profile = parseProfile(profileInput);

  if (!ensureHasNumericScores(profile)) {
    return res.status(400).json({ error: "Provide a numeric gpa/cumGPA and/or mcat" });
  }

  const matches = computeMatches(profile, schoolsData.list, safeLimit);
  res.json({ matches });
});

app.get("/api/match", attachAuthIfPresent, async (req, res) => {
  const safeLimit = coerceLimit(req.query.limit);

  let profileInput = {
    gpa: req.query.gpa ?? req.query.cumGPA,
    mcat: req.query.mcat,
  };

  const profileId = req.query.profileId?.toString();
  if (profileId) {
    const stored = await findStoredProfile(profileId);
    if (!stored) return res.status(404).json({ error: "profile not found" });
    if (stored.userId) {
      if (!req.userId) return res.status(401).json({ error: "Authentication required for saved profiles" });
      if (stored.userId !== req.userId) return res.status(403).json({ error: "forbidden" });
    }
    profileInput = stored;
  }

  const profile = parseProfile(profileInput);

  if (!ensureHasNumericScores(profile)) {
    return res.status(400).json({ error: "Provide a numeric gpa/cumGPA and/or mcat" });
  }

  const matches = computeMatches(profile, schoolsData.list, safeLimit);
  res.json({ matches });
});

app.post("/api/essay/analyze", ESSAY_RATE_LIMIT, async (req, res) => {
  const parse = essayAnalyzeSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.errors });
  }

  const { essay } = parse.data;

  const userPrompt = ESSAY_USER_PROMPT_TEMPLATE.replace("{{ESSAY_TEXT}}", essay);

  try {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "ENTER_API_KEY_HERE") {
      console.error("Gemini API key is not configured.");
      return res.status(500).json({ error: "Unable to analyze essay at this time." });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${ESSAY_SYSTEM_PROMPT}\n\n${userPrompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: GEMINI_TEMPERATURE,
          maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
        },
      }),
    }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini error:", response.status, errorText);
      return res.status(500).json({ error: "Unable to analyze essay at this time." });
    }

    const data = await response.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      console.error("Gemini response missing content");
      return res.status(500).json({ error: "Unable to analyze essay at this time." });
    }

    return res.json({ analysis: content });
  } catch (error) {
    console.error("Gemini request failed:", error);
    return res.status(500).json({ error: "Unable to analyze essay at this time." });
  }
});

const port = Number(process.env.PORT || process.env.VITE_API_PORT || 4000);
const server = app.listen(port, () => console.log(`API running on http://localhost:${port}`));

server.on("error", (err) => {
  if (err?.code === "EADDRINUSE") {
    console.error(
      `Port ${port} is already in use. Stop the other process or set PORT/VITE_API_PORT to an open port before running the API.`
    );
    process.exit(1);
  }

  throw err;
});
