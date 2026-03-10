// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { logout as apiLogout } from "../Api/Api"; 

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("isLoggedIn") === "true";
  });

  const [profileName, setProfileName] = useState(() => {
    return localStorage.getItem("profileName") || null;
  });

  const login = (data) => {
    const profile = data?.PROFILE_NAME || localStorage.getItem("profileName");
    setIsAuthenticated(true);
    setProfileName(profile);
    localStorage.setItem("isLoggedIn", "true");
  };

  const logout = async () => {
    try {
      await apiLogout();       
    } catch (err) {
      console.warn("Backend logout failed, still clearing local state", err);
    } finally {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("profileName");
      localStorage.removeItem("sessionRef");
      setIsAuthenticated(false);
      setProfileName(null);
    }
  };

  const setAuth = ({ isAuthenticated, profileName }) => {
    setIsAuthenticated(isAuthenticated);
    setProfileName(profileName);
  };

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(localStorage.getItem("isLoggedIn") === "true");
      setProfileName(localStorage.getItem("profileName"));
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, profileName, login, logout, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};