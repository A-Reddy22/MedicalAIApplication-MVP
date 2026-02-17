import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { nanoid } from "nanoid";
import { z } from "zod";
import { loadSchoolsCsv, searchSchools, findSchoolById } from "./services/schools.mjs";
import { computeMatches, parseProfile } from "./services/match.mjs";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Load local environment variables from backend/.env when present
import 'dotenv/config';

const app = express();
app.use(helmet());
app.set("trust proxy", 1);
app.use(cookieParser());
app.use(express.json());
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
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
const defaultData = { profiles: [], users: [] };
const db = new Low(adapter, defaultData);
await db.read();
// ensure data is initialized
db.data ||= defaultData;
db.data.users ||= [];
db.data.profiles ||= [];

const DEFAULT_MATCH_LIMIT = 30;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const SESSION_JWT_SECRET = process.env.SESSION_JWT_SECRET || (process.env.NODE_ENV === "production" ? null : "dev-session-secret");
const SESSION_COOKIE_NAME = "medadmit_session";
const STATE_COOKIE_NAME = "medadmit_oauth_state";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const isProd = process.env.NODE_ENV === "production";
const oauthConfigured = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REDIRECT_URI);
const oauthClient = oauthConfigured ? new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI) : null;
const baseCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  path: "/",
};

if (!SESSION_JWT_SECRET) {
  throw new Error("SESSION_JWT_SECRET must be set in production.");
}

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
  if (!oauthClient || !GOOGLE_CLIENT_ID) {
    throw new Error("Google OAuth is not configured");
  }
  const ticket = await oauthClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  if (!payload?.sub) throw new Error("Invalid id token payload");
  return {
    googleSub: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };
}

function signSession(userId) {
  return jwt.sign({ sub: userId }, SESSION_JWT_SECRET, { expiresIn: "7d" });
}

function setSessionCookie(res, userId) {
  const token = signSession(userId);
  res.cookie(SESSION_COOKIE_NAME, token, {
    ...baseCookieOptions,
    maxAge: SESSION_TTL_MS,
  });
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE_NAME, baseCookieOptions);
}

function getSessionPayload(req) {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, SESSION_JWT_SECRET);
  } catch (err) {
    return null;
  }
}

async function findUserById(userId) {
  await db.read();
  return db.data.users.find((user) => user.id === userId);
}

async function upsertGoogleUser({ googleSub, email, name, picture }) {
  await db.read();
  const now = new Date().toISOString();
  let user = db.data.users.find((entry) => entry.googleSub === googleSub);
  if (user) {
    user.email = email ?? user.email;
    user.name = name ?? user.name;
    user.pictureUrl = picture ?? user.pictureUrl;
    user.lastLoginAt = now;
  } else {
    user = {
      id: nanoid(),
      googleSub,
      email,
      name,
      pictureUrl: picture,
      authProvider: "google",
      createdAt: now,
      lastLoginAt: now,
    };
    db.data.users.push(user);
  }
  await db.write();
  return user;
}

async function createDevUser({ name, email }) {
  await db.read();
  const now = new Date().toISOString();
  const user = {
    id: nanoid(),
    googleSub: null,
    email,
    name,
    pictureUrl: null,
    authProvider: "dev",
    createdAt: now,
    lastLoginAt: now,
  };
  db.data.users.push(user);
  await db.write();
  return user;
}

async function requireAuth(req, res, next) {
  const session = getSessionPayload(req);
  if (!session?.sub) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const user = await findUserById(session.sub);
  if (!user) {
    return res.status(401).json({ error: "Invalid session" });
  }
  req.authUser = user;
  req.userId = user.id;
  next();
}

app.get("/api/auth/google/start", (req, res) => {
  if (!oauthConfigured || !oauthClient) {
    return res.status(500).json({ error: "Google OAuth is not configured" });
  }

  const state = crypto.randomBytes(32).toString("hex");
  res.cookie(STATE_COOKIE_NAME, state, {
    ...baseCookieOptions,
    maxAge: 10 * 60 * 1000,
  });

  const authorizeUrl = oauthClient.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
    state,
  });

  return res.redirect(authorizeUrl);
});

app.get("/api/auth/google/callback", async (req, res) => {
  if (!oauthConfigured || !oauthClient) {
    return res.status(500).json({ error: "Google OAuth is not configured" });
  }

  const state = req.query.state?.toString();
  const code = req.query.code?.toString();
  const storedState = req.cookies?.[STATE_COOKIE_NAME];

  if (!state || !storedState || state !== storedState) {
    return res.status(400).json({ error: "Invalid OAuth state" });
  }

  if (!code) {
    return res.status(400).json({ error: "Missing OAuth code" });
  }

  res.clearCookie(STATE_COOKIE_NAME, baseCookieOptions);

  try {
    const { tokens } = await oauthClient.getToken(code);
    if (!tokens?.id_token) {
      return res.status(400).json({ error: "Missing id_token from Google" });
    }

    const googleUser = await verifyGoogleIdToken(tokens.id_token);
    const user = await upsertGoogleUser(googleUser);

    setSessionCookie(res, user.id);
    return res.redirect(`${FRONTEND_URL}/dashboard`);
  } catch (err) {
    console.error("OAuth callback failed", err);
    return res.status(500).json({ error: "Google OAuth failed" });
  }
});

app.get("/api/auth/me", async (req, res) => {
  const session = getSessionPayload(req);
  if (!session?.sub) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const user = await findUserById(session.sub);
  if (!user) {
    return res.status(401).json({ error: "Invalid session" });
  }
  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      pictureUrl: user.pictureUrl,
    },
  });
});

app.post("/api/auth/logout", (req, res) => {
  clearSessionCookie(res);
  return res.status(200).json({ ok: true });
});

app.post("/api/auth/dev-login", async (req, res) => {
  const devFallbackEnabled =
    (process.env.DEV_AUTH === "true" || process.env.NODE_ENV === "development") && !oauthConfigured;
  if (!devFallbackEnabled) {
    return res.status(404).json({ error: "Not found" });
  }

  const name = req.body?.name?.toString().trim() || "Dev User";
  const email = req.body?.email?.toString().trim() || `dev-${nanoid(6)}@example.local`;
  const user = await createDevUser({ name, email });
  setSessionCookie(res, user.id);
  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      pictureUrl: user.pictureUrl,
    },
  });
});

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

app.post("/api/match", requireAuth, async (req, res) => {
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

app.get("/api/match", requireAuth, async (req, res) => {
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
