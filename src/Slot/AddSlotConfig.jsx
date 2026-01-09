// src/components/AddSlotConfig.jsx
import React, { useState, useEffect } from 'react';
import { addSlotConfig } from '../api/api.js';

const DURATION_OPTIONS = [
  { id: 1, label: 'Daily', createDays: 30 },
  { id: 2, label: 'Weekend', createDays: 2 },
  { id: 3, label: 'Specific Day', createDays: 1 },
];

const AddSlotConfig = ({ isOpen, onClose, doctors, shifts, doctorShifts, onSuccess }) => {
  const [formData, setFormData] = useState({
    doctorId: '',
    shiftId: '',
    duration: '',
    slotDate: '',
    slotInterval: 30,
  });

  const [createSlotDays, setCreateSlotDays] = useState(0);
  const [availableShifts, setAvailableShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        doctorId: '',
        shiftId: '',
        duration: '',
        slotDate: '',
        slotInterval: 30,
      });
      setCreateSlotDays(0);
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  // Update createSlotDays based on duration
  useEffect(() => {
    const durationOption = DURATION_OPTIONS.find(d => d.id === Number(formData.duration));
    if (durationOption) {
      setCreateSlotDays(durationOption.createDays);
    } else {
      setCreateSlotDays(0);
    }
  }, [formData.duration]);

  // Update available shifts when doctor is selected
  useEffect(() => {
    console.log('Doctor ID Selected:', formData.doctorId);
    console.log('Doctor Shifts:', doctorShifts);
    console.log('All Shifts:', shifts);
    
    if (formData.doctorId && doctorShifts && shifts) {
      // Find all shift mappings for this doctor
      const doctorShiftMappings = doctorShifts.filter(
        ds => {
          console.log('Comparing:', ds.employeeId, 'with', Number(formData.doctorId));
          return ds.employeeId === Number(formData.doctorId);
        }
      );
      
      console.log('Doctor Shift Mappings:', doctorShiftMappings);
      
      // Get the shift IDs for this doctor
      const doctorShiftIds = doctorShiftMappings.map(ds => ds.shiftId);
      console.log('Doctor Shift IDs:', doctorShiftIds);
      
      // Filter shifts to only show the ones assigned to this doctor
      const filtered = shifts.filter(shift => {
        console.log('Checking shift:', shift.id, 'in', doctorShiftIds);
        return doctorShiftIds.includes(shift.id);
      });
      
      console.log('Filtered Shifts:', filtered);
      
      setAvailableShifts(filtered);
      
      // Reset shift selection if current selection is not in available shifts
      if (formData.shiftId && !doctorShiftIds.includes(Number(formData.shiftId))) {
        setFormData(prev => ({ ...prev, shiftId: '' }));
      }
    } else {
      setAvailableShifts([]);
      if (formData.shiftId) {
        setFormData(prev => ({ ...prev, shiftId: '' }));
      }
    }
  }, [formData.doctorId, doctorShifts, shifts, formData.shiftId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.doctorId) {
      setError('Please select a doctor');
      return;
    }

    if (!formData.shiftId) {
      setError('Please select a shift');
      return;
    }

    if (!formData.duration) {
      setError('Please select duration type');
      return;
    }

    // For Specific Day (duration=3), slot date is required
    if (Number(formData.duration) === 3 && !formData.slotDate) {
      setError('Please select a specific date');
      return;
    }

    if (!formData.slotInterval || formData.slotInterval <= 0) {
      setError('Please enter a valid slot interval');
      return;
    }

    setLoading(true);

    try {
      const clinicId = localStorage.getItem('clinicID');
      const branchId = localStorage.getItem('branchID');

      const payload = {
        clinicId: Number(clinicId),
        branchId: Number(branchId),
        doctorId: Number(formData.doctorId),
        shiftId: Number(formData.shiftId),
        duration: Number(formData.duration),
        slotDate: Number(formData.duration) === 3 ? formData.slotDate : '',
        slotInterval: Number(formData.slotInterval),
        createSlotDays: createSlotDays
      };

      const result = await addSlotConfig(payload);

      if (result.success) {
        setSuccess('Slot configuration added successfully!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Add slot config error:', err);
      setError(err.message || 'Failed to add slot configuration');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const showDatePicker = Number(formData.duration) === 3;

  return (
    <div className="clinic-modal-overlay">
      <div className="clinic-modal form-modal">
        <div className="clinic-modal-header">
          <h2>Add Slot Configuration</h2>
          <button onClick={onClose} className="clinic-modal-close" disabled={loading}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="clinic-modal-body">
            {error && <div className="form-error">{error}</div>}
            {success && <div className="form-success">{success}</div>}

            <div className="form-grid">
              {/* Doctor Selection */}
              <div className="form-group">
                <label>
                  Doctor <span className="required">*</span>
                </label>
                <select
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.firstName} {doc.lastName} - {doc.employeeCode}
                    </option>
                  ))}
                </select>
              </div>

              {/* Shift Selection */}
              <div className="form-group">
                <label>
                  Shift <span className="required">*</span>
                </label>
                <select
                  name="shiftId"
                  value={formData.shiftId}
                  onChange={handleChange}
                  required
                  disabled={loading || !formData.doctorId || availableShifts.length === 0}
                >
                  <option value="">
                    {!formData.doctorId 
                      ? 'Select a doctor first' 
                      : availableShifts.length === 0 
                        ? 'No shifts assigned to this doctor' 
                        : 'Select Shift'}
                  </option>
                  {availableShifts.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.shiftName} ({shift.timeStart} - {shift.timeEnd})
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration Type */}
              <div className="form-group">
                <label>
                  Duration Type <span className="required">*</span>
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select Duration</option>
                  {DURATION_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Slot Interval */}
              <div className="form-group">
                <label>
                  Slot Interval (minutes) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  name="slotInterval"
                  value={formData.slotInterval}
                  onChange={handleChange}
                  min="5"
                  max="120"
                  step="5"
                  required
                  disabled={loading}
                  placeholder="e.g., 15"
                />
              </div>

              {/* Specific Date - Only shown when duration is Specific Day */}
              {showDatePicker && (
                <div className="form-group">
                  <label>
                    Specific Date <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    name="slotDate"
                    value={formData.slotDate}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              )}

              {/* Create Slot Days - Read-only display */}
              <div className="form-group">
                <label>Create Slots For (Days)</label>
                <input
                  type="number"
                  value={createSlotDays}
                  disabled
                  readOnly
                  className="readonly-input"
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="config-info-box">
              <h4>Configuration Summary</h4>
              <p>
                <strong>Duration Type:</strong>{' '}
                {formData.duration 
                  ? DURATION_OPTIONS.find(d => d.id === Number(formData.duration))?.label 
                  : 'Not selected'}
              </p>
              <p>
                <strong>Slots will be created for:</strong> {createSlotDays || 0} days
              </p>
              {showDatePicker && formData.slotDate && (
                <p>
                  <strong>Specific Date:</strong> {formData.slotDate}
                </p>
              )}
            </div>
          </div>

          <div className="clinic-modal-footer">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn-cancel"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSlotConfig;