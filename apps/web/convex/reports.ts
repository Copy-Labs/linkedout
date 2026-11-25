import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation } from "./_generated/server";
import { assertAdminSession } from "./lib/auth";
import { applyStatusChange } from "./lib/stats";
import { adminArgs, reportReason } from "./lib/validators";

export const create = mutation({
  args: {
    storyId: v.id("stories"),
    reason: reportReason,
    detail: v.optional(v.string()),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.tokens.consume, { token: args.token });
    const story = await ctx.db.get(args.storyId);
    if (!story || story.status !== "approved") {
      throw new Error("Story not found.");
    }
    return await ctx.db.insert("reports", {
      storyId: args.storyId,
      reason: args.reason,
      detail: args.detail?.slice(0, 2000),
      status: "open",
    });
  },
});

export const resolve = mutation({
  args: {
    ...adminArgs,
    reportId: v.id("reports"),
    resolution: v.union(v.literal("removed"), v.literal("kept")),
  },
  handler: async (ctx, args) => {
    await assertAdminSession(args.adminToken);
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Report not found.");

    await ctx.db.patch(args.reportId, {
      status: args.resolution === "removed" ? "removed" : "kept",
    });
    if (args.resolution === "removed") {
      const story = await ctx.db.get(report.storyId);
      if (story) {
        await ctx.db.patch(story._id, {
          status: "rejected",
          flags: Array.from(
            new Set([...story.flags, "Removed after a takedown request."]),
          ),
        });
        await applyStatusChange(ctx, story, story.status, "rejected");
      }
    }
    await ctx.db.insert("auditLog", {
      action: "report_resolved",
      targetId: args.reportId,
      reason: `${report.reason}: ${args.resolution}`,
      createdAt: Date.now(),
    });
  },
});
