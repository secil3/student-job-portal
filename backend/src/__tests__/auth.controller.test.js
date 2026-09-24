// backend/src/__tests__/auth.controller.test.js
import { jest } from "@jest/globals";

// ---- ESM-compatible mocks (must be BEFORE importing the module under test) ----
const dbMock = { query: jest.fn() };
const connectionMock = {
  query: jest.fn(),
  beginTransaction: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn(),
};
const getDBMock = jest.fn();
const bcryptMock = { compare: jest.fn(), hash: jest.fn() };
const jwtMock = { sign: jest.fn() };
const sendVerificationEmailMock = jest.fn();

await jest.unstable_mockModule("../config/db.js", () => ({
  default: dbMock,
  getDB: getDBMock,
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
    getDBMock.mockResolvedValue(connectionMock);
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
      full_name: "Test Student",
      company_name: null,
    }]]);

    bcryptMock.compare.mockResolvedValueOnce(true);
    jwtMock.sign.mockReturnValueOnce("fake-token");

    await login(req, res);

    expect(jwtMock.sign).toHaveBeenCalledWith(
      { id: 1, role: "student" },
      "test-secret",
      { expiresIn: "1h" }
    );
    expect(dbMock.query.mock.calls[0][0]).toContain(
      "LEFT JOIN company_profiles ON company_profiles.user_id = users.id"
    );

    expect(res.json).toHaveBeenCalledWith({
      token: "fake-token",
      user: {
        id: 1,
        email: "student@stu.adu.edu.tr",
        role: "student",
        full_name: "Test Student",
        company_name: null,
      }
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
        {
          id: 20,
          email,
          role,
          status,
          is_verified: isVerified,
          is_active: 1,
          full_name: role === "student" ? "Demo Student" : null,
          company_name: role === "employer" ? "Demo Company" : null,
        },
      ]]);
      jwtMock.sign.mockReturnValueOnce("demo-token");

      await demoLogin(req, res);

      expect(dbMock.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE users.email = ?"),
        [email]
      );
      expect(jwtMock.sign).toHaveBeenCalledWith(
        { id: 20, role },
        "test-secret",
        { expiresIn: "1h" }
      );
      expect(res.json).toHaveBeenCalledWith({
        token: "demo-token",
        user: {
          id: 20,
          email,
          role,
          full_name: role === "student" ? "Demo Student" : null,
          company_name: role === "employer" ? "Demo Company" : null,
        },
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

  test("login keeps a legacy employer without a company profile usable", async () => {
    const req = { body: { email: "legacy@example.com", password: "123456" } };
    const res = mockRes();

    dbMock.query.mockResolvedValueOnce([[
      {
        id: 8,
        email: "legacy@example.com",
        password: "hashedPassword",
        role: "employer",
        is_active: 1,
        full_name: null,
        company_name: null,
      },
    ]]);
    bcryptMock.compare.mockResolvedValueOnce(true);
    jwtMock.sign.mockReturnValueOnce("legacy-token");

    await login(req, res);

    expect(res.json).toHaveBeenCalledWith({
      token: "legacy-token",
      user: {
        id: 8,
        email: "legacy@example.com",
        role: "employer",
        full_name: null,
        company_name: null,
      },
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
    const req = {
      body: {
        email: "exists@stu.adu.edu.tr",
        password: "123456",
        role: "student",
        fullName: "Existing Student",
      },
    };
    const res = mockRes();

    dbMock.query.mockResolvedValueOnce([[{ id: 7 }]]);

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: "Email already exists" });
  });

  test("UT-R4: register success (employer) -> inserts pending user and returns 201", async () => {
    const req = {
      body: {
        email: "new@test.com",
        password: "123456",
        role: "employer",
        fullName: "  Employer Person  ",
        companyName: "  Example Company  ",
      },
    };
    const res = mockRes();

    dbMock.query.mockResolvedValueOnce([[]]); // email check: not found
    bcryptMock.hash.mockResolvedValueOnce("hashed-pass");
    connectionMock.query
      .mockResolvedValueOnce([{ insertId: 100 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await register(req, res);

    expect(connectionMock.beginTransaction).toHaveBeenCalledTimes(1);
    expect(connectionMock.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("(email, full_name, password, role, status)"),
      [
        "new@test.com",
        "Employer Person",
        "hashed-pass",
        "employer",
        "pending",
      ]
    );
    expect(connectionMock.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("INSERT INTO company_profiles"),
      [100, "Example Company"]
    );
    expect(connectionMock.commit).toHaveBeenCalledTimes(1);
    expect(connectionMock.rollback).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: "User registered successfully" });
  });

  test("rolls back employer registration when company profile creation fails", async () => {
    const req = {
      body: {
        email: "new@test.com",
        password: "123456",
        role: "employer",
        fullName: "Employer Person",
        companyName: "Example Company",
      },
    };
    const res = mockRes();
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    dbMock.query.mockResolvedValueOnce([[]]);
    bcryptMock.hash.mockResolvedValueOnce("hashed-pass");
    connectionMock.query
      .mockResolvedValueOnce([{ insertId: 100 }])
      .mockRejectedValueOnce({ code: "ER_TEST_FAILURE" });

    await register(req, res);

    expect(connectionMock.beginTransaction).toHaveBeenCalledTimes(1);
    expect(connectionMock.rollback).toHaveBeenCalledTimes(1);
    expect(connectionMock.commit).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Register failed" });
    consoleErrorSpy.mockRestore();
  });

  test.each([
    "student@adu.edu.tr",
    "student@stu.adu.edu.tr.evil.example",
    "student@sub.stu.adu.edu.tr",
    "student@example.com",
  ])("rejects a non-ADU student address: %s", async (email) => {
    const req = {
      body: { email, password: "123456", role: "student", fullName: "Test Student" },
    };
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
        fullName: "  Student Name  ",
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
        "Student Name",
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
        fullName: "Test Student",
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
        fullName: "Test Student",
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

  test.each([
    ["student", "", undefined, "Full name is required"],
    ["student", " ", undefined, "Full name is required"],
    ["student", "x".repeat(151), undefined, "Full name must be at most 150 characters"],
    ["employer", "Employer Person", "", "Company name is required"],
    ["employer", "Employer Person", " ", "Company name is required"],
    ["employer", "Employer Person", "x".repeat(256), "Company name must be at most 255 characters"],
  ])("validates registration identity fields for %s", async (
    role,
    fullName,
    companyName,
    expectedMessage
  ) => {
    const req = {
      body: {
        email: role === "student" ? "student@stu.adu.edu.tr" : "employer@example.com",
        password: "123456",
        role,
        fullName,
        companyName,
      },
    };
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: expectedMessage });
    expect(dbMock.query).not.toHaveBeenCalled();
  });
});
