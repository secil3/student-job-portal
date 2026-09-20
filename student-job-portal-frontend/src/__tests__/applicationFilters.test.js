import test from "node:test";
import assert from "node:assert/strict";
import {
  APPLICATION_FILTERS,
  filterApplicationsByStatus,
} from "../utils/applicationFilters.js";

const applications = [
  { application_id: 1, status: "pending" },
  { application_id: 2, status: "accepted" },
  { application_id: 3, status: "rejected" },
  { application_id: 4, status: "pending" },
];

test("exposes the supported student application filters", () => {
  assert.deepEqual(APPLICATION_FILTERS, [
    "all",
    "pending",
    "accepted",
    "rejected",
  ]);
});

test("all returns every application", () => {
  assert.deepEqual(filterApplicationsByStatus(applications, "all"), applications);
});

test("filters applications by their exact status", () => {
  assert.deepEqual(
    filterApplicationsByStatus(applications, "pending").map(
      ({ application_id }) => application_id
    ),
    [1, 4]
  );
  assert.deepEqual(
    filterApplicationsByStatus(applications, "accepted").map(
      ({ application_id }) => application_id
    ),
    [2]
  );
  assert.deepEqual(
    filterApplicationsByStatus(applications, "rejected").map(
      ({ application_id }) => application_id
    ),
    [3]
  );
});

test("handles missing application data safely", () => {
  assert.deepEqual(filterApplicationsByStatus(undefined, "all"), []);
});
