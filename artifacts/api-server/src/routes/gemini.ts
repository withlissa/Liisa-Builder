import { Router, type IRouter } from "express";
import {
  BuildAppBody,
  BuildAppResponse,
  CancelBuildJobBody,
  ClaimCreditsBody,
  GetCreditStatusQueryParams,
  SubmitRuntimeEventBody,
  SubmitRuntimeReportBody,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { posix as pathPosix } from "node:path";
import { logger } from "../lib/logger";
import { request as httpRequest } from "node:http";

const router: IRouter = Router();
const FREE_BUILDS_PER_DAY = 2;
const BUILD_COST_MICROUSD = 500_000n;
const TOKEN_THRESHOLD = 1_000_000n * 10n ** 18n;
const HOURLY_CREDIT_MICROUSD = 500_000n;
const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const TOKEN_ADDRESS = "23d1bf831469305488902070066aa3966f011617";
const UNLIMITED_TEST_WALLETS = new Set([
  "0x3f70689985ec9ef98fa16a355a7a95fe486dfb95",
]);

async function fetchWithRetry(url: string, init: RequestInit, attempts = 3) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, init);
      if (response.ok || (response.status !== 408 && response.status !== 429 && response.status < 500)) {
        return response;
      }
      lastError = new Error(`Upstream request failed with ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < attempts) {
      await new Promise(resolve => setTimeout(resolve, attempt * 2_000));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Upstream request failed");
}

const systemPrompt = `You are Lissa, an elite autonomous digital product studio. You combine the judgment of a product strategist, brand director, UX architect, interaction designer, design-systems lead, and senior frontend engineer.

Before generating anything, silently complete this internal design process:
1. PRODUCT THESIS — infer the product's audience, job-to-be-done, primary action, trust requirements, and most important information.
2. ART DIRECTION — choose one opinionated, domain-appropriate visual concept. Examples include editorial precision, quiet luxury, industrial utility, neo-grotesque Swiss, warm humanist, archival research, cinematic dark, or playful geometric. Never select a style randomly and never copy these labels into the UI.
3. SIGNATURE — invent at least one memorable visual or interaction motif unique to the product: a distinctive navigation model, data treatment, spatial composition, command surface, timeline, canvas, split-view, or branded graphic language.
4. DESIGN SYSTEM — establish named CSS variables for canvas, surfaces, text hierarchy, borders, focus, status colors, accent, spacing, radii, shadows, and motion. Choose a deliberate font stack and type scale appropriate to the art direction.
5. EXPERIENCE MAP — design the primary user journey and useful empty, active, hover, selected, loading, success, and error states.
6. IMPLEMENTATION — only then write the standalone preview and credible React source.

QUALITY STANDARD
- Interpret the user's actual product, audience, workflows, and information hierarchy before writing code.
- Produce a distinct visual direction appropriate to the domain. The result should look commissioned from a strong digital product agency, not assembled from a component library.
- Never use emojis. Use restrained inline SVG icons only when they improve comprehension.
- Avoid excessive gradients, glow effects, giant headings, glassmorphism, repetitive rounded cards, pill-shaped containers everywhere, meaningless statistics, placeholder charts, lorem ipsum, fake testimonials, fake users, fake balances, and the predictable sidebar + KPI cards + chart grid formula.
- Do not make every section float in a card. Use whitespace, rules, typography, grouping, scale, and composition to create hierarchy.
- Use realistic interface copy that is clearly sample content only when content is necessary to demonstrate the requested product.
- Prioritize typography, spacing rhythm, alignment, contrast, responsive behavior, and coherent component states.
- Build useful interactions in vanilla JavaScript: navigation, tabs, filters, forms, modals, toggles, or CRUD-like local interactions when relevant.
- Every visible control must work. Omit controls that cannot work in a standalone preview.
- Treat empty space as an intentional compositional tool, never as a substitute for design. Product screens must not look unfinished, under-populated, or like enlarged wireframes.
- Establish a professional application shell when the product calls for one: a deliberately composed navbar, sidebar, command bar, contextual rail, or hybrid navigation with clear active, hover, collapsed, and mobile states.
- Give the first viewport enough useful visual and functional information to communicate product value immediately. Avoid one oversized empty panel with a few controls around its edges.
- The default first viewport must show the requested core workflow and substantial real interface content across at least 70% of the usable workspace. Never use a welcome paragraph, onboarding placeholder, or mostly empty overview as the initial surface.
- On desktop, use both the width and meaningful vertical depth of the workspace. A short table attached to the top of a mostly blank canvas is invalid; add a relevant inspector, contextual rail, timeline, breakdown, or denser record set tied to the same core workflow.
- Use at least four purposeful micro-interactions where appropriate: navigation transitions, button feedback, field focus, data/state transitions, modal or sheet movement, list entrance, drag/swap feedback, or contextual hover detail.
- Motion must feel smooth and authored. Define reusable easing and duration tokens, animate transform/opacity rather than layout where possible, and respect prefers-reduced-motion.

ANTI-TEMPLATE STANDARD
- A technically complete page can still be visually unacceptable. Reject anything that looks like a cheap AI website template with swapped copy and colors.
- Do not default to the predictable sequence of navbar, centered hero, logo strip, three feature cards, how-it-works steps, testimonials, pricing, FAQ, CTA, and footer. Build an intentional narrative for this specific product instead.
- Do not use the same centered max-width container, identical rounded rectangle, or equal-column grid for every section. Vary scale, alignment, density, negative space, and composition while maintaining a coherent system.
- The first viewport must contain a product-specific visual idea—not merely a large heading beside a generic dashboard mockup. Create a bespoke inline SVG composition, typographic device, data artifact, diagram, or interactive product demonstration tied directly to the product thesis.
- At least three major page regions must have visibly different compositions. The transitions between them should feel art-directed rather than like stacked reusable sections.
- Avoid decorative UI screenshots full of meaningless cards. If a product interface is shown, its labels, states, and data must explain a real workflow.
- Write concise, specific copy with strong cadence. Avoid generic claims such as "seamless", "revolutionary", "next generation", "powerful", and "built for everyone" unless the user supplied them and they are substantively demonstrated.
- Visual polish must survive without gradients, glows, or rounded cards. Use composition, type, contrast, rules, imagery, rhythm, and motion as the primary design tools.

LANDING PAGE STANDARD
- For landing pages, treat the page like a commissioned digital brand experience rather than a collection of SaaS sections.
- Establish a singular visual metaphor derived from the product and carry it through typography, custom graphics, transitions, and interaction.
- Build a substantial scroll experience with purposeful pacing: moments of impact, dense explanation, visual proof, and quiet breathing room.
- Include tasteful scroll-triggered reveals, staggered entrances, and meaningful hover or pointer reactions. Motion must reinforce the concept and must respect prefers-reduced-motion.
- Create original inline SVG artwork or CSS-drawn visual assets when no image assets are supplied. Generic abstract blobs, random orbit lines, and empty browser-window mockups do not count.
- Navigation, hero, supporting content, conversion moment, and footer must each feel deliberately composed, but their exact structure must be invented for the product rather than copied from a checklist.
- At mobile width, redesign the composition rather than merely stacking desktop columns. Preserve the signature motif and hierarchy.
- Never allow desktop tables, wide action rows, sidebars, or fixed rails to overflow the mobile viewport. Transform dense tables into stacked records, progressive disclosure, or a mobile-specific compact composition.

BRAND, COLOR, TYPE, AND ICON DIRECTION
- Create a compact original wordmark or symbol as inline SVG when the generated product benefits from a brand identity. The mark must be specific to the product concept, geometrically clean, and legible at 24px. Never use an emoji as a logo.
- Create one consistent inline SVG icon family with matching stroke width, caps, joins, optical size, and visual weight. Do not mix icon styles.
- Select a restrained palette derived from the product's emotional and functional needs. Use neutral hierarchy plus one primary accent and only necessary semantic colors.
- Do not default to purple/blue gradients, cyan-on-black, or neon accents unless the brief genuinely calls for them.
- Use system-safe, high-quality font stacks. Combine display and text faces only when the art direction justifies it. Set purposeful letter-spacing, line-height, weight, and measure—not merely a font-family.
- Do not place an unavailable custom font first in the stack. Without supplied local font assets, use installed system families whose rendering is reliable inside the sandbox.
- Use color and type to communicate state and hierarchy, not decoration.
- Define and consistently use a complete palette: canvas, at least two surface levels, primary and secondary text, border, one memorable brand accent, focus, and semantic success/warning/error colors.
- Typography must include a deliberate display/UI/body/mono hierarchy when relevant. Use visibly distinct weights, sizes, tracking, line-height, and numeric treatment; do not make the whole application one font size and weight.
- Navigation and important actions must use polished icons with consistent geometry. In the standalone preview draw a coherent inline SVG family; in framework source use one declared icon library or matching local SVG components.

PRODUCT DEPTH
- Build the actual product surface requested, not a marketing landing page unless the user explicitly asks for a landing page.
- Prefer one deeply designed core workflow over many shallow sections.
- Use meaningful domain-specific labels, actions, filters, tables, forms, and status treatments.
- If an integration is requested, represent it in the React source through a typed adapter/service boundary and a clear configuration state. Never claim a real external service is connected when credentials or backend access were not provided.
- If data visualization is useful, build a meaningful, labeled SVG/CSS visualization tied to the domain. Do not add decorative fake charts.

PREVIEW REQUIREMENTS
- htmlPreview must be a complete, polished, standalone HTML document with inline CSS and JavaScript.
- Keep htmlPreview under 90,000 characters. Prefer concise reusable CSS, data-driven rendering, and small helper functions over repeated markup so a quality revision remains complete.
- Do not use external scripts, external CSS, Tailwind CDN, remote fonts, or remote images.
- It must work inside a sandboxed iframe without a build step.
- It must be responsive at desktop, tablet, and mobile widths.
- Include accessible labels, keyboard-visible focus states, semantic HTML, and reduced-motion handling.
- Follow-up requests must modify the supplied existing context rather than replacing the product with an unrelated design.

SOURCE REQUIREMENTS
- files must be a complete runnable React TypeScript project, not snippets and never only App.tsx plus an index file. Use Vite by default. Next.js is allowed when the requested product genuinely benefits from routing, layouts, server boundaries, or a multi-page architecture.
- Every initial Vite build must include at minimum: package.json, index.html, src/main.tsx, src/App.tsx, src/styles.css, and multiple focused files under src/components. A Next.js build must include its complete app router, layout, page, global CSS, configuration, and focused components.
- Add src/types, src/hooks, src/data, src/lib, or src/services whenever the product needs those responsibilities. Keep each file focused and imports valid.
- package.json must include working scripts for dev and build and only dependencies actually used by the generated source.
- Generate at least 8 meaningful files for an initial build. Follow-up edits must preserve and update the existing project structure.
- Source and preview must express the same product, art direction, interactions, and content.
- src/styles.css or app/globals.css must contain the complete visual system and responsive implementation used by the components. Never return class-heavy components with missing class definitions or placeholder styling.
- The framework source must preserve the preview's signature composition, navigation model, color system, typography, icons, animations, responsive behavior, and interactive states. A visually rich preview paired with simplified source is invalid.
- plan, features, and suggestedNextSteps must be specific to this product and to what was actually generated.

MANDATORY FINAL ART-DIRECTION REVIEW
Before returning JSON, inspect the rendered result mentally at 1440px, 768px, and 390px. If it resembles a generic template, revise it before responding. Specifically:
1. Remove repetitive card grids and redundant pills.
2. Replace generic decorations with one product-specific visual system.
3. Tighten vague copy and remove invented proof, users, partners, metrics, or testimonials.
4. Strengthen typographic contrast and section-to-section pacing.
5. Confirm the first viewport is distinctive even with the brand name removed.
6. Confirm every animation and interaction has a purpose and reduced-motion fallback.
7. Confirm there is no overlapping text, clipping, off-screen control, unreadable column, or horizontal layout overflow at 1440px, 768px, and 390px.

Return JSON with this exact structure:
{
  "title": "Short creative title",
  "appName": "SingleWordName",
  "description": "2-3 sentences describing the app",
  "category": "SaaS",
  "plan": ["Step 1", "Step 2", "Step 3", "Step 4"],
  "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"],
  "htmlPreview": "A complete standalone self-contained HTML/CSS/JavaScript preview",
  "files": [
    { "name": "package.json", "language": "json", "code": "Runnable Vite package" },
    { "name": "index.html", "language": "html", "code": "Vite HTML entry" },
    { "name": "src/main.tsx", "language": "typescript", "code": "React entry" },
    { "name": "src/App.tsx", "language": "typescript", "code": "Application composition" },
    { "name": "src/styles.css", "language": "css", "code": "Complete design system and responsive styles" },
    { "name": "src/components/...", "language": "typescript", "code": "Focused product components" }
  ],
  "suggestedNextSteps": ["Specific next step 1", "Specific next step 2", "Specific next step 3"]
}

