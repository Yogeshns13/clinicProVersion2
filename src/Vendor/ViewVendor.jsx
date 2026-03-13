// src/components/ViewVendor.jsx
import React, { useState } from 'react';
import { deleteVendor } from '../Api/ApiPharmacy.js';
import UpdateVendor from './UpdateVendor.jsx';
import styles from './ViewVendor.module.css';
import { FaClinicMedical } from 'react-icons/fa';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';

// ────────────────────────────────────────────────
// Props:
//   vendor          — the vendor object to display
//   onClose         — called when the modal is closed
//   onDeleteSuccess — called after successful delete or update (so VendorList can refresh)
// ────────────────────────────────────────────────
const ViewVendor = ({ vendor, onClose, onDeleteSuccess }) => {
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);

  // ────────────────────────────────────────────────
  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusClass = (status) => {
    if (status === 'active'      || status === 1) return styles.active;
    if (status === 'inactive'    || status === 2) return styles.inactive;
    if (status === 'blacklisted' || status === 3) return styles.blacklisted;
    if (status === 'suspended'   || status === 4) return styles.suspended;
    return styles.inactive;
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'active' || status === 1) return styles.activeBadge;
    return styles.inactiveBadge;
  };

  const getStatusLabel = (vendor) => {
    if (vendor.statusDesc) return vendor.statusDesc.toUpperCase();
    if (vendor.status === 1 || vendor.status === 'active')      return 'ACTIVE';
    if (vendor.status === 2 || vendor.status === 'inactive')    return 'INACTIVE';
    if (vendor.status === 3 || vendor.status === 'blacklisted') return 'BLACKLISTED';
    if (vendor.status === 4 || vendor.status === 'suspended')   return 'SUSPENDED';
    return 'UNKNOWN';
  };

  // ────────────────────────────────────────────────
  // Handlers
  const handleUpdateClick = () => {
    setIsUpdateOpen(true);
  };

  const handleUpdateClose = () => {
    setIsUpdateOpen(false);
  };

  const handleUpdateSuccess = () => {
    setIsUpdateOpen(false);
    onClose();
    onDeleteSuccess(); // reused to refresh the vendor list after update
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;
    try {
      await deleteVendor(vendor.id);
      onDeleteSuccess();
    } catch (err) {
      console.error('Delete vendor failed:', err);
      alert(err.message || 'Failed to delete vendor.');
    }
  };

  // ────────────────────────────────────────────────
  return (
    <>
      <div className={styles.detailModalOverlay} onClick={onClose}>
        <div className={styles.detailModalContent} onClick={(e) => e.stopPropagation()}>

          {/* ── Gradient Header ── */}
          <div className={styles.detailModalHeader}>
            <div className={styles.detailHeaderContent}>
              <h2>{vendor.name}</h2>
            </div>
            <div className={styles.clinicNameone}>
               <FaClinicMedical size={20} style={{ verticalAlign: 'middle', margin: '6px' }} />  
                 {localStorage.getItem('clinicName') || '—'}
               </div>
            <button onClick={onClose} className={styles.detailCloseBtn}>✕</button>
          </div>

          {/* ── Info Cards Grid ── */}
          <div className={styles.detailModalBody}>
            <div className={styles.infoSection}>

              {/* Basic Information */}
              <div className={styles.infoCard}>
                <div className={styles.infoHeader}>
                  <h3>Basic Information</h3>
                </div>
                <div className={styles.infoContent}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Vendor Name</span>
                    <span className={styles.infoValue}>{vendor.name || '—'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Contact Person</span>
                    <span className={styles.infoValue}>{vendor.contactPerson || '—'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Status</span>
                    <span className={styles.infoValue}>
                      <span className={`${styles.statusBadge} ${getStatusClass(vendor.status)}`}>
                        {getStatusLabel(vendor)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className={styles.infoCard}>
                <div className={styles.infoHeader}>
                  <h3>Contact Information</h3>
                </div>
                <div className={styles.infoContent}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Mobile</span>
                    <span className={styles.infoValue}>{vendor.mobile || '—'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Alternate Mobile</span>
                    <span className={styles.infoValue}>{vendor.altMobile || '—'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Email</span>
                    <span className={styles.infoValue}>{vendor.email || '—'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Address</span>
                    <span className={styles.infoValue}>{vendor.address || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className={styles.infoCard}>
                <div className={styles.infoHeader}>
                  <h3>Business Information</h3>
                </div>
                <div className={styles.infoContent}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>GST Number</span>
                    <span className={styles.infoValue}>{vendor.gstNo || '—'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>License Details</span>
                    <span className={styles.infoValue}>{vendor.licenseDetail || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Clinic Information */}
              <div className={styles.infoCard}>
                <div className={styles.infoHeader}>
                  <h3>Clinic Information</h3>
                </div>
                <div className={styles.infoContent}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Clinic Name</span>
                    <span className={styles.infoValue}>{vendor.clinicName || '—'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Branch Name</span>
                    <span className={styles.infoValue}>{vendor.branchName || '—'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Date Created</span>
                    <span className={styles.infoValue}>{formatDate(vendor.dateCreated)}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Last Modified</span>
                    <span className={styles.infoValue}>{formatDate(vendor.dateModified)}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* ── Footer Actions ── */}
            <div className={styles.detailModalFooter}>
              <button onClick={handleDelete} className={styles.btnDelete}>
                Delete Vendor
              </button>
              <button onClick={handleUpdateClick} className={styles.btnUpdate}>
                Update Vendor
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── Update Vendor Modal rendered on top ── */}
      {isUpdateOpen && (
        <UpdateVendor
          vendor={vendor}
          onClose={handleUpdateClose}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}
    </>
  );
};

export default ViewVendor;