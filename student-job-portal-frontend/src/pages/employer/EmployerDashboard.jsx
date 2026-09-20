import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/EmployerDashboard.css";

const EmployerDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingJobId, setDeletingJobId] = useState(null);
  const navigate = useNavigate();

  const fetchJobs = async () => {
    try {
      const res = await api.get("/jobs/employer");
      setJobs(res.data);
    } catch {
      alert("Failed to load your job posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async (jobId) => {
    const confirmed = window.confirm(
      "Deleting this job will permanently delete all applications submitted for it. This action cannot be undone. Continue?"
    );

    if (!confirmed) return;

    try {
      setDeletingJobId(jobId);
      await api.delete(`/jobs/${jobId}`);
      setJobs((prev) => prev.filter((job) => job.id !== jobId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete job");
    } finally {
      setDeletingJobId(null);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <span className="dashboard-eyebrow">Workspace</span>
          <h2 className="page-title">Employer Dashboard</h2>
          <p className="dashboard-subtitle">
            Manage your job posts and review incoming applications.
          </p>
        </div>
        <div className="dashboard-header-actions">
          <div className="dashboard-count" aria-label={`${jobs.length} job posts`}>
            <strong>{jobs.length}</strong>
            <span>{jobs.length === 1 ? "Job post" : "Job posts"}</span>
          </div>
          <button
            className="new-job-btn"
            onClick={() => navigate("/employer/job-post")}
          >
            New Job
          </button>
        </div>
      </div>

      {jobs.length === 0 ? (
        <p className="empty-text">
          You haven’t posted any jobs yet.
        </p>
      ) : (
        <div className="job-list">
          {jobs.map((job) => (
            <div key={job.id} className="job-card">
              <div className="job-card-content">
                <div className="job-card-heading">
                  <h4>{job.title}</h4>
                </div>

                {(job.location || job.salary) && (
                  <div className="job-meta">
                    {job.location && <span>{job.location}</span>}
                    {job.salary && <span>{job.salary}</span>}
                  </div>
                )}

                <p className="job-description">{job.description}</p>
              </div>

              <div className="job-actions">
                <div className="job-primary-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() =>
                      navigate(`/employer/applications/${job.id}`)
                    }
                  >
                    View Applications
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={() => navigate(`/employer/jobs/${job.id}/edit`)}
                  >
                    Edit
                  </button>
                </div>

                <button
                  className="job-delete-btn"
                  onClick={() => handleDelete(job.id)}
                  disabled={deletingJobId === job.id}
                >
                  {deletingJobId === job.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployerDashboard;
