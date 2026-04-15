// src/components/UpdateClinic.jsx
import React, { useState, useMemo } from 'react';
import { FiSave } from 'react-icons/fi';
import { updateClinic } from '../Api/Api.js';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import styles from './ClinicList.module.css';

const allowedCharactersRegex = /^[A-Za-z0-9 ]+$/;
const nameOnlyRegex           = /^[A-Za-z ]+$/;           // letters + spaces only (no numbers)
const locationRegex           = /^[0-9.,\-+\s]+$/;        // digits . , - + spaces only
const MOBILE_REGEX            = /^\d{10}$/;                // exactly 10 digits

const getLiveValidationMessage = (fieldName, value) => {
  const strValue = value == null ? '' : String(value).trim();
  const trimmed  = strValue;

  switch (fieldName) {
    case 'clinicName':
      if (!trimmed) return 'ClinicName is required';
      if (trimmed.length > 100) return 'ClinicName should not exceed 100 characters';
      if (!nameOnlyRegex.test(trimmed))
        return 'ClinicName should not contain numbers or special characters';
      return '';

    case 'clinicType':
      if (!trimmed) return 'ClinicType is required';
      if (trimmed.length > 500) return 'ClinicType should not exceed 500 characters';
      if (!nameOnlyRegex.test(trimmed))
        return 'ClinicType should not contain numbers or special characters';
      return '';

    case 'ownerName':
      if (!trimmed) return 'OwnerName is required';
      if (trimmed.length > 100) return 'OwnerName should not exceed 100 characters';
      if (!nameOnlyRegex.test(trimmed))
        return 'OwnerName should not contain numbers or special characters';
      return '';

    case 'address':
      if (!trimmed) return 'Address is required';
      if (trimmed.length > 500) return 'Address should not exceed 500 characters';
      return '';

    case 'location':
      if (!trimmed) return 'Location is required';
      if (trimmed.length > 500) return 'Location should not exceed 500 characters';
      if (!locationRegex.test(trimmed))
        return 'Location must contain only numbers, commas, dots, and coordinate characters';
      return '';

    case 'status':
      if (!value) return 'Status is required';
      return '';

    case 'mobile':
      if (!value || !value.trim()) return 'Mobile is required';
      if (value.trim().length < 10 || value.trim().length > 10) return 'Mobile length should be 10';
      if (!MOBILE_REGEX.test(value.trim())) return 'Invalid mobile number';
      return '';

    case 'altMobile':
      if (!value || !value.trim()) return 'Alternate Mobile is required';
      if (value.trim().length < 10 || value.trim().length > 10) return 'AltMobile length should be 10';
      if (!MOBILE_REGEX.test(value.trim())) return 'Invalid alternate mobile number';
      return '';

    case 'email':
      if (!value || !value.trim()) return 'Email is required';
      if (value && value.trim()) {
        if (!value.includes('@')) return 'Email must contain @';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
          return 'Please enter a valid email address';
        if (value.trim().length > 100) return 'Email must not exceed 100 characters';
      }
      return '';

    case 'gstNo':
      if (!value || !value.trim()) return 'GstNo is required';
      if (value.trim().length < 15)
        return `GST number must be 15 characters (${value.trim().length}/15 entered)`;
      if (value.trim().length > 15) return 'GST number must not exceed 15 characters';
      if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value.trim()))
        return 'Invalid GST format (e.g. 29ABCDE1234F1Z5)';
      return '';

    case 'cgstPercentage':
      if (value === '' || value === null || value === undefined)
        return 'CgstPercentage is required';
      if (isNaN(Number(value))) return 'CgstPercentage should be a decimal';
      return '';

    case 'sgstPercentage':
      if (value === '' || value === null || value === undefined)
        return 'SgstPercentage is required';
      if (isNaN(Number(value))) return 'SgstPercentage should be a decimal';
      return '';

    default:
      return '';
  }
};

const filterInput = (fieldName, value) => {
  switch (fieldName) {
    case 'clinicName':
    case 'ownerName':
    case 'clinicType':
      // Allow letters and spaces only — strip numbers and special characters
      return value.replace(/[^A-Za-z\s]/g, '');

    case 'location':
      // Allow digits, dot, comma, hyphen (minus), plus, spaces only
      return value.replace(/[^0-9.,\-+\s]/g, '');

    case 'mobile':
    case 'altMobile':
      return value.replace(/[^0-9]/g, '');

    case 'gstNo':
      return value.toUpperCase().replace(/[^0-9A-Z]/g, '').substring(0, 50);

    case 'cgstPercentage':
    case 'sgstPercentage':
    default:
      return value;
  }
};

const STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
];

const VALIDATED_FIELDS = [
  'clinicName', 'address', 'location', 'clinicType', 'gstNo',
  'cgstPercentage', 'sgstPercentage', 'ownerName', 'mobile',
  'altMobile', 'email', 'status',
];

