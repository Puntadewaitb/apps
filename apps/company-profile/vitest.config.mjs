import { createVitestConfig } from "@tpl/config/vitest";

export default createVitestConfig({ include: ["lib/**/*.test.ts", "content/**/*.test.ts"] });
