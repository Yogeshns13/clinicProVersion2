// src/components/ViewMedicineMaster.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPackage, FiArrowLeft, FiAlertTriangle } from 'react-icons/fi';
import { getMedicineMasterList, deleteMedicineMaster } from '../api/api-pharmacy.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './ViewMedicineMaster.module.css';

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────
const MEDICINE_TYPES = [
  { id: 1, label: 'Tablet' },
  { id: 2, label: 'Capsule' },
  { id: 3, label: 'Syrup' },
  { id: 4, label: 'Injection' },
  { id: 5, label: 'Ointment' },
  { id: 6, label: 'Drops' },
  { id: 7, label: 'Powder' },
  { id: 8, label: 'Gel' },
  { id: 9, label: 'Cream' },
  { id: 10, label: 'Inhaler' }
];

const MEDICINE_UNITS = [
  { id: 1, label: 'Strip' },
  { id: 2, label: 'Bottle' },
  { id: 3, label: 'Vial' },
  { id: 4, label: 'Tube' },
  { id: 5, label: 'Box' },
  { id: 6, label: 'Ampoule' },
  { id: 7, label: 'Sachet' },
  { id: 8, label: 'Blister Pack' },
  { id: 9, label: 'Jar' },
  { id: 10, label: 'Roll' }
];