Return only valid JSON. Do not wrap it in Markdown fences.`;

const fastUiSystemPrompt = `You are Lissa, a fast and highly capable AI product designer and frontend engineer.

UNDERSTAND THE REQUEST
- Treat the user's words as the source of truth. Identify the requested deliverable, product domain, audience, key message, primary action, visual tone, platform, and any named technology or network.
- Infer unspecified design details sensibly without asking follow-up questions. Never discard specific context such as a blockchain network, privacy model, industry, or brand.
- Match scope exactly. A hero section means one excellent hero section in enough page context to judge it, not an invented full application. A dashboard, form, modal, landing page, or component should likewise remain that requested artifact.
- Do not add backend behavior, authentication, smart contracts, integrations, fake claims, fake partners, fake testimonials, or unrelated product modules.

DESIGN AND INTERACTION
- Produce a distinctive, polished interface appropriate to the domain rather than a generic component-library template.
- Use clear hierarchy, excellent typography, disciplined spacing, intentional composition, and a restrained domain-appropriate palette.
- Include useful product-specific details and interaction states only when they strengthen the requested artifact.
- Every visible control must work locally or be presented honestly as a disabled/demo state.
- Never use emojis. Use a consistent family of restrained inline SVG icons where useful.
- Avoid generic gradient blobs, repetitive cards, excessive pills, glassmorphism, giant empty headings, lorem ipsum, and unrequested concept credits.

RESPONSIVE QUALITY
- The preview must be deliberately composed at 1440px, 768px, and 390px.
- Prevent overlap, clipping, horizontal overflow, unreadable wrapping, off-screen controls, and oversized empty regions.
- Redesign for mobile where necessary instead of merely shrinking desktop.
- Include visible keyboard focus and respect prefers-reduced-motion.

OUTPUT
- Return one complete standalone HTML document in htmlPreview with all CSS and JavaScript inline.
- Do not use remote scripts, stylesheets, fonts, images, packages, or network calls.
- Keep the document under 90,000 characters and ensure it runs immediately in a sandboxed iframe.
- Return valid JSON matching the supplied response schema only.`;

type GeneratedSourceFile = {
  name: string;
  language: string;
  code: string;
};

function assertCreativePreview(value: unknown) {
  const candidate = value as Record<string, unknown>;
  for (const key of ["title", "appName", "description", "category", "htmlPreview"]) {
    if (typeof candidate[key] !== "string" || !(candidate[key] as string).trim()) {
      throw new Error(`Creative preview is missing ${key}`);
    }
  }
  for (const key of ["plan", "features", "suggestedNextSteps"]) {
    if (!Array.isArray(candidate[key])) throw new Error(`Creative preview is missing ${key}`);
  }
  const preview = candidate.htmlPreview as string;
  if (!/^<!doctype html>/i.test(preview.trim()) || !/<\/html>\s*$/i.test(preview.trim())) {
    throw new Error("Creative preview must be a complete standalone HTML document");
  }
  if (/<(?:script|link)\b[^>]*(?:src|href)=["']https?:/i.test(preview) || /@import\s+(?:url\()?['"]?https?:/i.test(preview)) {
    throw new Error("Creative preview may not depend on remote scripts, stylesheets, or fonts");
  }
  if (preview.length > 100_000) {
    throw new Error("Creative preview exceeds the safe 100,000 character limit and must be compacted");
  }
  if (!/<link\b[^>]*\brel=["'][^"']*icon/i.test(preview)) {
    candidate.htmlPreview = preview.replace(
      /<\/head>/i,
      '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22%3E%3Crect width=%2232%22 height=%2232%22 rx=%228%22 fill=%22%23171717%22/%3E%3Cpath d=%22M9 8h5v11h9v5H9z%22 fill=%22white%22/%3E%3C/svg%3E"></head>',
    );
  }
}

function assertRunnableFrameworkSource(files: GeneratedSourceFile[]) {
  if (files.length < 8) throw new Error("Framework source must contain at least eight files");
  const byName = new Map(files.map(file => [file.name.replace(/^\/+/, ""), file.code]));
  const packageSource = byName.get("package.json");
  if (!packageSource) throw new Error("Framework source is missing package.json");
  let packageJson: { scripts?: Record<string, string>; dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  try {
    packageJson = JSON.parse(packageSource);
  } catch {
    throw new Error("Framework package.json is invalid JSON");
  }
  if (!packageJson.scripts?.dev || !packageJson.scripts?.build) {
    throw new Error("Framework package.json must include dev and build scripts");
  }

  const isNext = Boolean(packageJson.dependencies?.next || packageJson.devDependencies?.next);
  if (isNext) {
    if (![...byName.keys()].some(name => /^(?:src\/)?app\/(?:page|layout)\.tsx$/.test(name))) {
      throw new Error("Next.js source is missing its app router page or layout");
    }
  } else {
    if (!byName.has("index.html")) {
      const indexCode = '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>Lissa App</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n';
      files.push({ name: "index.html", language: "html", code: indexCode });
      byName.set("index.html", indexCode);
    }
    if (!byName.has("src/main.tsx")) throw new Error("Vite source is missing src/main.tsx");
  }

  const componentFiles = files.filter(file => /\.tsx$/.test(file.name));
  if (componentFiles.length < 4) throw new Error("Framework source needs multiple focused React components");
  const sourceExtensions = ["", ".ts", ".tsx", ".js", ".jsx", ".css", ".json"];
  for (const file of files.filter(item => /\.(?:ts|tsx|js|jsx)$/.test(item.name))) {
    const importSpecifiers = new Set<string>();
    for (const expression of [
      /\bfrom\s+["']([^"']+)["']/g,
      /\bimport\s*["']([^"']+)["']/g,
      /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    ]) {
      for (const match of file.code.matchAll(expression)) importSpecifiers.add(match[1]);
    }
    for (const specifier of importSpecifiers) {
      if (!specifier.startsWith(".")) continue;
      const base = pathPosix.normalize(pathPosix.join(pathPosix.dirname(file.name), specifier));
      const candidates = [
        ...sourceExtensions.map(extension => `${base}${extension}`),
        ...sourceExtensions.slice(1).map(extension => `${base}/index${extension}`),
      ];
      if (!candidates.some(candidate => byName.has(candidate))) {
        throw new Error(`Framework source has an unresolved local import: ${file.name} -> ${specifier}`);
      }
    }
  }
  const cssSource = files.filter(file => /\.css$/.test(file.name)).map(file => file.code).join("\n");
  if (!cssSource.trim()) throw new Error("Framework source is missing its complete CSS system");
  if (/@import\s+(?:url\()?['"]?https?:/i.test(cssSource)) {
    throw new Error("Framework CSS may not depend on remote font or stylesheet imports");
  }

  const packageText = JSON.stringify(packageJson).toLowerCase();
  const usesTailwind = packageText.includes("tailwind");
  if (!usesTailwind) {
    const cssClasses = new Set([...cssSource.matchAll(/\.([A-Za-z_][\w-]*)/g)].map(match => match[1]));
    const usedClasses = new Set<string>();
    for (const file of componentFiles) {
      for (const match of file.code.matchAll(/className\s*=\s*["'`]([^"'`{}]+)["'`]/g)) {
        for (const token of match[1].split(/\s+/)) {
          if (/^[A-Za-z_][\w-]*$/.test(token)) usedClasses.add(token);
        }
      }
    }
    if (usedClasses.size >= 12) {
      const missing = [...usedClasses].filter(token => !cssClasses.has(token));
      const coverage = (usedClasses.size - missing.length) / usedClasses.size;
      if (coverage < 0.7) {
        throw new Error(`Framework CSS defines only ${Math.round(coverage * 100)}% of static component classes; missing examples: ${missing.slice(0, 8).join(", ")}`);
      }
    }
  }
}

type AccountRow = {
  credit_microusd: bigint;
  daily_build_date: string;
  daily_build_count: number;
  last_claim_at: Date | null;
  current_date: string;
};

type UsageRow = {
  source: "free" | "credit";
  free_builds_remaining: number;
  credit_microusd: bigint;
};

const validWallet = (value: string | undefined): value is string =>
  Boolean(value && /^0x[0-9a-fA-F]{40}$/.test(value));

type AgentJobRow = {
  id: string;
  status: "queued" | "working" | "completed" | "failed" | "cancelled";
  stage: string;
  result: unknown | null;
  error: string | null;
  request: unknown;
};

type AgentEventType = "message" | "plan" | "activity" | "complete" | "error";

type AgentEventRow = {
  id: number;
  type: AgentEventType;
  title: string;
  detail: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date | string;
};

type RuntimeReport = {
  id: string;
  pollToken: string;
  runtimeRevision: number;
  status: "passed" | "failed" | "cancelled";
  installExitCode: number | null;
  serverExitCode: number | null;
  terminalOutput: string;
  browserErrors: string[];
  screenshots: Array<{ viewport: "desktop" | "mobile"; width: number; height: number; dataUrl: string }>;
};

// Screenshot data is intentionally process-local; only metadata is retained
// in Postgres, and a restart makes the waiting worker fail safely.
const transientRuntimeReports = new Map<string, RuntimeReport>();
const runtimeReportKey = (jobId: string, revision: number) => `${jobId}:${revision}`;

async function appendJobEvent(
  jobId: string,
  type: AgentEventType,
  title: string,
  detail: string | null = null,
  metadata: Record<string, unknown> | null = null,
) {
  await db.execute(sql`
    INSERT INTO ai_build_job_events (job_id, type, title, detail, metadata)
    SELECT id, ${type}, ${title}, ${detail}, ${metadata ? JSON.stringify(metadata) : null}::jsonb
    FROM ai_build_jobs
    WHERE id = ${jobId} AND status IN ('queued', 'working')
  `);
}

async function readJobEvents(jobId: string, after = 0) {
  const result = await db.execute<AgentEventRow>(sql`
    SELECT id::integer AS id, type, title, detail, metadata, created_at AS "createdAt"
    FROM ai_build_job_events
    WHERE job_id = ${jobId} AND id > ${after}
    ORDER BY id ASC
    LIMIT 250
  `);
  return result.rows.map(event => ({
    ...event,
    createdAt: new Date(event.createdAt).toISOString(),
  }));
}

