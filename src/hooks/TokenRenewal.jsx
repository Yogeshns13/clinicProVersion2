import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { renewToken } from "../api/api";
const TOKEN_RENEWAL_INTERVAL = 13 * 60 * 1000; // 15 minutes in ms
const parseISTTime = (timeStr) => {
  if (!timeStr) {
    console.warn("[useTokenRenewal] No time string provided, returning null.");
    return null;
  }
  try {
    const now = new Date();
    const [time, modifier] = timeStr.trim().split(" ");
    const [hours, minutes, seconds] = time.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
      console.warn("[useTokenRenewal] Invalid time format:", timeStr);
      return null;
    }
    let adjustedHours = hours;
    if (modifier.toLowerCase().includes("pm") && hours < 12) {
      adjustedHours += 12;
    }
    if (modifier.toLowerCase().includes("am") && hours === 12) {
      adjustedHours = 0;
    }
    const parsedDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      adjustedHours,
      minutes,
      seconds
    );
    if (isNaN(parsedDate.getTime())) {
      console.warn("[useTokenRenewal] Parsed date is invalid:", timeStr);
      return null;
    }
    return parsedDate;
  } catch (error) {
    console.error("[useTokenRenewal] Error parsing time string:", timeStr, error);
    return null;
  }
};
export const useTokenRenewal = () => {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  useEffect(() => {
    const scheduleNextRenewal = (baseDate) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (!baseDate || isNaN(baseDate.getTime())) {
        console.warn("[useTokenRenewal] Invalid baseDate, stopping renewal.");
        return;
      }
      const now = Date.now();
      const elapsed = now - baseDate.getTime(); //now-current time //baseDate.getTime() is the login time
      const intervalsPassed = Math.floor(elapsed / TOKEN_RENEWAL_INTERVAL);

      const nextTime =
        baseDate.getTime() + (intervalsPassed + 1) * TOKEN_RENEWAL_INTERVAL;
      const delay = nextTime - now;
      if (delay <= 0) {
        console.warn(
          "[useTokenRenewal] Next renewal time already passed. Scheduling immediate renewal.",
          { baseDate, now, elapsed, intervalsPassed, nextTime }
        );
        timeoutRef.current = setTimeout(() => renew(), 100);
        return;
      }
      const readableNext = new Date(nextTime).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
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
        // Parse server responseTime (format: "17/09/2025, 18:17:47")
        const serverNow = result.responseTime;
        const [, timePart] = serverNow.split(", ");
        const [hours, minutes, seconds] = timePart.split(":").map(Number);
        const parsedServerDate = new Date();
        parsedServerDate.setHours(hours, minutes, seconds, 0);
        const onlyTime = parsedServerDate.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        });
        console.log("[useTokenRenewal] Setting new login_time:", onlyTime);
        localStorage.setItem("login_time", onlyTime);
        // Schedule next renewal if login_time exists
        const newBase = parseISTTime(onlyTime);
        if (newBase && localStorage.getItem("login_time")) {
          scheduleNextRenewal(newBase);
        } else {
          console.log("[useTokenRenewal] No valid login_time or base date, stopping renewals.");
        }
      } catch (error) {
        console.error("[useTokenRenewal] Error during token renewal:", error);
        localStorage.clear();
        navigate("/", { replace: true });
      }
    };
    const loginTime = localStorage.getItem("login_time");
    if (loginTime) {
      console.log("[useTokenRenewal] Found login_time:", loginTime);
      const baseDate = parseISTTime(loginTime);
      if (baseDate) {
        scheduleNextRenewal(baseDate);
      } else {
        console.warn("[useTokenRenewal] Invalid login_time, clearing localStorage.");
        localStorage.clear();
        navigate("/", { replace: true });
      }
    } else {
      console.log("[useTokenRenewal] No login_time found, token renewal not scheduled.");
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [navigate]);
};