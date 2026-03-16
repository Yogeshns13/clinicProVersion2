// src/components/UpdateVendor.jsx
import React, { useState } from 'react';
import { updateVendor } from '../Api/ApiPharmacy.js';
import styles from './UpdateVendor.module.css';
import { FaClinicMedical } from 'react-icons/fa';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
];

// ────────────────────────────────────────────────
// Validation (mirrors UpdatePatient exactly)
// ────────────────────────────────────────────────
const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'name':
      if (!value || !value.trim()) return 'Vendor name is required';
      if (value.trim().length < 2) return 'Vendor name must be at least 2 characters';
      if (value.trim().length > 100) return 'Vendor name must not exceed 100 characters';
      return '';

    case 'contactPerson':
      if (!value || !value.trim()) return 'Contact person is required';
      if (value.trim().length < 2) return 'Contact person must be at least 2 characters';
      if (value.trim().length > 100) return 'Contact person must not exceed 100 characters';
      return '';

    case 'mobile':
      if (!value || !value.trim()) return 'Mobile number is required';
      if (value.trim().length < 10) return 'Mobile number must be 10 digits';
      if (value.trim().length === 10) {
        if (!/^[6-9]\d{9}$/.test(value.trim())) {
          return 'Mobile number must start with 6-9';
        }
      }
      if (value.trim().length > 10) return 'Mobile number cannot exceed 10 digits';
      return '';

    case 'altMobile':
      if (value && value.trim()) {
        if (value.trim().length < 10) return 'Mobile number must be 10 digits';
        if (value.trim().length === 10) {
          if (!/^[6-9]\d{9}$/.test(value.trim())) {
            return 'Mobile number must start with 6-9';
          }
        }
        if (value.trim().length > 10) return 'Mobile number cannot exceed 10 digits';
      }
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

    case 'address':
      if (value && value.length > 500) return 'Address must not exceed 500 characters';
      return '';

    case 'gstNo':
      if (!value || !value.trim()) return 'GST No is required';
      if (value && value.trim()) {
        if (value.trim().length > 15) return 'GST number must not exceed 15 characters';
        if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value.trim())) {
          return 'Please enter a valid GST number (e.g. 22AAAAA0000A1Z5)';
        }
      }
      return '';

    case 'licenseDetail':
      if (value && value.trim()) {
        if (value.trim().length > 200) return 'License detail must not exceed 200 characters';
      }
      return '';

    default:
      return '';
  }
};

const filterInput = (fieldName, value) => {
  switch (fieldName) {
    case 'mobile':
    case 'altMobile':
      return value.replace(/[^0-9]/g, '');

    case 'gstNo':
      return value.toUpperCase().replace(/[^0-9A-Z]/g, '');

    default:
      return value;
  }
};

