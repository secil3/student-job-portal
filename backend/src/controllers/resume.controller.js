import db, { getDB } from "../config/db.js";
import path from "path";
import fs from "node:fs/promises";
import { removeUploadedFile } from "../middleware/upload.middleware.js";

const uploadsDirectory = path.resolve(process.cwd(), "uploads");
const MAX_RESUME_NAME_LENGTH = 255;

const resolveStoredResumePath = (storedPath) => {
  const prefix = "/uploads/";

  if (typeof storedPath !== "string" || !storedPath.startsWith(prefix)) {
    return null;
  }

  const relativePath = storedPath.slice(prefix.length);
  const absolutePath = path.resolve(uploadsDirectory, relativePath);

  if (
    !relativePath ||
    !absolutePath.startsWith(`${uploadsDirectory}${path.sep}`)
  ) {
    return null;
  }

  return absolutePath;
};

// upload resume 
export const uploadResume = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    await db.query(
      "INSERT INTO resumes (user_id, name, file_path) VALUES (?, ?, ?)",
      [
        req.user.id,
        req.file.originalname,
        `/uploads/${req.file.filename}`
      ]
    );

    return res.status(201).json({ message: "Resume uploaded" });
  } catch (error) {
    await removeUploadedFile(req.file.path);
    console.error("RESUME UPLOAD ERROR:", error.code || error.name);
    return res.status(500).json({ message: "Resume could not be saved" });
  }
};

// List resumes (student)
export const getMyResumes = async (req, res) => {
  const [rows] = await db.query(
    "SELECT id, name, file_path FROM resumes WHERE user_id=?",
    [req.user.id]
  );
  res.json(rows);
};

// Delete resume
export const deleteResume = async (req, res) => {
  let connection;
  let transactionStarted = false;

  try {
    connection = await getDB();
    await connection.beginTransaction();
    transactionStarted = true;

    const [resumes] = await connection.query(
      "SELECT id, user_id, file_path FROM resumes WHERE id = ? FOR UPDATE",
      [req.params.id]
    );

    if (resumes.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Resume not found" });
    }

    const resume = resumes[0];

    if (resume.user_id !== req.user.id) {
      await connection.rollback();
      return res.status(403).json({ message: "Forbidden" });
    }

    const [applications] = await connection.query(
      "SELECT id FROM applications WHERE resume_id = ? LIMIT 1",
      [resume.id]
    );

    if (applications.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        message: "This resume cannot be deleted because it is used in an application"
      });
    }

    const absolutePath = resolveStoredResumePath(resume.file_path);

    if (!absolutePath) {
      await connection.rollback();
      return res.status(403).json({ message: "Invalid resume path" });
    }

    await connection.query(
      "DELETE FROM resumes WHERE id = ? AND user_id = ?",
      [resume.id, req.user.id]
    );

    try {
      await fs.unlink(absolutePath);
    } catch (error) {
      await connection.rollback();
      const status = error.code === "ENOENT" ? 404 : 500;
      return res.status(status).json({
        message: status === 404
          ? "Resume file not found; no record was deleted"
          : "Resume file could not be deleted; no record was deleted"
      });
    }

    await connection.commit();
    transactionStarted = false;
    return res.json({ message: "Resume deleted" });
  } catch (error) {
    if (transactionStarted && connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("RESUME DELETE ROLLBACK ERROR:", rollbackError.code || rollbackError.name);
      }
    }

    console.error("RESUME DELETE ERROR:", error.code || error.name);
    return res.status(500).json({ message: "Resume could not be deleted" });
  }
};

// Rename resume
export const renameResume = async (req, res) => {
  const name = req.body?.name;

  if (typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ message: "Resume name is required" });
  }

  const trimmedName = name.trim();

  if (trimmedName.length > MAX_RESUME_NAME_LENGTH) {
    return res.status(400).json({
      message: `Resume name must be ${MAX_RESUME_NAME_LENGTH} characters or fewer`
    });
  }

  try {
    const [result] = await db.query(
      "UPDATE resumes SET name=? WHERE id=? AND user_id=?",
      [trimmedName, req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Resume not found" });
    }

    return res.json({ message: "Resume renamed" });
  } catch (error) {
    console.error("RESUME RENAME ERROR:", error.code || error.name);
    return res.status(500).json({ message: "Resume could not be renamed" });
  }
};

export const getResumeFile = async (req, res) => {
  try {
    const [resumes] = await db.query(
      "SELECT id, user_id, file_path FROM resumes WHERE id = ?",
      [req.params.id]
    );

    if (resumes.length === 0) {
      return res.status(404).json({ message: "Resume not found" });
    }

    const resume = resumes[0];

    if (req.user.role === "student") {
      if (resume.user_id !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
    } else if (req.user.role === "employer") {
      const [authorizedApplications] = await db.query(
        `SELECT a.id
         FROM applications a
         JOIN jobs j ON j.id = a.job_id
         WHERE a.resume_id = ? AND j.employer_id = ?
         LIMIT 1`,
        [resume.id, req.user.id]
      );

      if (authorizedApplications.length === 0) {
        return res.status(403).json({ message: "Forbidden" });
      }
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }

    const absolutePath = resolveStoredResumePath(resume.file_path);

    if (!absolutePath) {
      return res.status(403).json({ message: "Invalid resume path" });
    }

    return res.sendFile(absolutePath, (error) => {
      if (!error || res.headersSent) return;

      const status = error.code === "ENOENT" ? 404 : 500;
      res.status(status).json({
        message: status === 404 ? "Resume file not found" : "Failed to open resume"
      });
    });
  } catch (error) {
    console.error("RESUME FILE ERROR:", error.code || error.name);
    return res.status(500).json({ message: "Failed to open resume" });
  }
};
