import { useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/EmployerVerification.css";

export default function EmployerVerification() {
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployers();
  }, []);

  const fetchEmployers = async () => {
    try {
      const res = await api.get("/admin/employers/pending");
      setEmployers(res.data);
    } catch (err) {
      console.error("Failed to fetch employers", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/employers/${id}`, { status });
      fetchEmployers();
    } catch {
      alert("Failed to update employer status");
    }
  };

  return (
    <div className="verify-container">
      <h2 className="verify-title">Pending Employers</h2>

      {loading && <p className="loading-text">Loading...</p>}

      {!loading && employers.length === 0 && (
        <p className="empty-text">No pending employers.</p>
      )}

      {!loading && employers.length > 0 && (
        <div className="verify-list">
          {employers.map((emp) => (
            <div key={emp.id} className="verify-card">
              <div className="verify-info">
                <b>Email:</b> {emp.email}
              </div>

              <div className="verify-actions">
                <button
                  className="approve-btn"
                  onClick={() => updateStatus(emp.id, "approved")}
                >
                  Approve
                </button>

                <button
                  className="reject-btn"
                  onClick={() => updateStatus(emp.id, "rejected")}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
