import test from "node:test";
import assert from "node:assert/strict";
import {
  getEmployerVerificationView,
  removeEmployerFromPendingList,
} from "../utils/employerVerificationState.js";

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
