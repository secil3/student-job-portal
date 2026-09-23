import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const home = await readFile(new URL("../pages/Home.jsx", import.meta.url), "utf8");
const about = await readFile(new URL("../pages/About.jsx", import.meta.url), "utf8");
const app = await readFile(new URL("../App.jsx", import.meta.url), "utf8");
const navbar = await readFile(new URL("../components/Navbar.jsx", import.meta.url), "utf8");

test("public home links to the combined about page without long descriptions", () => {
  assert.match(home, /to="\/about"/);
  assert.doesNotMatch(home, /to="\/features"/);
  assert.doesNotMatch(home, /<ol>/);
  assert.match(app, /path="\/about" element={<About \/>}/);
  assert.match(app, /path="\/features" element={<Navigate to="\/about" replace \/>}/);
  assert.match(navbar, /to="\/about"/);
  assert.doesNotMatch(navbar, /to="\/features"/);
});

test("about preserves both existing role journeys", () => {
  assert.match(about, /Nasıl Çalışır\?/);
  assert.match(about, /ADÜ öğrenci e-postanızla kayıt olun ve adresinizi doğrulayın/);
  assert.match(about, /CV’nizle başvurun ve başvuru durumunuzu takip edin/);
  assert.match(about, /yönetici onayını bekleyin/);
  assert.match(about, /Başvuruları ve ilgili CV’leri inceleyip/);
});

test("about includes all features, preserves AI limits, and offers no protected direct links", () => {
  assert.match(about, /CV ile başvuru/);
  assert.match(about, /Başvuru takibi/);
  assert.match(about, /AI Başvuru Mesajı/);
  assert.match(about, /AI Mülakat Hazırlığı/);
  assert.match(about, /üç örnek mülakat sorusu/);
  assert.match(about, /Mesaj başvurunuza otomatik eklenmez ve işverene gönderilmez/);
  assert.match(about, /Bunlar işverenin gerçek mülakat soruları değildir/);
  assert.match(about, /CV’niz AI sağlayıcısına gönderilmez/);
  assert.doesNotMatch(home + about, /to=["'`]\/student\/jobs\/[^"'`]*\/(?:assistant|interview-prep)/);
});

test("existing illustrative preview and session-aware actions remain", () => {
  assert.match(home, /Illustrative preview · No real data/);
  assert.match(home, /to="\/register"/);
  assert.match(home, /to="\/login"/);
  assert.match(home, /dashboardPath/);
});
