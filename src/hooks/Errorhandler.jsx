import styles from "../ClinicList/ClinicList.module.css";

// ── Parse any error shape into { statusCode, message } ──────────────────────
// Handles:
//   1. Backend validation array  → { errors: [{ path, msg }] }
//   2. Backend result error      → { result: { OUT_ERROR } }
//   3. Standard JS/Axios error   → error.message / error.response.data.message
const resolveError = (error) => {
  if (!error) return null;

  const statusCode = error?.status || error?.code || error?.response?.status;

  // ── Shape 1: Express-validator array  { errors: [{ path, msg }] } ──
  const backendErrors = error?.response?.data?.errors;
  if (Array.isArray(backendErrors) && backendErrors.length > 0) {
    const message = backendErrors
      .map((e) => `${e.path}: ${e.msg}`)
      .join("\n");
    return { statusCode: statusCode || 422, message };
  }

  // ── Shape 2: Backend OUT_ERROR string ──
  const outError = error?.response?.data?.result?.OUT_ERROR;
  if (outError) {
    return { statusCode: statusCode || 400, message: outError };
  }

  // ── Shape 3: Standard message ──
  const message =
    error?.response?.data?.message ||
    error?.message ||
    error?.error ||
    "An unexpected error occurred";

  return { statusCode: statusCode || 500, message };
};

// ── Severity label ───────────────────────────────────────────────────────────
const getSeverityLabel = (code) => {
  if (!code) return "Error";
  if (code >= 500) return "Server Error";
  if (code === 422) return "Validation Error";
  if (code === 404) return "Not Found";
  if (code === 403) return "Forbidden";
  if (code === 401) return "Unauthorized";
  if (code === 400) return "Bad Request";
  return "Client Error";
};

// ── Component ────────────────────────────────────────────────────────────────
const ErrorHandler = ({ error, onClose }) => {
  if (!error) return null;

  const resolved = resolveError(error);
  if (!resolved) return null;

  const { statusCode, message } = resolved;

  // Suppress non-error status codes
  if (statusCode && statusCode < 400) return null;

  const handleReload = () => window.location.reload();

  // Render each line as its own paragraph so multi-field errors are readable
  const messageLines = message.split("\n").filter(Boolean);

  return (
    <div className={styles.clinicModalOverlay} onClick={onClose}>
      <div
        className={`${styles.clinicModal} ${styles.formModal}`}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "460px" }}
      >
        {/* ── Header ── */}
        <div className={styles.clinicModalHeader}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.1rem" }}>⚠</span>
            General System Error
          </h2>
          {onClose && (
            <button className={styles.clinicModalClose} onClick={onClose}>
              ✕
            </button>
          )}
        </div>

        {/* ── Body ── */}
        <div className={styles.clinicModalBody} style={{ padding: "20px 24px 24px" }}>

          {/* Status badge row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              marginBottom: "18px",
            }}
          >
            <span
              className={`${styles.statusBadge} ${styles.inactive} ${styles.large}`}
            >
              {getSeverityLabel(statusCode)}
            </span>
          </div>

          {/* Error details card */}
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.12))",
              border: "2px solid rgba(239,68,68,0.25)",
              borderRadius: "13px",
              padding: "18px 20px",
              boxShadow: "inset 0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {/* Status code row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: "10px",
                  borderBottom: "1px solid rgba(239,68,68,0.15)",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    color: "#991b1b",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Status Code
                </span>
                <span
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: "800",
                    color: "#dc2626",
                    background: "rgba(239,68,68,0.12)",
                    padding: "3px 12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  {statusCode}
                </span>
              </div>

              {/* Message row — renders each line separately */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    color: "#991b1b",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Message
                </span>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {messageLines.map((line, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        color: "#7f1d1d",
                        lineHeight: "1.5",
                        wordBreak: "break-word",
                      }}
                    >
                      {line}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className={styles.clinicModalFooter}>
          {onClose && (
            <button className={styles.btnCancel} onClick={onClose}>
              Dismiss
            </button>
          )}
          <button className={styles.btnSubmit} onClick={handleReload}>
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorHandler;