// src/components/UpdateBranch.jsx
import React, { useState, useMemo } from 'react';
import { FiSave } from 'react-icons/fi';
import { FaClinicMedical } from 'react-icons/fa';
import { updateBranch } from '../Api/Api.js';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import styles from './BranchList.module.css';

// ─── matches backend allowedCharactersRegex exactly ───────────────────────────
const allowedCharactersRegex = /^[A-Za-z0-9\s\-_]+$/;

// ─── Validation messages match backend updateBranchValidatorRules word-for-word ─
const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'branchName':
      if (!value || !value.trim()) return 'BranchName is required';
      if (value.trim().length > 100) return 'BranchName should not exceed 100 characters';
      if (!allowedCharactersRegex.test(value.trim()))
        return 'BranchName contains invalid characters';
      return '';

    case 'address':
      if (!value || !value.trim()) return 'Address is required';
      if (value.length > 500) return 'Address should not exceed 500 characters';
      return '';

    case 'location':
      if (value && value.length > 500) return 'Location should not exceed 500 characters';
      return '';

    case 'branchType':
      if (!value) return 'BranchType is required';
      if (isNaN(Number(value)) || Number(value) < 1)
        return 'BranchType must be a valid integer';
      return '';

    case 'status':
      if (!value) return 'Status is required';
      if (isNaN(Number(value))) return 'Status must be a number';
      return '';

    default:
      return '';
  }
};

const filterInput = (fieldName, value) => {
  switch (fieldName) {
    case 'branchName':
      return value.replace(/[^A-Za-z0-9\s\-_]/g, '');
    default:
      return value;
  }
};

const UPDATE_VALIDATED_FIELDS = ['branchName', 'address', 'location', 'branchType', 'status'];

const BRANCH_TYPES = [
  { id: 1, label: 'Main' },
  { id: 2, label: 'Satellite' },
  { id: 3, label: 'Clinic' },
  { id: 4, label: 'Hospital' },
  { id: 5, label: 'Diagnostic Center' },
  { id: 6, label: 'Research Center' },
];

const STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
];

