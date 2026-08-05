import { useNavigate } from "react-router";
import api from "../services/api";
import { useAuth } from "../App";

export default function Dashboard() {
  const navigate = useNavigate();
  const { logoutUser } = useAuth();

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
    <div style={{ maxWidth: "600px", margin: "50px auto", padding: "20px", textAlign: "center", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h1>Dashboard</h1>
      <p style={{ margin: "20px 0", fontSize: "1.2rem", color: "#555" }}>
        Welcome to your personal task tracker dashboard.
      </p>
      <button onClick={handleLogout} style={{ padding: "10px 20px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "1rem" }}>
        Logout
      </button>
    </div>
  );
}