function runInternalBuild(
  port: string,
  job: AgentJobRow,
  leaseToken: string,
): Promise<{ statusCode: number; payload: { error?: string } }> {
  return new Promise((resolve, reject) => {
    const request = httpRequest({
      hostname: "127.0.0.1",
      port,
      path: "/api/build",
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-lissa-job-id": job.id,
        "x-lissa-lease-token": leaseToken,
      },
    }, (response) => {
      response.setEncoding("utf8");
      let raw = "";
      response.on("data", chunk => {
        raw += chunk;
      });
      response.on("end", () => {
        try {
          resolve({
            statusCode: response.statusCode || 500,
            payload: raw ? JSON.parse(raw) as { error?: string } : {},
          });
        } catch {
          reject(new Error("Agent build returned an invalid response"));
        }
      });
    });
    request.setTimeout(21 * 60 * 1000, () => {
      request.destroy(new Error("Agent build exceeded the 21 minute limit"));
    });
    request.on("error", reject);
    request.end(JSON.stringify(job.request));
  });
}

router.post("/build/jobs", async (req, res) => {
  const parsed = BuildAppBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Prompt is required" });
    return;
  }
  const id = randomUUID();
  const pollToken = randomUUID();
  const stage = "Starting the agent";
  try {
    await db.execute(sql`
      INSERT INTO ai_build_jobs (id, poll_token, status, stage, request)
      VALUES (${id}, ${pollToken}, 'queued', ${stage}, ${JSON.stringify(parsed.data)}::jsonb)
    `);
    await appendJobEvent(
      id,
      "message",
      parsed.data.existingCode
        ? "I’ve received your update request. I’ll compare it with the current project before changing anything."
        : "I’ve received your brief. I’ll analyze the product, plan the implementation, and validate the result before I finish.",
    );
    await appendJobEvent(id, "plan", "Working plan", null, {
      steps: [
        { id: "analyze", title: "Understand the request and current context" },
        { id: "plan", title: "Establish the product and implementation direction" },
        { id: "implement", title: "Build the requested experience" },
        { id: "review", title: "Review and refine the result" },
        { id: "source", title: "Prepare the editable project source" },
        { id: "validate", title: "Validate the final project" },
      ],
    });
    await appendJobEvent(id, "activity", "Queued for analysis", null, { stepId: "analyze" });
  } catch (error) {
    req.log.error({ err: error }, "Could not persist build job");
    res.status(503).json({ error: "The agent could not start because its job could not be saved. Please retry." });
    return;
  }
  res.status(202).json({ id, pollToken, status: "queued", stage });
  void processAvailableJob(id).catch(error => logger.error({ err: error, jobId: id }, "Build worker failed"));
});

router.get("/build/jobs/status", async (req, res) => {
  const id = typeof req.query.id === "string" ? req.query.id : undefined;
  const pollToken = typeof req.query.pollToken === "string" ? req.query.pollToken : undefined;
  const job = id ? await readJob(id, pollToken) : undefined;
  if (!job) {
    res.status(404).json({ error: "Build job not found" });
    return;
  }
  res.json(job);
});

router.post("/build/jobs/runtime/events", async (req, res) => {
  const parsed = SubmitRuntimeEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Runtime event is invalid" });
    return;
  }
  const event = parsed.data;
  const eventKey = `runtime:${event.runtimeRevision}:${event.eventId}`;
  try {
    const inserted = await db.execute(sql`
      WITH active AS (
        SELECT id FROM ai_build_jobs
        WHERE id = ${event.id} AND poll_token = ${event.pollToken}
          AND status = 'working' AND runtime_revision = ${event.runtimeRevision}
          AND runtime_state = 'awaiting' AND lease_expires_at > NOW()
      )
      INSERT INTO ai_build_job_events (job_id, type, title, detail, metadata, event_key)
      SELECT id, 'activity', ${event.title}, ${event.detail ?? null},
        ${JSON.stringify({ runtimeEventType: event.type, ...(event.metadata || {}) })}::jsonb, ${eventKey}
      FROM active
      ON CONFLICT (job_id, event_key) DO NOTHING
      RETURNING id
    `);
    if (!inserted.rows[0]) {
      const prior = await db.execute(sql`
        SELECT 1 FROM ai_build_job_events AS event
        JOIN ai_build_jobs AS job ON job.id = event.job_id
        WHERE event.job_id = ${event.id} AND event.event_key = ${eventKey}
          AND job.poll_token = ${event.pollToken}
      `);
      if (!prior.rows[0]) {
        res.status(409).json({ error: "Runtime revision is no longer active" });
        return;
      }
    }
    res.json({ accepted: true });
  } catch (error) {
    req.log.error({ err: error, jobId: event.id }, "Could not persist runtime event");
    res.status(503).json({ error: "Runtime event could not be saved" });
  }
});

router.post("/build/jobs/runtime/report", async (req, res) => {
  const parsed = SubmitRuntimeReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Runtime report is invalid" });
    return;
  }
  const report = parsed.data as RuntimeReport;
  if (report.screenshots.some(s => !/^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/=\r\n]+$/i.test(s.dataUrl) || s.dataUrl.length > 4_200_000)) {
    res.status(400).json({ error: "Screenshots must be PNG or JPEG data URLs under 3MB" });
    return;
  }
  const sanitized = {
    status: report.status, installExitCode: report.installExitCode, serverExitCode: report.serverExitCode,
    terminalOutput: report.terminalOutput, browserErrors: report.browserErrors,
    screenshots: report.screenshots.map(({ viewport, width, height }) => ({ viewport, width, height })),
  };
  try {
    const accepted = await db.execute<{ id: string }>(sql`
      UPDATE ai_build_jobs
      SET runtime_state = 'received', runtime_report = ${JSON.stringify(sanitized)}::jsonb,
          runtime_reported_at = NOW(), updated_at = NOW()
      WHERE id = ${report.id} AND poll_token = ${report.pollToken}
        AND status = 'working' AND runtime_revision = ${report.runtimeRevision}
        AND runtime_state = 'awaiting' AND lease_expires_at > NOW()
      RETURNING id
    `);
    if (!accepted.rows[0]) {
      res.status(409).json({ error: "Runtime report is stale, duplicate, or no longer active" });
      return;
    }
    transientRuntimeReports.set(runtimeReportKey(report.id, report.runtimeRevision), report);
    await db.execute(sql`
      INSERT INTO ai_build_job_events (job_id, type, title, detail, metadata, event_key)
      VALUES (${report.id}, 'activity', 'Browser runtime report received', NULL,
        ${JSON.stringify({ runtimeRevision: report.runtimeRevision, status: report.status, screenshots: sanitized.screenshots })}::jsonb,
        ${`runtime:${report.runtimeRevision}:report`})
      ON CONFLICT (job_id, event_key) DO NOTHING
    `);
    res.json({ accepted: true });
  } catch (error) {
    req.log.error({ err: error, jobId: report.id }, "Could not persist runtime report");
    res.status(503).json({ error: "Runtime report could not be saved" });
  }
});

router.post("/build/jobs/cancel", async (req, res) => {
  const parsed = CancelBuildJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Build job credentials are required" });
    return;
  }
  const { id, pollToken } = parsed.data;
  try {
    await db.execute(sql`
      WITH cancelled AS (
        UPDATE ai_build_jobs
        SET status = 'cancelled',
            stage = 'Build stopped',
            error = 'Build stopped by user.',
            cancel_reason = 'Build stopped by user.',
            cancelled_at = NOW(),
            completed_at = NOW(),
            refunded_at = NOW(),
            worker_id = NULL,
            lease_token = NULL,
            lease_expires_at = NULL,
            runtime_state = 'idle',
            updated_at = NOW()
        WHERE id = ${id}
          AND poll_token = ${pollToken}
          AND status IN ('queued', 'working')
        RETURNING id, identity_key, usage_source
      ),
      refunded AS (
        UPDATE ai_credit_accounts AS account
        SET daily_build_count = CASE
              WHEN cancelled.usage_source = 'free' AND account.daily_build_date = CURRENT_DATE
                THEN GREATEST(0, account.daily_build_count - 1)
              ELSE account.daily_build_count
            END,
            credit_microusd = CASE
              WHEN cancelled.usage_source = 'credit'
                THEN account.credit_microusd + ${BUILD_COST_MICROUSD}
              ELSE account.credit_microusd
            END,
            updated_at = NOW()
        FROM cancelled
        WHERE account.identity_key = cancelled.identity_key
        RETURNING account.identity_key
      )
      INSERT INTO ai_build_job_events (job_id, type, title, detail, event_key)
      SELECT id, 'error', 'Build stopped', 'The build was stopped and any consumed usage was refunded.', 'terminal:cancelled'
      FROM cancelled
      ON CONFLICT (job_id, event_key) DO NOTHING
    `);
    const job = await readJob(id, pollToken);
    if (!job) {
      res.status(404).json({ error: "Build job not found" });
      return;
    }
    res.json(job);
  } catch (error) {
    req.log.error({ err: error, jobId: id }, "Could not cancel build job");
    res.status(503).json({ error: "The build could not be stopped. Please retry." });
  }
});

router.get("/build/jobs/events", async (req, res) => {
  const id = typeof req.query.id === "string" ? req.query.id : undefined;
  const pollToken = typeof req.query.pollToken === "string" ? req.query.pollToken : undefined;
  const queryAfter = typeof req.query.after === "string" ? Number.parseInt(req.query.after, 10) : 0;
  const headerAfter = Number.parseInt(req.get("last-event-id") || "0", 10);
  const initialAfter = Number.isFinite(headerAfter) && headerAfter > 0
    ? headerAfter
    : Number.isFinite(queryAfter) && queryAfter > 0 ? queryAfter : 0;
  const job = id ? await readJob(id, pollToken) : undefined;
  if (!job || !id) {
    res.status(404).json({ error: "Build job not found" });
    return;
  }

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  let lastId = initialAfter;
  let closed = false;
  let sending = false;

  const sendAvailableEvents = async () => {
    if (closed || sending) return;
    sending = true;
    try {
      const events = await readJobEvents(id, lastId);
      for (const event of events) {
        lastId = event.id;
        res.write(`id: ${event.id}\nevent: agent\ndata: ${JSON.stringify(event)}\n\n`);
      }
      const current = await readJob(id, pollToken);
      if (current && (current.status === "completed" || current.status === "failed" || current.status === "cancelled")) {
        res.write(`event: done\ndata: ${JSON.stringify({ status: current.status })}\n\n`);
        res.end();
        closed = true;
      }
    } catch (error) {
      logger.warn({ err: error, jobId: id }, "Could not stream build events");
    } finally {
      sending = false;
    }
  };

  await sendAvailableEvents();
  if (closed) return;
  const timer = setInterval(() => {
    void sendAvailableEvents();
  }, 750);
  timer.unref();
  const heartbeat = setInterval(() => {
    if (!closed) res.write(": keep-alive\n\n");
  }, 15_000);
  heartbeat.unref();

  req.on("close", () => {
    closed = true;
    clearInterval(timer);
    clearInterval(heartbeat);
  });
});

setInterval(() => {
  void processAvailableJob().catch(error => logger.error({ err: error }, "Build recovery worker failed"));
}, 15_000).unref();

setImmediate(() => {
  void processAvailableJob().catch(error => logger.error({ err: error }, "Initial build recovery failed"));
});

