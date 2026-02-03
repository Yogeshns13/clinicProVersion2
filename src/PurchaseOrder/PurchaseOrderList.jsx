// src/components/PurchaseOrderList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus } from 'react-icons/fi';
import { getPurchaseOrderList } from '../api/api-pharmacy.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import AddPurchaseOrder from './AddPurchaseOrder.jsx';
import styles from './PurchaseOrderList.module.css';

// ──────────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { id: 1, label: 'Draft'},
  { id: 2, label: 'Sent' },
  { id: 3, label: 'Confirmed'},
  { id: 4, label: 'Partially Received' },
  { id: 5, label: 'Fully Received' },
  { id: 6, label: 'Cancelled' },
];

// ──────────────────────────────────────────────────
const PurchaseOrderList = () => {
  const navigate = useNavigate();

  // Data & Filter
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [allPurchaseOrders, setAllPurchaseOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Form Modal
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // ──────────────────────────────────────────────────
  // Data fetching
  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const statusFilter = selectedStatus === 'all' ? -1 : Number(selectedStatus);

      const data = await getPurchaseOrderList(clinicId, {
        BranchID: branchId,
        POID: 0,
        Status: statusFilter,
      });

      setPurchaseOrders(data);
      setAllPurchaseOrders(data);
    } catch (err) {
      console.error('fetchPurchaseOrders error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load purchase orders' }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, [selectedStatus]);

  // ──────────────────────────────────────────────────
  // Computed values
  const filteredPurchaseOrders = useMemo(() => {
    if (!searchTerm.trim()) return allPurchaseOrders;

    const term = searchTerm.toLowerCase();
    return allPurchaseOrders.filter(
      (po) =>
        po.poNumber?.toLowerCase().includes(term) ||
        po.vendorName?.toLowerCase().includes(term) ||
        po.contactPerson?.toLowerCase().includes(term) ||
        po.vendorMobile?.toLowerCase().includes(term)
    );
  }, [allPurchaseOrders, searchTerm]);

  // ──────────────────────────────────────────────────
  // Helper functions
  const getStatusLabel = (status) => {
    if (status === 1) return 'Draft';
    if (status === 2) return 'Sent';
    if (status === 3) return 'Confirmed';
    if (status === 4) return 'Partially Recieved';
    if (status === 5) return 'Fully Recieved';
    if (status === 6) return 'Cncelled';
    return 'Unknown';
  };

  const getStatusClass = (status) => {
    if (status === 1) return styles.active;
    if (status === 2) return styles.inactive;
    return styles.inactive;
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

  const handleViewDetails = (po) => {
    navigate(`/view-purchaseorder/${po.id}`);
  };

  const openAddForm = () => setIsAddFormOpen(true);
  const closeAddForm = () => setIsAddFormOpen(false);

  const handleAddSuccess = () => {
    fetchPurchaseOrders();
  };

  // ──────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.loading}>Loading purchase orders...</div>;
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
              placeholder="Search by PO number, vendor, contact..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className={styles.searchInput}
            />
            <button onClick={handleSearch} className={styles.searchBtn}>
              <FiSearch size={18} />
            </button>
          </div>

          {/* Add Purchase Order */}
          <div className={styles.addSection}>
            <button onClick={openAddForm} className={styles.addBtn}>
              <FiPlus size={20} />
              Add Purchase Order
            </button>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>PO Number</th>
                <th>PO Date</th>
                <th>Vendor</th>
                <th>Contact Person</th>
                <th>Total Amount</th>
                <th>Net Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className={styles.noData}>
                    {searchTerm ? 'No purchase orders found.' : 'No purchase orders registered yet.'}
                  </td>
                </tr>
              ) : (
                filteredPurchaseOrders.map((po) => (
                  <tr key={po.id}>
                    <td>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar}>
                          {po.poNumber?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        <div>
                          <div className={styles.name}>{po.poNumber || '—'}</div>
                          <div className={styles.subInfo}>{po.branchName || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{formatDate(po.poDate)}</td>
                    <td>{po.vendorName || '—'}</td>
                    <td>{po.contactPerson || '—'}</td>
                    <td>
                      <span className={styles.amountBadge}>
                        {formatAmount(po.totalAmount)}
                      </span>
                    </td>
                    <td>
                      <span className={styles.amountBadge}>
                        {formatAmount(po.netAmount)}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusClass(po.status)}`}>
                        {getStatusLabel(po.status)}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleViewDetails(po)}
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

        {/* ──────────────── Add Purchase Order Modal ──────────────── */}
        <AddPurchaseOrder
          isOpen={isAddFormOpen}
          onClose={closeAddForm}
          onAddSuccess={handleAddSuccess}
        />
      </div>
    </>
  );
};

export default PurchaseOrderList;