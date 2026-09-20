import { useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/AdminUsers.css";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch {
      alert("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adminusers-container">
      <header className="adminusers-header">
        <span>User directory</span>
        <h1 className="adminusers-title">All Users</h1>
        <p>Review registered accounts, roles and approval status.</p>
      </header>

      {loading && <p className="loading-text">Loading...</p>}

      {!loading && users.length === 0 && (
        <p className="empty-text">No users found.</p>
      )}

      {!loading && users.length > 0 && (
        <table className="users-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td data-label="Email">{u.email}</td>
                <td data-label="Role">
                  <span className={`role-badge role-${u.role}`}>
                    {u.role}
                  </span>
                </td>
                <td data-label="Status">
                  <span className={`user-status-badge status-${u.status}`}>
                    {u.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
