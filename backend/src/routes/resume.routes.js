import express from "express";
import multer from "multer";
import auth from "../middleware/auth.middleware.js";
import { uploadResume } from "../controllers/resume.controller.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/resumes");
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}-${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.post("/", auth, upload.single("resume"), uploadResume);

export default router;
