import axios from "axios";

export const baseURL = import.meta.env.PROD
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : "/api";

export const UPLOAD_API_URL = import.meta.env.PROD
  ? `${import.meta.env.VITE_FTP_BASE_URL}/upload`
  : "/upload";

export const FILE_API_URL = import.meta.env.PROD
  ? `${import.meta.env.VITE_FTP_BASE_URL}/file`
  : "/file";

export const API = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Token Renewal Interceptor ────────────────────────────────────────────────
//
// Handles 401 responses from any API call:
//   1. Queues all concurrent failed requests while renewal is in progress
//   2. Calls /RenewToken once using a raw axios instance (not API, to avoid loop)
//   3. On success: retries all queued requests transparently
//   4. On failure: rejects all queued requests + triggers app-level logout
//
// Cross-tab coordination via BroadcastChannel:
//   - Broadcasts "RENEWED" so other tabs reset their timer
//   - Broadcasts "LOGOUT" so other tabs also log out

let isRenewing = false;
let renewQueue = [];
let logoutHandler = null;

// Called from AuthContext on mount so the interceptor can trigger React logout
export const setLogoutHandler = (fn) => {
  logoutHandler = fn;
};

// Read by TokenRenewal hook before proactive timer renewal to avoid overlap
export const getIsRenewing = () => isRenewing;

// Single BroadcastChannel instance shared with TokenRenewal hook
export const renewalChannel =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("clinic_token_renewal")
    : null;

// Builds renewal payload inline to avoid circular imports with Api.js
const buildRenewPayload = () => {
  const sessionRef = localStorage.getItem("SESSION_REF") || "";
  const userId = parseInt(localStorage.getItem("userId") || "0", 10);
  const now = new Date();
  const ts = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}:${now.getMilliseconds()}`;
  return {
    CHANNEL_ID: 1,
    REF_KEY: sessionRef ? `${sessionRef}_${ts}` : "",
    SESSION_REF: sessionRef,
    UserId: userId,
  };
};

const processQueue = (success, error = null) => {
  renewQueue.forEach(({ resolve, reject }) =>
    success ? resolve() : reject(error)
  );
  renewQueue = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only intercept 401s. Skip if already retried to prevent infinite loops.
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Renewal already in progress — queue this request until renewal finishes
    if (isRenewing) {
      return new Promise((resolve, reject) => {
        renewQueue.push({ resolve, reject });
      })
        .then(() => API(originalRequest))
        .catch(() => Promise.reject(error));
    }

    originalRequest._retry = true;
    isRenewing = true;

    try {
      // Use raw axios (not API instance) to avoid triggering this interceptor again
      const res = await axios.post(
        `${baseURL}/RenewToken`,
        buildRenewPayload(),
        { withCredentials: true, validateStatus: (s) => s < 500 }
      );

      const result = res.data?.result;
      if (res.status === 200 && result?.OUT_OK === 1 && result?.USER_ID) {
        const newTs = Date.now().toString();
        localStorage.setItem("login_timestamp", newTs);
        renewalChannel?.postMessage({ type: "RENEWED", timestamp: newTs });
        processQueue(true);
        isRenewing = false;
        return API(originalRequest);
      }

      throw new Error("Token renewal rejected by server");
    } catch {
      isRenewing = false;
      processQueue(false, new Error("Session expired. Please log in again."));
      renewalChannel?.postMessage({ type: "LOGOUT" });
      logoutHandler?.();
      return Promise.reject(error);
    }
  }
);

export const checkDbError = (result) => {
  if (result?.name === "DB_ERROR") {
    throw new Error(result.Description || "A database error occurred");
  }
};
 
export const extractBackendError = (error) => {
  const data = error.response?.data;
 
  if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
    const messages = data.errors.map((e) => `${e.path}: ${e.msg}`).join(", ");
    return messages;
  }
 
  if (data?.result?.name === "DB_ERROR") {
    return data.result.Description || "A database error occurred";
  }
  return null;
};