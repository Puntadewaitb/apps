import { describe, expect, it } from "vitest";
import { gaInit, gaSrc, pixelInit, trackingConfig, trackingCsp } from "./tracking";

describe("tracking", () => {
  it("mati bila env kosong atau format salah", () => {
    expect(trackingConfig({})).toEqual({ ga: undefined, pixel: undefined });
    expect(
      trackingConfig({ NEXT_PUBLIC_GA_ID: "UA-123", NEXT_PUBLIC_META_PIXEL_ID: "abc" }),
    ).toEqual({
      ga: undefined,
      pixel: undefined,
    });
    // upaya injeksi ditolak
    expect(trackingConfig({ NEXT_PUBLIC_GA_ID: "G-ABCD');alert(1);//" }).ga).toBeUndefined();
    expect(
      trackingConfig({ NEXT_PUBLIC_META_PIXEL_ID: "12345678');alert(1)" }).pixel,
    ).toBeUndefined();
  });

  it("aktif bila valid", () => {
    expect(
      trackingConfig({
        NEXT_PUBLIC_GA_ID: " G-ABCD1234 ",
        NEXT_PUBLIC_META_PIXEL_ID: "1234567890",
      }),
    ).toEqual({
      ga: "G-ABCD1234",
      pixel: "1234567890",
    });
  });

  it("CSP tambahan kosong bila mati, terisi bila aktif", () => {
    expect(trackingCsp({})).toEqual({ scriptSrc: [], connectSrc: [], imgSrc: [] });
    const c = trackingCsp({ ga: "G-ABCD1234", pixel: "1234567890" });
    expect(c.scriptSrc).toContain("https://www.googletagmanager.com");
    expect(c.scriptSrc).toContain("https://connect.facebook.net");
    expect(c.connectSrc.length).toBeGreaterThan(2);
  });

  it("skrip memuat ID yang benar", () => {
    expect(gaSrc("G-ABCD1234")).toBe("https://www.googletagmanager.com/gtag/js?id=G-ABCD1234");
    expect(gaInit("G-ABCD1234")).toContain("gtag('config','G-ABCD1234')");
    expect(pixelInit("1234567890")).toContain("fbq('init','1234567890')");
  });
});
