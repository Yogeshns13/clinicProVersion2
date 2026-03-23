// src/components/GenerateSlots.jsx
import React, { useState, useEffect } from 'react';
import { generateSlots } from '../Api/Api.js';
import styles from './GenerateSlots.module.css';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';
import MessagePopup from '../Hooks/MessagePopup.jsx';

const GenerateSlots = ({ isOpen, onClose, onSuccess }) => {
  const [generationType, setGenerationType] = useState('days'); // 'days' or 'dateRange'
  const [formData, setFormData] = useState({
    daysAhead: 30,
    fromDate: '',
    toDate: '',
  });

  const [loading, setLoading] = useState(false);

  // ── MessagePopup state ──
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopup  = (message, type = 'success') => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });

  // ── Button cooldown ──
  const [submitCooldown, setSubmitCooldown] = useState(false);
  const startCooldown = () => {
    setSubmitCooldown(true);
    setTimeout(() => setSubmitCooldown(false), 2000);
  };

  // ── Derive whether required fields are filled ──
  const isRequiredFilled = () => {
    if (generationType === 'days') {
      return !!formData.daysAhead && Number(formData.daysAhead) > 0;
    }
    return !!formData.fromDate && !!formData.toDate;
  };

  const submitEnabled = isRequiredFilled() && !loading && !submitCooldown;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setGenerationType('days');
      setFormData({ daysAhead: 30, fromDate: '', toDate: '' });
      setPopup({ visible: false, message: '', type: 'success' });
      setSubmitCooldown(false);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerationTypeChange = (type) => {
    setGenerationType(type);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Gate: required fields check
    if (!isRequiredFilled()) {
      showPopup(
        generationType === 'days'
          ? 'Please enter a valid number of days.'
          : 'Please select both From Date and To Date.',
        'warning'
      );
      return;
    }

    if (submitCooldown) return;
    startCooldown();

    // Extra validation
    if (generationType === 'dateRange') {
      if (new Date(formData.fromDate) > new Date(formData.toDate)) {
        showPopup('From date must be before To date.', 'error');
        return;
      }
    }

    setLoading(true);

    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const payload = {
        clinicId: Number(clinicId),
        branchId: Number(branchId),
      };

      if (generationType === 'days') {
        payload.daysAhead = Number(formData.daysAhead);
      } else {
        payload.fromDate = formData.fromDate;
        payload.toDate   = formData.toDate;
      }

      const result = await generateSlots(payload);

      if (result.success) {
        showPopup('Slots generated successfully!', 'success');
        setTimeout(() => {
          closePopup();
          onSuccess();
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error('Generate slots error:', err);
      showPopup(err.message || 'Failed to generate slots.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      <MessagePopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
      />

      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <h2>Generate Appointment Slots</h2>
            <button
              onClick={onClose}
              className={styles.modalCloseBtn}
              disabled={loading}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.modalBody}>

              {/* Generation Type Selection */}
              <div className={styles.generationTypeSelector}>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="generationType"
                    value="days"
                    checked={generationType === 'days'}
                    onChange={() => handleGenerationTypeChange('days')}
                    disabled={loading}
                  />
                  <span className={styles.radioLabel}>Days Ahead</span>
                </label>

                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="generationType"
                    value="dateRange"
                    checked={generationType === 'dateRange'}
                    onChange={() => handleGenerationTypeChange('dateRange')}
                    disabled={loading}
                  />
                  <span className={styles.radioLabel}>Date Range</span>
                </label>
              </div>

              {/* Days Ahead Input */}
              {generationType === 'days' && (
                <div className={styles.formGrid}>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>
                      Number of Days Ahead <span className={styles.required}>*</span>
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
                      className={styles.formInput}
                    />
                    <small className={styles.formHint}>
                      Slots will be generated for the next {formData.daysAhead || 0} days
                    </small>
                  </div>
                </div>
              )}

              {/* Date Range Inputs */}
              {generationType === 'dateRange' && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>
                      From Date <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="date"
                      name="fromDate"
                      value={formData.fromDate}
                      onChange={handleChange}
                      min={today}
                      required
                      disabled={loading}
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      To Date <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="date"
                      name="toDate"
                      value={formData.toDate}
                      onChange={handleChange}
                      min={formData.fromDate || today}
                      required
                      disabled={loading}
                      className={styles.formInput}
                    />
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className={styles.generateInfoBox}>
                <h4>Important Information</h4>
                <ul>
                  <li>Slots will be generated based on your active slot configurations</li>
                  <li>Only configurations for doctors with assigned shifts will be processed</li>
                  <li>Existing slots for the selected period will be preserved</li>
                  <li>This process may take a few moments depending on the number of configurations</li>
                </ul>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={onClose}
                className={styles.btnCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.btnSubmit}
                disabled={!submitEnabled}
                title={!isRequiredFilled() ? 'Please fill all required fields' : ''}
              >
                {loading ? 'Generating...' : 'Generate Slots'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default GenerateSlots;