import { describe, expect, it } from "vitest";
import {
  DONATION_STATUSES,
  DONATION_STATUS_LABEL,
  GENDERS,
  POST_KINDS,
  REG_STATUSES,
  REG_STATUS_LABEL,
  ROLES,
  isOneOf,
} from "./domain";

describe("domain", () => {
  it("isOneOf: hanya nilai terdaftar (tanpa kebocoran prototipe)", () => {
    expect(isOneOf(ROLES, "ADMIN")).toBe(true);
    for (const v of ["admin", "", "__proto__", "toString", null, undefined, 1, ["ADMIN"]]) {
      expect(isOneOf(ROLES, v), String(v)).toBe(false);
    }
  });

  it("setiap status punya label; tidak ada duplikat", () => {
    for (const s of REG_STATUSES) expect(REG_STATUS_LABEL[s]).toBeTruthy();
    for (const s of DONATION_STATUSES) expect(DONATION_STATUS_LABEL[s]).toBeTruthy();
    for (const list of [ROLES, POST_KINDS, REG_STATUSES, DONATION_STATUSES, GENDERS])
      expect(new Set(list).size).toBe(list.length);
  });

  it("status awal sama dengan default schema.prisma", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const schema = readFileSync(join(__dirname, "..", "prisma", "schema.prisma"), "utf8");
    expect(schema).toContain(`status        String   @default("${REG_STATUSES[0]}")`);
    expect(schema).toContain(`status     String          @default("${DONATION_STATUSES[0]}")`);
    expect(schema).toContain(`kind        String    @default("${POST_KINDS[0]}")`);
    expect(schema).toContain(`role         String   @default("EDITOR")`);
  });
});
