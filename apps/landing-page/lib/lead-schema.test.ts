import { describe, expect, it } from "vitest";
import { fieldErrors, leadSchema } from "./lead-schema";

describe("leadSchema", () => {
  it("menerima input valid & menormalkan", () => {
    const r = leadSchema.parse({
      name: "  Budi  Santoso ",
      phone: "0812-3456-7890",
      message: "Halo <b>tim</b>",
    });
    expect(r).toEqual({ name: "Budi Santoso", phone: "6281234567890", message: "Halo tim" });
  });
  it("pesan opsional", () => {
    expect(leadSchema.parse({ name: "Budi", phone: "081234567890", message: "" }).message).toBe("");
  });
  it("menolak input invalid dengan pesan per field", () => {
    const r = leadSchema.safeParse({ name: "B", phone: "123", message: "x".repeat(1001) });
    expect(r.success).toBe(false);
    if (!r.success) {
      const e = fieldErrors(r.error);
      expect(e.name).toMatch(/minimal 2/);
      expect(e.phone).toMatch(/tidak valid/);
      expect(e.message).toMatch(/maksimal 1000/);
    }
  });
});
