const { spawnSync } = require("node:child_process");
const args = process.argv.slice(2);
const build = args.includes("--build");
const result = spawnSync(
  process.execPath,
  [
    require.resolve("@playwright/test/cli"),
    "test",
    ...args.filter((arg) => arg !== "--build"),
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      UI_CAPTURE: "1",
      ...(build ? { PLAYWRIGHT_BUILD: "1" } : {}),
    },
  },
);
process.exit(result.status ?? 1);
