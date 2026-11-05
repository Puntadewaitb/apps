// Smoke test sample statis terhadap server yang meniru GitHub Pages (scripts/demo/serve.mjs).
// Prasyarat: `node scripts/demo/build.mjs all` (atau satu template) sudah dijalankan.
import { createPlaywrightConfig } from "@tpl/config/playwright";

export default createPlaywrightConfig({
  port: 4100,
  testDir: "./e2e",
  serverCommand: "node ../scripts/demo/serve.mjs 4100",
  // Tes bersifat read-only terhadap file statis → aman paralel.
  workers: 2,
});
