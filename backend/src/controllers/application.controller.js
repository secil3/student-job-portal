import { db } from "../config/db.js";

/* =========================
   STUDENT → APPLY TO JOB
========================= */
export const applyToJob = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { job_id } = req.body;

    if (!job_id) {
      return res.status(400).json({ message: "Job ID required" });
    }

    await db
      .promise()
      .query(
        "INSERT INTO applications (job_id, student_id) VALUES (?, ?)",
        [job_id, studentId]
      );

    res.status(201).json({ message: "Applied successfully ✅" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Already applied to this job" });
    }

    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   EMPLOYER → VIEW APPLICATIONS
========================= */
export const getEmployerApplications = async (req, res) => {
  try {
    const employerId = req.user.id;

    const [rows] = await db.promise().query(
      `
      SELECT 
        a.id AS application_id,
        a.status,
        a.applied_at,
        j.title AS job_title,
        u.email AS student_email,
        u.resume_path
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN users u ON a.student_id = u.id
      WHERE j.employer_id = ?
      ORDER BY a.applied_at DESC
      `,
      [employerId]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   EMPLOYER → ACCEPT / REJECT
========================= */
export const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    await db
      .promise()
      .query(
        "UPDATE applications SET status = ? WHERE id = ?",
        [status, id]
      );

    res.json({ message: "Application status updated ✅" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

