// src/components/SlotList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { FiSearch, FiCalendar, FiClock, FiCheckCircle, FiXCircle, FiTrash2, FiEdit, FiPlus, FiX } from 'react-icons/fi';
import { getSlotList, getEmployeeList, deleteSlot, updateSlot, addSlot } from '../Api/Api.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './SlotList.module.css';
import { FaClinicMedical } from 'react-icons/fa';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { id: 1,  label: 'Active' },
  { id: 2, label: 'Deleted' },
];

const BOOKED_OPTIONS = [
  { value: 'all',       label: 'All Slots' },
  { value: 'available', label: 'Available' },
  { value: 'booked',    label: 'Booked' },
];

const PAGE_SIZE = 20;

const getTodayDate = () => new Date().toISOString().split('T')[0];

// ────────────────────────────────────────────────
const SlotList = () => {
  const [slots,    setSlots]   = useState([]);
  const [allSlots, setAllSlots] = useState([]);
  const [doctors,  setDoctors] = useState([]);
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  // Filter inputs (staged)
  const [filterInputs, setFilterInputs] = useState({
    doctorId:   'all',
    fromDate:   getTodayDate(),
    toDate:     getTodayDate(),
    bookedFilter: 'all',
    status:     '',
  });

  // Applied filters (drive API)
  const [appliedFilters, setAppliedFilters] = useState({
    doctorId:     'all',
    fromDate:     getTodayDate(),
    toDate:       getTodayDate(),
    bookedFilter: 'all',
    status:       '',
  });

  // Modals
  const [showAddModal,    setShowAddModal]    = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedSlot,    setSelectedSlot]    = useState(null);
  const [hoveredSlotId,   setHoveredSlotId]   = useState(null);

  const [formData, setFormData] = useState({ doctorId: '', slotDate: '', slotTime: '' });
  const [updateFormData, setUpdateFormData] = useState({ appointmentId: 0, isBooked: 0 });
  const [addValidationMessages,    setAddValidationMessages]    = useState({});
  const [updateValidationMessages, setUpdateValidationMessages] = useState({});

  // ────────────────────────────────────────────────
  // Derived: are any filters changed from defaults?
  const defaultFilters = { doctorId: 'all', fromDate: getTodayDate(), toDate: getTodayDate(), bookedFilter: 'all', status: '' };

  const hasActiveFilters =
    appliedFilters.doctorId     !== defaultFilters.doctorId     ||
    appliedFilters.fromDate     !== defaultFilters.fromDate     ||
    appliedFilters.toDate       !== defaultFilters.toDate       ||
    appliedFilters.bookedFilter !== defaultFilters.bookedFilter ||
    appliedFilters.status       !== defaultFilters.status;

  // ────────────────────────────────────────────────
  // Validation
  const getLiveValidationMessage = (fieldName, value) => {
    switch (fieldName) {
      case 'doctorId':
        if (!value) return 'Please select a doctor';
        return '';
      case 'slotDate':
        if (!value) return 'Please select a date';
        const selected = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selected.setHours(0, 0, 0, 0);
        if (selected < today) return 'Past dates are not allowed';
        return '';
      case 'slotTime':
        if (!value) return 'Please select a time';
        return '';
      case 'appointmentId':
        if (value && isNaN(Number(value))) return 'Must be a number';
        if (value && Number(value) < 0) return 'Cannot be negative';
        return '';
      case 'isBooked':
        if (value === '' || value === undefined) return 'Please select booking status';
        return '';
      default:
        return '';
    }
  };

  // ────────────────────────────────────────────────
  // Fetch doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const clinicId = await getStoredClinicId();
        const branchId = await getStoredBranchId();
        const data = await getEmployeeList(clinicId, { BranchID: branchId, Designation: 1, Status: 1 });
        setDoctors(data);
      } catch (err) {
        console.error('Failed to load doctors:', err);
      }
    };
    fetchDoctors();
  }, []);

  // ────────────────────────────────────────────────
  // Fetch slots driven by appliedFilters + page
  const fetchSlots = async (filters = appliedFilters, pageNum = page) => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const options = {
        BranchID:     branchId,
        DoctorID:     filters.doctorId !== 'all' ? Number(filters.doctorId) : 0,
        FromSlotDate: filters.fromDate || '',
        ToSlotDate:   filters.toDate   || '',
        Page:         pageNum,
        PageSize:     PAGE_SIZE,
        IsBooked:
          filters.bookedFilter === 'booked'
            ? 1
            : filters.bookedFilter === 'available'
            ? 0
            : -1,
        Status:
          filters.status !== ''
            ? Number(filters.status)
            : -1,
      };

      const data = await getSlotList(clinicId, options);
      setSlots(data);
      setAllSlots(data);
      setHasNext(data.length === PAGE_SIZE);
    } catch (err) {
      console.error('fetchSlots error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load slots' }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots(appliedFilters, 1);
    setPage(1);
  }, [appliedFilters]);

  // ────────────────────────────────────────────────
  // Computed values
  const groupedSlots = useMemo(() => {
    const groups = {};
    slots.forEach((slot) => {
      const date = slot.slotDate || 'Unknown';
      if (!groups[date]) groups[date] = [];
      groups[date].push(slot);
    });
    return Object.keys(groups)
      .sort()
      .reduce((acc, date) => {
        acc[date] = groups[date].sort((a, b) =>
          (a.slotTime || '').localeCompare(b.slotTime || '')
        );
        return acc;
      }, {});
  }, [slots]);

  // ────────────────────────────────────────────────
  // Helpers
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };

  const getSlotStatus = (slot) => {
    if (slot.status === 'inactive' || slot.status === 2) return 'deleted';
    return slot.isBooked ? 'booked' : 'available';
  };

  // ────────────────────────────────────────────────
  // Filter handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filterInputs });
    setPage(1);
  };

  const handleClearFilters = () => {
    const empty = { ...defaultFilters };
    setFilterInputs(empty);
    setAppliedFilters(empty);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    setPage(newPage);
    fetchSlots(appliedFilters, newPage);
  };

  // ────────────────────────────────────────────────
  // Add slot
  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    const message = getLiveValidationMessage(name, value);
    setAddValidationMessages((prev) => ({ ...prev, [name]: message }));
  };

  const validateAddForm = () => {
    const errors = {};
    ['doctorId', 'slotDate', 'slotTime'].forEach((field) => {
      const msg = getLiveValidationMessage(field, formData[field]);
      if (msg) errors[field] = msg;
    });
    setAddValidationMessages((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!validateAddForm()) return;
    try {
      setLoading(true);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      await addSlot({
        clinicId:  parseInt(clinicId),
        branchId:  parseInt(branchId),
        doctorId:  parseInt(formData.doctorId),
        slotDate:  formData.slotDate,
        slotTime:  formData.slotTime + ':00',
      });
      setShowAddModal(false);
      setFormData({ doctorId: '', slotDate: '', slotTime: '' });
      setAddValidationMessages({});
      fetchSlots(appliedFilters, page);
    } catch (err) {
      console.error('Add slot error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  // Update slot
  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateFormData((prev) => ({ ...prev, [name]: value }));
    const message = getLiveValidationMessage(name, value);
    setUpdateValidationMessages((prev) => ({ ...prev, [name]: message }));
  };

  const validateUpdateForm = () => {
    const errors = {};
    ['isBooked'].forEach((field) => {
      const msg = getLiveValidationMessage(field, updateFormData[field]);
      if (msg) errors[field] = msg;
    });
    const appIdMsg = getLiveValidationMessage('appointmentId', updateFormData.appointmentId);
    if (appIdMsg) errors.appointmentId = appIdMsg;
    setUpdateValidationMessages((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const handleUpdateSlot = async (e) => {
    e.preventDefault();
    if (!validateUpdateForm()) return;
    try {
      setLoading(true);
      await updateSlot({
        slotId:        selectedSlot.id,
        appointmentId: parseInt(updateFormData.appointmentId),
        isBooked:      parseInt(updateFormData.isBooked),
      });
      setShowUpdateModal(false);
      setSelectedSlot(null);
      setUpdateFormData({ appointmentId: 0, isBooked: 0 });
      setUpdateValidationMessages({});
      fetchSlots(appliedFilters, page);
    } catch (err) {
      console.error('Update slot error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this slot?')) return;
    try {
      setLoading(true);
      await deleteSlot(slotId);
      fetchSlots(appliedFilters, page);
    } catch (err) {
      console.error('Delete slot error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const openUpdateModal = (slot) => {
    setSelectedSlot(slot);
    setUpdateFormData({ appointmentId: slot.appointmentId || 0, isBooked: slot.isBooked ? 1 : 0 });
    setShowUpdateModal(true);
  };

  useEffect(() => {
    if (!showAddModal)    setAddValidationMessages({});
    if (!showUpdateModal) setUpdateValidationMessages({});
  }, [showAddModal, showUpdateModal]);

  // ────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.loading}>Loading slots...</div>;
  if (error)   return <div className={styles.error}>Error: {error.message || error}</div>;

  const startRecord = slots.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endRecord   = startRecord + slots.length - 1;

  // ────────────────────────────────────────────────
  return (
    <div className={styles.listWrapper}>
      <ErrorHandler error={error} />
      <Header title="Appointment Slots" />

      {/* ── Filter Bar (single line) ── */}
      <div className={styles.toolbar}>
        <div className={styles.filtersRow}>

          {/* Doctor */}
          <select
            name="doctorId"
            value={filterInputs.doctorId}
            onChange={handleFilterChange}
            className={styles.selectInput}
          >
            <option value="all">All Doctors</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.firstName} {doc.lastName}
              </option>
            ))}
          </select>

          {/* Booked filter */}
          <select
            name="bookedFilter"
            value={filterInputs.bookedFilter}
            onChange={handleFilterChange}
            className={styles.selectInput}
          >
            {BOOKED_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Status */}
          <select
            name="status"
            value={filterInputs.status}
            onChange={handleFilterChange}
            className={styles.selectInput}
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>

          {/* From Date */}
          <input
            type="date"
            name="fromDate"
            value={filterInputs.fromDate}
            onChange={handleFilterChange}
            className={styles.dateInput}
          />

          {/* To Date */}
          <input
            type="date"
            name="toDate"
            value={filterInputs.toDate}
            onChange={handleFilterChange}
            className={styles.dateInput}
          />

          {/* Actions */}
          <div className={styles.filterActions}>
            <button onClick={handleSearch} className={styles.searchButton}>
              <FiSearch size={16} />
              Search
            </button>

            {hasActiveFilters && (
              <button onClick={handleClearFilters} className={styles.clearButton}>
                <FiX size={16} />
                Clear
              </button>
            )}

            <button onClick={() => setShowAddModal(true)} className={styles.addBtn}>
              <FiPlus size={18} />
              Add Slot
            </button>
          </div>
        </div>
      </div>

      {/* ── Slots Timeline + Pagination ── */}
      <div className={styles.tableSection}>
        <div className={styles.slotsTimeline}>
          {Object.keys(groupedSlots).length === 0 ? (
            <div className={styles.noData}>
              No slots found for the selected filters.
            </div>
          ) : (
            Object.entries(groupedSlots).map(([date, dateSlots]) => (
              <div key={date} className={styles.dateGroup}>
                <div className={styles.dateHeader}>
                  <FiCalendar size={18} />
                  <h3>{formatDate(date)}</h3>
                  <span className={styles.slotCount}>
                    {dateSlots.length} slot{dateSlots.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className={styles.slotsGrid}>
                  {dateSlots.map((slot) => {
                    const slotStatus = getSlotStatus(slot);
                    return (
                      <div
                        key={slot.id}
                        className={`${styles.slotCard} ${styles[slotStatus]}`}
                        onMouseEnter={() => setHoveredSlotId(slot.id)}
                        onMouseLeave={() => setHoveredSlotId(null)}
                      >
                        <div className={styles.slotTime}>
                          <FiClock size={14} />
                          {formatTime(slot.slotTime)}
                        </div>

                        <div className={styles.slotDoctor}>
                          <div className={styles.doctorAvatar}>
                            {slot.doctorName?.charAt(0).toUpperCase() || 'D'}
                          </div>
                          <div className={styles.doctorInfo}>
                            <div className={styles.doctorName}>{slot.doctorName}</div>
                            <div className={styles.doctorCode}>{slot.doctorCode}</div>
                          </div>
                        </div>

                        <div className={styles.slotStatus}>
                          {slotStatus === 'deleted' ? (
                            <>
                              <FiTrash2 size={14} className={`${styles.statusIcon} ${styles.deleted}`} />
                              <span className={`${styles.statusText} ${styles.deleted}`}>Deleted</span>
                            </>
                          ) : slotStatus === 'booked' ? (
                            <>
                              <FiCheckCircle size={14} className={`${styles.statusIcon} ${styles.booked}`} />
                              <span className={`${styles.statusText} ${styles.booked}`}>Booked</span>
                            </>
                          ) : (
                            <>
                              <FiXCircle size={14} className={`${styles.statusIcon} ${styles.available}`} />
                              <span className={`${styles.statusText} ${styles.available}`}>Available</span>
                            </>
                          )}
                        </div>

                        {slotStatus !== 'deleted' && (
                          <div className={`${styles.slotActions} ${hoveredSlotId === slot.id ? styles.visible : ''}`}>
                            {slot.isBooked && (
                              <button
                                onClick={() => openUpdateModal(slot)}
                                className={styles.btnEdit}
                                title="Update Slot"
                              >
                                <FiEdit size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteSlot(slot.id)}
                              className={styles.btnDelete}
                              title="Delete Slot"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Bar */}
        <div className={styles.paginationBar}>
          <div className={styles.paginationInfo}>
            {slots.length > 0
              ? `Showing ${startRecord}–${endRecord} records`
              : 'No records'}
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
              disabled={!hasNext}
              title="Next page"
            >
              ›
            </button>
          </div>

          <div className={styles.pageSizeInfo}>
            Page Size: <strong>{PAGE_SIZE}</strong>
          </div>
        </div>
      </div>

      {/* ── Add Slot Modal ── */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add New Slot</h2>
              <div className={styles.headerRight}>
                <div className={styles.clinicNameone}>
                  <FaClinicMedical
                    size={20} style={{ verticalAlign: "middle", margin: "6px", marginTop: "0px" }} />
                  {localStorage.getItem("clinicName") || "—"}
                </div>
                <button onClick={() => setShowAddModal(false)} className={styles.modalCloseBtn}>×</button>
              </div>
            </div>
            <form onSubmit={handleAddSlot} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Doctor *</label>
                <select
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleAddChange}
                  required
                  className={styles.formInput}
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.firstName} {doc.lastName}
                    </option>
                  ))}
                </select>
                {addValidationMessages.doctorId && (
                  <span className={styles.validationMsg}>{addValidationMessages.doctorId}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Slot Date *</label>
                <input
                  type="date"
                  name="slotDate"
                  value={formData.slotDate}
                  onChange={handleAddChange}
                  required
                  className={styles.formInput}
                  min={new Date().toISOString().split('T')[0]}
                />
                {addValidationMessages.slotDate && (
                  <span className={styles.validationMsg}>{addValidationMessages.slotDate}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Slot Time *</label>
                <input
                  type="time"
                  name="slotTime"
                  value={formData.slotTime}
                  onChange={handleAddChange}
                  required
                  className={styles.formInput}
                />
                {addValidationMessages.slotTime && (
                  <span className={styles.validationMsg}>{addValidationMessages.slotTime}</span>
                )}
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowAddModal(false)} className={styles.btnCancel}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnSubmit}>
                  Add Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Update Slot Modal ── */}
      {showUpdateModal && selectedSlot && (
        <div className={styles.modalOverlay} onClick={() => setShowUpdateModal(false)}>
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Update Slot</h2>
              <button onClick={() => setShowUpdateModal(false)} className={styles.modalCloseBtn}>×</button>
            </div>
            <form onSubmit={handleUpdateSlot} className={styles.modalForm}>
              <div className={styles.slotDetailsInfo}>
                <p><strong>Doctor:</strong> {selectedSlot.doctorName}</p>
                <p><strong>Date:</strong> {formatDate(selectedSlot.slotDate)}</p>
                <p><strong>Time:</strong> {formatTime(selectedSlot.slotTime)}</p>
              </div>

              <div className={styles.formGroup}>
                <label>Appointment ID</label>
                <input
                  type="number"
                  name="appointmentId"
                  value={updateFormData.appointmentId}
                  onChange={handleUpdateChange}
                  className={styles.formInput}
                  placeholder="0 for no appointment"
                />
                {updateValidationMessages.appointmentId && (
                  <span className={styles.validationMsg}>{updateValidationMessages.appointmentId}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Booking Status *</label>
                <select
                  name="isBooked"
                  value={updateFormData.isBooked}
                  onChange={handleUpdateChange}
                  required
                  className={styles.formInput}
                >
                  <option value={0}>Available</option>
                  <option value={1}>Booked</option>
                </select>
                {updateValidationMessages.isBooked && (
                  <span className={styles.validationMsg}>{updateValidationMessages.isBooked}</span>
                )}
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowUpdateModal(false)} className={styles.btnCancel}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnSubmit}>
                  Update Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotList;