// src/components/UpdateDepartment.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { FiSave } from 'react-icons/fi';
import { FaClinicMedical } from 'react-icons/fa';
import { getBranchList } from '../Api/CachedApi.js';
import { updateDepartment } from '../Api/Api.js';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import styles from './DepartmentList.module.css';

const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'departmentName':
      if (!value || !value.trim()) return 'Department name is required';
      if (value.trim().length < 3) return 'Department name must be at least 3 characters';
      if (value.trim().length > 100) return 'Department name must not exceed 100 characters';
      return '';

    case 'profile':
      if (value && value.length > 100) return 'Description must not exceed 100 characters';
      return '';

    default:
      return '';
  }
};

const filterInput = (fieldName, value) => {
  switch (fieldName) {
    case 'departmentName':
      return value.replace(/[^a-zA-Z\s]/g, '');
    default:
      return value;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UpdateDepartment
//
// Double-popup contract:
//   • This component owns its OWN MessagePopup for all feedback.
//   • onSuccess() and onError() are pure signals — they carry no message.
//   • DepartmentList must NOT call showPopup inside handleUpdateSuccess / handleUpdateError.
// ─────────────────────────────────────────────────────────────────────────────
const UpdateDepartment = ({ department, clinics, onClose, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    clinicId:       department.clinicId  || '',
    branchId:       department.branchId  || '',
    departmentName: department.name      || '',
    profile:        department.profile   || '',
    status:         1,
  });

  const [branches,           setBranches]           = useState([]);
  const [branchesLoading,    setBranchesLoading]    = useState(!!department.clinicId);
  const [formLoading,        setFormLoading]        = useState(false);
  const [validationMessages, setValidationMessages] = useState({});
  const [submitAttempted,    setSubmitAttempted]    = useState(false);
  const [submitBtnDisabled,  setSubmitBtnDisabled]  = useState(false);

  // ── Internal popup — this is the ONLY popup shown for UpdateDepartment ──
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopup  = (message, type = 'success') => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });

  // Derive clinic name from the clinics prop
  const clinicName = clinics.find(
    (c) => String(c.id) === String(formData.clinicId)
  )?.name || '';

  // Load branches on mount (clinicId won't change since it's read-only now)
  useEffect(() => {
    const fetchBranches = async () => {
      if (formData.clinicId) {
        setBranchesLoading(true);
        try {
          const branchData = await getBranchList(Number(formData.clinicId));
          setBranches(branchData || []);
        } catch (err) {
          console.error('Failed to load branches:', err);
          setBranches([]);
        } finally {
          setBranchesLoading(false);
        }
      }
    };
    fetchBranches();
  }, [formData.clinicId]);

  // Derive branch name for the read-only display
  const branchName = branches.find(
    (b) => String(b.id) === String(formData.branchId)
  )?.name || '—';

  // ── Is the form completely valid? ──
  const isFormValid = useMemo(() => {
    const requiredFields = ['departmentName'];
    const allFilled = requiredFields.every((f) => {
      const v = formData[f];
      return v !== '' && v !== null && v !== undefined && String(v).trim() !== '';
    });
    if (!allFilled) return false;
    const hasErrors = Object.values(validationMessages).some((msg) => !!msg);
    if (hasErrors) return false;
    return true;
  }, [formData, validationMessages]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const filteredValue = filterInput(name, value);
    setFormData((prev) => ({ ...prev, [name]: filteredValue }));
    setValidationMessages((prev) => ({
      ...prev,
      [name]: getLiveValidationMessage(name, filteredValue),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Guard: form not ready
    if (!isFormValid) {
      setSubmitAttempted(true);
      showPopup('Please fill all required fields before submitting.', 'warning');
      return;
    }

    // 2-sec cooldown on submit button
    setSubmitBtnDisabled(true);
    setTimeout(() => setSubmitBtnDisabled(false), 2000);

    setFormLoading(true);

    try {
      await updateDepartment({
        departmentId:   Number(department.id),
        clinicId:       Number(formData.clinicId),
        DepartmentName: formData.departmentName.trim(),
        Profile:        formData.profile.trim(),
      });

      // Show success popup (inside UpdateDepartment only — no parent popup)
      showPopup('Department updated successfully!', 'success');

      // After 1 s the popup auto-closes; signal parent to close modal + refresh.
      // onSuccess receives NO message — DepartmentList must NOT show another popup.
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1000);

    } catch (err) {
      const errMsg =
        err.message || 'Failed to update department.';

      // Show error popup (inside UpdateDepartment only)
      showPopup(errMsg, 'error');

      // Signal parent for logging; DepartmentList must NOT call showPopup in onError.
      if (onError) onError(errMsg);
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  return (
    <div className={styles.detailModalOverlay} onClick={onClose}>

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
            <h2>Update Department</h2>
          </div>
          <div className={styles.clinicNameone}>
            <FaClinicMedical
              size={20}
              style={{ verticalAlign: 'middle', margin: '6px', marginTop: '0px' }}
            />
            {department.clinicName || '—'}
          </div>
          <button onClick={onClose} className={styles.detailCloseBtn}>✕</button>
        </div>

        {/* ── Form Body ── */}
        {branchesLoading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2.5rem 1.5rem',
            gap: '12px',
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              border: '3px solid rgba(32, 125, 156, 0.15)',
              borderTop: '3px solid #207d9c',
              borderRadius: '50%',
              animation: 'ud-spin 0.75s linear infinite',
            }} />
            <p style={{ fontSize: '13.5px', color: '#475569', margin: 0 }}>
              Loading department data...
            </p>
            <style>{`@keyframes ud-spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className={styles.addModalBody}>

          <div className={styles.addSection}>
            <div className={styles.addSectionHeader}>
              <h3>Department Information</h3>
            </div>

            <div className={styles.addFormGrid}>

              {/* Branch — read-only display */}
              <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                <label>Branch</label>
                <input
                  readOnly
                  value={branchName}
                  className={styles.readOnlyInput}
                  style={{
                    backgroundColor: 'var(--input-disabled-bg, #f5f5f5)',
                    cursor: 'not-allowed',
                  }}
                />
              </div>

              {/* Department Name */}
              <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                <label>Department Name <span className={styles.required}>*</span></label>
                <input
                  required
                  name="departmentName"
                  value={formData.departmentName}
                  onChange={handleInputChange}
                  placeholder="Enter department name"
                />
                {validationMessages.departmentName && (
                  <span className={styles.validationMsg}>{validationMessages.departmentName}</span>
                )}
              </div>

              {/* Description / Profile */}
              <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                <label>Description / Profile</label>
                <textarea
                  name="profile"
                  rows={3}
                  value={formData.profile}
                  onChange={handleInputChange}
                  placeholder="Enter department description (optional)"
                />
                {validationMessages.profile && (
                  <span className={styles.validationMsg}>{validationMessages.profile}</span>
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
                : 'Update Department'}
            </button>
          </div>
        </form>
        )}

      </div>
    </div>
  );
};

export default UpdateDepartment;