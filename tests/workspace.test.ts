import { describe, expect, it } from "vitest";
import { can } from "@/lib/storage/workspace";
describe("workspace permissions", () => { it("keeps posting restricted", () => { expect(can("owner", "post")).toBe(true); expect(can("accountant", "post")).toBe(false); expect(can("viewer", "create")).toBe(false); }); });
