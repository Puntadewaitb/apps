import { describe, expect, it } from "vitest";
import { parseYoutubeId, youtubeEmbedUrl } from "./video";

const ID = "dQw4w9WgXcQ";

describe("parseYoutubeId", () => {
  it("ID mentah & berbagai bentuk URL", () => {
    for (const v of [
      ID,
      `https://www.youtube.com/watch?v=${ID}`,
      `https://youtube.com/watch?v=${ID}&t=10s`,
      `https://m.youtube.com/watch?v=${ID}`,
      `https://youtu.be/${ID}`,
      `https://youtu.be/${ID}?si=abc`,
      `https://www.youtube.com/embed/${ID}`,
      `https://www.youtube-nocookie.com/embed/${ID}`,
      `https://www.youtube.com/shorts/${ID}`,
      `  ${ID}  `,
    ]) {
      expect(parseYoutubeId(v), v).toBe(ID);
    }
  });

  it("menolak: kosong, host lain, skema berbahaya, ID salah, injeksi", () => {
    for (const v of [
      "",
      "   ",
      null,
      undefined,
      "https://vimeo.com/123456789",
      `https://youtube.com.evil.example/watch?v=${ID}`,
      `https://evil.example/embed/${ID}`,
      `javascript:alert(1)//${ID}`,
      "https://www.youtube.com/watch?v=terlalu-pendek",
      `https://www.youtube.com/watch?v=${ID}"onload="x`,
      'dQw4w9WgXcQ"><script>',
      "https://www.youtube.com/watch",
    ]) {
      expect(parseYoutubeId(v as string | null | undefined), String(v)).toBeNull();
    }
  });

  it("embed URL memakai youtube-nocookie", () => {
    expect(youtubeEmbedUrl(ID)).toBe(`https://www.youtube-nocookie.com/embed/${ID}`);
  });
});