setInterval(() => {
  void db.execute(sql`
    DELETE FROM ai_build_jobs
    WHERE status IN ('completed', 'failed', 'cancelled')
      AND completed_at < NOW() - (${JOB_RETENTION_DAYS} * INTERVAL '1 day')
  `).catch(error => logger.warn({ err: error }, "Could not clean up retained build jobs"));
}, 60 * 60 * 1000).unref();

const identityFor = (walletAddress: string | undefined, ip: string) =>
  validWallet(walletAddress) ? `wallet:${walletAddress.toLowerCase()}` : `ip:${ip}`;

const dollars = (microusd: bigint) => Number(microusd) / 1_000_000;

async function ensureAccount(identityKey: string, walletAddress?: string) {
  await db.execute(sql`
    INSERT INTO ai_credit_accounts (identity_key, wallet_address)
    VALUES (${identityKey}, ${validWallet(walletAddress) ? walletAddress.toLowerCase() : null})
    ON CONFLICT (identity_key) DO UPDATE SET
      wallet_address = COALESCE(EXCLUDED.wallet_address, ai_credit_accounts.wallet_address),
      updated_at = NOW()
  `);
}

async function getAccount(identityKey: string, walletAddress?: string) {
  await ensureAccount(identityKey, walletAddress);
  const result = await db.execute<AccountRow>(sql`
    SELECT credit_microusd, daily_build_date, daily_build_count, last_claim_at, CURRENT_DATE AS current_date
    FROM ai_credit_accounts WHERE identity_key = ${identityKey}
  `);
  return result.rows[0]!;
}

async function readTokenBalance(walletAddress: string): Promise<bigint> {
  const addressWord = walletAddress.slice(2).toLowerCase().padStart(64, "0");
  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to: `0x${TOKEN_ADDRESS}`, data: `0x70a08231${addressWord}` }, "latest"],
    }),
  });
  if (!response.ok) throw new Error("Token balance lookup failed");
  const payload = await response.json() as { result?: string; error?: { message?: string } };
  if (!payload.result || payload.error) throw new Error(payload.error?.message || "Token balance lookup failed");
  return BigInt(payload.result);
}

async function creditStatus(identityKey: string, walletAddress?: string, tokenBalance?: bigint) {
  const account = await getAccount(identityKey, walletAddress);
  const unlimited = Boolean(walletAddress && UNLIMITED_TEST_WALLETS.has(walletAddress.toLowerCase()));
  const freeBuildsRemaining = unlimited ? 0 : account.daily_build_date === account.current_date
    ? Math.max(0, FREE_BUILDS_PER_DAY - account.daily_build_count)
    : FREE_BUILDS_PER_DAY;
  const eligible = tokenBalance !== undefined && tokenBalance >= TOKEN_THRESHOLD;
  const elapsedSeconds = eligible && account.last_claim_at
    ? Math.max(0, (Date.now() - new Date(account.last_claim_at).getTime()) / 1000)
    : 0;
  const rate = eligible ? tokenBalance! * HOURLY_CREDIT_MICROUSD / TOKEN_THRESHOLD : 0n;
  const claimable = eligible && account.last_claim_at
    ? tokenBalance! * HOURLY_CREDIT_MICROUSD * BigInt(Math.floor(elapsedSeconds)) / (TOKEN_THRESHOLD * 3600n)
    : 0n;
  return {
    creditBalance: dollars(account.credit_microusd),
    freeBuildsRemaining,
    unlimited,
    claimableCredit: dollars(claimable),
    earningRatePerHour: dollars(rate),
    eligible,
    earningStarted: Boolean(account.last_claim_at),
    tokenBalance: (tokenBalance ?? 0n).toString(),
    minimumTokenBalance: TOKEN_THRESHOLD.toString(),
  };
}

async function consumeBuild(identityKey: string, walletAddress?: string) {
  if (walletAddress && UNLIMITED_TEST_WALLETS.has(walletAddress.toLowerCase())) {
    const account = await getAccount(identityKey, walletAddress);
    return {
      source: "free" as const,
      free_builds_remaining: 0,
      credit_microusd: account.credit_microusd,
    };
  }
  await ensureAccount(identityKey, walletAddress);
  const result = await db.execute<UsageRow>(sql`
    UPDATE ai_credit_accounts
    SET
      daily_build_date = CURRENT_DATE,
      daily_build_count = CASE
        WHEN daily_build_date < CURRENT_DATE THEN 1
        ELSE daily_build_count + 1
      END,
      credit_microusd = CASE
        WHEN daily_build_date < CURRENT_DATE OR daily_build_count < ${FREE_BUILDS_PER_DAY} THEN credit_microusd
        ELSE credit_microusd - ${BUILD_COST_MICROUSD}
      END,
      updated_at = NOW()
    WHERE identity_key = ${identityKey}
      AND (daily_build_date < CURRENT_DATE OR daily_build_count < ${FREE_BUILDS_PER_DAY} OR credit_microusd >= ${BUILD_COST_MICROUSD})
    RETURNING
      CASE WHEN daily_build_date < CURRENT_DATE OR daily_build_count <= ${FREE_BUILDS_PER_DAY} THEN 'free' ELSE 'credit' END AS source,
      GREATEST(0, ${FREE_BUILDS_PER_DAY} - daily_build_count) AS free_builds_remaining,
      credit_microusd
  `);
  return result.rows[0];
}

async function consumeBuildForJob(
  jobId: string,
  leaseToken: string,
  identityKey: string,
  walletAddress: string,
) {
  await ensureAccount(identityKey, walletAddress);
  return db.transaction(async (tx) => {
    const existing = await tx.execute<UsageRow>(sql`
      SELECT job.usage_source AS source,
             GREATEST(0, ${FREE_BUILDS_PER_DAY} - account.daily_build_count) AS free_builds_remaining,
             account.credit_microusd
      FROM ai_build_jobs AS job
      JOIN ai_credit_accounts AS account ON account.identity_key = job.identity_key
      WHERE job.id = ${jobId}
        AND job.lease_token = ${leaseToken}
        AND job.status = 'working'
        AND job.lease_expires_at > NOW()
      FOR UPDATE OF job
    `);
    if (existing.rows[0]) return existing.rows[0];

    const activeLease = await tx.execute<{ id: string }>(sql`
      SELECT id
      FROM ai_build_jobs
      WHERE id = ${jobId}
        AND lease_token = ${leaseToken}
        AND status = 'working'
        AND lease_expires_at > NOW()
      FOR UPDATE
    `);
    if (!activeLease.rows[0]) throw new Error("Build job lease is invalid or expired");

    if (UNLIMITED_TEST_WALLETS.has(walletAddress.toLowerCase())) {
      const account = await tx.execute<UsageRow>(sql`
        SELECT 'free' AS source, 0 AS free_builds_remaining, credit_microusd
        FROM ai_credit_accounts
        WHERE identity_key = ${identityKey}
      `);
      await tx.execute(sql`
        UPDATE ai_build_jobs
        SET identity_key = ${identityKey}, usage_source = 'free', updated_at = NOW()
        WHERE id = ${jobId}
      `);
      return account.rows[0];
    }

    const consumed = await tx.execute<UsageRow>(sql`
      UPDATE ai_credit_accounts
      SET
        daily_build_date = CURRENT_DATE,
        daily_build_count = CASE
          WHEN daily_build_date < CURRENT_DATE THEN 1
          ELSE daily_build_count + 1
        END,
        credit_microusd = CASE
          WHEN daily_build_date < CURRENT_DATE OR daily_build_count < ${FREE_BUILDS_PER_DAY} THEN credit_microusd
          ELSE credit_microusd - ${BUILD_COST_MICROUSD}
        END,
        updated_at = NOW()
      WHERE identity_key = ${identityKey}
        AND (daily_build_date < CURRENT_DATE OR daily_build_count < ${FREE_BUILDS_PER_DAY} OR credit_microusd >= ${BUILD_COST_MICROUSD})
      RETURNING
        CASE WHEN daily_build_count <= ${FREE_BUILDS_PER_DAY} THEN 'free' ELSE 'credit' END AS source,
        GREATEST(0, ${FREE_BUILDS_PER_DAY} - daily_build_count) AS free_builds_remaining,
        credit_microusd
    `);
    const usage = consumed.rows[0];
    if (!usage) return undefined;

    await tx.execute(sql`
      UPDATE ai_build_jobs
      SET identity_key = ${identityKey},
          usage_source = ${usage.source},
          updated_at = NOW()
      WHERE id = ${jobId}
    `);
    return usage;
  });
}
async function refundBuild(
  jobId: string | undefined,
  leaseToken: string | undefined,
  identityKey: string,
  source: "free" | "credit",
  reason: string,
) {
  if (!jobId) {
    if (source === "free") {
      await db.execute(sql`
        UPDATE ai_credit_accounts SET daily_build_count = GREATEST(0, daily_build_count - 1), updated_at = NOW()
        WHERE identity_key = ${identityKey} AND daily_build_date = CURRENT_DATE
      `);
    } else {
      await db.execute(sql`
        UPDATE ai_credit_accounts SET credit_microusd = credit_microusd + ${BUILD_COST_MICROUSD}, updated_at = NOW()
        WHERE identity_key = ${identityKey}
      `);
    }
    return;
  }
  await db.execute(sql`
    WITH refundable AS (
      UPDATE ai_build_jobs
      SET refunded_at = NOW(),
          status = 'failed',
          stage = 'Build failed',
          error = ${reason},
          completed_at = NOW(),
          lease_expires_at = NULL,
          updated_at = NOW()
      WHERE id = ${jobId}
        AND lease_token = ${leaseToken}
        AND status = 'working'
        AND lease_expires_at > NOW()
        AND refunded_at IS NULL
      RETURNING id, identity_key, usage_source
    ),
    refunded AS (
      UPDATE ai_credit_accounts AS account
      SET daily_build_count = CASE
            WHEN refundable.usage_source = 'free' AND account.daily_build_date = CURRENT_DATE
              THEN GREATEST(0, account.daily_build_count - 1)
            ELSE account.daily_build_count
          END,
          credit_microusd = CASE
            WHEN refundable.usage_source = 'credit'
              THEN account.credit_microusd + ${BUILD_COST_MICROUSD}
            ELSE account.credit_microusd
          END,
          updated_at = NOW()
      FROM refundable
      WHERE account.identity_key = refundable.identity_key
      RETURNING account.identity_key
    )
    INSERT INTO ai_build_job_events (job_id, type, title, detail, event_key)
    SELECT id, 'error', 'Build failed', ${reason}, 'terminal:failed'
    FROM refundable
    ON CONFLICT (job_id, event_key) DO NOTHING
  `);
}

