import { beforeEach, describe, expect, it } from "vitest";
import { assertAdminSession } from "../convex/lib/auth";

const SECRET = "a-test-admin-secret";

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function makeToken(payload: object, secret = SECRET): Promise<string> {
  const payloadHex = toHex(
    new TextEncoder().encode(JSON.stringify(payload)).buffer as ArrayBuffer,
  );
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadHex),
  );
  return `${payloadHex}.${toHex(signature)}`;
}

describe("assertAdminSession", () => {
  beforeEach(() => {
    process.env.ADMIN_SECRET = SECRET;
  });

  it("accepts a fresh signed token", async () => {
    const token = await makeToken({ v: 1, exp: Date.now() + 60_000 });
    await expect(assertAdminSession(token)).resolves.toBeUndefined();
  });

  it("rejects a token signed with another secret", async () => {
    const token = await makeToken({ v: 1, exp: Date.now() + 60_000 }, "wrong");
    await expect(assertAdminSession(token)).rejects.toThrow("Unauthorized");
  });

  it("rejects an expired token", async () => {
    const token = await makeToken({ v: 1, exp: Date.now() - 1000 });
    await expect(assertAdminSession(token)).rejects.toThrow("Session expired");
  });

  it("rejects an unknown payload version", async () => {
    const token = await makeToken({ v: 2, exp: Date.now() + 60_000 });
    await expect(assertAdminSession(token)).rejects.toThrow("Unauthorized");
  });
});
