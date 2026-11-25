import { describe, expect, it } from "vitest";
import { classifyRules } from "../convex/lib/rules";

const cleanBody =
  "Managers repeatedly changed the agreed pay dates without explanation and the team had to chase payment every month.";

describe("classifyRules", () => {
  it("approves clean stories", () => {
    expect(classifyRules({ title: "Late pay every month", body: cleanBody })).toMatchObject({
      verdict: "approved",
    });
  });

  it("rejects threats and harassment", () => {
    expect(
      classifyRules({ title: "Bad manager", body: "I am going to hurt you for this." }),
    ).toMatchObject({ verdict: "rejected" });
  });

  it("rejects very short submissions", () => {
    expect(classifyRules({ title: "Bad job", body: "Terrible place" })).toMatchObject({
      verdict: "rejected",
    });
  });

  it("flags possible personal information", () => {
    const result = classifyRules({
      title: "They shared my contact details",
      body: `They emailed private.person@company-domain.co to everyone. ${cleanBody}`,
    });
    expect(result.verdict).toBe("flagged");
    expect(result.reasons.join(" ")).toContain("email");
  });

  it("does not flag obvious example domains or short numbers", () => {
    expect(
      classifyRules({
        title: "Payroll delays in 2024",
        body: `Contact was via test@example.com and the dispute was 12345. ${cleanBody}`,
      }),
    ).toMatchObject({ verdict: "approved" });
  });

  it("flags links", () => {
    expect(
      classifyRules({ title: "Evidence was posted", body: `See https://example.org. ${cleanBody}` }),
    ).toMatchObject({ verdict: "flagged" });
  });
});
