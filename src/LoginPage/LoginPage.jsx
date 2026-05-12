// src/pages/AuthPage.jsx (or LoginPage.jsx)
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LoginPage.module.css";
import logo from "../assets/cplogo.png";
import meter from "../assets/meter.svg";
import scope from "../assets/scope.svg";
import reff from "../assets/refresh.png";
import { loginUser, renewToken, forgetPassword } from "../Api/Api";
import { useAuth } from "../Contexts/AuthContext";
import doctor from "../assets/doc.png";

const ALLOWED_PROFILE_NAMES = [
  "admin",
  "spradmin",
  "frontdesk",
  "nurse",
  "pharmacy",
  "labtech",
  "accounts",
  "doctor",
];

const LockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={styles.icon}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={styles.icon}
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={styles.icon}
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a21.5 21.5 0 0 1 5.06-6.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a21.5 21.5 0 0 1-2.16 3.19m-6.84-1A3 3 0 0 0 9 12a3 3 0 0 0 3 3 3 3 0 0 0 3-3" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const SunIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

// Reusable CAPTCHA Component
const Captcha = ({ canvasRef, answer, setAnswer, onRefresh, isLoading, refreshIcon }) => (
  <div className={styles.captchaContainer}>
    <canvas ref={canvasRef} width={150} height={60} className={styles.captcha} />
    <input
      type="number"
      value={answer}
      onChange={(e) => setAnswer(e.target.value)}
      required
      placeholder="Enter answer"
    />
    <div className={styles.reff}>
      <img
        src={refreshIcon}
        alt="Refresh CAPTCHA"
        className={styles.refreshCaptcha}
        onClick={onRefresh}
        style={{
          cursor: isLoading ? "not-allowed" : "pointer",
          opacity: isLoading ? 0.7 : 1,
          width: "24px",
          height: "24px",
        }}
      />
    </div>
  </div>
);

