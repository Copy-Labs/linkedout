import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";
import { assertAdminSession } from "./lib/auth";
import { noteNewCompany } from "./lib/stats";
import { adminArgs } from "./lib/validators";

function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function baseSlug(name: string): string {
  return normalize(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("companies").order("desc").take(50);
  },
});

export const bySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("companies")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const search = query({
  args: { term: v.string() },
  handler: async (ctx, args) => {
    const term = args.term.trim();
    if (!term) return [];
    return await ctx.db
      .query("companies")
      .withSearchIndex("search_name", (q) => q.search("name", term))
      .take(20);
  },
});

export const ensure = internalMutation({
  args: { name: v.string() },
  handler: async (ctx, args): Promise<Id<"companies">> => {
    const normalizedName = normalize(args.name);
    const existing = await ctx.db
      .query("companies")
      .withIndex("by_normalized", (q) => q.eq("normalizedName", normalizedName))
      .unique();
    if (existing) return existing._id;

    const base = baseSlug(args.name) || "company";
    let slug = base;
    let suffix = 2;
    while (
      await ctx.db
        .query("companies")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique()
    ) {
      slug = `${base}-${suffix++}`;
    }

    const companyId = await ctx.db.insert("companies", {
      name: args.name.trim(),
      normalizedName,
      slug,
    });
    await noteNewCompany(ctx);
    return companyId;
  },
});

/** Removes companies that never received a published or pending story. */
export const deleteEmpty = mutation({
  args: adminArgs,
  handler: async (ctx, args) => {
    await assertAdminSession(args.adminToken);
    let removed = 0;

    for (const company of await ctx.db.query("companies").collect()) {
      const hasStory = await ctx.db
        .query("stories")
        .withIndex("by_company_status", (q) => q.eq("companyId", company._id))
        .first();
      if (hasStory) continue;

      const companyStats = await ctx.db
        .query("companyStats")
        .withIndex("by_company", (q) => q.eq("companyId", company._id))
        .unique();
      if (companyStats) await ctx.db.delete(companyStats._id);
      await ctx.db.delete(company._id);

      const platform = await ctx.db
        .query("platformStats")
        .withIndex("by_key", (q) => q.eq("key", "main"))
        .unique();
      if (platform) {
        await ctx.db.patch(platform._id, {
          companies: Math.max(0, platform.companies - 1),
        });
      }
      removed++;
    }

    if (removed > 0) {
      await ctx.db.insert("auditLog", {
        action: "empty_companies_deleted",
        targetId: "companies",
        reason: `${removed} empty company records removed`,
        createdAt: Date.now(),
      });
    }
    return removed;
  },
});
