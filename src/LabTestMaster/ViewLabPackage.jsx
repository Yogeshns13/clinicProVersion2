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
          <div className={styles.statusBadgeLargeWrapper}>
            <span className={`${styles.statusBadge} ${styles.large} ${getStatusClass(pkg.status)}`}>
              {getPackageStatusLabel(pkg.status)}
            </span>
          </div>
          <button onClick={onClose} className={styles.modalClose}>
            ×
          </button>
        </div>

        <div className={styles.detailsModalBody}>
          {/* Package Info */}
          <h3 className={styles.sectionTitle}>Package Information</h3>
          <table className={styles.detailsTable}>
            <tbody>
              <tr>
                <td className={styles.label}>Package Name</td>
                <td className={styles.value}>{pkg.packName || '—'}</td>
              </tr>
              <tr>
                <td className={styles.label}>Short Name</td>
                <td className={styles.value}>{pkg.packShortName || '—'}</td>
              </tr>
              <tr>
                <td className={styles.label}>Description</td>
                <td className={styles.value}>{pkg.description || '—'}</td>
              </tr>
              <tr>
                <td className={styles.label}>Fees</td>
                <td className={styles.value}>₹{parseFloat(pkg.fees || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td className={styles.label}>CGST %</td>
                <td className={styles.value}>{pkg.cgstPercentage || '0'}%</td>
              </tr>
              <tr>
                <td className={styles.label}>SGST %</td>
                <td className={styles.value}>{pkg.sgstPercentage || '0'}%</td>
              </tr>
            </tbody>
          </table>

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