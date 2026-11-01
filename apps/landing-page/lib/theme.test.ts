import { describe, expect, it } from "vitest";
import { THEMES, resolveTheme } from "./theme";

describe("resolveTheme", () => {
  it("env valid menimpa default (case-insensitive)", () => {
    for (const t of THEMES) expect(resolveTheme(t.toUpperCase(), "netral")).toBe(t);
  });
  it("env kosong/tidak valid → fallback", () => {
    expect(resolveTheme(undefined, "hijau")).toBe("hijau");
    expect(resolveTheme("", "hangat")).toBe("hangat");
    expect(resolveTheme("pelangi", "netral")).toBe("netral");
  });
});
