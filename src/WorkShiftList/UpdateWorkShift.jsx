// src/components/UpdateWorkShift.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiX, FiArrowLeft, FiSave } from 'react-icons/fi';
import { getShiftList, updateShift } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import './WorkShift.css';

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
];

// ────────────────────────────────────────────────
const UpdateWorkShift = () => {
  const navigate = useNavigate();
  const params = useParams();
  
  const shiftId = params.shiftId || params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shiftData, setShiftData] = useState(null);

  const [formData, setFormData] = useState({
    shiftName: '',
    timeStart: '',
    timeEnd: '',
    workingHours: '',
    status: 1,
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // ────────────────────────────────────────────────
const getStoredClinicId = () => {
  const clinicId = localStorage.getItem('clinicID');
  return clinicId ? parseInt(clinicId, 10) : null;
};

  // ────────────────────────────────────────────────
  // Helper functions
  const formatTimeFor24Hr = (time) => {
    if (!time) return '';
    // Ensure format is HH:MM:SS
    const parts = time.split(':');
    if (parts.length === 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
    }
    if (parts.length === 3) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
    }
    return time;
  };

  const formatTimeForInput = (time) => {
    if (!time) return '';
    // Convert HH:MM:SS to HH:MM for input[type="time"]
    const parts = time.split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
    return time;
  };

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
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const shiftList = await getShiftList(0);
        const shift = shiftList.find((s) => s.id === Number(shiftId));

        if (!shift) {
          throw new Error(`Work shift not found with ID: ${shiftId}`);
        }

        setShiftData(shift);

        setFormData({
          shiftName: shift.shiftName || '',
          timeStart: formatTimeForInput(shift.timeStart) || '',
          timeEnd: formatTimeForInput(shift.timeEnd) || '',
          workingHours: shift.workingHours || '',
          status: shift.status === 'active' ? 1 : 2,
        });
      } catch (err) {
        setError({
          message: err.message || 'Failed to load work shift data',
          status: err.status || 500,
        });
      } finally {
        setLoading(false);
      }
    };

    if (shiftId) {
      fetchData();
    } else {
      setLoading(false);
      setError({ message: 'No shift ID provided', status: 400 });
    }
  }, [shiftId]);

  // ────────────────────────────────────────────────
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

  const handleBack = () => {
    navigate('/work-shift');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);

    try {
      const clinicId = getStoredClinicId();
      if (!clinicId) {
        throw new Error('Clinic ID not found in localStorage');
      }

      const workingHours = formData.workingHours 
        ? parseFloat(formData.workingHours) 
        : calculateWorkingHours(formData.timeStart, formData.timeEnd);

      await updateShift({
        ShiftID: Number(shiftId),
        ClinicID: clinicId,
        ShiftName: formData.shiftName.trim(),
        ShiftTimeStart: formatTimeFor24Hr(formData.timeStart),
        ShiftTimeEnd: formatTimeFor24Hr(formData.timeEnd),
        WorkingHours: workingHours,
        Status: Number(formData.status),
      });

      setFormSuccess(true);
      setTimeout(() => {
        navigate('/work-shift');
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to update work shift.');
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  if (error && error?.status >= 400) {
    return <ErrorHandler error={error} />;
  }

  if (loading) {
    return <div className="clinic-loading">Loading work shift data...</div>;
  }

  if (error) {
    return (
      <div className="clinic-list-wrapper">
        <Header title="Update Work Shift" />
        <div className="clinic-error">Error: {error.message || error}</div>
        <button onClick={handleBack} className="clinic-add-btn clinic-back-btn">
          <FiArrowLeft /> Back to List
        </button>
      </div>
    );
  }

  if (!shiftData) {
    return (
      <div className="clinic-list-wrapper">
        <Header title="Update Work Shift" />
        <div className="clinic-error">Work shift not found</div>
        <button onClick={handleBack} className="clinic-add-btn clinic-back-btn">
          <FiArrowLeft /> Back to List
        </button>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  return (
    <div className="clinic-list-wrapper">
      <ErrorHandler error={error} />
      <Header title="Update Work Shift" />

      <div className="clinic-toolbar">
        <button onClick={handleBack} className="clinic-add-btn">
          <FiArrowLeft style={{ marginRight: '8px' }} />
          Back to List
        </button>
      </div>

      <div className="clinic-table-container update-employee-container" style={{ padding: '20px', borderRadius: '17px' }}>
        <div className="clinic-modal form-modal update-employee-form" style={{ maxWidth: 'none', width: '100%', maxHeight: 'none' }}>
          <div className="clinic-modal-header update-employee-header">
            <h2>Update Work Shift: {formData.shiftName}</h2>
          </div>

          <form onSubmit={handleSubmit} className="clinic-modal-body">
            {formError && <div className="form-error">{formError}</div>}
            {formSuccess && <div className="form-success">Work shift updated successfully!</div>}

            <div className="form-grid">
              <h3 className="form-section-title">Shift Information</h3>

              <div className="form-group full-width">
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

              <div className="form-group">
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

              <div className="form-group">
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

              <div className="form-group">
                <label>Working Hours</label>
                <input
                  type="number"
                  step="0.01"
                  name="workingHours"
                  value={formData.workingHours}
                  onChange={handleInputChange}
                  placeholder="Auto-calculated from times"
                />
              </div>

              <div className="form-group">
                <label>
                  Status <span className="required">*</span>
                </label>
                <select required name="status" value={formData.status} onChange={handleInputChange}>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="clinic-modal-footer update-employee-footer">
              <button type="button" onClick={handleBack} className="btn-cancel">
                Cancel
              </button>
              <button type="submit" disabled={formLoading} className="btn-submit">
                <FiSave className="btn-icon" style={{ marginRight: '6px' }} />
                {formLoading ? 'Updating...' : 'Update Shift'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateWorkShift;