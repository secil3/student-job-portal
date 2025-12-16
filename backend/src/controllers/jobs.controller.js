const db = require("../config/db");

exports.createJob = async (req, res) => {
  if (req.user.role !== "employer") {
    return res.status(403).json({ message: "Only employers can post jobs" });
  }

  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: "Title and description required" });
  }

  await db.query(
    "INSERT INTO jobs (employer_id, title, description) VALUES (?, ?, ?)",
    [req.user.id, title, description]
  );

  res.status(201).json({ message: "Job created successfully" });
};
exports.getJobs = async (req, res) => {
  try {
    const [jobs] = await db.query(
      `SELECT jobs.id, jobs.title, jobs.description, users.email AS employer_email
       FROM jobs
       JOIN users ON jobs.employer_id = users.id
       ORDER BY jobs.created_at DESC`
    );

    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
};
