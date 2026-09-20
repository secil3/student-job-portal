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
      <h2 className="adminjobs-title">All Job Postings</h2>

      {loading && <p>Loading...</p>}

      {!loading && jobs.length === 0 && (
        <p className="empty-text">No jobs found.</p>
      )}

      {!loading && jobs.length > 0 && (
        <div className="adminjobs-list">
          {jobs.map((job) => (
            <div key={job.id} className="adminjob-card">
              <div className="adminjob-title">{job.title}</div>
              <div className="adminjob-location">{job.location}</div>

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
