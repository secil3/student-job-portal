import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const login = await readFile(new URL("../pages/Login.jsx", import.meta.url), "utf8");
const register = await readFile(new URL("../pages/Register.jsx", import.meta.url), "utf8");

test("login and register transitions use Turkish user-facing text", () => {
  assert.match(login, /Parolanızı mı unuttunuz\?/);
  assert.match(login, /Hesabınız yok mu\?/);
  assert.match(login, /Kayıt Ol/);
  assert.match(register, /Giriş sayfasına geç/);
  assert.match(register, /Zaten hesabınız var mı\?/);
  assert.match(register, /Giriş Yap/);

  assert.doesNotMatch(login, /Forgot password\?|Don&apos;t have an account\?|>\s*Register\s*</);
  assert.doesNotMatch(register, /Already have an account\?|>\s*Login\s*</);
});
