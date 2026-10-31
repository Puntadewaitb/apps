import { createVitestConfig } from "@tpl/config/vitest";

export default createVitestConfig({
  include: ["src/**/*.test.{ts,tsx}"],
});
