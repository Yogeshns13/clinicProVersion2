// src/components/ViewMedicineMaster.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPackage, FiArrowLeft, FiAlertTriangle, FiX } from 'react-icons/fi';
import { getMedicineMasterList, deleteMedicineMaster } from '../Api/ApiPharmacy.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import ConfirmPopup from '../Hooks/ConfirmPopup.jsx';
import styles from './ViewMedicineMaster.module.css';
import UpdateMedicineMaster from './UpdateMedicineMaster.jsx';
import { FaClinicMedical } from 'react-icons/fa';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';
import LoadingPage from '../Hooks/LoadingPage.jsx';

// ────────────────────────────────────────────────
// CONSTANTS — UNCHANGED
// ────────────────────────────────────────────────
const MEDICINE_TYPES = [
  { id: 1,  label: 'Tablet' },
  { id: 2,  label: 'Capsule' },
  { id: 3,  label: 'Syrup' },
  { id: 4,  label: 'Injection' },
  { id: 5,  label: 'Ointment' },
  { id: 6,  label: 'Drops' },
  { id: 7,  label: 'Powder' },
  { id: 8,  label: 'Gel' },
  { id: 9,  label: 'Cream' },
  { id: 10, label: 'Inhaler' },
];

const MEDICINE_UNITS = [
  { id: 1,  label: 'Strip' },
  { id: 2,  label: 'Bottle' },
  { id: 3,  label: 'Vial' },
  { id: 4,  label: 'Tube' },
  { id: 5,  label: 'Box' },
  { id: 6,  label: 'Ampoule' },
  { id: 7,  label: 'Sachet' },
  { id: 8,  label: 'Blister Pack' },
  { id: 9,  label: 'Jar' },
  { id: 10, label: 'Roll' },
];

const TIMING_LABELS = { M: 'Morning', A: 'Afternoon', E: 'Evening', N: 'Night' };

const parseTimingPills = (str) =>
  str
    ? str.split('|').filter(k => TIMING_LABELS[k]).map(k => ({ key: k, label: TIMING_LABELS[k] }))
    : [];

