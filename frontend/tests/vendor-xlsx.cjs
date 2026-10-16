// The browser bundle is UMD; load it as CommonJS for inspecting real downloads.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const library = { exports: {} };
const sandbox = {
  module: library,
  exports: library.exports,
  require,
  Buffer,
  console,
  Uint8Array,
  ArrayBuffer,
  Date,
};
vm.runInNewContext(
  fs.readFileSync(
    path.resolve(
      __dirname,
      "../public/vendor/xlsx-0.20.3.mini.min.js",
    ),
    "utf8",
  ),
  sandbox,
  { filename: "sheetjs-download-test.cjs" },
);
module.exports = library.exports;