// ─────────────────────────────────────────────────────────────────────────────
// UpdateBranch
//
// Double-popup contract (same as UpdateClinic):
//   • This component owns its OWN MessagePopup for all feedback.
//   • onSuccess() and onError() are pure signals — they carry no message.
//   • BranchList must NOT call showPopup inside handleUpdateSuccess / handleUpdateError.
// ─────────────────────────────────────────────────────────────────────────────
const UpdateBranch = ({ branch, clinics, onClose, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    clinicId:   branch.clinicId   || '',
    branchName: branch.name       || '',
    address:    branch.address    || '',
    location:   branch.location   || '',
    branchType: branch.branchType || 1,
    status:     branch.status === 'active' ? 1 : 2,
  });

  const [formLoading,        setFormLoading]        = useState(false);
  const [validationMessages, setValidationMessages] = useState({});
  const [submitAttempted,    setSubmitAttempted]    = useState(false);
  const [submitBtnDisabled,  setSubmitBtnDisabled]  = useState(false);

  // ── Internal popup — this is the ONLY popup shown for UpdateBranch ──
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopup  = (message, type = 'success') => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });

  // ── Is the form completely valid? ──
  const isFormValid = useMemo(() => {
    const requiredFields = ['branchName', 'address', 'branchType', 'status'];
    const allFilled = requiredFields.every((f) => {
      const v = formData[f];
      return v !== '' && v !== null && v !== undefined && String(v).trim() !== '';
    });
    if (!allFilled) return false;
    const hasErrors = Object.values(validationMessages).some((msg) => !!msg);
    if (hasErrors) return false;
    return true;
  }, [formData, validationMessages]);

  // ── Live validation on every keystroke ──
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const filteredValue = filterInput(name, value);
    setFormData((prev) => ({ ...prev, [name]: filteredValue }));
    const msg = getLiveValidationMessage(name, filteredValue);
    setValidationMessages((prev) => ({ ...prev, [name]: msg }));
  };

  // ── Validate all fields; returns true only if zero errors ──
  const validateAllFields = () => {
    const messages = {};
    let isValid = true;

    UPDATE_VALIDATED_FIELDS.forEach((field) => {
      const msg = getLiveValidationMessage(field, formData[field]);
      messages[field] = msg;
      if (msg) isValid = false;
    });

    setValidationMessages((prev) => ({ ...prev, ...messages }));
    return isValid;
  };

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Guard: form not ready
    if (!isFormValid) {
      setSubmitAttempted(true);
      validateAllFields();
      showPopup('Please fill all required fields before submitting.', 'warning');
      return;
    }

    if (!validateAllFields()) {
      showPopup('Please fill all required fields before submitting.', 'warning');
      return;
    }

    // 2-sec cooldown on submit button
    setSubmitBtnDisabled(true);
    setTimeout(() => setSubmitBtnDisabled(false), 2000);

    setFormLoading(true);

    try {
      await updateBranch({
        branchId:   Number(branch.id),
        clinicId:   Number(formData.clinicId),
        BranchName: formData.branchName.trim(),
        Address:    formData.address.trim(),
        Location:   formData.location.trim(),
        BranchType: Number(formData.branchType),
        Status:     Number(formData.status),
      });

      // Show success popup (inside UpdateBranch only — no parent popup)
      showPopup('Branch updated successfully!', 'success');

      // After 1 s the popup auto-closes; signal parent to close modal + refresh.
      // onSuccess receives NO message — BranchList must NOT show another popup.
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1000);

    } catch (err) {
      const errMsg = err?.message || 'Failed to update branch.';

      // Show error popup (inside UpdateBranch only)
      showPopup(errMsg, 'error');

      // Signal parent for logging; BranchList must NOT call showPopup in onError.
      if (onError) onError(errMsg);
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  return (
    <div className={styles.detailModalOverlay} >

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
            <h2>Update Branch</h2>
          </div>
          <div className={styles.clinicNameone}>
            <FaClinicMedical
              size={20}
              style={{ verticalAlign: 'middle', margin: '6px', marginTop: '0px' }}
            />
            {branch.clinicName || '—'}
          </div>
          <button onClick={onClose} className={styles.detailCloseBtn}>✕</button>
        </div>

        {/* ── Form Body ── */}
        <form onSubmit={handleSubmit} className={styles.addModalBody}>

          <div className={styles.addSection}>
            <div className={styles.addSectionHeader}>
              <h3>Branch Information</h3>
            </div>

            <div className={styles.addFormGrid}>

              {/* BranchName */}
              <div className={styles.addFormGroup}>
                <label>Branch Name <span className={styles.required}>*</span></label>
                <input
                  required
                  name="branchName"
                  value={formData.branchName}
                  onChange={handleInputChange}
                  placeholder="Enter branch name"
                />
                {validationMessages.branchName && (
                  <span className={styles.validationMsg}>{validationMessages.branchName}</span>
                )}
              </div>

              {/* BranchType */}
              <div className={styles.addFormGroup}>
                <label>Branch Type <span className={styles.required}>*</span></label>
                <select
                  required
                  name="branchType"
                  value={formData.branchType}
                  onChange={handleInputChange}
                >
                  {BRANCH_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {validationMessages.branchType && (
                  <span className={styles.validationMsg}>{validationMessages.branchType}</span>
                )}
              </div>

              {/* Address */}
              <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                <label>Full Address <span className={styles.required}>*</span></label>
                <textarea
                  required
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter full address"
                />
                {validationMessages.address && (
                  <span className={styles.validationMsg}>{validationMessages.address}</span>
                )}
              </div>

              {/* Location — optional */}
              <div className={styles.addFormGroup}>
                <label>Location (Area/City)</label>
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. Anna Nagar, Madurai"
                />
                {validationMessages.location && (
                  <span className={styles.validationMsg}>{validationMessages.location}</span>
                )}
              </div>

              {/* Status */}
              <div className={styles.addFormGroup}>
                <label>Status <span className={styles.required}>*</span></label>
                <select
                  required
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
                {validationMessages.status && (
                  <span className={styles.validationMsg}>{validationMessages.status}</span>
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
              className={`${styles.btnSubmit} ${!isFormValid ? styles.btnSubmitDisabled : ''}`}
              title={!isFormValid ? 'Please fill all required fields' : ''}
              style={{
                opacity: formLoading || submitBtnDisabled ? 0.6 : 1,
                cursor:  formLoading || submitBtnDisabled ? 'not-allowed' : 'pointer',
              }}
            >
              <FiSave style={{ marginRight: '8px' }} />
              {formLoading
                ? 'Updating...'
                : submitBtnDisabled
                ? 'Please wait...'
                : 'Update Branch'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default UpdateBranch;