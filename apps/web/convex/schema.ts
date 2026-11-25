import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  moderationProvider,
  moderationStatus,
  moderationVerdict,
  reportReason,
  reportStatus,
} from "./lib/validators";

export default defineSchema({
  companies: defineTable({
    name: v.string(),
    normalizedName: v.string(),
    slug: v.string(),
    industry: v.optional(v.string()),
    location: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_normalized", ["normalizedName"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["industry", "location"],
    }),

  tagDefinitions: defineTable({
    key: v.string(),
    label: v.string(),
    description: v.string(),
    weight: v.number(),
    category: v.string(),
  }).index("by_key", ["key"]),

  stories: defineTable({
    companyName: v.string(),
    companyId: v.id("companies"),
    companySlug: v.optional(v.string()),
    title: v.string(),
    body: v.string(),
    tags: v.array(v.string()),
    status: moderationStatus,
    flags: v.array(v.string()),
    meTooCount: v.number(),
  })
    .index("by_company_status", ["companyId", "status"])
    .index("by_status", ["status"])
    .searchIndex("search_body", {
      searchField: "body",
      filterFields: ["companyId", "status"],
    }),

  moderationResults: defineTable({
    storyId: v.id("stories"),
    provider: moderationProvider,
    verdict: moderationVerdict,
    reasons: v.array(v.string()),
    score: v.optional(v.number()),
  }).index("by_story", ["storyId"]),

  reactions: defineTable({
    storyId: v.id("stories"),
    tokenHash: v.string(),
  })
    .index("by_story", ["storyId"])
    .index("by_story_token", ["storyId", "tokenHash"]),

  reports: defineTable({
    storyId: v.id("stories"),
    reason: reportReason,
    detail: v.optional(v.string()),
    status: reportStatus,
  })
    .index("by_status", ["status"])
    .index("by_story", ["storyId"]),

  submissionTokens: defineTable({
    tokenHash: v.string(),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
  })
    .index("by_token", ["tokenHash"])
    .index("by_expires", ["expiresAt"]),

  // Denormalized counters so scorecards never scan the full stories table.
  companyStats: defineTable({
    companyId: v.id("companies"),
    total: v.number(),
    weightedTotal: v.number(),
    tagCounts: v.record(v.string(), v.number()),
    meToo: v.number(),
  }).index("by_company", ["companyId"]),

  platformStats: defineTable({
    key: v.string(),
    stories: v.number(),
    companies: v.number(),
    meToo: v.number(),
  }).index("by_key", ["key"]),

  // Content-free record of privileged actions.
  auditLog: defineTable({
    action: v.union(
      v.literal("moderation_override"),
      v.literal("report_resolved"),
      v.literal("story_erased"),
      v.literal("stats_rebuilt"),
      v.literal("empty_companies_deleted"),
    ),
    targetId: v.string(),
    reason: v.string(),
    createdAt: v.number(),
  }).index("by_created", ["createdAt"]),
});
