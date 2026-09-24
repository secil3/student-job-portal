import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const upload = await readFile(
  new URL("../pages/student/UploadResume.jsx", import.meta.url),
  "utf8"
);
const styles = await readFile(
  new URL("../styles/UploadResume.css", import.meta.url),
  "utf8"
);

test("keeps an accessible real PDF input behind Turkish file picker text", () => {
  assert.match(upload, /type="file"/);
  assert.match(upload, /accept="application\/pdf,\.pdf"/);
  assert.match(upload, /htmlFor="resume-upload-input"/);
  assert.match(upload, />\s*Dosya Seç\s*</);
  assert.match(upload, /file\?\.name \|\| "Dosya seçilmedi"/);
  assert.match(upload, /aria-live="polite"/);
  assert.match(styles, /\.upload-container \.upload-input[\s\S]*clip: rect\(0, 0, 0, 0\)/);
});

test("preserves PDF and five megabyte validation and upload behavior", () => {
  assert.match(upload, /file\.type !== "application\/pdf"/);
  assert.match(upload, /file\.size > 5 \* 1024 \* 1024/);
  assert.match(upload, /formData\.append\("resume", file\)/);
  assert.match(upload, /api\.post\("\/resumes\/upload", formData\)/);
});
