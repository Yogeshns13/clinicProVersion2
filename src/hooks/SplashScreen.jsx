import React, { useEffect } from "react";
import logo from "../assets/cplogo.png";

export const SPLASH_MIN_DURATION = 2000;

const SPLASH_STYLES = `
  @keyframes splash-in {
    from { opacity: 0; transform: scale(0.85); }
    to { opacity: 1; transform: scale(1); }
  }

  @keyframes splash-dot {
    0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
    40% { opacity: 1; transform: scale(1.2); }
  }

  .splash-root {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    width: 100vw;
    background: #ffffff;
    position: fixed;
    inset: 0;
    z-index: 9999;
    gap: 40px;
  }

  html.splash-active,
  body.splash-active,
  #root {
    background: #ffffff !important;
  }

  html.splash-active::before,
  body.splash-active::before,
  html.splash-active::after,
  body.splash-active::after {
    display: none !important;
    content: none !important;
    background: none !important;
  }

  .splash-logo-wrap {
    animation: splash-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    opacity: 0;
    padding: 28px 36px;
    border-radius: 20px;
    background: #ffffff;
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.04),
      0 4px 16px rgba(0, 0, 0, 0.10),
      0 16px 48px rgba(0, 0, 0, 0.12),
      0 0 80px rgba(40, 167, 69, 0.10);
  }

  .splash-logo {
    width: clamp(160px, 30vw, 280px);
    height: auto;
    display: block;
  }

  .splash-loader {
    display: flex;
    gap: 10px;
  }

  .splash-loader span {
    display: block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #28a745;
    animation: splash-dot 1.2s ease-in-out infinite;
    opacity: 0;
  }

  .splash-loader span:nth-child(1) { animation-delay: 0s; }
  .splash-loader span:nth-child(2) { animation-delay: 0.2s; }
  .splash-loader span:nth-child(3) { animation-delay: 0.4s; }
`;

const SplashScreen = () => {
  useEffect(() => {
    document.documentElement.classList.add("splash-active");
    document.body.classList.add("splash-active");

    const styleTag = document.createElement("style");
    styleTag.setAttribute("data-id", "splash-styles");
    styleTag.innerHTML = SPLASH_STYLES;
    document.head.appendChild(styleTag);

    return () => {
      document.documentElement.classList.remove("splash-active");
      document.body.classList.remove("splash-active");
      document.head.removeChild(styleTag);
    };
  }, []);

  return (
    <div className="splash-root">
      <div className="splash-logo-wrap">
        <img src={logo} alt="Clinic Pro" className="splash-logo" />
      </div>
      <div className="splash-loader">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
};

export default SplashScreen;
