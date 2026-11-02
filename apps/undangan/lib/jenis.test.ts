import { describe, expect, it } from "vitest";
import { JENIS, JENIS_LIST, namaAcara, resolveJenis } from "./jenis";
import { TEMA, TEMA_DEFAULT, resolveTema } from "./tema";

describe("jenis acara", () => {
  it("resolveJenis: valid (case-insensitive) & fallback ke pernikahan", () => {
    expect(resolveJenis("Aqiqah")).toBe("aqiqah");
    expect(resolveJenis(" khitan ")).toBe("khitan");
    for (const bad of [undefined, null, "", "ulang-tahun", "__proto__"]) {
      expect(resolveJenis(bad as string | null | undefined)).toBe("pernikahan");
    }
  });

  it("setiap jenis punya 1–2 sesi & judul Bahasa Indonesia", () => {
    for (const j of JENIS_LIST) {
      expect(JENIS[j].sesi.length).toBeGreaterThanOrEqual(1);
      expect(JENIS[j].sesi.length).toBeLessThanOrEqual(2);
      expect(JENIS[j].sesi[0]!.key).toBe("akad");
      expect(JENIS[j].judul.startsWith("Undangan")).toBe(true);
    }
    expect(JENIS.pernikahan.sesi).toHaveLength(2);
    expect(JENIS.aqiqah.sesi).toHaveLength(1);
    expect(JENIS.khitan.cerita).toBe(false);
  });

  it("namaAcara: gabungan untuk pernikahan, nama depan anak untuk aqiqah/khitan", () => {
    expect(namaAcara("pernikahan", { groomName: "Raka Pratama", brideName: "Anisa Putri" })).toBe(
      "Raka & Anisa",
    );
    expect(namaAcara("aqiqah", { groomName: "Zahra Kamila Putri", brideName: "" })).toBe("Zahra");
    expect(namaAcara("khitan", { groomName: "  Fatih  Alamsyah", brideName: "" })).toBe("Fatih");
  });
});

describe("tema", () => {
  it("3 tema; resolveTema valid & fallback", () => {
    expect([...TEMA]).toEqual(["elegan", "floral", "islami"]);
    expect(resolveTema("ISLAMI")).toBe("islami");
    expect(resolveTema("hangat")).toBe(TEMA_DEFAULT);
    expect(resolveTema(undefined)).toBe(TEMA_DEFAULT);
    expect(resolveTema("constructor")).toBe(TEMA_DEFAULT);
  });
});
