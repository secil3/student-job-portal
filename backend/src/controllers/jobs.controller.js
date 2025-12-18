import { db } from "../config/db.js";

export const createJob = async (req, res) => {
  try {
    const { title, description, location, salary } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description required" });
    }

    // 🔐 JWT'den employer id
    const employer_id = req.user.id;

    await db.promise().query(
      `INSERT INTO jobs (title, description, location, salary, employer_id)
       VALUES (?, ?, ?, ?, ?)`,
      [title, description, location, salary, employer_id]
    );

    res.status(201).json({ message: "Job created successfully ✅" });
  } catch (error) {
    console.error("JOB CREATE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getAllJobs = async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT jobs.*, users.email AS employer_email
      FROM jobs
      JOIN users ON jobs.employer_id = users.id
      ORDER BY created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getEmployerJobs = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.promise().query(
      "SELECT * FROM jobs WHERE employer_id = ?",
      [id]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    await db.promise().query("DELETE FROM jobs WHERE id = ?", [id]);

    res.json({ message: "Job deleted 🗑️" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

