/// <reference types="node" />

const encoder = new TextEncoder();

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("Unauthorized");
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const byte = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(byte)) throw new Error("Unauthorized");
    bytes[i] = byte;
  }
  return bytes;
}

/** Guards mutations called only by the Cloudflare Worker. */
export function assertWorker(provided: string): void {
  const expected = process.env.WORKER_SECRET;
  if (!expected || !constantTimeEqual(provided, expected)) {
    throw new Error("Unauthorized");
  }
}

/**
 * Verifies a short-lived HMAC session issued by the Worker. The permanent
 * ADMIN_SECRET never has to leave the server or reach the browser.
 */
export async function assertAdminSession(token: string): Promise<void> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw new Error("ADMIN_SECRET is not configured");

  const parts = token.split(".");
  if (parts.length !== 2) throw new Error("Unauthorized");
  const [payloadHex, signatureHex] = parts;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(payloadHex),
    );
    if (!constantTimeEqual(bytesToHex(signature), signatureHex)) {
      throw new Error("Unauthorized");
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") throw error;
    throw new Error("Unauthorized", { cause: error });
  }

  let payload: { v?: number; exp?: number };
  try {
    payload = JSON.parse(new TextDecoder().decode(hexToBytes(payloadHex)));
  } catch {
    throw new Error("Unauthorized");
  }
  if (payload.v !== 1 || typeof payload.exp !== "number") {
    throw new Error("Unauthorized");
  }
  if (payload.exp < Date.now()) {
    throw new Error("Session expired. Sign in again.");
  }
}
