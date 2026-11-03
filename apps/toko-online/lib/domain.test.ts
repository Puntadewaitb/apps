import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, ROLES, VOUCHER_TYPES, isOneOf } from "./domain";
import { hargaVarian, rupiah } from "./format";

describe("domain", () => {
  it("isOneOf: hanya nilai terdaftar (tanpa kebocoran prototipe)", () => {
    expect(isOneOf(ROLES, "ADMIN")).toBe(true);
    for (const v of ["admin", "", "__proto__", "toString", null, undefined, 1, ["ADMIN"]])
      expect(isOneOf(ROLES, v), String(v)).toBe(false);
  });
  it("setiap status pesanan punya label; tidak ada duplikat", () => {
    for (const s of ORDER_STATUSES) expect(ORDER_STATUS_LABEL[s]).toBeTruthy();
    for (const l of [ROLES, ORDER_STATUSES, VOUCHER_TYPES]) expect(new Set(l).size).toBe(l.length);
  });
  it("nilai awal sama dengan default schema.prisma", () => {
    const schema = readFileSync(join(__dirname, "..", "prisma", "schema.prisma"), "utf8");
    expect(schema).toContain(`status        String      @default("${ORDER_STATUSES[0]}")`);
    expect(schema).toContain(`role         String   @default("STAFF")`);
  });
});

describe("format", () => {
  it("rupiah tanpa desimal; hargaVarian memakai harga varian bila ada", () => {
    expect(rupiah(1_500_000).replace(/\s/g, " ")).toBe("Rp 1.500.000");
    expect(hargaVarian({ price: 100 }, { price: null })).toBe(100);
    expect(hargaVarian({ price: 100 }, { price: 150 })).toBe(150);
    expect(hargaVarian({ price: 100 }, { price: 0 })).toBe(0); // 0 adalah nilai sah, bukan "kosong"
  });
});
