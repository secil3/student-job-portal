import crypto from "node:crypto";

export const STUDENT_EMAIL_DOMAIN = "stu.adu.edu.tr";
export const EMAIL_VERIFICATION_TTL_MS = 30 * 60 * 1000;

export const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

export const isAduStudentEmail = (email) => {
  const normalized = normalizeEmail(email);
  const parts = normalized.split("@");

  return parts.length === 2
    && parts[0].length > 0
    && !/\s/.test(parts[0])
    && parts[1] === STUDENT_EMAIL_DOMAIN;
};

export const hashEmailVerificationToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const createEmailVerificationToken = (now = Date.now()) => {
  const token = crypto.randomBytes(32).toString("hex");

  return {
    token,
    tokenHash: hashEmailVerificationToken(token),
    expiresAt: new Date(now + EMAIL_VERIFICATION_TTL_MS),
  };
};

export const isVerificationTokenFormatValid = (token) =>
  typeof token === "string" && /^[a-f0-9]{64}$/i.test(token);
