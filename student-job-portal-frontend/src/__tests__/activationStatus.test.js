import test from "node:test";
import assert from "node:assert/strict";
import {
  isRecordActive,
  updateRecordActivation,
} from "../utils/activationStatus.js";

test("recognizes numeric and database string active values", () => {
  assert.equal(isRecordActive({ is_active: 1 }), true);
  assert.equal(isRecordActive({ is_active: "1" }), true);
  assert.equal(isRecordActive({ is_active: 0 }), false);
  assert.equal(isRecordActive({}), false);
});

test("updates only the matching record after a successful request", () => {
  const records = [
    { id: 1, is_active: 1 },
    { id: 2, is_active: 1 },
  ];

  const updated = updateRecordActivation(records, 2, false);

  assert.equal(updated[0], records[0]);
  assert.equal(updated[1].is_active, 0);
  assert.equal(records[1].is_active, 1);
});

test("reactivation clears the local deactivation timestamp", () => {
  const updated = updateRecordActivation(
    [{ id: 2, is_active: 0, deactivated_at: "synthetic timestamp" }],
    2,
    true
  );

  assert.equal(updated[0].is_active, 1);
  assert.equal(updated[0].deactivated_at, null);
});
