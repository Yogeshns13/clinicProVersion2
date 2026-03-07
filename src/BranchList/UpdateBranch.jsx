// src/components/UpdateBranch.jsx
import React, { useState } from 'react';
import { FiSave } from 'react-icons/fi';
import { updateBranch } from '../api/api.js';
import styles from './BranchList.module.css';

// ─── matches backend allowedCharactersRegex exactly ───────────────────────────
const allowedCharactersRegex = /^[A-Za-z0-9\s\-_]+$/;

// ─── Validation messages match backend updateBranchValidatorRules word-for-word ─
const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'clinicId':
      if (!value || value === '') return 'ClinicID is required';
      if (isNaN(Number(value)) || !Number.isInteger(Number(value)) || Number(value) < 1)
        return 'ClinicID must be a positive integer';
      return '';

    case 'branchName':
      if (!value || !value.trim()) return 'BranchName is required';
      if (value.trim().length > 100) return 'BranchName should not exceed 100 characters';
      if (!allowedCharactersRegex.test(value.trim())) return 'BranchName contains invalid characters';
      return '';

    // Address is required in backend (notEmpty)
    case 'address':
      if (!value || !value.trim()) return 'Address is required';
      if (value.length > 500) return 'Address should not exceed 500 characters';
      return '';

    // Location is optional in backend — only length check
    case 'location':
      if (value && value.length > 500) return 'Location should not exceed 500 characters';
      return '';

    case 'branchType':
      if (!value) return 'BranchType is required';
      if (isNaN(Number(value)) || Number(value) < 1) return 'BranchType must be a valid integer';
      return '';

    // Status — required in backend updateBranchValidatorRules
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
      // allow A-Za-z0-9, whitespace, hyphen, underscore — matches backend regex
      return value.replace(/[^A-Za-z0-9\s\-_]/g, '');
    default:
      return value;
  }
};

// ─── All fields validated on submit for the Update form ───────────────────────
const UPDATE_VALIDATED_FIELDS = ['clinicId', 'branchName', 'address', 'location', 'branchType', 'status'];

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

// ────────────────────────────────────────────────
// Props:
//   branch    — the branch object to edit (required)
//   clinics   — clinics array passed from BranchList (avoids re-fetching)
//   onClose   — called when user cancels or clicks backdrop
//   onSuccess — called after a successful update (triggers list refresh)
// ────────────────────────────────────────────────
const UpdateBranch = ({ branch, clinics, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    clinicId:   branch.clinicId   || '',
    branchName: branch.name       || '',
    address:    branch.address    || '',
    location:   branch.location   || '',
    branchType: branch.branchType || 1,
    status:     branch.status === 'active' ? 1 : 2,
  });

  const [formLoading,        setFormLoading]        = useState(false);
  const [formError,          setFormError]          = useState('');
  const [formSuccess,        setFormSuccess]        = useState(false);
  const [validationMessages, setValidationMessages] = useState({});

  // ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const filteredValue = filterInput(name, value);
    setFormData((prev) => ({ ...prev, [name]: filteredValue }));
    setValidationMessages((prev) => ({ ...prev, [name]: getLiveValidationMessage(name, filteredValue) }));
  };

  // ── Run validation on all fields; returns true only if zero errors ─────────
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAllFields()) {
      setFormError('Please correct all errors before submitting.');
      return;
    }

    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);

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

      setFormSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setFormError(err.message?.split(':')[1]?.trim() ||  'Failed to update branch.');
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  return (
    <div className={styles.detailModalOverlay} onClick={onClose}>
      <div className={styles.addModalContent} onClick={(e) => e.stopPropagation()}>

        {/* ── Gradient Header ── */}
        <div className={styles.detailModalHeader}>
          <div className={styles.detailHeaderContent}>
            <h2>Update Branch</h2>
            <div className={styles.detailHeaderMeta}>
              <span className={styles.workIdBadge}>
                {formData.branchName || 'Branch'}
              </span>
              <span className={`${styles.workIdBadge} ${formData.status === 1 ? styles.activeBadge : styles.inactiveBadge}`}>
                {formData.status === 1 ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className={styles.detailCloseBtn}>✕</button>
        </div>

        {/* ── Form Body ── */}
        <form onSubmit={handleSubmit} className={styles.addModalBody}>
          {formError   && <div className={styles.formError}>{formError}</div>}
          {formSuccess && <div className={styles.formSuccess}>Branch updated successfully!</div>}

          <div className={styles.addSection}>
            <div className={styles.addSectionHeader}>
              <h3>Branch Information</h3>
            </div>

            <div className={styles.addFormGrid}>

              {/* ClinicID — required in backend */}
              <div className={styles.addFormGroup}>
                <label>Clinic <span className={styles.required}>*</span></label>
                <select
                  required
                  name="clinicId"
                  value={formData.clinicId}
                  onChange={handleInputChange}
                >
                  <option value="">Select Clinic</option>
                  {clinics.map((clinic) => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </option>
                  ))}
                </select>
                {validationMessages.clinicId && (
                  <span className={styles.validationMsg}>{validationMessages.clinicId}</span>
                )}
              </div>

              {/* BranchName — required in backend */}
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

              {/* BranchType — required in backend */}
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

              {/* Address — required in backend (notEmpty) */}
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

              {/* Location — optional in backend */}
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

              {/* Status — required in backend */}
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
            <button type="submit" disabled={formLoading} className={styles.btnSubmit}>
              <FiSave style={{ marginRight: '8px' }} />
              {formLoading ? 'Updating...' : 'Update Branch'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default UpdateBranch;