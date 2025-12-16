const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "127.0.0.1", // ❗ localhost YOK
  port: 3307,        // ❗ docker portu
  user: "portal_user",
  password: "portal_pass",
  database: "student_job_portal",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = db;
