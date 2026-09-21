import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateJobActivation } from "../../api/activation.api";
import api from "../../services/api";
import {
  isRecordActive,
  updateRecordActivation,
} from "../../utils/activationStatus";
import "../../styles/EmployerDashboard.css";

const EmployerDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingJobId, setUpdatingJobId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const fetchJobs = async () => {
    try {
      const res = await api.get("/jobs/employer");
      setJobs(res.data);
    } catch {
      setError("Failed to load your job posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleActivation = async (jobId, isActive) => {
    setError("");
    setMessage("");
    setUpdatingJobId(jobId);
    try {
      const response = await updateJobActivation(jobId, isActive);
      setJobs((current) => updateRecordActivation(current, jobId, isActive));
      setMessage(response.data?.message || "Job status updated.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Job status could not be updated."
      );
    } finally {
      setUpdatingJobId(null);
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

      {error && <p className="dashboard-message is-error">{error}</p>}
      {message && <p className="dashboard-message is-success">{message}</p>}

      {!error && jobs.length === 0 ? (
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
                  <span
                    className={`job-status-badge ${
                      isRecordActive(job) ? "is-active" : "is-inactive"
                    }`}
                  >
                    {isRecordActive(job) ? "Active" : "Inactive"}
                  </span>
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
                  className={`job-activation-link ${
                    isRecordActive(job) ? "is-deactivate" : "is-reactivate"
                  }`}
                  onClick={() => handleActivation(job.id, !isRecordActive(job))}
                  disabled={updatingJobId === job.id}
                >
                  {updatingJobId === job.id
                    ? "Updating..."
                    : isRecordActive(job)
                      ? "Pasife al"
                      : "Yeniden etkinleştir"}
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
