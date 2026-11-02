import { describe, expect, it } from "vitest";
import { buildIcs, icsDate, icsEscape, icsFold } from "./ics";

describe("ics", () => {
  it("icsDate: UTC basic tanpa milidetik (08.00 WIB = 01:00Z)", () => {
    expect(icsDate(new Date("2027-02-20T08:00:00+07:00"))).toBe("20270220T010000Z");
  });

  it("icsEscape: backslash, titik koma, koma, baris baru", () => {
    expect(icsEscape("a\\b;c,d\ne\r\nf")).toBe("a\\\\b\;c\\,d\\ne\\nf");
  });

  it("icsFold: baris ≤75 oktet tidak berubah; lebih panjang dilipat dengan CRLF+spasi", () => {
    expect(icsFold("x".repeat(75))).toBe("x".repeat(75));
    const folded = icsFold("x".repeat(200));
    const lines = folded.split("\r\n");
    expect(lines.length).toBeGreaterThan(2);
    expect(new TextEncoder().encode(lines[0]!).length).toBeLessThanOrEqual(75);
    for (const l of lines.slice(1)) {
      expect(l.startsWith(" ")).toBe(true);
      expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
    }
    // sambung kembali = asli
    expect(lines.map((l, i) => (i ? l.slice(1) : l)).join("")).toBe("x".repeat(200));
  });

  it("icsFold: tidak memotong karakter multi-byte", () => {
    const text = "Pernikahan ".repeat(3) + "🎉".repeat(30);
    const folded = icsFold(text);
    const back = folded
      .split("\r\n")
      .map((l, i) => (i ? l.slice(1) : l))
      .join("");
    expect(back).toBe(text);
    for (const l of folded.split("\r\n"))
      expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
  });

  it("buildIcs: struktur valid, CRLF, dan field escape", () => {
    const now = new Date("2026-11-01T00:00:00Z");
    const out = buildIcs(
      [
        {
          uid: "akad-x@undangan.local",
          title: "Akad, Raka & Anisa",
          start: new Date("2027-02-20T08:00:00+07:00"),
          end: new Date("2027-02-20T09:00:00+07:00"),
          location: "Gedung Melati; Yogyakarta",
          description: "Baris 1\nBaris 2",
        },
      ],
      { now },
    );
    expect(out.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(out.endsWith("END:VEVENT\r\nEND:VCALENDAR\r\n")).toBe(true);
    expect(out).toContain("DTSTAMP:20261101T000000Z");
    expect(out).toContain("DTSTART:20270220T010000Z");
    expect(out).toContain("DTEND:20270220T020000Z");
    expect(out).toContain("SUMMARY:Akad\\, Raka & Anisa");
    expect(out).toContain("LOCATION:Gedung Melati\; Yogyakarta");
    expect(out).toContain("DESCRIPTION:Baris 1\\nBaris 2");
    expect(out).not.toMatch(/[^\r]\n/); // tidak ada LF telanjang
  });
});
