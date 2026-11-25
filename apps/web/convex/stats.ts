import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertAdminSession } from "./lib/auth";
import { confidenceFor, toxicityIndex } from "./lib/scoring";
import { adminArgs } from "./lib/validators";

export const companyScorecard = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const stats = await ctx.db
      .query("companyStats")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .unique();

    const total = stats?.total ?? 0;
    const index = toxicityIndex(stats?.weightedTotal ?? 0, total);

    return {
      total,
      tagCounts: stats?.tagCounts ?? {},
      toxicityIndex: index,
      confidence: confidenceFor(total),
    };
  },
});

export const homeStats = query({
  args: {},
  handler: async (ctx) => {
    const stats = await ctx.db
      .query("platformStats")
      .withIndex("by_key", (q) => q.eq("key", "main"))
      .unique();
    return {
      stories: stats?.stories ?? 0,
      companies: stats?.companies ?? 0,
      meToo: stats?.meToo ?? 0,
    };
  },
});

/** One-off migration to (re)build counters from existing documents. */
export const rebuild = mutation({
  args: adminArgs,
  handler: async (ctx, args) => {
    await assertAdminSession(args.adminToken);

    for (const doc of await ctx.db.query("companyStats").collect()) {
      await ctx.db.delete(doc._id);
    }
    for (const doc of await ctx.db.query("platformStats").collect()) {
      await ctx.db.delete(doc._id);
    }

    const tagDefinitions = await ctx.db.query("tagDefinitions").collect();
    const weights = new Map(tagDefinitions.map((tag) => [tag.key, tag.weight]));
    const companies = await ctx.db.query("companies").collect();

    const statsByCompany = new Map<
      string,
      { total: number; weightedTotal: number; tagCounts: Record<string, number>; meToo: number }
    >();
    for (const company of companies) {
      statsByCompany.set(company._id, {
        total: 0,
        weightedTotal: 0,
        tagCounts: {},
        meToo: 0,
      });
    }

    let totalStories = 0;
    let totalMeToo = 0;
    for (const story of await ctx.db.query("stories").collect()) {
      const stats = statsByCompany.get(story.companyId);
      totalMeToo += story.meTooCount;
      if (stats) stats.meToo += story.meTooCount;
      if (story.status !== "approved") continue;
      totalStories++;
      if (!stats) continue;
      stats.total++;
      for (const tag of story.tags) {
        stats.weightedTotal += weights.get(tag) ?? 1;
        stats.tagCounts[tag] = (stats.tagCounts[tag] ?? 0) + 1;
      }
    }

    for (const [companyId, stats] of statsByCompany) {
      await ctx.db.insert("companyStats", {
        companyId: companyId as (typeof companies)[number]["_id"],
        ...stats,
      });
    }
    await ctx.db.insert("platformStats", {
      key: "main",
      stories: totalStories,
      companies: companies.length,
      meToo: totalMeToo,
    });
    await ctx.db.insert("auditLog", {
      action: "stats_rebuilt",
      targetId: "platform",
      reason: "Counters rebuilt from existing documents",
      createdAt: Date.now(),
    });
    return { companies: companies.length, stories: totalStories, meToo: totalMeToo };
  },
});
