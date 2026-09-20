import db from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
// ================= LOGIN =================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

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

    if (!email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Email, password and role are required" });
    }

    if (!["student", "employer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const [rows] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    // ✅ BURASI DÜZELTİLDİ
    if (rows.length > 0) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const status = role === "employer" ? "pending" : "approved";

    await db.query(
      "INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?)",
      [email, hashedPassword, role, status]
    );

    res.status(201).json({
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: "Register failed" });
  }
};
