// src/components/AddPurchaseOrderDetail.jsx
import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { addPurchaseOrderDetail, getPurchaseOrderList } from '../api/api-pharmacy.js';
import styles from './AddPurchaseOrderDetail.module.css';

// ────────────────────────────────────────────────
const AddPurchaseOrderDetail = ({ isOpen, onClose, onAddSuccess }) => {
  const [formData, setFormData] = useState({
    POID: '',
    MedicineID: '',
    Quantity: '',
    UnitPrice: '',
  });

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loadingPOs, setLoadingPOs] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Fetch POs on mount
  useEffect(() => {
    if (isOpen) {
      fetchPurchaseOrders();
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const fetchPurchaseOrders = async () => {
    try {
      setLoadingPOs(true);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const data = await getPurchaseOrderList(clinicId, {
        BranchID: branchId,
        POID: 0,
        Status: 1, // Only active POs
      });

      setPurchaseOrders(data);
    } catch (err) {
      console.error('Fetch purchase orders error:', err);
      setFormError('Failed to load purchase orders. Please try again.');
    } finally {
      setLoadingPOs(false);
    }
  };

  const resetForm = () => {
    setFormData({
      POID: '',
      MedicineID: '',
      Quantity: '',
      UnitPrice: '',
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
        POID: formData.POID ? Number(formData.POID) : 0,
        MedicineID: formData.MedicineID ? Number(formData.MedicineID) : 0,
        Quantity: formData.Quantity ? Number(formData.Quantity) : 0,
        UnitPrice: formData.UnitPrice ? parseFloat(formData.UnitPrice) : 0,
      };

      const response = await addPurchaseOrderDetail(payload);

      if (response.success) {
        setFormSuccess(true);
        setTimeout(() => {
          onAddSuccess?.();
          onClose();
        }, 1500);
      } else {
        setFormError(response.message || 'Failed to add purchase order item.');
      }
    } catch (err) {
      console.error('Add purchase order detail failed:', err);
      setFormError(err.message || 'Failed to add purchase order item.');
    } finally {
      setFormLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Add Item to Purchase Order</h2>
          <button onClick={onClose} className={styles.modalClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {formError && <div className={styles.formError}>{formError}</div>}
          {formSuccess && <div className={styles.formSuccess}>Item added successfully!</div>}

          <div className={styles.formGrid}>
            {/* Purchase Order Selection */}
            <h3 className={styles.formSectionTitle}>Order Information</h3>

            <div className={styles.formGroup}>
              <label>
                Purchase Order <span className={styles.required}>*</span>
              </label>
              {loadingPOs ? (
                <select disabled className={styles.loading}>
                  <option>Loading purchase orders...</option>
                </select>
              ) : (
                <select
                  required
                  name="POID"
                  value={formData.POID}
                  onChange={handleInputChange}
                >
                  <option value="">Select a purchase order</option>
                  {purchaseOrders.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.poNumber} - {po.vendorName} ({new Date(po.poDate).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Medicine Selection */}
            <h3 className={styles.formSectionTitle}>Item Details</h3>

            <div className={styles.formGroup}>
              <label>
                Medicine ID <span className={styles.required}>*</span>
              </label>
              <input
                required
                type="number"
                name="MedicineID"
                value={formData.MedicineID}
                onChange={handleInputChange}
                placeholder="Enter medicine ID"
                min="1"
                step="1"
              />
              <small style={{ 
                display: 'block', 
                marginTop: '4px', 
                color: '#64748b', 
                fontSize: '0.8rem' 
              }}>
                Enter the Medicine ID from your medicine list
              </small>
            </div>

            <div className={styles.formGroup}>
              <label>
                Quantity <span className={styles.required}>*</span>
              </label>
              <input
                required
                type="number"
                name="Quantity"
                value={formData.Quantity}
                onChange={handleInputChange}
                placeholder="Enter quantity"
                min="1"
                step="1"
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                Unit Price (₹) <span className={styles.required}>*</span>
              </label>
              <input
                required
                type="number"
                name="UnitPrice"
                value={formData.UnitPrice}
                onChange={handleInputChange}
                placeholder="Enter unit price"
                min="0.01"
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
                are required. Total amount will be calculated automatically.
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.btnCancel}>
              Cancel
            </button>
            <button type="submit" disabled={formLoading || loadingPOs} className={styles.btnSubmit}>
              {formLoading ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPurchaseOrderDetail;