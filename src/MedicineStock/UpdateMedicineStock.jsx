// src/components/UpdateMedicineStock.jsx
import React, { useState } from 'react';
import { FiSave } from 'react-icons/fi';
import { updateMedicineStock } from '../Api/ApiPharmacy.js';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import styles from './UpdateMedicineStock.module.css';
import { FaClinicMedical } from 'react-icons/fa';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';

const UpdateMedicineStock = ({ stock, onClose, onUpdateSuccess }) => {
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try { return new Date(dateString).toISOString().split('T')[0]; }
    catch { return dateString; }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try { return new Date(dateString).toLocaleDateString('en-GB'); }
    catch { return dateString; }
  };

  const formatCurrency = (value) => {
    if (value == null) return '—';
    return `₹${Number(value).toFixed(2)}`;
  };

  // ── Only 4 editable fields ──
  const [formData, setFormData] = useState({
    BatchNo:       stock.batchNo       || '',
    ExpiryDate:    formatDateForInput(stock.expiryDate),
    QuantityIn:    stock.quantityIn    ?? '',
    PurchasePrice: stock.purchasePrice || '',
  });

  const [formLoading, setFormLoading] = useState(false);

  // ── Button cooldown state (2-sec disable after click) ──────────────────────
  const [btnCooldown, setBtnCooldown] = useState({});
  const triggerCooldown = (key) => {
    setBtnCooldown((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setBtnCooldown((prev) => ({ ...prev, [key]: false })), 2000);
  };

  // ── MessagePopup state ──────────────────────────────────────────────────────
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopup  = (message, type = 'success') => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });

  // ── Submit button gating ────────────────────────────────────────────────────
  // Enabled only when all 4 required fields are filled
  const allRequiredFilled =
    formData.BatchNo.trim().length > 0 &&
    formData.ExpiryDate.trim().length > 0 &&
    String(formData.QuantityIn).trim().length > 0 &&
    String(formData.PurchasePrice).trim().length > 0;

  // ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Guard: show warning popup listing every missing required field
    if (!allRequiredFilled) {
      const missing = [];
      if (!formData.BatchNo.trim())                   missing.push('Batch Number');
      if (!formData.ExpiryDate.trim())                missing.push('Expiry Date');
      if (!String(formData.QuantityIn).trim())        missing.push('Quantity In');
      if (!String(formData.PurchasePrice).trim())     missing.push('Purchase Price');
      showPopup(
        `Please fill all required fields: ${missing.join(', ')}.`,
        'warning'
      );
      return;
    }

    triggerCooldown('submit');
    setFormLoading(true);

    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      await updateMedicineStock({
        StockID:       Number(stock.id),
        clinicId,
        branchId,
        BatchNo:       formData.BatchNo.trim(),
        ExpiryDate:    formData.ExpiryDate.trim(),
        QuantityIn:    Number(formData.QuantityIn),
        PurchasePrice: Number(formData.PurchasePrice),
      });

      // Success popup (auto-closes in 1 s), then trigger parent callback
      showPopup('Medicine stock updated successfully!', 'success');
      setTimeout(() => { onUpdateSuccess(); }, 1500);
    } catch (err) {
      showPopup(err.message || 'Failed to update medicine stock.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  return (
    <>
      <div className={styles.updateModalOverlay} >
        <div className={styles.updateModalContent} onClick={(e) => e.stopPropagation()}>

          {/* ── Gradient Header ── */}
          <div className={styles.updateModalHeader}>
            <div className={styles.updateHeaderContent}>
              <h2>Update Medicine Stock</h2>
            </div>
            <div className={styles.clinicNameone}>
              <FaClinicMedical size={20} style={{ verticalAlign: 'middle', margin: '6px', marginTop: '0px' }} />
              {localStorage.getItem('clinicName') || '—'}
            </div>
            <button
              type="button"
              onClick={onClose}
              className={styles.updateCloseBtn}
              disabled={formLoading}
            >
              ✕
            </button>
          </div>

          <form className={styles.updateForm} onSubmit={handleSubmit} noValidate>

            {/* ── Scrollable Body ── */}
            <div className={styles.updateModalBody}>

              {/* ── Read-only info cards ── */}
              <div className={styles.infoSection}>

                <div className={styles.infoCard}>
                  <div className={styles.infoHeader}><h3>Medicine Information</h3></div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Medicine Name</span>
                      <span className={styles.infoValue}>{stock.medicineName || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Generic Name</span>
                      <span className={styles.infoValue}>{stock.genericName || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Manufacturer</span>
                      <span className={styles.infoValue}>{stock.manufacturer || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>HSN Code</span>
                      <span className={styles.infoValue}>{stock.hsnCode || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.infoCard}>
                  <div className={styles.infoHeader}><h3>Current Stock Status</h3></div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Quantity Out</span>
                      <span className={styles.infoValue}>{stock.quantityOut ?? 0}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Balance Quantity</span>
                      <span className={`${styles.infoValue} ${styles.infoAmountGreen}`}>{stock.balanceQuantity ?? 0}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Average Price</span>
                      <span className={`${styles.infoValue} ${styles.infoAmountTotal}`}>{formatCurrency(stock.averagePrice)}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Days to Expiry</span>
                      <span className={styles.infoValue}>
                        {stock.daysToExpiry != null
                          ? stock.daysToExpiry >= 0
                            ? `${stock.daysToExpiry} days`
                            : `Expired ${Math.abs(stock.daysToExpiry)} days ago`
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* ── 4 editable fields ── */}
              <div className={styles.formSection}>
                <div className={styles.formSectionHeader}>
                  <h3>Editable Fields</h3>
                </div>
                <div className={styles.formGrid}>

                  <div className={styles.formGroup}>
                    <label>Batch Number <span className={styles.required}>*</span></label>
                    <input
                      name="BatchNo"
                      value={formData.BatchNo}
                      onChange={handleInputChange}
                      placeholder="e.g., BT-202512A"
                      disabled={formLoading}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Expiry Date <span className={styles.required}>*</span></label>
                    <input
                      type="date"
                      name="ExpiryDate"
                      value={formData.ExpiryDate}
                      onChange={handleInputChange}
                      disabled={formLoading}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Quantity In <span className={styles.required}>*</span></label>
                    <input
                      type="number"
                      name="QuantityIn"
                      value={formData.QuantityIn}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      disabled={formLoading}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Purchase Price <span className={styles.required}>*</span></label>
                    <input
                      type="number"
                      step="0.01"
                      name="PurchasePrice"
                      value={formData.PurchasePrice}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      disabled={formLoading}
                    />
                  </div>

                </div>
              </div>

            </div>
            {/* end scrollable body */}

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
                disabled={formLoading || !allRequiredFilled || !!btnCooldown['submit']}
                title={!allRequiredFilled ? 'Please fill all required fields to enable this button' : ''}
              >
                <FiSave size={15} />
                {formLoading ? 'Updating...' : 'Update Stock'}
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* ── MessagePopup (rendered outside modal so z-index is never blocked) ── */}
      <MessagePopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
      />
    </>
  );
};

export default UpdateMedicineStock;