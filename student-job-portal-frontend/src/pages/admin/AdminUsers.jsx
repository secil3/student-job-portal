import { useEffect, useState } from "react";
import { updateUserActivation } from "../../api/activation.api";
import { useAuth } from "../../context/useAuth";
import api from "../../services/api";
import {
  isRecordActive,
  updateRecordActivation,
} from "../../utils/activationStatus";
import "../../styles/AdminUsers.css";

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch {
      setLoadError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const handleActivation = async (userId, isActive) => {
    setActionError("");
    setActionMessage("");
    setUpdatingUserId(userId);

    try {
      const response = await updateUserActivation(userId, isActive);
      setUsers((current) => updateRecordActivation(current, userId, isActive));
      setActionMessage(response.data?.message || "Account status updated.");
    } catch (error) {
      setActionError(
        error.response?.data?.message || "Account status could not be updated."
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="adminusers-container">
      <header className="adminusers-header">
        <span>User directory</span>
        <h1 className="adminusers-title">All Users</h1>
        <p>Review registered accounts, roles, approval and access status.</p>
      </header>

      {loading && <p className="loading-text">Loading...</p>}
      {loadError && <p className="adminusers-message is-error">{loadError}</p>}
      {actionError && (
        <p className="adminusers-message is-error">{actionError}</p>
      )}
      {actionMessage && (
        <p className="adminusers-message is-success">{actionMessage}</p>
      )}

      {!loading && !loadError && users.length === 0 && (
        <p className="empty-text">No users found.</p>
      )}

      {!loading && users.length > 0 && (
        <table className="users-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Approval</th>
              <th>Account</th>
              <th>Action</th>
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
                <td data-label="Approval">
                  <span className={`user-status-badge status-${u.status}`}>
                    {u.status}
                  </span>
                </td>
                <td data-label="Account">
                  <span
                    className={`account-status-badge ${
                      isRecordActive(u) ? "is-active" : "is-inactive"
                    }`}
                  >
                    {isRecordActive(u) ? "Active" : "Inactive"}
                  </span>
                </td>
                <td data-label="Action">
                  {Number(u.id) === Number(currentUser?.id) ? (
                    <span className="current-account-label">Current account</span>
                  ) : (
                    <button
                      type="button"
                      className={`user-activation-btn ${
                        isRecordActive(u) ? "is-deactivate" : "is-reactivate"
                      }`}
                      disabled={updatingUserId === u.id}
                      onClick={() => handleActivation(u.id, !isRecordActive(u))}
                    >
                      {updatingUserId === u.id
                        ? "Updating..."
                        : isRecordActive(u)
                          ? "Pasife al"
                          : "Yeniden etkinleştir"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
