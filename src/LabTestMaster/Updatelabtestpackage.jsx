// src/components/UpdateLabTestPackage.jsx
import React, { useState, useEffect } from 'react';
import { FiSave, FiX } from 'react-icons/fi';
import { getLabTestPackageList, updateLabTestPackage } from '../Api/ApiLabTests.js';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import styles from './LabMaster.module.css';
import { FaClinicMedical } from 'react-icons/fa';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';

const STATUS_OPTIONS = [
  { id: 1, label: 'Active'   },
  { id: 2, label: 'Inactive' },
];

const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'packName':
      if (!value || !value.trim()) return 'Package name is required';
      if (value.trim().length < 3)   return 'Package name must be at least 3 characters';
      if (value.trim().length > 100) return 'Package name must not exceed 100 characters';
      return '';

    case 'packShortName':
      if (!value || !value.trim()) return 'Short name is required';
      if (value.trim().length < 2)  return 'Short name must be at least 2 characters';
      if (value.trim().length > 20) return 'Short name must not exceed 20 characters';
      return '';

    case 'description':
      if (value && value.length > 500) return 'Description must not exceed 500 characters';
      return '';

    case 'fees':
      if (!value || value.trim() === '') return 'Fees is required';
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return 'Enter a valid amount (e.g., 100 or 100.50)';
  if (Number(value) <= 0) return 'Fees must be greater than 0';
  return '';

    case 'cgstPercentage':
    case 'sgstPercentage':
      if (value === '' || value === null) return '';
      const taxVal = Number(value);
      if (isNaN(taxVal))  return 'Must be a valid number';
      if (taxVal < 0)     return 'Cannot be negative';
      if (taxVal > 100)   return 'Cannot exceed 100%';
      return '';

    default:
      return '';
  }
};

const filterInput = (fieldName, value) => {
  switch (fieldName) {
    case 'packName':
    case 'packShortName':
      return value.replace(/[^a-zA-Z\s]/g, '');

    case 'description':
      return value.replace(/[^a-zA-Z0-9\s\-&(),.;:!?]/g, '');

    case 'fees':
    case 'cgstPercentage':
    case 'sgstPercentage':
      return value.replace(/[^0-9.]/g, '').replace(/(\..*?)\./g, '$1');

    default:
      return value;
  }
};

