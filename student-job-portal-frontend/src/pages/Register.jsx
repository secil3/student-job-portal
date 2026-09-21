import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import "../styles/Auth.css";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await api.post("/auth/register", { email, password, role });
      if (role === "student") {
        navigate("/verify-email?sent=1", { state: { email: email.trim() } });
      } else {
        navigate("/login");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Register failed");
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

        <form className="auth-form" onSubmit={handleRegister}>
          <label className="auth-field">
            <span>Email</span>
            <input
              className="auth-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              required
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
            />
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
            <div className="role-group role-group--custom" role="radiogroup" aria-label="Select role">
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

        {error && <p className="auth-error">{error}</p>}

        <p className="auth-switch">
          Already have an account?{" "}
          <Link to="/login" className="forgot-link">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
