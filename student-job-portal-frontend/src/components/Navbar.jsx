import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav style={{ padding: 10, borderBottom: "1px solid #ccc" }}>
      <Link to="/">Home</Link>

      {!user && (
        <>
          {" | "}
          <Link to="/login">Login</Link>
          {" | "}
          <Link to="/register">Register</Link>
        </>
      )}

      {user?.role === "student" && (
        <>
          {" | "}
          <Link to="/student">Dashboard</Link>
          {" | "}
          <Link to="/student/jobs">Jobs</Link>
          {" | "}
          <Link to="/student/profile">Profile</Link>
        </>
      )}

      {user?.role === "employer" && (
        <>
          {" | "}
          <Link to="/employer">Dashboard</Link>
          {" | "}
          <Link to="/employer/job-post">Post Job</Link>
          {" | "}
          <Link to="/employer/applications">Applications</Link>
        </>
      )}

      {user?.role === "admin" && (
        <>
          {" | "}
          <Link to="/admin">Admin Dashboard</Link>
          {" | "}
          <Link to="/admin/employers">Verify Employers</Link>
          {" | "}
          <Link to="/admin/jobs">Jobs</Link>
        </>
      )}

      {user && (
        <>
          {" | "}
          <button onClick={handleLogout}>Logout</button>
        </>
      )}
    </nav>
  );
}
