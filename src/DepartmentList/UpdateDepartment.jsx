// src/components/UpdateDepartment.jsx
import React, { useState, useEffect } from 'react';
import { FiSave } from 'react-icons/fi';
import { getBranchList } from '../Api/CachedApi.js';
import { updateDepartment } from '../Api/Api.js';
import styles from './DepartmentList.module.css';
import { FaClinicMedical } from 'react-icons/fa';

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

const UpdateDepartment = ({ department, clinics, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    clinicId:       department.clinicId  || '',
    branchId:       department.branchId  || '',
    departmentName: department.name      || '',
    profile:        department.profile   || '',
    status:         1,
  });

  const [branches,           setBranches]           = useState([]);
  const [formLoading,        setFormLoading]        = useState(false);
  const [formError,          setFormError]          = useState('');
  const [formSuccess,        setFormSuccess]        = useState(false);
  const [validationMessages, setValidationMessages] = useState({});

  // Derive clinic name from the clinics prop
  const clinicName = clinics.find((c) => String(c.id) === String(formData.clinicId))?.name || '';

  // Load branches on mount (clinicId won't change since it's read-only now)
  useEffect(() => {
    const fetchBranches = async () => {
      if (formData.clinicId) {
        try {
          const branchData = await getBranchList(Number(formData.clinicId));
          setBranches(branchData || []);
        } catch (err) {
          console.error('Failed to load branches:', err);
          setBranches([]);
        }
      }
    };
    fetchBranches();
  }, [formData.clinicId]);

  // Derive branch name for the read-only display
  const branchName = branches.find((b) => String(b.id) === String(formData.branchId))?.name || '—';

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
      await updateDepartment({
        departmentId:   Number(department.id),
        clinicId:       Number(formData.clinicId),
        DepartmentName: formData.departmentName.trim(),
        Profile:        formData.profile.trim(),
      });

      setFormSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setFormError(err.message?.split(':')[1]?.trim() || 'Failed to update department.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className={styles.detailModalOverlay} onClick={onClose}>
      <div className={styles.addModalContent} onClick={(e) => e.stopPropagation()}>

        {/* ── Gradient Header ── */}
        <div className={styles.detailModalHeader}>
          <div className={styles.detailHeaderContent}>
            <h2>Update Department</h2>
          </div>
          <div className={styles.clinicNameone}>
                         <FaClinicMedical size={20} style={{ verticalAlign: 'middle', margin: '6px', marginTop: '0px' }} />  
                          {department.clinicName || '—'}
                          </div>

            <button onClick={onClose} className={styles.detailCloseBtn}>✕</button>
          </div>
        
        {/* ── Form Body ── */}
        <form onSubmit={handleSubmit} className={styles.addModalBody}>
          {formError   && <div className={styles.formError}>{formError}</div>}
          {formSuccess && <div className={styles.formSuccess}>Department updated successfully!</div>}

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
                  style={{ backgroundColor: 'var(--input-disabled-bg, #f5f5f5)', cursor: 'not-allowed' }}
                />
              </div>

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
            <button type="submit" disabled={formLoading} className={styles.btnSubmit}>
              <FiSave style={{ marginRight: '8px' }} />
              {formLoading ? 'Updating...' : 'Update Department'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default UpdateDepartment;