// src/components/ViewPurchaseOrder.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { getPurchaseOrderList, deletePurchaseOrder } from '../api/api-pharmacy.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import PurchaseOrderItems from './PurchaseOrderItems.jsx';
import styles from './ViewPurchaseOrder.module.css';

// ────────────────────────────────────────────────
const ViewPurchaseOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'items'

  // ────────────────────────────────────────────────
  // Fetch Purchase Order Details
  useEffect(() => {
    const fetchPurchaseOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const clinicId = Number(localStorage.getItem('clinicID'));
        const branchId = Number(localStorage.getItem('branchID'));

        const data = await getPurchaseOrderList(clinicId, {
          POID: Number(id),
          BranchID: branchId
        });

        if (data && data.length > 0) {
          setPurchaseOrder(data[0]);
        } else {
          setError({ message: 'Purchase order not found' });
        }
      } catch (err) {
        console.error('fetchPurchaseOrderDetails error:', err);
        setError(
          err?.status >= 400 || err?.code >= 400
            ? err
            : { message: err.message || 'Failed to load purchase order details' }
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPurchaseOrderDetails();
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
    if (status === 1) return 'draft';
    if (status === 2) return 'sent';
    if (status === 3) return 'confirmed';
    if (status === 4) return 'partiallyReceived';
    if (status === 5) return 'fullyReceived';
    if (status === 6) return 'cancelled';
    return 'draft';
  };

  const getStatusLabel = (status) => {
    if (status === 1) return 'Draft';
    if (status === 2) return 'Sent';
    if (status === 3) return 'Confirmed';
    if (status === 4) return 'Partially Received';
    if (status === 5) return 'Fully Received';
    if (status === 6) return 'Cancelled';
    return 'Unknown';
  };

  // ────────────────────────────────────────────────
  // Handlers
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this purchase order?')) {
      return;
    }

    try {
      setError(null);
      await deletePurchaseOrder(purchaseOrder.id);
      navigate('/purchaseorder-list');
    } catch (err) {
      console.error('Delete purchase order failed:', err);
      setError({ message: err.message || 'Failed to delete purchase order.' });
    }
  };

  const handleBack = () => {
    navigate('/purchaseorder-list');
  };

  // ────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.loading}>Loading purchase order details...</div>;

  if (error) return <div className={styles.error}>Error: {error.message || error}</div>;

  if (!purchaseOrder) return <div className={styles.error}>Purchase order not found</div>;

  // ────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Purchase Order Details" />

      {/* Header Section */}
      <div className={styles.pageHeader}>
        <div className={styles.headerTop}>
          <button onClick={handleBack} className={styles.backBtn}>
            <FiArrowLeft size={20} /> Back to List
          </button>
          <div className={styles.headerActions}>
            <button onClick={handleDelete} className={styles.deleteBtn}>
              <FiTrash2 size={18} /> Delete
            </button>
          </div>
        </div>

        {/* PO Info Banner */}
        <div className={styles.infoBanner}>
          <div className={styles.bannerLeft}>
            <h1 className={styles.poNumber}>{purchaseOrder.poNumber || 'N/A'}</h1>
            <div className={styles.poMeta}>
              <span className={styles.metaItem}>
                <strong>Vendor:</strong> {purchaseOrder.vendorName || '—'}
              </span>
              <span className={styles.metaDivider}>|</span>
              <span className={styles.metaItem}>
                <strong>Date:</strong> {formatDate(purchaseOrder.poDate)}
              </span>
              <span className={styles.metaDivider}>|</span>
              <span className={styles.metaItem}>
                <strong>Contact:</strong> {purchaseOrder.contactPerson || '—'}
              </span>
            </div>
          </div>
          <div className={styles.bannerRight}>
            <span className={`${styles.statusBadge} ${styles[getStatusClass(purchaseOrder.status)]}`}>
              {getStatusLabel(purchaseOrder.status)}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'details' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Order Details
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'items' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('items')}
          >
            Order Items
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'details' ? (
          // ORDER DETAILS TAB
          <div className={styles.detailsCard}>
            <div className={styles.cardBody}>
              
              {/* Section 1: Basic Information */}
              <div className={styles.detailsSection}>
                <h3 className={styles.sectionTitle}>Basic Information</h3>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>PO ID</span>
                    <span className={styles.detailValue}>{purchaseOrder.id || '—'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>PO Number</span>
                    <span className={styles.detailValue}>{purchaseOrder.poNumber || '—'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>PO Date</span>
                    <span className={styles.detailValue}>{formatDate(purchaseOrder.poDate)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Status</span>
                    <span className={`${styles.statusBadge} ${styles[getStatusClass(purchaseOrder.status)]}`}>
                      {getStatusLabel(purchaseOrder.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Vendor Information */}
              <div className={styles.detailsSection}>
                <h3 className={styles.sectionTitle}>Vendor Information</h3>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Vendor ID</span>
                    <span className={styles.detailValue}>{purchaseOrder.vendorId || '—'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Vendor Name</span>
                    <span className={styles.detailValue}>{purchaseOrder.vendorName || '—'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Contact Person</span>
                    <span className={styles.detailValue}>{purchaseOrder.contactPerson || '—'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Vendor Mobile</span>
                    <span className={styles.detailValue}>{purchaseOrder.vendorMobile || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Amount Details */}
              <div className={styles.detailsSection}>
                <h3 className={styles.sectionTitle}>Amount Details</h3>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Total Amount</span>
                    <span className={`${styles.detailValue} ${styles.amountValue}`}>
                      {formatAmount(purchaseOrder.totalAmount)}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>CGST Amount</span>
                    <span className={`${styles.detailValue} ${styles.amountValue}`}>
                      {formatAmount(purchaseOrder.cgstAmount)}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>SGST Amount</span>
                    <span className={`${styles.detailValue} ${styles.amountValue}`}>
                      {formatAmount(purchaseOrder.sgstAmount)}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Discount</span>
                    <span className={`${styles.detailValue} ${styles.amountValue}`}>
                      {purchaseOrder.discount ? `${purchaseOrder.discount}%` : '—'}
                    </span>
                  </div>
                  <div className={`${styles.detailItem} ${styles.highlight}`}>
                    <span className={styles.detailLabel}>Net Amount</span>
                    <span className={`${styles.detailValue} ${styles.amountValue} ${styles.netAmount}`}>
                      {formatAmount(purchaseOrder.netAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 4: Clinic Information */}
              <div className={styles.detailsSection}>
                <h3 className={styles.sectionTitle}>Clinic Information</h3>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Clinic Name</span>
                    <span className={styles.detailValue}>{purchaseOrder.clinicName || '—'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Branch Name</span>
                    <span className={styles.detailValue}>{purchaseOrder.branchName || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Section 5: Timestamps */}
              <div className={styles.detailsSection}>
                <h3 className={styles.sectionTitle}>Record Information</h3>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Date Created</span>
                    <span className={styles.detailValue}>{formatDate(purchaseOrder.dateCreated)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Last Modified</span>
                    <span className={styles.detailValue}>{formatDate(purchaseOrder.dateModified)}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          // ORDER ITEMS TAB
          <PurchaseOrderItems poId={id} purchaseOrder={purchaseOrder} />
        )}
      </div>
    </div>
  );
};

export default ViewPurchaseOrder;