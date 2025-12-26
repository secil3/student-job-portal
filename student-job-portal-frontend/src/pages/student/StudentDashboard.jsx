import { useEffect, useState } from "react";
import { getAllJobs } from "../../api/job.api";
import { getStudentApplications } from "../../api/application.api";
import JobCard from "../../components/JobCard";
import { Link } from "react-router-dom";

const StudentDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApps, setLoadingApps] = useState(true);
  const [error, setError] = useState("");

  // 🔹 Job list
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await getAllJobs();
        setJobs(res.data);
      } catch (err) {
        console.error("JOBS ERROR:", err.response?.data || err.message);
        setError("Failed to load jobs");
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchJobs();
  }, []);

  // 🔹 My Applications 
  const fetchApplications = async () => {
    try {
      const res = await getStudentApplications();
      setApplications(res.data);
    } catch (err) {
      console.error("APPLICATIONS ERROR:", err.response?.data || err.message);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  if (loadingJobs || loadingApps) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      {/* 🔵 MY APPLICATIONS */}
      <h2>My Applications</h2>

      {applications.length === 0 ? (
        <p>You haven’t applied to any jobs yet.</p>
      ) : (
        applications.map((app) => (
          <div
            key={app.application_id}
            style={{
              border: "1px solid #ddd",
              padding: "12px",
              marginBottom: "10px",
              borderRadius: "6px",
            }}
          >
            <p>
              <strong>Job:</strong> {app.job_title}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span
                style={{
                  fontWeight: "bold",
                  color:
                    app.status === "accepted"
                      ? "green"
                      : app.status === "rejected"
                      ? "red"
                      : "orange",
                }}
              >
                {app.status.toUpperCase()}
              </span>
            </p>
            <p style={{ fontSize: "0.85em", color: "#666" }}>
              Applied at: {new Date(app.applied_at).toLocaleString()}
            </p>
          </div>
        ))
      )}

      <hr style={{ margin: "30px 0" }} />

      {/* 🟢 AVAILABLE JOBS */}
      <h2>Available Jobs</h2>
      <Link to="/student/jobs">
          <button>Browse Jobs</button>
      </Link>

      {jobs.length === 0 && <p>No jobs available.</p>}

      {jobs.map((job) => (
        <JobCard key={job.id} job={job}
        onApplied={fetchApplications}/>
      ))}
    </div>
  );
};

export default StudentDashboard;
