import test from "node:test";
import assert from "node:assert/strict";
import {
  getEmployerVerificationView,
  removeEmployerFromPendingList,
} from "../utils/employerVerificationState.js";
import { readFile } from "node:fs/promises";

const verificationPage = await readFile(
  new URL("../pages/admin/EmployerVerification.jsx", import.meta.url),
  "utf8"
);

test("keeps loading, error, empty and list states distinct", () => {
  assert.equal(
    getEmployerVerificationView({
      loading: true,
      loadError: "",
      employers: [],
    }),
    "loading"
  );
  assert.equal(
    getEmployerVerificationView({
      loading: false,
      loadError: "Request failed",
      employers: [],
    }),
    "error"
  );
  assert.equal(
    getEmployerVerificationView({
      loading: false,
      loadError: "",
      employers: [],
    }),
    "empty"
  );
  assert.equal(
    getEmployerVerificationView({
      loading: false,
      loadError: "",
      employers: [{ id: 1 }],
    }),
    "list"
  );
});

test("removes only the successfully updated employer from the pending list", () => {
  const employers = [{ id: 1 }, { id: 2 }];
  const updated = removeEmployerFromPendingList(employers, "2");

  assert.deepEqual(updated, [{ id: 1 }]);
  assert.deepEqual(employers, [{ id: 1 }, { id: 2 }]);
});

test("shows the pending employer's company profile when available", () => {
  assert.match(verificationPage, /emp\.company_name/);
  assert.match(verificationPage, /<span>Şirket<\/span>/);
});
