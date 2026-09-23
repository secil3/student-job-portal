import { useEffect, useState } from "react";
import { updateUserActivation } from "../../api/activation.api";
import { useAuth } from "../../context/useAuth";
import api from "../../services/api";
import {
  isRecordActive,
  updateRecordActivation,
} from "../../utils/activationStatus";
import { getUiLabel } from "../../utils/uiLabels";
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
      setLoadError("Kullanıcılar yüklenemedi.");
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
      setActionMessage(response.data?.message || "Hesap durumu güncellendi.");
    } catch (error) {
      setActionError(
        error.response?.data?.message || "Hesap durumu güncellenemedi."
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="adminusers-container">
      <header className="adminusers-header">
        <span>Kullanıcı dizini</span>
        <h1 className="adminusers-title">Tüm Kullanıcılar</h1>
        <p>Kayıtlı hesapları, rolleri, onay ve erişim durumlarını inceleyin.</p>
      </header>

      {loading && <p className="loading-text">Yükleniyor...</p>}
      {loadError && <p className="adminusers-message is-error">{loadError}</p>}
      {actionError && (
        <p className="adminusers-message is-error">{actionError}</p>
      )}
      {actionMessage && (
        <p className="adminusers-message is-success">{actionMessage}</p>
      )}

      {!loading && !loadError && users.length === 0 && (
        <p className="empty-text">Kullanıcı bulunamadı.</p>
      )}

      {!loading && users.length > 0 && (
        <table className="users-table">
          <thead>
            <tr>
              <th>E-posta</th>
              <th>Rol</th>
              <th>Onay</th>
              <th>Hesap</th>
              <th>İşlem</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td data-label="E-posta">{u.email}</td>
                <td data-label="Rol">
                  <span className={`role-badge role-${u.role}`}>
                    {getUiLabel(u.role)}
                  </span>
                </td>
                <td data-label="Onay">
                  <span className={`user-status-badge status-${u.status}`}>
                    {getUiLabel(u.status)}
                  </span>
                </td>
                <td data-label="Hesap">
                  <span
                    className={`account-status-badge ${
                      isRecordActive(u) ? "is-active" : "is-inactive"
                    }`}
                  >
                    {isRecordActive(u) ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td data-label="İşlem">
                  {Number(u.id) === Number(currentUser?.id) ? (
                    <span className="current-account-label">Mevcut hesap</span>
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
                        ? "Güncelleniyor..."
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
