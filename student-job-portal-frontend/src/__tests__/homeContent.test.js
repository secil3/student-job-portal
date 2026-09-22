import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const home = await readFile(new URL("../pages/Home.jsx", import.meta.url), "utf8");
const about = await readFile(new URL("../pages/About.jsx", import.meta.url), "utf8");
const features = await readFile(new URL("../pages/Features.jsx", import.meta.url), "utf8");
const app = await readFile(new URL("../App.jsx", import.meta.url), "utf8");
const navbar = await readFile(new URL("../components/Navbar.jsx", import.meta.url), "utf8");

test("public home links to the new public pages without long descriptions", () => {
  assert.match(home, /to="\/about"/);
  assert.match(home, /to="\/features"/);
  assert.doesNotMatch(home, /<ol>/);
  assert.match(app, /path="\/about" element={<About \/>}/);
  assert.match(app, /path="\/features" element={<Features \/>}/);
  assert.match(navbar, /to="\/about"/);
  assert.match(navbar, /to="\/features"/);
});

test("about preserves both existing role journeys", () => {
  assert.match(about, /Nasıl Çalışır\?/);
  assert.match(about, /ADÜ öğrenci e-postanızla kayıt olun ve adresinizi doğrulayın/);
  assert.match(about, /CV’nizle başvurun ve başvuru durumunuzu takip edin/);
  assert.match(about, /yönetici onayını bekleyin/);
  assert.match(about, /Başvuruları ve ilgili CV’leri inceleyip/);
});

test("features preserves AI limits and offers no protected direct links", () => {
  assert.match(features, /üç örnek mülakat sorusu/);
  assert.match(features, /Mesaj başvurunuza otomatik eklenmez ve işverene gönderilmez/);
  assert.match(features, /Bunlar işverenin gerçek mülakat soruları değildir/);
  assert.match(features, /CV’niz AI sağlayıcısına gönderilmez/);
  assert.match(features, /Başvuru takibi/);
  assert.doesNotMatch(home + about + features, /to=["'`]\/student\/jobs\/[^"'`]*\/(?:assistant|interview-prep)/);
});

test("existing illustrative preview and session-aware actions remain", () => {
  assert.match(home, /Illustrative preview · No real data/);
  assert.match(home, /to="\/register"/);
  assert.match(home, /to="\/login"/);
  assert.match(home, /dashboardPath/);
});
