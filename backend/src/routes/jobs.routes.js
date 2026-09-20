import express from "express";
import auth from "../middleware/auth.middleware.js";
import {
  createJob,
  getAllJobs,
  getEmployerJobs,
  deleteJob
} from "../controllers/jobs.controller.js";

const router = express.Router();

// STUDENT – job list
router.get("/", auth, getAllJobs);

// EMPLOYER – create job
router.post("/", auth, createJob);

// EMPLOYER – own jobs
router.get("/employer", auth, getEmployerJobs);

// DELETE job
router.delete("/:id", auth, deleteJob);

export default router;
