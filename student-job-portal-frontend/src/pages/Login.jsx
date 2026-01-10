import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import "../styles/Auth.css";


export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      if (res.data.user.role === "admin") {
        navigate("/admin");
      } else if (res.data.user.role === "employer") {
        navigate("/employer");
      } else {
        navigate("/student");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Login</h2>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="email"
            placeholder="Email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Forgot password link */}
          <div className="login-extra">
            <Link to="/forgot-password" className="forgot-link">
              Forgot password?
            </Link>
          </div>

          <button className="auth-button" type="submit">
            Login
          </button>
        </form>

        {error && <p className="auth-error">{error}</p>}

        {/* Register link */}
        <p style={{ textAlign: "center", marginTop: "14px", fontSize: "14px" }}>
          Don&apos;t have an account?{" "}
          <Link to="/register" className="forgot-link">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
