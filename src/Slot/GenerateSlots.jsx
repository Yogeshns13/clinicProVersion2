// src/components/GenerateSlots.jsx
import React, { useState, useEffect } from 'react';
import { generateSlots } from '../api/api.js';

const GenerateSlots = ({ isOpen, onClose, onSuccess }) => {
  const [generationType, setGenerationType] = useState('days'); // 'days' or 'dateRange'
  const [formData, setFormData] = useState({
    daysAhead: 30,
    fromDate: '',
    toDate: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setGenerationType('days');
      setFormData({
        daysAhead: 30,
        fromDate: '',
        toDate: '',
      });
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleGenerationTypeChange = (type) => {
    setGenerationType(type);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation based on generation type
    if (generationType === 'days') {
      if (!formData.daysAhead || formData.daysAhead <= 0) {
        setError('Please enter a valid number of days');
        return;
      }
    } else {
      if (!formData.fromDate || !formData.toDate) {
        setError('Please select both from and to dates');
        return;
      }

      // Check if fromDate is before toDate
      if (new Date(formData.fromDate) >= new Date(formData.toDate)) {
        setError('From date must be before to date');
        return;
      }
    }

    setLoading(true);

    try {
      const clinicId = localStorage.getItem('clinicID');
      const branchId = localStorage.getItem('branchID');

      const payload = {
        clinicId: Number(clinicId),
        branchId: Number(branchId),
      };

      // Add either daysAhead or date range based on selection
      if (generationType === 'days') {
        payload.daysAhead = Number(formData.daysAhead);
      } else {
        payload.fromDate = formData.fromDate;
        payload.toDate = formData.toDate;
      }

      const result = await generateSlots(payload);

      if (result.success) {
        setSuccess('Slots generated successfully!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Generate slots error:', err);
      setError(err.message || 'Failed to generate slots');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Get today's date for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="clinic-modal-overlay">
      <div className="clinic-modal form-modal">
        <div className="clinic-modal-header">
          <h2>Generate Appointment Slots</h2>
          <button onClick={onClose} className="clinic-modal-close" disabled={loading}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="clinic-modal-body">
            {error && <div className="form-error">{error}</div>}
            {success && <div className="form-success">{success}</div>}

            {/* Generation Type Selection */}
            <div className="generation-type-selector">
              <label className="radio-option">
                <input
                  type="radio"
                  name="generationType"
                  value="days"
                  checked={generationType === 'days'}
                  onChange={() => handleGenerationTypeChange('days')}
                  disabled={loading}
                />
                <span className="radio-label">Days Ahead</span>
              </label>

              <label className="radio-option">
                <input
                  type="radio"
                  name="generationType"
                  value="dateRange"
                  checked={generationType === 'dateRange'}
                  onChange={() => handleGenerationTypeChange('dateRange')}
                  disabled={loading}
                />
                <span className="radio-label">Date Range</span>
              </label>
            </div>

            {/* Days Ahead Input */}
            {generationType === 'days' && (
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>
                    Number of Days Ahead <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    name="daysAhead"
                    value={formData.daysAhead}
                    onChange={handleChange}
                    min="1"
                    max="365"
                    required
                    disabled={loading}
                    placeholder="e.g., 30"
                  />
                  <small className="form-hint">
                    Slots will be generated for the next {formData.daysAhead || 0} days
                  </small>
                </div>
              </div>
            )}

            {/* Date Range Inputs */}
            {generationType === 'dateRange' && (
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    From Date <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    name="fromDate"
                    value={formData.fromDate}
                    onChange={handleChange}
                    min={today}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>
                    To Date <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    name="toDate"
                    value={formData.toDate}
                    onChange={handleChange}
                    min={formData.fromDate || today}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="generate-info-box">
              <h4>Important Information</h4>
              <ul>
                <li>Slots will be generated based on your active slot configurations</li>
                <li>Only configurations for doctors with assigned shifts will be processed</li>
                <li>Existing slots for the selected period will be preserved</li>
                <li>This process may take a few moments depending on the number of configurations</li>
              </ul>
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
              {loading ? 'Generating...' : 'Generate Slots'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenerateSlots;