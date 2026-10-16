const playwright = require("@playwright/test");
module.exports = {
  ...playwright,
  expect:
    process.env.UI_CAPTURE === "1"
      ? require("./capture-screenshots.cjs")
      : playwright.expect,
};
