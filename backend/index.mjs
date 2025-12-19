import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { nanoid } from "nanoid";
import { z } from "zod";
import { loadSchoolsCsv, searchSchools, findSchoolById } from "./services/schools.mjs";

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

const schema = z.object({
  name: z.string().min(1).max(200),
  undergrad: z.string().optional(),
  major: z.string().optional(),
  cumGPA: z.string().optional(),
  scienceGPA: z.string().optional(),
  mcat: z.string().optional(),
  gradYear: z.string().optional(),
  experiences: z.array(z.any()).optional(),
});

const adapter = new JSONFile(new URL("./db.json", import.meta.url));
const defaultData = { profiles: [] };
const db = new Low(adapter, defaultData);
await db.read();
// ensure data is initialized
db.data ||= defaultData;

app.post("/api/profile", async (req, res) => {
  const parse = schema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors });

  const profile = {
    id: nanoid(),
    ...parse.data,
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

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
