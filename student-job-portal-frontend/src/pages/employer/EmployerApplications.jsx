import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";
import ProtectedResumeButton from "../../components/ProtectedResumeButton";
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
        setError("Please select a valid job from the employer dashboard");
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(`/applications/job/${jobId}`);
        setApplications(res.data);
      } catch (requestError) {
        setError(
          requestError.response?.data?.message || "Failed to load applications"
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
        requestError.response?.data?.message || "Failed to update status"
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
        <p className="applications-message">Loading applications...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="applications-container">
        <p className="applications-error">{error}</p>
        <Link to="/employer">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="applications-container">
      <h2 className="applications-title">
        Applications for Job #{jobId}
      </h2>

      <div className="application-filters" aria-label="Filter applications by status">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            className={`filter-btn${activeFilter === filter ? " active" : ""}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      {actionError && <p className="applications-error">{actionError}</p>}

      {applications.length === 0 && (
        <p className="applications-message">No applications for this job yet.</p>
      )}

      {applications.length > 0 && filteredApplications.length === 0 && (
        <p className="applications-message">No {activeFilter} applications found.</p>
      )}

      <div className="applications-grid">
        {filteredApplications.map((app) => {
          const isUpdating = updatingApplicationIds.includes(app.id);

          return (
            <article key={app.id} className="application-card">
              <div className="application-profile">
                <div className="section-title">Student Profile</div>
                <div className="profile-details">
                  <div className="info-row"><b>Email</b><span>{app.student_email}</span></div>
                  <div className="info-row"><b>University</b><span>{app.university || "N/A"}</span></div>
                  <div className="info-row"><b>Major</b><span>{app.major || "N/A"}</span></div>
                  <div className="info-row"><b>GPA</b><span>{app.gpa || "N/A"}</span></div>
                </div>
              </div>

              <div className="application-meta">
                <div className="application-detail">
                  <span className="detail-label">Resume</span>
                  {app.resume_id ? (
                    <ProtectedResumeButton resumeId={app.resume_id}>
                      View CV
                    </ProtectedResumeButton>
                  ) : (
                    <span className="detail-value">Not provided</span>
                  )}
                </div>

                <div className="application-detail">
                  <span className="detail-label">Status</span>
                  <span className={`status-badge status-${app.status}`}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="action-buttons">
                <button
                  className="accept-btn"
                  disabled={isUpdating || app.status === "accepted"}
                  onClick={() => handleStatusChange(app.id, "accepted")}
                >
                  Accept
                </button>

                <button
                  className="reject-btn"
                  disabled={isUpdating || app.status === "rejected"}
                  onClick={() => handleStatusChange(app.id, "rejected")}
                >
                  Reject
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
