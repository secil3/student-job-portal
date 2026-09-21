import db from "../config/db.js";

const requireApprovedEmployer = async (employerId, res) => {
  const [users] = await db.query(
    "SELECT role, status FROM users WHERE id = ?",
    [employerId]
  );

  if (users.length === 0) {
    res.status(401).json({ message: "User account not found" });
    return false;
  }

  if (users[0].role !== "employer" || users[0].status !== "approved") {
    res.status(403).json({ message: "Employer account is not approved" });
    return false;
  }

  return true;
};

/* =========================
   STUDENT → APPLY TO JOB
========================= */
export const applyToJob = async (req, res) => {
  try {
    const studentId = req.user?.id;
    const jobId = req.body?.jobId; // camelCase API contract
    const resumeId = req.body?.resumeId;

    // 🔒 Güvenlik kontrolleri
    if (!studentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!jobId) {
      return res.status(400).json({ message: "Job ID required" });
    }

    if (!resumeId) {
      return res.status(400).json({ message: "Resume is required" });
    }

    const [students] = await db.query(
      "SELECT role, is_verified, is_active FROM users WHERE id = ?",
      [studentId]
    );

    if (students.length === 0) {
      return res.status(401).json({ message: "User account not found" });
    }

    if (students[0].role !== "student") {
      return res.status(403).json({ message: "Only students can apply to jobs" });
    }

    if (Number(students[0].is_active) !== 1) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    if (Number(students[0].is_verified) !== 1) {
      return res.status(403).json({
        message: "Verify your ADU student email before applying",
      });
    }

    const [resumes] = await db.query(
      "SELECT id, user_id FROM resumes WHERE id = ?",
      [resumeId]
    );

    if (resumes.length === 0) {
      return res.status(404).json({ message: "Resume not found" });
    }

    if (Number(resumes[0].user_id) !== Number(studentId)) {
      return res.status(403).json({
        message: "You can only apply with your own resume",
      });
    }

    const [jobs] = await db.query(
      `SELECT j.id, j.is_active AS job_is_active,
              u.role AS employer_role, u.status AS employer_status,
              u.is_active AS employer_is_active
       FROM jobs j
       JOIN users u ON u.id = j.employer_id
       WHERE j.id = ?`,
      [jobId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (
      jobs[0].employer_role !== "employer"
      || jobs[0].employer_status !== "approved"
      || Number(jobs[0].employer_is_active) !== 1
      || Number(jobs[0].job_is_active) !== 1
    ) {
      return res.status(403).json({
        message: "Job is not available for applications",
      });
    }

    const [result] = await db.query(
      `INSERT INTO applications (job_id, student_id, resume_id)
       SELECT j.id, ?, ?
       FROM jobs j
       JOIN users employer ON employer.id = j.employer_id
       JOIN users student ON student.id = ?
       WHERE j.id = ?
         AND employer.role = 'employer'
         AND employer.status = 'approved'
         AND employer.is_active = 1
         AND student.role = 'student'
         AND student.is_verified = 1
         AND student.is_active = 1
         AND j.is_active = 1`,
      [studentId, resumeId, studentId, jobId]
    );

    if (result.affectedRows !== 1) {
      return res.status(409).json({
        message: "Job is no longer available for applications",
      });
    }

    return res.status(201).json({ message: "Applied successfully ✅" });

  } catch (error) {
    // 🔁 Aynı ilana ikinci kez başvuru
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: "Already applied to this job" });
    }

    console.error("applyToJob error:", error.code || error.name);
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
        a.job_id AS job_id,
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
    if (!await requireApprovedEmployer(req.user.id, res)) return;

    const [rows] = await db.query(`
      SELECT
        a.id AS application_id,
        a.status,
        u.email,
        u.university,
        u.major,
        u.GPA,
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
  try {
    const { id } = req.params;
    const { status } = req.body;
    const employerId = req.user.id;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (!await requireApprovedEmployer(employerId, res)) return;

    const [rows] = await db.query(
      `
      SELECT a.id, a.status, j.employer_id
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE a.id = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (Number(rows[0].employer_id) !== Number(employerId)) {
      return res.status(403).json({
        message: "You can only update applications for your own jobs",
      });
    }

    if (rows[0].status === status) {
      return res.json({ message: "Status updated ✅" });
    }

    const [result] = await db.query(
      `
      UPDATE applications a
      JOIN jobs j ON j.id = a.job_id
      SET a.status = ?
      WHERE a.id = ? AND j.employer_id = ?
        AND EXISTS (
          SELECT 1 FROM users
          WHERE id = ? AND role = 'employer' AND status = 'approved'
        )
      `,
      [status, id, employerId, employerId]
    );

    if (result.affectedRows !== 1) {
      return res.status(409).json({
        message: "Application status could not be updated",
      });
    }

    return res.json({ message: "Status updated ✅" });
  } catch (err) {
    console.error("updateApplicationStatus error:", err.code || err.name);
    return res.status(500).json({ message: "Server error" });
  }
};
//get application by job
export const getApplicationsByJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const employerId = req.user.id;

    if (!await requireApprovedEmployer(employerId, res)) return;

    const [jobs] = await db.query(
      "SELECT id, employer_id FROM jobs WHERE id = ?",
      [jobId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (Number(jobs[0].employer_id) !== Number(employerId)) {
      return res.status(403).json({
        message: "You can only view applications for your own jobs",
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        a.id,
        a.status,
        u.id AS student_id,
        u.email AS student_email,
        u.university,
        u.major,
        u.gpa,
        r.id AS resume_id,
        r.name AS resume_name
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN users u ON a.student_id = u.id
      LEFT JOIN resumes r ON a.resume_id = r.id
      WHERE a.job_id = ?
        AND j.employer_id = ?
      `,
      [jobId, employerId]
    );

    return res.json(rows);
  } catch (err) {
    console.error("getApplicationsByJob error:", err.code || err.name);
    return res.status(500).json({ message: "Failed to fetch applications" });
  }
};
