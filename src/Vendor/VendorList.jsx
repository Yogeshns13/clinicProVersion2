// src/components/VendorList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus } from 'react-icons/fi';
import { getVendorList } from '../api/api-pharmacy.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import AddVendor from './AddVendor.jsx';
import styles from './VendorList.module.css';

// ──────────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 0, label: 'Inactive' },
];

// ──────────────────────────────────────────────────
const VendorList = () => {
  const navigate = useNavigate();

  // Data & Filter
  const [vendors, setVendors] = useState([]);
  const [allVendors, setAllVendors] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Form Modal
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // ──────────────────────────────────────────────────
  // Data fetching
  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const statusFilter = selectedStatus === 'all' ? -1 : Number(selectedStatus);

      const data = await getVendorList(clinicId, {
        BranchID: branchId,
        VendorID: 0,
        Status: statusFilter,
      });

      setVendors(data);
      setAllVendors(data);
    } catch (err) {
      console.error('fetchVendors error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load vendors' }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [selectedStatus]);

  // ──────────────────────────────────────────────────
  // Computed values
  const filteredVendors = useMemo(() => {
    if (!searchTerm.trim()) return allVendors;

    const term = searchTerm.toLowerCase();
    return allVendors.filter(
      (vendor) =>
        vendor.name?.toLowerCase().includes(term) ||
        vendor.contactPerson?.toLowerCase().includes(term) ||
        vendor.mobile?.toLowerCase().includes(term) ||
        vendor.email?.toLowerCase().includes(term) ||
        vendor.gstNo?.toLowerCase().includes(term)
    );
  }, [allVendors, searchTerm]);

  // ──────────────────────────────────────────────────
  // Helper functions
  const getStatusLabel = (status) => {
    if (status === 1) return 'Active';
    if (status === 0) return 'Inactive';
    return 'Unknown';
  };

  const getStatusClass = (status) => {
    if (status === 1) return styles.active;
    if (status === 0) return styles.inactive;
    return styles.inactive;
  };

  // ──────────────────────────────────────────────────
  // Handlers
  const handleSearch = () => setSearchTerm(searchInput.trim());

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleViewDetails = (vendor) => {
    navigate(`/view-vendor/${vendor.id}`);
  };

  const openAddForm = () => setIsAddFormOpen(true);
  const closeAddForm = () => setIsAddFormOpen(false);

  const handleAddSuccess = () => {
    fetchVendors();
  };

  // ──────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.loading}>Loading vendors...</div>;
  if (error) return <div className={styles.error}>Error: {error.message || error}</div>;

  // ──────────────────────────────────────────────────
  return (
    <>
      <Header />
      <div className={styles.listWrapper}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          {/* Status Filter */}
          <div className={styles.selectWrapper}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={styles.select}
            >
              <option value="all">All Status</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search by name, contact, mobile, GST..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className={styles.searchInput}
            />
            <button onClick={handleSearch} className={styles.searchBtn}>
              <FiSearch size={18} />
            </button>
          </div>

          {/* Add Vendor */}
          <div className={styles.addSection}>
            <button onClick={openAddForm} className={styles.addBtn}>
              <FiPlus size={20} />
              Add Vendor
            </button>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Contact Person</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>GST No</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan="7" className={styles.noData}>
                    {searchTerm ? 'No vendors found.' : 'No vendors registered yet.'}
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => (
                  <tr key={vendor.id}>
                    <td>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar}>
                          {vendor.name?.charAt(0).toUpperCase() || 'V'}
                        </div>
                        <div>
                          <div className={styles.name}>{vendor.name}</div>
                          <div className={styles.subInfo}>{vendor.branchName || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{vendor.contactPerson || '—'}</td>
                    <td>{vendor.mobile || '—'}</td>
                    <td>{vendor.email || '—'}</td>
                    <td>
                      {vendor.gstNo ? (
                        <span className={styles.gstBadge}>{vendor.gstNo}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusClass(vendor.status)}`}>
                        {getStatusLabel(vendor.status)}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleViewDetails(vendor)}
                        className={styles.detailsBtn}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ──────────────── Add Vendor Modal ──────────────── */}
        <AddVendor
          isOpen={isAddFormOpen}
          onClose={closeAddForm}
          onAddSuccess={handleAddSuccess}
        />
      </div>
    </>
  );
};

export default VendorList;