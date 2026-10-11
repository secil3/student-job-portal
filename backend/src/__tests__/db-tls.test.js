import { jest } from "@jest/globals";

const readFileSync = jest.fn();
const createConnection = jest.fn();
await jest.unstable_mockModule("node:fs", () => ({ readFileSync }));
await jest.unstable_mockModule("mysql2/promise", () => ({ default: { createConnection } }));
const keys = ["DB_SSL", "DB_SSL_CA", "DB_SSL_CA_PATH"];
const original = Object.fromEntries(keys.map(key => [key, process.env[key]]));

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  for (const key of keys) delete process.env[key];
  createConnection.mockResolvedValue({ query: jest.fn() });
});
afterEach(() => {
  for (const key of keys) {
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  }
});
const connect = async () => (await import("../config/db.js")).getDB();

test("local non-TLS connection does not read a certificate", async () => {
  process.env.DB_SSL_CA_PATH = "missing.pem";
  await connect();
  expect(readFileSync).not.toHaveBeenCalled();
  expect(createConnection.mock.calls[0][0]).not.toHaveProperty("ssl");
});
test("file CA takes precedence and keeps certificate verification enabled", async () => {
  process.env.DB_SSL = "true";
  process.env.DB_SSL_CA_PATH = "./certs/aiven-ca.pem";
  process.env.DB_SSL_CA = "unused-inline-fixture";
  readFileSync.mockReturnValue("file-ca-fixture");
  await connect();
  expect(readFileSync).toHaveBeenCalledWith("./certs/aiven-ca.pem", "utf8");
  expect(createConnection.mock.calls[0][0].ssl).toEqual({ca: "file-ca-fixture", rejectUnauthorized: true});
});
test("inline CA still expands escaped newlines", async () => {
  process.env.DB_SSL = "true";
  process.env.DB_SSL_CA = "first\\nsecond";
  await connect();
  expect(createConnection.mock.calls[0][0].ssl).toEqual({ca: "first\nsecond", rejectUnauthorized: true});
  expect(readFileSync).not.toHaveBeenCalled();
});
test("missing CA file fails before connecting instead of falling back", async () => {
  process.env.DB_SSL = "true";
  process.env.DB_SSL_CA_PATH = "missing.pem";
  process.env.DB_SSL_CA = "inline-fixture";
  readFileSync.mockImplementation(() => { throw Object.assign(new Error("missing file"), { code: "ENOENT" }); });
  await expect(connect()).rejects.toMatchObject({code: "ENOENT"});
  expect(createConnection).not.toHaveBeenCalled();
});
test("TLS without a custom CA still verifies certificates", async () => {
  process.env.DB_SSL = "true";
  await connect();
  expect(createConnection.mock.calls[0][0].ssl).toEqual({rejectUnauthorized: true});
});
