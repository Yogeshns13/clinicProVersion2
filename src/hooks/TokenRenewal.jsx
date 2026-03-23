import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { renewToken } from "../Api/Api";

const TOKEN_RENEWAL_INTERVAL = 13 * 60 * 1000;

export const useTokenRenewal = () => {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);

  useEffect(() => {
    const scheduleNextRenewal = (baseTimestamp) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      const now = Date.now();
      const elapsed = now - baseTimestamp;
      const intervalsPassed = Math.floor(elapsed / TOKEN_RENEWAL_INTERVAL);
      const nextTime = baseTimestamp + (intervalsPassed + 1) * TOKEN_RENEWAL_INTERVAL;
      const delay = nextTime - now;

      if (delay <= 0) {
        console.warn("[useTokenRenewal] Next renewal time already passed. Scheduling immediate renewal.");
        timeoutRef.current = setTimeout(() => renew(), 100);
        return;
      }

      const readableNext = new Date(nextTime).toLocaleTimeString();
      console.log(`[useTokenRenewal] Scheduling next token renewal at: ${readableNext}`);
      timeoutRef.current = setTimeout(renew, delay);
    };

    const renew = async () => {
      try {
        console.log("[useTokenRenewal] Attempting token renewal...");
        const result = await renewToken();
        console.log("[useTokenRenewal] Token renewal result:", result);

        if (!result.success) {
          console.error("[useTokenRenewal] Token renewal failed, logging out...");
          localStorage.clear();
          navigate("/", { replace: true });
          return;
        }

        const newTimestamp = Date.now();
        localStorage.setItem("login_timestamp", newTimestamp.toString());
        console.log("[useTokenRenewal] Updated login_timestamp:", newTimestamp);
        scheduleNextRenewal(newTimestamp);
      } catch (error) {
        console.error("[useTokenRenewal] Error during token renewal:", error);
        localStorage.clear();
        navigate("/", { replace: true });
      }
    };

    const stored = localStorage.getItem("login_timestamp");
    if (stored) {
      const baseTimestamp = parseInt(stored, 10);
      if (!isNaN(baseTimestamp)) {
        console.log("[useTokenRenewal] Found login_timestamp:", baseTimestamp);
        scheduleNextRenewal(baseTimestamp);
      } else {
        console.warn("[useTokenRenewal] Invalid login_timestamp, clearing localStorage.");
        localStorage.clear();
        navigate("/", { replace: true });
      }
    } else {
      console.log("[useTokenRenewal] No login_timestamp found, token renewal not scheduled.");
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [navigate]);
};