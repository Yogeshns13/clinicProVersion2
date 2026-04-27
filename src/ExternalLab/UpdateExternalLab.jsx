// src/components/UpdateExternalLab.jsx
import React, { useState, useMemo } from 'react';
import { FiSave } from 'react-icons/fi';
import { updateExternalLab } from '../Api/ApiLabTests.js';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import styles from './ExternalLabList.module.css';
import { FaClinicMedical } from 'react-icons/fa';

// ─────────────────────────────────────────────────────────────────────────────
// Validation helpers
// ─────────────────────────────────────────────────────────────────────────────
const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'Name':
      if (!value || !String(value).trim()) return 'Name is required';
      if (String(value).trim().length > 200) return 'Name should not exceed 200 characters';
      return '';

    case 'Detail':
      if (value && String(value).trim().length > 500)
        return 'Detail should not exceed 500 characters';
      return '';

    case 'Mobile':
      if (!value || !String(value).trim()) return 'Mobile is required';
      if (String(value).trim().length !== 10) return 'Mobile number must be 10 digits';
      if (!/^\d{10}$/.test(String(value).trim())) return 'Mobile number must contain only digits';
      return '';

    case 'EMail':
      if (value && String(value).trim()) {
        if (!String(value).includes('@')) return 'Email must contain @';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim()))
          return 'Please enter a valid email address';
        if (String(value).trim().length > 100) return 'Email must not exceed 100 characters';
      }
      return '';

    case 'Address':
      if (value && String(value).trim().length > 500)
        return 'Address should not exceed 500 characters';
      return '';

    case 'status':
      if (value === '' || value === null || value === undefined) return 'Status is required';
      return '';

    default:
      return '';
  }
};

const filterInput = (fieldName, value) => {
  switch (fieldName) {
    case 'Mobile':
      return value.replace(/[^0-9]/g, '');
    default:
      return value;
  }
};

// Status: Active = 0, Inactive = 1
const STATUS_OPTIONS = [
  { value: 0, label: 'Active' },
  { value: 1, label: 'Inactive' },
];

const VALIDATED_FIELDS = ['Name', 'Detail', 'Mobile', 'EMail', 'Address', 'status'];

