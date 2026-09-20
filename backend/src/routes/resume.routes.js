import express from "express";
import auth from "../middleware/auth.middleware.js";
import roleCheck from "../middleware/role.middleware.js";
import upload, {
  validatePdfSignature,
  handleUploadError
} from "../middleware/upload.middleware.js";
import {
  uploadResume,
  getMyResumes,
  deleteResume,
  renameResume,
  getResumeFile
} from "../controllers/resume.controller.js";

const router = express.Router();

// ✅ UPLOAD (Sprint 1)
router.post(
  "/upload",
  auth,
  roleCheck("student"),
  upload.single("resume"), // 👈 FIELD NAME
  validatePdfSignature,
  uploadResume
);

router.use(handleUploadError);

// LIST (Sprint 3)
router.get("/", auth, roleCheck("student"), getMyResumes);

// Protected file access for the owner student or an authorized employer.
router.get("/:id/file", auth, getResumeFile);

// DELETE
router.delete("/:id", auth, roleCheck("student"), deleteResume);

// RENAME
router.patch("/:id", auth, roleCheck("student"), renameResume);

export default router;
