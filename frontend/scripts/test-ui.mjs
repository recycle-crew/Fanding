import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const flags = new Set(["--build", "--rwd"]);
const args = process.argv.slice(2);
if (args.includes("--build") && args.includes("--rwd"))
  throw new Error("請分開執行正式產物與 RWD 測試。");
const result = spawnSync(
  process.execPath,
  [
    fileURLToPath(import.meta.resolve("@playwright/test/cli")),
    "test",
    ...args.filter((arg) => !flags.has(arg)),
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      ...(args.includes("--build") ? { PLAYWRIGHT_BUILD: "1" } : {}),
      ...(args.includes("--rwd") ? { PLAYWRIGHT_RWD: "1" } : {}),
    },
  },
);
process.exit(result.status ?? 1);
