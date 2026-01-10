import { Link, NavLink, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <nav className="navbar">
      
      {/* LEFT – LOGO */}
      <div className="nav-left">
        <Link to="/">StudentJob</Link>
      </div>


      {/* CENTER – ROLE LINKS */}
      <div className="nav-center">
        {!user && (
          <NavLink to="/" className="nav-link">
            Home
          </NavLink>
        )}{user?.role === "student" && (
          <>
            <NavLink
              to="/student"
              end
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Dashboard
            </NavLink>
        
            <NavLink
              to="/student/jobs"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Jobs
            </NavLink>
        
            <NavLink
              to="/student/profile"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Profile
            </NavLink>
        
            <NavLink
              to="/student/resumes"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              My Resumes
            </NavLink>
          </>
        )}
        
        
        {user?.role === "employer" && (
          <>
            <NavLink to="/employer" className="nav-link">
              Dashboard
            </NavLink>
            <NavLink to="/employer/job-post" className="nav-link">
              Post Job
            </NavLink>
            <NavLink to="/employer/applications" className="nav-link">
              Applications
            </NavLink>
          </>
        )}

        {user?.role === "admin" && (
          <>
            <NavLink to="/admin/dashboard" className="nav-link">
              Admin
            </NavLink>
            <NavLink to="/admin/users" className="nav-link">
              Users
            </NavLink>
            <NavLink to="/admin/jobs" className="nav-link">
              Jobs
            </NavLink>
          </>
        )}
      </div>

      {/* RIGHT – AUTH */}
      <div className="nav-right">
        {!user && (
          <>
            <Link to="/login">
              <button className="btn btn-outline">Login</button>
            </Link>
            <Link to="/register">
              <button className="btn btn-primary">Register</button>
            </Link>
          </>
        )}

        {user && (
          <button className="btn btn-danger" onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
