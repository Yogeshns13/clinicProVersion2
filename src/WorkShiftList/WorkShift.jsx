// src/components/WorkShift.jsx
import React, { useState, useEffect, useMemo } from "react";
import { FiSearch, FiPlus, FiX, FiTrash2 } from "react-icons/fi";
import { getShiftList, addShift, deleteShift } from "../Api/Api.js";
import ErrorHandler from "../Hooks/ErrorHandler.jsx";
import Header from "../Header/Header.jsx";
import UpdateWorkShift from "./UpdateWorkShift.jsx";
import MessagePopup from "../Hooks/MessagePopup.jsx";
import ConfirmPopup from "../Hooks/ConfirmPopup.jsx";
import styles from "./WorkShift.module.css";
import { FaClinicMedical } from "react-icons/fa";
import { getStoredClinicId } from "../Utils/Cryptoutils.js";
import TimePicker from "../Hooks/TimePicker.jsx";
import LoadingPage from "../Hooks/LoadingPage.jsx";

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

const WorkShift = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Central popup ──
  const [popup, setPopup] = useState({ visible: false, message: "", type: "success" });
  const showPopup  = (message, type = "success") => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: "", type: "success" });

  const [filterInputs, setFilterInputs] = useState({
    searchValue: "",
    status: "",
  });

  const [appliedFilters, setAppliedFilters] = useState({
    searchValue: "",
    status: "",
  });

  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const pageSize = 20;

  const [selectedShift, setSelectedShift] = useState(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // ── Button 2-sec cooldowns ──
  const [searchBtnDisabled, setSearchBtnDisabled] = useState(false);
  const [clearBtnDisabled,  setClearBtnDisabled]  = useState(false);
  const [deleteBtnDisabled, setDeleteBtnDisabled] = useState(false);

  const [formData, setFormData] = useState({
    shiftName: "",
    timeStart: "",
    timeEnd: "",
    workingHours: "",
  });

  const [formErrors, setFormErrors] = useState({
    shiftName: "",
    timeStart: "",
    timeEnd: "",
    workingHours: "",
  });

  // ── Track which fields the user has left (blurred) ──
  const [touchedFields, setTouchedFields] = useState({
    shiftName: false,
    timeStart: false,
    timeEnd: false,
    workingHours: false,
  });

  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [shiftToDelete, setShiftToDelete]         = useState(null);
  const [deleteLoading, setDeleteLoading]         = useState(false);

  // Update Modal
  const [updateShiftData, setUpdateShiftData]   = useState(null);
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);

  const hasActiveFilters =
    appliedFilters.searchValue.trim() !== "" || appliedFilters.status !== "";

  const startRecord = shifts.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord   = (page - 1) * pageSize + shifts.length;

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

  const fetchShifts = async (filters = appliedFilters, currentPage = page) => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = await getStoredClinicId();

      const options = {
        ShiftName: filters.searchValue || "",
        Status: filters.status !== "" ? Number(filters.status) : -1,
        Page: currentPage,
        PageSize: pageSize,
      };

      const data = await getShiftList(clinicId, options);
      setShifts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("fetchShifts error:", err);
      showPopup("Failed to load work shifts. Please try again.", "error");
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || "Failed to load work shifts" },
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts(appliedFilters, page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, page, refreshKey]);

  const getStatusClass = (status) => {
    if (status === "active") return styles.active;
    if (status === "inactive") return styles.inactive;
    return styles.inactive;
  };

  const formatTime = (time) => {
    if (!time) return "—";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatTimeFor24Hr = (time) => {
    if (!time) return "";
    const parts = time.split(":");
    if (parts.length === 2) {
      return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:00`;
    }
    return time;
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    if (searchBtnDisabled) return;
    setSearchBtnDisabled(true);
    setAppliedFilters({ ...filterInputs });
    setPage(1);
    setTimeout(() => setSearchBtnDisabled(false), 2000);
  };

  const handleClearFilters = () => {
    if (clearBtnDisabled) return;
    setClearBtnDisabled(true);
    const empty = { searchValue: "", status: "" };
    setFilterInputs(empty);
    setAppliedFilters(empty);
    setPage(1);
    setTimeout(() => setClearBtnDisabled(false), 2000);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    setPage(newPage);
  };

  const openDetails  = (shift) => setSelectedShift(shift);
  const closeModal   = ()      => setSelectedShift(null);

  const openAddForm = () => {
    setFormData({ shiftName: "", timeStart: "", timeEnd: "", workingHours: "" });
    setFormErrors({ shiftName: "", timeStart: "", timeEnd: "", workingHours: "" });
    setTouchedFields({ shiftName: false, timeStart: false, timeEnd: false, workingHours: false });
    setSubmitAttempted(false);
    setIsAddFormOpen(true);
  };

  const closeAddForm = () => {
    setIsAddFormOpen(false);
    setFormLoading(false);
    setFormErrors({ shiftName: "", timeStart: "", timeEnd: "", workingHours: "" });
    setTouchedFields({ shiftName: false, timeStart: false, timeEnd: false, workingHours: false });
    setSubmitAttempted(false);
  };

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
        if (!/^\d+(\.\d{1,2})?$/.test(String(value))) return "WorkingHours must be decimal with max 2 places (e.g., 8.50)";
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
          ? ["shiftName", "timeStart", "timeEnd", "workingHours"]
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
    setTouchedFields({ shiftName: true, timeStart: true, timeEnd: true, workingHours: true });

    // Run full validation before sending
    const errors = validateAll(formData);
    setFormErrors(errors);

    if (!isAllFieldsValid(errors)) {
      showPopup("Please fill all required fields before submitting.", "warning");
      return;
    }

    setFormLoading(true);
    setError(null);

    try {
      const clinicId = await getStoredClinicId();
      if (!clinicId) throw new Error("Clinic ID not found in localStorage");

      const workingHours = formData.workingHours
        ? parseFloat(formData.workingHours)
        : calculateWorkingHours(formData.timeStart, formData.timeEnd);

      await addShift({
        clinicId,
        ShiftName:      formData.shiftName.trim(),
        ShiftTimeStart: formatTimeFor24Hr(formData.timeStart),
        ShiftTimeEnd:   formatTimeFor24Hr(formData.timeEnd),
        WorkingHours:   workingHours,
      });

      showPopup("Work shift added successfully!", "success");
      setTimeout(() => {
        closeAddForm();
        setPage(1);
        setRefreshKey((k) => k + 1);
      }, 1000);
    } catch (err) {
      console.error("Add shift failed:", err);
      showPopup(err.message || "Failed to add work shift.", "error");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Update handlers ──
  const handleUpdateClick = (shift) => {
    setUpdateShiftData(shift);
    setSelectedShift(null);
    setIsUpdateFormOpen(true);
  };

  const handleUpdateClose = () => {
    setIsUpdateFormOpen(false);
    setUpdateShiftData(null);
  };

  const handleUpdateSuccess = () => {
    setIsUpdateFormOpen(false);
    setUpdateShiftData(null);
    setRefreshKey((k) => k + 1);
  };

  const handleUpdateError = (message) => {
    console.error("Update shift error (handled by UpdateWorkShift popup):", message);
  };

  const openDeleteConfirm = (shift) => {
    setShiftToDelete(shift);
    setDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setShiftToDelete(null);
    setDeleteConfirmOpen(false);
  };

  const handleDelete = async () => {
    if (!shiftToDelete) return;
    if (deleteBtnDisabled) return;

    setDeleteBtnDisabled(true);
    setDeleteLoading(true);
    setError(null);

    try {
      await deleteShift(shiftToDelete.id);
      showPopup(`Work shift "${shiftToDelete.shiftName}" deleted successfully.`, "success");
      fetchShifts(appliedFilters, page);
      closeDeleteConfirm();
      if (selectedShift?.id === shiftToDelete.id) closeModal();
    } catch (err) {
      console.error("Delete shift failed:", err);
      showPopup(err.message || "Failed to delete work shift.", "error");
      setError({
        message: err.message || "Failed to delete work shift",
        status: err.status || 500,
      });
    } finally {
      setDeleteLoading(false);
      setTimeout(() => setDeleteBtnDisabled(false), 2000);
    }
  };

  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading)
    return <div className={styles.clinicLoading}><LoadingPage/></div>;
  if (error)
    return (
      <div className={styles.clinicError}>Error: {error.message || error}</div>
    );

  return (
    <div className={styles.clinicListWrapper}>
      <ErrorHandler error={error} />
      <Header title="Work Shift Management" />

      {/* ── Central MessagePopup ── */}
      <MessagePopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
      />

      {/* ── ConfirmPopup for Delete ── */}
      <ConfirmPopup
        visible={deleteConfirmOpen}
        message={`Delete "${shiftToDelete?.shiftName}"?`}
        subMessage="This action cannot be undone. The work shift will be permanently removed."
        confirmLabel={deleteLoading ? "Deleting..." : "Yes, Delete"}
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={closeDeleteConfirm}
      />

      {/* ── Filters + Add Shift bar ── */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>

          <div className={styles.searchGroup}>
            <input
              type="text"
              name="searchValue"
              placeholder="Search by shift name..."
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <select
              name="status"
              value={filterInputs.status}
              onChange={handleFilterChange}
              className={styles.statusFilterSelect}
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterActions}>
            <button
              onClick={handleSearch}
              className={styles.searchButton}
              disabled={searchBtnDisabled}
              style={{
                opacity: searchBtnDisabled ? 0.6 : 1,
                cursor:  searchBtnDisabled ? "not-allowed" : "pointer",
              }}
            >
              <FiSearch size={18} />
              Search
            </button>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className={styles.clearButton}
                disabled={clearBtnDisabled}
                style={{
                  opacity: clearBtnDisabled ? 0.6 : 1,
                  cursor:  clearBtnDisabled ? "not-allowed" : "pointer",
                }}
              >
                <FiX size={18} />
                Clear
              </button>
            )}

            <button onClick={openAddForm} className={styles.addClinicBtn}>
              <FiPlus size={18} />
              Add Shift
            </button>
          </div>

        </div>
      </div>

      {/* ── Table + Pagination wrapper ── */}
      <div className={styles.tableSection}>

        <div className={styles.clinicTableContainer}>
          <table className={styles.clinicTable}>
            <thead>
              <tr>
                <th>Shift Name</th>
                <th>Clinic</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Working Hours</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shifts.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.clinicNoData}>
                    {hasActiveFilters ? "No work shifts found." : "No work shifts registered yet."}
                  </td>
                </tr>
              ) : (
                shifts.map((shift) => (
                  <tr key={shift.id}>
                    <td>
                      <div className={styles.clinicNameCell}>
                        <div className={styles.clinicAvatar}>
                          {shift.shiftName?.charAt(0).toUpperCase() || "S"}
                        </div>
                        <div>
                          <div className={styles.clinicName}>{shift.shiftName}</div>
                        </div>
                      </div>
                    </td>
                    <td>{shift.clinicName || "—"}</td>
                    <td>{formatTime(shift.timeStart)}</td>
                    <td>{formatTime(shift.timeEnd)}</td>
                    <td>{shift.workingHours ? `${shift.workingHours} hrs` : "—"}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusClass(shift.status)}`}>
                        {shift.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => openDetails(shift)}
                        className={styles.clinicDetailsBtn}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Bar ── */}
        <div className={styles.paginationBar}>
          <div className={styles.paginationInfo}>
            {shifts.length > 0
              ? `Showing ${startRecord}–${endRecord} records`
              : "No records"}
          </div>

          <div className={styles.paginationControls}>
            <span className={styles.paginationLabel}>Page</span>

            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(1)}
              disabled={page === 1}
              title="First page"
            >
              «
            </button>

            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              title="Previous page"
            >
              ‹
            </button>

            <span className={styles.pageIndicator}>{page}</span>

            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(page + 1)}
              disabled={shifts.length < pageSize}
              title="Next page"
            >
              ›
            </button>
          </div>

          <div className={styles.pageSizeInfo}>
            Page Size: <strong>{pageSize}</strong>
          </div>
        </div>

      </div>{/* end tableSection */}

      {/* ──────────────── Details Modal ──────────────── */}
      {selectedShift && (
        <div className={styles.detailModalOverlay} onClick={closeModal}>
          <div
            className={styles.detailModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.detailModalHeader}>
              <div className={styles.detailHeaderContent}>
                <h2>{selectedShift.shiftName}</h2>
              </div>
              <div className={styles.clinicNameone}>
                <FaClinicMedical
                  size={20}
                  style={{ verticalAlign: "middle", margin: "6px", marginTop: "0px" }}
                />
                {localStorage.getItem("clinicName") || "—"}
              </div>
              <button onClick={closeModal} className={styles.detailCloseBtn}>✕</button>
            </div>

            <div className={styles.detailModalBody}>
              <div className={styles.infoSection}>
                <div className={styles.infoCard}>
                  <div className={styles.infoHeader}>
                    <h3>Shift Information</h3>
                  </div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Clinic</span>
                      <span className={styles.infoValue}>{selectedShift.clinicName || "—"}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Shift Name</span>
                      <span className={styles.infoValue}>{selectedShift.shiftName}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Start Time</span>
                      <span className={styles.infoValue}>{formatTime(selectedShift.timeStart)}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>End Time</span>
                      <span className={styles.infoValue}>{formatTime(selectedShift.timeEnd)}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Working Hours</span>
                      <span className={styles.infoValue}>
                        {selectedShift.workingHours ? `${selectedShift.workingHours} hours` : "—"}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Created</span>
                      <span className={styles.infoValue}>
                        {selectedShift.dateCreated
                          ? new Date(selectedShift.dateCreated).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.detailModalFooter}>
                <button
                  onClick={() => openDeleteConfirm(selectedShift)}
                  className={styles.btnCancel}
                >
                  <FiTrash2 style={{ marginRight: "8px" }} /> Delete
                </button>
                <button
                  onClick={() => handleUpdateClick(selectedShift)}
                  className={styles.btnUpdate}
                >
                  Update Shift
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── Add Form Modal ──────────────── */}
      {isAddFormOpen && (
        <div className={styles.detailModalOverlay}>
          <div
            className={styles.addModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.detailModalHeader}>
              <div className={styles.detailHeaderContent}>
                <h2>Add New Work Shift</h2>
              </div>
              <div className={styles.clinicNameone}>
                <FaClinicMedical
                  size={20}
                  style={{ verticalAlign: "middle", margin: "6px", marginTop: "0px" }}
                />
                {localStorage.getItem("clinicName") || "—"}
              </div>
              <button onClick={closeAddForm} className={styles.detailCloseBtn}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.addModalBody}>

              <div className={styles.addSection}>
                <div className={styles.addSectionHeader}>
                  <h3>Shift Information</h3>
                </div>

                <div className={styles.addFormGrid}>

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

                </div>
              </div>

              <div className={styles.detailModalFooter}>
                <button type="button" onClick={closeAddForm} className={styles.btnCancel}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className={`${styles.btnSubmit} ${!isFormValid ? styles.btnSubmitDisabled : ""}`}
                  title={!isFormValid ? "Please fill all required fields" : ""}
                >
                  {formLoading ? "Adding..." : "Add Shift"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────── Update Shift Modal ──────────────── */}
      {isUpdateFormOpen && updateShiftData && (
        <UpdateWorkShift
          shift={updateShiftData}
          onClose={handleUpdateClose}
          onSuccess={handleUpdateSuccess}
          onError={handleUpdateError}
        />
      )}
    </div>
  );
};

export default WorkShift;