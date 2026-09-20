import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/useAuth";
import "../styles/Auth.css";


export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      login(res.data.user, res.data.token);

      if (res.data.user.role === "admin") {
        navigate("/admin");
      } else if (res.data.user.role === "employer") {
        navigate("/employer");
      } else {
        navigate("/student");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-heading">
          <span>Welcome back</span>
          <h1 className="auth-title">Login to StudentJob</h1>
          <p>Access your dashboard and continue where you left off.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
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
              placeholder="Enter your password"
              value={password}
              required
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {/* Forgot password link */}
          <div className="login-extra">
            <Link to="/forgot-password" className="forgot-link">
              Forgot password?
            </Link>
          </div>

          <button className="auth-button" type="submit" disabled={submitting}>
            {submitting ? "Logging in..." : "Login"}
          </button>
        </form>

        {error && <p className="auth-error">{error}</p>}

        {/* Register link */}
        <p className="auth-switch">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="forgot-link">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
