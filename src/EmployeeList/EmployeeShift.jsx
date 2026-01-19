// src/components/EmployeeShift.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiX, FiTrash2, FiClock, FiCalendar } from 'react-icons/fi';
import { 
  getEmployeeList,
  getEmployeeShiftList,
  getShiftList,
  addEmployeeShift,
  deleteEmployeeShift,
  getWorkDaysList,
  addWorkDays,
  deleteWorkDays
} from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import './EmployeeShift.css';

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────
const WORK_DAYS = [
  { id: 1, label: 'Sunday' },
  { id: 2, label: 'Monday' },
  { id: 3, label: 'Tuesday' },
  { id: 4, label: 'Wednesday' },
  { id: 5, label: 'Thursday' },
  { id: 6, label: 'Friday' },
  { id: 7, label: 'Saturday' },
];

// Helper function to get day name from day number
const getDayName = (dayNumber) => {
  const days = {
    1: "Sunday",
    2: "Monday",
    3: "Tuesday",
    4: "Wednesday",
    5: "Thursday",
    6: "Friday",
    7: "Saturday"
  };
  return days[dayNumber] || "Unknown";
};

// ────────────────────────────────────────────────
const EmployeeShift = () => {
  const { id } = useParams(); // Employee ID from URL
  const navigate = useNavigate();

  // Employee & Shift data
  const [employee, setEmployee] = useState(null);
  const [employeeShiftList, setEmployeeShiftList] = useState([]);
  const [availableShifts, setAvailableShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // WorkDays data
  const [workDaysList, setWorkDaysList] = useState([]);
  const [workDaysLoading, setWorkDaysLoading] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState(0);

  // WorkDays modal states
  const [isWorkDaysModalOpen, setIsWorkDaysModalOpen] = useState(false);
  const [selectedWorkDays, setSelectedWorkDays] = useState([]);
  const [workDaysFormLoading, setWorkDaysFormLoading] = useState(false);
  const [workDaysFormError, setWorkDaysFormError] = useState('');
  const [workDaysFormSuccess, setWorkDaysFormSuccess] = useState(false);

  // Delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Delete WorkDay confirmation modal
  const [isDeleteWorkDayModalOpen, setIsDeleteWorkDayModalOpen] = useState(false);
  const [workDayToDelete, setWorkDayToDelete] = useState(null);
  const [isDeletingWorkDay, setIsDeletingWorkDay] = useState(false);
  const [deleteWorkDayError, setDeleteWorkDayError] = useState('');

  // Form submission states
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // ────────────────────────────────────────────────
  // Fetch employee details and shift assignments
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const clinicId = Number(localStorage.getItem('clinicID'));
        const branchId = Number(localStorage.getItem('branchID'));

        // Fetch employee details
        const empData = await getEmployeeList(clinicId, {
          BranchID: branchId,
          EmployeeID: Number(id),
        });

        if (empData && empData.length > 0) {
          setEmployee(empData[0]);
        } else {
          setError({ message: 'Employee not found' });
          return;
        }

        // Fetch employee shift assignments
        const shiftData = await getEmployeeShiftList(clinicId, {
          EmployeeID: Number(id),
        });

        setEmployeeShiftList(shiftData || []);

        // Fetch all available shifts
        const shifts = await getShiftList(clinicId, {
          Status: 1 // Only active shifts
        });

        setAvailableShifts(shifts || []);

        // Fetch work days for this employee
        await fetchWorkDays();

      } catch (err) {
        console.error('fetchData error:', err);
        setError(
          err?.status >= 400 || err?.code >= 400
            ? err
            : { message: err.message || 'Failed to load data' }
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  // ────────────────────────────────────────────────
  // Fetch WorkDays
  // ────────────────────────────────────────────────
  const fetchWorkDays = async () => {
    setWorkDaysLoading(true);
    try {
      const clinicId = localStorage.getItem('clinicID');
      console.log('Fetching work days for employee:', id, 'clinicId:', clinicId);
      
      const workDaysRaw = await getWorkDaysList(
        clinicId ? Number(clinicId) : 0, 
        Number(id)
      );
      
      console.log('Work days raw response:', workDaysRaw);
      
      // Process the work days and add dayName - Filter out status === 2
      const processedWorkDays = (workDaysRaw || [])
        .filter(wd => wd.status !== 'inactive' && wd.status !== 2) // Filter out inactive/deleted work days
        .map(wd => ({
          ...wd,
          dayName: getDayName(wd.workDay)
        }));
      
      console.log('Processed work days:', processedWorkDays);
      setWorkDaysList(processedWorkDays);
    } catch (err) {
      console.error('Failed to fetch work days:', err);
      setWorkDaysList([]);
    } finally {
      setWorkDaysLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  // Helper functions
  const getStatusClass = (status) => {
    if (status === 'active') return 'active';
    if (status === 'inactive') return 'inactive';
    return 'inactive';
  };

  const formatTime = (timeString) => {
    if (!timeString) return '—';
    try {
      // Handle HH:MM:SS or HH:MM format
      const parts = timeString.split(':');
      if (parts.length >= 2) {
        const hours = parseInt(parts[0], 10);
        const minutes = parts[1];
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        return `${displayHours}:${minutes} ${period}`;
      }
      return timeString;
    } catch {
      return timeString;
    }
  };

  // ────────────────────────────────────────────────
  // WorkDays Handlers
  // ────────────────────────────────────────────────
  const handleOpenWorkDaysModal = () => {
    // Pre-select existing work days
    const existingDayIds = workDaysList.map(wd => wd.workDay);
    console.log('Pre-selecting work days:', existingDayIds);
    setSelectedWorkDays(existingDayIds);
    setWorkDaysFormError('');
    setWorkDaysFormSuccess(false);
    setIsWorkDaysModalOpen(true);
  };

  const handleCloseWorkDaysModal = () => {
    setIsWorkDaysModalOpen(false);
    setSelectedWorkDays([]);
    setWorkDaysFormError('');
    setWorkDaysFormSuccess(false);
  };

  const handleWorkDayToggle = (dayId) => {
    setSelectedWorkDays((prev) => {
      if (prev.includes(dayId)) {
        return prev.filter((id) => id !== dayId);
      } else {
        return [...prev, dayId];
      }
    });
  };

  const handleWorkDaysSubmit = async (e) => {
    e.preventDefault();
    setWorkDaysFormLoading(true);
    setWorkDaysFormError('');
    setWorkDaysFormSuccess(false);

    try {
      const clinicId = localStorage.getItem('clinicID');
      
      // Get existing work day IDs
      const existingDayIds = workDaysList.map(wd => wd.workDay);
      
      // Find days to add (selected but not in existing)
      const daysToAdd = selectedWorkDays.filter(dayId => !existingDayIds.includes(dayId));
      
      // Find days to remove (existing but not in selected)
      const daysToRemove = workDaysList.filter(wd => !selectedWorkDays.includes(wd.workDay));

      console.log('Days to add:', daysToAdd);
      console.log('Days to remove:', daysToRemove);

      // Add new work days
      for (const dayId of daysToAdd) {
        const payload = {
          ClinicID: clinicId ? Number(clinicId) : 0,
          EmployeeID: Number(id),
          WorkDay: dayId,
        };
        await addWorkDays(payload);
      }

      // Remove unselected work days
      for (const workDay of daysToRemove) {
        await deleteWorkDays(workDay.id);
      }

      setWorkDaysFormSuccess(true);
      
      // Refresh work days list
      setTimeout(async () => {
        await fetchWorkDays();
        handleCloseWorkDaysModal();
      }, 1500);
    } catch (err) {
      console.error('Work days update failed:', err);
      setWorkDaysFormError(err.message || 'Failed to update work days.');
    } finally {
      setWorkDaysFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  // Delete WorkDay Handlers
  // ────────────────────────────────────────────────
  const handleOpenDeleteWorkDayModal = (workDay) => {
    setWorkDayToDelete(workDay);
    setDeleteWorkDayError('');
    setIsDeleteWorkDayModalOpen(true);
  };

  const handleCloseDeleteWorkDayModal = () => {
    setIsDeleteWorkDayModalOpen(false);
    setWorkDayToDelete(null);
    setDeleteWorkDayError('');
  };

  const handleDeleteWorkDay = async () => {
    if (!workDayToDelete) return;

    setIsDeletingWorkDay(true);
    setDeleteWorkDayError('');

    try {
      console.log('Deleting work day:', workDayToDelete);
      await deleteWorkDays(workDayToDelete.id);
      
      // Refresh work days list
      await fetchWorkDays();
      
      // Close modal
      handleCloseDeleteWorkDayModal();
    } catch (err) {
      console.error('Delete work day failed:', err);
      setDeleteWorkDayError(err.message || 'Failed to delete work day.');
    } finally {
      setIsDeletingWorkDay(false);
    }
  };

  // ────────────────────────────────────────────────
  // Delete Shift Handlers
  // ────────────────────────────────────────────────
  const handleOpenDeleteModal = (shift) => {
    setShiftToDelete(shift);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setShiftToDelete(null);
    setDeleteError('');
  };

  const handleDeleteShift = async () => {
    if (!shiftToDelete) return;

    setIsDeleting(true);
    setDeleteError('');

    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      await deleteEmployeeShift(shiftToDelete.shiftMapId);
      
      // Refresh shift list
      const shiftData = await getEmployeeShiftList(clinicId, {
        EmployeeID: Number(id),
      });
      setEmployeeShiftList(shiftData || []);
      
      // Close modal
      handleCloseDeleteModal();
    } catch (err) {
      console.error('Delete shift failed:', err);
      setDeleteError(err.message || 'Failed to delete employee shift assignment.');
    } finally {
      setIsDeleting(false);
    }
  };

  // ────────────────────────────────────────────────
  // Modal Handlers
  // ────────────────────────────────────────────────
  const handleOpenAddModal = () => {
    setSelectedShiftId(0);
    setFormError('');
    setFormSuccess(false);
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setSelectedShiftId(0);
    setFormError('');
    setFormSuccess(false);
  };

  // ────────────────────────────────────────────────
  // Form Handlers
  // ────────────────────────────────────────────────
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);

    if (!selectedShiftId || selectedShiftId === 0) {
      setFormError('Please select a shift');
      setFormLoading(false);
      return;
    }

    try {
      const clinicId = Number(localStorage.getItem('clinicID'));

      const payload = {
        ClinicID: clinicId ? Number(clinicId) : 0,
        EmployeeID: Number(id),
        ShiftID: Number(selectedShiftId)
      };

      await addEmployeeShift(payload);
      setFormSuccess(true);
      
      // Refresh shift list
      setTimeout(async () => {
        const shiftData = await getEmployeeShiftList(clinicId, {
          EmployeeID: Number(id),
        });
        setEmployeeShiftList(shiftData || []);
        handleCloseAddModal();
      }, 1500);
    } catch (err) {
      console.error('Form submission failed:', err);
      setFormError(err.message || 'Failed to assign shift to employee.');
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  // Navigation Handlers
  // ────────────────────────────────────────────────
  const handleBack = () => {
    navigate(`/view-employee/${id}`);
  };

  const handleTabClick = (tab, path) => {
    if (path) {
      navigate(path);
    }
  };

  // ────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className="clinic-loading">Loading employee shift details...</div>;

  if (error) return <div className="clinic-error">Error: {error.message || error}</div>;

  if (!employee) return <div className="clinic-error">Employee not found</div>;

  // ────────────────────────────────────────────────
  return (
    <div className="clinic-list-wrapper">
      <ErrorHandler error={error} />
      <Header title="Employee Shift" />

      {/* Back Button */}
      <div className="clinic-toolbar">
        <button onClick={handleBack} className="clinic-back-btn">
          <FiArrowLeft size={20} /> Back to Employee Details
        </button>
      </div>

      {/* Employee Details Card */}
      <div className="employee-details-card">
        
        {/* Header Section with Tabs */}
        <div className="details-card-header">
          <div className="employee-header-info">
            <h2>
              {employee.firstName} {employee.lastName}
            </h2>
            <p className="clinic-subtitle">
              {employee.designationDesc} - {employee.departmentName}
            </p>
            <span className={`status-badge large ${getStatusClass(employee.status)}`}>
              {employee.status.toUpperCase()}
            </span>
          </div>

          {/* Tab Navigation */}
          <div className="employee-tabs">
            <button
              className="tab-button"
              onClick={() => handleTabClick('details', `/view-employee/${id}`)}
            >
              Employee Details
            </button>
            <button
              className="tab-button"
              onClick={() => handleTabClick('proof', `/employee-proof/${id}`)}
            >
              Employee Proof
            </button>
            <button
              className="tab-button"
              onClick={() => handleTabClick('account', `/employee-account/${id}`)}
            >
              Beneficiary Account
            </button>
            <button
              className="tab-button active"
              onClick={() => handleTabClick('shift')}
            >
              Employee Shift
            </button>
          </div>
        </div>  

        {/* Shift List Body */}
        <div className="details-card-body">
          
          {employeeShiftList.length === 0 ? (
            <div className="empty-state">
              <FiClock size={48} style={{ color: '#ccc', marginBottom: '1rem' }} />
              <p>No shift assignment found for this employee.</p>
              <button onClick={handleOpenAddModal} className="btn-add-primary">
                Add Employee Shift
              </button>
            </div>
          ) : (
            <>
              <div className="proof-list-header">
                <h3 className="section-title">Shift Assignments</h3>
                <button onClick={handleOpenAddModal} className="btn-add-secondary">
                  Add New Shift
                </button>
              </div>

              {employeeShiftList.map((shift) => (
                <div key={shift.shiftMapId} className="details-section proof-item">
                  <div className="proof-item-header">
                    <h4 className="proof-type-title">
                      <FiClock size={20} style={{ marginRight: '0.5rem' }} />
                      {shift.shiftName}
                    </h4>
                    <div className="proof-item-actions">
                      <button
                        onClick={() => handleOpenDeleteModal(shift)}
                        className="btn-icon-delete"
                        title="Remove shift assignment"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="detail-label">Shift Name</span>
                      <span className="detail-value">{shift.shiftName}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Employee Code</span>
                      <span className="detail-value">{shift.employeeCode || '—'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Start Time</span>
                      <span className="detail-value">{formatTime(shift.shiftStartTime)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">End Time</span>
                      <span className="detail-value">{formatTime(shift.shiftEndTime)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Work Days Section */}
          <div className="work-days-section">
            <div className="proof-list-header">
              <h3 className="section-title">
                <FiCalendar size={20} style={{ marginRight: '0.5rem' }} />
                Work Days
              </h3>
              <button onClick={handleOpenWorkDaysModal} className="btn-add-secondary">
                {workDaysList.length > 0 ? 'Edit Work Days' : 'Add Work Days'}
              </button>
            </div>

            {workDaysLoading ? (
              <div className="loading-state">Loading work days...</div>
            ) : workDaysList.length === 0 ? (
              <div className="empty-state-small">
                <p>No work days assigned for this employee.</p>
              </div>
            ) : (
              <div className="work-days-list">
                {workDaysList.map((workDay) => (
                  <div key={workDay.id} className="work-day-item">
                    <span className="work-day-name">{workDay.dayName}</span>
                    <button
                      onClick={() => handleOpenDeleteWorkDayModal(workDay)}
                      className="btn-icon-delete-small"
                      title="Remove work day"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Shift Modal */}
      {isAddModalOpen && (
        <div className="clinic-modal-overlay" onClick={handleCloseAddModal}>
          <div className="clinic-modal form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="clinic-modal-header">
              <h2>Assign Shift to Employee</h2>
              <button onClick={handleCloseAddModal} className="clinic-modal-close">
                <FiX />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="clinic-modal-body">
              {formError && <div className="form-error">{formError}</div>}
              {formSuccess && <div className="form-success">
                Shift assigned successfully!
              </div>}

              <div className="form-grid">
                <div className="form-group full-width">
                  <label>
                    Select Shift <span className="required">*</span>
                  </label>
                  <select
                    required
                    value={selectedShiftId}
                    onChange={(e) => setSelectedShiftId(Number(e.target.value))}
                  >
                    <option value="0">Choose a shift</option>
                    {availableShifts.map((shift) => (
                      <option key={shift.id} value={shift.id}>
                        {shift.shiftName} ({formatTime(shift.timeStart)} - {formatTime(shift.timeEnd)})
                      </option>
                    ))}
                  </select>
                  <p className="form-hint">
                    Select the work shift to assign to this employee
                  </p>
                </div>

                {selectedShiftId > 0 && (
                  <div className="form-group full-width">
                    <div className="shift-preview">
                      {(() => {
                        const selected = availableShifts.find(s => s.id === selectedShiftId);
                        if (!selected) return null;
                        return (
                          <div className="details-section">
                            <h4>Shift Details</h4>
                            <div className="details-grid">
                              <div className="detail-item">
                                <span className="detail-label">Shift Name</span>
                                <span className="detail-value">{selected.shiftName}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Start Time</span>
                                <span className="detail-value">{formatTime(selected.timeStart)}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">End Time</span>
                                <span className="detail-value">{formatTime(selected.timeEnd)}</span>
                              </div>
                              {selected.workingHours && (
                                <div className="detail-item">
                                  <span className="detail-label">Working Hours</span>
                                  <span className="detail-value">{selected.workingHours} hours</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              <div className="clinic-modal-footer">
                <button type="button" onClick={handleCloseAddModal} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" disabled={formLoading} className="btn-submit">
                  {formLoading ? 'Assigning...' : 'Assign Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Work Days Modal */}
      {isWorkDaysModalOpen && (
        <div className="clinic-modal-overlay" onClick={handleCloseWorkDaysModal}>
          <div className="clinic-modal form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="clinic-modal-header">
              <h2>Manage Work Days</h2>
              <button onClick={handleCloseWorkDaysModal} className="clinic-modal-close">
                <FiX />
              </button>
            </div>

            <form onSubmit={handleWorkDaysSubmit} className="clinic-modal-body">
              {workDaysFormError && <div className="form-error">{workDaysFormError}</div>}
              {workDaysFormSuccess && <div className="form-success">
                Work days updated successfully!
              </div>}

              <div className="form-grid">
                <h3 className="form-section-title">Select Work Days</h3>
                
                <div className="form-group full-width">
                  <div className="workdays-container">
                    {WORK_DAYS.map((day) => (
                      <button
                        key={day.id}
                        type="button"
                        className={`workday-box ${selectedWorkDays.includes(day.id) ? 'selected' : ''}`}
                        onClick={() => handleWorkDayToggle(day.id)}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                  <p className="workdays-hint">
                    Select the days this employee will work
                  </p>
                </div>
              </div>

              <div className="clinic-modal-footer">
                <button type="button" onClick={handleCloseWorkDaysModal} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" disabled={workDaysFormLoading} className="btn-submit">
                  {workDaysFormLoading ? 'Saving...' : 'Save Work Days'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Shift Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="clinic-modal-overlay" onClick={handleCloseDeleteModal}>
          <div className="clinic-modal delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="clinic-modal-header">
              <h2>Remove Shift Assignment</h2>
              <button onClick={handleCloseDeleteModal} className="clinic-modal-close">
                <FiX />
              </button>
            </div>

            <div className="clinic-modal-body">
              {deleteError && <div className="form-error">{deleteError}</div>}
              
              <p className="delete-confirmation-text">
                Are you sure you want to remove this shift assignment?
              </p>
              
              {shiftToDelete && (
                <div className="delete-proof-details">
                  <p><strong>Employee:</strong> {shiftToDelete.employeeName}</p>
                  <p><strong>Shift:</strong> {shiftToDelete.shiftName}</p>
                  <p><strong>Timing:</strong> {formatTime(shiftToDelete.shiftStartTime)} - {formatTime(shiftToDelete.shiftEndTime)}</p>
                </div>
              )}
            </div>

            <div className="clinic-modal-footer">
              <button 
                type="button" 
                onClick={handleCloseDeleteModal} 
                className="btn-cancel"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleDeleteShift} 
                className="btn-delete"
                disabled={isDeleting}
              >
                {isDeleting ? 'Removing...' : 'Remove Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete WorkDay Confirmation Modal */}
      {isDeleteWorkDayModalOpen && (
        <div className="clinic-modal-overlay" onClick={handleCloseDeleteWorkDayModal}>
          <div className="clinic-modal delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="clinic-modal-header">
              <h2>Remove Work Day</h2>
              <button onClick={handleCloseDeleteWorkDayModal} className="clinic-modal-close">
                <FiX />
              </button>
            </div>

            <div className="clinic-modal-body">
              {deleteWorkDayError && <div className="form-error">{deleteWorkDayError}</div>}
              
              <p className="delete-confirmation-text">
                Are you sure you want to remove this work day?
              </p>
              
              {workDayToDelete && (
                <div className="delete-proof-details">
                  <p><strong>Work Day:</strong> {workDayToDelete.dayName}</p>
                </div>
              )}
            </div>

            <div className="clinic-modal-footer">
              <button 
                type="button" 
                onClick={handleCloseDeleteWorkDayModal} 
                className="btn-cancel"
                disabled={isDeletingWorkDay}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleDeleteWorkDay} 
                className="btn-delete"
                disabled={isDeletingWorkDay}
              >
                {isDeletingWorkDay ? 'Removing...' : 'Remove Work Day'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeShift;