// src/components/AddPurchaseOrder.jsx
import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { addPurchaseOrder, getVendorList } from '../Api/ApiPharmacy.js';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import styles from './AddPurchaseOrder.module.css';
import { FaClinicMedical } from 'react-icons/fa';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';

// ────────────────────────────────────────────────
const AddPurchaseOrder = ({ isOpen, onClose, onAddSuccess }) => {
  const [formData, setFormData] = useState({
    PODate:   '',
    VendorID: '',
    Discount: '',
  });

  const [vendors, setVendors]             = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [formLoading, setFormLoading]     = useState(false);

  // ── MessagePopup state ──────────────────────────
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopup  = (message, type = 'success') => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });



  // Fetch vendors on open
  useEffect(() => {
    if (isOpen) {
      fetchVendors();
      const today = new Date().toISOString().split('T')[0];
      setFormData((prev) => ({ ...prev, PODate: today }));
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) resetForm();
  }, [isOpen]);

  const fetchVendors = async () => {
    try {
      setLoadingVendors(true);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const data = await getVendorList(clinicId, {
        BranchID: branchId,
        VendorID: 0,
        Status:   1,
      });

      setVendors(data);
    } catch (err) {
      console.error('Fetch vendors error:', err);
      showPopup('Failed to load vendors. Please try again.', 'error');
    } finally {
      setLoadingVendors(false);
    }
  };

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({ PODate: today, VendorID: '', Discount: '' });
    setPopup({ visible: false, message: '', type: 'success' });
  };

  // ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allRequiredFilled = formData.PODate.trim() && formData.VendorID;

    // Guard: show warning popup if required fields missing
    if (!allRequiredFilled) {
      const missing = [];
      if (!formData.PODate.trim())  missing.push('PO Date');
      if (!formData.VendorID)       missing.push('Vendor');
      showPopup(
        `Please fill all required fields: ${missing.join(', ')}.`,
        'warning'
      );
      return;
    }

    setFormLoading(true);

    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const payload = {
        clinicId: clinicId ? Number(clinicId) : 0,
        branchId: branchId ? Number(branchId) : 0,
        PODate:   formData.PODate,
        VendorID: formData.VendorID ? Number(formData.VendorID) : 0,
        Discount: formData.Discount ? parseFloat(formData.Discount) : 0,
      };

      const response = await addPurchaseOrder(payload);

      if (response.success) {
        showPopup('Purchase order created successfully!', 'success');
        setTimeout(() => {
          onAddSuccess?.();
          onClose();
        }, 1500);
      } else {
        showPopup(response.message || 'Failed to create purchase order.', 'error');
      }
    } catch (err) {
      console.error('Add purchase order failed:', err);
      showPopup(err.message || 'Failed to create purchase order.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.modalOverlay} >
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2>Add New Purchase Order</h2>
            <div className={styles.headerRight}>
              <div className={styles.clinicNameone}>
                <FaClinicMedical size={20} style={{ verticalAlign: "middle", margin: "6px", marginTop: "0px" }} />
                {localStorage.getItem("clinicName") || "—"}
              </div>
              <button onClick={onClose} className={styles.modalClose} disabled={formLoading}>
                <FiX />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className={styles.modalBody} noValidate>
            <div className={styles.formGrid}>

              <div className={styles.formGroup}>
                <label>
                  PO Date <span className={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  name="PODate"
                  value={formData.PODate}
                  onChange={handleInputChange}
                  disabled={formLoading}
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
                    name="VendorID"
                    value={formData.VendorID}
                    onChange={handleInputChange}
                    disabled={formLoading}
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
                  disabled={formLoading}
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(48, 178, 181, 0.08)',
                  borderRadius: '8px',
                  border: '1px solid rgba(48, 178, 181, 0.2)',
                  fontSize: '0.85rem',
                  color: '#475569',
                }}>
                  <strong style={{ color: 'var(--accent-end)' }}>Note:</strong> Fields marked with
                  <span style={{ color: '#dc2626', fontWeight: 'bold' }}> * </span>
                  are required. After creating the purchase order, you can add items to it from the details page.
                </div>
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
                disabled={formLoading || loadingVendors}
                className={styles.btnSubmit}
              >
                {formLoading ? 'Creating...' : 'Create Purchase Order'}
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

export default AddPurchaseOrder;