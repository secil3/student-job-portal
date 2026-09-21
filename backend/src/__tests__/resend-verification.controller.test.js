import { jest } from "@jest/globals";

const dbMock = { query: jest.fn() };
const sendVerificationEmailMock = jest.fn();

await jest.unstable_mockModule("../config/db.js", () => ({
  default: dbMock,
}));

await jest.unstable_mockModule("bcrypt", () => ({
  default: { compare: jest.fn(), hash: jest.fn() },
}));

await jest.unstable_mockModule("jsonwebtoken", () => ({
  default: { sign: jest.fn() },
}));

await jest.unstable_mockModule("../services/email.service.js", () => ({
  sendStudentVerificationEmail: sendVerificationEmailMock,
}));

const { resendStudentVerification } = await import("../controllers/auth.controller.js");
const { resetVerificationRateLimitsForTests } = await import(
  "../services/verificationRateLimit.service.js"
);

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Resend student verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetVerificationRateLimitsForTests();
  });

  test("returns the same generic response for an unknown account", async () => {
    dbMock.query.mockResolvedValueOnce([[]]);
    const res = mockResponse();

    await resendStudentVerification({ body: { email: "unknown@stu.adu.edu.tr" } }, res);

    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({
      message: "If an unverified ADU student account exists, a verification email will be sent.",
    });
    expect(sendVerificationEmailMock).not.toHaveBeenCalled();
  });

  test("returns the generic response without querying for a non-ADU address", async () => {
    const res = mockResponse();

    await resendStudentVerification({ body: { email: "person@example.com" } }, res);

    expect(res.status).toHaveBeenCalledWith(202);
    expect(dbMock.query).not.toHaveBeenCalled();
    expect(sendVerificationEmailMock).not.toHaveBeenCalled();
  });

  test("stores a new hash and sends a new token for an unverified student", async () => {
    dbMock.query
      .mockResolvedValueOnce([[
        { id: 5, email: "student@stu.adu.edu.tr", role: "student", is_verified: 0 },
      ]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
    sendVerificationEmailMock.mockResolvedValueOnce();
    const res = mockResponse();

    await resendStudentVerification({ body: { email: "student@stu.adu.edu.tr" } }, res);

    expect(dbMock.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("email_verification_token_hash = ?"),
      [expect.stringMatching(/^[a-f0-9]{64}$/), expect.any(Date), 5]
    );
    expect(sendVerificationEmailMock).toHaveBeenCalledWith({
      to: "student@stu.adu.edu.tr",
      token: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(res.status).toHaveBeenCalledWith(202);
  });

  test("rate limits repeated requests", async () => {
    dbMock.query.mockResolvedValue([[]]);

    for (let count = 0; count < 3; count += 1) {
      await resendStudentVerification(
        { body: { email: "student@stu.adu.edu.tr" } },
        mockResponse()
      );
    }

    const limitedResponse = mockResponse();
    await resendStudentVerification(
      { body: { email: "student@stu.adu.edu.tr" } },
      limitedResponse
    );

    expect(limitedResponse.status).toHaveBeenCalledWith(429);
  });
});
