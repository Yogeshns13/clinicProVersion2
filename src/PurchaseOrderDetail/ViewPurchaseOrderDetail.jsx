// src/components/ViewPurchaseOrderDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { getPurchaseOrderDetailList, deletePurchaseOrderDetail } from '../api/api-pharmacy.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './ViewPurchaseOrderDetail.module.css';

// ────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { id: 1, label: 'Ordered' },
  { id: 2, label: 'Partially Received' },
  { id: 3, label: 'Fully Received' },
  { id: 4, label: 'Cancelled' },
  { id: 5, label: 'Rejected' },
];

// ────────────────────────────────────────────────
const ViewPurchaseOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ────────────────────────────────────────────────
  useEffect(() => {
    const fetchDetailData = async () => {
      try {
        setLoading(true);
        setError(null);

        const clinicId = Number(localStorage.getItem('clinicID'));
        const branchId = Number(localStorage.getItem('branchID'));

        const data = await getPurchaseOrderDetailList(clinicId, {
          PODetailID: Number(id),
          BranchID: branchId
        });

        if (data && data.length > 0) {
          setDetail(data[0]);
        } else {
          setError({ message: 'Purchase order item not found' });
        }
      } catch (err) {
        console.error('fetchDetailData error:', err);
        setError(
          err?.status >= 400 || err?.code >= 400
            ? err
            : { message: err.message || 'Failed to load purchase order item details' }
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDetailData();
    }
  }, [id]);

  // ────────────────────────────────────────────────
  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '—';
    return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusClass = (status) => {
    if (status === 1) return 'ordered';
    if (status === 2) return 'partiallyReceived';
    if (status === 3) return 'fullyReceived';
    if (status === 4) return 'cancelled';
    if (status === 5) return 'rejected';
    return 'ordered';
  };

  const getStatusLabel = (detail) => {
    if (detail.statusDesc) return detail.statusDesc.toUpperCase();
    const statusOption = STATUS_OPTIONS.find(s => s.id === detail.status);
    return statusOption ? statusOption.label.toUpperCase() : 'UNKNOWN';
  };

  // ────────────────────────────────────────────────
  // Handlers
  const handleUpdateClick = () => {
    navigate(`/update-purchaseorderdetail/${detail.id}`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      setError(null);
      await deletePurchaseOrderDetail(detail.id);
      navigate('/purchaseorderdetail-list');
    } catch (err) {
      console.error('Delete item failed:', err);
      setError({ message: err.message || 'Failed to delete item.' });
    }
  };

  const handleBack = () => {
    navigate('/purchaseorderdetail-list');
  };

  // ────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.loading}>Loading item details...</div>;

  if (error) return <div className={styles.error}>Error: {error.message || error}</div>;

  if (!detail) return <div className={styles.error}>Item not found</div>;

  // ────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Purchase Order Item Details" />

      {/* Back Button */}
      <div className={styles.toolbar}>
        <button onClick={handleBack} className={styles.backBtn}>
          <FiArrowLeft size={20} /> Back to List
        </button>
      </div>

      {/* Detail Card */}
      <div className={styles.detailsCard}>
        
        {/* Header Section */}
        <div className={styles.cardHeader}>
          <div className={styles.headerInfo}>
            <h2>
              {detail.medicineName || 'N/A'}
            </h2>
            <p className={styles.subtitle}>
              Generic: {detail.genericName || '—'} | Manufacturer: {detail.manufacturer || '—'}
            </p>
            <span className={`${styles.statusBadge} ${styles.large} ${styles[getStatusClass(detail.status)]}`}>
              {getStatusLabel(detail)}
            </span>
          </div>
        </div>

        {/* Details Body */}
        <div className={styles.cardBody}>
          
          {/* Section 1: Basic Information */}
          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>Basic Information</h3>

            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Detail ID</span>
                <span className={styles.detailValue}>{detail.id || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Medicine Name</span>
                <span className={styles.detailValue}>{detail.medicineName || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Generic Name</span>
                <span className={styles.detailValue}>{detail.genericName || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Status</span>
                <span className={`${styles.statusBadge} ${styles[getStatusClass(detail.status)]}`}>
                  {getStatusLabel(detail)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Purchase Order Information */}
          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>Purchase Order Information</h3>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>PO ID</span>
                <span className={styles.detailValue}>{detail.poId || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>PO Number</span>
                <span className={styles.detailValue}>{detail.poNumber || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>PO Date</span>
                <span className={styles.detailValue}>{formatDate(detail.poDate)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Vendor Name</span>
                <span className={styles.detailValue}>{detail.vendorName || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Vendor Mobile</span>
                <span className={styles.detailValue}>{detail.vendorMobile || '—'}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Medicine Details */}
          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>Medicine Details</h3>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Medicine ID</span>
                <span className={styles.detailValue}>{detail.medicineId || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Manufacturer</span>
                <span className={styles.detailValue}>{detail.manufacturer || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>HSN Code</span>
                <span className={styles.detailValue}>{detail.hsnCode || '—'}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Quantity & Pricing */}
          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>Quantity & Pricing</h3>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Quantity</span>
                <span className={`${styles.detailValue} ${styles.quantityValue}`}>
                  {detail.quantity || 0}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Unit Price</span>
                <span className={`${styles.detailValue} ${styles.amountValue}`}>
                  {formatAmount(detail.unitPrice)}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Amount</span>
                <span className={`${styles.detailValue} ${styles.amountValue}`}>
                  {formatAmount(detail.amount)}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>CGST Amount</span>
                <span className={`${styles.detailValue} ${styles.amountValue}`}>
                  {formatAmount(detail.cgstAmount)}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>SGST Amount</span>
                <span className={`${styles.detailValue} ${styles.amountValue}`}>
                  {formatAmount(detail.sgstAmount)}
                </span>
              </div>
              <div className={`${styles.detailItem} ${styles.highlight}`}>
                <span className={styles.detailLabel}>Total Line Amount</span>
                <span className={`${styles.detailValue} ${styles.amountValue} ${styles.totalAmount}`}>
                  {formatAmount(detail.totalLineAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Clinic Information */}
          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>Clinic Information</h3>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Clinic Name</span>
                <span className={styles.detailValue}>{detail.clinicName || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Branch Name</span>
                <span className={styles.detailValue}>{detail.branchName || '—'}</span>
              </div>
            </div>
          </div>

          {/* Section 6: Record Information */}
          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>Record Information</h3>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Date Created</span>
                <span className={styles.detailValue}>{formatDate(detail.dateCreated)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Last Modified</span>
                <span className={styles.detailValue}>{formatDate(detail.dateModified)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className={styles.cardFooter}>
          <button onClick={handleDelete} className={`${styles.btnHold} ${styles.btnDelete}`}>
            Delete Item
          </button>
          <button onClick={handleUpdateClick} className={styles.btnUpdate}>
            Update Item
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewPurchaseOrderDetail;