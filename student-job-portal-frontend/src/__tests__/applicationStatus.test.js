import test from "node:test";
import assert from "node:assert/strict";
import {
  getAppliedJobIds,
  getJobApplyAvailability,
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

test("disables apply when application history is unknown", () => {
  const availability = getJobApplyAvailability({
    jobId: 8,
    appliedJobIds: new Set(),
    applicationsLoaded: false,
    resumesLoaded: true,
    resumesError: "",
    resumes: [{ id: 3 }],
    selectedResume: "3",
  });

  assert.deepEqual(availability, {
    state: "unavailable",
    disabled: true,
    label: "Apply unavailable",
  });
});

test("distinguishes a resume loading error from an empty resume list", () => {
  const common = {
    jobId: 8,
    appliedJobIds: new Set(),
    applicationsLoaded: true,
    selectedResume: "",
  };

  assert.equal(
    getJobApplyAvailability({
      ...common,
      resumesLoaded: false,
      resumesError: "Could not load CVs",
      resumes: [],
    }).state,
    "unavailable"
  );
  assert.equal(
    getJobApplyAvailability({
      ...common,
      resumesLoaded: true,
      resumesError: "",
      resumes: [],
    }).state,
    "resume-required"
  );
});

test("requires a selected CV that exists in the loaded list", () => {
  const common = {
    jobId: 8,
    appliedJobIds: new Set(),
    applicationsLoaded: true,
    resumesLoaded: true,
    resumesError: "",
    resumes: [{ id: 3 }],
  };

  assert.equal(
    getJobApplyAvailability({ ...common, selectedResume: "999" }).state,
    "select-resume"
  );
  assert.deepEqual(
    getJobApplyAvailability({ ...common, selectedResume: "3" }),
    { state: "available", disabled: false, label: "Apply" }
  );
});