const LoginPage = () => {
  const [mode, setMode] = useState("login"); // "login" | "reset"
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [resetData, setResetData] = useState({ email: "" });

  const [showPassword, setShowPassword] = useState({ login: false });
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [isResetSuccess, setIsResetSuccess] = useState(false);

  // Dark mode state — reads from localStorage on mount
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  const navigate = useNavigate();
  const { login, logout } = useAuth();

  // Apply / remove dark-mode class on body whenever darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // CAPTCHA state for each mode
  const [captcha, setCaptcha] = useState({
    login: { answer: "", correct: 0 },
    reset: { answer: "", correct: 0 },
  });

  const canvasRef = useRef(null);

  useEffect(() => {
    handleRefreshToken();
  }, []);

  const getProfileName = (data) => {
    return data?.PROFILE_NAME || data?.profileName || "";
  };

  const isAllowedProfile = (profileName) => {
    return ALLOWED_PROFILE_NAMES.includes(profileName.trim().toLowerCase());
  };

  const showProfileMissingError = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn("Logout failed while handling missing profile name:", err);
    }

    setIsResetSuccess(false);
    setPopupMessage("Profile Name Not defined for your Account");
    setShowPopup(true);
  };

  const showProfileInvalidError = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn("Logout failed while handling invalid profile name:", err);
    }

    setIsResetSuccess(false);
    setPopupMessage("Profile Name does not match any allowed role for your Account");
    setShowPopup(true);
  };

  const handleRefreshToken = async () => {
    setIsLoading(true);
    try {
      const result = await renewToken();
      console.log("Refresh token result:", result);
      if (result.success) {
        const profileName = getProfileName(result);

        if (!profileName.trim()) {
          await showProfileMissingError();
          return;
        }

        if (!isAllowedProfile(profileName)) {
          await showProfileInvalidError();
          return;
        }

        console.log("Silent token refresh successful");

        localStorage.setItem("login_timestamp", Date.now().toString());
        console.log("Updated login_timestamp after silent refresh");

        login(result);
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      console.log("Silent refresh failed (normal if session expired):", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateCaptcha(mode);
  }, [mode]);

  const generateCaptcha = (targetMode) => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const correct = num1 + num2;

    setCaptcha((prev) => ({
      ...prev,
      [targetMode]: { answer: "", correct },
    }));

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(0,0,0,${Math.random() * 0.5})`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    const text = `${num1} + ${num2} = ?`;
    ctx.font = "24px Verdana";
    ctx.fillStyle = "black";
    const skewX = Math.random() * 0.2 - 0.1;
    const skewY = Math.random() * 0.2 - 0.1;
    const shiftX = Math.random() * 10;
    const shiftY = Math.random() * 10;
    ctx.setTransform(1, skewY, skewX, 1, shiftX, shiftY);
    ctx.fillText(text, 20, 40);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };

  const validateCaptcha = (modeKey) => {
    const { answer, correct } = captcha[modeKey];
    if (Number(answer) !== correct) {
      setIsResetSuccess(false);
      setPopupMessage("CAPTCHA answer is incorrect. Please try again.");
      setShowPopup(true);
      generateCaptcha(modeKey);
      return false;
    }
    return true;
  };

  const handleLoginChange = (e) => setLoginData({ ...loginData, [e.target.name]: e.target.value });
  const handleResetChange = (e) => setResetData({ ...resetData, [e.target.name]: e.target.value });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!validateCaptcha("login")) {
      setError("Please complete the captcha");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { success, data } = await loginUser(
        loginData.username,
        loginData.password,
      );

      if (success) {
        const profileName = getProfileName(data);

        if (!profileName.trim()) {
          await showProfileMissingError();
          generateCaptcha("login");
          return;
        }

        if (!isAllowedProfile(profileName)) {
          await showProfileInvalidError();
          generateCaptcha("login");
          return;
        }

        localStorage.setItem("login_timestamp", Date.now().toString());
        console.log("Saving login_timestamp:", localStorage.getItem("login_timestamp"));
        login(data);
        navigate("/dashboard", { replace: true });
      } else {
        setIsResetSuccess(false);
        setPopupMessage(data?.message || "Invalid credentials");
        setShowPopup(true);
        generateCaptcha("login");
      }
    } catch (err) {
      console.error("Login failed:", err);

      setIsResetSuccess(false);

      const backendMessage =
        err?.message ||
        err?.response?.data?.message ||
        "Login failed";

      setPopupMessage(backendMessage);
      setShowPopup(true);

      generateCaptcha("login");
      setError(backendMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!validateCaptcha("reset")) return;

    setIsLoading(true);
    try {
      const result = await forgetPassword(resetData.email, resetData.email);
      setIsResetSuccess(true);
      setPopupMessage(result.message || "Mail Sent Successfully");
      setShowPopup(true);
    } catch (err) {
      setIsResetSuccess(false);
      setPopupMessage(err.message || "Failed to send reset email. Please try again.");
      setShowPopup(true);
      generateCaptcha("reset");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePopupOk = () => {
    setShowPopup(false);
    if (isResetSuccess) {
      setResetData({ email: "" });
      setIsResetSuccess(false);
      setMode("login");
    }
  };

  const goToLogin = () => setMode("login");
  const goToReset = () => setMode("reset");

  return (
    <div className={styles.main}>
      <div className={styles.loginContainer}>
        {/* Dark Mode Toggle Button */}
        <button
          className={styles.darkToggleBtn}
          onClick={toggleDarkMode}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <SunIcon /> : <MoonIcon />}
        </button>

        <div className={styles.loginCard}>
          {/* LEFT FORM PANEL */}
          <div className={styles.formPanel}>
            <div className={styles.formHeader}>
              <h1>Clinic Pro</h1>
              <p>
                {mode === "login" && "Welcome back. Sign in to continue."}
                {mode === "reset" && "Recover your password."}
              </p>
            </div>

            {mode === "login" && (
              <form onSubmit={handleLoginSubmit} className={styles.loginForm}>
                <div className={styles.inputGroup}>
                  <input type="text" name="username" value={loginData.username} onChange={handleLoginChange} required placeholder="User Name" />
                </div>

                <div className={`${styles.inputGroup} ${styles.passwordWrapper}`}>
                  <input
                    type={showPassword.login ? "text" : "password"}
                    name="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    required
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    className={styles.eyeToggle}
                    onClick={() => setShowPassword({ ...showPassword, login: !showPassword.login })}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {showPassword.login ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>

                <Captcha
                  canvasRef={canvasRef}
                  answer={captcha.login.answer}
                  setAnswer={(val) =>
                    setCaptcha((prev) => ({
                      ...prev,
                      login: { ...prev.login, answer: val },
                    }))
                  }
                  onRefresh={() => generateCaptcha("login")}
                  isLoading={isLoading}
                  refreshIcon={reff}
                />

                <button type="submit" className={styles.loginBtn} disabled={isLoading}>
                  <LockIcon />
                  <span>{isLoading ? "Signing in..." : "Login Securely"}</span>
                </button>

                <p className={styles.forgotLink} onClick={goToReset} style={{ cursor: "pointer", marginTop: "22px" }}>
                  Forgot password?
                </p>
              </form>
            )}

            {mode === "reset" && (
              <form onSubmit={handleResetSubmit} className={styles.loginForm}>
                <div className={styles.inputGroup}>
                  <input
                    type="email"
                    name="email"
                    value={resetData.email}
                    onChange={handleResetChange}
                    required
                    placeholder="Email Address"
                  />
                </div>

                <Captcha
                  canvasRef={canvasRef}
                  answer={captcha.reset.answer}
                  setAnswer={(val) =>
                    setCaptcha((prev) => ({
                      ...prev,
                      reset: { ...prev.reset, answer: val },
                    }))
                  }
                  onRefresh={() => generateCaptcha("reset")}
                  isLoading={isLoading}
                  refreshIcon={reff}
                />

                <button type="submit" className={styles.loginBtn} disabled={isLoading}>
                  <span>{isLoading ? "Sending..." : "Get Password"}</span>
                </button>

                <p className={styles.forgotLink} style={{ marginTop: "16px" }}>
                  Remembered? <span onClick={goToLogin} className={styles.toggleLink}>Back to Login</span>
                </p>
              </form>
            )}
            <img src={doctor} alt="doctor" className={styles.doctor} />
          </div>

          {/* RIGHT PROMO PANEL */}
          <div className={styles.promoPanel}>
            <div className={styles.promoContent}>
              <img src={logo} alt="Clinic Pro" className={styles.logo} />
              <h2>
                {mode === "login" && "Welcome to Clinic Pro"}
                {mode === "reset" && "Need help?"}
              </h2>
              <p>
                {mode === "login" && "Manage patients, staff, and operations with intelligent, secure tools."}
                {mode === "reset" && "Enter your email and we'll send you a reset link."}
              </p>
            </div>
            <div className={styles.circle1}></div>
            <div className={styles.circle2}></div>
          </div>
        </div>
      </div>

      <img src={scope} className={styles.scope} alt="scope decoration" />
      <img src={meter} className={styles.meter} alt="meter decoration" />

      {showPopup && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <p>{popupMessage}</p>
            <button
              className={styles.modalButton}
              onClick={handlePopupOk}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#218838")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#28a745")}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;