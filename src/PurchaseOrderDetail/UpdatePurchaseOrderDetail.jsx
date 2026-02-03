// src/components/UpdatePurchaseOrderDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { getPurchaseOrderDetailList, updatePurchaseOrderDetail } from '../api/api-pharmacy.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
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
const UpdatePurchaseOrderDetail = () => {
  const navigate = useNavigate();
  const params = useParams();
  
  const detailId = params.detailId || params.id || params.poDetailId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailData, setDetailData] = useState(null);

  const [formData, setFormData] = useState({
    Quantity: '',
    UnitPrice: '',
    Status: 1,
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // ────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const clinicId = Number(localStorage.getItem('clinicID'));
        const branchId = Number(localStorage.getItem('branchID'));

        const detailList = await getPurchaseOrderDetailList(clinicId, {
          BranchID: branchId,
          PODetailID: Number(detailId),
        });

        if (!detailList || detailList.length === 0) {
          throw new Error(`Purchase order item not found with ID: ${detailId}`);
        }

        const detail = detailList[0];
        setDetailData(detail);

        setFormData({
          Quantity: detail.quantity || 0,
          UnitPrice: detail.unitPrice || 0,
          Status: detail.status || 1,
        });

      } catch (err) {
        setError({
          message: err.message || 'Failed to load purchase order item data',
          status: err.status || 500,
        });
      } finally {
        setLoading(false);
      }
    };

    if (detailId) {
      fetchData();
    } else {
      setLoading(false);
      setError({ message: 'No detail ID provided', status: 400 });
    }
  }, [detailId]);

  // ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBack = () => {
    navigate('/purchaseorderdetail-list');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);

    try {
      await updatePurchaseOrderDetail({
        PODetailID: Number(detailId),
        clinicId: detailData.clinicId,
        branchId: detailData.branchId,
        Quantity: Number(formData.Quantity),
        UnitPrice: parseFloat(formData.UnitPrice),
        Status: Number(formData.Status),
      });

      setFormSuccess(true);
      setTimeout(() => {
        navigate('/purchaseorderdetail-list');
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to update purchase order item.');
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  if (error && error?.status >= 400) {
    return <ErrorHandler error={error} />;
  }

  if (loading) {
    return <div className={styles.loading}>Loading item data...</div>;
  }

  if (error || !detailData) {
    return (
      <div className={styles.wrapper}>
        <Header title="Update Purchase Order Item" />
        <div className={styles.error}>
          {error?.message || 'Item not found'}
        </div>
        <div className={styles.toolbar} style={{ justifyContent: 'flex-start', padding: '0 20px' }}>
          <button onClick={handleBack} className={styles.addBtn}>
            <FiArrowLeft size={20} /> Back to List
          </button>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Update Purchase Order Item" />

      {/* Page Header with Back Button */}
      <div className={styles.toolbar} style={{ justifyContent: 'flex-start', padding: '0 20px' }}>
        <button onClick={handleBack} className={styles.addBtn}>
          <FiArrowLeft size={20} /> Back to List
        </button>
      </div>

      {/* Full-Screen Form Container */}
      <div className={styles.tableContainer} style={{ margin: '20px', borderRadius: '17px', padding: '30px' }}>
        <h2 className={styles.header} style={{ 
          fontSize: '1.5rem',
          fontWeight: '800',
          marginBottom: '30px',
        }}>
          Update Item: {detailData.medicineName}
        </h2>

        {/* Display Order Info */}
        <div className={styles.infoSection}>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>PO Number:</span>
              <span className={styles.infoValue}>{detailData.poNumber || '—'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Vendor:</span>
              <span className={styles.infoValue}>{detailData.vendorName || '—'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Medicine:</span>
              <span className={styles.infoValue}>{detailData.medicineName || '—'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Generic Name:</span>
              <span className={styles.infoValue}>{detailData.genericName || '—'}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {formError && <div className={styles.formError}>{formError}</div>}
          {formSuccess && <div className={styles.formSuccess}>Item updated successfully!</div>}

          <div className={styles.formGrid}>
            <h3 className={styles.sectionTitle}>Update Item Details</h3>

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

          {/* Action Buttons */}
          <div className={styles.modalFooter} style={{ marginTop: '40px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={handleBack} className={styles.btnCancel}>
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