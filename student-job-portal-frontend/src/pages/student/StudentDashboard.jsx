import { useEffect, useState } from "react";
import { getAllJobs } from "../../api/job.api";
import { getStudentApplications } from "../../api/application.api";
import JobCard from "../../components/JobCard";
import { Link } from "react-router-dom";

import "../../styles/StudentDashboard.css";
import "../../styles/DashboardCards.css";

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
      console.error("APPLICATIONS ERROR:", err);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  if (loadingJobs || loadingApps) {
    return (
      <div className="student-page">
        <div className="student-container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-page">
        <div className="student-container">
          <p className="error-text">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-page">
      <div className="student-container">
        {/* ===== DASHBOARD SUMMARY ===== */}
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <h4>Total Applications</h4>
            <p>{applications.length}</p>
          </div>

          <div className="dashboard-card">
            <h4>Available Jobs</h4>
            <p>{jobs.length}</p>
          </div>

          <div className="dashboard-card">
            <h4>Status</h4>
            <p>Active</p>
          </div>
        </div>

        <h1 className="page-title">Student Dashboard</h1>

        {/* 🔵 MY APPLICATIONS */}
        <h2 className="section">My Applications</h2>
        <hr className="section-divider" />

        {applications.length === 0 ? (
          <p>You haven’t applied to any jobs yet.</p>
        ) : (
          <div className="applications-list">
            {applications.map((app) => (
              <div key={app.application_id} className="application-card">
                <div className="application-row">
                  <b>Job:</b> {app.job_title}
                </div>

                <div className="application-row">
                  <b>Status:</b>{" "}
                  <span className={`status-badge status-${app.status}`}>
                    {app.status.toUpperCase()}
                  </span>
                </div>

                <div className="application-date">
                  Applied at: {new Date(app.applied_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 🟢 AVAILABLE JOBS */}
        <div className="jobs-header">
          <h2 className="section-title">Available Jobs</h2>

          <Link to="/student/jobs">
            <button className="primary-btn">Browse Jobs</button>
          </Link>
        </div>

        {jobs.length === 0 ? (
          <p>No jobs available.</p>
        ) : (
          <div className="jobs-grid">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} onApplied={fetchApplications} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
