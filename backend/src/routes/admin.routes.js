import express from "express";
import auth from "../middleware/auth.middleware.js";
import {
    getPendingEmployers,
    updateEmployerStatus
  } from "../controllers/admin.controller.js";
  import { getAdminDashboard } from "../controllers/admin.controller.js";

const router = express.Router();
//verify employers
router.get("/employers", auth, getPendingEmployers);
router.patch("/employers/:id", auth, updateEmployerStatus);

// sadece admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

// pending employer list
router.get("/pending-employers", auth, isAdmin, async (req, res) => {
  const [rows] = await req.db.query(
    "SELECT id, email FROM users WHERE role='employer' AND status='pending'"
  );
  res.json(rows);
});

// approve / reject
router.patch("/employers/:id", auth, isAdmin, async (req, res) => {
  const { status } = req.body; // approved | rejected
  await req.db.query(
    "UPDATE users SET status=? WHERE id=?",
    [status, req.params.id]
  );
  res.json({ message: "Employer updated" });
});
//admin dashboard
router.get("/dashboard", auth, getAdminDashboard);


export default router;
