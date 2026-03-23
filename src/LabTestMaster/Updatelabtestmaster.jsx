// src/components/UpdateLabTestMaster.jsx
import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiSave, FiX } from 'react-icons/fi';
import { getLabTestMasterList, updateLabTestMaster } from '../Api/ApiLabTests.js';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import styles from './LabMaster.module.css';
import { FaClinicMedical } from 'react-icons/fa';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';

const TEST_TYPES = [
  { id: 1, label: 'Blood'  },
  { id: 2, label: 'Urine'  },
  { id: 3, label: 'Saliva' },
  { id: 4, label: 'Stool'  },
  { id: 5, label: 'CSF'    },
  { id: 6, label: 'Tissue' },
  { id: 7, label: 'Other'  },
];

const STATUS_OPTIONS = [
  { id: 1, label: 'Active'     },
  { id: 2, label: 'Inactive'   },
  { id: 3, label: 'Deprecated' },
];

const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'TestName':
      if (!value || !value.trim()) return 'Test name is required';
      if (value.trim().length < 3)   return 'Test name must be at least 3 characters';
      if (value.trim().length > 100) return 'Test name must not exceed 100 characters';
      return '';

    case 'ShortName':
      if (!value || !value.trim()) return 'Short name is required';
      if (value.trim().length < 2)  return 'Short name must be at least 2 characters';
      if (value.trim().length > 20) return 'Short name must not exceed 20 characters';
      return '';

    case 'Description':
      if (value && value.length > 500) return 'Description must not exceed 500 characters';
      return '';

    case 'Fees':
       if (!value || value.trim() === '') return 'Fees is required';
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return 'Enter a valid amount (e.g., 100 or 100.50)';
  if (Number(value) <= 0) return 'Fees must be greater than 0';
  return '';

    case 'NormalRange':
      if (value && /[a-zA-Z]/.test(value)) return 'Normal range cannot contain letters';
      if (value && value.length > 50)      return 'Normal range must not exceed 50 characters';
      return '';

    case 'Units':
      if (value && /[0-9]/.test(value))      return 'Units cannot contain numbers';
      if (value && /[^a-zA-Z\s]/.test(value)) return 'Units cannot contain special characters';
      if (value && value.length > 30)         return 'Units must not exceed 30 characters';
      return '';

    case 'CGSTPercentage':
    case 'SGSTPercentage':
      if (value === '' || value === null || value === undefined) return '';
      const percent = Number(value);
      if (isNaN(percent))  return 'Must be a valid number';
      if (percent < 0)     return 'Cannot be negative';
      if (percent > 100)   return 'Cannot exceed 100%';
      return '';

    case 'Remarks':
      if (value && value.length > 500) return 'Remarks must not exceed 500 characters';
      return '';

    default:
      return '';
  }
};

const filterInput = (fieldName, value) => {
  switch (fieldName) {
    case 'TestName':
    case 'ShortName':
      return value.replace(/[^a-zA-Z\s]/g, '');
    case 'Fees':
    case 'CGSTPercentage':
    case 'SGSTPercentage':
      return value.replace(/[^0-9.]/g, '');
    case 'Units':
      return value.replace(/[^a-zA-Z\s]/g, '');
    case 'NormalRange':
      return value.replace(/[a-zA-Z]/g, '');
    default:
      return value;
  }
};

