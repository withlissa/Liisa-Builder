export async function startGitHubOAuth() {
  const proof = localStorage.getItem('lissa-active-wallet-session-v1');
  if (!proof) throw new Error('Sign in with your LISSA wallet before connecting GitHub.');
  const response = await fetch('/api/github/oauth/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: proof,
  });
  const data = await response.json() as { authorizeUrl?: string; error?: string };
  if (!response.ok || !data.authorizeUrl) throw new Error(data.error || 'GitHub authorization could not start.');
  window.location.assign(data.authorizeUrl);
}

export async function requireGitHubConnection(response: Response) {
  if (response.status !== 401) return false;
  const data = await response.clone().json().catch(() => null) as { code?: string } | null;
  if (data?.code !== 'GITHUB_NOT_CONNECTED') return false;
  await startGitHubOAuth();
  return true;
}