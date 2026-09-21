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
      await api.post("/auth/register", { email, password, role });
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
        setError(err.response?.data?.message || "Register failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-heading">
          <span>Join StudentJob</span>
          <h1 className="auth-title">Create your account</h1>
          <p>Choose your role and get started with the platform.</p>
        </div>

        {!employerRegistered && (
          <form className="auth-form" onSubmit={handleRegister}>
            <label className="auth-field">
              <span>Email</span>
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
              <span>Password</span>
              <input
                className="auth-input"
                type="password"
                placeholder="Create a password"
                value={password}
                required
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <fieldset className="role-fieldset">
              <legend>Register as</legend>
              <div
                className="role-group role-group--custom"
                role="radiogroup"
                aria-label="Select role"
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
                  <span>Student</span>
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
                  <span>Employer</span>
                </label>
              </div>
            </fieldset>

            <button className="auth-button" type="submit" disabled={submitting}>
              {submitting ? "Creating account..." : "Register"}
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
              Login sayfasına geç
            </Link>
          </div>
        )}

        {!employerRegistered && (
          <p className="auth-switch">
            Already have an account?{" "}
            <Link to="/login" className="forgot-link">
              Login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
