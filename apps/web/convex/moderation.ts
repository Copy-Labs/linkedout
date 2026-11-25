import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { assertAdminSession } from "./lib/auth";
import { classifyRules } from "./lib/rules";
import { applyStatusChange } from "./lib/stats";
import {
  adminArgs,
  moderationVerdict,
} from "./lib/validators";

export const classify = internalAction({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const story = await ctx.runQuery(internal.stories.getInternal, {
      storyId: args.storyId,
    });
    if (!story || story.status !== "pending") return;

    const result = classifyRules(story);
    await ctx.runMutation(internal.moderation.apply, {
      storyId: args.storyId,
      ...result,
      provider: "rules",
    });
  },
});

export const apply = internalMutation({
  args: {
    storyId: v.id("stories"),
    verdict: moderationVerdict,
    reasons: v.array(v.string()),
    score: v.number(),
    provider: v.union(v.literal("rules"), v.literal("ai")),
  },
  handler: async (ctx, args) => {
    const story = await ctx.db.get(args.storyId);
    if (!story) return;

    await ctx.db.patch(args.storyId, {
      status: args.verdict,
      flags: args.reasons,
    });
    await applyStatusChange(ctx, story, story.status, args.verdict);
    await ctx.db.insert("moderationResults", {
      storyId: args.storyId,
      provider: args.provider,
      verdict: args.verdict,
      reasons: args.reasons,
      score: args.score,
    });
  },
});

export const override = mutation({
  args: {
    ...adminArgs,
    storyId: v.id("stories"),
    verdict: moderationVerdict,
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdminSession(args.adminToken);
    const story = await ctx.db.get(args.storyId);
    if (!story) throw new Error("Story not found.");

    await ctx.db.patch(args.storyId, {
      status: args.verdict,
      flags: Array.from(new Set([...story.flags, args.reason])),
    });
    await applyStatusChange(ctx, story, story.status, args.verdict);
    await ctx.db.insert("moderationResults", {
      storyId: args.storyId,
      provider: "human",
      verdict: args.verdict,
      reasons: [args.reason],
    });
    await ctx.db.insert("auditLog", {
      action: "moderation_override",
      targetId: args.storyId,
      reason: `${story.status} -> ${args.verdict}: ${args.reason}`,
      createdAt: Date.now(),
    });
  },
});

/** Review queue: pending/flagged stories plus open reports. */
export const pending = query({
  args: adminArgs,
  handler: async (ctx, args) => {
    await assertAdminSession(args.adminToken);
    const stories = await ctx.db
      .query("stories")
      .withIndex("by_status", (q) => q.eq("status", "flagged"))
      .order("desc")
      .take(100);
    const pendingStories = await ctx.db
      .query("stories")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .take(100);
    const reports = await ctx.db
      .query("reports")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .order("desc")
      .take(100);

    return {
      stories: [...pendingStories, ...stories],
      reports,
    };
  },
});
