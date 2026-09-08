import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { verifyMessage } from "viem";

const router: IRouter = Router();
const sourcePattern = /\.(html?|css|scss|js|jsx|ts|tsx|json|md|svg|txt|ya?ml|toml|xml)$/i;
const ownerPattern = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const repoPattern = /^[A-Za-z0-9._-]{1,100}$/;
const stateCookie = "lissa_github_oauth_state_v2";
const connectionCookie = "lissa_github_connection_v2";
const walletSessionCookie = "lissa_wallet_session_v2";
const redirectUri = process.env.GITHUB_REDIRECT_URI || "https://lissa.fit/api/github/oauth/callback";
const appUrl = process.env.PUBLIC_APP_URL || "https://lissa.fit";

type OAuthState = { version: 2; state: string; walletAddress: `0x${string}`; expiresAt: number };
type GitHubConnection = {
  version: 2;
  accessToken: string;
  githubId: number;
  login: string;
  walletAddress: `0x${string}`;
  connectedAt: number;
};
type WalletSession = { version: 2; walletAddress: `0x${string}`; expiresAt: number };

export function hasForbiddenRepositoryScopes(scopeHeader: string | undefined) {
  return (scopeHeader || "")
    .split(/[\s,]+/)
    .filter(Boolean)
    .some(scope => !["read:user", "user:email"].includes(scope.toLowerCase()));
}

function encryptionKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is required");
  return createHash("sha256").update(secret).digest();
}

function seal(value: object) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map(part => part.toString("base64url")).join(".");
}

function unseal<T>(value: string | undefined): T | null {
  if (!value) return null;
  try {
    const [ivValue, tagValue, encryptedValue] = value.split(".");
    if (!ivValue || !tagValue || !encryptedValue) return null;
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivValue, "base64url"));
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64url")),
      decipher.final(),
    ]).toString("utf8");
    return JSON.parse(decrypted) as T;
  } catch {
    return null;
  }
}

function readCookie(req: Request, name: string) {
  const entry = (req.headers.cookie || "")
    .split(";")
    .map(value => value.trim())
    .find(value => value.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : undefined;
}

function isWalletAddress(value: unknown): value is `0x${string}` {
  return typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value);
}

function isOAuthState(value: unknown): value is OAuthState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<OAuthState>;
  return state.version === 2 &&
    typeof state.state === "string" &&
    state.state.length >= 32 &&
    isWalletAddress(state.walletAddress) &&
    typeof state.expiresAt === "number";
}

function isWalletSession(value: unknown): value is WalletSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<WalletSession>;
  return session.version === 2 &&
    isWalletAddress(session.walletAddress) &&
    typeof session.expiresAt === "number";
}

function isGitHubConnection(value: unknown): value is GitHubConnection {
  if (!value || typeof value !== "object") return false;
  const connection = value as Partial<GitHubConnection>;
  return connection.version === 2 &&
    typeof connection.accessToken === "string" &&
    connection.accessToken.length >= 20 &&
    typeof connection.githubId === "number" &&
    Number.isInteger(connection.githubId) &&
    typeof connection.login === "string" &&
    connection.login.length > 0 &&
    isWalletAddress(connection.walletAddress) &&
    typeof connection.connectedAt === "number";
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    maxAge,
    path: "/api/github",
  };
}

function getConnection(req: Request) {
  const value = unseal<unknown>(readCookie(req, connectionCookie));
  return isGitHubConnection(value) ? value : null;
}

function requireConnection(req: Request, res: Response) {
  const connection = getConnection(req);
  const walletSessionValue = unseal<unknown>(readCookie(req, walletSessionCookie));
  const walletSession = isWalletSession(walletSessionValue) ? walletSessionValue : null;
  if (
    !connection ||
    !walletSession ||
    walletSession.expiresAt <= Date.now() ||
    connection.walletAddress.toLowerCase() !== walletSession.walletAddress.toLowerCase()
  ) {
    res.clearCookie(connectionCookie, { ...cookieOptions(0), maxAge: undefined });
    res.status(401).json({ error: "Connect your GitHub account to continue.", code: "GITHUB_NOT_CONNECTED" });
    return null;
  }
  return connection;
}

async function githubFetch(connection: GitHubConnection, path: string, init?: RequestInit) {
  return fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${connection.accessToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "Lissa-Builder",
      ...init?.headers,
    },
    signal: init?.signal || AbortSignal.timeout(12_000),
  });
}

