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

  const [mustChangePassword, setMustChangePassword] = useState(() => {
    return sessionStorage.getItem("must_change_password") === "1";
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

    // Sync mustChangePassword into context on every login
    setMustChangePassword(sessionStorage.getItem("must_change_password") === "1");
  };

  const clearMustChangePassword = () => {
    sessionStorage.removeItem("must_change_password");
    setMustChangePassword(false);
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (err) {
      console.warn("Backend logout failed, still clearing local state", err);
    } finally {
      const darkMode = localStorage.getItem("darkMode");
      localStorage.clear();

      if (darkMode !== null) {
      localStorage.setItem("darkMode", darkMode);
    }
      sessionStorage.removeItem("must_change_password");
      setIsAuthenticated(false);
      setProfileName(null);
      setMustChangePassword(false);
    }
  };

  const setAuth = ({ isAuthenticated, profileName }) => {
    setIsAuthenticated(isAuthenticated);
    setProfileName(profileName);
  };

  useEffect(() => {
    setLogoutHandler(() => {
      const darkMode = localStorage.getItem("darkMode");

      localStorage.clear();

      if (darkMode !== null) {
      localStorage.setItem("darkMode", darkMode);
    }
      sessionStorage.removeItem("must_change_password");
      setIsAuthenticated(false);
      setProfileName(null);
      setMustChangePassword(false);
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
    <AuthContext.Provider
      value={{
        isAuthenticated,
        profileName,
        mustChangePassword,
        login,
        logout,
        setAuth,
        clearMustChangePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};