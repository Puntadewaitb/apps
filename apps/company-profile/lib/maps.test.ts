import { describe, expect, it } from "vitest";
import { mapsSearchUrl, safeMapsEmbedUrl } from "./maps";

describe("safeMapsEmbedUrl", () => {
  it("menerima embed Google Maps via HTTPS", () => {
    expect(safeMapsEmbedUrl("https://www.google.com/maps/embed?pb=!1m18")).toBe(
      "https://www.google.com/maps/embed?pb=!1m18",
    );
    expect(safeMapsEmbedUrl("https://www.google.com/maps?q=Yogyakarta&output=embed")).toContain(
      "output=embed",
    );
  });

  it("menolak selain itu", () => {
    for (const bad of [
      "",
      null,
      undefined,
      "http://www.google.com/maps/embed?pb=1",
      "https://evil.example/maps/embed?pb=1",
      "https://www.google.com.evil.example/maps/embed",
      "https://www.google.com:8443/maps/embed",
      "https://www.google.com/search?q=x",
      "https://www.google.com/maps?q=x", // bukan embed
      "javascript:alert(1)",
      "//www.google.com/maps/embed",
      "bukan url",
    ]) {
      expect(safeMapsEmbedUrl(bad as string | null | undefined), String(bad)).toBeNull();
    }
  });

  it("mapsSearchUrl meng-encode query", () => {
    expect(mapsSearchUrl("Jl. Melati No. 1 & 2")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Jl.%20Melati%20No.%201%20%26%202",
    );
  });
});
