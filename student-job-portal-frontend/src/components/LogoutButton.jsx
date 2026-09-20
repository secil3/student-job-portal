import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "../styles/LogoutButton.css";

export default function LogoutButton() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <button className="logout-btn" onClick={handleLogout}>
      Logout
    </button>
  );
}
