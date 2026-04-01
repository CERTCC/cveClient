/**
 * Test helpers — imports directly from source files via their
 * conditional Node.js exports. No function duplication needed.
 */
import { createRequire } from "module";
const require = createRequire(import.meta.url);

/* Import pure functions directly from source files */
const {
  get_deep,
  set_deep,
  simpleCopy,
  checkurl,
  check_json,
  queryParser,
} = require("../cveInterface.js");

const cveClient = require("../cveClientlib.js");

export {
  get_deep,
  set_deep,
  simpleCopy,
  checkurl,
  check_json,
  queryParser,
  cveClient,
};

/**
 * safeHTML needs a DOM — use jsdom's document (provided by vitest env).
 * The source version depends on jQuery so we reimplement the same
 * textContent/innerHTML pattern here.
 */
export function createSafeHTML() {
  return function safeHTML(uinput) {
    const div = document.createElement("div");
    div.textContent = uinput;
    return div.innerHTML;
  };
}

/**
 * cleanHTML from autoCompleter.js — same textContent pattern.
 * The source version is scoped inside the autoCompleter constructor
 * so we reimplement it here for direct testing.
 */
export function createCleanHTML() {
  return function cleanHTML(content) {
    const div = document.createElement("div");
    div.textContent = content;
    return div.innerHTML;
  };
}
