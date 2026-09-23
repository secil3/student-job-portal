import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { getTheme, setThemePreference, subscribeToTheme } from "../utils/theme";
import "../styles/Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const theme = useSyncExternalStore(subscribeToTheme, getTheme, () => "light");
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navbarRef = useRef(null);
  const accountMenuRef = useRef(null);
  const accountButtonRef = useRef(null);
  const mobileButtonRef = useRef(null);
  const dashboardPath = {
    student: "/student",
    employer: "/employer",
    admin: "/admin/dashboard",
  }[user?.role];
  const roleLabel = {
    student: "Öğrenci",
    employer: "İşveren",
    admin: "Yönetici",
  }[user?.role];
  const navLinkClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  useEffect(() => {
    if (!isAccountMenuOpen && !isMobileMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (isAccountMenuOpen && !accountMenuRef.current?.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
      if (isMobileMenuOpen && !navbarRef.current?.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (isAccountMenuOpen) {
          setIsAccountMenuOpen(false);
          accountButtonRef.current?.focus();
        } else if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
          mobileButtonRef.current?.focus();
        }
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAccountMenuOpen, isMobileMenuOpen]);

  const handleLogout = () => {
    setIsAccountMenuOpen(false);
    setIsMobileMenuOpen(false);
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar" ref={navbarRef} aria-label="Ana gezinme">
      <div className="nav-left">
        <Link to="/" className="nav-brand" aria-label="StudentJob ana sayfa">
          <span className="nav-brand-mark" aria-hidden="true">S</span>
          <span>StudentJob</span>
        </Link>
      </div>

      <button
        ref={mobileButtonRef}
        type="button"
        className="nav-mobile-trigger"
        aria-label={isMobileMenuOpen ? "Menüyü kapat" : "Gezinme menüsü"}
        aria-expanded={isMobileMenuOpen}
        aria-controls="navbar-links"
        onClick={() => {
          setIsAccountMenuOpen(false);
          setIsMobileMenuOpen((open) => !open);
        }}
      >
        <span aria-hidden="true">{isMobileMenuOpen ? "×" : "☰"}</span>
      </button>

      <div
        id="navbar-links"
        className={`nav-center${isMobileMenuOpen ? " nav-center-open" : ""}`}
        aria-label="Birincil gezinme"
        onClick={(event) => {
          if (event.target.closest("a")) setIsMobileMenuOpen(false);
        }}
      >
        <div className="nav-public-links">
          <NavLink to="/" end className={navLinkClass}>
            Ana Sayfa
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            Hakkımızda
          </NavLink>
        </div>

        {user && <div className="nav-role-links">
        {user?.role === "student" && (
          <>
            <NavLink to="/student" end className={navLinkClass}>
              Panel
            </NavLink>

            <NavLink to="/student/jobs" className={navLinkClass}>
              İlanlar
            </NavLink>

            <NavLink to="/student/applications" className={navLinkClass}>
              Başvurularım
            </NavLink>

            <NavLink to="/student/profile" className={navLinkClass}>
              Profil
            </NavLink>

            <NavLink to="/student/resumes" className={navLinkClass}>
              CV’lerim
            </NavLink>
          </>
        )}

        {user?.role === "employer" && (
          <>
            <NavLink to="/employer" end className={navLinkClass}>
              Panel
            </NavLink>
            <NavLink to="/employer/job-post" className={navLinkClass}>
              İlan Oluştur
            </NavLink>
          </>
        )}

        {user?.role === "admin" && (
          <>
            <NavLink to="/admin/dashboard" className={navLinkClass}>
              Yönetim
            </NavLink>
            <NavLink to="/admin/users" className={navLinkClass}>
              Kullanıcılar
            </NavLink>
            <NavLink to="/admin/jobs" className={navLinkClass}>
              İlanlar
            </NavLink>
            <NavLink to="/admin/employers" className={navLinkClass}>
              İşveren Onayları
            </NavLink>
          </>
        )}
        </div>}
        {!user && (
          <div className="nav-mobile-auth">
            <Link to="/login" className="nav-link">Giriş Yap</Link>
            <Link to="/register" className="nav-link">Kayıt Ol</Link>
          </div>
        )}
      </div>

      <div className="nav-right">
        <button
          type="button"
          className="nav-theme-toggle"
          aria-label={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
          aria-pressed={theme === "dark"}
          title={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
          onClick={() => setThemePreference(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <path d="M20.5 15.4A8.5 8.5 0 0 1 8.6 3.5 8.5 8.5 0 1 0 20.5 15.4Z" />
            </svg>
          )}
        </button>
        {!user && (
          <>
            <Link to="/login" className="btn btn-outline">Giriş Yap</Link>
            <Link to="/register" className="btn btn-primary">Kayıt Ol</Link>
          </>
        )}

        {user && (
          <div className="account-menu" ref={accountMenuRef}>
            <button
              ref={accountButtonRef}
              type="button"
              className="account-menu-trigger"
              aria-expanded={isAccountMenuOpen}
              aria-controls="navbar-account-menu"
              aria-label="Hesap menüsü"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsAccountMenuOpen((open) => !open);
              }}
            >
              <span className="account-avatar" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5 20c0-3.5 2.8-6 7-6s7 2.5 7 6" />
                </svg>
              </span>
              <span className="account-label">Hesap</span>
              <span className="account-chevron" aria-hidden="true">⌄</span>
            </button>

            {isAccountMenuOpen && (
              <div
                id="navbar-account-menu"
                className="account-menu-panel"
              >
                <div className="account-menu-role">{roleLabel}</div>
                {dashboardPath && (
                  <Link
                    to={dashboardPath}
                    className="account-menu-item"
                    onClick={() => setIsAccountMenuOpen(false)}
                  >
                    Panel
                  </Link>
                )}
                <button
                  type="button"
                  className="account-menu-item account-menu-logout"
                  onClick={handleLogout}
                >
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
