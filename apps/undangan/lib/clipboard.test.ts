import { describe, expect, it, vi } from "vitest";
import { copyText } from "./clipboard";

describe("copyText", () => {
  it("memakai Clipboard API bila tersedia", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const legacyCopy = vi.fn();
    expect(await copyText("123", { writeText, legacyCopy })).toBe(true);
    expect(writeText).toHaveBeenCalledWith("123");
    expect(legacyCopy).not.toHaveBeenCalled();
  });

  it("jatuh ke fallback bila Clipboard API ditolak", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("NotAllowedError"));
    const legacyCopy = vi.fn().mockReturnValue(true);
    expect(await copyText("abc", { writeText, legacyCopy })).toBe(true);
    expect(legacyCopy).toHaveBeenCalledWith("abc");
  });

  it("fallback langsung bila Clipboard API tidak ada", async () => {
    const legacyCopy = vi.fn().mockReturnValue(true);
    expect(await copyText("x", { legacyCopy })).toBe(true);
  });

  it("false bila semua cara gagal (tidak melempar)", async () => {
    expect(await copyText("x", {})).toBe(false);
    expect(await copyText("x", { legacyCopy: () => false })).toBe(false);
    expect(
      await copyText("x", {
        writeText: () => Promise.reject(new Error("x")),
        legacyCopy: () => {
          throw new Error("boom");
        },
      }),
    ).toBe(false);
  });
});
