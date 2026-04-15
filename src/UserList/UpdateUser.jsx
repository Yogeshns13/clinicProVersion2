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
      if (!value || !value.trim()) return '';               // mobile is optional in update
      if (value.trim().length !== 10) return 'Mobile number must be 10 digits';
      if (!/^\d{10}$/.test(value.trim())) return 'Mobile number must contain only digits';
      return '';

    case 'profileName':
      if (!value || !value.trim()) return 'Profile/Role is required';
      return '';

    case 'password':
      // Password is optional for update — only validate when not blank
      if (value && value.trim()) {
        if (value.trim().length < 6) return 'Password must be at least 6 characters';
        if (value.trim().length > 50) return 'Password must not exceed 50 characters';
      }
      return '';

    case 'status':
      if (!value) return 'Status is required';
      return '';

    default:
      return '';
  }
};

const VALIDATED_FIELDS = ['email', 'mobile', 'profileName', 'password', 'status'];

const STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
];

// ─────────────────────────────────────────────────────────────────────────────
// UpdateUser
//
// Double-popup fix (same pattern as UpdateClinic):
// UpdateUser owns its OWN MessagePopup for ALL feedback.
// onSuccess / onError never carry a showPopup call in ClinicList/UserList.
// ─────────────────────────────────────────────────────────────────────────────
const UpdateUser = ({ user, onClose, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    email:       user.email       || '',
    mobile:      user.mobile      || '',
    profileName: user.profileName || '',
    password:    '',              // intentionally blank – only change if filled
    status:      user.status === 'active' ? 1 : 2,
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
    if (!formData.status) return false;
    const hasErrors = Object.values(validationMessages).some((msg) => !!msg);
    if (hasErrors) return false;
    return true;
  }, [formData, validationMessages]);

  // ── Live validation ──
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let filtered = value;
    if (name === 'mobile') filtered = value.replace(/[^0-9]/g, '').slice(0, 10);
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

    try {
      await updateUser({
        userId:      Number(user.userId),
        clinicId:    user.clinicId || 0,
        email:       formData.email.trim(),
        mobile:      formData.mobile.trim(),
        profileName: formData.profileName.trim(),
        password:    formData.password.trim() || '',  // empty string = no change
        status:      Number(formData.status),
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
              <span className={styles.workIdBadge}>{user.userName || 'User'}</span>
              <span className={`${styles.workIdBadge} ${formData.status === 1 ? styles.activeBadge : styles.inactiveBadge}`}>
                {formData.status === 1 ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className={styles.detailCloseBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.addModalBody}>

          {/* ── Read-only Association Info ── */}
          <div className={styles.addSection}>
            <div className={styles.addSectionHeader}><h3>Association (Read-only)</h3></div>
            <div className={styles.addFormGrid}>

              <div className={styles.addFormGroup}>
                <label>Clinic</label>
                <input
                  readOnly
                  value={user.clinicName || '—'}
                  className={styles.readOnlyInput}
                  tabIndex={-1}
                />
              </div>

              <div className={styles.addFormGroup}>
                <label>Branch</label>
                <input
                  readOnly
                  value={user.branchName || '—'}
                  className={styles.readOnlyInput}
                  tabIndex={-1}
                />
              </div>

              <div className={styles.addFormGroup}>
                <label>Employee</label>
                <input
                  readOnly
                  value={user.employeeName || '—'}
                  className={styles.readOnlyInput}
                  tabIndex={-1}
                />
              </div>

            </div>
          </div>

          {/* ── Editable Account Details ── */}
          <div className={styles.addSection}>
            <div className={styles.addSectionHeader}><h3>Account Details</h3></div>
            <div className={styles.addFormGrid}>

              <div className={styles.addFormGroup}>
                <label>Username</label>
                <input
                  readOnly
                  value={user.userName || '—'}
                  className={styles.readOnlyInput}
                  tabIndex={-1}
                />
              </div>

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

              <div className={styles.addFormGroup}>
                <label>Profile / Role <span className={styles.required}>*</span></label>
                <input
                  name="profileName"
                  value={formData.profileName}
                  onChange={handleInputChange}
                  placeholder="e.g. Admin, Doctor, Receptionist"
                />
                {validationMessages.profileName && (
                  <span className={styles.validationMsg}>{validationMessages.profileName}</span>
                )}
              </div>

              <div className={styles.addFormGroup}>
                <label>
                  New Password{' '}
                  
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter new password (optional)"
                  autoComplete="new-password"
                />
                {validationMessages.password && (
                  <span className={styles.validationMsg}>{validationMessages.password}</span>
                )}
              </div>

              <div className={styles.addFormGroup}>
                <label>Status <span className={styles.required}>*</span></label>
                <select name="status" value={formData.status} onChange={handleInputChange}>
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