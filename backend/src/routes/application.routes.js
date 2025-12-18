import express from "express";
import auth from "../middleware/auth.middleware.js";
import {
  applyToJob,
  getEmployerApplications,
  updateApplicationStatus
} from "../controllers/application.controller.js";

const router = express.Router();

/* ROLE CHECK MIDDLEWARE */
const roleCheck = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

/* ROUTES */

// Student → Apply to Job
router.post("/", auth, roleCheck("student"), applyToJob);

// Employer → View Applications
router.get("/employer", auth, roleCheck("employer"), getEmployerApplications);

// Employer → Accept / Reject
router.patch("/:id", auth, roleCheck("employer"), updateApplicationStatus);

export default router;
