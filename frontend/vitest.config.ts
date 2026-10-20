import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.ts";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "node",
      include: ["src/**/*.test.ts"],
      setupFiles: ["./tests/setup.ts"],
      clearMocks: true,
      allowOnly: !process.env.CI,
    },
  }),
);
