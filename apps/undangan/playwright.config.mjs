import { createPlaywrightConfig } from "@tpl/config/playwright";

export default createPlaywrightConfig({
  port: 3003,
  serverCommand: "node e2e/prepare-db.mjs && npm run build && npx next start -p 3003",
  serverEnv: {
    DATABASE_URL: "file:./e2e.db",
    EVENT_SLUG: "raka-anisa",
    NEXT_TELEMETRY_DISABLED: "1",
  },
});
