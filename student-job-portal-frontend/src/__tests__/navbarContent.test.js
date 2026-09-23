import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const navbar = await readFile(new URL("../components/Navbar.jsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../styles/Navbar.css", import.meta.url), "utf8");

test("public and role navigation links remain available", () => {
  for (const route of [
    "/", "/about", "/student", "/student/jobs",
    "/student/applications", "/student/profile", "/student/resumes",
    "/employer", "/employer/job-post", "/admin/dashboard",
    "/admin/users", "/admin/jobs", "/admin/employers",
  ]) {
    assert.ok(navbar.includes(`to="${route}"`), `Missing route: ${route}`);
  }
  assert.doesNotMatch(navbar, /to="\/features"/);
});

test("account disclosure shows full role and preserves logout", () => {
  for (const role of ["Öğrenci", "İşveren", "Yönetici"]) {
    assert.ok(navbar.includes(role));
  }
  assert.match(navbar, /<svg[^>]*viewBox="0 0 24 24"/);
  assert.doesNotMatch(navbar, /charAt\(0\)/);
  assert.match(navbar, /logout\(\)/);
  assert.match(navbar, /navigate\("\/"\)/);
  assert.match(navbar, /aria-expanded=\{isAccountMenuOpen\}/);
  assert.match(navbar, /event\.key === "Escape"/);
  assert.match(navbar, /document\.addEventListener\("pointerdown"/);
});

test("guest and mobile navigation remain keyboard accessible", () => {
  assert.match(navbar, /to="\/login"/);
  assert.match(navbar, /to="\/register"/);
  assert.match(navbar, /aria-expanded=\{isMobileMenuOpen\}/);
  assert.match(navbar, /aria-controls="navbar-links"/);
  assert.match(styles, /@media \(max-width: 1100px\)/);
  assert.match(styles, /\.nav-center-open\s*\{\s*display: flex/);
  assert.match(styles, /\.nav-mobile-trigger:focus-visible/);
  assert.match(navbar, /isMobileMenuOpen \? "×" : "☰"/);
  assert.match(navbar, /event\.target\.closest\("a"\)/);
  assert.match(navbar, /className="nav-public-links"/);
  assert.match(navbar, /className="nav-role-links"/);
  assert.match(styles, /\.nav-role-links,\s*\.nav-mobile-auth\s*\{[^}]*border-top:/);
  assert.match(styles, /width: min\(360px, calc\(100% - 24px\)\)/);
  assert.match(styles, /max-height: min\(60vh, 420px\)/);
  assert.match(styles, /\.nav-link:focus-visible/);
});

test("theme control is outside role and mobile-only sections and uses shared preference API", () => {
  assert.match(navbar, /useSyncExternalStore\(subscribeToTheme, getTheme/);
  assert.match(navbar, /setThemePreference\(theme === "dark" \? "light" : "dark"\)/);
  assert.match(navbar, /aria-label=\{theme === "dark" \? "Açık temaya geç" : "Koyu temaya geç"\}/);
  assert.match(navbar, /aria-pressed=\{theme === "dark"\}/);
  assert.ok(navbar.indexOf('className="nav-theme-toggle"') > navbar.indexOf('className="nav-right"'));
  assert.ok(navbar.indexOf('className="nav-theme-toggle"') < navbar.indexOf('{!user && (', navbar.indexOf('className="nav-right"')));
  assert.match(styles, /\.nav-theme-toggle:focus-visible/);
  assert.doesNotMatch(styles, /\.nav-right > button\s*\{\s*display: none/);
});
