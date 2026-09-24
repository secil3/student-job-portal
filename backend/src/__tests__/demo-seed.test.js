import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEMO_DATABASE_NAME, DEMO_MARKER, assertDemoEnvironment } from "../../scripts/seed-demo.js";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const seedSource = fs.readFileSync(
  path.resolve(testDirectory, "../../scripts/seed-demo.js"),
  "utf8"
);

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

  test("uses shared user and company profile sources for demo identities", () => {
    expect(seedSource).toContain("(email, full_name, password, role");
    expect(seedSource).toContain("INSERT INTO company_profiles");
    expect(seedSource).not.toContain("INSERT INTO demo_company_profiles");
  });
});
