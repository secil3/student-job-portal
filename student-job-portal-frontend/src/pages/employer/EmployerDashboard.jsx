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
      setError("İlanlarınız yüklenemedi.");
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
      setMessage(response.data?.message || "İlan durumu güncellendi.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "İlan durumu güncellenemedi."
      );
    } finally {
      setUpdatingJobId(null);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <p>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <span className="dashboard-eyebrow">Çalışma alanı</span>
          <h2 className="page-title">İşveren Paneli</h2>
          <p className="dashboard-subtitle">
            İlanlarınızı yönetin ve gelen başvuruları inceleyin.
          </p>
        </div>
        <div className="dashboard-header-actions">
          <div className="dashboard-count" aria-label={`${jobs.length} ilan`}>
            <strong>{jobs.length}</strong>
            <span>İlan</span>
          </div>
          <button
            className="new-job-btn"
            onClick={() => navigate("/employer/job-post")}
          >
            Yeni İlan
          </button>
        </div>
      </div>

      {error && <p className="dashboard-message is-error">{error}</p>}
      {message && <p className="dashboard-message is-success">{message}</p>}

      {!error && jobs.length === 0 ? (
        <p className="empty-text">
          Henüz ilan yayınlamadınız.
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
                    {isRecordActive(job) ? "Aktif" : "Pasif"}
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
                    Başvuruları Görüntüle
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={() => navigate(`/employer/jobs/${job.id}/edit`)}
                  >
                    Düzenle
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
                    ? "Güncelleniyor..."
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
