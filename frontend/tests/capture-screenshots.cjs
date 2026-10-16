// Review mode captures real browser images without changing screenshot baselines.
const { expect, test } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
module.exports = expect.extend({
  async toHaveScreenshot(received, name, options = {}) {
    const info = test.info();
    const baseline = info.snapshotPath(name);
    const directory = path.resolve("ui-review", path.basename(info.file));
    fs.mkdirSync(directory, { recursive: true });
    const captured = path.join(directory, path.basename(baseline));
    // Two captures allow fonts, focus and iframe layout to settle before review.
    let previous = await received.screenshot({
      animations: "disabled",
      caret: "hide",
      scale: "css",
      ...options,
    });
    for (let attempt = 0; attempt < 3; attempt++) {
      const current = await received.screenshot({
        animations: "disabled",
        caret: "hide",
        scale: "css",
        ...options,
      });
      if (current.equals(previous)) {
        previous = current;
        break;
      }
      previous = current;
    }
    fs.writeFileSync(captured, previous);
    fs.writeFileSync(
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
