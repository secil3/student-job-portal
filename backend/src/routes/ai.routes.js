import express from "express";
import auth from "../middleware/auth.middleware.js";
import { createApplicationMessage } from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/application-message", auth, createApplicationMessage);

export default router;
