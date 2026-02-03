// src/components/PurchaseOrderDetailList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus } from 'react-icons/fi';
import { getPurchaseOrderDetailList } from '../api/api-pharmacy.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import AddPurchaseOrderDetail from './AddPurchaseOrderDetail.jsx';
import styles from './PurchaseOrderDetailList.module.css';

// ──────────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { id: 1, label: 'Ordered' },
  { id: 2, label: 'Partially Received' },
  { id: 3, label: 'Fully Received' },
  { id: 4, label: 'Cancelled' },
  { id: 5, label: 'Rejected' },
];

// ──────────────────────────────────────────────────
const PurchaseOrderDetailList = () => {
  const navigate = useNavigate();

  // Data & Filter
  const [poDetails, setPoDetails] = useState([]);
  const [allPoDetails, setAllPoDetails] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Form Modal
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // ──────────────────────────────────────────────────
  // Data fetching
  const fetchPODetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const statusFilter = selectedStatus === 'all' ? -1 : Number(selectedStatus);

      const data = await getPurchaseOrderDetailList(clinicId, {
        BranchID: branchId,
        PODetailID: 0,
        Status: statusFilter,
      });

      setPoDetails(data);
      setAllPoDetails(data);
    } catch (err) {
      console.error('fetchPODetails error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load purchase order details' }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPODetails();
  }, [selectedStatus]);

  // ──────────────────────────────────────────────────
  // Computed values
  const filteredPODetails = useMemo(() => {
    if (!searchTerm.trim()) return allPoDetails;

    const term = searchTerm.toLowerCase();
    return allPoDetails.filter(
      (detail) =>
        detail.poNumber?.toLowerCase().includes(term) ||
        detail.medicineName?.toLowerCase().includes(term) ||
        detail.genericName?.toLowerCase().includes(term) ||
        detail.vendorName?.toLowerCase().includes(term) ||
        detail.manufacturer?.toLowerCase().includes(term)
    );
  }, [allPoDetails, searchTerm]);

  // ──────────────────────────────────────────────────
  // Helper functions
  const getStatusLabel = (status) => {
    const statusOption = STATUS_OPTIONS.find(s => s.id === status);
    return statusOption ? statusOption.label : 'Unknown';
  };

  const getStatusClass = (status) => {
    if (status === 1) return styles.ordered;
    if (status === 2) return styles.partiallyReceived;
    if (status === 3) return styles.fullyReceived;
    if (status === 4) return styles.cancelled;
    if (status === 5) return styles.rejected;
    return styles.ordered;
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

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '—';
    return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // ──────────────────────────────────────────────────
  // Handlers
  const handleSearch = () => setSearchTerm(searchInput.trim());

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleViewDetails = (detail) => {
    navigate(`/view-purchaseorderdetail/${detail.id}`);
  };

  const openAddForm = () => setIsAddFormOpen(true);
  const closeAddForm = () => setIsAddFormOpen(false);

  const handleAddSuccess = () => {
    fetchPODetails();
  };

  // ──────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.loading}>Loading purchase order details...</div>;
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
              placeholder="Search by PO, medicine, vendor, generic..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className={styles.searchInput}
            />
            <button onClick={handleSearch} className={styles.searchBtn}>
              <FiSearch size={18} />
            </button>
          </div>

          {/* Add PO Detail */}
          <div className={styles.addSection}>
            <button onClick={openAddForm} className={styles.addBtn}>
              <FiPlus size={20} />
              Add Item
            </button>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>PO Number</th>
                <th>Vendor</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Amount</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPODetails.length === 0 ? (
                <tr>
                  <td colSpan="9" className={styles.noData}>
                    {searchTerm ? 'No items found.' : 'No purchase order items yet.'}
                  </td>
                </tr>
              ) : (
                filteredPODetails.map((detail) => (
                  <tr key={detail.id}>
                    <td>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar}>
                          {detail.medicineName?.charAt(0).toUpperCase() || 'M'}
                        </div>
                        <div>
                          <div className={styles.name}>{detail.medicineName || '—'}</div>
                          <div className={styles.subInfo}>{detail.genericName || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className={styles.poNumber}>{detail.poNumber || '—'}</div>
                        <div className={styles.subInfo}>{formatDate(detail.poDate)}</div>
                      </div>
                    </td>
                    <td>{detail.vendorName || '—'}</td>
                    <td>
                      <span className={styles.quantityBadge}>{detail.quantity || 0}</span>
                    </td>
                    <td>
                      <span className={styles.amountBadge}>
                        {formatAmount(detail.unitPrice)}
                      </span>
                    </td>
                    <td>
                      <span className={styles.amountBadge}>
                        {formatAmount(detail.amount)}
                      </span>
                    </td>
                    <td>
                      <span className={styles.totalBadge}>
                        {formatAmount(detail.totalLineAmount)}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusClass(detail.status)}`}>
                        {getStatusLabel(detail.status)}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleViewDetails(detail)}
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

        {/* ──────────────── Add PO Detail Modal ──────────────── */}
        <AddPurchaseOrderDetail
          isOpen={isAddFormOpen}
          onClose={closeAddForm}
          onAddSuccess={handleAddSuccess}
        />
      </div>
    </>
  );
};

export default PurchaseOrderDetailList;