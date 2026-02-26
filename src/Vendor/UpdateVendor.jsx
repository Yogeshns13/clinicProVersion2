// src/components/UpdateVendor.jsx
import React, { useState } from 'react';
import { updateVendor } from '../api/api-pharmacy.js';
import styles from './UpdateVendor.module.css';

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
];

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

  // ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
            <span className={styles.updateHeaderSub}>{vendor.name}</span>
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
                    disabled={formLoading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Alternate Mobile</label>
                  <input
                    name="altMobile"
                    value={formData.altMobile}
                    onChange={handleInputChange}
                    placeholder="Enter alternate mobile"
                    disabled={formLoading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    disabled={formLoading}
                  />
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
                  <label>GST Number</label>
                  <input
                    name="gstNo"
                    value={formData.gstNo}
                    onChange={handleInputChange}
                    placeholder="e.g. 29ABCDE1234F1Z5"
                    disabled={formLoading}
                  />
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