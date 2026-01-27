// src/components/ViewVendor.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { getVendorList, deleteVendor } from '../api/api-pharmacy.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './ViewVendor.module.css';

// ────────────────────────────────────────────────
const ViewVendor = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ────────────────────────────────────────────────
  useEffect(() => {
    const fetchVendorDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const clinicId = Number(localStorage.getItem('clinicID'));
        const branchId = Number(localStorage.getItem('branchID'));

        const data = await getVendorList(clinicId, {
          VendorID: Number(id),
          BranchID: branchId
        });

        if (data && data.length > 0) {
          setVendor(data[0]);
        } else {
          setError({ message: 'Vendor not found' });
        }
      } catch (err) {
        console.error('fetchVendorDetails error:', err);
        setError(
          err?.status >= 400 || err?.code >= 400
            ? err
            : { message: err.message || 'Failed to load vendor details' }
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVendorDetails();
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

  const getStatusClass = (status) => {
    if (status === 'active' || status === 1) return 'active';
    if (status === 'inactive' || status === 2) return 'inactive';
    return 'inactive';
  };

  const getStatusLabel = (vendor) => {
    if (vendor.statusDesc) return vendor.statusDesc.toUpperCase();
    if (vendor.status === 1 || vendor.status === 'active') return 'ACTIVE';
    if (vendor.status === 2 || vendor.status === 'inactive') return 'INACTIVE';
    return 'UNKNOWN';
  };

  // ────────────────────────────────────────────────
  // Handlers
  const handleUpdateClick = () => {
    navigate(`/update-vendor/${vendor.id}`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) {
      return;
    }

    try {
      setError(null);
      await deleteVendor(vendor.id);
      navigate('/vendor-list');
    } catch (err) {
      console.error('Delete vendor failed:', err);
      setError({ message: err.message || 'Failed to delete vendor.' });
    }
  };

  const handleBack = () => {
    navigate('/vendor-list');
  };

  // ────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.loading}>Loading vendor details...</div>;

  if (error) return <div className={styles.error}>Error: {error.message || error}</div>;

  if (!vendor) return <div className={styles.error}>Vendor not found</div>;

  // ────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Vendor Details" />

      {/* Back Button */}
      <div className={styles.toolbar}>
        <button onClick={handleBack} className={styles.backBtn}>
          <FiArrowLeft size={20} /> Back to List
        </button>
      </div>

      {/* Vendor Details Card */}
      <div className={styles.detailsCard}>
        
        {/* Header Section */}
        <div className={styles.cardHeader}>
          <div className={styles.headerInfo}>
            <h2>
              {vendor.name}
            </h2>
            <p className={styles.subtitle}>
              Contact Person: {vendor.contactPerson || '—'} | Mobile: {vendor.mobile || '—'}
            </p>
            <span className={`${styles.statusBadge} ${styles.large} ${styles[getStatusClass(vendor.status)]}`}>
              {getStatusLabel(vendor)}
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
                <span className={styles.detailLabel}>Vendor ID</span>
                <span className={styles.detailValue}>{vendor.id || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Vendor Name</span>
                <span className={styles.detailValue}>{vendor.name || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Contact Person</span>
                <span className={styles.detailValue}>{vendor.contactPerson || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Status</span>
                <span className={`${styles.statusBadge} ${styles[getStatusClass(vendor.status)]}`}>
                  {getStatusLabel(vendor)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>Contact Information</h3>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Mobile</span>
                <span className={styles.detailValue}>{vendor.mobile || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Alternate Mobile</span>
                <span className={styles.detailValue}>{vendor.altMobile || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Email</span>
                <span className={styles.detailValue}>{vendor.email || '—'}</span>
              </div>
              <div className={`${styles.detailItem} ${styles.fullWidth}`}>
                <span className={styles.detailLabel}>Address</span>
                <span className={styles.detailValue}>{vendor.address || '—'}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Business Information */}
          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>Business Information</h3>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>GST Number</span>
                <span className={styles.detailValue}>{vendor.gstNo || '—'}</span>
              </div>
              <div className={`${styles.detailItem} ${styles.fullWidth}`}>
                <span className={styles.detailLabel}>License Details</span>
                <span className={styles.detailValue}>{vendor.licenseDetail || '—'}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Clinic Information */}
          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>Clinic Information</h3>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Clinic Name</span>
                <span className={styles.detailValue}>{vendor.clinicName || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Branch Name</span>
                <span className={styles.detailValue}>{vendor.branchName || '—'}</span>
              </div>
            </div>
          </div>

          {/* Section 5: Timestamps */}
          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>Record Information</h3>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Date Created</span>
                <span className={styles.detailValue}>{formatDate(vendor.dateCreated)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Last Modified</span>
                <span className={styles.detailValue}>{formatDate(vendor.dateModified)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className={styles.cardFooter}>
          <button onClick={handleDelete} className={`${styles.btnHold} ${styles.btnDelete}`}>
            Delete Vendor
          </button>
          <button onClick={handleUpdateClick} className={styles.btnUpdate}>
            Update Vendor
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewVendor;