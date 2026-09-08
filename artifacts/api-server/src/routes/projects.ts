import { Router, type IRouter } from "express";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { Storage } from "@google-cloud/storage";
import { and, desc, eq } from "drizzle-orm";
import { db, lissaProjects } from "@workspace/db";

const router: IRouter = Router();
const sidecar = "http://127.0.0.1:1106";
const storage = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${sidecar}/token`,
    type: "external_account",
    credential_source: {
      url: `${sidecar}/credential`,
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});
const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
const validWallet = (value: unknown): value is string =>
  typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value);

const projectSummary = (project: {
  id: string;
  title: string;
  files: Record<string, string>;
  publishedPath: string | null;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: project.id,
  title: project.title,
  fileCount: Object.keys(project.files).length,
  published: Boolean(project.publishedPath),
  publishedUrl: project.publishedPath ? `/api/published/${project.id}/index.html` : null,
  createdAt: project.createdAt.toISOString(),
  updatedAt: project.updatedAt.toISOString(),
});

function encryptSecrets(value: Record<string, string>) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is required");
  const key = createHash("sha256").update(secret).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64");
}

function decryptSecrets(value?: string | null): Record<string, string> {
  if (!value) return {};
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is required");
  const payload = Buffer.from(value, "base64");
  const decipher = createDecipheriv("aes-256-gcm", createHash("sha256").update(secret).digest(), payload.subarray(0, 12));
  decipher.setAuthTag(payload.subarray(12, 28));
  return JSON.parse(Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]).toString("utf8"));
}

router.get("/projects", async (req, res) => {
  const walletAddress = req.query.walletAddress;
  if (!validWallet(walletAddress)) {
    res.status(400).json({ error: "A valid walletAddress is required." });
    return;
  }
  const projects = await db.select({
    id: lissaProjects.id,
    title: lissaProjects.title,
    files: lissaProjects.files,
    publishedPath: lissaProjects.publishedPath,
    createdAt: lissaProjects.createdAt,
    updatedAt: lissaProjects.updatedAt,
  }).from(lissaProjects)
    .where(eq(lissaProjects.walletAddress, walletAddress.toLowerCase()))
    .orderBy(desc(lissaProjects.updatedAt));
  res.json(projects.map(projectSummary));
});

router.get("/projects/:id", async (req, res) => {
  const walletAddress = req.query.walletAddress;
  if (!validWallet(walletAddress)) {
    res.status(400).json({ error: "A valid walletAddress is required." });
    return;
  }
  const [project] = await db.select({
    id: lissaProjects.id,
    title: lissaProjects.title,
    files: lissaProjects.files,
    publishedPath: lissaProjects.publishedPath,
    createdAt: lissaProjects.createdAt,
    updatedAt: lissaProjects.updatedAt,
  }).from(lissaProjects).where(and(
    eq(lissaProjects.id, req.params.id),
    eq(lissaProjects.walletAddress, walletAddress.toLowerCase()),
  ));
  if (!project) {
    res.status(404).json({ error: "Project not found." });
    return;
  }
  res.json({ ...projectSummary(project), files: project.files });
});

router.put("/projects/:id", async (req, res) => {
  const { walletAddress, title, files } = req.body as { walletAddress?: string; title?: string; files?: Record<string, string> };
  if (!walletAddress || !files || typeof files !== "object") {
    res.status(400).json({ error: "walletAddress and files are required." });
    return;
  }
  await db.insert(lissaProjects).values({
    id: req.params.id, walletAddress: walletAddress.toLowerCase(), title: title || "Untitled project", files,
  }).onConflictDoUpdate({
    target: lissaProjects.id,
    set: { title: title || "Untitled project", files, updatedAt: new Date() },
  });
  res.json({ saved: true });
});

router.get("/projects/:id/secrets", async (req, res) => {
  const walletAddress = req.query.walletAddress;
  if (!validWallet(walletAddress)) {
    res.status(400).json({ error: "A valid walletAddress is required." });
    return;
  }
  const [project] = await db.select({ encryptedSecrets: lissaProjects.encryptedSecrets }).from(lissaProjects)
    .where(and(eq(lissaProjects.id, req.params.id), eq(lissaProjects.walletAddress, walletAddress.toLowerCase())));
  if (!project) {
    res.status(404).json({ error: "Project not found." });
    return;
  }
  res.json({ keys: Object.keys(decryptSecrets(project.encryptedSecrets)).sort() });
});

router.put("/projects/:id/secrets", async (req, res) => {
  const { walletAddress, secrets } = req.body as { walletAddress?: string; secrets?: Record<string, string> };
  if (!validWallet(walletAddress) || !secrets || typeof secrets !== "object") {
    res.status(400).json({ error: "A valid walletAddress and secrets are required." });
    return;
  }
  const entries = Object.entries(secrets);
  if (!entries.length || entries.some(([key, value]) => !/^[A-Z][A-Z0-9_]{1,63}$/.test(key) || typeof value !== "string" || !value || value.length > 16_384)) {
    res.status(400).json({ error: "Secret keys or values are invalid." });
    return;
  }
  const [project] = await db.select({ encryptedSecrets: lissaProjects.encryptedSecrets }).from(lissaProjects)
    .where(and(eq(lissaProjects.id, req.params.id), eq(lissaProjects.walletAddress, walletAddress.toLowerCase())));
  if (!project) {
    res.status(404).json({ error: "Save the project before adding secrets." });
    return;
  }
  const mergedSecrets = { ...decryptSecrets(project.encryptedSecrets), ...secrets };
  const encryptedSecrets = encryptSecrets(mergedSecrets);
  const updated = await db.update(lissaProjects).set({ encryptedSecrets, updatedAt: new Date() })
    .where(and(eq(lissaProjects.id, req.params.id), eq(lissaProjects.walletAddress, walletAddress.toLowerCase())))
    .returning({ id: lissaProjects.id });
  res.json({ saved: true, keys: Object.keys(mergedSecrets) });
});

router.delete("/projects/:id/secrets/:key", async (req, res) => {
  const { walletAddress } = req.body as { walletAddress?: string };
  const key = req.params.key;
  if (!validWallet(walletAddress) || !/^[A-Z][A-Z0-9_]{1,63}$/.test(key)) {
    res.status(400).json({ error: "A valid walletAddress and secret key are required." });
    return;
  }
  const [project] = await db.select({ encryptedSecrets: lissaProjects.encryptedSecrets }).from(lissaProjects)
    .where(and(eq(lissaProjects.id, req.params.id), eq(lissaProjects.walletAddress, walletAddress.toLowerCase())));
  if (!project) {
    res.status(404).json({ error: "Project not found." });
    return;
  }
  const secrets = decryptSecrets(project.encryptedSecrets);
  delete secrets[key];
  await db.update(lissaProjects).set({ encryptedSecrets: encryptSecrets(secrets), updatedAt: new Date() })
    .where(and(eq(lissaProjects.id, req.params.id), eq(lissaProjects.walletAddress, walletAddress.toLowerCase())));
  res.json({ deleted: true, keys: Object.keys(secrets).sort() });
});

router.post("/projects/:id/publish", async (req, res) => {
  const { walletAddress, files } = req.body as { walletAddress?: string; files?: Record<string, string> };
  if (!walletAddress || !files || !bucketId) {
    res.status(400).json({ error: "Project files or Object Storage are unavailable." });
    return;
  }
  const prefix = `published/${req.params.id}`;
  await Promise.all(Object.entries(files).map(([path, content]) =>
    storage.bucket(bucketId).file(`${prefix}/${path.replace(/^\/+/, "")}`).save(content, {
      contentType: path.endsWith(".html") ? "text/html" : path.endsWith(".css") ? "text/css" : path.match(/\.[cm]?[jt]sx?$/) ? "text/javascript" : "text/plain",
      resumable: false,
    }),
  ));
  await db.update(lissaProjects).set({ files, publishedPath: prefix, updatedAt: new Date() })
    .where(and(eq(lissaProjects.id, req.params.id), eq(lissaProjects.walletAddress, walletAddress.toLowerCase())));
  res.json({ published: true, url: `/api/published/${req.params.id}/index.html` });
});

router.get("/published/:id/*file", async (req, res) => {
  const rawFile = req.params.file;
  const file = Array.isArray(rawFile) ? rawFile.join("/") : rawFile;
  if (!bucketId || !file || file.includes("..")) {
    res.status(404).end();
    return;
  }
  try {
    const [content] = await storage.bucket(bucketId).file(`published/${req.params.id}/${file}`).download();
    if (file.endsWith(".html")) res.type("html");
    else if (file.endsWith(".css")) res.type("css");
    else if (file.match(/\.[cm]?[jt]s$/)) res.type("js");
    res.send(content);
  } catch {
    res.status(404).end();
  }
});

export default router;