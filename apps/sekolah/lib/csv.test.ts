import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "./csv";

describe("csv", () => {
  it("escape koma, kutip, dan baris baru", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('dia bilang "hai"')).toBe('"dia bilang ""hai"""');
    expect(csvCell("baris1\nbaris2")).toBe('"baris1\nbaris2"');
    expect(csvCell("biasa")).toBe("biasa");
    expect(csvCell(null)).toBe("");
    expect(csvCell(42)).toBe("42");
  });
  it("menetralkan formula injection", () => {
    for (const bad of ["=1+1", "+cmd", "-2+3", "@SUM(A1)", "\tx", "\rx"]) {
      expect(csvCell(bad).replace(/^"/, "").startsWith("'")).toBe(true);
    }
    expect(csvCell('=HYPERLINK("http://x","klik")')).toBe('"\'=HYPERLINK(""http://x"",""klik"")"');
  });
  it("Date → ISO, ada BOM dan CRLF", () => {
    const out = toCsv(["a", "b"], [[new Date("2026-01-02T03:04:05Z"), "x"]]);
    expect(out.startsWith("﻿a,b\r\n")).toBe(true);
    expect(out).toContain("2026-01-02T03:04:05.000Z,x\r\n");
  });
});
