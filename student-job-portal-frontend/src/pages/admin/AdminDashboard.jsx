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
        setError("Panel verileri yüklenemedi.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="admin-container">
      <header className="admin-page-header">
        <span>Platform özeti</span>
        <h1 className="page-title">Yönetici Paneli</h1>
        <p>Platform etkinliğini izleyin ve temel yönetim araçlarına erişin.</p>
      </header>

      {loading && <p className="admin-state-message">Yönetici paneli yükleniyor...</p>}
      {!loading && error && <p className="admin-state-message error">{error}</p>}

      {/* === STATS === */}
      {!loading && !error && stats && <div className="stats-grid">
        <div className="stat-card">
          <span>Toplam Öğrenci</span>
          <strong>{stats.students}</strong>
        </div>

        <div className="stat-card">
          <span>Toplam İşveren</span>
          <strong>{stats.employers}</strong>
        </div>

        <div className="stat-card">
          <span>Toplam İlan</span>
          <strong>{stats.jobs}</strong>
        </div>

        <div className="stat-card">
          <span>Toplam Başvuru</span>
          <strong>{stats.applications}</strong>
        </div>
      </div>}

      {/* === QUICK ACTIONS === */}
      {!loading && !error && <section className="admin-quick-section">
        <div className="admin-section-heading">
          <span>Yönetim</span>
          <h2>Hızlı işlemler</h2>
        </div>
        <div className="admin-actions">
        <Link to="/admin/employers" className="action-card">
          <strong>İşveren Onayları</strong>
          <span>Bekleyen işveren hesaplarını inceleyin</span>
        </Link>

        <Link to="/admin/jobs" className="action-card">
          <strong>İlanları Yönet</strong>
          <span>Mevcut ilanları inceleyin</span>
        </Link>

        <Link to="/admin/users" className="action-card">
          <strong>Kullanıcıları Görüntüle</strong>
          <span>Kayıtlı platform hesaplarını görün</span>
        </Link>
        </div>
      </section>}
    </div>
  );
}
