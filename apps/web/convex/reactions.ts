import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation } from "./_generated/server";
import { sha256Hex } from "./lib/hash";
import { noteReaction } from "./lib/stats";

/** Anonymous, idempotent "Me Too" using a single-use edge token. */
export const add = mutation({
  args: {
    storyId: v.id("stories"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.tokens.consume, { token: args.token });

    const tokenHash = await sha256Hex(args.token);
    const existing = await ctx.db
      .query("reactions")
      .withIndex("by_story_token", (q) =>
        q.eq("storyId", args.storyId).eq("tokenHash", tokenHash),
      )
      .unique();
    if (existing) throw new Error("You have already reacted to this story.");

    const story = await ctx.db.get(args.storyId);
    if (!story || story.status !== "approved") {
      throw new Error("Story not found.");
    }

    await ctx.db.insert("reactions", {
      storyId: args.storyId,
      tokenHash,
    });
    await ctx.db.patch(args.storyId, {
      meTooCount: story.meTooCount + 1,
    });
    await noteReaction(ctx, story.companyId);
  },
});