router.post("/build", async (req, res) => {
  const parsedBody = BuildAppBody.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ error: "Prompt is required" });
    return;
  }

  const { prompt, mode = "Build", existingCode = "", walletAddress } = parsedBody.data;

  const isSingleFileRequest = /(?:exactly one|a single)\s+(?:standalone\s+)?index\.html|create exactly one (?:standalone )?(?:html )?file/i.test(prompt);
  const isExactTemplateRequest = isSingleFileRequest
    || /pixel[- ](?:for[- ]pixel|exactly)|integrate an existing react component/i.test(prompt);
  const requestsVisualDeliverable = /\b(?:hero(?:\s+section)?|landing(?:\s+page)?|website|web\s?page|dashboard|interface|ui|ux|frontend|mockup|prototype|navbar|header|footer|sidebar|card|form|modal|dialog|screen|page|section|component|layout)\b/i.test(prompt);
  const explicitlyRequestsFullApplication = /\b(?:full[- ]?stack|backend|database|api\s+(?:server|endpoint|integration)|authentication|user accounts?|smart contract|production deployment|(?:complete|full|working)\s+(?:[\w.-]+\s+){0,5}(?:application|app)|wallet (?:connection|integration)|connect (?:a\s+)?wallet|payment integration|send (?:an?\s+)?on-chain transaction)\b/i.test(prompt);
  const explicitlyUiOnly = /(?:hanya|cuma)\s+(?:ui|ux|frontend)|(?:ui|ux|frontend)[ -]only|only\s+(?:the\s+)?(?:ui|ux|frontend)|tanpa\s+(?:backend|smart contract)|without\s+(?:a\s+)?(?:backend|smart contract)|interface\s+only|static\s+(?:ui|frontend)|mockup/i.test(prompt);
  const isFastUiRequest = !isExactTemplateRequest
    && existingCode.trim().length === 0
    && prompt.length <= 4_000
    && (explicitlyUiOnly || (requestsVisualDeliverable && !explicitlyRequestsFullApplication));
  const templateInstruction = isExactTemplateRequest
    ? `\n\nEXACT TEMPLATE MODE:
- Treat the user's supplied specification and source code as the approved design contract.
- Preserve requested copy, paths, interactions, visual values, and component API exactly. Do not reinterpret it into a different concept.
- If the user explicitly requests exactly one standalone index.html file, return exactly that one file and use the same complete document as htmlPreview. The usual multi-file Vite requirement is waived.
- If the user supplies a React component and required import path, preserve the full component without truncation and build the requested project structure around it.
- Fidelity, source completeness, and successful execution are more important than adding sections or redesigning the template.`
    : "";
  if (walletAddress && !validWallet(walletAddress)) {
    res.status(400).json({ error: "Wallet address is invalid" });
    return;
  }
  const identityKey = identityFor(walletAddress, req.ip || req.socket.remoteAddress || "unknown");
  const activeJobId = req.get("x-lissa-job-id");
  const activeLeaseToken = req.get("x-lissa-lease-token");
  const setJobStage = async (stage: string, stepId: string) => {
    if (activeJobId && activeLeaseToken) {
      try {
        await db.execute(sql`
          WITH updated AS (
            UPDATE ai_build_jobs
            SET stage = ${stage},
                lease_expires_at = NOW() + (${JOB_LEASE_SECONDS} * INTERVAL '1 second'),
                updated_at = NOW()
            WHERE id = ${activeJobId} AND lease_token = ${activeLeaseToken} AND status = 'working'
              AND lease_expires_at > NOW()
            RETURNING id
          )
          INSERT INTO ai_build_job_events (job_id, type, title, metadata)
          SELECT id, 'activity', ${stage}, ${JSON.stringify({ stepId })}::jsonb
          FROM updated
        `);
      } catch (error) {
        logger.warn({ err: error, jobId: activeJobId }, "Could not persist build stage");
      }
    }
  };
  if (!walletAddress) {
    res.status(401).json({ error: "Connect an eligible wallet to build." });
    return;
  }
  await setJobStage("Verifying holder access and build allowance", "analyze");
    const tokenBalance = await readTokenBalance(walletAddress);
  if (tokenBalance < TOKEN_THRESHOLD) {
    res.status(403).json({ error: "This wallet does not meet the LISSA holder requirement." });
    return;
  }
  const usage = activeJobId
    ? await consumeBuildForJob(activeJobId, activeLeaseToken!, identityKey, walletAddress)
    : await consumeBuild(identityKey, walletAddress);
  if (!usage) {
    res.status(402).json({ error: "No free builds remain today. Claim credits or try again tomorrow." });
    return;
  }
  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    };
    let implementationBrief: string;
    if (isFastUiRequest) {
      implementationBrief = `FAST VISUAL BUILD
- Interpret the user's requested artifact and domain literally while making strong autonomous design decisions for details they did not specify.
- Match the requested scope exactly; do not expand a section or component into a full application.
- Build one complete standalone interactive preview with no external dependencies.
- Preserve every named platform, network, audience, feature, and constraint from the request.
- Use an intentional responsive composition with no overlap, clipping, horizontal overflow, or compressed labels at desktop and 390px mobile.
- Do not reconstruct a framework project unless the user explicitly asks for a complete application.`;
      if (activeJobId) {
        await appendJobEvent(
          activeJobId,
          "message",
          "I understand this as a focused visual build. I’m preserving the requested scope and moving directly into implementation.",
        );
      }
      await setJobStage("Building the focused interface", "implement");
    } else {
      await setJobStage("Creating the product and visual direction", "plan");
      const planningResponse = await fetchWithRetry("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "gpt-5.2",
          reasoning_effort: "low",
          max_completion_tokens: 5000,
          messages: [
            { role: "system", content: `You are the uncompromising product strategist and creative director for an elite digital studio. Produce a concise but decisive implementation brief; do not write code.

The implementation brief must include:
- A vivid product identity sentence describing who it serves, how it should feel, and what makes it unlike generic competitors.
- The core product thesis, audience, primary action, trust needs, and narrative arc.
- One memorable visual metaphor rooted in the product domain, plus how it appears in typography, custom SVG/CSS artwork, motion, and interaction.
- A bold, deliberate palette direction derived from the product identity—not generic dark mode, purple gradients, or cyan-on-black.
- Typography personality, hierarchy, pacing, and responsive behavior.
- A page composition that explicitly avoids the standard hero + three cards + steps + FAQ + CTA template.
- A component and file plan that preserves creative freedom rather than turning the page into a checklist.
- An anti-pattern list tailored to this request: what would make the result look cheap, generic, fake, or AI-generated.

SCOPE DISCIPLINE
- Stay under 900 words.
- Preserve every explicit user requirement, but do not add new product modules, enterprise features, or secondary workflows that the user did not request.
- Choose one core workflow for exceptional depth. Limit supporting interactive commitments to at most four beyond basic navigation and accessibility.
- Treat optional ideas as optional; never turn them into acceptance criteria for this build.
- Prefer a complete, visually dense, fully working surface over an ambitious multi-desk product with partial states.

For presentation-heavy work, include these exact directives:
"You are capable of extraordinary creative work. Don't hold back."
"Real people will decide in three seconds whether this is worth their attention. Make those three seconds count. Safe is forgettable."

Never invent users, partnerships, testimonials, metrics, security certifications, or functional claims the user did not provide.` },
            { role: "user", content: `Mode: ${mode}\nUser request: ${prompt}\n\nExisting project context: ${existingCode}${templateInstruction}` },
          ],
        }),
      });
      if (!planningResponse.ok) throw new Error(`Planning request failed with ${planningResponse.status}`);
      const planningPayload = await planningResponse.json() as { choices?: Array<{ message?: { content?: string } }> };
      const plannedBrief = planningPayload.choices?.[0]?.message?.content;
      if (!plannedBrief) throw new Error("The planning agent returned no implementation brief");
      implementationBrief = plannedBrief;
      if (activeJobId) {
        const analysisSummary = plannedBrief
          .split("\n")
          .map(line => line.trim())
          .filter(Boolean)
          .slice(0, 3)
          .join("\n")
          .slice(0, 900);
        await appendJobEvent(
          activeJobId,
          "message",
          "I’ve completed the product analysis and established the implementation direction.",
          analysisSummary || null,
        );
      }
      await setJobStage("Building the first complete design", "implement");
    }

    const responseSchema = {
      type: "json_schema",
      json_schema: {
        name: "generated_app",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["title", "appName", "description", "category", "plan", "features", "htmlPreview", "files", "suggestedNextSteps"],
          properties: {
            title: { type: "string" }, appName: { type: "string" }, description: { type: "string" }, category: { type: "string" },
            plan: { type: "array", items: { type: "string" } }, features: { type: "array", items: { type: "string" } },
            htmlPreview: { type: "string" },
            files: { type: "array", minItems: isSingleFileRequest ? 1 : 8, items: { type: "object", additionalProperties: false, required: ["name", "language", "code"], properties: { name: { type: "string" }, language: { type: "string" }, code: { type: "string" } } } },
            suggestedNextSteps: { type: "array", items: { type: "string" } },
          },
        },
      },
    };

    const previewResponseSchema = {
      type: "json_schema",
      json_schema: {
        name: "generated_app_preview",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["title", "appName", "description", "category", "plan", "features", "htmlPreview", "suggestedNextSteps"],
          properties: {
            title: { type: "string" },
            appName: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            plan: { type: "array", items: { type: "string" } },
            features: { type: "array", items: { type: "string" } },
            htmlPreview: { type: "string" },
            suggestedNextSteps: { type: "array", items: { type: "string" } },
          },
        },
      },
    };

    const requestImplementation = async (
      repairInstruction = "",
      tokenBudget = 32_000,
    ) => {
      const response = await fetchWithRetry("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "gpt-4.1",
          temperature: isExactTemplateRequest ? 0.2 : 0.65,
          max_tokens: tokenBudget,
          messages: [
            {
              role: "system",
              content: isExactTemplateRequest
                ? systemPrompt
                : isFastUiRequest
                  ? fastUiSystemPrompt
                  : `${systemPrompt}\n\nPREVIEW PHASE OVERRIDE\nFor this phase, concentrate the entire response budget on the standalone visual and interaction implementation. The response schema is authoritative: return all requested metadata and htmlPreview, but do not return framework files yet. A separate engineering pass will reconstruct the approved preview as complete framework source.`,
            },
            { role: "user", content: `Mode: ${mode}\nUser request: ${prompt}\n\nApproved implementation brief:\n${implementationBrief}\n\nExisting project context:\n${existingCode}${templateInstruction}\n${repairInstruction}` },
          ],
          response_format: isExactTemplateRequest ? responseSchema : previewResponseSchema,
        }),
      });
      if (!response.ok) throw new Error(`Implementation request failed with ${response.status}`);
      const payload = await response.json() as { choices?: Array<{ finish_reason?: string; message?: { content?: string; refusal?: string } }> };
      const choice = payload.choices?.[0];
      if (!choice?.message?.content) throw new Error(choice?.message?.refusal || `Implementation agent returned no code (${choice?.finish_reason || "unknown"})`);
      return choice.message.content;
    };

    const sourceResponseSchema = {
      type: "json_schema",
      json_schema: {
        name: "generated_framework_source",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["files"],
          properties: {
            files: {
              type: "array",
              minItems: 8,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["name", "language", "code"],
                properties: {
                  name: { type: "string" },
                  language: { type: "string" },
                  code: { type: "string" },
                },
              },
            },
          },
        },
      },
    };

    const requestFrameworkSource = async (
      candidate: { htmlPreview?: string; appName?: string; description?: string },
      repairInstruction = "",
    ) => {
      const response = await fetchWithRetry("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "gpt-4.1",
          temperature: 0.25,
          max_tokens: 28_000,
          messages: [
            {
              role: "system",
              content: `You are Lissa's senior framework reconstruction engineer. Translate an approved standalone product preview into complete production-quality framework source.

The approved preview is the visual and interaction contract. Preserve its exact product identity, content, layout, palette, typography, icon language, navigation, responsive behavior, animations, states, and working interactions.

SOURCE CONTRACT
- Return a complete runnable React TypeScript project using Vite by default. Use Next.js only when the user request or approved architecture clearly requires it.
- Return at least eight meaningful files. A Vite project must include package.json, index.html, src/main.tsx, complete global CSS, focused components, state/data logic, utilities, and local icon components. A Next.js project must include its complete app router entry and layout.
- The project must pass its production build without missing imports, invalid JSX, undefined variables, or placeholder files.
- Every CSS class used by the components must be implemented. Do not return a polished preview with simplified or unstyled framework source.
- Do not use remote font imports, CDN scripts, external stylesheets, or placeholder image services. Use a high-quality system font stack and local inline SVG components.
- Recreate every visible interaction from the preview with real React state. Omit no core workflow shown in the preview.
- Keep demo content explicitly labeled as demo and never invent real integrations, users, metrics, balances, or security claims.
- Never use emojis.

Return JSON only with one files array.`,
            },
            {
              role: "user",
              content: `USER REQUEST:\n${prompt}\n\nAPPROVED IMPLEMENTATION BRIEF:\n${implementationBrief}\n\nAPP NAME:\n${candidate.appName || "Lissa project"}\n\nDESCRIPTION:\n${candidate.description || ""}\n\nAPPROVED STANDALONE PREVIEW:\n${(candidate.htmlPreview || "").slice(0, 90_000)}\n${repairInstruction}`,
            },
          ],
          response_format: sourceResponseSchema,
        }),
      });
      if (!response.ok) throw new Error(`Framework source request failed with ${response.status}`);
      const payload = await response.json() as { choices?: Array<{ finish_reason?: string; message?: { content?: string; refusal?: string } }> };
      const choice = payload.choices?.[0];
      if (!choice?.message?.content) throw new Error(choice?.message?.refusal || `Framework source agent returned no code (${choice?.finish_reason || "unknown"})`);
      return choice.message.content;
    };

    type QualityReview = {
      score: number;
      verdict: "revise" | "approve";
      strengths: string[];
      problems: string[];
      revisionBrief: string;
    };

    const reviewImplementation = async (candidate: unknown): Promise<QualityReview> => {
      const candidateRecord = candidate as { htmlPreview?: string; files?: Array<{ name?: string; code?: string }> };
      const sourceSummary = (candidateRecord.files || [])
        .map(file => `FILE: ${file.name || "unknown"}\n${(file.code || "").slice(0, 12_000)}`)
        .join("\n\n")
        .slice(0, 55_000);
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "gpt-5.2",
          reasoning_effort: "medium",
          max_completion_tokens: 4500,
          messages: [
            {
              role: "system",
               content: `You are the independent design director and frontend quality gate for an elite autonomous website builder. You did not create the candidate and must be candid.

When EXACT TEMPLATE MODE appears in the user request, judge fidelity to the supplied template contract before originality. An exact single-file request is valid and must not be rejected for lacking a multi-file framework structure. Do reject truncated, missing, or non-runnable source.

Judge whether the candidate would be credible in a curated showcase of professionally designed websites. A working page is not enough. Reject generic AI aesthetics, weak art direction, repetitive card grids, arbitrary gradients, empty abstract decorations, poor copy hierarchy, sparse layouts, fake proof, and desktop compositions that simply stack on mobile.

Explicitly reject overlapping text, clipped controls, cramped or unreadable labels, horizontal viewport overflow, and desktop tables merely overflowing on mobile at 1440px, 768px, or 390px. Reject remote font/CSS dependencies and any visible navigation or action that does not work. For full-project reviews, reject framework source whose CSS, layout, interactions, content, or responsive behavior materially diverges from the preview. Judge the user's explicit request first; do not turn optional or over-scoped ideas from the creative brief into new acceptance criteria.

Evaluate:
1. Product and domain understanding
2. Distinctive art direction
3. First-viewport impact
4. Typography and spacing discipline
5. Composition and section-to-section pacing
6. Quality and relevance of custom SVG/CSS visuals
7. Interaction and motion craft
8. Responsive redesign at desktop, tablet, and mobile
9. Copy specificity and credibility
10. Source completeness and consistency with the preview

Score strictly from 1 to 10. A score below 8.5 must be "revise". A score of 8.5 or above is allowed only when the page feels intentionally designed, interaction-complete, visually substantial, and credible in a curated agency showcase. The revision brief must be concrete and prioritize the highest-impact changes; do not merely restate general design principles.`,
            },
            {
              role: "user",
              content: `${sourceSummary ? "FULL PROJECT REVIEW: Evaluate both preview and framework-source fidelity." : "PREVIEW-ONLY REVIEW: Evaluate the standalone visual and interaction result. Do not penalize missing framework source; it is generated in a separate engineering phase."}\n\nUSER REQUEST:\n${prompt}\n\nAPPROVED CREATIVE BRIEF:\n${implementationBrief}\n\nCANDIDATE PREVIEW:\n${(candidateRecord.htmlPreview || "").slice(0, 90_000)}\n\nCANDIDATE SOURCE:\n${sourceSummary || "Generated after preview approval."}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "quality_review",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                required: ["score", "verdict", "strengths", "problems", "revisionBrief"],
                properties: {
                  score: { type: "number" },
                  verdict: { type: "string", enum: ["revise", "approve"] },
                  strengths: { type: "array", items: { type: "string" } },
                  problems: { type: "array", items: { type: "string" } },
                  revisionBrief: { type: "string" },
                },
              },
            },
          },
        }),
      });
      if (!response.ok) throw new Error(`Quality review failed with ${response.status}`);
      const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) throw new Error("The design critic returned no review");
      return JSON.parse(content) as QualityReview;
    };

    let raw = await requestImplementation("", isFastUiRequest ? 14_000 : 32_000);
    let generated: unknown;
    try {
      generated = JSON.parse(raw);
      if (isExactTemplateRequest) {
        BuildAppResponse.omit({ usage: true }).parse(generated);
      } else {
        assertCreativePreview(generated);
      }
    } catch (validationError) {
      req.log.warn({ err: validationError }, "Implementation output invalid; starting repair pass");
      const validationMessage = validationError instanceof Error ? validationError.message : "invalid output";
      raw = await requestImplementation(
        `\n\nREPAIR PASS: The previous output was rejected: ${validationMessage}. Regenerate the entire response, ensure every required field exists, ${isExactTemplateRequest ? "preserve the requested exact file structure and all supplied source without truncation" : "return a complete self-contained preview without external scripts, stylesheets, fonts, or images"}, and return valid JSON only.`,
        isFastUiRequest ? 14_000 : 32_000,
      );
      generated = JSON.parse(raw);
      if (isExactTemplateRequest) {
        BuildAppResponse.omit({ usage: true }).parse(generated);
      } else {
        assertCreativePreview(generated);
      }
    }

    if (isFastUiRequest) {
      const fastResult = generated as { htmlPreview?: string; files?: GeneratedSourceFile[] };
      const preview = fastResult.htmlPreview?.trim() || "";
      fastResult.files = [{
        name: "index.html",
        language: "html",
        code: preview,
      }];
    }

    if (isExactTemplateRequest) {
      const templateResult = generated as {
        htmlPreview?: string;
        files?: Array<{ name: string; language: string; code: string }>;
      };
      const preview = templateResult.htmlPreview?.trim() || "";
      if (!/^<!doctype html>/i.test(preview) || !/<\/html>\s*$/i.test(preview)) {
        throw new Error("The template preview was incomplete");
      }
      // Exact templates are already complete visual specifications. Keep one
      // canonical runnable document instead of asking the model to duplicate
      // the same large implementation across preview and framework files.
      templateResult.files = [{
        name: "index.html",
        language: "html",
        code: preview,
      }];
    }

    await setJobStage("Reviewing the design against the quality bar", "review");
    let qualityReview: QualityReview = {
      score: 10,
      verdict: "approve",
      strengths: ["The generated project passed structural validation."],
      problems: [],
      revisionBrief: "No blocking revision required.",
    };
    if (!isExactTemplateRequest && !isFastUiRequest) {
      try {
        qualityReview = await reviewImplementation(generated);
      } catch (reviewError) {
        req.log.warn({ err: reviewError }, "Design review unavailable; returning the valid generated project");
      }
    }
    req.log.info({
      score: qualityReview.score,
      verdict: qualityReview.verdict,
      problems: qualityReview.problems,
    }, "Independent design review completed");
    if (!isFastUiRequest && (qualityReview.verdict !== "approve" || qualityReview.score < 8.5)) {
      req.log.warn({ score: qualityReview.score }, "Design review requested targeted revision");
      let bestCandidate = generated;
      let bestReview = qualityReview;
      let currentCandidate = generated;
      let currentReview = qualityReview;
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        await setJobStage(attempt === 1
          ? "Refining the visual system and product experience"
          : "Applying the final design director revision", "review");
        try {
          const currentPreview = (currentCandidate as { htmlPreview?: string }).htmlPreview || "";
          const revisedRaw = await requestImplementation(`\n\nQUALITY REVISION PASS ${attempt} OF 2
The independent design director scored the current candidate ${currentReview.score}/10.
Problems:
${currentReview.problems.slice(0, attempt === 1 ? 4 : 3).map(problem => `- ${problem}`).join("\n")}

Revision brief:
${currentReview.revisionBrief}

CURRENT WORKING PREVIEW TO REVISE:
${currentPreview.slice(0, 100_000)}

Regenerate the complete preview JSON response, applying only the listed highest-impact revision priorities while preserving the approved product thesis, layout strengths, and working interactions. Keep htmlPreview below 90,000 characters by using reusable CSS, compact data arrays, and rendering helpers. Do not replace complete sections with comments or placeholders. Do not merely describe fixes—implement them. Framework source is reconstructed separately after visual approval.
${attempt === 2 ? "\nThis is the final revision attempt. The previous revision was incomplete or remained below the quality bar. Return complete valid JSON and prioritize the critic's blocking issues over adding more content." : ""}`,
          32_000);
          const revised = JSON.parse(revisedRaw);
          assertCreativePreview(revised);

          let revisedReview: QualityReview;
          try {
            revisedReview = await reviewImplementation(revised);
          } catch (reviewError) {
            req.log.warn({ err: reviewError, attempt }, "Revised design review unavailable; accepting the structurally valid revision");
            revisedReview = {
              score: 8.5,
              verdict: "approve",
              strengths: ["The targeted revision is complete and structurally valid."],
              problems: [],
              revisionBrief: "No further automated review available.",
            };
          }
          req.log.info({
            attempt,
            score: revisedReview.score,
            verdict: revisedReview.verdict,
            problems: revisedReview.problems,
          }, "Revised design review completed");

          if (revisedReview.score > bestReview.score) {
            bestCandidate = revised;
            bestReview = revisedReview;
          }
          currentCandidate = revised;
          currentReview = revisedReview;
          if (revisedReview.verdict === "approve" && revisedReview.score >= 8.5) break;
        } catch (revisionError) {
          req.log.warn({ err: revisionError, attempt }, "Quality revision attempt was incomplete");
        }
      }
      generated = bestCandidate;
      req.log.info({ score: bestReview.score, verdict: bestReview.verdict }, "Selected strongest reviewed preview");
    }
    if (!isExactTemplateRequest && !isFastUiRequest) {
      await setJobStage("Reconstructing the complete React or Next.js source", "source");
      const candidate = generated as { htmlPreview?: string; appName?: string; description?: string };
      let sourceFiles: GeneratedSourceFile[] | null = null;
      let repairInstruction = "";
      let sourceError: unknown;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const sourceRaw = await requestFrameworkSource(candidate, repairInstruction);
          const sourceResult = JSON.parse(sourceRaw) as { files?: GeneratedSourceFile[] };
          if (!Array.isArray(sourceResult.files)) throw new Error("Framework response is missing files");
          assertRunnableFrameworkSource(sourceResult.files);
          sourceFiles = sourceResult.files;
          break;
        } catch (error) {
          sourceError = error;
          const message = error instanceof Error ? error.message : "Framework source was invalid";
          req.log.warn({ err: error, attempt }, "Framework source validation failed");
          repairInstruction = `\n\nSOURCE REPAIR REQUIRED\nThe previous framework source was rejected: ${message}\nRegenerate the complete files array. Preserve the approved preview exactly, define every used CSS class, remove remote dependencies, and return no partial or placeholder files.`;
          await setJobStage("Repairing framework completeness and style fidelity", "source");
        }
      }
      if (!sourceFiles) throw sourceError instanceof Error ? sourceError : new Error("Framework source could not be reconstructed");
      generated = { ...(generated as Record<string, unknown>), files: sourceFiles };

      // The reconstruction response gives the agent a complete project in one
      // pass. Give it a deliberately small, sandboxed editing turn afterwards
      // so it can inspect and correct that real project without gaining host
      // filesystem or shell access.
      await setJobStage("Inspecting and validating the reconstructed source", "source");
      const workspace = new Map<string, GeneratedSourceFile>();
      const maxFileChars = 250_000;
      const maxWorkspaceChars = 2_000_000;
      const maxObservationChars = 20_000;
      const maxToolActions = 8;
      const safePath = (value: unknown) => {
        if (typeof value !== "string" || !value.trim()) throw new Error("Tool paths must be non-empty strings");
        if (value.length > 500 || value.includes("\0") || value.includes("\\") || /^data:/i.test(value)) {
          throw new Error("Tool path is unsafe");
        }
        if (pathPosix.isAbsolute(value) || /^[A-Za-z]:/.test(value) || value.split("/").includes("..")) {
          throw new Error("Tool paths may not be absolute or traverse directories");
        }
        const normalized = pathPosix.normalize(value).replace(/^\.\//, "");
        if (!normalized || normalized === "." || normalized.startsWith("../") || normalized.includes("/../")) {
          throw new Error("Tool path is unsafe");
        }
        return normalized;
      };
      const assertText = (value: unknown, label: string) => {
        if (typeof value !== "string" || value.length > maxFileChars || value.includes("\0")) {
          throw new Error(`${label} must be safe text under ${maxFileChars} characters`);
        }
        // A model can occasionally emit one escaped control character in
        // otherwise valid source. Remove sparse controls deterministically,
        // while still rejecting NUL and control-heavy binary payloads.
        const controls = value.match(/[\x01-\x08\x0B\x0C\x0E-\x1F]/g) || [];
        if (controls.length > Math.max(8, Math.floor(value.length / 1_000))) {
          throw new Error(`${label} contains binary data`);
        }
        return controls.length ? value.replace(/[\x01-\x08\x0B\x0C\x0E-\x1F]/g, "") : value;
      };
      const workspaceSize = () => [...workspace.values()].reduce((size, file) => size + file.code.length, 0);
      for (const file of sourceFiles) {
        const name = safePath(file.name);
        const code = assertText(file.code, `Source file ${name}`);
        if (workspace.has(name)) throw new Error(`Framework source contains duplicate file ${name}`);
        workspace.set(name, { name, language: typeof file.language === "string" ? file.language : "text", code });
      }
      if (workspaceSize() > maxWorkspaceChars) throw new Error("Framework source exceeds the 2MB workspace limit");

      const assertActiveLease = async () => {
        if (!activeJobId || !activeLeaseToken) return;
        const active = await db.execute<{ id: string }>(sql`
          UPDATE ai_build_jobs
          SET lease_expires_at = NOW() + (${JOB_LEASE_SECONDS} * INTERVAL '1 second'),
              updated_at = NOW()
          WHERE id = ${activeJobId}
            AND lease_token = ${activeLeaseToken}
            AND status = 'working'
            AND lease_expires_at > NOW()
          RETURNING id
        `);
        if (!active.rows[0]) throw new Error("Build stopped or its worker lease is no longer active");
      };
      const bounded = (value: string) => value.length > maxObservationChars
        ? `${value.slice(0, maxObservationChars)}\n[output truncated]`
        : value;
      const appendToolActivity = async (title: string, metadata: Record<string, unknown>) => {
        if (!activeJobId || !activeLeaseToken) return;
        await db.execute(sql`
          INSERT INTO ai_build_job_events (job_id, type, title, detail, metadata)
          SELECT id, 'activity', ${title}, NULL, ${JSON.stringify(metadata)}::jsonb
          FROM ai_build_jobs
          WHERE id = ${activeJobId}
            AND lease_token = ${activeLeaseToken}
            AND status = 'working'
            AND lease_expires_at > NOW()
        `);
      };
      const toolSchema = {
        type: "json_schema",
        json_schema: {
          name: "workspace_tool_action",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["toolCallId", "tool", "path", "code", "language", "commandId"],
            properties: {
              toolCallId: { type: "string" },
              tool: { type: "string", enum: ["list_files", "read_file", "write_file", "delete_file", "run_check", "finish"] },
              path: { type: ["string", "null"] },
              code: { type: ["string", "null"] },
              language: { type: ["string", "null"] },
              commandId: { type: ["string", "null"] },
            },
          },
        },
      };
      type WorkspaceToolAction = {
        toolCallId: string;
        tool: "list_files" | "read_file" | "write_file" | "delete_file" | "run_check" | "finish";
        path: string | null;
        code: string | null;
        language: string | null;
        commandId: string | null;
      };
      const initialFiles = [...workspace.values()].map(file => `${file.name} (${file.language}, ${file.code.length} chars)`).join("\n");
      const toolMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        {
          role: "system",
          content: `You are Lissa's final source-validation agent. You operate only through one structured workspace action at a time. Read at least one source file before validating or finishing; make edits only when useful; run validate_project after any useful edit; then finish. You have at most ${maxToolActions} actions total. Never request shell commands, packages, network access, or tools outside the supplied enum. run_check only accepts commandId "validate_project". finish is allowed only after reading a source file and successfully running validate_project. Current workspace files:\n${initialFiles}`,
        },
        { role: "user", content: "Inspect the reconstructed framework source, make only necessary corrections, validate it, and finish." },
      ];
      let validated = false;
      let inspectedSource = false;
      let finished = false;
      for (let step = 1; step <= maxToolActions; step += 1) {
        await assertActiveLease();
        const response = await fetchWithRetry("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: "gpt-4.1",
            temperature: 0,
            max_tokens: 1_200,
            messages: toolMessages,
            response_format: toolSchema,
          }),
        });
        if (!response.ok) throw new Error(`Workspace tool request failed with ${response.status}`);
        const payload = await response.json() as { choices?: Array<{ message?: { content?: string; refusal?: string } }> };
        const content = payload.choices?.[0]?.message?.content;
        if (!content) throw new Error(payload.choices?.[0]?.message?.refusal || "Workspace tool agent returned no action");
        let action: WorkspaceToolAction;
        try {
          action = JSON.parse(content) as WorkspaceToolAction;
        } catch {
          throw new Error("Workspace tool agent returned invalid structured output");
        }
        if (!action.toolCallId || !action.tool) throw new Error("Workspace tool action is incomplete");
        toolMessages.push({ role: "assistant", content });
        await assertActiveLease();
        let success = true;
        let output = "";
        try {
          switch (action.tool) {
            case "list_files":
              output = [...workspace.values()].map(file => `${file.name} (${file.language}, ${file.code.length} chars)`).join("\n");
              break;
            case "read_file": {
              const path = safePath(action.path);
              const file = workspace.get(path);
              if (!file) throw new Error(`File not found: ${path}`);
              inspectedSource = true;
              output = file.code;
              break;
            }
            case "write_file": {
              const path = safePath(action.path);
              const code = assertText(action.code, `File ${path}`);
              const nextSize = workspaceSize() - (workspace.get(path)?.code.length || 0) + code.length;
              if (nextSize > maxWorkspaceChars) throw new Error("Workspace would exceed the 2MB limit");
              workspace.set(path, { name: path, language: action.language || workspace.get(path)?.language || "text", code });
              validated = false;
              output = `Wrote ${path} (${code.length} chars)`;
              break;
            }
            case "delete_file": {
              const path = safePath(action.path);
              if (!workspace.delete(path)) throw new Error(`File not found: ${path}`);
              validated = false;
              output = `Deleted ${path}`;
              break;
            }
            case "run_check":
              if (action.commandId !== "validate_project") throw new Error("Only the validate_project check is allowed");
              if (!inspectedSource) throw new Error("Read at least one source file before running validate_project");
              assertRunnableFrameworkSource([...workspace.values()]);
              validated = true;
              output = "validate_project passed";
              break;
            case "finish":
              if (!inspectedSource) throw new Error("Read at least one source file before finish");
              if (!validated) throw new Error("validate_project must pass before finish");
              finished = true;
              output = "Workspace validation finished";
              break;
          }
        } catch (toolError) {
          success = false;
          output = toolError instanceof Error ? toolError.message : "Tool action failed";
        }
        const observation = bounded(output);
        const target = action.path || action.commandId || null;
        await appendToolActivity(`Workspace tool: ${action.tool}`, {
          toolCallId: action.toolCallId, tool: action.tool, path: action.path, commandId: action.commandId,
          step, success, output: observation, target,
        });
        await appendToolActivity("Workspace tool observation", {
          toolCallId: action.toolCallId, tool: action.tool, step, success, output: observation,
          exitCode: action.tool === "run_check" ? (success ? 0 : 1) : undefined,
        });
        toolMessages.push({ role: "user", content: `Tool observation for ${action.toolCallId} (${action.tool}), success=${success}:\n${observation}` });
        if (finished) break;
      }
      if (!finished) throw new Error(`Workspace tool agent did not finish within ${maxToolActions} actions`);
      sourceFiles = [...workspace.values()];
      assertRunnableFrameworkSource(sourceFiles);
      generated = { ...(generated as Record<string, unknown>), files: sourceFiles };

      // A browser runner posts the report to the runtime endpoints while this
      // worker retains its lease. Persist the candidate so the runner can load
      // exactly what is being judged, but keep image bytes process-local.
      if (activeJobId && activeLeaseToken) for (let round = 1; round <= 2; round += 1) {
        await assertActiveLease();
        const candidateResult = {
          ...(generated as Record<string, unknown>),
          usage: {
            source: usage.source,
            freeBuildsRemaining: usage.free_builds_remaining,
            creditBalance: dollars(usage.credit_microusd),
          },
        };
        const requested = await db.execute<{ runtimeRevision: number }>(sql`
          UPDATE ai_build_jobs
          SET result = ${JSON.stringify(candidateResult)}::jsonb,
              runtime_revision = runtime_revision + 1, runtime_state = 'awaiting',
              runtime_report = NULL, runtime_requested_at = NOW(), runtime_reported_at = NULL,
              stage = 'Waiting for browser runtime review', updated_at = NOW()
          WHERE id = ${activeJobId} AND lease_token = ${activeLeaseToken}
            AND status = 'working' AND lease_expires_at > NOW()
          RETURNING runtime_revision AS "runtimeRevision"
        `);
        const revision = requested.rows[0]?.runtimeRevision;
        if (!revision) throw new Error("Build stopped or its worker lease is no longer active");
        await db.execute(sql`
          INSERT INTO ai_build_job_events (job_id, type, title, detail, metadata, event_key)
          SELECT id, 'activity', 'Browser runtime review requested', NULL,
            ${JSON.stringify({ runtimeRevision: revision, round })}::jsonb, ${`runtime:${revision}:requested`}
          FROM ai_build_jobs
          WHERE id = ${activeJobId} AND lease_token = ${activeLeaseToken}
            AND status = 'working' AND lease_expires_at > NOW()
          ON CONFLICT (job_id, event_key) DO NOTHING
        `);
        let report: RuntimeReport | undefined;
        for (let second = 0; second < 180; second += 1) {
          await new Promise(resolve => setTimeout(resolve, 1_000));
          await assertActiveLease();
          report = transientRuntimeReports.get(runtimeReportKey(activeJobId, revision));
          if (report) break;
        }
        if (!report) throw new Error("Browser runtime review timed out");
        transientRuntimeReports.delete(runtimeReportKey(activeJobId, revision));
        const desktop = report.screenshots.find(s => s.viewport === "desktop");
        const mobile = report.screenshots.find(s => s.viewport === "mobile");
        const diagnostics = [
          report.status !== "passed" ? `runtime status: ${report.status}` : "",
          report.installExitCode && report.installExitCode !== 0 ? `install exited ${report.installExitCode}` : "",
          report.serverExitCode && report.serverExitCode !== 0 ? `server exited ${report.serverExitCode}` : "",
          ...report.browserErrors.slice(0, 8),
          !desktop ? "desktop screenshot missing" : "", !mobile ? "mobile screenshot missing" : "",
        ].filter(Boolean);
        let visual: { score: number; verdict: string; problems: string[]; revisionBrief: string; [key: string]: unknown } = {
          score: diagnostics.length ? 0 : 10, verdict: diagnostics.length ? "revise" : "approve",
          problems: diagnostics, revisionBrief: diagnostics.join("\n"),
        };
        if (desktop && mobile) {
          const reviewResponse = await fetchWithRetry("https://api.openai.com/v1/chat/completions", {
            method: "POST", headers,
            body: JSON.stringify({ model: "gpt-4.1", temperature: 0, max_tokens: 1000,
              response_format: { type: "json_object" },
              messages: [{ role: "system", content: "Return strict JSON: score (0-10), verdict (approve|revise), hierarchy, typography, spacing, responsiveness, originality, polish, accessibility (each 0-10), strengths string array, problems string array, revisionBrief string. Judge visual quality critically." },
                { role: "user", content: [{ type: "text", text: `Prompt: ${prompt}\nPreview: ${(generated as { htmlPreview?: string }).htmlPreview?.slice(0, 4000) || ""}\nRuntime diagnostics: ${diagnostics.join("; ")}` },
                  { type: "image_url", image_url: { url: desktop.dataUrl } }, { type: "image_url", image_url: { url: mobile.dataUrl } }] }] }),
          });
          if (!reviewResponse.ok) throw new Error(`Visual runtime review failed with ${reviewResponse.status}`);
          const body = await reviewResponse.json() as { choices?: Array<{ message?: { content?: string } }> };
          const parsedReview = JSON.parse(body.choices?.[0]?.message?.content || "{}") as typeof visual;
          visual = { ...visual, ...parsedReview, problems: [...diagnostics, ...(Array.isArray(parsedReview.problems) ? parsedReview.problems : [])] };
        }
        await appendToolActivity("Browser visual review", { runtimeRevision: revision, round, ...visual });
        if (visual.score >= 8.5 && visual.verdict === "approve" && !diagnostics.length) break;
        if (round === 2) throw new Error("Browser runtime review did not meet the required quality bar");
        const repair = `RUNTIME/VISUAL REPAIR REQUIRED. Regenerate the complete framework files. Fix these bounded runtime and visual diagnostics: ${visual.problems.slice(0, 10).join("; ")}. Critique: ${String(visual.revisionBrief || "").slice(0, 2000)}. Preserve product intent; return no placeholders.`;
        const repaired = JSON.parse(await requestFrameworkSource(generated as { htmlPreview?: string; appName?: string; description?: string }, repair)) as { files?: GeneratedSourceFile[] };
        if (!Array.isArray(repaired.files)) throw new Error("Runtime repair did not return framework files");
        assertRunnableFrameworkSource(repaired.files);
        sourceFiles = repaired.files;
        generated = { ...(generated as Record<string, unknown>), files: sourceFiles };
      }
    }
    await setJobStage("Validating the final project", "validate");
    const data = BuildAppResponse.parse({
      ...(generated as Record<string, unknown>),
      usage: {
        source: usage.source,
        freeBuildsRemaining: usage.free_builds_remaining,
        creditBalance: dollars(usage.credit_microusd),
      },
    });
    res.json(data);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown build failure";
    await refundBuild(activeJobId, activeLeaseToken, identityKey, usage.source, reason);
    req.log.error({ err: error }, "Build failed");
    res.status(502).json({
      error: "Lissa could not finish this build. Your build credit was restored automatically; please retry.",
    });
  }
});