// ─────────────────────────────────────────────────────────────────────────────
// UpdateClinic
//
// Double-popup fix
// ─────────────────
// UpdateClinic owns its OWN MessagePopup for ALL feedback (warning, error,
// success).  It never passes a message to onSuccess / onError — those callbacks
// only tell ClinicList to close the modal and refresh the list.
// ClinicList must NOT call showPopup inside handleUpdateSuccess / handleUpdateError.
// ─────────────────────────────────────────────────────────────────────────────
const UpdateClinic = ({ clinic, onClose, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    clinicName:          clinic.name                || '',
    address:             clinic.address             || '',
    location:            clinic.location            || '',
    clinicType:          clinic.clinicType          || '',
    gstNo:               clinic.gstNo               || '',
    cgstPercentage:      clinic.cgstPercentage      || '',
    sgstPercentage:      clinic.sgstPercentage      || '',
    ownerName:           clinic.ownerName           || '',
    mobile:              clinic.mobile              || '',
    altMobile:           clinic.altMobile           || '',
    email:               clinic.email               || '',
    status:              clinic.status === 'active' ? 1 : 2,
    inLabAvailable:      clinic.inLabAvailable      ?? 0,
    inPharmacyAvailable: clinic.inPharmacyAvailable ?? 0,
  });

  const [formLoading,        setFormLoading]        = useState(false);
  const [validationMessages, setValidationMessages] = useState({});
  const [submitAttempted,    setSubmitAttempted]    = useState(false);
  const [submitBtnDisabled,  setSubmitBtnDisabled]  = useState(false);

  // ── Internal popup — this is the ONLY popup shown for UpdateClinic ──
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopup  = (message, type = 'success') => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });

  // ── Is the form completely valid? ──
  const isFormValid = useMemo(() => {
    const requiredFields = [
      'clinicName', 'address', 'location', 'clinicType', 'gstNo',
      'cgstPercentage', 'sgstPercentage', 'ownerName', 'mobile',
      'altMobile', 'email',
    ];
    const allFilled = requiredFields.every(
      (f) =>
        formData[f] !== '' &&
        formData[f] !== null &&
        formData[f] !== undefined &&
        String(formData[f]).trim() !== ''
    );
    if (!allFilled) return false;
    if (!formData.status) return false;
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

  // ── Handler for Yes/No select fields (inLabAvailable, inPharmacyAvailable) ──
  const handleAvailabilityChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: Number(value) }));
  };

  // ── Validate all fields; returns true only if zero errors ──
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

    // 2-sec cooldown on the submit button
    setSubmitBtnDisabled(true);
    setTimeout(() => setSubmitBtnDisabled(false), 2000);

    setFormLoading(true);

    try {
      await updateClinic({
        clinicId:            Number(clinic.id),
        ClinicName:          formData.clinicName.trim(),
        Address:             formData.address.trim(),
        Location:            formData.location.trim(),
        ClinicType:          formData.clinicType.trim(),
        GstNo:               formData.gstNo.trim(),
        CgstPercentage:      Number(formData.cgstPercentage),
        SgstPercentage:      Number(formData.sgstPercentage),
        OwnerName:           formData.ownerName.trim(),
        Mobile:              formData.mobile.trim(),
        AltMobile:           formData.altMobile.trim(),
        Email:               formData.email.trim(),
        Status:              Number(formData.status),
        inLabAvailable:      formData.inLabAvailable,
        inPharmacyAvailable: formData.inPharmacyAvailable,
      });

      // Show success popup here (inside UpdateClinic only)
      showPopup('Clinic updated successfully!', 'success');

      // After 1 s the popup auto-closes; then signal parent to close modal + refresh.
      // onSuccess receives NO message — ClinicList must NOT show another popup.
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1000);

    } catch (err) {
      const errMsg =
        err.message || 'Failed to update clinic. Please try again.';

      // Show error popup here (inside UpdateClinic only)
      showPopup(errMsg, 'error');

      // Signal parent with the message so it can log/handle if needed,
      // but ClinicList must NOT call showPopup in handleUpdateError.
      if (onError) onError(errMsg);

    } finally {
      setFormLoading(false);
    }
  };

  // ─────────────────────────────────────────────
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

        {/* Header */}
        <div className={styles.detailModalHeader}>
          <div className={styles.detailHeaderContent}>
            <h2>Update Clinic</h2>
            <div className={styles.detailHeaderMeta}>
              <span className={styles.workIdBadge}>{formData.clinicName || 'Clinic'}</span>
              <span
                className={`${styles.workIdBadge} ${
                  formData.status === 1 ? styles.activeBadge : styles.inactiveBadge
                }`}
              >
                {formData.status === 1 ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className={styles.detailCloseBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.addModalBody}>

          {/* ── Basic Information ── */}
          <div className={styles.addSection}>
            <div className={styles.addSectionHeader}><h3>Basic Information</h3></div>
            <div className={styles.addFormGrid}>

              <div className={styles.addFormGroup}>
                <label>Clinic Name <span className={styles.required}>*</span></label>
                <input
                  required
                  name="clinicName"
                  value={formData.clinicName}
                  onChange={handleInputChange}
                  placeholder="Enter clinic name"
                />
                {validationMessages.clinicName && (
                  <span className={styles.validationMsg}>{validationMessages.clinicName}</span>
                )}
              </div>

              <div className={styles.addFormGroup}>
                <label>Clinic Type <span className={styles.required}>*</span></label>
                <input
                  required
                  name="clinicType"
                  value={formData.clinicType}
                  onChange={handleInputChange}
                  placeholder="e.g. Dental, General"
                />
                {validationMessages.clinicType && (
                  <span className={styles.validationMsg}>{validationMessages.clinicType}</span>
                )}
              </div>

              <div className={styles.addFormGroup}>
                <label>Owner Name <span className={styles.required}>*</span></label>
                <input
                  required
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleInputChange}
                  placeholder="Enter owner name"
                />
                {validationMessages.ownerName && (
                  <span className={styles.validationMsg}>{validationMessages.ownerName}</span>
                )}
              </div>

              <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                <label>Address <span className={styles.required}>*</span></label>
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

              <div className={styles.addFormGroup}>
                <label>Location <span className={styles.required}>*</span></label>
                <input
                  required
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. 9.9252, 78.1198"
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
                {validationMessages.status && (
                  <span className={styles.validationMsg}>{validationMessages.status}</span>
                )}
              </div>

            </div>
          </div>

          {/* ── Contact Information ── */}
          <div className={styles.addSection}>
            <div className={styles.addSectionHeader}><h3>Contact Information</h3></div>
            <div className={styles.addFormGridThreeCol}>

              <div className={styles.addFormGroup}>
                <label>Mobile <span className={styles.required}>*</span></label>
                <input
                  required
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  maxLength="20"
                  placeholder="Enter mobile number"
                />
                {validationMessages.mobile && (
                  <span className={styles.validationMsg}>{validationMessages.mobile}</span>
                )}
              </div>

              <div className={styles.addFormGroup}>
                <label>Alternate Mobile <span className={styles.required}>*</span></label>
                <input
                  required
                  name="altMobile"
                  value={formData.altMobile}
                  onChange={handleInputChange}
                  maxLength="20"
                  placeholder="Enter alternate mobile"
                />
                {validationMessages.altMobile && (
                  <span className={styles.validationMsg}>{validationMessages.altMobile}</span>
                )}
              </div>

              <div className={styles.addFormGroup}>
                <label>Email <span className={styles.required}>*</span></label>
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="clinic@example.com"
                />
                {validationMessages.email && (
                  <span className={styles.validationMsg}>{validationMessages.email}</span>
                )}
              </div>

            </div>
          </div>

          {/* ── Tax Information ── */}
          <div className={styles.addSection}>
            <div className={styles.addSectionHeader}><h3>Tax Information</h3></div>
            <div className={styles.addFormGridThreeCol}>

              <div className={styles.addFormGroup}>
                <label>GST Number <span className={styles.required}>*</span></label>
                <input
                  required
                  name="gstNo"
                  value={formData.gstNo}
                  onChange={handleInputChange}
                  placeholder="e.g. 33ABCDE1234F1Z5"
                  maxLength={50}
                />
                {validationMessages.gstNo && (
                  <span className={styles.validationMsg}>{validationMessages.gstNo}</span>
                )}
              </div>

              <div className={styles.addFormGroup}>
                <label>CGST Percentage <span className={styles.required}>*</span></label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  name="cgstPercentage"
                  value={formData.cgstPercentage}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
                {validationMessages.cgstPercentage && (
                  <span className={styles.validationMsg}>{validationMessages.cgstPercentage}</span>
                )}
              </div>

              <div className={styles.addFormGroup}>
                <label>SGST Percentage <span className={styles.required}>*</span></label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  name="sgstPercentage"
                  value={formData.sgstPercentage}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
                {validationMessages.sgstPercentage && (
                  <span className={styles.validationMsg}>{validationMessages.sgstPercentage}</span>
                )}
              </div>

            </div>
          </div>

          {/* ── Availability ── */}
          <div className={styles.addSection}>
            <div className={styles.addSectionHeader}><h3>Availability</h3></div>
            <div className={styles.addFormGrid}>

              <div className={styles.addFormGroup}>
                <label>In-Lab Available</label>
                <select
                  name="inLabAvailable"
                  value={formData.inLabAvailable}
                  onChange={handleAvailabilityChange}
                >
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                </select>
              </div>

              <div className={styles.addFormGroup}>
                <label>In-Pharmacy Available</label>
                <select
                  name="inPharmacyAvailable"
                  value={formData.inPharmacyAvailable}
                  onChange={handleAvailabilityChange}
                >
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                </select>
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
                : 'Update Clinic'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateClinic;