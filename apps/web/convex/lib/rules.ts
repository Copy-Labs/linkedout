export type Classification = {
  verdict: "approved" | "rejected" | "flagged";
  reasons: string[];
  score: number;
};

const EMAIL = /([\w.+-]+)@([\w-]+(?:\.[\w-]+)+)/gi;
const EXAMPLE_DOMAIN =
  /(^|\.)(example\.(com|org|net|edu)|test|invalid|localhost)$/i;
const PHONE = /(?:\+?\d[\d\s().-]{7,}\d)/g;
const ADDRESS =
  /\b\d{1,5}\s+[A-Za-z0-9.\s]+\s+(Street|St|Road|Rd|Avenue|Ave|Boulevard|Blvd|Lane|Ln|Drive|Dr)\b/i;
const URL = /https?:\/\//i;
const THREAT = /\b(kill|hurt|shoot|attack)\s+(you|him|her|them)\b/i;
const HARASS = /\b(fuck you|go die|kill yourself)\b/i;

function containsRealEmail(text: string): boolean {
  for (const match of text.matchAll(EMAIL)) {
    if (!EXAMPLE_DOMAIN.test(match[2].toLowerCase())) return true;
  }
  return false;
}

function containsPhone(text: string): boolean {
  for (const match of text.matchAll(PHONE)) {
    if (match[0].replace(/\D/g, "").length >= 10) return true;
  }
  return false;
}

export function classifyRules(story: {
  title: string;
  body: string;
}): Classification {
  const text = `${story.title}\n${story.body}`;

  if (THREAT.test(text) || HARASS.test(text)) {
    return {
      verdict: "rejected",
      reasons: ["Contains a threat or direct harassment."],
      score: 0.95,
    };
  }
  if (story.body.trim().length < 20) {
    return {
      verdict: "rejected",
      reasons: ["Submission is too short to be useful."],
      score: 1,
    };
  }

  const flags: string[] = [];
  if (containsRealEmail(text)) flags.push("Possible email address detected.");
  if (containsPhone(text)) flags.push("Possible phone number detected.");
  if (ADDRESS.test(text)) flags.push("Possible street address detected.");
  if (URL.test(text)) flags.push("Links are not accepted in V1.");

  if (flags.length > 0) {
    return { verdict: "flagged", reasons: flags, score: 0.8 };
  }
  return {
    verdict: "approved",
    reasons: ["No rule-based issues detected."],
    score: 0.7,
  };
}
