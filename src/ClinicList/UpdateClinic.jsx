// src/components/UpdateClinic.jsx
import React, { useState } from 'react';
import { FiSave } from 'react-icons/fi';
import { updateClinic } from '../Api/Api.js';
import styles from './ClinicList.module.css';

// ─── matches backend allowedCharactersRegex exactly ───────────────────────────
const allowedCharactersRegex = /^[A-Za-z0-9 ]+$/;

// ─── Validation messages match backend updateClinicValidatorRules word-for-word ─
const getLiveValidationMessage = (fieldName, value) => {
  const strValue = value == null ? '' : String(value).trim();
  const trimmed = strValue; // already trimmed

  switch (fieldName) {
    case 'clinicName':
      if (!trimmed) return 'ClinicName is required';
      if (trimmed.length > 100) return 'ClinicName should not exceed 100 characters';
      if (!allowedCharactersRegex.test(trimmed)) return 'ClinicName should not contain special characters';
      return '';

    case 'clinicType':
      if (!trimmed) return 'ClinicType is required';
      if (trimmed.length > 500) return 'ClinicType should not exceed 500 characters';
      return '';

    case 'ownerName':
      if (!trimmed) return 'OwnerName is required';
      if (trimmed.length > 100) return 'OwnerName should not exceed 100 characters';
      if (!allowedCharactersRegex.test(trimmed)) return 'OwnerName should not contain special characters';
      return '';

    case 'address':
      if (!trimmed) return 'Address is required';
      if (trimmed.length > 500) return 'Address should not exceed 500 characters';
      return '';

    case 'location':
      if (!trimmed) return 'Location is required';
      if (trimmed.length > 500) return 'Location should not exceed 500 characters';
      return '';

    case 'status':
      if (!value) return 'Status is required';
      return '';

    case 'mobile':
      if (!trimmed) return 'Mobile is required';
      if (trimmed.length > 20) return 'Mobile should not exceed 20 characters';
      if (!allowedCharactersRegex.test(trimmed)) return 'Mobile should not contain special characters';
      return '';

    case 'altMobile':
      if (!trimmed) return 'AltMobile is required';
      if (trimmed.length > 20) return 'AltMobile should not exceed 20 characters';
      if (!allowedCharactersRegex.test(trimmed)) return 'AltMobile should not contain special characters';
      return '';

    case 'email':
      if (!value || !value.trim()) return 'Email is required';
      if (value && value.trim()) {
        if (!value.includes('@')) return 'Email must contain @';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address';
        }
        if (value.trim().length > 100) return 'Email must not exceed 100 characters';
      }
      return '';

    case 'gstNo':
      if (!trimmed) return 'GstNo is required';
      if (trimmed.length > 50) return 'GstNo should not exceed 50 characters';
      return '';

    case 'cgstPercentage':
      if (value === '' || value === null || value === undefined) return 'CgstPercentage is required';
      if (isNaN(Number(value))) return 'CgstPercentage should be a decimal';
      return '';

    case 'sgstPercentage':
      if (value === '' || value === null || value === undefined) return 'SgstPercentage is required';
      if (isNaN(Number(value))) return 'SgstPercentage should be a decimal';
      return '';

    case 'fileNoPrefix':
      if (trimmed.length > 10) return 'FileNoPrefix should not exceed 10 characters';
      return '';

    case 'invoicePrefix':
      if (trimmed.length > 10) return 'InvoicePrefix should not exceed 10 characters';
      return '';

    case 'lastFileSeq':
      if (value === '' || value === null || value === undefined) return 'LastFileSeq is required';
      if (!Number.isInteger(Number(value)) || isNaN(Number(value))) return 'LastFileSeq should be a number';
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
      return value.replace(/[^A-Za-z0-9 ]/g, '');

    case 'mobile':
    case 'altMobile':
      return value.replace(/[^0-9]/g, '');

    case 'gstNo':
      return value.toUpperCase().replace(/[^0-9A-Z]/g, '').substring(0, 50);

    case 'fileNoPrefix':
    case 'invoicePrefix':
      return value.replace(/[^A-Za-z0-9_-]/g, '');

    case 'cgstPercentage':
    case 'sgstPercentage':
    case 'lastFileSeq':
      return value.replace(/[^0-9.]/g, '');

    default:
      return value;
  }
};

const STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
];

// ─── Fields that are validated by the backend update validator ────────────────
const VALIDATED_FIELDS = [
  'clinicName',
  'address',
  'location',
  'clinicType',
  'gstNo',
  'cgstPercentage',
  'sgstPercentage',
  'ownerName',
  'mobile',
  'altMobile',
  'email',
  'status',
  // fileNoPrefix, invoicePrefix, lastFileSeq are NOT in backend update validator
  // but we still check the optional length rules for UX
  'fileNoPrefix',
  'invoicePrefix',
  'lastFileSeq',
];

const UpdateClinic = ({ clinic, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    clinicName:     clinic.name           || '',
    address:        clinic.address        || '',
    location:       clinic.location       || '',
    clinicType:     clinic.clinicType     || '',
    gstNo:          clinic.gstNo          || '',
    cgstPercentage: clinic.cgstPercentage || '',
    sgstPercentage: clinic.sgstPercentage || '',
    ownerName:      clinic.ownerName      || '',
    mobile:         clinic.mobile         || '',
    altMobile:      clinic.altMobile      || '',
    email:          clinic.email          || '',
    fileNoPrefix:   clinic.fileNoPrefix   || '',
    invoicePrefix:  clinic.invoicePrefix  || '',
    lastFileSeq:    clinic.lastFileSeq    || '',
    status:         clinic.status === 'active' ? 1 : 2,
  });

  const [formLoading,        setFormLoading]        = useState(false);
  const [formError,          setFormError]          = useState('');
  const [formSuccess,        setFormSuccess]        = useState(false);
  const [validationMessages, setValidationMessages] = useState({});

  // ── Live validation on every keystroke ────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const filteredValue = filterInput(name, value);
    setFormData((prev) => ({ ...prev, [name]: filteredValue }));

    const msg = getLiveValidationMessage(name, filteredValue);
    setValidationMessages((prev) => ({ ...prev, [name]: msg }));
  };

  // ── Run validation on all fields; returns true only if zero errors ─────────
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

  // ── Submit: blocked entirely until all validation messages are cleared ─────
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
      await updateClinic({
        clinicId:       Number(clinic.id),
        ClinicName:     formData.clinicName.trim(),
        Address:        formData.address.trim(),
        Location:       formData.location.trim(),
        ClinicType:     formData.clinicType.trim(),
        GstNo:          formData.gstNo.trim(),
        CgstPercentage: Number(formData.cgstPercentage),
        SgstPercentage: Number(formData.sgstPercentage),
        OwnerName:      formData.ownerName.trim(),
        Mobile:         formData.mobile.trim(),
        AltMobile:      formData.altMobile.trim(),
        Email:          formData.email.trim(),
        FileNoPrefix:   formData.fileNoPrefix.trim(),
        InvoicePrefix:  formData.invoicePrefix.trim(),
        Status:         Number(formData.status),
      });

      setFormSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setFormError(err.message?.split(':')[1]?.trim() || 'Failed to update clinic.');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Shared handlers for prefix fields ─────────────────────────────────────
  const prefixKeyDown = (e) => {
    const char = e.key;
    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Enter'].includes(char) || e.ctrlKey || e.metaKey) return;
    if (!/[A-Za-z0-9_-]/.test(char)) e.preventDefault();
  };

  const prefixPaste = (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text');
    const clean  = pasted.replace(/[^A-Za-z0-9_-]/g, '');
    const input  = e.target;
    const newValue = input.value.substring(0, input.selectionStart) + clean + input.value.substring(input.selectionEnd);
    setFormData((prev) => ({ ...prev, [input.name]: newValue }));
  };

  return (
    <div className={styles.detailModalOverlay} onClick={onClose}>
      <div className={styles.addModalContent} onClick={(e) => e.stopPropagation()}>

        {/* Gradient Header */}
        <div className={styles.detailModalHeader}>
          <div className={styles.detailHeaderContent}>
            <h2>Update Clinic</h2>
            <div className={styles.detailHeaderMeta}>
              <span className={styles.workIdBadge}>{formData.clinicName || 'Clinic'}</span>
              <span className={`${styles.workIdBadge} ${formData.status === 1 ? styles.activeBadge : styles.inactiveBadge}`}>
                {formData.status === 1 ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className={styles.detailCloseBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.addModalBody}>
          {formError   && <div className={styles.formError}>{formError}</div>}
          {formSuccess && <div className={styles.formSuccess}>Clinic updated successfully!</div>}

          {/* ── Basic Information ─────────────────────────────────────────── */}
          <div className={styles.addSection}>
            <div className={styles.addSectionHeader}><h3>Basic Information</h3></div>
            <div className={styles.addFormGrid}>

              {/* Clinic Name — required in backend */}
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

              {/* Clinic Type — required in backend */}
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

              {/* Owner Name — required in backend */}
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

              {/* Address — required in backend */}
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

              {/* Location — required in backend */}
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

          {/* ── Contact Information ───────────────────────────────────────── */}
          <div className={styles.addSection}>
            <div className={styles.addSectionHeader}><h3>Contact Information</h3></div>
            <div className={styles.addFormGridThreeCol}>

              {/* Mobile — required in backend */}
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

              {/* Alternate Mobile — required in backend */}
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

              {/* Email — NOT required in backend (isEmail only, no notEmpty) */}
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

          {/* ── Tax Information ───────────────────────────────────────────── */}
          <div className={styles.addSection}>
            <div className={styles.addSectionHeader}><h3>Tax Information</h3></div>
            <div className={styles.addFormGridThreeCol}>

              {/* GST Number — required in backend, max 50, no format rule in backend */}
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

              {/* CGST — required in backend */}
              <div className={styles.addFormGroup}>
                <label>CGST Percentage <span className={styles.required}>*</span></label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  name="cgstPercentage"
                  value={formData.cgstPercentage}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
                {validationMessages.cgstPercentage && (
                  <span className={styles.validationMsg}>{validationMessages.cgstPercentage}</span>
                )}
              </div>

              {/* SGST — required in backend */}
              <div className={styles.addFormGroup}>
                <label>SGST Percentage <span className={styles.required}>*</span></label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
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

          {/* ── Billing Configuration ─────────────────────────────────────── */}
          {/* fileNoPrefix, lastFileSeq, invoicePrefix are NOT in backend update validator */}
          <div className={styles.addSection}>
            <div className={styles.addSectionHeader}><h3>Billing Configuration</h3></div>
            <div className={styles.addFormGrid}>

              <div className={styles.addFormGroup}>
                <label>File No Prefix</label>
                <input
                  name="fileNoPrefix"
                  value={formData.fileNoPrefix}
                  onChange={handleInputChange}
                  onKeyDown={prefixKeyDown}
                  onPaste={prefixPaste}
                  placeholder="e.g. FILE-2026_DOC"
                />
                {validationMessages.fileNoPrefix && (
                  <span className={styles.validationMsg}>{validationMessages.fileNoPrefix}</span>
                )}
              </div>

              <div className={styles.addFormGroup}>
                <label>Last File Sequence</label>
                <input
                  type="number"
                  name="lastFileSeq"
                  value={formData.lastFileSeq}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="0"
                />
                {validationMessages.lastFileSeq && (
                  <span className={styles.validationMsg}>{validationMessages.lastFileSeq}</span>
                )}
              </div>

              <div className={styles.addFormGroup}>
                <label>Invoice Prefix</label>
                <input
                  name="invoicePrefix"
                  value={formData.invoicePrefix || ''}
                  onChange={handleInputChange}
                  onKeyDown={prefixKeyDown}
                  onPaste={prefixPaste}
                  placeholder="e.g. INV-2026_ABC"
                />
                {validationMessages.invoicePrefix && (
                  <span className={styles.validationMsg}>{validationMessages.invoicePrefix}</span>
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
              disabled={formLoading}
              className={styles.btnSubmit}
            >
              <FiSave className={styles.btnIcon} />
              {formLoading ? 'Updating...' : 'Update Clinic'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateClinic;