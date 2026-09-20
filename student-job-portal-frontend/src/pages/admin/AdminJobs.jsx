import { useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/AdminJobs.css";

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingJobId, setDeletingJobId] = useState(null);

  const fetchJobs = async () => {
    try {
      const res = await api.get("/jobs");
      setJobs(res.data);
    } catch {
      alert("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const deleteJob = async (id) => {
    const confirmed = window.confirm(
      "Deleting this job will permanently delete all applications submitted for it. This action cannot be undone. Continue?"
    );

    if (!confirmed) return;

    try {
      setDeletingJobId(id);
      await api.delete(`/jobs/${id}`);
      await fetchJobs();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete job");
    } finally {
      setDeletingJobId(null);
    }
  };

  return (
    <div className="adminjobs-container">
      <header className="adminjobs-header">
        <span>Content oversight</span>
        <h1 className="adminjobs-title">Manage Jobs</h1>
        <p>Review active job postings and remove inappropriate listings.</p>
      </header>

      {loading && <p>Loading...</p>}

      {!loading && jobs.length === 0 && (
        <p className="empty-text">No jobs found.</p>
      )}

      {!loading && jobs.length > 0 && (
        <div className="adminjobs-list">
          {jobs.map((job) => (
            <div key={job.id} className="adminjob-card">
              <div className="adminjob-content">
                <span>Job posting</span>
                <h2 className="adminjob-title">{job.title}</h2>
                <p className="adminjob-location">{job.location || "Location not provided"}</p>
              </div>

              <button
                className="btn btn-danger"
                onClick={() => deleteJob(job.id)}
                disabled={deletingJobId === job.id}
              >
                {deletingJobId === job.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