async function readBoundedText(response: globalThis.Response, maxBytes: number) {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    await response.body?.cancel();
    throw new Error("GitHub file exceeds the import limit");
  }
  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) throw new Error("GitHub file exceeds the import limit");
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function revokeOAuthToken(accessToken: string) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return;
  await fetch(`https://api.github.com/applications/${encodeURIComponent(clientId)}/token`, {
    method: "DELETE",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "Lissa-Builder",
    },
    body: JSON.stringify({ access_token: accessToken }),
    signal: AbortSignal.timeout(12_000),
  });
}

router.use("/github", (_req, res, next) => {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Vary", "Cookie");
  next();
});

router.post("/github/oauth/start", async (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId || !process.env.GITHUB_CLIENT_SECRET) {
    res.status(503).json({ error: "GitHub OAuth is not configured.", code: "GITHUB_OAUTH_NOT_CONFIGURED" });
    return;
  }

  const { address, message, signature } = req.body as {
    address?: `0x${string}`;
    message?: string;
    signature?: `0x${string}`;
  };
  const expectedMessage = address
    ? `Sign in to Lissa\n\nWallet: ${address}\nNetwork: Robinhood Chain\nChain ID: 4663\n\nThis request does not trigger a transaction or cost gas.`
    : "";
  let validWalletSession = false;
  try {
    validWalletSession = Boolean(
      address &&
      message === expectedMessage &&
      signature &&
      await verifyMessage({ address, message, signature }),
    );
  } catch {
    validWalletSession = false;
  }
  if (!validWalletSession || !address) {
    res.status(401).json({ error: "Sign in with your LISSA wallet before connecting GitHub." });
    return;
  }

  const state = randomBytes(32).toString("base64url");
  const payload: OAuthState = { version: 2, state, walletAddress: address, expiresAt: Date.now() + 10 * 60_000 };
  const walletSession: WalletSession = {
    version: 2,
    walletAddress: address,
    expiresAt: Date.now() + 30 * 24 * 60 * 60_000,
  };
  res.clearCookie("lissa_github_oauth_state", { ...cookieOptions(0), maxAge: undefined });
  res.clearCookie("lissa_github_connection", { ...cookieOptions(0), maxAge: undefined });
  res.clearCookie("lissa_wallet_session", { ...cookieOptions(0), maxAge: undefined });
  res.cookie(stateCookie, seal(payload), cookieOptions(10 * 60_000));
  res.cookie(walletSessionCookie, seal(walletSession), cookieOptions(30 * 24 * 60 * 60_000));

  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", state);
  res.json({ authorizeUrl: authorizeUrl.href });
});

router.get("/github/oauth/callback", async (req, res) => {
  const code = typeof req.query.code === "string" ? req.query.code : "";
  const returnedState = typeof req.query.state === "string" ? req.query.state : "";
  const storedValue = unseal<unknown>(readCookie(req, stateCookie));
  const stored = isOAuthState(storedValue) ? storedValue : null;
  res.clearCookie(stateCookie, { ...cookieOptions(0), maxAge: undefined });

  const stateMatches = stored &&
    stored.expiresAt > Date.now() &&
    returnedState.length === stored.state.length &&
    timingSafeEqual(Buffer.from(returnedState), Buffer.from(stored.state));
  if (!code || !stateMatches || !stored) {
    res.redirect(`${appUrl}/workspace?github=error`);
    return;
  }

  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }),
      signal: AbortSignal.timeout(12_000),
    });
    const tokenData = await tokenResponse.json() as { access_token?: string; scope?: string; error?: string };
    if (!tokenResponse.ok || !tokenData.access_token) throw new Error(tokenData.error || "Token exchange failed");
    if (hasForbiddenRepositoryScopes(tokenData.scope)) {
      await revokeOAuthToken(tokenData.access_token).catch(() => undefined);
      res.redirect(`${appUrl}/workspace?github=permissions`);
      return;
    }

    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${tokenData.access_token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Lissa-Builder",
      },
      signal: AbortSignal.timeout(12_000),
    });
    const user = await userResponse.json() as { id?: number; login?: string };
    if (!userResponse.ok || !user.id || !user.login) throw new Error("GitHub identity unavailable");

    const connection: GitHubConnection = {
      version: 2,
      accessToken: tokenData.access_token,
      githubId: user.id,
      login: user.login,
      walletAddress: stored.walletAddress,
      connectedAt: Date.now(),
    };
    res.cookie(connectionCookie, seal(connection), cookieOptions(30 * 24 * 60 * 60_000));
    res.redirect(`${appUrl}/workspace?github=connected`);
  } catch {
    res.redirect(`${appUrl}/workspace?github=error`);
  }
});

