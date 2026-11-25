import { describe, expect, it } from "vitest";
import { confidenceFor, toxicityIndex } from "../convex/lib/scoring";

describe("toxicityIndex", () => {
  it("returns zero with no approved stories", () => {
    expect(toxicityIndex(0, 0)).toBe(0);
  });

  it("scales weighted reports against the number of stories", () => {
    expect(toxicityIndex(3, 1)).toBe(50);
    expect(toxicityIndex(6, 1)).toBe(100);
  });

  it("never exceeds 100", () => {
    expect(toxicityIndex(60, 1)).toBe(100);
  });
});

describe("confidenceFor", () => {
  it("moves from low to medium to high with volume", () => {
    expect(confidenceFor(0)).toBe("low");
    expect(confidenceFor(2)).toBe("low");
    expect(confidenceFor(3)).toBe("medium");
    expect(confidenceFor(9)).toBe("medium");
    expect(confidenceFor(10)).toBe("high");
  });
});
