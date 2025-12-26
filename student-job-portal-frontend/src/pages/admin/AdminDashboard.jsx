import { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);
  
  const fetchDashboard = async () => {
    try {
      const res = await api.get("/admin/dashboard");
      console.log("ADMIN DASHBOARD RESPONSE:", res.data); // 🔴 EKLE
      setStats(res.data.stats);
      setEmployers(res.data.employers);
    } catch (err) {
      console.error("ADMIN DASHBOARD ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading admin dashboard...</p>;
  if (!stats) return <p>Failed to load dashboard.</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Admin Dashboard</h2>

      {/* === SYSTEM STATS === */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
        <div>👩‍🎓 <b>Students:</b> {stats.students}</div>
        <div>🧑‍💼 <b>Employers:</b> {stats.employers}</div>
        <div>📄 <b>Jobs:</b> {stats.jobs}</div>
        <div>📩 <b>Applications:</b> {stats.applications}</div>
      </div>

      {/* === EMPLOYER LIST === */}
      <h3>All Employers</h3>

      {employers.length === 0 && <p>No employers found.</p>}

      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {employers.map((emp) => (
            <tr key={emp.id}>
              <td>{emp.email}</td>
              <td>{emp.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
