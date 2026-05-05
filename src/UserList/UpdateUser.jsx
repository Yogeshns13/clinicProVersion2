// src/components/UpdateUser.jsx
import React, { useState, useMemo } from 'react';
import { FiSave } from 'react-icons/fi';
import { updateUser } from '../Api/Api.js';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import styles from './UserList.module.css';

// ─────────────────────────────────────────────────────────────────────────────
// Validation helpers
// ─────────────────────────────────────────────────────────────────────────────
const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'email':
      if (!value || !value.trim()) return 'Email is required';
      if (!value.includes('@')) return 'Email must contain @';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
        return 'Please enter a valid email address';
      if (value.trim().length > 100) return 'Email must not exceed 100 characters';
      return '';

    case 'mobile':
      if (!value || !value.trim()) return '';
      if (value.trim().length !== 10) return 'Mobile number must be 10 digits';
      if (!/^\d{10}$/.test(value.trim())) return 'Mobile number must contain only digits';
      return '';

    case 'profileName':
      if (!value || !value.trim()) return 'Profile/Role is required';
      return '';

    case 'status':
      if (value === '' || value === null || value === undefined) return 'Status is required';
      return '';

    default:
      return '';
  }
};

const VALIDATED_FIELDS = ['email', 'mobile', 'profileName', 'status'];

const PROFILE_OPTIONS = [
  'admin',
  'spradmin',
  'frontdesk',
  'nurse',
  'pharmacy',
  'labtech',
  'accounts',
  'doctor',
];

// Only Active (0) and Suspended (2) — no Deleted option
const STATUS_OPTIONS = [
  { value: 0, label: 'Active' },
  { value: 2, label: 'Suspended' },
];

const getStatusNumeric = (status) => {
  if (status === 0 || status === '0') return 0;
  if (status === 1 || status === '1') return 1;
  if (status === 2 || status === '2') return 2;
  if (typeof status === 'string') {
    const lower = status.toLowerCase();
    if (lower === 'active')    return 0;
    if (lower === 'deleted')   return 1;
    if (lower === 'suspended') return 2;
    if (lower === 'inactive')  return 1;
  }
  return 0;
};

