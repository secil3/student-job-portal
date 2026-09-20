import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const accountButtonRef = useRef(null);
  const navLinkClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  useEffect(() => {
    if (!isAccountMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
        accountButtonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAccountMenuOpen]);

  const handleLogout = () => {
    setIsAccountMenuOpen(false);
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="nav-brand" aria-label="StudentJob home">
          <span className="nav-brand-mark" aria-hidden="true">S</span>
          <span>StudentJob</span>
        </Link>
      </div>

      <div className="nav-center" aria-label="Primary navigation">
        {!user && (
          <NavLink to="/" className={navLinkClass}>
            Home
          </NavLink>
        )}{user?.role === "student" && (
          <>
            <NavLink to="/student" end className={navLinkClass}>
              Dashboard
            </NavLink>

            <NavLink to="/student/jobs" className={navLinkClass}>
              Jobs
            </NavLink>

            <NavLink to="/student/applications" className={navLinkClass}>
              My Applications
            </NavLink>

            <NavLink to="/student/profile" className={navLinkClass}>
              Profile
            </NavLink>

            <NavLink to="/student/resumes" className={navLinkClass}>
              My Resumes
            </NavLink>
          </>
        )}

        {user?.role === "employer" && (
          <>
            <NavLink to="/employer" end className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/employer/job-post" className={navLinkClass}>
              Post Job
            </NavLink>
          </>
        )}

        {user?.role === "admin" && (
          <>
            <NavLink to="/admin/dashboard" className={navLinkClass}>
              Admin
            </NavLink>
            <NavLink to="/admin/users" className={navLinkClass}>
              Users
            </NavLink>
            <NavLink to="/admin/jobs" className={navLinkClass}>
              Jobs
            </NavLink>
          </>
        )}
      </div>

      <div className="nav-right">
        {!user && (
          <>
            <Link to="/login" className="btn btn-outline">Login</Link>
            <Link to="/register" className="btn btn-primary">Register</Link>
          </>
        )}

        {user && (
          <div className="account-menu" ref={accountMenuRef}>
            <button
              ref={accountButtonRef}
              type="button"
              className="account-menu-trigger"
              aria-haspopup="menu"
              aria-expanded={isAccountMenuOpen}
              aria-controls="navbar-account-menu"
              onClick={() => setIsAccountMenuOpen((open) => !open)}
            >
              <span className="account-avatar" aria-hidden="true">
                {user.role.charAt(0).toUpperCase()}
              </span>
              <span className="account-label">Account</span>
              <span className="account-chevron" aria-hidden="true">⌄</span>
            </button>

            {isAccountMenuOpen && (
              <div
                id="navbar-account-menu"
                className="account-menu-panel"
                role="menu"
              >
                <div className="account-menu-role">{user.role}</div>
                <button
                  type="button"
                  className="account-menu-item account-menu-logout"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
