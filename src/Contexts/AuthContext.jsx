// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { logout as apiLogout } from "../Api/Api";
import { setLogoutHandler } from "../Api/ApiConfiguration";

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
    const profile =
      data?.PROFILE_NAME ||
      data?.profileName ||
      localStorage.getItem("profileName") ||
      null;

    setIsAuthenticated(true);
    setProfileName(profile);
    localStorage.setItem("isLoggedIn", "true");

    if (profile) {
      localStorage.setItem("profileName", profile);
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (err) {
      console.warn("Backend logout failed, still clearing local state", err);
    } finally {
      // Clear all session keys so no stale data persists into the next login
      localStorage.clear();
      setIsAuthenticated(false);
      setProfileName(null);
    }
  };

  const setAuth = ({ isAuthenticated, profileName }) => {
    setIsAuthenticated(isAuthenticated);
    setProfileName(profileName);
  };

  // Wire the axios interceptor to React auth state.
  // When the interceptor exhausts renewal retries it calls this to trigger logout
  // without needing access to React context itself.
  useEffect(() => {
    setLogoutHandler(() => {
      localStorage.clear();
      setIsAuthenticated(false);
      setProfileName(null);
      // Navigation is handled by PrivateRoute reacting to isAuthenticated = false
    });
    return () => setLogoutHandler(null);
  }, []);

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
