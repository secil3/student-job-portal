import db from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import {
  createEmailVerificationToken,
  hashEmailVerificationToken,
  isAduStudentEmail,
  isVerificationTokenFormatValid,
  normalizeEmail
} from "../services/emailVerification.service.js";
import { sendStudentVerificationEmail } from "../services/email.service.js";
import { consumeVerificationRequest } from "../services/verificationRateLimit.service.js";
// ================= LOGIN =================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [normalizedEmail]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("🔥 LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const [users] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 dk

    await db.query(
      "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?",
      [token, expires, email]
    );


    // Mail atmak yerine linki dönüyoruz (ders için yeterli)
    res.json({
      message: "Password reset link generated",
      resetLink: `http://localhost:5173/reset-password/${token}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

//reset password
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const [users] = await db.query(
      "SELECT id, reset_token_expires FROM users WHERE reset_token = ?",
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: "Invalid token" });
    }

    const user = users[0];

    if (new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ message: "Token expired" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      `UPDATE users 
       SET password = ?, reset_token = NULL, reset_token_expires = NULL 
       WHERE id = ?`,
      [hashedPassword, user.id]
    );

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const register = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password || !role) {
      return res
        .status(400)
        .json({ message: "Email, password and role are required" });
    }

    if (!["student", "employer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (role === "student" && !isAduStudentEmail(normalizedEmail)) {
      return res.status(400).json({
        message: "Students must register with an @stu.adu.edu.tr email address"
      });
    }

    const [rows] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [normalizedEmail]
    );

    // ✅ BURASI DÜZELTİLDİ
    if (rows.length > 0) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const status = role === "employer" ? "pending" : "approved";

    if (role === "student") {
      const { token, tokenHash, expiresAt } = createEmailVerificationToken();

      await db.query(
        `INSERT INTO users
         (email, password, role, status, is_verified,
          email_verification_token_hash, email_verification_token_expires)
         VALUES (?, ?, ?, ?, 0, ?, ?)`,
        [normalizedEmail, hashedPassword, role, status, tokenHash, expiresAt]
      );

      try {
        await sendStudentVerificationEmail({ to: normalizedEmail, token });
      } catch (emailError) {
        console.error("VERIFICATION EMAIL ERROR:", emailError.code || emailError.name);
        return res.status(502).json({
          message: "Account created, but the verification email could not be sent. Please request a new email."
        });
      }
    } else {
      await db.query(
        "INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?)",
        [normalizedEmail, hashedPassword, role, status]
      );
    }

    res.status(201).json({
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: "Register failed" });
  }
};

export const resendStudentVerification = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const genericMessage = "If an unverified ADU student account exists, a verification email will be sent.";

  if (!email || !consumeVerificationRequest(email)) {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    return res.status(429).json({ message: "Too many verification requests. Please try again later." });
  }

  if (!isAduStudentEmail(email)) {
    return res.status(202).json({ message: genericMessage });
  }

  try {
    const [users] = await db.query(
      "SELECT id, email, role, is_verified FROM users WHERE email = ?",
      [email]
    );

    if (
      users.length === 0
      || users[0].role !== "student"
      || Number(users[0].is_verified) === 1
    ) {
      return res.status(202).json({ message: genericMessage });
    }

    const { token, tokenHash, expiresAt } = createEmailVerificationToken();
    const [result] = await db.query(
      `UPDATE users
       SET email_verification_token_hash = ?,
           email_verification_token_expires = ?
       WHERE id = ? AND role = 'student' AND is_verified = 0`,
      [tokenHash, expiresAt, users[0].id]
    );

    if (result.affectedRows !== 1) {
      return res.status(202).json({ message: genericMessage });
    }

    await sendStudentVerificationEmail({ to: users[0].email, token });
    return res.status(202).json({ message: genericMessage });
  } catch (error) {
    console.error("RESEND VERIFICATION ERROR:", error.code || error.name);
    return res.status(503).json({ message: "Verification request could not be completed right now" });
  }
};

export const verifyStudentEmail = async (req, res) => {
  const token = req.body?.token;

  if (!isVerificationTokenFormatValid(token)) {
    return res.status(400).json({ message: "Invalid or expired verification token" });
  }

  try {
    const tokenHash = hashEmailVerificationToken(token);
    const [result] = await db.query(
      `UPDATE users
       SET is_verified = 1,
           email_verification_token_hash = NULL,
           email_verification_token_expires = NULL
       WHERE role = 'student'
         AND is_verified = 0
         AND email_verification_token_hash = ?
         AND email_verification_token_expires > CURRENT_TIMESTAMP`,
      [tokenHash]
    );

    if (result.affectedRows !== 1) {
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }

    return res.json({ message: "Student email verified" });
  } catch (error) {
    console.error("EMAIL VERIFICATION ERROR:", error.code || error.name);
    return res.status(500).json({ message: "Email verification failed" });
  }
};
