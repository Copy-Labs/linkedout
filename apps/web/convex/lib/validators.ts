import { v } from "convex/values";

export const moderationStatus = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("flagged"),
);

export const moderationVerdict = v.union(
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("flagged"),
);

export const moderationProvider = v.union(
  v.literal("rules"),
  v.literal("ai"),
  v.literal("human"),
);

export const reportReason = v.union(
  v.literal("defamation"),
  v.literal("pii"),
  v.literal("hate"),
  v.literal("spam"),
  v.literal("other"),
);

export const reportStatus = v.union(
  v.literal("open"),
  v.literal("reviewing"),
  v.literal("removed"),
  v.literal("kept"),
);

export const adminArgs = { adminToken: v.string() };