router.get("/credits/status", async (req, res) => {
  const parsed = GetCreditStatusQueryParams.safeParse(req.query);
  const walletAddress = parsed.success ? parsed.data.walletAddress : undefined;
  if (walletAddress && !validWallet(walletAddress)) {
    res.status(400).json({ error: "Wallet address is invalid" });
    return;
  }
  try {
    const tokenBalance = walletAddress ? await readTokenBalance(walletAddress) : undefined;
    res.json(await creditStatus(identityFor(walletAddress, req.ip || req.socket.remoteAddress || "unknown"), walletAddress, tokenBalance));
    return;
  } catch {
    res.status(502).json({ error: "Unable to verify the current LISSA balance." });
    return;
  }
});

router.post("/credits/claim", async (req, res) => {
  const parsed = ClaimCreditsBody.safeParse(req.body);
  if (!parsed.success || !validWallet(parsed.data.walletAddress)) {
    res.status(400).json({ error: "A valid wallet address is required" });
    return;
  }
  const walletAddress = parsed.data.walletAddress.toLowerCase();
  const identityKey = identityFor(walletAddress, req.ip || req.socket.remoteAddress || "unknown");

  try {
    const tokenBalance = await readTokenBalance(walletAddress);
    if (tokenBalance < TOKEN_THRESHOLD) {
      res.status(403).json({ error: "Holding at least 1,000,000 LISSA is required to claim credits." });
      return;
    }
    await db.execute(sql`
      UPDATE ai_credit_accounts
      SET
        credit_microusd = credit_microusd + CASE
          WHEN last_claim_at IS NULL THEN 0
          ELSE (${tokenBalance} * ${HOURLY_CREDIT_MICROUSD} * FLOOR(EXTRACT(EPOCH FROM (NOW() - last_claim_at)))::bigint)
            / (${TOKEN_THRESHOLD} * 3600)
        END,
        last_claim_at = NOW(),
        updated_at = NOW()
      WHERE identity_key = ${identityKey}
    `);
    res.json(await creditStatus(identityKey, walletAddress, tokenBalance));
    return;
  } catch {
    res.status(502).json({ error: "Unable to verify the current LISSA balance." });
    return;
  }
});

