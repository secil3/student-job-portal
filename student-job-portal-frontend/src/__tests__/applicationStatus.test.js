import test from "node:test";
import assert from "node:assert/strict";
import {
  getAppliedJobIds,
  getJobApplicationState,
} from "../utils/applicationStatus.js";

test("matches applications to jobs only through job_id", () => {
  const ids = getAppliedJobIds([
    { job_id: 12, job_title: "Same title" },
    { job_id: "18", job_title: "Same title" },
  ]);

  assert.equal(ids.has(12), true);
  assert.equal(ids.has(18), true);
  assert.equal(ids.has(99), false);
});

test("returns applied or available when application history is known", () => {
  const ids = new Set([12]);

  assert.equal(getJobApplicationState(12, ids, true), "applied");
  assert.equal(getJobApplicationState(13, ids, true), "available");
});

test("returns unknown when application history failed to load", () => {
  assert.equal(getJobApplicationState(12, new Set(), false), "unknown");
});

test("a successful application can transition a job to applied without reloading", () => {
  const initialIds = new Set();
  assert.equal(getJobApplicationState(12, initialIds, true), "available");

  const updatedIds = new Set(initialIds);
  updatedIds.add(12);
  assert.equal(getJobApplicationState(12, updatedIds, true), "applied");
});
