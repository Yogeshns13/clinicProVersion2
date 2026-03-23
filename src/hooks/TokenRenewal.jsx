import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Contexts/AuthContext";
import { renewToken } from "../Api/Api";
import { getIsRenewing, renewalChannel } from "../Api/ApiConfiguration";

const TOKEN_RENEWAL_INTERVAL = 13 * 60 * 1000;

export const useTokenRenewal = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const timeoutRef = useRef(null);
  const [nextRenewalTime, setNextRenewalTime] = useState(null);
  // Guards against the timer and the axios interceptor renewing simultaneously
  const isLocalRenewing = useRef(false);

  const scheduleRef = useRef(null);
  const renewRef = useRef(null);

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const doLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  scheduleRef.current = (baseTimestamp) => {
    clearTimer();
    const now = Date.now();
    const elapsed = now - baseTimestamp;
    const intervalsPassed = Math.floor(elapsed / TOKEN_RENEWAL_INTERVAL);
    const nextTime = baseTimestamp + (intervalsPassed + 1) * TOKEN_RENEWAL_INTERVAL;
    // Minimum 100ms delay to avoid tight loops
    const delay = Math.max(nextTime - now, 100);
    setNextRenewalTime(new Date(now + delay));
    timeoutRef.current = setTimeout(() => renewRef.current?.(), delay);
  };

  renewRef.current = async () => {
    // If the axios interceptor is already handling a 401 renewal, skip this
    // timer cycle — they would both call /RenewToken and the second would fail
    // because the refresh token was already rotated by the first
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

    // ── Cross-tab coordination ──────────────────────────────────────────────
    // Another tab successfully renewed: reset our timer so we don't double-renew
    // Another tab failed renewal / logged out: log this tab out too
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

    // ── Tab visibility ──────────────────────────────────────────────────────
    // When the user returns to a backgrounded tab the timer may have fired at
    // the wrong time or the token may already be overdue — check and act
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
        // Reschedule in case the timer fired while the tab was hidden
        scheduleRef.current?.(base);
      }
    };

    // ── Network reconnect ───────────────────────────────────────────────────
    // After a network drop the token may have expired — treat same as visibility
    const handleOnline = () => handleVisibilityChange();

    renewalChannel?.addEventListener("message", handleChannelMessage);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    return () => {
      clearTimer();
      renewalChannel?.removeEventListener("message", handleChannelMessage);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, [logout, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  return { nextRenewalTime };
};