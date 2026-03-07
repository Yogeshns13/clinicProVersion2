// src/components/UpdatePurchaseOrderDetail.jsx
import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { updatePurchaseOrderDetail } from '../Api/ApiPharmacy.js';
import styles from './UpdatePurchaseOrderDetail.module.css';

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { id: 1, label: 'Ordered' },
  { id: 2, label: 'Partially Received' },
  { id: 3, label: 'Fully Received' },
  { id: 4, label: 'Cancelled' },
  { id: 5, label: 'Rejected' },
];

// ────────────────────────────────────────────────
const UpdatePurchaseOrderDetail = ({ isOpen, onClose, onUpdateSuccess, item }) => {
  const [formData, setFormData] = useState({
    Quantity: '',
    UnitPrice: '',
    Status: 1,
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // ────────────────────────────────────────────────
  // Load item data into form
  useEffect(() => {
    if (item) {
      setFormData({
        Quantity: item.quantity || 0,
        UnitPrice: item.unitPrice || 0,
        Status: item.status || 1,
      });
    }
  }, [item]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormError('');
      setFormSuccess(false);
    }
  }, [isOpen]);

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
      await updatePurchaseOrderDetail({
        PODetailID: item.id,
        clinicId: item.clinicId,
        branchId: item.branchId,
        Quantity: Number(formData.Quantity),
        UnitPrice: parseFloat(formData.UnitPrice),
        Status: Number(formData.Status),
      });

      setFormSuccess(true);
      setTimeout(() => {
        onUpdateSuccess?.();
      }, 1500);
    } catch (err) {
      console.error('Update purchase order detail failed:', err);
      setFormError(err.message || 'Failed to update purchase order item.');
    } finally {
      setFormLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Update Item: {item.medicineName}</h2>
          <button onClick={onClose} className={styles.modalClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {formError && <div className={styles.formError}>{formError}</div>}
          {formSuccess && <div className={styles.formSuccess}>Item updated successfully!</div>}

          {/* Item Info Banner */}
          <div className={styles.itemInfoBanner}>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Medicine:</span>
                <span className={styles.infoValue}>{item.medicineName || '—'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Generic:</span>
                <span className={styles.infoValue}>{item.genericName || '—'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Manufacturer:</span>
                <span className={styles.infoValue}>{item.manufacturer || '—'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>PO Number:</span>
                <span className={styles.infoValue}>{item.poNumber || '—'}</span>
              </div>
            </div>
          </div>

          <div className={styles.formGrid}>
            <h3 className={styles.formSectionTitle}>Update Item Details</h3>

            <div className={styles.formGroup}>
              <label>Quantity <span className={styles.required}>*</span></label>
              <input 
                required 
                type="number"
                name="Quantity" 
                value={formData.Quantity} 
                onChange={handleInputChange}
                min="1"
                step="1"
                placeholder="Enter quantity"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Unit Price (₹) <span className={styles.required}>*</span></label>
              <input 
                required 
                type="number"
                name="UnitPrice" 
                value={formData.UnitPrice} 
                onChange={handleInputChange}
                min="0.01"
                step="0.01"
                placeholder="Enter unit price"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Status <span className={styles.required}>*</span></label>
              <select 
                required 
                name="Status" 
                value={formData.Status} 
                onChange={handleInputChange}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.id} value={status.id}>{status.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.btnCancel}>
              Cancel
            </button>
            <button type="submit" disabled={formLoading} className={styles.btnSubmit}>
              {formLoading ? 'Updating...' : 'Update Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdatePurchaseOrderDetail;