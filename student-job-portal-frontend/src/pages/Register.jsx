import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import {
  EMPLOYER_PENDING_APPROVAL_MESSAGE,
  REGISTRATION_EMAIL_DELIVERY_MESSAGE,
  getRegistrationEmailPresentation,
  isVerificationEmailDeliveryFailure,
} from "../utils/registrationError";
import "../styles/Auth.css";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [verificationRecovery, setVerificationRecovery] = useState(false);
  const [employerRegistered, setEmployerRegistered] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const emailPresentation = getRegistrationEmailPresentation(role);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setVerificationRecovery(false);
    setEmployerRegistered(false);
    setSubmitting(true);

    try {
      await api.post("/auth/register", {
        email,
        password,
        role,
        fullName,
        companyName: role === "employer" ? companyName : undefined,
      });
      if (role === "student") {
        navigate("/verify-email?sent=1", { state: { email: email.trim() } });
      } else {
        setPassword("");
        setEmployerRegistered(true);
      }
    } catch (err) {
      if (isVerificationEmailDeliveryFailure(err)) {
        setVerificationRecovery(true);
      } else {
        setError(err.response?.data?.message || "Kayıt başarısız");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-heading">
          <span>StudentJob’a katılın</span>
          <h1 className="auth-title">Hesabınızı Oluşturun</h1>
          <p>Rolünüzü seçin ve platformu kullanmaya başlayın.</p>
        </div>

        {!employerRegistered && (
          <form className="auth-form" onSubmit={handleRegister}>
            <label className="auth-field">
              <span>{role === "employer" ? "Yetkili Ad Soyad" : "Ad Soyad"}</span>
              <input
                className="auth-input"
                type="text"
                placeholder={role === "employer" ? "Yetkili kişinin adı ve soyadı" : "Adınız ve soyadınız"}
                value={fullName}
                required
                maxLength={150}
                autoComplete="name"
                onChange={(e) => setFullName(e.target.value)}
              />
            </label>

            {role === "employer" && (
              <label className="auth-field">
                <span>Şirket Adı</span>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Şirketinizin adı"
                  value={companyName}
                  required
                  maxLength={255}
                  autoComplete="organization"
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </label>
            )}

            <label className="auth-field">
              <span>E-posta</span>
              <input
                className="auth-input"
                type="email"
                placeholder={emailPresentation.placeholder}
                value={email}
                required
                autoComplete="email"
                aria-describedby={
                  role === "student" ? "student-email-help" : undefined
                }
                onChange={(e) => setEmail(e.target.value)}
              />
              {role === "student" && (
                <small id="student-email-help" className="auth-field-help">
                  {emailPresentation.hint}
                </small>
              )}
            </label>

            <label className="auth-field">
              <span>Parola</span>
              <input
                className="auth-input"
                type="password"
                placeholder="Bir parola oluşturun"
                value={password}
                required
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <fieldset className="role-fieldset">
              <legend>Kayıt rolü</legend>
              <div
                className="role-group role-group--custom"
                role="radiogroup"
                aria-label="Rol seçin"
              >
                <label className="role-pill">
                  <input
                    className="role-radio"
                    type="radio"
                    name="role"
                    value="student"
                    checked={role === "student"}
                    onChange={(e) => setRole(e.target.value)}
                  />
                  <span className="role-dot" aria-hidden="true" />
                  <span>Öğrenci</span>
                </label>

                <label className="role-pill">
                  <input
                    className="role-radio"
                    type="radio"
                    name="role"
                    value="employer"
                    checked={role === "employer"}
                    onChange={(e) => setRole(e.target.value)}
                  />
                  <span className="role-dot" aria-hidden="true" />
                  <span>İşveren</span>
                </label>
              </div>
            </fieldset>

            <button className="auth-button" type="submit" disabled={submitting}>
              {submitting ? "Hesap oluşturuluyor..." : "Kayıt Ol"}
            </button>
          </form>
        )}

        {error && <p className="auth-error">{error}</p>}

        {verificationRecovery && (
          <div className="auth-success" role="status">
            <p>{REGISTRATION_EMAIL_DELIVERY_MESSAGE}</p>
            <Link to="/verify-email" className="auth-link">
              Doğrulama e-postasını yeniden iste
            </Link>
          </div>
        )}

        {employerRegistered && (
          <div className="auth-success" role="status">
            <p>{EMPLOYER_PENDING_APPROVAL_MESSAGE}</p>
            <Link to="/login" className="auth-link">
              Giriş sayfasına geç
            </Link>
          </div>
        )}

        {!employerRegistered && (
          <p className="auth-switch">
            Zaten hesabınız var mı?{" "}
            <Link to="/login" className="forgot-link">
              Giriş Yap
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
