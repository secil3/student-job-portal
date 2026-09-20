import { useEffect, useState } from "react";
import { applyToJob } from "../../api/application.api";
import api from "../../services/api";
import "../../styles/JobList.css";

export default function JobList() {
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState("");

  useEffect(() => {
    api.get("/jobs").then((res) => setJobs(res.data));
    api.get("/resumes").then((res) => setResumes(res.data));
  }, []);

  const handleApply = async (jobId) => {
    if (!selectedResume) {
      alert("Please select a resume ❗");
      return;
    }

    try {
      await applyToJob(jobId, selectedResume);
      alert("Applied successfully ✅");
    } catch (err) {
      alert(err?.response?.data?.message || "Apply failed ❌");
    }
  };

  return (
    <div className="section">
      <h2>Available Jobs</h2>

      <div className="resume-select">
        <label>Select Resume:</label>
        <select
          value={selectedResume}
          onChange={(e) => setSelectedResume(e.target.value)}
        >
          <option value="">- Select Resume -</option>
          {resumes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {jobs.map((job) => (
        <div key={job.id} className="job-card">
          <h3>{job.title}</h3>
          <p>{job.description}</p>
          <p><b>Location:</b> {job.location}</p>
          <p><b>Salary:</b> {job.salary}</p>

          <button onClick={() => handleApply(job.id)} className="btn btn-primary">
            Apply
          </button>
        </div>
      ))}
    </div>
  );
}
