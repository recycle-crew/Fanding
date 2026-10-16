const playwright = require("@playwright/test");
const test = playwright.test.extend({
  reduxIntegrity: [
    async ({ page }, use) => {
      const errors = [];
      page.on("console", (message) => {
        if (
          /non-serializable|A state mutation was detected/i.test(message.text())
        )
          errors.push(message.text());
      });
      await use();
      playwright
        .expect(
          errors,
          "Redux action／state 必須可序列化，且不得直接變更 state",
        )
        .toEqual([]);
    },
    { auto: true },
  ],
});
module.exports = {
  ...playwright,
  test,
  expect:
    process.env.UI_CAPTURE === "1"
      ? require("./capture-screenshots.cjs")
      : playwright.expect,
};
