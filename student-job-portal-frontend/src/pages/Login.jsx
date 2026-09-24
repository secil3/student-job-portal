import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/useAuth";
import "../styles/Auth.css";

const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

const dashboardByRole = {
  admin: "/admin",
  employer: "/employer",
  student: "/student",
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [demoSubmitting, setDemoSubmitting] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const openSession = (data) => {
    login(data.user, data.token);
    navigate(dashboardByRole[data.user.role] || "/");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      openSession(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Giriş başarısız");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async (account) => {
    setError("");
    setDemoSubmitting(account);

    try {
      const res = await api.post("/auth/demo-login", { account });
      openSession(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Demo oturumu açılamadı");
    } finally {
      setDemoSubmitting("");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-heading">
          <span>Tekrar hoş geldiniz</span>
          <h1 className="auth-title">StudentJob’a Giriş Yapın</h1>
          <p>Panelinize erişin ve kaldığınız yerden devam edin.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>E-posta</span>
            <input
              className="auth-input"
              type="email"
              placeholder="eposta@example.com"
              value={email}
              required
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="auth-field">
            <span>Parola</span>
            <input
              className="auth-input"
              type="password"
              placeholder="Parolanızı girin"
              value={password}
              required
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <div className="login-extra">
            <Link to="/forgot-password" className="forgot-link">
              Parolanızı mı unuttunuz?
            </Link>
          </div>

          <button className="auth-button" type="submit" disabled={submitting}>
            {submitting ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        {error && <p className="auth-error">{error}</p>}

        {isDemoMode && (
          <section className="demo-login" aria-labelledby="demo-login-title">
            <div className="demo-login-heading">
              <h2 id="demo-login-title">Demoyu hızlıca keşfedin</h2>
              <p>Parola girmeden kurgusal demo hesaplarından biriyle devam edin.</p>
            </div>

            <div className="demo-login-actions">
              <button
                type="button"
                className="demo-login-button"
                disabled={Boolean(demoSubmitting)}
                onClick={() => handleDemoLogin("student")}
              >
                {demoSubmitting === "student" ? "Açılıyor..." : "Demo Öğrenci Olarak Gir"}
              </button>
              <button
                type="button"
                className="demo-login-button demo-login-button-secondary"
                disabled={Boolean(demoSubmitting)}
                onClick={() => handleDemoLogin("employer")}
              >
                {demoSubmitting === "employer" ? "Açılıyor..." : "Demo İşveren Olarak Gir"}
              </button>
              <button
                type="button"
                className="demo-admin-link"
                disabled={Boolean(demoSubmitting)}
                onClick={() => handleDemoLogin("admin")}
              >
                {demoSubmitting === "admin" ? "Açılıyor..." : "Yönetici demosu"}
              </button>
            </div>
          </section>
        )}

        <p className="auth-switch">
          Hesabınız yok mu?{" "}
          <Link to="/register" className="forgot-link">
            Kayıt Ol
          </Link>
        </p>
      </div>
    </div>
  );
}
