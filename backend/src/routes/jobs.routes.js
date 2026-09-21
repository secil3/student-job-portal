import express from "express";
import auth from "../middleware/auth.middleware.js";
import {
  createJob,
  getAllJobs,
  getEmployerJobs,
  updateJob,
  updateJobActivation
} from "../controllers/jobs.controller.js";

const router = express.Router();

// STUDENT – job list
router.get("/", auth, getAllJobs);

// EMPLOYER – create job
router.post("/", auth, createJob);

// EMPLOYER – own jobs
router.get("/employer", auth, getEmployerJobs);

// EMPLOYER – update own job
router.put("/:id", auth, updateJob);

// ADMIN / EMPLOYER – deactivate or reactivate a job
router.patch("/:id/activation", auth, updateJobActivation);

export default router;