// ────────────────────────────────────────────────
// Props:
//   isModal         (bool) — when true renders as a popup
//   onClose         (func) — called to close the popup
//   medicineId      (any)  — pass id directly when used as popup
//   onUpdateRequest (func) — called with medicineId when Update is clicked in modal mode
//   onDeleteSuccess (func) — called after successful delete in modal mode (refreshes list)
// ────────────────────────────────────────────────
const ViewMedicineMaster = ({ isModal = false, onClose, medicineId, onUpdateRequest, onDeleteSuccess }) => {
  const params   = useParams();
  const navigate = useNavigate();

  const id = isModal ? medicineId : params.id;

  const [medicine, setMedicine]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Button cooldown state (2-sec disable after click) ──
  const [btnCooldown, setBtnCooldown] = useState({});
  const triggerCooldown = (key) => {
    setBtnCooldown((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setBtnCooldown((prev) => ({ ...prev, [key]: false })), 2000);
  };

  // ── MessagePopup state ──────────────────────────
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopup  = (message, type = 'success') => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });

  // ── ConfirmPopup state ──────────────────────────
  const [confirmPopup, setConfirmPopup] = useState({ visible: false });
  const openConfirmPopup  = () => setConfirmPopup({ visible: true });
  const closeConfirmPopup = () => setConfirmPopup({ visible: false });

  // Only used in PAGE mode
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);

  // ────────────────────────────────────────────────
  const fetchMedicineDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const data = await getMedicineMasterList(clinicId, {
        BranchID:   branchId,
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

  useEffect(() => {
    if (id) fetchMedicineDetails();
  }, [id]);

  // ────────────────────────────────────────────────
  // Helpers — UNCHANGED
  const getTypeLabel = (typeId) =>
    MEDICINE_TYPES.find((t) => t.id === typeId)?.label || '—';

  const getUnitLabel = (unitId) =>
    MEDICINE_UNITS.find((u) => u.id === unitId)?.label || '—';

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatPrice = (price) => {
    if (!price || price === '0.00') return '₹0.00';
    return `₹${parseFloat(price).toFixed(2)}`;
  };

  const STATUS_MAP = {
    1: { label: 'Active',       cls: 'active' },
    2: { label: 'Inactive',     cls: 'inactive' },
    3: { label: 'Discontinued', cls: 'discontinued' },
    4: { label: 'Out of Stock', cls: 'outofstock' },
  };

  const getStatusLabel = (status) => STATUS_MAP[status]?.label || '—';
  const getStatusClass = (status) => STATUS_MAP[status]?.cls  || 'inactive';

  // ────────────────────────────────────────────────
  // Handlers
  const handleDeleteClick = () => {
    triggerCooldown('delete');
    openConfirmPopup();
  };

  const handleDeleteConfirm = async () => {
    closeConfirmPopup();
    setDeleteLoading(true);

    try {
      await deleteMedicineMaster(medicine.id);
      showPopup('Medicine deleted successfully!', 'success');
      // Give the success popup 1s to show before closing
      setTimeout(() => {
        if (isModal && onDeleteSuccess) {
          onDeleteSuccess();
        } else if (isModal && onClose) {
          onClose();
        } else {
          navigate('/medicinemaster-list');
        }
      }, 1500);
    } catch (err) {
      console.error('Delete medicine failed:', err);
      showPopup(err?.message || 'Failed to delete medicine.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBack = () => {
    if (isModal && onClose) {
      onClose();
    } else {
      navigate('/medicinemaster-list');
    }
  };

  const handleUpdateClick = () => {
    triggerCooldown('update');
    if (isModal && onUpdateRequest) {
      onUpdateRequest(id);
    } else {
      setIsUpdateOpen(true);
    }
  };

  const handleUpdateSuccess = () => {
    setIsUpdateOpen(false);
    fetchMedicineDetails();
  };

  // ────────────────────────────────────────────────
  const renderContent = () => {
    if (error && (error?.status >= 400 || error?.code >= 400)) return <ErrorHandler error={error} />;
    if (loading)   return <div className={styles.loading}><LoadingPage/></div>;
    if (error)     return <div className={styles.error}>Error: {error.message || error}</div>;
    if (!medicine) return <div className={styles.error}>Medicine not found</div>;

    const timingPills = parseTimingPills(medicine.timing || '');
    const clinicName = localStorage.getItem('clinicName') || '—';
  const branchName = localStorage.getItem('branchName') || '—';

    return (
      <div className={styles.detailsCard}>

        {/* ── Gradient Header ── */}
        <div className={styles.cardHeader}>
          <div className={styles.headerInfo}>
            <h2>{medicine.name}</h2>
            <div className={styles.badgeContainer}>
              {medicine.isLowStock && (
                <span className={styles.lowStockBadge}>
                  <FiAlertTriangle size={14} />
                  LOW STOCK
                </span>
              )}
            </div>
          </div>
         <div className={styles.addModalHeaderCard}>
                     <div className={styles.clinicInfoIcon}>
                       <FaClinicMedical size={18} />
                     </div>
                     <div className={styles.clinicInfoText}>
                       <span className={styles.clinicInfoName}>{clinicName}</span>
                       <span className={styles.clinicInfoBranch}>{branchName}</span>
                     </div>
                     </div>
          {isModal && onClose && (
            <button onClick={onClose} className={styles.headerCloseBtn} title="Close">
              <FiX size={20} />
            </button>
          )}
        </div>

        {/* ── Scrollable Body ── */}
        <div className={styles.cardBody}>

          {/* Section 1: Medicine Details */}
          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>Medicine Details</h3>
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
                <span className={styles.detailLabel}>Dose Count</span>
                <span className={styles.detailValue}>{medicine.doseCount ?? '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Manufacturer</span>
                <span className={styles.detailValue}>{medicine.manufacturer || '—'}</span>
              </div>
            </div>

            <div className={styles.fullWidthDetail}>
              <span className={styles.detailLabel}>Timing</span>
              {timingPills.length > 0 ? (
                <div className={styles.timingDisplay}>
                  {timingPills.map(p => (
                    <span key={p.key} className={styles.timingPill}>
                      <span className={styles.timingPillKey}>{p.key}</span>
                      {p.label}
                    </span>
                  ))}
                </div>
              ) : (
                <span className={styles.detailValue}>—</span>
              )}
            </div>

            {medicine.composition && (
              <div className={styles.fullWidthDetail}>
                <span className={styles.detailLabel}>Composition</span>
                <span className={styles.detailValue}>{medicine.composition}</span>
              </div>
            )}
          </div>

          {/* Section 2: Inventory & Pricing */}
          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>Inventory &amp; Pricing Details</h3>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Current Stock</span>
                <span className={`${styles.detailValue} ${medicine.isLowStock ? styles.lowStockText : ''}`}>
                  {medicine.stockQuantity}
                  {medicine.isLowStock && <FiAlertTriangle size={16} />}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Reorder Level</span>
                <span className={styles.detailValue}>{medicine.reorderLevelQty}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Status</span>
                <span className={`${styles.statusBadge} ${styles[getStatusClass(medicine.status)]}`}>
                  {getStatusLabel(medicine.status)}
                </span>
              </div>
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

          {/* Section 3: Stock & System Info */}
          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>Stock &amp; System Information</h3>
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
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Date Created</span>
                <span className={styles.detailValue}>{formatDate(medicine.dateCreated)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Date Modified</span>
                <span className={styles.detailValue}>{formatDate(medicine.dateModified)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* ── Footer Actions ── */}
        <div className={styles.cardFooter}>
          <button
            onClick={handleDeleteClick}
            className={`${styles.btnHold} ${styles.btnDelete}`}
            disabled={deleteLoading || !!btnCooldown['delete']}
          >
            {deleteLoading ? 'Deleting...' : 'Delete Medicine'}
          </button>
          <button
            onClick={handleUpdateClick}
            className={styles.btnUpdate}
            disabled={!!btnCooldown['update']}
          >
            Update Medicine
          </button>
        </div>

      </div>
    );
  };

  // ────────────────────────────────────────────────
  // MODAL MODE
  // ────────────────────────────────────────────────
  if (isModal) {
    return (
      <>
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <ErrorHandler error={error} />
            {renderContent()}
          </div>
        </div>

        {/* ── ConfirmPopup ── */}
        <ConfirmPopup
          visible={confirmPopup.visible}
          message="Delete this medicine?"
          subMessage="This action cannot be undone. The medicine will be permanently removed."
          confirmLabel="Yes, Delete"
          cancelLabel="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={closeConfirmPopup}
        />

        {/* ── MessagePopup ── */}
        <MessagePopup
          visible={popup.visible}
          message={popup.message}
          type={popup.type}
          onClose={closePopup}
        />
      </>
    );
  }

  // ────────────────────────────────────────────────
  // PAGE MODE — UNCHANGED
  // ────────────────────────────────────────────────
  return (
    <>
      <div className={styles.wrapper}>
        <ErrorHandler error={error} />
        <Header title="Medicine Master Details" />

        <div className={styles.toolbar}>
          <button onClick={handleBack} className={styles.backBtn}>
            <FiArrowLeft size={20} /> Back to List
          </button>
        </div>

        {renderContent()}

        {/* Update popup for page mode */}
        {isUpdateOpen && (
          <UpdateMedicineMaster
            isModal={true}
            medicineId={id}
            onClose={() => setIsUpdateOpen(false)}
            onSuccess={handleUpdateSuccess}
          />
        )}
      </div>

      {/* ── ConfirmPopup ── */}
      <ConfirmPopup
        visible={confirmPopup.visible}
        message="Delete this medicine?"
        subMessage="This action cannot be undone. The medicine will be permanently removed."
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={closeConfirmPopup}
      />

      {/* ── MessagePopup ── */}
      <MessagePopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
      />
    </>
  );
};

export default ViewMedicineMaster;