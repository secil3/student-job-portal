import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={{ padding: "40px" }}>
      <h1>Student Job Portal</h1>
      <p>
        A platform where students can find job opportunities and employers
        can post and manage job listings.
      </p>

      <div style={{ marginTop: "20px" }}>
        <Link to="/login">
          <button>Login</button>
        </Link>

        <Link to="/register">
          <button style={{ marginLeft: "10px" }}>Register</button>
        </Link>
      </div>
    </div>
  );
}
