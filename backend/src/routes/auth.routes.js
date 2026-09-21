import express from "express";
import {
  login,
  register,
  resendStudentVerification,
  verifyStudentEmail
} from "../controllers/auth.controller.js";
import { forgotPassword, resetPassword } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/verify-email", verifyStudentEmail);
router.post("/resend-verification", resendStudentVerification);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
