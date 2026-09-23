import { readFile } from "node:fs/promises";

const appSource = await readFile(new URL("../app.js", import.meta.url), "utf8");

describe("Production route surface", () => {
  test("does not mount development test routes", () => {
    expect(appSource).not.toContain('from "./routes/test.routes.js"');
    expect(appSource).not.toContain('app.use("/api/test"');
  });
});