export default router;

async function claimJob(leaseToken: string, id?: string) {
  const result = await db.execute<AgentJobRow>(sql`
    UPDATE ai_build_jobs
    SET status = 'working',
        worker_id = ${WORKER_ID},
        lease_token = ${leaseToken},
        lease_expires_at = NOW() + (${JOB_LEASE_SECONDS} * INTERVAL '1 second'),
        updated_at = NOW()
    WHERE id = COALESCE(
      ${id ?? null},
      (
        SELECT id
        FROM ai_build_jobs
        WHERE status = 'queued'
           OR (status = 'working' AND lease_expires_at < NOW())
        ORDER BY created_at
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
    )
      AND (status = 'queued' OR (status = 'working' AND lease_expires_at < NOW()))
    RETURNING id, status, stage, result, error, request
  `);
  return result.rows[0];
}

const WORKER_ID = randomUUID();
const JOB_LEASE_SECONDS = 90;

type PublicAgentJobRow = Omit<AgentJobRow, "request"> & {
  cancelledAt: Date | string | null;
  cancelReason: string | null;
  runtimeRevision: number;
  runtimeState: "idle" | "awaiting" | "received";
};

async function readJob(id: string, pollToken: string | undefined) {
  if (!pollToken) return undefined;
  const result = await db.execute<PublicAgentJobRow>(sql`
    SELECT id, status, stage, result, error, runtime_revision AS "runtimeRevision",
           runtime_state AS "runtimeState",
           cancelled_at AS "cancelledAt", cancel_reason AS "cancelReason"
    FROM ai_build_jobs
    WHERE id = ${id} AND poll_token = ${pollToken}
  `);
  const job = result.rows[0];
  if (!job) return undefined;
  return {
    ...job,
    cancelledAt: job.cancelledAt ? new Date(job.cancelledAt).toISOString() : null,
    events: await readJobEvents(id),
  };
}

