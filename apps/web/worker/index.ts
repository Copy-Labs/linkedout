import { ConvexHttpClient } from "convex/browser";
import { Hono } from "hono";
import { api } from "../convex/_generated/api.js";

const app = new Hono<{ Bindings: Env }>();

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function applySecurityHeaders(headers: Headers): void {
  headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Frame-Options", "DENY");
  headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()",
  );
  // Report-only while we observe what Turnstile and Convex need.
  headers.set(
    "Content-Security-Policy-Report-Only",
    [
      "default-src 'self'",
      "script-src 'self' https://challenges.cloudflare.com https://*.posthog.com",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "img-src 'self' data: https:",
      "connect-src 'self' https://challenges.cloudflare.com https://hagen.challenges.cloudflare.com https://brunhild.challenges.cloudflare.com https://*.convex.cloud wss://*.convex.cloud https://*.posthog.com",
      "worker-src 'self' blob: data:",
      "frame-src https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  );
}

app.use("*", async (c, next) => {
  await next();
  applySecurityHeaders(c.res.headers);
});

app.get("/api/health", (c) => c.json({ ok: true }));

/**
 * Verifies Turnstile at the edge and issues a single-use token.
 * Convex stores only the hash, so this is the only place a raw token exists.
 */
app.post("/api/turnstile/verify", async (c) => {
  const body = await c.req
    .json<{ token?: string }>()
    .catch((): { token?: string } => ({}));
  if (!body.token) return c.json({ error: "Missing verification token" }, 400);

  // The IP is salted with a secret and rotated daily. It is used only as a
  // rate-limit key: it is never logged, sent to Convex or persisted.
  const ip = c.req.header("cf-connecting-ip") ?? "unknown";
  const day = new Date().toISOString().slice(0, 10);
  const key = await sha256Hex(`${ip}:${day}:${c.env.WORKER_SECRET}`);
  const { success } = await c.env.RATE_LIMITER.limit({ key });
  if (!success) {
    return c.json({ error: "Too many requests. Try again later." }, 429);
  }

  const verification = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        secret: c.env.TURNSTILE_SECRET_KEY,
        response: body.token,
      }),
    },
  );
  const result = await verification.json<{
    success: boolean;
    hostname?: string;
    action?: string;
  }>();
  if (!result.success) {
    return c.json({ error: "Verification failed. Please try again." }, 400);
  }
  if (
    c.env.TURNSTILE_EXPECTED_HOSTNAME &&
    result.hostname !== c.env.TURNSTILE_EXPECTED_HOSTNAME
  ) {
    return c.json({ error: "Token was issued for another hostname." }, 400);
  }
  if (
    c.env.TURNSTILE_EXPECTED_ACTION &&
    result.action &&
    result.action !== c.env.TURNSTILE_EXPECTED_ACTION
  ) {
    return c.json({ error: "Unexpected token action." }, 400);
  }

  const token =
    crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
  const convex = new ConvexHttpClient(c.env.CONVEX_URL);
  await convex.mutation(api.tokens.issue, {
    tokenHash: await sha256Hex(token),
    expiresAt: Date.now() + 10 * 60 * 1000,
    workerSecret: c.env.WORKER_SECRET,
  });

  return c.json({ token });
});

/** Exchanges the permanent admin secret for a short-lived HMAC token. */
app.post("/api/admin/session", async (c) => {
  const ip = c.req.header("cf-connecting-ip") ?? "unknown";
  const key = await sha256Hex(`admin:${ip}:${c.env.WORKER_SECRET}`);
  const { success } = await c.env.RATE_LIMITER.limit({ key });
  if (!success) {
    return c.json({ error: "Too many attempts. Try again later." }, 429);
  }

  const body = await c.req
    .json<{ secret?: string }>()
    .catch((): { secret?: string } => ({}));
  if (!body.secret || !constantTimeEqual(body.secret, c.env.ADMIN_SECRET)) {
    return c.json({ error: "Invalid admin secret" }, 401);
  }

  const payloadHex = Array.from(
    new TextEncoder().encode(
      JSON.stringify({ v: 1, exp: Date.now() + 30 * 60 * 1000 }),
    ),
  )
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(c.env.ADMIN_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    hmacKey,
    new TextEncoder().encode(payloadHex),
  );
  const signatureHex = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return c.json({ token: `${payloadHex}.${signatureHex}` });
});

// Everything else is the built Vite SPA.
app.all("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
