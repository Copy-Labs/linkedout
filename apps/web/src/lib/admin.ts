/** Exchanges the admin secret for a short-lived session token at the edge. */
export async function createAdminSession(
  secret: string,
): Promise<{ token: string }> {
  const response = await fetch("/api/admin/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ secret }),
  });
  const data = (await response.json()) as { token?: string; error?: string };
  if (!response.ok || !data.token) {
    throw new Error(data.error ?? "Could not sign in.");
  }
  return { token: data.token };
}
