import { db } from "../config/db.js";

// Pending employer'ları getir
export const getPendingEmployers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const [rows] = await db.query(
      "SELECT id, email, status FROM users WHERE role = 'employer' AND status = 'pending'"
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch employers" });
  }
};

// Employer status güncelle
export const updateEmployerStatus = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { id } = req.params;
    const { status } = req.body; // approved | rejected

    await db.query(
      "UPDATE users SET status = ? WHERE id = ? AND role = 'employer'",
      [status, id]
    );

    res.json({ message: "Employer status updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update status" });
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
  
