import { useEffect, useState } from "react";
import api from "../../services/api";
import { Link } from "react-router-dom";
import LogoutButton from "../../components/LogoutButton";

export default function JobList() {
  const [jobs, setJobs] = useState([]);

  // 🔹 Filter state
  const [filters, setFilters] = useState({
    jobType: "",
    location: "",
    keyword: "",
  });

  // 🔹 Jobs fetch (with filters)
  const fetchJobs = async () => {
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await api.get("/jobs");
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // 🔹 Initial load
  useEffect(() => {
    fetchJobs();
  }, []);

  const handleApply = async (jobId) => {
    try {
      await api.post("/applications", {
        job_id: jobId,
      });
      alert("Applied successfully ✅");
    } catch (err) {
      if (err.response?.status === 409) {
        alert("You already applied to this job ⚠️");
      } else {
        alert("Apply failed ❌");
      }
    }
  };

  return (
    <div>

      <h2>Available Jobs</h2>

      {/* 🔍 FILTER UI */}
      <div style={{ marginBottom: "20px", border: "1px solid #ddd", padding: "10px" }}>
        <select
          value={filters.jobType}
          onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
        >
          <option value="">All Job Types</option>
          <option value="Internship">Internship</option>
          <option value="Part-time">Part-time</option>
          <option value="Full-time">Full-time</option>
        </select>

        <input
          type="text"
          placeholder="Location"
          value={filters.location}
          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
          style={{ marginLeft: "10px" }}
        />

        <input
          type="text"
          placeholder="Keyword"
          value={filters.keyword}
          onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
          style={{ marginLeft: "10px" }}
        />

        <button onClick={fetchJobs} style={{ marginLeft: "10px" }}>
          Filter
        </button>
      </div>

      {/* 📋 JOB LIST */}
      {jobs.length === 0 && <p>No jobs found.</p>}

      {jobs.map((job) => (
        <div
          key={job.id}
          style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}
        >
          <h3>{job.title}</h3>
          <p>{job.description}</p>
          <p>
            <b>Location:</b> {job.location}
          </p>
          <p>
            <b>Job Type:</b> {job.jobType}
          </p>
          <p>
            <b>Salary:</b> {job.salary}
          </p>

          <button onClick={() => handleApply(job.id)}>Apply</button>
        </div>
      ))}
    </div>
  );
}
