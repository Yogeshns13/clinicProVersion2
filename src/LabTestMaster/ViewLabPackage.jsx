import React from 'react';
import { FiX, FiEdit, FiPlus, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import styles from './ViewLabPackage.module.css';

const PACKAGE_STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
];

const ViewLabPackage = ({
  package: pkg,
  packageItems,
  onClose,
  onUpdate,
  onAddItems,
  onRebuildFees,
  onDeleteItem,
  formError,
  formLoading
}) => {
  if (!pkg) return null;

  const getPackageStatusLabel = (statusId) => {
    return PACKAGE_STATUS_OPTIONS.find((s) => s.id === statusId)?.label || 'Unknown';
  };

  const getStatusClass = (statusId) => {
    if (statusId === 1) return styles.active;
    if (statusId === 2) return styles.inactive;
    return styles.inactive;
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.packageDetailsModal}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.detailsModalHeader}>
          <div className={styles.detailsHeaderContent}>
            <div className={styles.avatarLarge}>
              {pkg.packName?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div>
              <h2>{pkg.packName}</h2>
              <p className={styles.subtitle}>
                {pkg.packShortName || 'Package'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={styles.modalClose}>
            ×
          </button>
        </div>

        <div className={styles.detailsModalBody}>
          {/* Package Info */}
          <h3 className={styles.sectionTitle}>Package Information</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoCell}>
              <span className={styles.infoLabel}>Package Name</span>
              <span className={styles.infoValue}>{pkg.packName || '—'}</span>
            </div>
            <div className={styles.infoCell}>
              <span className={styles.infoLabel}>Short Name</span>
              <span className={styles.infoValue}>{pkg.packShortName || '—'}</span>
            </div>
            <div className={styles.infoCell}>
              <span className={styles.infoLabel}>Fees</span>
              <span className={styles.infoValue}>₹{parseFloat(pkg.fees || 0).toFixed(2)}</span>
            </div>
            <div className={styles.infoCell}>
              <span className={styles.infoLabel}>CGST %</span>
              <span className={styles.infoValue}>{pkg.cgstPercentage || '0'}%</span>
            </div>
            <div className={styles.infoCell}>
              <span className={styles.infoLabel}>SGST %</span>
              <span className={styles.infoValue}>{pkg.sgstPercentage || '0'}%</span>
            </div>
            <div className={`${styles.infoCell} ${styles.infoCellFull}`}>
              <span className={styles.infoLabel}>Description</span>
              <span className={styles.infoValue}>{pkg.description || '—'}</span>
            </div>
          </div>

          {/* Package Items */}
          <div className={styles.packageItemsSection}>
            <div className={styles.packageItemsHeader}>
              <h3 className={styles.sectionTitle}>Package Tests</h3>
              <div className={styles.packageItemsActions}>
                <button onClick={onAddItems} className={styles.btnAddItem}>
                  <FiPlus size={16} /> Add Tests
                </button>
                <button onClick={onRebuildFees} disabled={formLoading} className={styles.btnRebuild}>
                  <FiRefreshCw size={16} /> Rebuild Fees
                </button>
              </div>
            </div>

            {formError && <div className={styles.formError}>{formError}</div>}

            {packageItems.length === 0 ? (
              <div className={styles.noItems}>No tests added to this package yet.</div>
            ) : (
              <div className={styles.itemsList}>
                {packageItems.map((item) => (
                  <div key={item.packageItemId} className={styles.itemCard}>
                    <div className={styles.itemInfo}>
                      <div className={styles.itemName}>{item.testName}</div>
                      <div className={styles.itemDetails}>
                        {item.shortName} • ₹{parseFloat(item.testFees || 0).toFixed(2)}
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteItem(item.packageItemId)}
                      className={styles.btnDeleteItem}
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button onClick={() => onUpdate(pkg)} className={styles.btnUpdate}>
            <FiEdit size={16} /> Update Package
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewLabPackage;