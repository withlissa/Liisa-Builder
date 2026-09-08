/**
 * Regression coverage for persisted LISSA agent jobs.
 *
 * These fixtures are deliberately synthetic and are inserted directly so this
 * suite never starts a build, calls an AI provider, or uses a wallet identity.
 * Run against a locally running API with:
 *   AGENT_TEST_BASE_URL=http://127.0.0.1:80/api pnpm test:agent
 */
import assert from "node:assert/strict";
import test from "node:test";
import { randomBytes, randomUUID } from "node:crypto";
import { privateKeyToAccount } from "viem/accounts";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { hasForbiddenRepositoryScopes } from "../src/routes/github.ts";

const requireFromDb = createRequire(new URL("../../../lib/db/package.json", import.meta.url));
const { Pool } = requireFromDb("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function sql(strings, ...values) {
  let text = strings[0];
  for (let index = 0; index < values.length; index += 1) {
    text += `$${index + 1}${strings[index + 1]}`;
  }
  return { text, values };
}

const db = {
  async execute(query) {
    return pool.query(query.text, query.values);
  },
};

const baseUrl = (process.env.AGENT_TEST_BASE_URL || "http://127.0.0.1:80/api").replace(/\/+$/, "");
const fixturePrefix = `synthetic-agent-test:${randomUUID()}`;
const createdJobIds = [];
const createdIdentityKeys = [];

function endpoint(path, query = {}) {
  const url = new URL(`${baseUrl}/${path.replace(/^\/+/, "")}`);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, String(value));
  return url;
}

function syntheticJob(overrides = {}) {
  const id = `${fixturePrefix}:job:${randomUUID()}`;
  const pollToken = `synthetic-poll-${randomUUID()}`;
  createdJobIds.push(id);
  return {
    id,
    pollToken,
    status: "working",
    stage: "Synthetic fixture",
    request: JSON.stringify({ synthetic: true, purpose: "agent-job-regression" }),
    ...overrides,
  };
}

async function insertJob(job) {
  await db.execute(sql`
    INSERT INTO ai_build_jobs (
      id, poll_token, status, stage, request, identity_key, usage_source,
      lease_token, lease_expires_at, completed_at
    ) VALUES (
      ${job.id}, ${job.pollToken}, ${job.status}, ${job.stage},
      ${job.request}::jsonb, ${job.identityKey ?? null}, ${job.usageSource ?? null},
      ${job.leaseToken ?? `synthetic-lease-${randomUUID()}`},
      ${job.leaseExpiresAt ?? new Date(Date.now() + 60_000)},
      ${job.completedAt ?? null}
    )
  `);
}

async function insertEvents(jobId, count) {
  for (let index = 1; index <= count; index += 1) {
    await db.execute(sql`
      INSERT INTO ai_build_job_events (job_id, type, title, detail, event_key)
      VALUES (
        ${jobId}, 'activity', ${`Synthetic event ${index}`},
        'Synthetic fixture event', ${`synthetic:event:${index}`}
      )
    `);
  }
  const events = await db.execute(sql`
    SELECT id::integer AS id FROM ai_build_job_events
    WHERE job_id = ${jobId} ORDER BY id ASC
  `);
  return events.rows.map(row => row.id);
}

async function insertAccount({ creditMicrousd, dailyBuildCount }) {
  const identityKey = `${fixturePrefix}:account:${randomUUID()}`;
  createdIdentityKeys.push(identityKey);
  await db.execute(sql`
    INSERT INTO ai_credit_accounts (
      identity_key, credit_microusd, daily_build_date, daily_build_count
    ) VALUES (${identityKey}, ${creditMicrousd}, CURRENT_DATE, ${dailyBuildCount})
  `);
  return identityKey;
}

async function account(identityKey) {
  const result = await db.execute(sql`
    SELECT credit_microusd, daily_build_count
    FROM ai_credit_accounts WHERE identity_key = ${identityKey}
  `);
  const row = result.rows[0];
  return {
    credit_microusd: BigInt(row.credit_microusd),
    daily_build_count: Number(row.daily_build_count),
  };
}

async function cancel(job) {
  const response = await fetch(endpoint("build/jobs/cancel"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: job.id, pollToken: job.pollToken }),
  });
  const body = await response.text();
  assert.equal(response.status, 200, `cancel should return 200: ${body}`);
  return JSON.parse(body);
}

async function runtimePost(path, body) {
  const response = await fetch(endpoint(path), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { response, body: await response.json() };
}

function runtimeReport(job, overrides = {}) {
  return {
    id: job.id, pollToken: job.pollToken, runtimeRevision: 1, status: "passed",
    installExitCode: 0, serverExitCode: 0, terminalOutput: "synthetic runtime",
    browserErrors: [],
    screenshots: [
      { viewport: "desktop", width: 1, height: 1, dataUrl: "data:image/png;base64,iVBORw0KGgo=" },
      { viewport: "mobile", width: 1, height: 1, dataUrl: "data:image/png;base64,iVBORw0KGgo=" },
    ],
    ...overrides,
  };
}

async function sse(job, options = {}) {
  const response = await fetch(endpoint("build/jobs/events", {
    id: job.id,
    pollToken: job.pollToken,
    ...(options.after ? { after: options.after } : {}),
  }), {
    headers: options.lastEventId ? { "Last-Event-ID": String(options.lastEventId) } : {},
    signal: AbortSignal.timeout(10_000),
  });
  const body = await response.text();
  assert.equal(response.status, 200, `SSE should return 200: ${body}`);
  const frames = body.trim().split(/\n\n+/).filter(Boolean);
  const agents = [];
  const done = [];
  for (const frame of frames) {
    const event = frame.match(/^event: (.+)$/m)?.[1];
    const data = frame.match(/^data: (.+)$/m)?.[1];
    if (event === "agent" && data) agents.push(JSON.parse(data));
    if (event === "done" && data) done.push(JSON.parse(data));
  }
  return { agents, done };
}

test.after(async () => {
  try {
    if (createdJobIds.length) {
      await db.execute(sql`DELETE FROM ai_build_jobs WHERE id = ANY(${createdJobIds}::text[])`);
    }
    if (createdIdentityKeys.length) {
      await db.execute(sql`DELETE FROM ai_credit_accounts WHERE identity_key = ANY(${createdIdentityKeys}::text[])`);
    }
  } finally {
    await pool.end();
  }
});

test("SSE replays events in order, honors Last-Event-ID, and finishes terminal jobs", async () => {
  const job = syntheticJob({ status: "completed", completedAt: new Date() });
  await insertJob(job);
  const ids = await insertEvents(job.id, 4);

  const initial = await sse(job);
  assert.deepEqual(initial.agents.map(event => event.id), ids);
  assert.deepEqual(initial.done, [{ status: "completed" }]);

  const resumed = await sse(job, { after: ids[0], lastEventId: ids[2] });
  assert.deepEqual(resumed.agents.map(event => event.id), [ids[3]]);
  assert.equal(resumed.agents.some(event => event.id <= ids[2]), false, "reconnect must not duplicate earlier events");
  assert.deepEqual(resumed.done, [{ status: "completed" }]);
});

test("repeated SSE reconnects do not alter synthetic account usage", async () => {
  const identityKey = await insertAccount({ creditMicrousd: 750_000n, dailyBuildCount: 1 });
  const job = syntheticJob({ status: "completed", identityKey, usageSource: "free", completedAt: new Date() });
  await insertJob(job);
  const ids = await insertEvents(job.id, 2);
  const before = await account(identityKey);

  await sse(job);
  await sse(job, { after: ids[0] });
  await sse(job, { after: ids[1], lastEventId: ids[1] });

  assert.deepEqual(await account(identityKey), before);
});

test("credit cancellation is idempotent, emits one terminal event, and rejects late completion", async () => {
  const identityKey = await insertAccount({ creditMicrousd: 0n, dailyBuildCount: 2 });
  const leaseToken = `synthetic-lease-${randomUUID()}`;
  const job = syntheticJob({ identityKey, usageSource: "credit", leaseToken });
  await insertJob(job);

  const cancelled = await Promise.all([cancel(job), cancel(job), cancel(job)]);
  assert.equal(cancelled.every(result => result.status === "cancelled"), true);
  assert.deepEqual(await account(identityKey), { credit_microusd: 500_000n, daily_build_count: 2 });

  const terminal = await db.execute(sql`
    SELECT count(*)::integer AS count FROM ai_build_job_events
    WHERE job_id = ${job.id} AND event_key = 'terminal:cancelled'
  `);
  assert.equal(terminal.rows[0].count, 1);

  const lateCompletion = await db.execute(sql`
    UPDATE ai_build_jobs SET status = 'completed', completed_at = NOW()
    WHERE id = ${job.id} AND lease_token = ${leaseToken}
      AND status = 'working' AND lease_expires_at > NOW()
  `);
  assert.equal(lateCompletion.rowCount, 0, "a cancelled job must reject a late worker completion");
});

test("free-build cancellation refunds the daily count exactly once", async () => {
  const identityKey = await insertAccount({ creditMicrousd: 123n, dailyBuildCount: 1 });
  const job = syntheticJob({ identityKey, usageSource: "free" });
  await insertJob(job);

  await Promise.all([cancel(job), cancel(job)]);
  assert.deepEqual(await account(identityKey), { credit_microusd: 123n, daily_build_count: 0 });
});

test("failed build refund restores credit and writes one terminal event", async () => {
  const identityKey = await insertAccount({ creditMicrousd: 0n, dailyBuildCount: 2 });
  const leaseToken = `synthetic-lease-${randomUUID()}`;
  const job = syntheticJob({ identityKey, usageSource: "credit", leaseToken });
  await insertJob(job);

  const refund = () => db.execute(sql`
    WITH refundable AS (
      UPDATE ai_build_jobs
      SET refunded_at = NOW(), status = 'failed', stage = 'Build failed',
          error = 'Synthetic tool failure', completed_at = NOW(),
          lease_expires_at = NULL, updated_at = NOW()
      WHERE id = ${job.id}
        AND lease_token = ${leaseToken}
        AND status = 'working'
        AND lease_expires_at > NOW()
        AND refunded_at IS NULL
      RETURNING id, identity_key, usage_source
    ),
    refunded AS (
      UPDATE ai_credit_accounts AS account
      SET credit_microusd = CASE
            WHEN refundable.usage_source = 'credit' THEN account.credit_microusd + 500000
            ELSE account.credit_microusd
          END,
          updated_at = NOW()
      FROM refundable
      WHERE account.identity_key = refundable.identity_key
    )
    INSERT INTO ai_build_job_events (job_id, type, title, detail, event_key)
    SELECT id, 'error', 'Build failed', 'Synthetic tool failure', 'terminal:failed'
    FROM refundable
    ON CONFLICT (job_id, event_key) DO NOTHING
  `);

  await Promise.all([refund(), refund()]);
  assert.deepEqual(await account(identityKey), { credit_microusd: 500_000n, daily_build_count: 2 });
  const terminal = await db.execute(sql`
    SELECT count(*)::integer AS count
    FROM ai_build_job_events
    WHERE job_id = ${job.id} AND event_key = 'terminal:failed'
  `);
  assert.equal(terminal.rows[0].count, 1);
});

test("completed jobs cannot be cancelled or refunded", async () => {
  const identityKey = await insertAccount({ creditMicrousd: 99n, dailyBuildCount: 2 });
  const job = syntheticJob({
    status: "completed",
    identityKey,
    usageSource: "credit",
    completedAt: new Date(),
  });
  await insertJob(job);

  const result = await cancel(job);
  assert.equal(result.status, "completed");
  assert.deepEqual(await account(identityKey), { credit_microusd: 99n, daily_build_count: 2 });
});

test("concurrent claim SQL permits exactly one claimant", async () => {
  const job = syntheticJob({ status: "queued", leaseExpiresAt: null });
  await insertJob(job);
  const claims = await Promise.all(
    Array.from({ length: 6 }, async () => {
      const token = `synthetic-claim-${randomUUID()}`;
      return db.execute(sql`
        UPDATE ai_build_jobs
        SET status = 'working', lease_token = ${token},
            lease_expires_at = NOW() + INTERVAL '90 seconds'
        WHERE id = ${job.id} AND status = 'queued'
        RETURNING lease_token
      `);
    }),
  );
  assert.equal(claims.filter(result => result.rowCount === 1).length, 1);
});

test("runtime endpoints reject stale revisions and deduplicate activity", async () => {
  const job = syntheticJob();
  await insertJob(job);
  await db.execute(sql`UPDATE ai_build_jobs SET runtime_revision = 2, runtime_state = 'awaiting' WHERE id = ${job.id}`);
  const stale = await runtimePost("build/jobs/runtime/events", {
    id: job.id, pollToken: job.pollToken, runtimeRevision: 1, eventId: "stale",
    type: "status", title: "stale",
  });
  assert.equal(stale.response.status, 409);
  const event = { id: job.id, pollToken: job.pollToken, runtimeRevision: 2, eventId: "once", type: "status", title: "Synthetic runtime status" };
  assert.equal((await runtimePost("build/jobs/runtime/events", event)).response.status, 200);
  assert.equal((await runtimePost("build/jobs/runtime/events", event)).response.status, 200);
  const count = await db.execute(sql`SELECT count(*)::integer AS count FROM ai_build_job_events WHERE job_id = ${job.id} AND event_key = 'runtime:2:once'`);
  assert.equal(count.rows[0].count, 1);
});

test("runtime reports are sanitized, current, and accepted once", async () => {
  const job = syntheticJob();
  await insertJob(job);
  await db.execute(sql`UPDATE ai_build_jobs SET runtime_revision = 1, runtime_state = 'awaiting' WHERE id = ${job.id}`);
  const report = runtimeReport(job);
  assert.equal((await runtimePost("build/jobs/runtime/report", report)).response.status, 200);
  assert.equal((await runtimePost("build/jobs/runtime/report", report)).response.status, 409);
  const stored = await db.execute(sql`SELECT runtime_report AS report FROM ai_build_jobs WHERE id = ${job.id}`);
  assert.equal(stored.rows[0].report.screenshots[0].viewport, "desktop");
  assert.equal(JSON.stringify(stored.rows[0].report).includes("data:image"), false);
});

test("cancelled jobs reject runtime reports", async () => {
  const job = syntheticJob();
  await insertJob(job);
  await db.execute(sql`UPDATE ai_build_jobs SET runtime_revision = 1, runtime_state = 'awaiting' WHERE id = ${job.id}`);
  await cancel(job);
  const result = await runtimePost("build/jobs/runtime/report", runtimeReport(job));
  assert.equal(result.response.status, 409);
});

test("GitHub repository routes never fall back to the workspace owner", async () => {
  const response = await fetch(endpoint("github/repos"));
  assert.equal(response.status, 401);
  assert.match(response.headers.get("cache-control") || "", /no-store/);
  assert.match(response.headers.get("vary") || "", /Cookie/i);
  const body = await response.json();
  assert.equal(body.code, "GITHUB_NOT_CONNECTED");
});

test("GitHub OAuth start rejects an unverified LISSA session", async () => {
  const response = await fetch(endpoint("github/oauth/start"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.equal(response.status, 401);
  assert.match(response.headers.get("cache-control") || "", /no-store/);
});

test("GitHub OAuth start accepts a signed LISSA session and sets protected state", async () => {
  const account = privateKeyToAccount(`0x${randomBytes(32).toString("hex")}`);
  const message = `Sign in to Lissa\n\nWallet: ${account.address}\nNetwork: Robinhood Chain\nChain ID: 4663\n\nThis request does not trigger a transaction or cost gas.`;
  const signature = await account.signMessage({ message });
  const response = await fetch(endpoint("github/oauth/start"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ address: account.address, message, signature }),
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  const authorizeUrl = new URL(body.authorizeUrl);
  assert.equal(authorizeUrl.origin, "https://github.com");
  assert.equal(authorizeUrl.pathname, "/login/oauth/authorize");
  assert.equal(authorizeUrl.searchParams.get("redirect_uri"), "https://lissa.fit/api/github/oauth/callback");
  assert.equal(authorizeUrl.searchParams.has("scope"), false);
  assert.ok(authorizeUrl.searchParams.get("state"));
  const cookies = response.headers.getSetCookie().filter(cookie =>
    /^lissa_(github_oauth_state|wallet_session)_v2=/.test(cookie)
  );
  assert.equal(cookies.length, 2);
  for (const cookie of cookies) {
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /Secure/i);
    assert.match(cookie, /SameSite=Lax/i);
    assert.doesNotMatch(cookie, new RegExp(signature.slice(2, 18), "i"));
  }
});

test("GitHub routes safely reject legacy or malformed sealed cookies", async () => {
  const response = await fetch(endpoint("github/repos"), {
    headers: {
      cookie: [
        "lissa_github_connection=legacy",
        "lissa_github_connection_v2=malformed",
        "lissa_wallet_session_v2=malformed",
      ].join("; "),
    },
  });
  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(body.code, "GITHUB_NOT_CONNECTED");
});

test("GitHub OAuth callback rejects missing or forged state", async () => {
  const response = await fetch(endpoint("github/oauth/callback", { code: "fake", state: "fake" }), {
    redirect: "manual",
  });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "https://lissa.fit/workspace?github=error");
});

test("GitHub OAuth rejects repository-wide legacy grants", () => {
  assert.equal(hasForbiddenRepositoryScopes(undefined), false);
  assert.equal(hasForbiddenRepositoryScopes(""), false);
  assert.equal(hasForbiddenRepositoryScopes("read:user"), false);
  assert.equal(hasForbiddenRepositoryScopes("repo, read:user"), true);
  assert.equal(hasForbiddenRepositoryScopes("public_repo"), true);
  assert.equal(hasForbiddenRepositoryScopes("admin:repo_hook"), true);
});

test("untrusted inline previews never receive same-origin access", async () => {
  const files = await Promise.all([
    readFile(new URL("../../ai-studio-applet/src/components/studio-workspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../ai-studio-applet/src/components/browser-ide.tsx", import.meta.url), "utf8"),
  ]);
  for (const source of files) {
    assert.match(source, /runtime\.previewUrl[\s\S]{0,120}allow-same-origin[\s\S]{0,120}allow-popups/);
    assert.doesNotMatch(source, /srcDoc=\{[^}]+\}\s+sandbox="[^"]*allow-same-origin/);
  }
  assert.doesNotMatch(files[0], /new Blob\(\[generatedApp\.htmlPreview\]/);
  assert.match(files[0], /disabled=\{!runtime\.previewUrl\}/);
});