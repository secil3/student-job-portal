import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const buttons = await readFile(new URL("../styles/buttons.css", import.meta.url), "utf8");
const main = await readFile(new URL("../styles/main.css", import.meta.url), "utf8");

test("shared action feedback excludes destructive and icon controls", () => {
  assert.match(buttons, /\.home-btn-primary, \.home-btn-secondary, \.auth-button/);
  assert.match(buttons, /\.btn-primary, \.btn-secondary, \.btn-outline/);
  assert.doesNotMatch(buttons, /\.btn-danger,|\.reject-btn,|\.nav-theme-toggle,|\.nav-mobile-trigger,/);
  assert.doesNotMatch(buttons, /\nbutton\s*\{/);
});

test("hover is pointer-aware, and disabled or loading actions do not move", () => {
  assert.match(buttons, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(buttons, /:not\(:disabled\):not\(\[aria-disabled="true"\]\):not\(\[aria-busy="true"\]\):not\(\.is-loading\):hover\s*\{\s*transform: scale\(1\.02\)/);
  assert.match(buttons, /:not\(:disabled\):not\(\[aria-disabled="true"\]\):not\(\[aria-busy="true"\]\):not\(\.is-loading\):active\s*\{\s*transform: scale\(0\.99\)/);
});

test("focus remains visible and reduced-motion removes transforms", () => {
  assert.match(buttons, /:focus-visible\s*\{\s*outline: 3px solid var\(--focus-ring\)/);
  assert.match(buttons, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(buttons, /:active\s*\{\s*transform: none/);
  assert.match(main, /:where\(a, button, input, select, textarea\):focus-visible/);
});
