import test from "node:test";
import assert from "node:assert/strict";
import { getUiLabel } from "../utils/uiLabels.js";

test("translates application, activation, approval, and role values", () => {
  assert.deepEqual(
    [
      "pending",
      "accepted",
      "rejected",
      "approved",
      "active",
      "inactive",
      "student",
      "employer",
      "admin",
    ].map(getUiLabel),
    [
      "Beklemede",
      "Kabul Edildi",
      "Reddedildi",
      "Onaylandı",
      "Aktif",
      "Pasif",
      "Öğrenci",
      "İşveren",
      "Yönetici",
    ]
  );
});

test("keeps unknown values unchanged", () => {
  assert.equal(getUiLabel("custom-status"), "custom-status");
});
