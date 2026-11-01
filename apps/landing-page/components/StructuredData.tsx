import { site } from "../content/site";
import { buildStructuredData, jsonLdString, siteUrl } from "../lib/seo";

export function StructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdString(buildStructuredData(site, siteUrl())) }}
    />
  );
}
