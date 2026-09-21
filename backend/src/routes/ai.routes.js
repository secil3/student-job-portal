import express from "express";
import auth from "../middleware/auth.middleware.js";
import {
  createApplicationMessage,
  createInterviewPreparation,
} from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/application-message", auth, createApplicationMessage);
router.post("/interview-prep", auth, createInterviewPreparation);

export default router;
