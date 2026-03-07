// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("isLoggedIn") === "true";
  });

  // Add current user profile
  const [profileName, setProfileName] = useState(() => {
    return localStorage.getItem("profileName") || null;
  });

  const login = () => {
    setIsAuthenticated(true);
    localStorage.setItem("isLoggedIn", "true");
    
    // Update profile from localStorage
    const profile = localStorage.getItem("profileName");
    setProfileName(profile);
  };

  const logout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setProfileName(null);
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
    <AuthContext.Provider value={{ isAuthenticated, profileName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};