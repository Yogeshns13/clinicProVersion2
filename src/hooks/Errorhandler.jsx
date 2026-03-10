import styles from "../ClinicList/ClinicList.module.css";

const ErrorHandler = ({ error, onClose }) => {
  if (!error) return null;

  const statusCode = error?.status || error?.code;
  const message = error?.message || error?.error || "An unexpected error occurred";

  if (statusCode < 400) return null;

  // Determine error severity label
  const getSeverityLabel = (code) => {
    if (code >= 500) return "Server Error";
    if (code === 404) return "Not Found";
    if (code === 403) return "Forbidden";
    if (code === 401) return "Unauthorized";
    if (code === 400) return "Bad Request";
    return "Client Error";
  };

  const handleReload = () => window.location.reload();

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
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "#7f1d1d",
                    lineHeight: "1.5",
                    wordBreak: "break-word",
                  }}
                >
                  {message}
                </span>
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