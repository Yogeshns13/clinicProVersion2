// src/components/AddVendor.jsx
import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { addVendor } from '../api/api-pharmacy.js';
import styles from './AddVendor.module.css';

// ────────────────────────────────────────────────
const AddVendor = ({ isOpen, onClose, onAddSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    mobile: '',
    altMobile: '',
    email: '',
    address: '',
    gstNo: '',
    licenseDetail: '',
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      contactPerson: '',
      mobile: '',
      altMobile: '',
      email: '',
      address: '',
      gstNo: '',
      licenseDetail: '',
    });
    setFormError('');
    setFormSuccess(false);
  };

  // ────────────────────────────────────────────────
  // Form Handlers
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
      const clinicId = localStorage.getItem('clinicID');
      const branchId = localStorage.getItem('branchID');

      const payload = {
        clinicId: clinicId ? Number(clinicId) : 0,
        branchId: branchId ? Number(branchId) : 0,
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim(),
        mobile: formData.mobile.trim(),
        altMobile: formData.altMobile.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        gstNo: formData.gstNo.trim(),
        licenseDetail: formData.licenseDetail.trim(),
      };

      await addVendor(payload);

      setFormSuccess(true);
      setTimeout(() => {
        onAddSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Add vendor failed:', err);
      setFormError(err.message || 'Failed to add vendor.');
    } finally {
      setFormLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Add New Vendor</h2>
          <button onClick={onClose} className={styles.modalClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {formError && <div className={styles.formError}>{formError}</div>}
          {formSuccess && <div className={styles.formSuccess}>Vendor added successfully!</div>}

          <div className={styles.formGrid}>
            {/* Basic Information */}
            <h3 className={styles.formSectionTitle}>Basic Information</h3>

            <div className={styles.formGroup}>
              <label>
                Vendor Name <span className={styles.required}>*</span>
              </label>
              <input
                required
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter vendor name"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Contact Person</label>
              <input
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                placeholder="Enter contact person name"
              />
            </div>

            {/* Contact Information */}
            <h3 className={styles.formSectionTitle}>Contact Information</h3>

            <div className={styles.formGroup}>
              <label>
                Mobile <span className={styles.required}>*</span>
              </label>
              <input
                required
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                placeholder="Enter mobile number"
                maxLength={10}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Alternate Mobile</label>
              <input
                name="altMobile"
                value={formData.altMobile}
                onChange={handleInputChange}
                placeholder="Enter alternate mobile"
                maxLength={10}
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
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label>Address</label>
              <textarea
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter complete address"
              />
            </div>

            {/* Business Information */}
            <h3 className={styles.formSectionTitle}>Business Information</h3>

            <div className={styles.formGroup}>
              <label>GST Number</label>
              <input
                name="gstNo"
                value={formData.gstNo}
                onChange={handleInputChange}
                placeholder="Enter GST number"
              />
            </div>

            <div className={styles.formGroup}>
              <label>License Detail</label>
              <input
                name="licenseDetail"
                value={formData.licenseDetail}
                onChange={handleInputChange}
                placeholder="Enter license details"
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.btnCancel}>
              Cancel
            </button>
            <button type="submit" disabled={formLoading} className={styles.btnSubmit}>
              {formLoading ? 'Saving...' : 'Save Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVendor;