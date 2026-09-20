import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";
import ProtectedResumeButton from "../../components/ProtectedResumeButton";
import "../../styles/EmployerApplications.css";

const EmployerApplications = () => {
  const { jobId } = useParams();
  const hasValidJobId = /^[1-9]\d*$/.test(jobId || "");

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
      } catch {
        setError("Failed to load applications");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [jobId, hasValidJobId]);

  const handleStatusChange = async (applicationId, status) => {
    setUpdatingApplicationIds((prev) => [...prev, applicationId]);

    try {
      await api.patch(`/applications/${applicationId}`, { status });

      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status } : app
        )
      );
    } catch (requestError) {
      alert(
        requestError.response?.data?.message || "Failed to update status"
      );
    } finally {
      setUpdatingApplicationIds((prev) =>
        prev.filter((id) => id !== applicationId)
      );
    }
  };

  if (loading) return <p>Loading applications...</p>;
  if (error) {
    return (
      <div className="applications-container">
        <p style={{ color: "red" }}>{error}</p>
        {!hasValidJobId && <Link to="/employer">Return to Dashboard</Link>}
      </div>
    );
  }

  return (
    <div className="applications-container">
      <h2 className="applications-title">
        Applications for Job #{jobId}
      </h2>

      {applications.length === 0 && (
        <p>No applications for this job yet.</p>
      )}

      {applications.map((app) => {
        const isUpdating = updatingApplicationIds.includes(app.id);

        return (
          <div key={app.id} className="application-card">
          
          {/* 👤 STUDENT */}
          <div className="section">
            <div className="section-title">Student Profile</div>
            <div className="info-row"><b>Email:</b> {app.student_email}</div>
            <div className="info-row"><b>University:</b> {app.university || "N/A"}</div>
            <div className="info-row"><b>Major:</b> {app.major || "N/A"}</div>
            <div className="info-row"><b>GPA:</b> {app.gpa || "N/A"}</div>
          </div>

          {/* 📄 RESUME */}
          <div className="section">
            <div className="section-title">Resume</div>
            {app.resume_id ? (
              <ProtectedResumeButton resumeId={app.resume_id}>
                View CV
              </ProtectedResumeButton>
            ) : (
              <div className="info-row">Not provided</div>
            )}
          </div>

          {/* 📌 STATUS */}
          <div className="section">
            <div className="section-title">Application Status</div>
            <span
              className={`status-badge status-${app.status}`}
            >
              {app.status}
            </span>
          </div>

          {/* 🎯 ACTIONS */}
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
          </div>
        );
      })}
    </div>
  );
};

export default EmployerApplications;
