import { mutation, query } from "./_generated/server";
import { assertAdminSession } from "./lib/auth";
import { adminArgs } from "./lib/validators";

const SEED_TAGS = [
  {
    key: "unpaid_salaries",
    label: "Unpaid salaries",
    description: "Wages, stipends or agreed payments that were not paid on time.",
    weight: 3,
    category: "Pay",
  },
  {
    key: "toxic_management",
    label: "Toxic management",
    description: "Abusive, manipulative or fear-based behaviour from managers.",
    weight: 2,
    category: "Culture",
  },
  {
    key: "burnout_culture",
    label: "Burnout culture",
    description: "Unsustainable hours, always-on expectations or chronic exhaustion.",
    weight: 2,
    category: "Culture",
  },
  {
    key: "unrealistic_expectations",
    label: "Unrealistic expectations",
    description: "Scope, targets or deadlines that could not reasonably be met.",
    weight: 1,
    category: "Work",
  },
  {
    key: "discrimination",
    label: "Discrimination",
    description: "Unequal treatment based on a protected characteristic.",
    weight: 3,
    category: "Rights",
  },
  {
    key: "no_development",
    label: "No growth or development",
    description: "Promises of learning, mentorship or progression that never materialised.",
    weight: 1,
    category: "Work",
  },
  {
    key: "poor_communication",
    label: "Poor communication",
    description: "Missing context, sudden changes or withheld information.",
    weight: 1,
    category: "Culture",
  },
  {
    key: "unsafe_environment",
    label: "Unsafe environment",
    description: "Physical, psychological or health and safety risks at work.",
    weight: 3,
    category: "Rights",
  },
  {
    key: "wage_theft",
    label: "Wage theft",
    description: "Unpaid overtime, withheld benefits or manipulated pay records.",
    weight: 3,
    category: "Pay",
  },
  {
    key: "layoff_mishandling",
    label: "Layoff mishandling",
    description: "Abrupt dismissals, withheld severance or deceptive redundancy processes.",
    weight: 2,
    category: "Rights",
  },
] as const;

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tagDefinitions").collect();
  },
});

/** Idempotent seed of the structured grievance categories. */
export const seed = mutation({
  args: adminArgs,
  handler: async (ctx, args) => {
    await assertAdminSession(args.adminToken);
    let created = 0;
    for (const tag of SEED_TAGS) {
      const existing = await ctx.db
        .query("tagDefinitions")
        .withIndex("by_key", (q) => q.eq("key", tag.key))
        .unique();
      if (!existing) {
        await ctx.db.insert("tagDefinitions", tag);
        created++;
      }
    }
    return { created, total: SEED_TAGS.length };
  },
});
