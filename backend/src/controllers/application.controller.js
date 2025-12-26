import { db } from "../config/db.js";

/* =========================
   STUDENT → APPLY TO JOB
========================= */
export const applyToJob = async (req, res) => {
  try {
    // 🔍 DEBUG (şimdilik kalsın, sonra silebilirsin)
    console.log("REQ BODY:", req.body);
    console.log("REQ USER:", req.user);

    const studentId = req.user?.id;
    const jobId = req.body?.jobId; // camelCase API contract

    // 🔒 Güvenlik kontrolleri
    if (!studentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!jobId) {
      return res.status(400).json({ message: "Job ID required" });
    }

    // ✅ INSERT
    await db.query(
        "INSERT INTO applications (job_id, student_id) VALUES (?, ?)",
        [jobId, studentId]
      );

    return res.status(201).json({ message: "Applied successfully ✅" });

  } catch (error) {
    // 🔁 Aynı ilana ikinci kez başvuru
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: "Already applied to this job" });
    }

    console.error("APPLY ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================
STUDENT → VIEW APPLICATIONS
========================= */
export const getStudentApplications = async (req, res) => {
  try {
    const studentId = req.user.id;

    const [rows] = await db.query(
      `
      SELECT
        a.id AS application_id,
        a.status,
        a.applied_at,
        j.title AS job_title
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE a.student_id = ?
      ORDER BY a.applied_at DESC
      `,
      [studentId]
    );

    return res.json(rows);
  } catch (err) {
    console.error("getStudentApplications error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   EMPLOYER → VIEW APPLICATIONS
========================= */
export const getEmployerApplications = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        a.id AS application_id,
        a.status,
        u.email,
        u.university,
        u.major,
        u.GPA,
        u.resume_path,
        j.title AS job_title
      FROM applications a
      JOIN users u ON a.student_id = u.id
      JOIN jobs j ON a.job_id = j.id
      WHERE j.employer_id = ?
    `, [req.user.id]);

    res.json(rows);
  } catch (err) {
    console.error("getEmployerApplications error:", err);
    res.status(500).json({ message: "Failed to fetch applications" });
  }
};


/* =========================
   EMPLOYER → ACCEPT / REJECT
========================= */


export const updateApplicationStatus = async (req, res) => {
  console.log("🔥 UPDATE STATUS CONTROLLER ÇALIŞTI");
  console.log("PARAM ID:", req.params.id);
  console.log("BODY:", req.body);
  try {
    const { id } = req.params; // application_id
    const { status } = req.body;

    // status kontrolü
    if (!["pending", "accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // application var mı?
    const [rows] = await db.query(
      "SELECT id FROM applications WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    // status update
    await db.query(
      "UPDATE applications SET status = ? WHERE id = ?",
      [status, id]
    );

    return res.json({ message: "Status updated ✅" });
  } catch (err) {
    console.error("updateApplicationStatus error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
