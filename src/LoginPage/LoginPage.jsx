// src/pages/AuthPage.jsx (or LoginPage.jsx)
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import logo from "../assets/cplogo.png";
import meter from "../assets/meter.svg";
import scope from "../assets/scope.svg";
import reff from "../assets/refresh.png";
import { loginUser, renewToken, getClinicList, forgetPassword } from "../Api/Api";
import { useAuth } from "../Contexts/AuthContext";
import doctor from "../assets/doc.png";

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
    className="icon"
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
    className="icon"
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
    className="icon"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a21.5 21.5 0 0 1 5.06-6.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a21.5 21.5 0 0 1-2.16 3.19m-6.84-1A3 3 0 0 0 9 12a3 3 0 0 0 3 3 3 3 0 0 0 3-3" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

// Reusable CAPTCHA Component
const Captcha = ({ canvasRef, answer, setAnswer, onRefresh, isLoading, refreshIcon }) => (
  <div className="captcha-container">
    <canvas ref={canvasRef} width={150} height={60} className="captcha" />
    <input
      type="number"
      value={answer}
      onChange={(e) => setAnswer(e.target.value)}
      required
      placeholder="Enter answer"
    />
    <div className="reff">
      <img
        src={refreshIcon}
        alt="Refresh CAPTCHA"
        className="refresh-captcha"
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

  const navigate = useNavigate();
  const { login } = useAuth();

  // CAPTCHA state for each mode
  const [captcha, setCaptcha] = useState({
    login: { answer: "", correct: 0 },
    reset: { answer: "", correct: 0 },
  });

  const canvasRef = useRef(null);

  useEffect(() => {
    handleRefreshToken();
  }, []);

  const handleRefreshToken = async () => {
    setIsLoading(true);
    try {
      const result = await renewToken();
      console.log("Refresh token result:", result);
      if (result.success) {
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
        console.log("Login Successful:", data);

        localStorage.setItem("login_timestamp", Date.now().toString());
        console.log("Saving login_timestamp:", localStorage.getItem("login_timestamp"));

        // ────────────────────────────────────────────────
        // Added: Call getClinicList() right after successful login
        await getClinicList();
        // ────────────────────────────────────────────────

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
      setPopupMessage("Username or password is incorrect. Please try again!");
      setShowPopup(true);
      generateCaptcha("login");
      setError(err.message || "Login failed");
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
    <div className="main">
      <div className="login-container">
        <div className="login-card">
          {/* LEFT FORM PANEL */}
          <div className="form-panel">
            <div className="form-header">
              <h1>Clinic Pro</h1>
              <p>
                {mode === "login" && "Welcome back. Sign in to continue."}
                {mode === "reset" && "Recover your password."}
              </p>
            </div>

            {mode === "login" && (
              <form onSubmit={handleLoginSubmit} className="login-form">
                <div className="input-group">
                  <input type="text" name="username" value={loginData.username} onChange={handleLoginChange} required placeholder="User Name" />
                </div>

                <div className="input-group password-wrapper">
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
                    className="eye-toggle"
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

                <button type="submit" className="login-btn" disabled={isLoading}>
                  <LockIcon />
                  <span>{isLoading ? "Signing in..." : "Login Securely"}</span>
                </button>

                <p className="forgot-link" onClick={goToReset} style={{ cursor: "pointer", marginTop: "22px" }}>
                  Forgot password?
                </p>
              </form>
            )}

            {mode === "reset" && (
              <form onSubmit={handleResetSubmit} className="login-form">
                <div className="input-group">
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

                <button type="submit" className="login-btn" disabled={isLoading}>
                  <span>{isLoading ? "Sending..." : "Get Password"}</span>
                </button>

                <p className="forgot-link" style={{ marginTop: "16px" }}>
                  Remembered? <span onClick={goToLogin} className="toggle-link">Back to Login</span>
                </p>
              </form>
            )}
            <img src={doctor} alt="doctor" className="doctor"></img>
          </div>

          {/* RIGHT PROMO PANEL */}
          <div className="promo-panel">
            <div className="promo-content">
              <img src={logo} alt="Clinic Pro" className="logo" />
              <h2>
                {mode === "login" && "Welcome to Clinic Pro"}
                {mode === "reset" && "Need help?"}
              </h2>
              <p>
                {mode === "login" && "Manage patients, staff, and operations with intelligent, secure tools."}
                {mode === "reset" && "Enter your email and we'll send you a reset link."}
              </p>
            </div>
            <div className="circle-1"></div>
            <div className="circle-2"></div>
          </div>
        </div>
      </div>

      <img src={scope} className="scope" alt="scope decoration" />
      <img src={meter} className="meter" alt="meter decoration" />

      {showPopup && (
        <div className="modal-overlay">
          <div className="modal-content">
            <p>{popupMessage}</p>
            <button
              className="modal-button"
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