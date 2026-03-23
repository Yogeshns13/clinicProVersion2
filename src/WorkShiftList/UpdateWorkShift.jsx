// src/components/UpdateWorkShift.jsx
import React, { useState, useMemo } from "react";
import { FiSave } from "react-icons/fi";
import { FaClinicMedical } from "react-icons/fa";
import { updateShift } from "../Api/Api.js";
import MessagePopup from "../Hooks/MessagePopup.jsx";
import styles from "./WorkShift.module.css";
import { getStoredClinicId } from "../Utils/Cryptoutils.js";
import TimePicker from "../Hooks/TimePicker.jsx";

const STATUS_OPTIONS = [
  { id: 1, label: "Active" },
  { id: 2, label: "Inactive" },
];

// ── Mirrors backend timeRegex: HH:MM or HH:MM:SS ──
const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

// ── Convert "HH:MM" or "HH:MM:SS" to total minutes from midnight ──
const toMinutes = (time) => {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

// ── 11:55 PM in minutes = 23 * 60 + 55 = 1435 ──
const MAX_END_MINUTES = 23 * 60 + 55; // 11:55 PM

// ─────────────────────────────────────────────────────────────────────────────
// UpdateWorkShift
//
// Double-popup contract:
//   • This component owns its OWN MessagePopup for all feedback.
//   • onSuccess() and onError() are pure signals — they carry no message.
//   • WorkShift must NOT call showPopup inside handleUpdateSuccess / handleUpdateError.
// ─────────────────────────────────────────────────────────────────────────────
const UpdateWorkShift = ({ shift, onClose, onSuccess, onError }) => {

  const formatTimeFor24Hr = (time) => {
    if (!time) return "";
    const parts = time.split(":");
    if (parts.length === 2) {
      return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:00`;
    }
    if (parts.length === 3) {
      return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:${parts[2].padStart(2, "0")}`;
    }
    return time;
  };

  const formatTimeForInput = (time) => {
    if (!time) return "";
    const parts = time.split(":");
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
    }
    return time;
  };

  const calculateWorkingHours = (start, end) => {
    if (!start || !end) return null;
    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);
    let hours = endHour - startHour;
    let minutes = endMin - startMin;
    if (minutes < 0) { hours -= 1; minutes += 60; }
    if (hours < 0) { hours += 24; }
    return hours + minutes / 60;
  };

  const [formData, setFormData] = useState({
    shiftName:    shift.shiftName                     || "",
    timeStart:    formatTimeForInput(shift.timeStart) || "",
    timeEnd:      formatTimeForInput(shift.timeEnd)   || "",
    workingHours: shift.workingHours                  || "",
    status:       shift.status === "active" ? 1 : 2,
  });

  const [formErrors, setFormErrors] = useState({
    shiftName:    "",
    timeStart:    "",
    timeEnd:      "",
    workingHours: "",
    status:       "",
  });

  // ── Track which fields the user has left (blurred) ──
  const [touchedFields, setTouchedFields] = useState({
    shiftName:    false,
    timeStart:    false,
    timeEnd:      false,
    workingHours: false,
    status:       false,
  });

  const [submitAttempted,   setSubmitAttempted]   = useState(false);
  const [formLoading,       setFormLoading]       = useState(false);
  const [submitBtnDisabled, setSubmitBtnDisabled] = useState(false);

  // ── Internal popup — this is the ONLY popup shown for UpdateWorkShift ──
  const [popup, setPopup] = useState({ visible: false, message: "", type: "success" });
  const showPopup  = (message, type = "success") => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: "", type: "success" });

  // ── Validate a single field by name, returns error string or '' ──
  const validateField = (name, value, allData = formData) => {
    switch (name) {
      case "shiftName": {
        if (!value || value.trim() === "") return "ShiftName is required";
        if (value.trim().length > 50) return "ShiftName should not exceed 50 characters";
        if (!/^[A-Za-z0-9\s\-_]+$/.test(value.trim())) return "ShiftName contains invalid characters";
        return "";
      }
      case "timeStart": {
        if (!value || value.trim() === "") return "ShiftTimeStart is required";
        if (!TIME_REGEX.test(value)) return "ShiftTimeStart must be a valid time (HH:MM or HH:MM:SS)";

        // ── If end time is already set, validate the range ──
        if (allData.timeEnd && TIME_REGEX.test(allData.timeEnd)) {
          const startMins = toMinutes(value);
          const endMins   = toMinutes(allData.timeEnd);

          // End must not be midnight (00:00)
          if (endMins === 0) {
            return ""; // end-time field will show its own error
          }

          // Start must be strictly before end (no overnight crossing)
          if (startMins >= endMins) {
            return "Start time must be earlier than end time (shifts cannot cross midnight (12AM))";
          }
        }

        return "";
      }
      case "timeEnd": {
        if (!value || value.trim() === "") return "ShiftTimeEnd is required";
        if (!TIME_REGEX.test(value)) return "ShiftTimeEnd must be a valid time (HH:MM or HH:MM:SS)";

        const endMins = toMinutes(value);

        // End time cannot be 12:00 AM (midnight = 0 minutes)
        if (endMins === 0) {
          return "End time cannot be 12:00 AM. Shifts must end by 11:55 PM at the latest";
        }

        // End time cannot exceed 11:55 PM
        if (endMins > MAX_END_MINUTES) {
          return "End time cannot exceed 11:55 PM";
        }

        // End must be strictly after start (no overnight crossing)
        if (allData.timeStart && TIME_REGEX.test(allData.timeStart)) {
          const startMins = toMinutes(allData.timeStart);
          if (endMins <= startMins) {
            return "End time must be later than start time (shifts cannot cross midnight (12AM))";
          }
        }

        return "";
      }
      case "workingHours": {
        if (value === "" || value === null || value === undefined) return "WorkingHours is required";
        if (!/^\d+(\.\d{1,2})?$/.test(String(value))) return "WorkingHours must be decimal with max 2 places";
        return "";
      }
      case "status": {
        if (value === "" || value === null || value === undefined) return "Status is required";
        if (!Number.isInteger(Number(value))) return "Status must be a valid integer";
        return "";
      }
      default:
        return "";
    }
  };

  // ── Validate all fields at once, returns errors object ──
  const validateAll = (data) => ({
    shiftName:    validateField("shiftName",    data.shiftName,    data),
    timeStart:    validateField("timeStart",    data.timeStart,    data),
    timeEnd:      validateField("timeEnd",      data.timeEnd,      data),
    workingHours: validateField("workingHours", data.workingHours, data),
    status:       validateField("status",       data.status,       data),
  });

  const isAllFieldsValid = (errors) => Object.values(errors).every((msg) => msg === "");

  // ── isFormValid useMemo — enables/disables the submit button ──
  const isFormValid = useMemo(() => {
    const errors = validateAll(formData);
    return isAllFieldsValid(errors);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  // ── Mark a field as touched on blur, then show its error ──
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    setFormErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value, formData),
    }));
  };

  // ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Auto-calculate working hours when times change
      if (name === "timeStart" || name === "timeEnd") {
        if (updated.timeStart && updated.timeEnd) {
          const hours = calculateWorkingHours(updated.timeStart, updated.timeEnd);
          if (hours !== null && hours > 0) {
            updated.workingHours = hours.toFixed(2);
          } else {
            // If crossing midnight or invalid range, clear working hours
            updated.workingHours = "";
          }
        }
      }

      // Only re-validate fields that have already been touched (or if submit was attempted)
      setFormErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        const fieldsToValidate = submitAttempted
          ? ["shiftName", "timeStart", "timeEnd", "workingHours", "status"]
          : Object.keys(touchedFields).filter((f) => touchedFields[f]);

        // Always re-validate the sibling time field when one time changes,
        // but only if the sibling has been touched or submit was attempted
        if (name === "timeStart" && (touchedFields.timeEnd || submitAttempted)) {
          fieldsToValidate.push("timeEnd");
        }
        if (name === "timeEnd" && (touchedFields.timeStart || submitAttempted)) {
          fieldsToValidate.push("timeStart");
        }

        // De-duplicate
        const unique = [...new Set(fieldsToValidate)];
        unique.forEach((field) => {
          newErrors[field] = validateField(field, updated[field], updated);
        });

        return newErrors;
      });

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    // Mark all fields as touched so errors show everywhere
    setTouchedFields({ shiftName: true, timeStart: true, timeEnd: true, workingHours: true, status: true });

    // Run full validation before sending
    const errors = validateAll(formData);
    setFormErrors(errors);

    if (!isAllFieldsValid(errors)) {
      showPopup("Please fill all required fields before submitting.", "warning");
      return;
    }

    // 2-sec cooldown on submit button
    setSubmitBtnDisabled(true);
    setTimeout(() => setSubmitBtnDisabled(false), 2000);

    setFormLoading(true);

    try {
      const clinicId = await getStoredClinicId();
      if (!clinicId) throw new Error("Clinic ID not found in localStorage");

      const workingHours = formData.workingHours
        ? parseFloat(formData.workingHours)
        : calculateWorkingHours(formData.timeStart, formData.timeEnd);

      await updateShift({
        ShiftID:        Number(shift.id),
        ClinicID:       clinicId,
        ShiftName:      formData.shiftName.trim(),
        ShiftTimeStart: formatTimeFor24Hr(formData.timeStart),
        ShiftTimeEnd:   formatTimeFor24Hr(formData.timeEnd),
        WorkingHours:   workingHours,
        Status:         Number(formData.status),
      });

      // Show success popup (inside UpdateWorkShift only — no parent popup)
      showPopup("Work shift updated successfully!", "success");

      // After 1 s the popup auto-closes; signal parent to close modal + refresh.
      // onSuccess receives NO message — WorkShift must NOT show another popup.
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1000);

    } catch (err) {
      const errMsg = err.message || "Failed to update work shift.";

      // Show error popup (inside UpdateWorkShift only)
      showPopup(errMsg, "error");

      // Signal parent for logging; WorkShift must NOT call showPopup in onError.
      if (onError) onError(errMsg);
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  return (
    <div className={styles.detailModalOverlay}>

      {/* Own MessagePopup — floats above the modal at z-index 9999 */}
      <MessagePopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
      />

      <div className={styles.addModalContent} onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className={styles.detailModalHeader}>
          <div className={styles.detailHeaderContent}>
            <h2>Update Work Shift</h2>
          </div>
          <div className={styles.clinicNameone}>
            <FaClinicMedical
              size={20}
              style={{ verticalAlign: "middle", margin: "6px", marginTop: "0px" }}
            />
            {localStorage.getItem("clinicName") || "—"}
          </div>
          <button onClick={onClose} className={styles.detailCloseBtn}>✕</button>
        </div>

        {/* ── Form Body ── */}
        <form onSubmit={handleSubmit} className={styles.addModalBody}>

          <div className={styles.addSection}>
            <div className={styles.addSectionHeader}>
              <h3>Shift Information</h3>
            </div>

            <div className={styles.addFormGrid}>

              {/* ── Shift Name ── */}
              <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                <label>Shift Name <span className={styles.required}>*</span></label>
                <input
                  required
                  name="shiftName"
                  value={formData.shiftName}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="e.g., Morning Shift, Night Shift"
                />
                {(touchedFields.shiftName || submitAttempted) && formErrors.shiftName && (
                  <span className={styles.validationMsg}>{formErrors.shiftName}</span>
                )}
              </div>

              {/* ── Start Time ── */}
              <div className={styles.addFormGroup}>
                <label>Start Time <span className={styles.required}>*</span></label>
                <TimePicker
                  name="timeStart"
                  value={formData.timeStart}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                />
                {(touchedFields.timeStart || submitAttempted) && formErrors.timeStart && (
                  <span className={styles.validationMsg}>{formErrors.timeStart}</span>
                )}
              </div>

              {/* ── End Time ── */}
              <div className={styles.addFormGroup}>
                <label>End Time <span className={styles.required}>*</span></label>
                <TimePicker
                  name="timeEnd"
                  value={formData.timeEnd}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                />
                {(touchedFields.timeEnd || submitAttempted) && formErrors.timeEnd && (
                  <span className={styles.validationMsg}>{formErrors.timeEnd}</span>
                )}
              </div>

              {/* ── Working Hours ── */}
              <div className={styles.addFormGroup}>
                <label>Working Hours <span className={styles.required}>*</span></label>
                <input
                  required
                  type="number"
                  step="0.01"
                  name="workingHours"
                  value={formData.workingHours}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="Auto-calculated from times"
                />
                {(touchedFields.workingHours || submitAttempted) && formErrors.workingHours && (
                  <span className={styles.validationMsg}>{formErrors.workingHours}</span>
                )}
              </div>

              {/* ── Status ── */}
              <div className={styles.addFormGroup}>
                <label>Status <span className={styles.required}>*</span></label>
                <select
                  required
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                {(touchedFields.status || submitAttempted) && formErrors.status && (
                  <span className={styles.validationMsg}>{formErrors.status}</span>
                )}
              </div>

            </div>
          </div>

          {/* ── Footer ── */}
          <div className={styles.detailModalFooter}>
            <button type="button" onClick={onClose} className={styles.btnCancel}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading || submitBtnDisabled}
              className={`${styles.btnSubmit} ${!isFormValid ? styles.btnSubmitDisabled : ""}`}
              title={!isFormValid ? "Please fill all required fields" : ""}
              style={{
                opacity: formLoading || submitBtnDisabled ? 0.6 : 1,
                cursor:  formLoading || submitBtnDisabled ? "not-allowed" : "pointer",
              }}
            >
              <FiSave style={{ marginRight: "8px" }} />
              {formLoading
                ? "Updating..."
                : submitBtnDisabled
                ? "Please wait..."
                : "Update Shift"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default UpdateWorkShift;