import { db } from "../config/db.js";

export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const resumePath = req.file.path;

    await db
      .promise()
      .query(
        "UPDATE users SET resume_path = ? WHERE id = ?",
        [resumePath, req.user.id]
      );

    res.json({
      message: "Resume uploaded successfully 📄",
      path: resumePath,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Upload failed" });
  }
};