// ────────────────────────────────────────────────
const UpdateLabTestPackage = ({ pkg, onClose, onUpdateSuccess }) => {
  if (!pkg) return null;

  const packageId = pkg.id;

  const [loading, setLoading]         = useState(true);
  const [error,   setError]           = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [validationMessages, setValidationMessages] = useState({});

  const [formData, setFormData] = useState({
    packName:       '',
    packShortName:  '',
    description:    '',
    fees:           '',
    cgstPercentage: '9',
    sgstPercentage: '9',
    status:         1,
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
    formData.packName.trim().length > 0 &&
    formData.packShortName.trim().length > 0 &&
    formData.fees !== '' &&
    Number(formData.fees) > 0 &&
    /^\d+(\.\d{1,2})?$/.test(formData.fees);

  // ────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const clinicId  = await getStoredClinicId();
        const branchId  = await getStoredBranchId();

        const packageList = await getLabTestPackageList(clinicId, { BranchID: branchId });
        const fetchedPkg  = packageList.find((p) => p.id === Number(packageId));

        if (!fetchedPkg) {
          throw new Error(`Lab test package not found with ID: ${packageId}`);
        }

        setFormData({
          packName:       fetchedPkg.packName       || '',
          packShortName:  fetchedPkg.packShortName  || '',
          description:    fetchedPkg.description    || '',
          fees:           fetchedPkg.fees           || '',
          cgstPercentage: fetchedPkg.cgstPercentage || '9',
          sgstPercentage: fetchedPkg.sgstPercentage || '9',
          status:         fetchedPkg.status         || 1,
        });
      } catch (err) {
        setError({
          message: err.message || 'Failed to load lab test package data',
          status:  err.status  || 500,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [packageId]);

  // ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const filteredValue = filterInput(name, value);

    setFormData((prev) => ({ ...prev, [name]: filteredValue }));

    const message = getLiveValidationMessage(name, filteredValue);
    setValidationMessages((prev) => ({ ...prev, [name]: message }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Guard: show warning popup if required fields missing
    if (!allRequiredFilled) {
      const missing = [];
      if (!formData.packName.trim())      missing.push('Package Name');
      if (!formData.packShortName.trim()) missing.push('Short Name');
      if (!formData.fees || String(formData.fees).trim() === '' || Number(formData.fees) <= 0) missing.push('Fees');
      showPopup(`Please fill all required fields: ${missing.join(', ')}.`, 'warning');
      return;
    }

    triggerCooldown('submit');
    setFormLoading(true);

    try {
      const clinicId = await getStoredClinicId();

      await updateLabTestPackage({
        packageId:      Number(packageId),
        clinicId:       clinicId,
        packName:       formData.packName.trim(),
        packShortName:  formData.packShortName.trim(),
        description:    formData.description.trim(),
        fees:           Number(formData.fees) || 0,
        cgstPercentage: Number(formData.cgstPercentage) || 9,
        sgstPercentage: Number(formData.sgstPercentage) || 9,
        status:         Number(formData.status),
      });

      showPopup('Lab test package updated successfully!', 'success');
      setTimeout(() => {
        if (onUpdateSuccess) onUpdateSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      showPopup(err.message || 'Failed to update lab test package.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  return (
    <>
      <div className={styles.modalOverlay} >
        <div className={`${styles.modal} ${styles.formModal}`} onClick={(e) => e.stopPropagation()}>

          <div className={styles.modalHeader}>
            <h2>Update Package</h2>

            <div className={styles.clinicNameone}>
              <FaClinicMedical size={20} style={{ verticalAlign: "middle", margin: "6px", marginTop: "0px" }} />
              {localStorage.getItem("clinicName") || "—"}
            </div>

            <button onClick={onClose} className={styles.modalClose} disabled={formLoading}>
              <FiX />
            </button>
          </div>

          {loading ? (
            <div className={styles.modalBody}>
              <div className={styles.loading}>Loading package data...</div>
            </div>
          ) : error ? (
            <div className={styles.modalBody}>
              <div className={styles.error}>Error: {error.message}</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.modalBody} noValidate>

              <div className={styles.formGrid}>
                <h3 className={styles.formSectionTitle}>Package Information</h3>

                <div className={styles.formGroup}>
                  <label>Package Name <span className={styles.required}>*</span></label>
                  <input
                    name="packName"
                    value={formData.packName}
                    onChange={handleInputChange}
                    placeholder="e.g., Full Body Checkup"
                    disabled={formLoading}
                  />
                  {validationMessages.packName && (
                    <span className={styles.validationMessage}>{validationMessages.packName}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Short Name <span className={styles.required}>*</span></label>
                  <input
                    name="packShortName"
                    value={formData.packShortName}
                    onChange={handleInputChange}
                    placeholder="e.g., FBC"
                    maxLength="20"
                    disabled={formLoading}
                  />
                  {validationMessages.packShortName && (
                    <span className={styles.validationMessage}>{validationMessages.packShortName}</span>
                  )}
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Description</label>
                  <textarea
                    name="description"
                    rows={2}
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of the package"
                    disabled={formLoading}
                  />
                  {validationMessages.description && (
                    <span className={styles.validationMessage}>{validationMessages.description}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Fees (₹) <span className={styles.required}>*</span></label>
                  <input
                    required
                    type="text"
                    name="fees"
                    value={formData.fees}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    disabled={formLoading}
                  />
                  {validationMessages.fees && (
                    <span className={styles.validationMessage}>{validationMessages.fees}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>CGST %</label>
                  <input
                    type="text"
                    name="cgstPercentage"
                    value={formData.cgstPercentage}
                    onChange={handleInputChange}
                    disabled={formLoading}
                  />
                  {validationMessages.cgstPercentage && (
                    <span className={styles.validationMessage}>{validationMessages.cgstPercentage}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>SGST %</label>
                  <input
                    type="text"
                    name="sgstPercentage"
                    value={formData.sgstPercentage}
                    onChange={handleInputChange}
                    disabled={formLoading}
                  />
                  {validationMessages.sgstPercentage && (
                    <span className={styles.validationMessage}>{validationMessages.sgstPercentage}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Status <span className={styles.required}>*</span></label>
                  <select name="status" value={formData.status} onChange={handleInputChange} disabled={formLoading}>
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
                  {formLoading ? 'Updating...' : 'Update Package'}
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

export default UpdateLabTestPackage;