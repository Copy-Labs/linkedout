/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as companies from "../companies.js";
import type * as crons from "../crons.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_hash from "../lib/hash.js";
import type * as lib_rules from "../lib/rules.js";
import type * as lib_scoring from "../lib/scoring.js";
import type * as lib_stats from "../lib/stats.js";
import type * as lib_validators from "../lib/validators.js";
import type * as moderation from "../moderation.js";
import type * as reactions from "../reactions.js";
import type * as reports from "../reports.js";
import type * as stats from "../stats.js";
import type * as stories from "../stories.js";
import type * as tags from "../tags.js";
import type * as tokens from "../tokens.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  companies: typeof companies;
  crons: typeof crons;
  "lib/auth": typeof lib_auth;
  "lib/hash": typeof lib_hash;
  "lib/rules": typeof lib_rules;
  "lib/scoring": typeof lib_scoring;
  "lib/stats": typeof lib_stats;
  "lib/validators": typeof lib_validators;
  moderation: typeof moderation;
  reactions: typeof reactions;
  reports: typeof reports;
  stats: typeof stats;
  stories: typeof stories;
  tags: typeof tags;
  tokens: typeof tokens;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
