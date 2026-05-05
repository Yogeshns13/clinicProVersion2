import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Contexts/AuthContext";
import { renewToken, checkClinicAllowLogin } from "../Api/Api";
import { getIsRenewing, renewalChannel } from "../Api/ApiConfiguration";

const TOKEN_RENEWAL_INTERVAL = Number(import.meta.env.VITE_TOKEN_RENEWAL_INTERVAL);
const CLINIC_CHECK_BEFORE_RENEWAL = Number(import.meta.env.VITE_CLINIC_CHECK_BEFORE_RENEWAL);

export const useTokenRenewal = ({ onClinicError } = {}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const timeoutRef = useRef(null);
  const clinicCheckTimeoutRef = useRef(null);
  const [nextRenewalTime, setNextRenewalTime] = useState(null);
  const isLocalRenewing = useRef(false);

  const scheduleRef = useRef(null);
  const renewRef = useRef(null);
  const onClinicErrorRef = useRef(onClinicError);
  useEffect(() => { onClinicErrorRef.current = onClinicError; });

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };    

  const clearClinicCheckTimer = () => {
    if (clinicCheckTimeoutRef.current) {
      clearTimeout(clinicCheckTimeoutRef.current);
      clinicCheckTimeoutRef.current = null;
    }
  };

  const doLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const doClinicCheck = async () => {
    try {
      const result = await checkClinicAllowLogin();
      if (result && result.allowLogin === 0) {
        const message = result.message || "Access to this clinic is temporarily unavailable";
        if (onClinicErrorRef.current) {
          onClinicErrorRef.current(message);
        } else {
          doLogout();
        }
      }
    } catch (err) {
      const message = err?.message || "Failed to check clinic access";
      if (onClinicErrorRef.current) {
        onClinicErrorRef.current(message);
      } else {
        doLogout();
      }
    }
  };

  scheduleRef.current = (baseTimestamp) => {
    clearTimer();
    clearClinicCheckTimer();
    const now = Date.now();
    const elapsed = now - baseTimestamp;
    const intervalsPassed = Math.floor(elapsed / TOKEN_RENEWAL_INTERVAL);
    const nextTime = baseTimestamp + (intervalsPassed + 1) * TOKEN_RENEWAL_INTERVAL;
    const delay = Math.max(nextTime - now, 100);
    setNextRenewalTime(new Date(now + delay));
    timeoutRef.current = setTimeout(() => renewRef.current?.(), delay);

    const clinicCheckDelay = delay - CLINIC_CHECK_BEFORE_RENEWAL;
    if (clinicCheckDelay > 0) {
      clinicCheckTimeoutRef.current = setTimeout(() => doClinicCheck(), clinicCheckDelay);
    }
  };

  renewRef.current = async () => {
    if (getIsRenewing() || isLocalRenewing.current) {
      scheduleRef.current?.(Date.now());
      return;
    }

    isLocalRenewing.current = true;
    try {
      const result = await renewToken();
      if (!result.success) {
        doLogout();
        return;
      }
      const newTimestamp = Date.now();
      localStorage.setItem("login_timestamp", newTimestamp.toString());
      scheduleRef.current?.(newTimestamp);
    } catch {
      doLogout();
    } finally {
      isLocalRenewing.current = false;
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("login_timestamp");
    if (!stored || isNaN(parseInt(stored, 10))) return;

    scheduleRef.current?.(parseInt(stored, 10));

    const handleChannelMessage = (event) => {
      if (event.data?.type === "RENEWED") {
        const ts = parseInt(event.data.timestamp, 10);
        if (!isNaN(ts)) {
          localStorage.setItem("login_timestamp", ts.toString());
          scheduleRef.current?.(ts);
        }
      } else if (event.data?.type === "LOGOUT") {
        doLogout();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      const ts = localStorage.getItem("login_timestamp");
      if (!ts) return;
      const base = parseInt(ts, 10);
      if (isNaN(base)) return;
      const elapsed = Date.now() - base;
      if (elapsed >= TOKEN_RENEWAL_INTERVAL) {
        renewRef.current?.();
      } else {
        scheduleRef.current?.(base);
      }
    };

    const handleOnline = () => handleVisibilityChange();

    renewalChannel?.addEventListener("message", handleChannelMessage);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    return () => {
      clearTimer();
      clearClinicCheckTimer();
      renewalChannel?.removeEventListener("message", handleChannelMessage);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, [logout, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  return { nextRenewalTime };
};