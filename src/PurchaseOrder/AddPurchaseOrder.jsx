// src/components/AddPurchaseOrder.jsx
import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { addPurchaseOrder } from '../Api/ApiPharmacy.js';
import { getVendorList } from '../Api/ApiPharmacy.js';
import styles from './AddPurchaseOrder.module.css';

// ────────────────────────────────────────────────
const AddPurchaseOrder = ({ isOpen, onClose, onAddSuccess }) => {
  const [formData, setFormData] = useState({
    PODate: '',
    VendorID: '',
    Discount: '',
  });

  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Fetch vendors on mount
  useEffect(() => {
    if (isOpen) {
      fetchVendors();
      // Set today's date
      const today = new Date().toISOString().split('T')[0];
      setFormData((prev) => ({ ...prev, PODate: today }));
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const fetchVendors = async () => {
    try {
      setLoadingVendors(true);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const data = await getVendorList(clinicId, {
        BranchID: branchId,
        VendorID: 0,
        Status: 1, // Only active vendors
      });

      setVendors(data);
    } catch (err) {
      console.error('Fetch vendors error:', err);
      setFormError('Failed to load vendors. Please try again.');
    } finally {
      setLoadingVendors(false);
    }
  };

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      PODate: today,
      VendorID: '',
      Discount: '',
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
        PODate: formData.PODate,
        VendorID: formData.VendorID ? Number(formData.VendorID) : 0,
        Discount: formData.Discount ? parseFloat(formData.Discount) : 0,
      };

      const response = await addPurchaseOrder(payload);

      if (response.success) {
        setFormSuccess(true);
        setTimeout(() => {
          onAddSuccess?.();
          onClose();
        }, 1500);
      } else {
        setFormError(response.message || 'Failed to create purchase order.');
      }
    } catch (err) {
      console.error('Add purchase order failed:', err);
      setFormError(err.message || 'Failed to create purchase order.');
    } finally {
      setFormLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Add New Purchase Order</h2>
          <button onClick={onClose} className={styles.modalClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {formError && <div className={styles.formError}>{formError}</div>}
          {formSuccess && <div className={styles.formSuccess}>Purchase order created successfully!</div>}

          <div className={styles.formGrid}>

            <div className={styles.formGroup}>
              <label>
                PO Date <span className={styles.required}>*</span>
              </label>
              <input
                required
                type="date"
                name="PODate"
                value={formData.PODate}
                onChange={handleInputChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                Vendor <span className={styles.required}>*</span>
              </label>
              {loadingVendors ? (
                <select disabled className={styles.loading}>
                  <option>Loading vendors...</option>
                </select>
              ) : (
                <select
                  required
                  name="VendorID"
                  value={formData.VendorID}
                  onChange={handleInputChange}
                >
                  <option value="">Select a vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>Discount (%)</label>
              <input
                type="number"
                name="Discount"
                value={formData.Discount}
                onChange={handleInputChange}
                placeholder="Enter discount percentage"
                min="0"
                max="100"
                step="0.01"
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <div style={{ 
                padding: '12px', 
                backgroundColor: 'rgba(48, 178, 181, 0.08)',
                borderRadius: '8px',
                border: '1px solid rgba(48, 178, 181, 0.2)',
                fontSize: '0.85rem',
                color: '#475569'
              }}>
                <strong style={{ color: 'var(--accent-end)' }}>Note:</strong> Fields marked with 
                <span style={{ color: '#dc2626', fontWeight: 'bold' }}> * </span> 
                are required. After creating the purchase order, you can add items to it from the details page.
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.btnCancel}>
              Cancel
            </button>
            <button type="submit" disabled={formLoading || loadingVendors} className={styles.btnSubmit}>
              {formLoading ? 'Creating...' : 'Create Purchase Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPurchaseOrder;