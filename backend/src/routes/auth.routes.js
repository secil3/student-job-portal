import express from "express";
import authController from "../controllers/auth.controller.js";

const router = express.Router();

// LOGIN
router.post("/login", authController.login);

// REGISTER
router.post("/register-student", authController.registerStudent);
router.post("/register-employer", authController.registerEmployer);

export default router;
