import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

type CaptureOptions = NonNullable<Parameters<Page["screenshot"]>[0]>;

// Review mode saves browser images without changing screenshot baselines.
export const captureExpect: typeof expect = expect.extend({
  async toHaveScreenshot(
    received: Page | Locator,
    name: string | string[],
    options: CaptureOptions = {},
  ) {
    const info = test.info();
    const baseline = info.snapshotPath(
      ...(Array.isArray(name) ? name : [name]),
    );
    const relativePage = path.relative(
      path.resolve("tests/pages"),
      path.dirname(info.file),
    );
    const directory = path.resolve(
      ".artifacts/captures",
      relativePage,
      path.basename(info.file),
    );
    mkdirSync(directory, { recursive: true });
    const captured = path.join(directory, path.basename(baseline));
    const screenshotOptions = {
      animations: "disabled",
      caret: "hide",
      scale: "css",
      ...options,
    } as const;
    let previous = await received.screenshot(screenshotOptions);
    for (let attempt = 0; attempt < 3; attempt++) {
      const current = await received.screenshot(screenshotOptions);
      if (current.equals(previous)) {
        previous = current;
        break;
      }
      previous = current;
    }
    writeFileSync(captured, previous);
    writeFileSync(
      captured + ".json",
      JSON.stringify(
        { baseline, captured, project: info.project.name, title: info.title },
        null,
        2,
      ),
    );
    return {
      pass: true,
      message: () => `Screenshot captured for visual review: ${captured}`,
    };
  },
});
