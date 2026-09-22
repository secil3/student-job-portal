import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { getTheme, getThemePreference, setThemePreference, subscribeToTheme } from "../utils/theme.js";

const script = await readFile(new URL("../../public/theme-init.js", import.meta.url), "utf8");
const html = await readFile(new URL("../../index.html", import.meta.url), "utf8");

function startTheme({ saved = null, systemDark = false, storageBlocked = false } = {}) {
  const values = new Map(saved === null ? [] : [["studentjob-theme", saved]]);
  const mediaListeners = [];
  const mediaQuery = {
    matches: systemDark,
    addEventListener(type, listener) {
      if (type === "change") mediaListeners.push(listener);
    },
  };
  const window = {
    localStorage: {
      getItem(key) {
        if (storageBlocked) throw new Error("Storage unavailable");
        return values.get(key) ?? null;
      },
      setItem(key, value) {
        if (storageBlocked) throw new Error("Storage unavailable");
        values.set(key, value);
      },
      removeItem(key) {
        if (storageBlocked) throw new Error("Storage unavailable");
        values.delete(key);
      },
    },
    matchMedia: () => mediaQuery,
  };
  const document = { documentElement: { dataset: {}, style: {} } };
  runInNewContext(script, { window, document, Set });
  return {
    api: window.StudentJobTheme,
    root: document.documentElement,
    values,
    setSystemDark(value) {
      mediaQuery.matches = value;
      mediaListeners.forEach((listener) => listener());
    },
  };
}

test("initial script runs before React and manual preference overrides system", () => {
  assert.ok(html.indexOf('/theme-init.js') < html.indexOf('/src/main.jsx'));
  const theme = startTheme({ saved: "light", systemDark: true });
  assert.equal(theme.api.getTheme(), "light");
  assert.equal(theme.root.style.colorScheme, "light");
  theme.setSystemDark(false);
  theme.setSystemDark(true);
  assert.equal(theme.api.getTheme(), "light");
});

test("manual choice survives a simulated refresh", () => {
  const first = startTheme({ systemDark: false });
  assert.equal(first.api.setPreference("dark"), true);
  assert.equal(first.values.get("studentjob-theme"), "dark");
  const refreshed = startTheme({ saved: first.values.get("studentjob-theme") });
  assert.equal(refreshed.api.getTheme(), "dark");
  assert.equal(refreshed.root.style.colorScheme, "dark");
});

test("invalid stored and newly requested values cannot override system", () => {
  const theme = startTheme({ saved: "unexpected", systemDark: true });
  assert.equal(theme.api.getPreference(), null);
  assert.equal(theme.api.getTheme(), "dark");
  assert.equal(theme.api.setPreference("unexpected"), false);
  assert.equal(theme.api.getTheme(), "dark");
});

test("blocked storage does not crash and keeps an in-memory choice", () => {
  const theme = startTheme({ systemDark: false, storageBlocked: true });
  assert.equal(theme.api.getTheme(), "light");
  assert.equal(theme.api.setPreference("dark"), true);
  theme.setSystemDark(false);
  assert.equal(theme.api.getTheme(), "dark");
});

test("system changes apply only without a manual choice", () => {
  const theme = startTheme();
  const observed = [];
  const unsubscribe = theme.api.subscribe((value) => observed.push(value));
  theme.setSystemDark(true);
  assert.equal(theme.api.getTheme(), "dark");
  theme.api.setPreference("light");
  theme.setSystemDark(true);
  assert.equal(theme.api.getTheme(), "light");
  theme.api.setPreference(null);
  assert.equal(theme.api.getTheme(), "dark");
  assert.equal(theme.values.has("studentjob-theme"), false);
  unsubscribe();
  assert.deepEqual(observed, ["dark", "light", "dark"]);
});

test("React-facing helper delegates to the same early theme instance", () => {
  const theme = startTheme();
  const previousWindow = globalThis.window;
  globalThis.window = { StudentJobTheme: theme.api };
  try {
    const updates = [];
    const unsubscribe = subscribeToTheme((value) => updates.push(value));
    assert.equal(getTheme(), "light");
    assert.equal(setThemePreference("dark"), true);
    assert.equal(getTheme(), "dark");
    assert.equal(getThemePreference(), "dark");
    assert.equal(theme.values.get("studentjob-theme"), "dark");
    assert.deepEqual(updates, ["dark"]);
    unsubscribe();
  } finally {
    globalThis.window = previousWindow;
  }
});
