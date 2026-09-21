import express from "express";
import auth from "../middleware/auth.middleware.js";
import roleCheck from "../middleware/role.middleware.js";
import {
  getPendingEmployers,
  updateEmployerStatus,
  updateUserActivation,
  getAllUsers,
  getAdminDashboard
} from "../controllers/admin.controller.js";

const router = express.Router();

/*
  VERIFY EMPLOYERS
  US-5.1.1
*/

// pending employer list (ADMIN)
router.get(
  "/employers/pending",
  auth,
  roleCheck("admin"),
  getPendingEmployers
);

// approve / reject employer (ADMIN)
router.patch(
  "/employers/:id",
  auth,
  roleCheck("admin"),
  updateEmployerStatus
);

router.patch(
  "/users/:id/activation",
  auth,
  roleCheck("admin"),
  updateUserActivation
);

// admin dashboard
router.get(
  "/dashboard",
  auth,
  roleCheck("admin"),
  getAdminDashboard
);
// view all users (ADMIN)
router.get(
  "/users",
  auth,
  roleCheck("admin"),
  getAllUsers
);

export default router;