// ─────────────────────────────────────────────────────────────────────────────
// UpdateUser
// ─────────────────────────────────────────────────────────────────────────────
const UpdateUser = ({ user, onClose, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    email:       user.email       || '',
    mobile:      user.mobile      || '',
    profileName: user.profileName || '',
    status:      getStatusNumeric(user.status),
    isLocked:    user.isLocked === 1 || user.isLocked === '1' ? true : false,
  });

  const [formLoading,        setFormLoading]        = useState(false);
  const [validationMessages, setValidationMessages] = useState({});
  const [submitBtnDisabled,  setSubmitBtnDisabled]  = useState(false);

  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopup  = (message, type = 'success') => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });

  // ── Is form valid? ──
  const isFormValid = useMemo(() => {
    const requiredFields = ['email', 'profileName'];
    const allFilled = requiredFields.every(
      (f) => formData[f] !== '' && formData[f] !== null && formData[f] !== undefined && String(formData[f]).trim() !== ''
    );
    if (!allFilled) return false;
    if (formData.status === '' || formData.status === null || formData.status === undefined) return false;
    const hasErrors = Object.values(validationMessages).some((msg) => !!msg);
    if (hasErrors) return false;
    return true;
  }, [formData, validationMessages]);

  // ── Live validation ──
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let filtered = value;
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    if (name === 'mobile') filtered = value.replace(/[^0-9]/g, '').slice(0, 10);
    if (name === 'status') filtered = Number(value);
    setFormData((prev) => ({ ...prev, [name]: filtered }));
    const msg = getLiveValidationMessage(name, filtered);
    setValidationMessages((prev) => ({ ...prev, [name]: msg }));
  };

  const validateAllFields = () => {
    const messages = {};
    let isValid = true;
    VALIDATED_FIELDS.forEach((field) => {
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

    if (!isFormValid) {
      validateAllFields();
      showPopup('Please fill all required fields before submitting.', 'warning');
      return;
    }
    if (!validateAllFields()) {
      showPopup('Please fill all required fields before submitting.', 'warning');
      return;
    }

    setSubmitBtnDisabled(true);
    setTimeout(() => setSubmitBtnDisabled(false), 2000);
    setFormLoading(true);

    // If isLocked is unchecked, reset both isLocked and failedLoginAttempts to 0
    const isLockedValue         = formData.isLocked ? 1 : 0;
    const failedLoginAttempts   = formData.isLocked ? (user.failedLoginAttempts ?? 0) : 0;

    try {
      await updateUser({
        userId:               Number(user.userId),
        clinicId:             user.clinicId || 0,
        email:                formData.email.trim(),
        mobile:               formData.mobile.trim(),
        profileName:          formData.profileName.trim(),
        status:               Number(formData.status),
        isLocked:             isLockedValue,
        failedLoginAttempts:  failedLoginAttempts,
      });

      showPopup('User updated successfully!', 'success');
      setTimeout(() => { if (onSuccess) onSuccess(); }, 1000);

    } catch (err) {
      const errMsg = err.message || 'Failed to update user. Please try again.';
      showPopup(errMsg, 'error');
      if (onError) onError(errMsg);
    } finally {
      setFormLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  return (
    <div className={styles.detailModalOverlay}>
      <MessagePopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
      />

      <div className={styles.addModalContent} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.detailModalHeader}>
          <div className={styles.detailHeaderContent}>
            <h2>Update User</h2>
            <div className={styles.detailHeaderMeta}>
              <span className={styles.workIdBadge}>
                {user.userName && user.employeeName
                  ? `${user.userName} / ${user.employeeName}`
                  : user.userName || user.employeeName || 'User'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className={styles.detailCloseBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.addModalBody}>

          {/* ── Editable Account Details ── */}
          <div className={styles.addSection}>
            <div className={styles.addSectionHeader}><h3>Account Details</h3></div>

            {/* Row 1: Email + Mobile */}
            <div className={styles.updateFormRow}>
              <div className={styles.addFormGroup}>
                <label>Email <span className={styles.required}>*</span></label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="user@example.com"
                />
                {validationMessages.email && (
                  <span className={styles.validationMsg}>{validationMessages.email}</span>
                )}
              </div>

              <div className={styles.addFormGroup}>
                <label>Mobile</label>
                <input
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  placeholder="10-digit mobile"
                  maxLength={10}
                />
                {validationMessages.mobile && (
                  <span className={styles.validationMsg}>{validationMessages.mobile}</span>
                )}
              </div>
            </div>

            {/* Row 2: Profile + Status */}
            <div className={styles.updateFormRow}>
              <div className={styles.addFormGroup}>
                <label>Profile / Role <span className={styles.required}>*</span></label>
                <select
                  name="profileName"
                  value={formData.profileName}
                  onChange={handleInputChange}
                  className={styles.addSelect}
                >
                  <option value="">Select Profile / Role</option>
                  {PROFILE_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                {validationMessages.profileName && (
                  <span className={styles.validationMsg}>{validationMessages.profileName}</span>
                )}
              </div>

              <div className={styles.addFormGroup}>
                <label>Status <span className={styles.required}>*</span></label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={styles.addSelect}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                {validationMessages.status && (
                  <span className={styles.validationMsg}>{validationMessages.status}</span>
                )}
              </div>
            </div>

            {/* Row 3: Is Locked checkbox */}
            <div className={styles.updateFormRow}>
              <div className={styles.addFormGroup}>
                <label>Account Lock</label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="isLocked"
                    checked={formData.isLocked}
                    onChange={handleInputChange}
                    className={styles.checkboxInput}
                  />
                  <span className={styles.checkboxText}>
                    Account is Locked
                  </span>
                </label>
                <span className={styles.checkboxHint}>
                  Uncheck to unlock the account and reset failed login attempts to 0
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
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
              <FiSave className={styles.btnIcon} />
              {formLoading ? 'Updating…' : submitBtnDisabled ? 'Please wait…' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateUser;