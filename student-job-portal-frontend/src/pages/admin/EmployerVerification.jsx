import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import {
  getEmployerVerificationView,
  removeEmployerFromPendingList,
} from "../../utils/employerVerificationState";
import "../../styles/EmployerVerification.css";

export default function EmployerVerification() {
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [updatingEmployerId, setUpdatingEmployerId] = useState(null);

  const fetchEmployers = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.get("/admin/employers/pending");
      setEmployers(Array.isArray(res.data) ? res.data : []);
    } catch (requestError) {
      setLoadError(
        requestError.response?.data?.message ||
          "Bekleyen işverenler yüklenemedi. Lütfen tekrar deneyin."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployers();
  }, [fetchEmployers]);

  const updateStatus = async (id, status) => {
    if (updatingEmployerId !== null) return;

    setActionError("");
    setActionMessage("");
    setUpdatingEmployerId(id);
    try {
      await api.patch(`/admin/employers/${id}`, { status });
      setEmployers((current) => removeEmployerFromPendingList(current, id));
      setActionMessage(
        status === "approved"
          ? "İşveren hesabı onaylandı."
          : "İşveren hesabı reddedildi."
      );
    } catch (requestError) {
      setActionError(
        requestError.response?.data?.message ||
          "İşveren durumu güncellenemedi. Lütfen tekrar deneyin."
      );
    } finally {
      setUpdatingEmployerId(null);
    }
  };

  const view = getEmployerVerificationView({ loading, loadError, employers });

  return (
    <div className="verify-container">
      <header className="verify-header">
        <span>Hesap inceleme</span>
        <h1 className="verify-title">İşveren Onayları</h1>
        <p>Platform erişimi bekleyen işveren hesaplarını onaylayın veya reddedin.</p>
      </header>

      {actionError && (
        <p className="verify-message verify-message--error">{actionError}</p>
      )}
      {actionMessage && (
        <p className="verify-message verify-message--success">
          {actionMessage}
        </p>
      )}

      {view === "loading" && (
        <p className="loading-text">Bekleyen işverenler yükleniyor...</p>
      )}

      {view === "error" && (
        <div className="verify-message verify-message--error verify-retry">
          <span>{loadError}</span>
          <button type="button" onClick={fetchEmployers}>
            Tekrar dene
          </button>
        </div>
      )}

      {view === "empty" && (
        <p className="empty-text">Bekleyen işveren yok.</p>
      )}

      {view === "list" && (
        <div className="verify-list">
          {employers.map((emp) => (
            <div key={emp.id} className="verify-card">
              <div className="verify-info">
                {emp.company_name && (
                  <>
                    <span>Şirket</span>
                    <strong>{emp.company_name}</strong>
                  </>
                )}
                <span>İşveren e-postası</span>
                <strong>{emp.email}</strong>
              </div>

              <div className="verify-actions">
                <button
                  className="approve-btn"
                  onClick={() => updateStatus(emp.id, "approved")}
                  disabled={updatingEmployerId !== null}
                >
                  {updatingEmployerId === emp.id ? "İşleniyor..." : "Onayla"}
                </button>

                <button
                  className="reject-btn"
                  onClick={() => updateStatus(emp.id, "rejected")}
                  disabled={updatingEmployerId !== null}
                >
                  {updatingEmployerId === emp.id ? "İşleniyor..." : "Reddet"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
