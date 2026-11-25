import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { assertWorker } from "./lib/auth";
import { sha256Hex } from "./lib/hash";

/** Called by the Cloudflare Worker after Turnstile and rate limiting pass. */
export const issue = mutation({
  args: {
    tokenHash: v.string(),
    expiresAt: v.number(),
    workerSecret: v.string(),
  },
  handler: async (ctx, args) => {
    assertWorker(args.workerSecret);
    await ctx.db.insert("submissionTokens", {
      tokenHash: args.tokenHash,
      expiresAt: args.expiresAt,
    });
  },
});

/** Single-use consumption. Only the hash is ever stored. */
export const consume = internalMutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const tokenHash = await sha256Hex(args.token);
    const record = await ctx.db
      .query("submissionTokens")
      .withIndex("by_token", (q) => q.eq("tokenHash", tokenHash))
      .unique();
    if (!record || record.usedAt !== undefined || record.expiresAt < Date.now()) {
      throw new Error("Invalid or expired token. Reload the page and try again.");
    }
    await ctx.db.patch(record._id, { usedAt: Date.now() });
  },
});

/** Cron job: remove tokens older than a day, a batch at a time. */
export const cleanup = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const stale = await ctx.db
      .query("submissionTokens")
      .withIndex("by_expires", (q) => q.lt("expiresAt", cutoff))
      .take(100);
    for (const doc of stale) await ctx.db.delete(doc._id);
    return stale.length;
  },
});
