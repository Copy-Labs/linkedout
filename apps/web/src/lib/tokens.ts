/** Requests a single-use token from the edge after Turnstile verification. */
export async function requestToken(): Promise<string> {
  let turnstileToken: string | null = null;
  try {
    const turnstile = window.turnstile;
    const widgetId = window.turnstileWidget;
    if (turnstile && widgetId) {
      // execute() resolves before the invisible challenge finishes in some
      // browsers; poll getResponse() for the freshly issued token instead of
      // reusing a token from an earlier action.
      await turnstile.execute(widgetId, { action: "submit" });
      for (let attempt = 0; attempt < 50; attempt++) {
        const response = turnstile.getResponse(widgetId);
        if (response) {
          turnstileToken = response;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
  } catch {
    turnstileToken = null;
  }

  const response = await fetch("/api/turnstile/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: turnstileToken }),
  });
  const data = (await response.json()) as { token?: string; error?: string };
  if (!response.ok || !data.token) {
    throw new Error(data.error ?? "Verification failed.");
  }
  return data.token;
}
