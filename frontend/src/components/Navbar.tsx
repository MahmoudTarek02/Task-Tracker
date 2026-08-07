import { useAuth } from "../App";
import api from "../services/api";
import { useNavigate } from "react-router";

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout failed on server:", err);
    } finally {
      logoutUser();
      navigate("/login");
    }
  };

  return (
    <header style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 20px",
      backgroundColor: "#fff",
      borderBottom: "1px solid #ddd",
      height: "60px",
      boxSizing: "border-box"
    }}>
      <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#333" }}>
        TaskTrack
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        {user && (
          <span style={{ fontSize: "0.95rem", color: "#666" }}>
            Logged in as: <strong>{user.name}</strong>
          </span>
        )}
        <button
          onClick={handleLogout}
          style={{
            padding: "6px 12px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.9rem"
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
