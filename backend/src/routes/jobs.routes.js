import express from "express";
import auth from "../middleware/auth.middleware.js";
import {
  createJob,
  getAllJobs,
  getEmployerJobs,
  updateJob,
  deleteJob
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

// DELETE job
router.delete("/:id", auth, deleteJob);

export default router;
