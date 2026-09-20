import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "../../styles/AdminDashboard.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/admin/dashboard")
      .then((res) => {
        setStats(res.data.stats);
      })
      .catch((err) => {
        console.error("Admin dashboard error:", err);
        setError("Dashboard data could not be loaded.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="admin-container">
      <header className="admin-page-header">
        <span>Platform overview</span>
        <h1 className="page-title">Admin Dashboard</h1>
        <p>Monitor platform activity and access essential management tools.</p>
      </header>

      {loading && <p className="admin-state-message">Loading admin dashboard...</p>}
      {!loading && error && <p className="admin-state-message error">{error}</p>}

      {/* === STATS === */}
      {!loading && !error && stats && <div className="stats-grid">
        <div className="stat-card">
          <span>Total Students</span>
          <strong>{stats.students}</strong>
        </div>

        <div className="stat-card">
          <span>Total Employers</span>
          <strong>{stats.employers}</strong>
        </div>

        <div className="stat-card">
          <span>Total Jobs</span>
          <strong>{stats.jobs}</strong>
        </div>

        <div className="stat-card">
          <span>Total Applications</span>
          <strong>{stats.applications}</strong>
        </div>
      </div>}

      {/* === QUICK ACTIONS === */}
      {!loading && !error && <section className="admin-quick-section">
        <div className="admin-section-heading">
          <span>Management</span>
          <h2>Quick actions</h2>
        </div>
        <div className="admin-actions">
        <Link to="/admin/employers" className="action-card">
          <strong>Verify Employers</strong>
          <span>Review pending employer accounts</span>
        </Link>

        <Link to="/admin/jobs" className="action-card">
          <strong>Manage Jobs</strong>
          <span>Review current job postings</span>
        </Link>

        <Link to="/admin/users" className="action-card">
          <strong>View Users</strong>
          <span>See registered platform accounts</span>
        </Link>
        </div>
      </section>}
    </div>
  );
}
