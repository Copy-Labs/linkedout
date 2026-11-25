import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

type StoryForStats = Pick<
  Doc<"stories">,
  "companyId" | "tags" | "meTooCount"
>;
type Status = Doc<"stories">["status"] | "erased";

async function ensureCompanyStats(
  ctx: MutationCtx,
  companyId: Id<"companies">,
): Promise<Id<"companyStats">> {
  const existing = await ctx.db
    .query("companyStats")
    .withIndex("by_company", (q) => q.eq("companyId", companyId))
    .unique();
  if (existing) return existing._id;
  return await ctx.db.insert("companyStats", {
    companyId,
    total: 0,
    weightedTotal: 0,
    tagCounts: {},
    meToo: 0,
  });
}

async function platformStatsId(ctx: MutationCtx): Promise<Id<"platformStats">> {
  const existing = await ctx.db
    .query("platformStats")
    .withIndex("by_key", (q) => q.eq("key", "main"))
    .unique();
  if (existing) return existing._id;
  return await ctx.db.insert("platformStats", {
    key: "main",
    stories: 0,
    companies: 0,
    meToo: 0,
  });
}

/** Called when a company is created. */
export async function noteNewCompany(ctx: MutationCtx): Promise<void> {
  const id = await platformStatsId(ctx);
  const stats = await ctx.db.get(id);
  if (stats) await ctx.db.patch(id, { companies: stats.companies + 1 });
}

/** Applies a story status transition to both counter documents. */
export async function applyStatusChange(
  ctx: MutationCtx,
  story: StoryForStats,
  from: Status,
  to: Status,
): Promise<void> {
  const delta = (to === "approved" ? 1 : 0) - (from === "approved" ? 1 : 0);
  const meTooDelta =
    (to === "approved" ? story.meTooCount : 0) -
    (from === "approved" ? story.meTooCount : 0);
  if (delta === 0 && meTooDelta === 0) return;

  const weights = new Map(
    (await ctx.db.query("tagDefinitions").collect()).map((tag) => [
      tag.key,
      tag.weight,
    ]),
  );
  let weightedDelta = 0;
  for (const tag of story.tags) weightedDelta += (weights.get(tag) ?? 1) * delta;

  const companyStatsId = await ensureCompanyStats(ctx, story.companyId);
  const company = await ctx.db.get(companyStatsId);
  if (company) {
    const tagCounts = { ...company.tagCounts };
    for (const tag of story.tags) {
      const next = (tagCounts[tag] ?? 0) + delta;
      if (next > 0) tagCounts[tag] = next;
      else delete tagCounts[tag];
    }
    await ctx.db.patch(companyStatsId, {
      total: company.total + delta,
      weightedTotal: company.weightedTotal + weightedDelta,
      meToo: company.meToo + meTooDelta,
      tagCounts,
    });
  }

  const platformId = await platformStatsId(ctx);
  const platform = await ctx.db.get(platformId);
  if (platform) {
    await ctx.db.patch(platformId, {
      stories: platform.stories + delta,
      meToo: platform.meToo + meTooDelta,
    });
  }
}

/** Called when a "Me Too" reaction is added to an approved story. */
export async function noteReaction(
  ctx: MutationCtx,
  companyId: Id<"companies">,
): Promise<void> {
  const companyStatsId = await ensureCompanyStats(ctx, companyId);
  const company = await ctx.db.get(companyStatsId);
  if (company) {
    await ctx.db.patch(companyStatsId, { meToo: company.meToo + 1 });
  }

  const platformId = await platformStatsId(ctx);
  const platform = await ctx.db.get(platformId);
  if (platform) await ctx.db.patch(platformId, { meToo: platform.meToo + 1 });
}
