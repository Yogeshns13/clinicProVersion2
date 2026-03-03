// src/components/UpdateBranch.jsx
import React, { useState } from 'react';
import { FiSave } from 'react-icons/fi';
import { updateBranch } from '../api/api.js';
import styles from './BranchList.module.css';

const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'branchName':
      if (!value || !value.trim()) return 'Branch name is required';
      if (value.trim().length < 3) return 'Branch name must be at least 3 characters';
      if (value.trim().length > 100) return 'Branch name must not exceed 100 characters';
      return '';

    case 'address':
      if (value && value.length > 500) return 'Address must not exceed 500 characters';
      return '';

    case 'location':
      if (value && value.length > 100) return 'Location must not exceed 100 characters';
      return '';

    default:
      return '';
  }
};

const filterInput = (fieldName, value) => {
  switch (fieldName) {
    case 'branchName':
    case 'location':
      return value.replace(/[^a-zA-Z\s]/g, '');
    default:
      return value;
  }
};

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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      setFormError(err.message || 'Failed to update branch.');
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
              </div>

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
              </div>

              <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                <label>Full Address</label>
                <textarea
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