// src/components/UpdatePassword/UpdatePassword.jsx
import React, { useState, useMemo } from "react";
import { FiLock, FiX, FiEye, FiEyeOff, FiCheck, FiAlertCircle } from "react-icons/fi";
import styles from "./UpdatePassword.module.css";
import MessagePopup from "../Hooks/MessagePopup";

// ─────────────────────────────────────────────────────────────────────────────
// Password validation regex (matches backend rule)
// Must be 8-20 chars, with uppercase, lowercase, digit, and special char
// ─────────────────────────────────────────────────────────────────────────────
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,20}$/;

const PASSWORD_RULES = [
  { id: "length",    label: "8–20 characters",          test: (p) => p.length >= 8 && p.length <= 20 },
  { id: "lowercase", label: "Lowercase letter (a–z)",   test: (p) => /[a-z]/.test(p) },
  { id: "uppercase", label: "Uppercase letter (A–Z)",   test: (p) => /[A-Z]/.test(p) },
  { id: "digit",     label: "Number (0–9)",              test: (p) => /\d/.test(p) },
  { id: "special",   label: "Special character (@$!%…)", test: (p) => /[@$!%*?&#^()_\-+=]/.test(p) },
];

// ─────────────────────────────────────────────────────────────────────────────
// Strength calculator  →  { score: 0-5, label, color, width }
// ─────────────────────────────────────────────────────────────────────────────
const calcStrength = (password) => {
  if (!password) return { score: 0, label: "", color: "", width: "0%" };
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;

  if (passed <= 1) return { score: 1, label: "Weak",        color: "#ef4444", width: "20%" };
  if (passed === 2) return { score: 2, label: "Fair",        color: "#f97316", width: "40%" };
  if (passed === 3) return { score: 3, label: "Good",        color: "#eab308", width: "60%" };
  if (passed === 4) return { score: 4, label: "Strong",      color: "#22c55e", width: "80%" };
  /* passed === 5 */ return { score: 5, label: "Very Strong", color: "#16a34a", width: "100%" };
};

// ─────────────────────────────────────────────────────────────────────────────
// isPasswordSubmittable — Strong (score >= 4) is enough to submit
// Requires: length 8-20, lowercase, uppercase, digit (3 of 4 non-length rules + length)
// Score 4 means all 4 core rules pass (length + lower + upper + digit), special is bonus
// ─────────────────────────────────────────────────────────────────────────────
const isPasswordSubmittable = (password) => {
  if (!password) return false;
  const v = password.trim();
  return (
    v.length >= 8 &&
    v.length <= 20 &&
    /[a-z]/.test(v) &&
    /[A-Z]/.test(v) &&
    /\d/.test(v)
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Validate a single password field — returns { message, isWarning }
// isWarning = true  → yellow style (strong enough but missing special char)
// isWarning = false → red style (not yet strong enough)
// ─────────────────────────────────────────────────────────────────────────────
const validatePassword = (value) => {
  if (!value || !value.trim()) return { message: "Password is required.", isWarning: false };
  const v = value.trim();
  if (v.length < 8 || v.length > 20)  return { message: "Must be 8–20 characters.", isWarning: false };
  if (!/[a-z]/.test(v))               return { message: "Add a lowercase letter.", isWarning: false };
  if (!/[A-Z]/.test(v))               return { message: "Add an uppercase letter.", isWarning: false };
  if (!/\d/.test(v))                  return { message: "Add a number (0–9).", isWarning: false };
  // At this point the password is "Strong" — special char is optional, shown as warning
  if (!/[@$!%*?&#^()_\-+=]/.test(v)) return { message: "Tip: Add a special character (@$!%…) for Very Strong.", isWarning: true };
  return { message: "", isWarning: false };
};

// ─────────────────────────────────────────────────────────────────────────────
// UpdatePassword
//
// Props:
//   mode        : "force" | "admin" | "self"
//                  force → ForceChangePassword (no cancel, must complete; X calls logout)
//                  admin → Admin updating another user's password (no old-password field)
//                  self  → User updating their own password (requires old-password field)
//   user        : { userName, userId, clinicId }  (used in admin/force modes for display/API)
//   onClose     : () => void           (called on X or Cancel)
//   onSuccess   : () => void           (called after successful update)
//   updatePasswordApi : async (payload) => void   (the API function)
//   getStoredUserId   : async () => string|number  (util to get logged-in user's id)
//   getStoredClinicId : async () => string|number  (util to get logged-in clinic id)
// ─────────────────────────────────────────────────────────────────────────────
const UpdatePassword = ({
  mode = "self",
  user = null,
  onClose,
  onSuccess,
  updatePasswordApi,
  getStoredUserId,
  getStoredClinicId,
}) => {
  const isForce = mode === "force";
  const isAdmin = mode === "admin";
  const requiresOld = mode === "self";

  // ── Field state ──
  const [oldPassword,      setOldPassword]      = useState("");
  const [newPassword,      setNewPassword]       = useState("");
  const [confirmPassword,  setConfirmPassword]   = useState("");

  // ── Visibility toggles ──
  const [showOld,     setShowOld]     = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── UI state ──
  const [error,        setError]        = useState("");
  const [fieldErrors,  setFieldErrors]  = useState({});   // { old, new, confirm }
  const [fieldWarnings, setFieldWarnings] = useState({});  // { new } — yellow hints
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess,  setShowSuccess]  = useState(false);

  // ── MessagePopup state ──
  const [popup, setPopup] = useState({ visible: false, message: "", type: "error" });

  // ── Password strength ──
  const strength = useMemo(() => calcStrength(newPassword), [newPassword]);

  // ── Confirm match ──
  const confirmStatus =
    !confirmPassword ? "" :
    newPassword === confirmPassword ? "match" : "mismatch";

  // ─────────────────────────────────────────────
  // Field change handlers with live validation
  // ─────────────────────────────────────────────
  const handleOldChange = (e) => {
    setOldPassword(e.target.value);
    setError("");
    setFieldErrors((prev) => ({ ...prev, old: "" }));
  };

  const handleNewChange = (e) => {
    setNewPassword(e.target.value);
    setError("");
    if (e.target.value) {
      const { message, isWarning } = validatePassword(e.target.value);
      if (isWarning) {
        setFieldErrors((prev) => ({ ...prev, new: "" }));
        setFieldWarnings((prev) => ({ ...prev, new: message }));
      } else {
        setFieldErrors((prev) => ({ ...prev, new: message }));
        setFieldWarnings((prev) => ({ ...prev, new: "" }));
      }
    } else {
      setFieldErrors((prev) => ({ ...prev, new: "" }));
      setFieldWarnings((prev) => ({ ...prev, new: "" }));
    }
  };

  const handleConfirmChange = (e) => {
    setConfirmPassword(e.target.value);
    setError("");
    setFieldErrors((prev) => ({ ...prev, confirm: "" }));
  };

  // ─────────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────────
  const handleSubmit = async () => {
    setError("");

    // Validate old password (self mode only)
    if (requiresOld && !oldPassword.trim()) {
      setFieldErrors((prev) => ({ ...prev, old: "Current password is required." }));
      setPopup({ visible: true, message: "Current password is required.", type: "error" });
      return;
    }

    // Validate new password — must be at least Strong (submittable)
    if (!isPasswordSubmittable(newPassword)) {
      const { message } = validatePassword(newPassword);
      setFieldErrors((prev) => ({ ...prev, new: message || "Password is not strong enough." }));
      setPopup({ visible: true, message: message || "Password must be at least Strong to submit.", type: "error" });
      return;
    }

    // Validate confirm
    if (!confirmPassword.trim()) {
      setFieldErrors((prev) => ({ ...prev, confirm: "Please confirm your password." }));
      setPopup({ visible: true, message: "Please confirm your new password.", type: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFieldErrors((prev) => ({ ...prev, confirm: "Passwords do not match." }));
      setPopup({ visible: true, message: "Passwords do not match. Please re-enter.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      let userId, clinicId;

      if (isAdmin && user) {
        userId   = user.userId || user.id;
        clinicId = user.clinicId || 0;
      } else {
        userId   = await getStoredUserId();
        clinicId = await getStoredClinicId();
      }

      await updatePasswordApi({
        UserID:      userId,
        ClinicID:    clinicId,
        Password:    newPassword.trim(),
        OldPassword: requiresOld ? oldPassword.trim() : undefined,
        IsAdmin:     requiresOld ? 0 : 1,
      });

      setShowSuccess(true);
    } catch (err) {
      const msg = err.message || "Failed to update password. Please try again.";
      setError(msg);
      setPopup({ visible: true, message: msg, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setFieldErrors({});
    setFieldWarnings({});
    setShowOld(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const handleClose = () => {
    handleReset();
    onClose?.();
  };

  // ─────────────────────────────────────────────
  // Success screen
  // ─────────────────────────────────────────────
  if (showSuccess) {
    return (
      <div className={`${styles.overlay} ${isForce ? styles.forceOverlay : ""}`}>
        <div className={styles.successPopup}>
          <div className={styles.successIconWrap}>
            <FiCheck size={34} />
          </div>
          <h3>Password Updated!</h3>
          <p>
            {isAdmin && user
              ? `Password for ${user.userName} has been changed successfully.`
              : "Your password has been changed successfully."}
          </p>
          <button
            className={styles.btnOkay}
            onClick={() => { handleReset(); onSuccess?.(); }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // Modal
  // ─────────────────────────────────────────────
  return (
    <>
      {/* ── MessagePopup for validation errors ── */}
      <MessagePopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onClose={() => setPopup((p) => ({ ...p, visible: false }))}
      />

      <div className={`${styles.overlay} ${isForce ? styles.forceOverlay : ""}`}>
        <div className={styles.modal}>

          {/* ── Header ── */}
          <div className={styles.modalHeader}>
            <div className={styles.headerIcon}>
              <FiLock size={22} />
            </div>
            <div className={styles.headerText}>
              <h2>
                {isForce
                  ? "Set New Password"
                  : isAdmin && user
                  ? `Update Password`
                  : "Change Password"}
              </h2>
              <p>
                {isForce
                  ? "You must set a new password before continuing"
                  : isAdmin && user
                  ? `Setting new password for ${user.userName}`
                  : "Set a new secure password for your account"}
              </p>
            </div>
            {/* X button always shown — in force mode it triggers logout via onClose */}
            <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
              <FiX size={20} />
            </button>
          </div>

          {/* ── Body ── */}
          <div className={styles.modalBody}>

            {/* Force-change notice */}
            {isForce && (
              <div className={styles.forceNotice}>
                <FiAlertCircle size={16} />
                <span>Your account requires a password change. Please update it to proceed.</span>
              </div>
            )}

            {/* Old Password (self mode only) */}
            {requiresOld && (
              <div className={styles.field}>
                <label>Current Password</label>
                <div className={`${styles.inputWrap} ${fieldErrors.old ? styles.hasError : ""}`}>
                  <input
                    type={showOld ? "text" : "password"}
                    placeholder="Enter current password"
                    value={oldPassword}
                    onChange={handleOldChange}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowOld((v) => !v)}
                    tabIndex={-1}
                    aria-label="Toggle visibility"
                  >
                    {showOld ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                  </button>
                </div>
                {fieldErrors.old && (
                  <span className={styles.fieldError}>
                    <FiAlertCircle size={13} /> {fieldErrors.old}
                  </span>
                )}
              </div>
            )}

            {/* New Password */}
            <div className={styles.field}>
              <label>New Password</label>
              <div className={`${styles.inputWrap} ${
                fieldErrors.new ? styles.hasError :
                fieldWarnings.new ? styles.hasWarning :
                newPassword && !fieldErrors.new && strength.score >= 4 ? styles.hasSuccess : ""
              }`}>
                <input
                  type={showNew ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={handleNewChange}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowNew((v) => !v)}
                  tabIndex={-1}
                  aria-label="Toggle visibility"
                >
                  {showNew ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                </button>
              </div>

              {/* ── Strength meter ── */}
              {newPassword && (
                <div className={styles.strengthWrap}>
                  <div className={styles.strengthBar}>
                    <div
                      className={styles.strengthFill}
                      style={{
                        width: strength.width,
                        background: strength.color,
                        transition: "width 0.4s ease, background 0.4s ease",
                      }}
                    />
                  </div>
                  <span className={styles.strengthLabel} style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}

              {fieldErrors.new && (
                <span className={styles.fieldError}>
                  <FiAlertCircle size={13} /> {fieldErrors.new}
                </span>
              )}
              {/* Warning (yellow) — shown when Strong but missing special char */}
              {!fieldErrors.new && fieldWarnings.new && (
                <span className={styles.fieldErrorWarning}>
                  <FiAlertCircle size={13} /> {fieldWarnings.new}
                </span>
              )}
            </div>

            {/* Confirm Password */}
            <div className={styles.field}>
              <label>Confirm New Password</label>
              <div className={`${styles.inputWrap} ${
                confirmStatus === "mismatch" ? styles.mismatch :
                confirmStatus === "match"    ? styles.matchWrap : ""
              }`}>
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={handleConfirmChange}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowConfirm((v) => !v)}
                  tabIndex={-1}
                  aria-label="Toggle visibility"
                >
                  {showConfirm ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                </button>
                {confirmStatus === "match" && (
                  <span className={styles.matchIcon}><FiCheck size={15} /></span>
                )}
              </div>
              {fieldErrors.confirm && (
                <span className={styles.fieldError}>
                  <FiAlertCircle size={13} /> {fieldErrors.confirm}
                </span>
              )}
            </div>

            {/* Global error */}
            {error && (
              <div className={styles.globalError}>
                <FiAlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className={styles.modalFooter}>
            {!isForce && (
              <button className={styles.btnCancel} onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </button>
            )}
            <button
              className={styles.btnSubmit}
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={isForce ? { flex: 1 } : {}}
            >
              {isSubmitting ? (
                <span className={styles.spinner} />
              ) : (
                <>
                  <FiLock size={15} />
                  Update Password
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UpdatePassword;