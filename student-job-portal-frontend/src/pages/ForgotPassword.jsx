import { useState } from "react";
import api from "../services/api";
import "../styles/Auth.css";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setResetLink("");
    setLoading(true);

    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMessage("Password reset link generated successfully ✅");
      setResetLink(res.data.resetLink);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate reset link ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Forgot Password</h2>

        <p className="auth-subtitle">
          Enter your email and we’ll generate a reset link.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="email"
            placeholder="Enter your email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {message && <p className="auth-success">{message}</p>}
        {error && <p className="auth-error">{error}</p>}

        {resetLink && (
          <p style={{ textAlign: "center", marginTop: "10px" }}>
            <a href={resetLink} target="_blank" rel="noreferrer">
              Click here to reset your password
            </a>
          </p>
        )}

        <p style={{ textAlign: "center", marginTop: "16px" }}>
          <Link to="/login" className="auth-link">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
