import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";
import ProtectedResumeButton from "../../components/ProtectedResumeButton";
import { getUiLabel } from "../../utils/uiLabels";
import "../../styles/EmployerApplications.css";

const FILTERS = ["all", "pending", "accepted", "rejected"];

const EmployerApplications = () => {
  const { jobId } = useParams();
  const hasValidJobId = /^[1-9]\d*$/.test(jobId || "");

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [updatingApplicationIds, setUpdatingApplicationIds] = useState([]);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!hasValidJobId) {
        setError("Lütfen işveren panelinden geçerli bir ilan seçin");
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(`/applications/job/${jobId}`);
        setApplications(res.data);
      } catch (requestError) {
        setError(
          requestError.response?.data?.message || "Başvurular yüklenemedi"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [jobId, hasValidJobId]);

  const handleStatusChange = async (applicationId, status) => {
    setActionError("");
    setUpdatingApplicationIds((prev) => [...prev, applicationId]);

    try {
      await api.patch(`/applications/${applicationId}`, { status });

      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status } : app
        )
      );
    } catch (requestError) {
      setActionError(
        requestError.response?.data?.message || "Başvuru durumu güncellenemedi"
      );
    } finally {
      setUpdatingApplicationIds((prev) =>
        prev.filter((id) => id !== applicationId)
      );
    }
  };

  const filteredApplications = activeFilter === "all"
    ? applications
    : applications.filter((application) => application.status === activeFilter);

  if (loading) {
    return (
      <div className="applications-container">
        <p className="applications-message">Başvurular yükleniyor...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="applications-container">
        <p className="applications-error">{error}</p>
        <Link to="/employer">Panele Dön</Link>
      </div>
    );
  }

  return (
    <div className="applications-container">
      <h2 className="applications-title">
        İlan #{jobId} Başvuruları
      </h2>

      <div className="application-filters" aria-label="Başvuruları duruma göre filtrele">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            className={`filter-btn${activeFilter === filter ? " active" : ""}`}
            onClick={() => setActiveFilter(filter)}
          >
            {getUiLabel(filter)}
          </button>
        ))}
      </div>

      {actionError && <p className="applications-error">{actionError}</p>}

      {applications.length === 0 && (
        <p className="applications-message">Bu ilan için henüz başvuru yok.</p>
      )}

      {applications.length > 0 && filteredApplications.length === 0 && (
        <p className="applications-message">{getUiLabel(activeFilter)} filtresinde başvuru bulunamadı.</p>
      )}

      <div className="applications-grid">
        {filteredApplications.map((app) => {
          const isUpdating = updatingApplicationIds.includes(app.id);

          return (
            <article key={app.id} className="application-card">
              <div className="application-profile">
                <div className="section-title">Öğrenci Profili</div>
                <div className="profile-details">
                  <div className="info-row"><b>E-posta</b><span>{app.student_email}</span></div>
                  <div className="info-row"><b>Üniversite</b><span>{app.university || "Belirtilmedi"}</span></div>
                  <div className="info-row"><b>Bölüm</b><span>{app.major || "Belirtilmedi"}</span></div>
                  <div className="info-row"><b>GPA</b><span>{app.gpa || "Belirtilmedi"}</span></div>
                </div>
              </div>

              <div className="application-meta">
                <div className="application-detail">
                  <span className="detail-label">CV</span>
                  {app.resume_id ? (
                    <ProtectedResumeButton resumeId={app.resume_id}>
                      CV’yi Görüntüle
                    </ProtectedResumeButton>
                  ) : (
                    <span className="detail-value">Belirtilmedi</span>
                  )}
                </div>

                <div className="application-detail">
                  <span className="detail-label">Durum</span>
                  <span className={`status-badge status-${app.status}`}>
                    {getUiLabel(app.status)}
                  </span>
                </div>
              </div>

              <div className="action-buttons">
                <button
                  className="accept-btn"
                  disabled={isUpdating || app.status === "accepted"}
                  onClick={() => handleStatusChange(app.id, "accepted")}
                >
                  Kabul Et
                </button>

                <button
                  className="reject-btn"
                  disabled={isUpdating || app.status === "rejected"}
                  onClick={() => handleStatusChange(app.id, "rejected")}
                >
                  Reddet
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default EmployerApplications;
