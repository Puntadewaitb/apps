import { createPlaywrightConfig } from "@tpl/config/playwright";

export default createPlaywrightConfig({
  port: 3002,
  serverEnv: { NEXT_TELEMETRY_DISABLED: "1" },
});
