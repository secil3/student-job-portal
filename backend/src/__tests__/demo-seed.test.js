import { DEMO_DATABASE_NAME, DEMO_MARKER, assertDemoEnvironment } from "../../scripts/seed-demo.js";

describe("isolated demo seed safety", () => {
  test("accepts only the marked demo database", () => {
    expect(() => assertDemoEnvironment({
      demoMode: "true",
      databaseName: DEMO_DATABASE_NAME,
      marker: DEMO_MARKER,
    })).not.toThrow();
  });

  test.each([
    ["false", DEMO_DATABASE_NAME, DEMO_MARKER],
    ["true", "student_job_portal", DEMO_MARKER],
    ["true", DEMO_DATABASE_NAME, "unexpected-marker"],
  ])("refuses a non-demo target", (demoMode, databaseName, marker) => {
    expect(() => assertDemoEnvironment({ demoMode, databaseName, marker }))
      .toThrow(/Demo seed refused/);
  });
});