router.get("/github/status", (req, res) => {
  const connection = requireConnection(req, res);
  if (!connection) return;
  res.json(connection
    ? { connected: true, login: connection.login, githubId: connection.githubId }
    : { connected: false });
});

router.post("/github/disconnect", (_req, res) => {
  res.clearCookie(connectionCookie, { ...cookieOptions(0), maxAge: undefined });
  res.clearCookie(walletSessionCookie, { ...cookieOptions(0), maxAge: undefined });
  res.json({ connected: false });
});

router.get("/github/repos", async (req, res) => {
  const connection = requireConnection(req, res);
  if (!connection) return;
  try {
    const response = await githubFetch(connection, "/user/repos?sort=pushed&per_page=50&affiliation=owner,collaborator,organization_member");
    if (response.status === 401) {
      res.clearCookie(connectionCookie, { ...cookieOptions(0), maxAge: undefined });
      res.status(401).json({ error: "Reconnect your GitHub account to continue.", code: "GITHUB_NOT_CONNECTED" });
      return;
    }
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    const repos = await response.json() as Array<Record<string, unknown>>;
    res.json(repos.filter(repo => repo.private === false).map(repo => ({
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      defaultBranch: repo.default_branch,
      description: repo.description,
      updatedAt: repo.updated_at,
    })));
  } catch {
    res.status(502).json({ error: "Unable to load repositories from your GitHub account." });
  }
});

router.get("/github/import/:owner/:repo", async (req, res) => {
  const connection = requireConnection(req, res);
  if (!connection) return;
  const { owner, repo } = req.params;
  if (!ownerPattern.test(owner) || !repoPattern.test(repo)) {
    res.status(400).json({ error: "Invalid GitHub repository name." });
    return;
  }
  try {
    const repoResponse = await githubFetch(connection, `/repos/${owner}/${repo}`);
    if (repoResponse.status === 401) {
      res.clearCookie(connectionCookie, { ...cookieOptions(0), maxAge: undefined });
      res.status(401).json({ error: "Reconnect your GitHub account to continue.", code: "GITHUB_NOT_CONNECTED" });
      return;
    }
    if (!repoResponse.ok) throw new Error("Repository unavailable");
    const repository = await repoResponse.json() as { default_branch: string; private?: boolean };
    if (repository.private !== false) {
      res.status(403).json({
        error: "Private repositories require the read-only LISSA GitHub App.",
        code: "GITHUB_PRIVATE_REPOSITORY_UNSUPPORTED",
      });
      return;
    }
    const treeResponse = await githubFetch(
      connection,
      `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(repository.default_branch)}?recursive=1`,
    );
    if (treeResponse.status === 401) {
      res.clearCookie(connectionCookie, { ...cookieOptions(0), maxAge: undefined });
      res.status(401).json({ error: "Reconnect your GitHub account to continue.", code: "GITHUB_NOT_CONNECTED" });
      return;
    }
    if (!treeResponse.ok) throw new Error("Tree unavailable");
    const tree = await treeResponse.json() as {
      truncated?: boolean;
      tree: Array<{ path: string; type: string; size?: number }>;
    };
    if (tree.truncated) throw new Error("Repository tree is too large to import safely");
    const candidates = tree.tree
      .filter(item => item.type === "blob" && sourcePattern.test(item.path) && (item.size || 0) <= 200_000)
      .slice(0, 80);
    const files: Record<string, string> = {};
    let totalBytes = 0;
    for (const item of candidates) {
      const response = await githubFetch(
        connection,
        `/repos/${owner}/${repo}/contents/${item.path.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(repository.default_branch)}`,
        { headers: { Accept: "application/vnd.github.raw+json" } },
      );
      if (response.status === 401) {
        res.clearCookie(connectionCookie, { ...cookieOptions(0), maxAge: undefined });
        res.status(401).json({ error: "Reconnect your GitHub account to continue.", code: "GITHUB_NOT_CONNECTED" });
        return;
      }
      if (response.ok) {
        const remainingBytes = 2_000_000 - totalBytes;
        if (remainingBytes <= 0) break;
        const source = await readBoundedText(response, Math.min(200_000, remainingBytes));
        const sourceBytes = Buffer.byteLength(source);
        totalBytes += sourceBytes;
        files[item.path] = source;
      }
    }
    res.json({ files, branch: repository.default_branch });
  } catch {
    res.status(502).json({ error: "Unable to import this repository from your GitHub account." });
  }
});

export default router;