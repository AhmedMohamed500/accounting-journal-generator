import { describe, expect, it } from "vitest";
import { demoParties } from "@/data/demo-parties";

describe("demo parties", () => {
  it("provides suppliers and customers with unique codes", () => {
    expect(demoParties.filter((party) => party.type === "supplier").length).toBeGreaterThanOrEqual(5);
    expect(demoParties.filter((party) => party.type === "customer").length).toBeGreaterThanOrEqual(3);
    expect(new Set(demoParties.map((party) => party.code)).size).toBe(demoParties.length);
  });
});
