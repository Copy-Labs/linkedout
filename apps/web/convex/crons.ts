import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("clean up expired submission tokens", { hours: 1 }, internal.tokens.cleanup);

export default crons;