// ────────────────────────────────────────────────
const UpdateLabTestMaster = ({ test, onClose, onUpdateSuccess }) => {
  if (!test) return null;

  const testId = test.id;

  const [loading, setLoading]     = useState(true);
  const [error,   setError]       = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [validationMessages, setValidationMessages] = useState({});

  const [formData, setFormData] = useState({
    TestName:       '',
    ShortName:      '',
    Description:    '',
    TestType:       1,
    NormalRange:    '',
    Units:          '',
    Remarks:        '',
    Fees:           '',
    CGSTPercentage: '9',
    SGSTPercentage: '9',
    Status:         1,
  });

  // ── Button cooldown state (2-sec disable after click) ──────────────────────
  const [btnCooldown, setBtnCooldown] = useState({});
  const triggerCooldown = (key) => {
    setBtnCooldown((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setBtnCooldown((prev) => ({ ...prev, [key]: false })), 2000);
  };

  // ── MessagePopup state ──────────────────────────────────────────────────────
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopup  = (message, type = 'success') => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });

  // ── Submit button gating ────────────────────────────────────────────────────
  const allRequiredFilled =
    formData.TestName.trim().length > 0 &&
    formData.ShortName.trim().length > 0 &&
    formData.Fees !== '' &&
    Number(formData.Fees) > 0 &&
    /^\d+(\.\d{1,2})?$/.test(formData.Fees);

  // ────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const clinicId = await getStoredClinicId();
        const branchId = await getStoredBranchId();

        const testList    = await getLabTestMasterList(clinicId, { BranchID: branchId });
        const fetchedTest = testList.find((t) => t.id === Number(testId));

        if (!fetchedTest) {
          throw new Error(`Lab test not found with ID: ${testId}`);
        }

        setFormData({
          TestName:       fetchedTest.testName       || '',
          ShortName:      fetchedTest.shortName      || '',
          Description:    fetchedTest.description    || '',
          TestType:       fetchedTest.testType       || 1,
          NormalRange:    fetchedTest.normalRange    || '',
          Units:          fetchedTest.units          || '',
          Remarks:        fetchedTest.remarks        || '',
          Fees:           fetchedTest.fees           || '',
          CGSTPercentage: fetchedTest.cgstPercentage || '9',
          SGSTPercentage: fetchedTest.sgstPercentage || '9',
          Status:         fetchedTest.status         || 1,
        });
      } catch (err) {
        setError({
          message: err.message || 'Failed to load lab test data',
          status:  err.status  || 500,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [testId]);

  // ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const filteredValue = filterInput(name, value);

    setFormData((prev) => ({ ...prev, [name]: filteredValue }));
    const validationMessage = getLiveValidationMessage(name, filteredValue);
    setValidationMessages((prev) => ({ ...prev, [name]: validationMessage }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Guard: show warning popup if required fields missing
    if (!allRequiredFilled) {
      const missing = [];
      if (!formData.TestName.trim())  missing.push('Test Name');
      if (!formData.ShortName.trim()) missing.push('Short Name');
      if (!formData.Fees || String(formData.Fees).trim() === '' || Number(formData.Fees) <= 0) missing.push('Fees');
      showPopup(`Please fill all required fields: ${missing.join(', ')}.`, 'warning');
      return;
    }

    triggerCooldown('submit');
    setFormLoading(true);

    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      await updateLabTestMaster({
        TestID:         Number(testId),
        ClinicID:       clinicId,
        BranchID:       branchId,
        TestName:       formData.TestName.trim(),
        ShortName:      formData.ShortName.trim(),
        Description:    formData.Description.trim(),
        TestType:       Number(formData.TestType),
        NormalRange:    formData.NormalRange.trim(),
        Units:          formData.Units.trim(),
        Remarks:        formData.Remarks.trim(),
        Fees:           Number(formData.Fees) || 0,
        CGSTPercentage: Number(formData.CGSTPercentage) || 9,
        SGSTPercentage: Number(formData.SGSTPercentage) || 9,
        Status:         Number(formData.Status),
      });

      showPopup('Lab test updated successfully!', 'success');
      setTimeout(() => {
        if (onUpdateSuccess) onUpdateSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      showPopup(err.message || 'Failed to update lab test.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={`${styles.modal} ${styles.formModal}`} onClick={(e) => e.stopPropagation()}>

          <div className={styles.modalHeader}>
            <h2>Update Lab Test</h2>

            <div className={styles.headerRight}>
              <div className={styles.clinicNameone}>
                <FaClinicMedical size={20} style={{ verticalAlign: 'middle', margin: '6px', marginTop: '0px' }} />
                {localStorage.getItem('clinicName') || '—'}
              </div>
              <button onClick={onClose} className={styles.modalClose} disabled={formLoading}>
                <FiX />
              </button>
            </div>
          </div>

          {loading ? (
            <div className={styles.modalBody}>
              <div className={styles.loading}>Loading lab test data...</div>
            </div>
          ) : error ? (
            <div className={styles.modalBody}>
              <div className={styles.error}>Error: {error.message}</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.modalBody} noValidate>

              <div className={styles.formGrid}>
                <h3 className={styles.formSectionTitle}>Test Information</h3>

                <div className={styles.formGroup}>
                  <label>Test Name <span className={styles.required}>*</span></label>
                  <input
                    name="TestName"
                    value={formData.TestName}
                    onChange={handleInputChange}
                    placeholder="e.g., Complete Blood Count"
                    disabled={formLoading}
                  />
                  {validationMessages.TestName && (
                    <span className={styles.validationMessage}>{validationMessages.TestName}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Short Name <span className={styles.required}>*</span></label>
                  <input
                    name="ShortName"
                    value={formData.ShortName}
                    onChange={handleInputChange}
                    placeholder="e.g., CBC"
                    maxLength="20"
                    disabled={formLoading}
                  />
                  {validationMessages.ShortName && (
                    <span className={styles.validationMessage}>{validationMessages.ShortName}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Test Type <span className={styles.required}>*</span></label>
                  <select name="TestType" value={formData.TestType} onChange={handleInputChange} disabled={formLoading}>
                    {TEST_TYPES.map((type) => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Fees (₹) <span className={styles.required}>*</span></label>
                  <input
                    required
                    type="text"
                    name="Fees"
                    value={formData.Fees}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    disabled={formLoading}
                  />
                  {validationMessages.Fees && (
                    <span className={styles.validationMessage}>{validationMessages.Fees}</span>
                  )}
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Description</label>
                  <textarea
                    name="Description"
                    rows={2}
                    value={formData.Description}
                    onChange={handleInputChange}
                    placeholder="Brief description of the test"
                    disabled={formLoading}
                  />
                  {validationMessages.Description && (
                    <span className={styles.validationMessage}>{validationMessages.Description}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Normal Range</label>
                  <input
                    name="NormalRange"
                    value={formData.NormalRange}
                    onChange={handleInputChange}
                    placeholder="e.g., 4.5-11.0"
                    maxLength="50"
                    disabled={formLoading}
                  />
                  {validationMessages.NormalRange && (
                    <span className={styles.validationMessage}>{validationMessages.NormalRange}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Units</label>
                  <input
                    name="Units"
                    value={formData.Units}
                    onChange={handleInputChange}
                    placeholder="e.g., cells/mcL"
                    maxLength="30"
                    disabled={formLoading}
                  />
                  {validationMessages.Units && (
                    <span className={styles.validationMessage}>{validationMessages.Units}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>CGST %</label>
                  <input
                    type="text"
                    name="CGSTPercentage"
                    value={formData.CGSTPercentage}
                    onChange={handleInputChange}
                    disabled={formLoading}
                  />
                  {validationMessages.CGSTPercentage && (
                    <span className={styles.validationMessage}>{validationMessages.CGSTPercentage}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>SGST %</label>
                  <input
                    type="text"
                    name="SGSTPercentage"
                    value={formData.SGSTPercentage}
                    onChange={handleInputChange}
                    disabled={formLoading}
                  />
                  {validationMessages.SGSTPercentage && (
                    <span className={styles.validationMessage}>{validationMessages.SGSTPercentage}</span>
                  )}
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Remarks</label>
                  <textarea
                    name="Remarks"
                    rows={2}
                    value={formData.Remarks}
                    onChange={handleInputChange}
                    placeholder="Additional notes"
                    disabled={formLoading}
                  />
                  {validationMessages.Remarks && (
                    <span className={styles.validationMessage}>{validationMessages.Remarks}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Status <span className={styles.required}>*</span></label>
                  <select name="Status" value={formData.Status} onChange={handleInputChange} disabled={formLoading}>
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.id} value={status.id}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={onClose} className={styles.btnCancel} disabled={formLoading}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading || !!btnCooldown['submit']}
                  className={styles.btnSubmit}
                  title={!allRequiredFilled ? 'Please fill all required fields to enable this button' : ''}
                >
                  <FiSave size={16} />
                  {formLoading ? 'Updating...' : 'Update Lab Test'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ── MessagePopup (outside modal so z-index is clean) ── */}
      <MessagePopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
      />
    </>
  );
};

export default UpdateLabTestMaster;