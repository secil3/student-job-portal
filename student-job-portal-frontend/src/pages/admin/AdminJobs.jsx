import { useEffect, useState } from "react";
import { updateJobActivation } from "../../api/activation.api";
import api from "../../services/api";
import {
  isRecordActive,
  updateRecordActivation,
} from "../../utils/activationStatus";
import "../../styles/AdminJobs.css";

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingJobId, setUpdatingJobId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchJobs = async () => {
    try {
      const res = await api.get("/jobs");
      setJobs(res.data);
    } catch {
      setError("Failed to load jobs.");
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

  return (
    <div className="adminjobs-container">
      <header className="adminjobs-header">
        <span>Content oversight</span>
        <h1 className="adminjobs-title">Manage Jobs</h1>
        <p>Review job postings and control whether they are visible to students.</p>
      </header>

      {loading && <p>Loading...</p>}
      {error && <p className="adminjobs-message is-error">{error}</p>}
      {message && <p className="adminjobs-message is-success">{message}</p>}

      {!loading && !error && jobs.length === 0 && (
        <p className="empty-text">No jobs found.</p>
      )}

      {!loading && jobs.length > 0 && (
        <div className="adminjobs-list">
          {jobs.map((job) => (
            <div key={job.id} className="adminjob-card">
              <div className="adminjob-content">
                <span
                  className={`job-activation-badge ${
                    isRecordActive(job) ? "is-active" : "is-inactive"
                  }`}
                >
                  {isRecordActive(job) ? "Active" : "Inactive"}
                </span>
                <h2 className="adminjob-title">{job.title}</h2>
                <p className="adminjob-location">
                  {job.location || "Location not provided"}
                </p>
              </div>

              <button
                className={`job-activation-btn ${
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
          ))}
        </div>
      )}
    </div>
  );
}
