import express from "express";
import multer from "multer";
import auth from "../middleware/auth.middleware.js";

const router = express.Router();

const upload = multer({
  dest: "uploads/"
});

router.post("/upload", auth, upload.single("resume"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  res.json({ message: "Resume uploaded successfully" });
});

export default router;
