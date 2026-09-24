import db from "../config/db.js";

// GET pending employers
export const getPendingEmployers = async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.id, u.email, u.full_name, cp.company_name
     FROM users u
     LEFT JOIN company_profiles cp ON cp.user_id = u.id
     WHERE u.role = 'employer' AND u.status = 'pending'`
  );

  res.json(rows);
};

// PATCH approve / reject employer
export const updateEmployerStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const [users] = await db.query(
      "SELECT role FROM users WHERE id = ?",
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    if (users[0].role !== "employer") {
      return res.status(403).json({
        message: "Only employer accounts can be approved or rejected",
      });
    }

    const [result] = await db.query(
      "UPDATE users SET status = ? WHERE id = ? AND role = 'employer'",
      [status, id]
    );

    if (result.affectedRows !== 1) {
      return res.status(409).json({
        message: "Employer status could not be updated",
      });
    }

    return res.json({ message: "Employer status updated successfully" });
  } catch (error) {
    console.error("updateEmployerStatus error:", error.code || error.name);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateUserActivation = async (req, res) => {
  try {
    const actorId = req.user?.id;
    const targetId = req.params.id;
    const { isActive } = req.body ?? {};

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be boolean" });
    }

    const [actors] = await db.query(
      "SELECT role, is_active FROM users WHERE id = ?",
      [actorId]
    );

    if (actors.length === 0) {
      return res.status(401).json({ message: "User account not found" });
    }

    if (actors[0].role !== "admin" || Number(actors[0].is_active) !== 1) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const [targets] = await db.query(
      "SELECT id, role, is_active FROM users WHERE id = ?",
      [targetId]
    );

    if (targets.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!isActive && Number(targetId) === Number(actorId)) {
      return res.status(403).json({ message: "You cannot deactivate your own account" });
    }

    const requestedValue = isActive ? 1 : 0;
    if (Number(targets[0].is_active) === requestedValue) {
      return res.json({
        message: isActive ? "User is already active" : "User is already inactive",
      });
    }

    const [result] = await db.query(
      `UPDATE users AS target
       JOIN users AS actor
         ON actor.id = ? AND actor.role = 'admin' AND actor.is_active = 1
       SET target.is_active = ?,
           target.deactivated_at = CASE
             WHEN ? = 1 THEN NULL
             ELSE COALESCE(target.deactivated_at, CURRENT_TIMESTAMP)
           END
       WHERE target.id = ?
         AND (
           target.role <> 'admin'
           OR ? = 1
           OR (
             SELECT active_admins
             FROM (
               SELECT COUNT(*) AS active_admins
               FROM users
               WHERE role = 'admin' AND is_active = 1
             ) AS admin_count
           ) > 1
         )`,
      [actorId, requestedValue, requestedValue, targetId, requestedValue]
    );

    if (result.affectedRows !== 1) {
      if (!isActive && targets[0].role === "admin") {
        return res.status(409).json({
          message: "The last active admin account cannot be deactivated",
        });
      }
      return res.status(409).json({ message: "User activation could not be updated" });
    }

    return res.json({
      message: isActive ? "User reactivated successfully" : "User deactivated successfully",
    });
  } catch (error) {
    console.error("updateUserActivation error:", error.code || error.name);
    return res.status(500).json({ message: "User activation could not be updated" });
  }
};
//admin data görüntüleme
export const getAdminDashboard = async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
  
      const [[students]] = await db.query(
        "SELECT COUNT(*) AS total FROM users WHERE role = 'student'"
      );
  
      const [[employers]] = await db.query(
        "SELECT COUNT(*) AS total FROM users WHERE role = 'employer'"
      );
  
      const [[jobs]] = await db.query(
        "SELECT COUNT(*) AS total FROM jobs"
      );
  
      const [[applications]] = await db.query(
        "SELECT COUNT(*) AS total FROM applications"
      );
  
      const [employerList] = await db.query(
        "SELECT id, email, status FROM users WHERE role = 'employer'"
      );
  
      res.json({
        stats: {
          students: students.total,
          employers: employers.total,
          jobs: jobs.total,
          applications: applications.total,
        },
        employers: employerList,
      });
    } catch (err) {
      console.error("ADMIN DASHBOARD ERROR:", err);
      res.status(500).json({ message: "Failed to load dashboard" });
    }
  };
  
// US-5.3.1 – View All Users
export const getAllUsers = async (req, res) => {
  const [rows] = await db.query(
    "SELECT id, email, role, status, is_active, deactivated_at FROM users"
  );
  res.json(rows);
};
