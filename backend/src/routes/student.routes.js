import express from "express";
import auth from "../middleware/auth.middleware.js";
import { getProfile, updateProfile } from "../controllers/student.controller.js";

const router = express.Router();

// sadece student
router.get("/profile", auth, getProfile);
router.put("/profile", auth, updateProfile);

export default router;
