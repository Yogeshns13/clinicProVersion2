// src/components/UpdatePurchaseOrderDetail.jsx
import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { updatePurchaseOrderDetail } from '../Api/ApiPharmacy.js';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import styles from './UpdatePurchaseOrderDetail.module.css';
import { FaClinicMedical } from 'react-icons/fa';

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { id: 1, label: 'Ordered'            },
  { id: 2, label: 'Partially Received' },
  { id: 3, label: 'Fully Received'     },
  { id: 4, label: 'Cancelled'          },
  { id: 5, label: 'Rejected'           },
];

// ────────────────────────────────────────────────
const UpdatePurchaseOrderDetail = ({ isOpen, onClose, onUpdateSuccess, item }) => {
  const [formData, setFormData] = useState({
    Quantity:  '',
    UnitPrice: '',
    Status:    1,
  });

  const [formLoading, setFormLoading] = useState(false);

  // ── Button cooldown state (2-sec disable after click) ──────────────────────
  const [btnCooldown, setBtnCooldown] = useState({});
  const triggerCooldown = (key) => {
    setBtnCooldown((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setBtnCooldown((prev) => ({ ...prev, [key]: false })), 2000);
  };

  // ── MessagePopup state ──────────────────────────
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopup  = (message, type = 'success') => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });

  // ── Submit button gating ────────────────────────
  // Enabled only when Quantity and UnitPrice are filled
  const allRequiredFilled =
    String(formData.Quantity).trim().length > 0 &&
    String(formData.UnitPrice).trim().length > 0;

  // ────────────────────────────────────────────────
  // Load item data into form
  useEffect(() => {
    if (item) {
      setFormData({
        Quantity:  item.quantity  || 0,
        UnitPrice: item.unitPrice || 0,
        Status:    item.status    || 1,
      });
    }
  }, [item]);

  // Reset popup when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPopup({ visible: false, message: '', type: 'success' });
    }
  }, [isOpen]);

  // ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Guard: show warning popup if required fields missing
    if (!allRequiredFilled) {
      const missing = [];
      if (!String(formData.Quantity).trim())  missing.push('Quantity');
      if (!String(formData.UnitPrice).trim()) missing.push('Unit Price');
      showPopup(
        `Please fill all required fields: ${missing.join(', ')}.`,
        'warning'
      );
      return;
    }

    triggerCooldown('submit');
    setFormLoading(true);

    try {
      await updatePurchaseOrderDetail({
        PODetailID: item.id,
        clinicId:   item.clinicId,
        branchId:   item.branchId,
        Quantity:   Number(formData.Quantity),
        UnitPrice:  parseFloat(formData.UnitPrice),
        Status:     Number(formData.Status),
      });

      showPopup('Item updated successfully!', 'success');
      setTimeout(() => {
        onUpdateSuccess?.();
      }, 1500);
    } catch (err) {
      console.error('Update purchase order detail failed:', err);
      showPopup(err.message || 'Failed to update purchase order item.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2>Update Item: {item.medicineName}</h2>
            <div className={styles.clinicNameone}>
              <FaClinicMedical size={20} style={{ verticalAlign: "middle", margin: "6px", marginTop: "0px" }} />
              {localStorage.getItem("clinicName") || "—"}
            </div>
            <button onClick={onClose} className={styles.modalClose} disabled={formLoading}>
              <FiX />
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles.modalBody} noValidate>

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
                  type="number"
                  name="Quantity"
                  value={formData.Quantity}
                  onChange={handleInputChange}
                  min="1"
                  step="1"
                  placeholder="Enter quantity"
                  disabled={formLoading}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Unit Price (₹) <span className={styles.required}>*</span></label>
                <input
                  type="number"
                  name="UnitPrice"
                  value={formData.UnitPrice}
                  onChange={handleInputChange}
                  min="0.01"
                  step="0.01"
                  placeholder="Enter unit price"
                  disabled={formLoading}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Status <span className={styles.required}>*</span></label>
                <select
                  name="Status"
                  value={formData.Status}
                  onChange={handleInputChange}
                  disabled={formLoading}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.id} value={status.id}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.modalFooter}>
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
                disabled={formLoading || !!btnCooldown['submit']}
                className={styles.btnSubmit}
                title={!allRequiredFilled ? 'Please fill all required fields to enable this button' : ''}
              >
                {formLoading ? 'Updating...' : 'Update Item'}
              </button>
            </div>
          </form>
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

export default UpdatePurchaseOrderDetail;