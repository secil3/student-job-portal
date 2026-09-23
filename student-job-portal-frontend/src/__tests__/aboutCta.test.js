import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const about = await readFile(new URL("../pages/About.jsx", import.meta.url), "utf8");

test("about shows login and registration actions only to guests", () => {
  assert.match(about, /const \{ user \} = useAuth\(\)/);
  assert.match(about, /!user \? \(/);
  assert.match(about, /to="\/register">Kayıt Ol/);
  assert.match(about, /to="\/login">Giriş Yap/);
});

test("about provides one role-appropriate action to authenticated users", () => {
  assert.match(about, /student: \{ to: "\/student\/jobs", label: "İlanları Gör" \}/);
  assert.match(about, /employer: \{ to: "\/employer", label: "İşveren Paneline Git" \}/);
  assert.match(about, /admin: \{ to: "\/admin\/dashboard", label: "Yönetici Paneline Git" \}/);
  assert.match(about, /authenticatedCta && \(/);
  assert.match(about, /to=\{authenticatedCta\.to\}/);
  assert.match(about, /\{authenticatedCta\.label\}/);
});
