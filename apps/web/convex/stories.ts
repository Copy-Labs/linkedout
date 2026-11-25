import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { assertAdminSession } from "./lib/auth";
import { applyStatusChange } from "./lib/stats";
import { adminArgs } from "./lib/validators";

export const getInternal = internalQuery({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.storyId);
  },
});

export const getById = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const story = await ctx.db.get(args.storyId);
    return story?.status === "approved" ? story : null;
  },
});

export const listRecent = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stories")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const listForCompany = query({
  args: {
    companyId: v.id("companies"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stories")
      .withIndex("by_company_status", (q) =>
        q.eq("companyId", args.companyId).eq("status", "approved"),
      )
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const search = query({
  args: {
    term: v.string(),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    const term = args.term.trim();
    if (!term) return [];
    return await ctx.db
      .query("stories")
      .withSearchIndex("search_body", (q) => {
        const filtered = q.search("body", term).eq("status", "approved");
        return args.companyId
          ? filtered.eq("companyId", args.companyId)
          : filtered;
      })
      .take(30);
  },
});

export const submit = mutation({
  args: {
    token: v.string(),
    companyName: v.string(),
    title: v.string(),
    body: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"stories">> => {
    await ctx.runMutation(internal.tokens.consume, { token: args.token });

    const title = args.title.trim();
    const body = args.body.trim();
    const companyName = args.companyName.trim();

    if (companyName.length < 2 || companyName.length > 120) {
      throw new Error("Enter a company name between 2 and 120 characters.");
    }
    if (title.length < 5 || title.length > 120) {
      throw new Error("Write a title between 5 and 120 characters.");
    }
    if (body.length < 20 || body.length > 5000) {
      throw new Error("Write a story between 20 and 5000 characters.");
    }
    if (args.tags.length > 5) {
      throw new Error("Choose at most 5 categories.");
    }

    const knownTags = new Set(
      (await ctx.db.query("tagDefinitions").collect()).map((tag) => tag.key),
    );
    for (const tag of args.tags) {
      if (!knownTags.has(tag)) throw new Error(`Unknown category: ${tag}`);
    }

    const companyId = await ctx.runMutation(internal.companies.ensure, {
      name: companyName,
    });
    const company = await ctx.db.get(companyId);
    if (!company) throw new Error("Could not resolve the company.");

    const storyId = await ctx.db.insert("stories", {
      companyName: company.name,
      companyId,
      companySlug: company.slug,
      title,
      body,
      tags: [...new Set(args.tags)],
      status: "pending",
      flags: [],
      meTooCount: 0,
    });

    await ctx.scheduler.runAfter(0, internal.moderation.classify, { storyId });
    return storyId;
  },
});

/** Permanently removes a story and everything attached to it. */
export const erase = mutation({
  args: {
    ...adminArgs,
    storyId: v.id("stories"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdminSession(args.adminToken);
    const story = await ctx.db.get(args.storyId);
    if (!story) throw new Error("Story not found.");

    await applyStatusChange(ctx, story, story.status, "erased");

    for (const table of ["reactions", "reports", "moderationResults"] as const) {
      const related = await ctx.db
        .query(table)
        .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
        .collect();
      for (const doc of related) await ctx.db.delete(doc._id);
    }

    await ctx.db.delete(args.storyId);
    await ctx.db.insert("auditLog", {
      action: "story_erased",
      targetId: args.storyId,
      reason: args.reason.slice(0, 500),
      createdAt: Date.now(),
    });
  },
});

/** One-off backfill of the canonical company slug onto older stories. */
export const backfillSlugs = internalMutation({
  args: {},
  handler: async (ctx) => {
    let patched = 0;
    for (const story of await ctx.db.query("stories").collect()) {
      const company = await ctx.db.get(story.companyId);
      if (company && story.companySlug !== company.slug) {
        await ctx.db.patch(story._id, { companySlug: company.slug });
        patched++;
      }
    }
    return patched;
  },
});
