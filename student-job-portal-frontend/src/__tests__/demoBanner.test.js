import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const banner = await readFile(new URL("../components/DemoBanner.jsx", import.meta.url), "utf8");
const app = await readFile(new URL("../App.jsx", import.meta.url), "utf8");

test("demo banner is gated by the explicit Vite demo flag", () => {
  assert.match(banner, /import\.meta\.env\.VITE_DEMO_MODE === "true"/);
  assert.match(banner, /if \(!isDemoMode\) return null/);
  assert.match(app, /<DemoBanner \/>/);
});

test("demo banner clearly identifies every category as fictional", () => {
  assert.match(banner, /Demo Sürümü/);
  assert.match(banner, /kullanıcı, şirket, ilan, CV ve başvuru bilgileri/);
  assert.match(banner, /tanıtım amacıyla oluşturulmuş kurgusal verilerdir/);
});
