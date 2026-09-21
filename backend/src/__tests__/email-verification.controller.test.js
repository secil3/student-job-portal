import { jest } from "@jest/globals";

const dbMock = { query: jest.fn() };

await jest.unstable_mockModule("../config/db.js", () => ({
  default: dbMock,
}));

await jest.unstable_mockModule("bcrypt", () => ({
  default: { compare: jest.fn(), hash: jest.fn() },
}));

await jest.unstable_mockModule("jsonwebtoken", () => ({
  default: { sign: jest.fn() },
}));

const { verifyStudentEmail } = await import("../controllers/auth.controller.js");
const {
  createEmailVerificationToken,
  hashEmailVerificationToken,
} = await import("../services/emailVerification.service.js");

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Student email verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("creates a random token bundle whose stored value is only a hash", () => {
    const now = Date.UTC(2026, 8, 20, 12, 0, 0);
    const bundle = createEmailVerificationToken(now);

    expect(bundle.token).toMatch(/^[a-f0-9]{64}$/);
    expect(bundle.tokenHash).toBe(hashEmailVerificationToken(bundle.token));
    expect(bundle.tokenHash).not.toBe(bundle.token);
    expect(bundle.expiresAt.getTime()).toBeGreaterThan(now);
  });

  test("rejects a malformed token without querying the database", async () => {
    const req = { body: { token: "not-a-token" } };
    const res = mockResponse();

    await verifyStudentEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid or expired verification token",
    });
    expect(dbMock.query).not.toHaveBeenCalled();
  });

  test("rejects an expired token without revealing why it failed", async () => {
    dbMock.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const token = "a".repeat(64);
    const res = mockResponse();

    await verifyStudentEmail({ body: { token } }, res);

    expect(dbMock.query).toHaveBeenCalledWith(
      expect.stringContaining("email_verification_token_expires > CURRENT_TIMESTAMP"),
      [hashEmailVerificationToken(token)]
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid or expired verification token",
    });
  });

  test("verifies a valid token and clears its hash and expiry", async () => {
    dbMock.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const token = "b".repeat(64);
    const res = mockResponse();

    await verifyStudentEmail({ body: { token } }, res);

    expect(dbMock.query).toHaveBeenCalledWith(
      expect.stringContaining("email_verification_token_hash = NULL"),
      [hashEmailVerificationToken(token)]
    );
    expect(res.json).toHaveBeenCalledWith({ message: "Student email verified" });
  });

  test("rejects a token that has already been used", async () => {
    dbMock.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = mockResponse();

    await verifyStudentEmail({ body: { token: "c".repeat(64) } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid or expired verification token",
    });
  });
});