// ────────────────────────────────────────────────
const ViewMedicineMaster = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ────────────────────────────────────────────────
  useEffect(() => {
    const fetchMedicineDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const clinicId = Number(localStorage.getItem('clinicID'));
        const branchId = Number(localStorage.getItem('branchID'));

        const data = await getMedicineMasterList(clinicId, {
          BranchID: branchId,
          MedicineID: Number(id),
        });

        if (data && data.length > 0) {
          setMedicine(data[0]);
        } else {
          setError({ message: 'Medicine not found' });
        }
      } catch (err) {
        console.error('fetchMedicineDetails error:', err);
        setError(
          err?.status >= 400 || err?.code >= 400
            ? err
            : { message: err.message || 'Failed to load medicine details' }
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMedicineDetails();
    }
  }, [id]);

  // ────────────────────────────────────────────────
  // Helper functions
  const getTypeLabel = (typeId) => {
    return MEDICINE_TYPES.find((t) => t.id === typeId)?.label || '—';
  };

  const getUnitLabel = (unitId) => {
    return MEDICINE_UNITS.find((u) => u.id === unitId)?.label || '—';
  };

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

  const formatPrice = (price) => {
    if (!price || price === '0.00') return '₹0.00';
    return `₹${parseFloat(price).toFixed(2)}`;
  };

  const getStatusClass = (status) => {
    if (status === 'active') return 'active';
    if (status === 'inactive') return 'inactive';
    return 'inactive';
  };

  // ────────────────────────────────────────────────
  // Handlers
  const handleUpdateClick = () => {
    navigate(`/update-medicine-master/${medicine.id}`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this medicine?')) {
      return;
    }

    try {
      setError(null);
      await deleteMedicineMaster(medicine.id);
      navigate('/medicine-master-list');
    } catch (err) {
      console.error('Delete medicine failed:', err);
      setError({ message: err.message || 'Failed to delete medicine.' });
    }
  };

  const handleBack = () => {
    navigate('/medicinemaster-list');
  };

  // ────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.loading}>Loading medicine details...</div>;

  if (error) return <div className={styles.error}>Error: {error.message || error}</div>;

  if (!medicine) return <div className={styles.error}>Medicine not found</div>;

  // ────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Medicine Master Details" />

      {/* Back Button */}
      <div className={styles.toolbar}>
        <button onClick={handleBack} className={styles.backBtn}>
          <FiArrowLeft size={20} /> Back to List
        </button>
      </div>

      {/* Medicine Details Card */}
      <div className={styles.detailsCard}>
        
        {/* Header Section */}
        <div className={styles.cardHeader}>
          <div className={styles.headerInfo}>
            <h2>{medicine.name}</h2>
            <p className={styles.subtitle}>
              {getTypeLabel(medicine.type)} - {getUnitLabel(medicine.unit)}
            </p>
            <div className={styles.badgeContainer}>
              <span className={`${styles.statusBadge} ${styles[getStatusClass(medicine.status)]} ${styles.large}`}>
                {medicine.status.toUpperCase()}
              </span>
              {medicine.isLowStock && (
                <span className={styles.lowStockBadge}>
                  <FiAlertTriangle size={14} />
                  LOW STOCK
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details Body */}
        <div className={styles.cardBody}>
          
          {/* Section 1: Basic Information */}
          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>Basic Information</h3>
            
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Medicine Name</span>
                <span className={styles.detailValue}>{medicine.name}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Generic Name</span>
                <span className={styles.detailValue}>{medicine.genericName || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Type</span>
                <span className={styles.detailValue}>{getTypeLabel(medicine.type)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Unit</span>
                <span className={styles.detailValue}>{getUnitLabel(medicine.unit)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Dosage Form</span>
                <span className={styles.detailValue}>{medicine.dosageForm || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Manufacturer</span>
                <span className={styles.detailValue}>{medicine.manufacturer || '—'}</span>
              </div>
            </div>

            {medicine.composition && (
              <div className={styles.fullWidthDetail}>
                <span className={styles.detailLabel}>Composition</span>
                <span className={styles.detailValue}>{medicine.composition}</span>
              </div>
            )}
          </div>

          {/* Section 2: Pricing Information */}
          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>Pricing Information</h3>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>MRP</span>
                <span className={styles.detailValue}>{formatPrice(medicine.mrp)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Purchase Price</span>
                <span className={styles.detailValue}>{formatPrice(medicine.purchasePrice)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Sell Price</span>
                <span className={styles.detailValue}>{formatPrice(medicine.sellPrice)}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Stock & Inventory */}
          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>Stock & Inventory</h3>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Current Stock</span>
                <span className={`${styles.detailValue} ${medicine.isLowStock ? styles.lowStockText : ''}`}>
                  {medicine.stockQuantity}
                  {medicine.isLowStock && <FiAlertTriangle size={16} style={{ marginLeft: '8px' }} />}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Reorder Level</span>
                <span className={styles.detailValue}>{medicine.reorderLevelQty}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Status</span>
                <span className={`${styles.statusBadge} ${styles[getStatusClass(medicine.status)]}`}>
                  {medicine.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Tax Information */}
          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>Tax Information</h3>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>CGST</span>
                <span className={styles.detailValue}>{medicine.cgstPercentage}%</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>SGST</span>
                <span className={styles.detailValue}>{medicine.sgstPercentage}%</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Total GST</span>
                <span className={styles.detailValue}>
                  {(parseFloat(medicine.cgstPercentage) + parseFloat(medicine.sgstPercentage)).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Additional Details */}
          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>Additional Details</h3>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>HSN Code</span>
                <span className={styles.detailValue}>{medicine.hsnCode || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Barcode</span>
                <span className={styles.detailValue}>{medicine.barcode || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Branch</span>
                <span className={styles.detailValue}>{medicine.branchName || '—'}</span>
              </div>
            </div>
          </div>

          {/* Section 6: System Information */}
          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>System Information</h3>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Date Created</span>
                <span className={styles.detailValue}>{formatDate(medicine.dateCreated)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Date Modified</span>
                <span className={styles.detailValue}>{formatDate(medicine.dateModified)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Medicine ID</span>
                <span className={styles.detailValue}>{medicine.id}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className={styles.cardFooter}>
          <button onClick={handleDelete} className={`${styles.btnHold} ${styles.btnDelete}`}>
            Delete Medicine
          </button>
          <button onClick={handleUpdateClick} className={styles.btnUpdate}>
            Update Medicine
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewMedicineMaster;