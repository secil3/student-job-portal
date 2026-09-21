import { jest } from "@jest/globals";

const sendMailMock = jest.fn();
const createTransportMock = jest.fn(() => ({ sendMail: sendMailMock }));

await jest.unstable_mockModule("nodemailer", () => ({
  default: { createTransport: createTransportMock },
}));

const {
  resetEmailTransportForTests,
  sendStudentVerificationEmail,
} = await import("../services/email.service.js");

describe("Gmail SMTP verification email", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetEmailTransportForTests();
    process.env.SMTP_USER = "sender@example.test";
    process.env.SMTP_APP_PASSWORD = "test-only-password";
    process.env.EMAIL_FROM = "StudentJob <sender@example.test>";
    process.env.FRONTEND_URL = "http://localhost:5173";
    process.env.SMTP_HOST = "smtp.gmail.com";
    process.env.SMTP_PORT = "465";
    sendMailMock.mockResolvedValue({ messageId: "mock-message" });
  });

  test("uses an authenticated TLS transport and sends a fragment-based link", async () => {
    const token = "a".repeat(64);

    await sendStudentVerificationEmail({
      to: "student@stu.adu.edu.tr",
      token,
    });

    expect(createTransportMock).toHaveBeenCalledWith(expect.objectContaining({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      tls: expect.objectContaining({
        minVersion: "TLSv1.2",
        rejectUnauthorized: true,
      }),
    }));
    expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({
      to: "student@stu.adu.edu.tr",
      subject: expect.stringContaining("Verify"),
      text: expect.stringContaining(`/verify-email#token=${token}`),
    }));
  });

  test("fails before creating a transport when configuration is missing", async () => {
    delete process.env.SMTP_APP_PASSWORD;

    await expect(sendStudentVerificationEmail({
      to: "student@stu.adu.edu.tr",
      token: "b".repeat(64),
    })).rejects.toMatchObject({ code: "EMAIL_NOT_CONFIGURED" });

    expect(createTransportMock).not.toHaveBeenCalled();
    expect(sendMailMock).not.toHaveBeenCalled();
  });
});
