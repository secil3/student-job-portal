// backend/src/__tests__/auth.controller.test.js
import { jest } from "@jest/globals";

// ---- ESM-compatible mocks (must be BEFORE importing the module under test) ----
const dbMock = { query: jest.fn() };
const bcryptMock = { compare: jest.fn(), hash: jest.fn() };
const jwtMock = { sign: jest.fn() };
const sendVerificationEmailMock = jest.fn();

await jest.unstable_mockModule("../config/db.js", () => ({
  default: dbMock
}));

await jest.unstable_mockModule("bcrypt", () => ({
  default: bcryptMock
}));

await jest.unstable_mockModule("jsonwebtoken", () => ({
  default: jwtMock
}));

await jest.unstable_mockModule("../services/email.service.js", () => ({
  sendStudentVerificationEmail: sendVerificationEmailMock,
}));

// Import controller AFTER mocks
const { demoLogin, login, register } = await import("../controllers/auth.controller.js");

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
    delete process.env.DEMO_MODE;
  });

  // ================= LOGIN =================

  test("UT-L1: login success -> returns token and user", async () => {
    const req = { body: { email: " STUDENT@STU.ADU.EDU.TR ", password: "123456" } };
    const res = mockRes();

    dbMock.query.mockResolvedValueOnce([[{
      id: 1,
      email: "student@stu.adu.edu.tr",
      password: "hashedPassword",
      role: "student",
      is_active: 1,
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
      user: { id: 1, email: "student@stu.adu.edu.tr", role: "student" }
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

  test("blocks a valid password for an inactive account", async () => {
    const req = { body: { email: "inactive@stu.adu.edu.tr", password: "123456" } };
    const res = mockRes();

    dbMock.query.mockResolvedValueOnce([[
      {
        id: 9,
        email: "inactive@stu.adu.edu.tr",
        password: "hashedPassword",
        role: "student",
        is_active: 0,
      },
    ]]);
    bcryptMock.compare.mockResolvedValueOnce(true);

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Account is inactive" });
    expect(jwtMock.sign).not.toHaveBeenCalled();
  });

  describe("demo login", () => {
    test.each([
      ["student", "elif.yilmaz@stu.adu.edu.tr", "student", "approved", 1],
      ["employer", "demo@novabyte.com", "employer", "approved", 0],
      ["admin", "admin@digipath.demo", "admin", "approved", 0],
    ])("creates a normal JWT session for the seeded %s account", async (
      account,
      email,
      role,
      status,
      isVerified
    ) => {
      process.env.DEMO_MODE = "true";
      const req = { body: { account } };
      const res = mockRes();

      dbMock.query.mockResolvedValueOnce([[
        { id: 20, email, role, status, is_verified: isVerified, is_active: 1 },
      ]]);
      jwtMock.sign.mockReturnValueOnce("demo-token");

      await demoLogin(req, res);

      expect(dbMock.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE email = ?"),
        [email]
      );
      expect(jwtMock.sign).toHaveBeenCalledWith(
        { id: 20, role },
        "test-secret",
        { expiresIn: "1h" }
      );
      expect(res.json).toHaveBeenCalledWith({
        token: "demo-token",
        user: { id: 20, email, role },
      });
    });

    test("is unavailable when demo mode is disabled", async () => {
      const req = { body: { account: "student" } };
      const res = mockRes();

      await demoLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(jwtMock.sign).not.toHaveBeenCalled();
      expect(dbMock.query).not.toHaveBeenCalled();
    });

    test("does not accept an arbitrary account identifier", async () => {
      process.env.DEMO_MODE = "true";
      const req = { body: { account: "random-user" } };
      const res = mockRes();

      await demoLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(jwtMock.sign).not.toHaveBeenCalled();
      expect(dbMock.query).not.toHaveBeenCalled();
    });

    test("does not create a token when the seeded account is ineligible", async () => {
      process.env.DEMO_MODE = "true";
      const req = { body: { account: "employer" } };
      const res = mockRes();

      dbMock.query.mockResolvedValueOnce([[
        {
          id: 21,
          email: "demo@novabyte.com",
          role: "employer",
          status: "rejected",
          is_verified: 0,
          is_active: 1,
        },
      ]]);

      await demoLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(jwtMock.sign).not.toHaveBeenCalled();
    });
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
    const req = { body: { email: "exists@stu.adu.edu.tr", password: "123456", role: "student" } };
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

  test.each([
    "student@adu.edu.tr",
    "student@stu.adu.edu.tr.evil.example",
    "student@sub.stu.adu.edu.tr",
    "student@example.com",
  ])("rejects a non-ADU student address: %s", async (email) => {
    const req = { body: { email, password: "123456", role: "student" } };
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Students must register with an @stu.adu.edu.tr email address"
    });
    expect(dbMock.query).not.toHaveBeenCalled();
  });

  test("normalizes and accepts an exact ADU student address", async () => {
    const req = {
      body: {
        email: "  Student.Number@STU.ADU.EDU.TR  ",
        password: "123456",
        role: "student",
      },
    };
    const res = mockRes();

    dbMock.query.mockResolvedValueOnce([[]]);
    bcryptMock.hash.mockResolvedValueOnce("hashed-pass");
    dbMock.query.mockResolvedValueOnce([{ insertId: 101 }]);
    sendVerificationEmailMock.mockResolvedValueOnce();

    await register(req, res);

    expect(dbMock.query).toHaveBeenNthCalledWith(
      1,
      "SELECT id FROM users WHERE email = ?",
      ["student.number@stu.adu.edu.tr"]
    );
    expect(dbMock.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("email_verification_token_hash"),
      [
        "student.number@stu.adu.edu.tr",
        "hashed-pass",
        "student",
        "approved",
        expect.stringMatching(/^[a-f0-9]{64}$/),
        expect.any(Date),
      ]
    );
    expect(sendVerificationEmailMock).toHaveBeenCalledWith({
      to: "student.number@stu.adu.edu.tr",
      token: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("does not report registration success when verification email delivery fails", async () => {
    const req = {
      body: {
        email: "student@stu.adu.edu.tr",
        password: "123456",
        role: "student",
      },
    };
    const res = mockRes();
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    dbMock.query.mockResolvedValueOnce([[]]);
    bcryptMock.hash.mockResolvedValueOnce("hashed-pass");
    dbMock.query.mockResolvedValueOnce([{ insertId: 102 }]);
    sendVerificationEmailMock.mockRejectedValueOnce(
      Object.assign(new Error("delivery failed"), { code: "SMTP_FAILURE" })
    );

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({
      code: "STUDENT_VERIFICATION_EMAIL_DELIVERY_FAILED",
      message: "Account created, but the verification email could not be sent. Please request a new email."
    });
    expect(res.status).not.toHaveBeenCalledWith(201);
    consoleErrorSpy.mockRestore();
  });

  test("keeps a database registration failure distinct from email delivery failure", async () => {
    const req = {
      body: {
        email: "student@stu.adu.edu.tr",
        password: "123456",
        role: "student",
      },
    };
    const res = mockRes();
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    dbMock.query.mockResolvedValueOnce([[]]);
    bcryptMock.hash.mockResolvedValueOnce("hashed-pass");
    dbMock.query.mockRejectedValueOnce({ code: "ER_TEST_FAILURE" });

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Register failed" });
    expect(sendVerificationEmailMock).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
