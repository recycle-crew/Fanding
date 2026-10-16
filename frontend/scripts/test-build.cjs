// Run browser checks against the production output, without test hooks.
const { spawnSync } = require("node:child_process");
const result = spawnSync(
  process.execPath,
  [require.resolve("@playwright/test/cli"), "test"],
  { stdio: "inherit", env: { ...process.env, PLAYWRIGHT_BUILD: "1" } },
);
process.exit(result.status ?? 1);
