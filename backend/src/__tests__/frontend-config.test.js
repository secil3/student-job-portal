import { getFrontendUrl } from "../config/frontend.js";

const original = { NODE_ENV: process.env.NODE_ENV, FRONTEND_URL: process.env.FRONTEND_URL };
afterEach(() => {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("development keeps the local frontend default", () => {
  process.env.NODE_ENV = "development";
  delete process.env.FRONTEND_URL;
  expect(getFrontendUrl()).toBe("http://localhost:5173");
});

test("production requires an explicit frontend origin", () => {
  process.env.NODE_ENV = "production";
  delete process.env.FRONTEND_URL;
  expect(getFrontendUrl).toThrow("FRONTEND_URL is required");
});

test("deployment URLs support both reset and verification links", () => {
  process.env.FRONTEND_URL = "https://portal.example.test/";
  expect(getFrontendUrl()).toBe("https://portal.example.test");
  expect(new URL("/reset-password/token", getFrontendUrl()).href)
    .toBe("https://portal.example.test/reset-password/token");
});

test.each(["https://portal.example.test/path", "ftp://portal.example.test", "https://user:pass@portal.example.test"])(
  "rejects invalid frontend origin %s", (value) => {
    process.env.FRONTEND_URL = value;
    expect(getFrontendUrl).toThrow();
  }
);