// ────────────────────────────────────────────────
// Props:
//   vendor          — the vendor object (from ViewVendor)
//   onClose         — called when modal is cancelled / closed
//   onUpdateSuccess — called after successful update
// ────────────────────────────────────────────────
const UpdateVendor = ({ vendor, onClose, onUpdateSuccess }) => {
  const [formData, setFormData] = useState({
    name:          vendor.name          || '',
    contactPerson: vendor.contactPerson || '',
    mobile:        vendor.mobile        || '',
    altMobile:     vendor.altMobile     || '',
    email:         vendor.email         || '',
    address:       vendor.address       || '',
    gstNo:         vendor.gstNo         || '',
    licenseDetail: vendor.licenseDetail || '',
    status:        vendor.status === 'active' || vendor.statusDesc === 'Active' ? 1 : 2,
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError,   setFormError]   = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [validationMessages, setValidationMessages] = useState({});

  // ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const filteredValue = filterInput(name, value);

    setFormData((prev) => ({ ...prev, [name]: filteredValue }));

    const validationMessage = getLiveValidationMessage(name, filteredValue);
    setValidationMessages((prev) => ({
      ...prev,
      [name]: validationMessage,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Run full validation on all fields before submitting
    const fields = ['name', 'contactPerson', 'mobile', 'altMobile', 'email', 'address', 'gstNo', 'licenseDetail'];
    const newMessages = {};
    let hasError = false;

    fields.forEach((field) => {
      const msg = getLiveValidationMessage(field, formData[field]);
      newMessages[field] = msg;
      if (msg) hasError = true;
    });

    setValidationMessages(newMessages);
    if (hasError) return;

    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);

    try {
      await updateVendor({
        vendorId:      Number(vendor.id),
        clinicId:      vendor.clinicId,
        branchId:      vendor.branchId,
        name:          formData.name.trim(),
        contactPerson: formData.contactPerson.trim(),
        mobile:        formData.mobile.trim(),
        altMobile:     formData.altMobile.trim(),
        email:         formData.email.trim(),
        address:       formData.address.trim(),
        gstNo:         formData.gstNo.trim(),
        licenseDetail: formData.licenseDetail.trim(),
        status:        Number(formData.status),
      });

      setFormSuccess(true);
      setTimeout(() => {
        onUpdateSuccess();
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to update vendor.');
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  return (
    <div className={styles.updateModalOverlay} onClick={onClose}>
      <div className={styles.updateModalContent} onClick={(e) => e.stopPropagation()}>

        {/* ── Gradient Header ── */}
        <div className={styles.updateModalHeader}>
          <div className={styles.updateHeaderContent}>
            <h2>Update Vendor</h2>
            </div>
            <div className={styles.clinicNameone}>
                           <FaClinicMedical size={20} style={{ verticalAlign: 'middle', margin: '6px', marginTop: '0px' }} />  
                             {localStorage.getItem('clinicName') || '—'}
                        </div>
          
          <button onClick={onClose} className={styles.updateCloseBtn}>✕</button>
        </div>

        {/* ── Form Body ── */}
        <form onSubmit={handleSubmit}>
          <div className={styles.updateModalBody}>
            {formError   && <div className={styles.formError}>{formError}</div>}
            {formSuccess  && <div className={styles.formSuccess}>Vendor updated successfully!</div>}

            {/* Basic Information */}
            <div className={styles.formSection}>
              <div className={styles.formSectionHeader}>
                <h3>Basic Information</h3>
              </div>
              <div className={styles.formGrid}>

                <div className={styles.formGroup}>
                  <label>Vendor Name <span className={styles.required}>*</span></label>
                  <input
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter vendor name"
                    disabled={formLoading}
                  />
                  {validationMessages.name && (
                    <span className={styles.validationMsg}>{validationMessages.name}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Contact Person <span className={styles.required}>*</span></label>
                  <input
                    required
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    placeholder="Enter contact person"
                    disabled={formLoading}
                  />
                  {validationMessages.contactPerson && (
                    <span className={styles.validationMsg}>{validationMessages.contactPerson}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Status <span className={styles.required}>*</span></label>
                  <select
                    required
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    disabled={formLoading}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

            {/* Contact Information */}
            <div className={styles.formSection}>
              <div className={styles.formSectionHeader}>
                <h3>Contact Information</h3>
              </div>
              <div className={styles.formGrid}>

                <div className={styles.formGroup}>
                  <label>Mobile <span className={styles.required}>*</span></label>
                  <input
                    required
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="Enter mobile number"
                    maxLength="10"
                    disabled={formLoading}
                  />
                  {validationMessages.mobile && (
                    <span className={styles.validationMsg}>{validationMessages.mobile}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Alternate Mobile</label>
                  <input
                    name="altMobile"
                    value={formData.altMobile}
                    onChange={handleInputChange}
                    placeholder="Enter alternate mobile"
                    maxLength="10"
                    disabled={formLoading}
                  />
                  {validationMessages.altMobile && (
                    <span className={styles.validationMsg}>{validationMessages.altMobile}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Email <span className={styles.required}>*</span></label>
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    disabled={formLoading}
                  />
                  {validationMessages.email && (
                    <span className={styles.validationMsg}>{validationMessages.email}</span>
                  )}
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Address</label>
                  <textarea
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter full address"
                    disabled={formLoading}
                  />
                  {validationMessages.address && (
                    <span className={styles.validationMsg}>{validationMessages.address}</span>
                  )}
                </div>

              </div>
            </div>

            {/* Business Information */}
            <div className={styles.formSection}>
              <div className={styles.formSectionHeader}>
                <h3>Business Information</h3>
              </div>
              <div className={styles.formGrid}>

                <div className={styles.formGroup}>
                  <label>GST Number <span className={styles.required}>*</span></label>
                  <input
                    required
                    name="gstNo"
                    value={formData.gstNo}
                    onChange={handleInputChange}
                    placeholder="e.g. 22AAAAA0000A1Z5"
                    maxLength="15"
                    disabled={formLoading}
                  />
                  {validationMessages.gstNo && (
                    <span className={styles.validationMsg}>{validationMessages.gstNo}</span>
                  )}
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>License Details</label>
                  <textarea
                    name="licenseDetail"
                    rows={3}
                    value={formData.licenseDetail}
                    onChange={handleInputChange}
                    placeholder="Enter license details"
                    disabled={formLoading}
                  />
                  {validationMessages.licenseDetail && (
                    <span className={styles.validationMsg}>{validationMessages.licenseDetail}</span>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className={styles.updateModalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnCancel}
              disabled={formLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.btnSubmit}
              disabled={formLoading}
            >
              {formLoading ? 'Updating...' : 'Update Vendor'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default UpdateVendor;