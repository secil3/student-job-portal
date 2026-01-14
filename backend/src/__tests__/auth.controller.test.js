// backend/src/__tests__/auth.controller.test.js
import { jest } from "@jest/globals";

// ---- ESM-compatible mocks (must be BEFORE importing the module under test) ----
const dbMock = { query: jest.fn() };
const bcryptMock = { compare: jest.fn(), hash: jest.fn() };
const jwtMock = { sign: jest.fn() };

await jest.unstable_mockModule("../config/db.js", () => ({
  default: dbMock
}));

await jest.unstable_mockModule("bcrypt", () => ({
  default: bcryptMock
}));

await jest.unstable_mockModule("jsonwebtoken", () => ({
  default: jwtMock
}));

// Import controller AFTER mocks
const { login, register } = await import("../controllers/auth.controller.js");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("UC-01 Authentication (MVP) - Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
  });

  // ================= LOGIN =================

  test("UT-L1: login success -> returns token and user", async () => {
    const req = { body: { email: "student@test.com", password: "123456" } };
    const res = mockRes();

    dbMock.query.mockResolvedValueOnce([[{
      id: 1,
      email: "student@test.com",
      password: "hashedPassword",
      role: "student"
    }]]);

    bcryptMock.compare.mockResolvedValueOnce(true);
    jwtMock.sign.mockReturnValueOnce("fake-token");

    await login(req, res);

    expect(jwtMock.sign).toHaveBeenCalledWith(
      { id: 1, role: "student" },
      "test-secret",
      { expiresIn: "1h" }
    );

    expect(res.json).toHaveBeenCalledWith({
      token: "fake-token",
      user: { id: 1, email: "student@test.com", role: "student" }
    });
  });

  test("UT-L2: user not found -> returns 401 Invalid credentials", async () => {
    const req = { body: { email: "nouser@test.com", password: "123456" } };
    const res = mockRes();

    dbMock.query.mockResolvedValueOnce([[]]);

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
  });

  test("UT-L3: wrong password -> returns 401 Invalid credentials", async () => {
    const req = { body: { email: "student@test.com", password: "wrong" } };
    const res = mockRes();

    dbMock.query.mockResolvedValueOnce([[{
      id: 1,
      email: "student@test.com",
      password: "hashedPassword",
      role: "student"
    }]]);

    bcryptMock.compare.mockResolvedValueOnce(false);

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
  });

  // ================= REGISTER =================

  test("UT-R1: missing fields -> returns 400", async () => {
    const req = { body: { email: "", password: "", role: "" } };
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Email, password and role are required"
    });
  });

  test("UT-R2: invalid role -> returns 400 Invalid role", async () => {
    const req = { body: { email: "a@a.com", password: "123456", role: "admin" } };
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid role" });
  });

  test("UT-R3: email already exists -> returns 409", async () => {
    const req = { body: { email: "exists@test.com", password: "123456", role: "student" } };
    const res = mockRes();

    dbMock.query.mockResolvedValueOnce([[{ id: 7 }]]);

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: "Email already exists" });
  });

  test("UT-R4: register success (employer) -> inserts pending user and returns 201", async () => {
    const req = { body: { email: "new@test.com", password: "123456", role: "employer" } };
    const res = mockRes();

    dbMock.query.mockResolvedValueOnce([[]]); // email check: not found
    bcryptMock.hash.mockResolvedValueOnce("hashed-pass");
    dbMock.query.mockResolvedValueOnce([{ insertId: 100 }]); // insert

    await register(req, res);

    expect(dbMock.query).toHaveBeenCalledWith(
      "INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?)",
      ["new@test.com", "hashed-pass", "employer", "pending"]
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: "User registered successfully" });
  });
});
