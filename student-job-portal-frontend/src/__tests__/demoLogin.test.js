import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const login = await readFile(new URL("../pages/Login.jsx", import.meta.url), "utf8");
const api = await readFile(new URL("../services/api.js", import.meta.url), "utf8");
const demoEnv = await readFile(new URL("../../.env.demo.example", import.meta.url), "utf8");

test("demo login UI is gated by the explicit demo flag", () => {
  assert.match(login, /import\.meta\.env\.VITE_DEMO_MODE === "true"/);
  assert.match(login, /\{isDemoMode && \(/);
});

test("demo login sends only a fixed account alias and reuses the normal session", () => {
  assert.match(login, /api\.post\("\/auth\/demo-login", \{ account \}\)/);
  assert.match(login, /openSession\(res\.data\)/);
  assert.match(login, /StudentJob’ı keşfedin/);
  assert.match(login, /Rol seçerek platformu inceleyebilirsiniz./);
  assert.match(login, /Öğrenci Olarak Keşfet/);
  assert.match(login, /İşveren Olarak Keşfet/);
  assert.match(login, /Yönetici Görünümü/);
  assert.doesNotMatch(login, /elif\.yilmaz@|demo@novabyte|admin@digipath/);
});

test("API base URL is centralized and demo mode targets the isolated backend", () => {
  assert.match(api, /import\.meta\.env\.VITE_API_URL/);
  assert.match(api, /http:\/\/localhost:5050\/api/);
  assert.match(demoEnv, /VITE_API_URL=http:\/\/127\.0\.0\.1:5051\/api/);
});
