import type { MetadataRoute } from "next";
import { LANGS } from "../lib/i18n";
import { absUrl, semuaRute } from "../lib/seo";

/** Sitemap dua bahasa; tiap URL memuat alternatif hreflang (xhtml:link). */
export default function sitemap(): MetadataRoute.Sitemap {
  return LANGS.flatMap((lang) =>
    semuaRute(lang).map(({ path, lastModified }) => ({
      url: absUrl(lang, path),
      ...(lastModified ? { lastModified } : {}),
      alternates: {
        languages: {
          ...Object.fromEntries(LANGS.map((l) => [l, absUrl(l, path)])),
          "x-default": absUrl("id", path),
        },
      },
    })),
  );
}