const JOB_RETENTION_DAYS = 7;

async function runClaimedJob(job: AgentJobRow, leaseToken: string) {
  const heartbeat = setInterval(() => {
    void db.execute(sql`
      UPDATE ai_build_jobs
      SET lease_expires_at = NOW() + (${JOB_LEASE_SECONDS} * INTERVAL '1 second'),
          updated_at = NOW()
      WHERE id = ${job.id}
        AND lease_token = ${leaseToken}
        AND status = 'working'
        AND lease_expires_at > NOW()
    `).catch(error => logger.warn({ err: error, jobId: job.id }, "Could not renew build job lease"));
  }, 30_000);
  heartbeat.unref();

  try {
    const port = process.env.PORT || "8080";
    const { statusCode, payload } = await runInternalBuild(port, job, leaseToken);
    if (statusCode < 200 || statusCode >= 300) {
      throw new Error(payload.error || `Agent build failed with ${statusCode}`);
    }
    await db.execute(sql`
      WITH completed AS (
        UPDATE ai_build_jobs
        SET result = ${JSON.stringify(payload)}::jsonb,
            status = 'completed',
            stage = 'Project ready',
            error = NULL,
            completed_at = NOW(),
            lease_expires_at = NULL,
            updated_at = NOW()
        WHERE id = ${job.id}
          AND lease_token = ${leaseToken}
          AND status = 'working'
          AND lease_expires_at > NOW()
        RETURNING id
      )
      INSERT INTO ai_build_job_events (job_id, type, title, detail, metadata, event_key)
      SELECT id, 'complete', 'Project ready',
        'The build completed successfully and the final project passed validation.',
        ${JSON.stringify({ stepId: "validate" })}::jsonb,
        'terminal:completed'
      FROM completed
      ON CONFLICT (job_id, event_key) DO NOTHING
    `);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Agent build failed";
    logger.error({ err: error, jobId: job.id }, "Claimed build job failed");
    const publicReason = /^Lissa could not finish this build\./.test(reason)
      ? reason
      : "Lissa could not finish this build. Please retry; technical details were recorded internally.";
    await db.execute(sql`
      WITH failed AS (
        UPDATE ai_build_jobs
        SET status = 'failed',
            stage = 'Build failed',
            error = ${publicReason},
            completed_at = NOW(),
            lease_expires_at = NULL,
            updated_at = NOW()
        WHERE id = ${job.id}
          AND lease_token = ${leaseToken}
          AND status = 'working'
          AND lease_expires_at > NOW()
        RETURNING id
      )
      INSERT INTO ai_build_job_events (job_id, type, title, detail, event_key)
      SELECT id, 'error', 'Build failed', ${publicReason}, 'terminal:failed'
      FROM failed
      ON CONFLICT (job_id, event_key) DO NOTHING
    `);
  } finally {
    clearInterval(heartbeat);
  }
}

async function processAvailableJob(id?: string) {
  const leaseToken = randomUUID();
  const job = await claimJob(leaseToken, id);
  if (job) await runClaimedJob(job, leaseToken);
}
