import { db } from "../config/db.js";

export const getProfile = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const [rows] = await db.query(
      "SELECT university, major, GPA FROM users WHERE id = ?",
      [req.user.id]
    );

    res.json(rows[0] || { university: "", major: "", GPA: "" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { university, major, GPA } = req.body;

    await db.query(
      "UPDATE users SET university = ?, major = ?, GPA = ? WHERE id = ?",
      [university, major, GPA, req.user.id]
    );

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};
