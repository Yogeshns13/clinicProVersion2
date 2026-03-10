// pages/Logout.jsx   (or components/Logout.jsx)
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Contexts/AuthContext";

export default function Logout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout();                    
        navigate("/", { replace: true });  
      } catch (error) {
        console.error("Logout error:", error);
        navigate("/", { replace: true });  
      }
    };

    performLogout();
  }, [logout, navigate]);

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2>Logging out...</h2>
      <p>Please wait a moment. You will be redirected shortly.</p>

    </div>
  );
}