// ─────────────────────────────────────────────────────────────────────────────
// UpdateExternalLab
// ─────────────────────────────────────────────────────────────────────────────
const UpdateExternalLab = ({ lab, onClose, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    Name:    lab.name    || '',
    Detail:  lab.detail  || '',
    Mobile:  lab.mobile  || '',
    EMail:   lab.email   || '',
    Address: lab.address || '',
    status:  lab.status ?? 0,  // 0 = Active, 1 = Inactive
  });

  const [formLoading,        setFormLoading]        = useState(false);
  const [validationMessages, setValidationMessages] = useState({});
  const [submitBtnDisabled,  setSubmitBtnDisabled]  = useState(false);

  // ── Internal popup ──
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopup  = (message, type = 'success') => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });

  // ── Is the form completely valid? ──
  const isFormValid = useMemo(() => {
    if (!formData.Name || !String(formData.Name).trim()) return false;
    if (!formData.Mobile || !String(formData.Mobile).trim()) return false;
    if (formData.status === '' || formData.status === null || formData.status === undefined)
      return false;
    const hasErrors = Object.values(validationMessages).some((msg) => !!msg);
    if (hasErrors) return false;
    return true;
  }, [formData, validationMessages]);

  // ── Live validation on every keystroke ──
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const filteredValue = filterInput(name, value);
    // For status dropdown, store as number
    const finalValue = name === 'status' ? Number(filteredValue) : filteredValue;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    const msg = getLiveValidationMessage(name, finalValue);
    setValidationMessages((prev) => ({ ...prev, [name]: msg }));
  };

  // ── Validate all fields ──
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
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      await updateExternalLab({
        ExternalLabID: Number(lab.externalLabId),
        ClinicID:      clinicId,
        BranchID:      branchId,
        Name:          formData.Name.trim(),
        Detail:        formData.Detail.trim(),
        Mobile:        formData.Mobile.trim(),
        EMail:         formData.EMail.trim(),
        Address:       formData.Address.trim(),
        Status:        Number(formData.status),
      });

      showPopup('External lab updated successfully!', 'success');

      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1000);

    } catch (err) {
      const errMsg = err.message || 'Failed to update external lab. Please try again.';
      showPopup(errMsg, 'error');
      if (onError) onError(errMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const clinicName = localStorage.getItem('clinicName') || '—';
  const branchName = localStorage.getItem('branchName') || '—';

  // ─────────────────────────────────────────────
  return (
    <div className={styles.detailModalOverlay}>

      {/* Own MessagePopup */}
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
            <h2>Update External Lab</h2>
            <div className={styles.detailHeaderMeta}>
              <span className={styles.workIdBadge}>{formData.Name || 'Lab'}</span>
              <span
                className={`${styles.workIdBadge} ${
                  formData.status === 0 ? styles.activeBadge : styles.inactiveBadge
                }`}
              >
                {formData.status === 0 ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          </div>
          <div className={styles.addModalHeaderCard}>
                      <div className={styles.clinicInfoIcon}>
                        <FaClinicMedical size={18} />
                      </div>
                      <div className={styles.clinicInfoText}>
                        <span className={styles.clinicInfoName}>{clinicName}</span>
                        <span className={styles.clinicInfoBranch}>{branchName}</span>
                      </div>
                      </div>
          <button onClick={onClose} className={styles.detailCloseBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.addModalBody}>

          {/* ── Lab Information ── */}
          <div className={styles.addSection}>
            <div className={styles.addSectionHeader}><h3>Lab Information</h3></div>
            <div className={styles.addFormGrid}>

              <div className={styles.addFormGroup}>
                <label>Name <span className={styles.required}>*</span></label>
                <input
                  required
                  name="Name"
                  value={formData.Name}
                  onChange={handleInputChange}
                  placeholder="Enter lab name"
                />
                {validationMessages.Name && (
                  <span className={styles.validationMsg}>{validationMessages.Name}</span>
                )}
              </div>

              <div className={styles.addFormGroup}>
                <label>Mobile <span className={styles.required}>*</span></label>
                <input
                  required
                  name="Mobile"
                  value={formData.Mobile}
                  onChange={handleInputChange}
                  maxLength={10}
                  placeholder="10-digit mobile number"
                />
                {validationMessages.Mobile && (
                  <span className={styles.validationMsg}>{validationMessages.Mobile}</span>
                )}
              </div>

              <div className={styles.addFormGroup}>
                <label>Email</label>
                <input
                  type="email"
                  name="EMail"
                  value={formData.EMail}
                  onChange={handleInputChange}
                  placeholder="lab@example.com"
                />
                {validationMessages.EMail && (
                  <span className={styles.validationMsg}>{validationMessages.EMail}</span>
                )}
              </div>

              <div className={styles.addFormGroup}>
                <label>Status <span className={styles.required}>*</span></label>
                <select
                  required
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                {validationMessages.status && (
                  <span className={styles.validationMsg}>{validationMessages.status}</span>
                )}
              </div>

              <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                <label>Detail</label>
                <input
                  name="Detail"
                  value={formData.Detail}
                  onChange={handleInputChange}
                  placeholder="Enter lab details"
                />
                {validationMessages.Detail && (
                  <span className={styles.validationMsg}>{validationMessages.Detail}</span>
                )}
              </div>

              <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                <label>Address</label>
                <textarea
                  name="Address"
                  rows={2}
                  value={formData.Address}
                  onChange={handleInputChange}
                  placeholder="Enter full address"
                />
                {validationMessages.Address && (
                  <span className={styles.validationMsg}>{validationMessages.Address}</span>
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
              {formLoading
                ? 'Updating...'
                : submitBtnDisabled
                ? 'Please wait...'
                : 'Update Lab'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateExternalLab;