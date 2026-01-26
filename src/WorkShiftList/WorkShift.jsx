// src/components/WorkShift.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiPlus,
  FiX,
  FiTrash2,
} from 'react-icons/fi';
import { 
  getShiftList,
  addShift,
  deleteShift 
} from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './WorkShift.module.css';

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
];

// ────────────────────────────────────────────────
const WorkShift = () => {
  const navigate = useNavigate();

  // Data & Filter
  const [shifts, setShifts] = useState([]);
  const [allShifts, setAllShifts] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected / Modal
  const [selectedShift, setSelectedShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Form Modal
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    shiftName: '',
    timeStart: '',
    timeEnd: '',
    workingHours: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Delete Confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ────────────────────────────────────────────────
  // Get Clinic ID from localStorage
  const getStoredClinicId = () => {
    const clinicId = localStorage.getItem('clinicID');
    return clinicId ? parseInt(clinicId, 10) : null;
  };

  // ────────────────────────────────────────────────
  // Helper function to calculate working hours
  const calculateWorkingHours = (start, end) => {
    if (!start || !end) return null;
    
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    let hours = endHour - startHour;
    let minutes = endMin - startMin;
    
    if (minutes < 0) {
      hours -= 1;
      minutes += 60;
    }
    
    if (hours < 0) {
      hours += 24;
    }
    
    return hours + (minutes / 60);
  };

  // ────────────────────────────────────────────────
  // Data fetching
  useEffect(() => {
    const fetchShifts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const clinicId = getStoredClinicId();
        const data = await getShiftList(clinicId);
        
        setShifts(data);
        setAllShifts(data);
      } catch (err) {
        console.error('fetchShifts error:', err);
        setError(
          err?.status >= 400 || err?.code >= 400
            ? err
            : { message: err.message || 'Failed to load work shifts' }
        );
      } finally {
        setLoading(false);
      }
    };
    fetchShifts();
  }, []);

  // ────────────────────────────────────────────────
  // Computed values
  const filteredShifts = useMemo(() => {
    if (!searchTerm.trim()) return allShifts;
    const term = searchTerm.toLowerCase();
    return allShifts.filter(
      (shift) =>
        shift.shiftName?.toLowerCase().includes(term) ||
        shift.clinicName?.toLowerCase().includes(term) ||
        shift.timeStart?.toLowerCase().includes(term) ||
        shift.timeEnd?.toLowerCase().includes(term)
    );
  }, [allShifts, searchTerm]);

  // ────────────────────────────────────────────────
  // Helper functions
  const getStatusClass = (status) => {
    if (status === 'active') return 'active';
    if (status === 'inactive') return 'inactive';
    return 'inactive';
  };

  const formatTime = (time) => {
    if (!time) return '—';
    // Convert 24hr format to 12hr format for display
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatTimeFor24Hr = (time) => {
    if (!time) return '';
    // Ensure format is HH:MM:SS
    const parts = time.split(':');
    if (parts.length === 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
    }
    return time;
  };

  // ────────────────────────────────────────────────
  // Handlers
  const handleSearch = () => setSearchTerm(searchInput.trim());
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const openDetails = (shift) => setSelectedShift(shift);
  
  const closeModal = () => setSelectedShift(null);

  const openAddForm = () => {
    setFormData({
      shiftName: '',
      timeStart: '',
      timeEnd: '',
      workingHours: '',
    });
    setFormError('');
    setFormSuccess(false);
    setIsAddFormOpen(true);
  };

  const closeAddForm = () => {
    setIsAddFormOpen(false);
    setFormLoading(false);
    setFormError('');
    setFormSuccess(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      
      // Auto-calculate working hours when both times are set
      if (name === 'timeStart' || name === 'timeEnd') {
        if (updated.timeStart && updated.timeEnd) {
          const hours = calculateWorkingHours(updated.timeStart, updated.timeEnd);
          updated.workingHours = hours !== null ? hours.toFixed(2) : '';
        }
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);
    setError(null);

    try {
      const clinicId = getStoredClinicId();
      
      if (!clinicId) {
        throw new Error('Clinic ID not found in localStorage');
      }

      const workingHours = formData.workingHours 
        ? parseFloat(formData.workingHours) 
        : calculateWorkingHours(formData.timeStart, formData.timeEnd);

      await addShift({
        clinicId: clinicId,
        ShiftName: formData.shiftName.trim(),
        ShiftTimeStart: formatTimeFor24Hr(formData.timeStart),
        ShiftTimeEnd: formatTimeFor24Hr(formData.timeEnd),
        WorkingHours: workingHours,
      });

      setFormSuccess(true);
      setTimeout(() => {
        closeAddForm();
        const storedClinicId = getStoredClinicId();
        getShiftList(storedClinicId).then((data) => {
          setShifts(data);
          setAllShifts(data);
        });
      }, 1500);
    } catch (err) {
      console.error('Add shift failed:', err);
      setFormError(err.message || 'Failed to add work shift.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateClick = (shift) => {
    navigate(`/update-shift/${shift.id}`);
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

    setDeleteLoading(true);
    setError(null);

    try {
      await deleteShift(shiftToDelete.id);
      
      // Refresh list
      const clinicId = getStoredClinicId();
      const data = await getShiftList(clinicId);
      setShifts(data);
      setAllShifts(data);
      
      closeDeleteConfirm();
      if (selectedShift?.id === shiftToDelete.id) {
        closeModal();
      }
    } catch (err) {
      console.error('Delete shift failed:', err);
      setError({
        message: err.message || 'Failed to delete work shift',
        status: err.status || 500,
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.loading}>Loading work shifts...</div>;

  if (error) return <div className={styles.error}>Error: {error.message || error}</div>;

  // ────────────────────────────────────────────────
  return (
    <div className={styles.shiftWrapper}>
      <ErrorHandler error={error} />
      <Header title="Work Shift Management" />

      {/* Toolbar */}
      <div className={styles.shiftToolbar}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search by shift name, clinic, time..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className={styles.searchInput}
          />
          <button onClick={handleSearch} className={styles.searchBtn}>
            <FiSearch size={20} />
          </button>
        </div>

        <div className={styles.addSection}>
          <button onClick={openAddForm} className={styles.addBtn}>
            <FiPlus size={22} /> Add Shift
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.shiftTable}>
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
            {filteredShifts.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.noData}>
                  {searchTerm ? 'No work shifts found.' : 'No work shifts registered yet.'}
                </td>
              </tr>
            ) : (
              filteredShifts.map((shift) => (
                <tr key={shift.id}>
                  <td>
                    <div className={styles.shiftNameCell}>
                      <div className={styles.shiftAvatar}>
                        {shift.shiftName?.charAt(0).toUpperCase() || 'S'}
                      </div>
                      <div>
                        <div className={styles.shiftName}>{shift.shiftName}</div>
                      </div>
                    </div>
                  </td>
                  <td>{shift.clinicName || '—'}</td>
                  <td>{formatTime(shift.timeStart)}</td>
                  <td>{formatTime(shift.timeEnd)}</td>
                  <td>{shift.workingHours ? `${shift.workingHours} hrs` : '—'}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[getStatusClass(shift.status)]}`}>
                      {shift.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => openDetails(shift)} className={styles.detailsBtn}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ──────────────── Details Modal ──────────────── */}
      {selectedShift && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={`${styles.modal} ${styles.detailsModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailsModalHeader}>
              <div className={styles.detailsHeaderContent}>
                <div className={styles.shiftAvatarLarge}>
                  {selectedShift.shiftName?.charAt(0).toUpperCase() || 'S'}
                </div>
                <div>
                  <h2>{selectedShift.shiftName}</h2>
                  <p className={styles.shiftSubtitle}>Work Shift</p>
                </div>
              </div>
              <div className={styles.statusBadgeLargeWrapper}>
                <span className={`${styles.statusBadge} ${styles.large} ${styles[getStatusClass(selectedShift.status)]}`}>
                  {selectedShift.status.toUpperCase()}
                </span>
              </div>
              <button onClick={closeModal} className={styles.modalClose}>
                ×
              </button>
            </div>

            <div className={styles.detailsModalBody}>
              <table className={styles.detailsTable}>
                <tbody>
                  <tr>
                    <td className="label">Clinic</td>
                    <td className="value">{selectedShift.clinicName || '—'}</td>
                  </tr>
                  <tr>
                    <td className="label">Shift Name</td>
                    <td className="value">{selectedShift.shiftName}</td>
                  </tr>
                  <tr>
                    <td className="label">Start Time</td>
                    <td className="value">{formatTime(selectedShift.timeStart)}</td>
                  </tr>
                  <tr>
                    <td className="label">End Time</td>
                    <td className="value">{formatTime(selectedShift.timeEnd)}</td>
                  </tr>
                  <tr>
                    <td className="label">Working Hours</td>
                    <td className="value">
                      {selectedShift.workingHours ? `${selectedShift.workingHours} hours` : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td className="label">Created</td>
                    <td className="value">
                      {selectedShift.dateCreated 
                        ? new Date(selectedShift.dateCreated).toLocaleDateString() 
                        : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={styles.modalFooter}>
              <button 
                onClick={() => openDeleteConfirm(selectedShift)} 
                className={styles.btnHold}
                style={{ marginRight: 'auto' }}
              >
                <FiTrash2 style={{ marginRight: '6px' }} />
                Delete
              </button>
              <button onClick={() => handleUpdateClick(selectedShift)} className={styles.btnUpdate}>
                Update Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── Add Form Modal ──────────────── */}
      {isAddFormOpen && (
        <div className={styles.modalOverlay} onClick={closeAddForm}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add New Work Shift</h2>
              <button onClick={closeAddForm} className={styles.modalClose}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.modalBody}>
              {formError && <div className={styles.formError}>{formError}</div>}
              {formSuccess && <div className={styles.formSuccess}>Work shift added successfully!</div>}

              <div className={styles.formGrid}>
                <h3 className={styles.formSectionTitle}>Shift Information</h3>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>
                    Shift Name <span className="required">*</span>
                  </label>
                  <input
                    required
                    name="shiftName"
                    value={formData.shiftName}
                    onChange={handleInputChange}
                    placeholder="e.g., Morning Shift, Night Shift"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>
                    Start Time <span className="required">*</span>
                  </label>
                  <input
                    required
                    type="time"
                    name="timeStart"
                    value={formData.timeStart}
                    onChange={handleInputChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>
                    End Time <span className="required">*</span>
                  </label>
                  <input
                    required
                    type="time"
                    name="timeEnd"
                    value={formData.timeEnd}
                    onChange={handleInputChange}
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Working Hours</label>
                  <input
                    required
                    type="number"
                    name="workingHours"
                    value={formData.workingHours}
                    onChange={handleInputChange}
                    placeholder="Auto-calculated from times"
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={closeAddForm} className={styles.btnCancel}>
                  Cancel
                </button>
                <button type="submit" disabled={formLoading} className={styles.btnSubmit}>
                  {formLoading ? 'Adding...' : 'Add Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────── Delete Confirmation Modal ──────────────── */}
      {deleteConfirmOpen && shiftToDelete && (
        <div className={styles.modalOverlay} onClick={closeDeleteConfirm}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className={styles.modalHeader}>
              <h2>Confirm Delete</h2>
              <button onClick={closeDeleteConfirm} className={styles.modalClose}>
                <FiX />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p style={{ marginBottom: '20px', fontSize: '0.95rem', color: '#475569' }}>
                Are you sure you want to delete the work shift <strong>"{shiftToDelete.shiftName}"</strong>? 
                This action cannot be undone.
              </p>
            </div>

            <div className={styles.modalFooter}>
              <button onClick={closeDeleteConfirm} className={styles.btnCancel} disabled={deleteLoading}>
                Cancel
              </button>
              <button 
                onClick={handleDelete} 
                className={styles.btnHold}
                disabled={deleteLoading}
                style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)' }}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkShift;