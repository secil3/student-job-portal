import db from "../config/db.js";

export const createJob = async (req, res) => {
  try {
    const { title, description, location, salary } = req.body;
    const employerId = req.user?.id;

    if (!employerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [users] = await db.query(
      "SELECT role, status FROM users WHERE id = ?",
      [employerId]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "User account not found" });
    }

    const user = users[0];

    if (user.role !== "employer") {
      return res.status(403).json({
        message: "Only employers can create job posts",
      });
    }

    if (user.status === "pending") {
      return res.status(403).json({
        message: "Employer account approval is pending",
      });
    }

    if (user.status !== "approved") {
      return res.status(403).json({
        message: "Employer account is not approved",
      });
    }

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description required" });
    }

    await db.query(
      `INSERT INTO jobs (title, description, location, salary, employer_id)
       VALUES (?, ?, ?, ?, ?)`,
      [title, description, location, salary, employerId]
    );

    res.status(201).json({ message: "Job created successfully ✅" });
  } catch (error) {
    console.error("createJob error:", error.code || error.name);
    res.status(500).json({ message: "Server error" });
  }
};


export const getAllJobs = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [requesters] = await db.query(
      "SELECT role FROM users WHERE id = ?",
      [userId]
    );

    if (requesters.length === 0) {
      return res.status(401).json({ message: "User account not found" });
    }

    const studentVisibility = requesters[0].role === "student"
      ? `WHERE jobs.is_active = 1
           AND users.role = 'employer'
           AND users.status = 'approved'
           AND users.is_active = 1`
      : "";

    const [rows] = await db.query(`
      SELECT jobs.*, users.email AS employer_email
      FROM jobs
      JOIN users ON jobs.employer_id = users.id
      ${studentVisibility}
      ORDER BY jobs.created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
export const getJobs = async (req, res) => {
  try {
    const { jobType, location, keyword } = req.query;

    let query = "SELECT * FROM jobs WHERE 1=1";
    const params = [];

    if (jobType) {
      query += " AND jobType = ?";
      params.push(jobType);
    }

    if (location) {
      query += " AND location LIKE ?";
      params.push(`%${location}%`);
    }

    if (keyword) {
      query += " AND title LIKE ?";
      params.push(`%${keyword}%`);
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
};

export const getEmployerJobs = async (req, res) => {
  try {
    const employerId = req.user.id;

    const [rows] = await db.query(
      `
      SELECT id, title, description, location, salary, created_at,
             is_active, deactivated_at
      FROM jobs
      WHERE employer_id = ?
      ORDER BY created_at DESC
      `,
      [employerId]
    );

    return res.json(rows);
  } catch (err) {
    console.error("getEmployerJobs error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const normalizeJobUpdate = (body) => {
  const fields = {
    title: { required: true, maxLength: 255, label: "Title" },
    description: { required: true, maxLength: 65535, label: "Description" },
    location: { required: true, maxLength: 100, label: "Location" },
    salary: { required: false, maxLength: 50, label: "Salary" },
  };

  const values = {};

  for (const [field, rules] of Object.entries(fields)) {
    const value = body?.[field];

    if (value === undefined || value === null) {
      if (rules.required) {
        return { error: `${rules.label} is required` };
      }
      values[field] = null;
      continue;
    }

    if (typeof value !== "string") {
      return { error: `${rules.label} must be text` };
    }

    const normalized = value.trim();
    if (rules.required && normalized.length === 0) {
      return { error: `${rules.label} is required` };
    }

    if (normalized.length > rules.maxLength) {
      return { error: `${rules.label} must be at most ${rules.maxLength} characters` };
    }

    values[field] = normalized || null;
  }

  return { values };
};

export const updateJob = async (req, res) => {
  try {
    const employerId = req.user?.id;

    if (!employerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [users] = await db.query(
      "SELECT role, status FROM users WHERE id = ?",
      [employerId]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "User account not found" });
    }

    const user = users[0];
    if (user.role !== "employer") {
      return res.status(403).json({ message: "Only employers can update job posts" });
    }

    if (user.status !== "approved") {
      return res.status(403).json({ message: "Employer account is not approved" });
    }

    const normalized = normalizeJobUpdate(req.body);
    if (normalized.error) {
      return res.status(400).json({ message: normalized.error });
    }

    const [jobs] = await db.query(
      "SELECT id, employer_id FROM jobs WHERE id = ?",
      [req.params.id]
    );

    if (jobs.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (Number(jobs[0].employer_id) !== Number(employerId)) {
      return res.status(403).json({ message: "You can only update your own job posts" });
    }

    const { title, description, location, salary } = normalized.values;
    const [result] = await db.query(
      `UPDATE jobs
       SET title = ?, description = ?, location = ?, salary = ?
       WHERE id = ? AND employer_id = ?
         AND EXISTS (
           SELECT 1 FROM users
           WHERE id = ? AND role = 'employer' AND status = 'approved'
         )`,
      [title, description, location, salary, req.params.id, employerId, employerId]
    );

    if (result.affectedRows !== 1) {
      return res.status(409).json({ message: "Job could not be updated" });
    }

    return res.json({ message: "Job updated successfully" });
  } catch (error) {
    console.error("updateJob error:", error.code || error.name);
    return res.status(500).json({ message: "Job could not be updated" });
  }
};


export const updateJobActivation = async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user?.id;
    const { isActive } = req.body ?? {};

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be boolean" });
    }

    const [users] = await db.query(
      "SELECT role, status, is_active FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "User account not found" });
    }

    const role = users[0].role;

    if (!['employer', 'admin'].includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (Number(users[0].is_active) !== 1) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    if (role === "employer" && users[0].status !== "approved") {
      return res.status(403).json({ message: "Employer account is not approved" });
    }

    const [jobs] = await db.query(
      "SELECT id, employer_id, is_active FROM jobs WHERE id = ?",
      [jobId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (role === "employer" && Number(jobs[0].employer_id) !== Number(userId)) {
      return res.status(403).json({
        message: "You can only update your own job posts",
      });
    }

    const requestedValue = isActive ? 1 : 0;
    if (Number(jobs[0].is_active) === requestedValue) {
      return res.json({
        message: isActive ? "Job is already active" : "Job is already inactive",
      });
    }

    const query = role === "admin"
      ? `UPDATE jobs
         SET is_active = ?,
             deactivated_at = CASE
               WHEN ? = 1 THEN NULL
               ELSE COALESCE(deactivated_at, CURRENT_TIMESTAMP)
             END
         WHERE id = ?
           AND EXISTS (
             SELECT 1 FROM users
             WHERE id = ? AND role = 'admin' AND is_active = 1
           )`
      : `UPDATE jobs
         SET is_active = ?,
             deactivated_at = CASE
               WHEN ? = 1 THEN NULL
               ELSE COALESCE(deactivated_at, CURRENT_TIMESTAMP)
             END
         WHERE id = ? AND employer_id = ?
           AND EXISTS (
             SELECT 1 FROM users
             WHERE id = ? AND role = 'employer'
               AND status = 'approved' AND is_active = 1
           )`;

    const params = role === "admin"
      ? [requestedValue, requestedValue, jobId, userId]
      : [requestedValue, requestedValue, jobId, userId, userId];

    const [result] = await db.query(query, params);

    if (result.affectedRows !== 1) {
      return res.status(409).json({ message: "Job activation could not be updated" });
    }

    return res.json({
      message: isActive ? "Job reactivated successfully" : "Job deactivated successfully",
    });
  } catch (err) {
    console.error("updateJobActivation error:", err.code || err.name);
    return res.status(500).json({ message: "Job activation could not be updated" });
  }
};
