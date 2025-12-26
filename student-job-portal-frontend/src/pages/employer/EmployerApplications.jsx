import { useEffect, useState } from "react";
import api from "../../services/api";
import { updateApplicationStatus } from "../../api/application.api";

const EmployerApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await api.get("/applications/employer");
      console.log("APPLICATIONS RESPONSE:", res.data);
      setApplications(res.data);
    } catch (err) {
      console.error(
        "FETCH APPLICATIONS ERROR:",
        err.response?.data || err.message
      );
      setError("Failed to load applications");
    } finally {
      setLoading(false); // 🔴 KRİTİK
    }
  };

  const handleStatusChange = async (applicationId, status) => {
    try {
      await updateApplicationStatus(applicationId, status);

      setApplications((prev) =>
        prev.map((app) =>
          app.application_id === applicationId
            ? { ...app, status }
            : app
        )
      );
    } catch (err) {
      alert("Failed to update status");
    }
  };

  if (loading) return <p>Loading applications...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Job Applications</h2>

      {applications.length === 0 && <p>No applications yet.</p>}

      {applications.map((app) => (
        <div
          key={app.application_id}
          style={{
            border: "1px solid #ccc",
            padding: "15px",
            marginBottom: "15px",
            borderRadius: "6px",
          }}
        >
          <h4>{app.job_title}</h4>

          <p><b>Student Email:</b> {app.email}</p>
          <p><b>University:</b> {app.university}</p>
          <p><b>Major:</b> {app.major}</p>
          <p><b>GPA:</b> {app.GPA}</p>
          <p><b>Status:</b> {app.status}</p>

          <p>
            <b>Resume:</b>{" "}
            {app.resume_path ? (
              <a
                href={`http://localhost:5050/${app.resume_path}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Resume
              </a>
            ) : (
              "No resume uploaded"
            )}
          </p>

          <div style={{ marginTop: "10px" }}>
            <button
              disabled={app.status === "accepted"}
              onClick={() =>
                handleStatusChange(app.application_id, "accepted")
              }
            >
              Accept
            </button>

            <button
              disabled={app.status === "rejected"}
              onClick={() =>
                handleStatusChange(app.application_id, "rejected")
              }
              style={{ marginLeft: "10px" }}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EmployerApplications;
