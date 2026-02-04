// src/components/LabWorkManagement/tabs/OrderListTab.jsx
import React, { useState, useEffect } from 'react';
import { FiSearch, FiCalendar, FiFilter, FiEye } from 'react-icons/fi';
import {
  getLabTestOrderList,
  createWorkItemsForOrder
} from '../../api/api-labtest.js';
import OrderDetailsModal from '../modals/OrderDetailsModal.jsx';
import ConfirmMakeWorkModal from '../modals/ConfirmMakeWorkModal.jsx';
import styles from '../LabWorkManagement.module.css';

const OrderListTab = ({ setError, setLoading }) => {
  const [orders, setOrders] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState(-1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);

  // Modal States
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [isConfirmWorkOpen, setIsConfirmWorkOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Status options
  const statusOptions = [
    { id: -1, label: 'All Statuses' },
    { id: 1, label: 'Pending' },
    { id: 2, label: 'Completed' },
    { id: 3, label: 'Cancelled' },
    { id: 4, label: 'Invoice Processed' },
    { id: 5, label: 'Work in Progress' },
    { id: 6, label: 'External' }
  ];

  // Fetch Lab Test Orders
  const fetchOrders = async () => {
    try {
      setLocalLoading(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const options = {
        Page: 1,
        PageSize: 100,
        BranchID: branchId,
        Status: statusFilter
      };

      if (searchInput.trim()) {
        options.PatientName = searchInput.trim();
      }

      if (fromDate && toDate) {
        options.FromDate = fromDate;
        options.ToDate = toDate;
      } else if (dateFilter) {
        options.DateCreated = dateFilter;
      }

      const data = await getLabTestOrderList(clinicId, options);
      const sortedData = data.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
      setOrders(sortedData);
    } catch (err) {
      console.error('fetchOrders error:', err);
      setError(err);
    } finally {
      setLocalLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSearch = () => {
    fetchOrders();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setDateFilter('');
    setFromDate('');
    setToDate('');
    setStatusFilter(-1);
    fetchOrders();
  };

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  };

  const handleMakeWorkClick = (order) => {
    setSelectedOrder(order);
    setIsConfirmWorkOpen(true);
  };

  const handleConfirmMakeWork = async () => {
    if (!selectedOrder) return;

    try {
      setLoading(true);
      const clinicId = Number(localStorage.getItem('clinicID'));

      await createWorkItemsForOrder(selectedOrder.id, clinicId);

      setIsConfirmWorkOpen(false);
      setSelectedOrder(null);
      await fetchOrders();

      alert('Work items created successfully!');
    } catch (err) {
      console.error('Error creating work items:', err);
      alert(err.message || 'Failed to create work items');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    const classMap = {
      1: styles.statusPending,
      2: styles.statusCompleted,
      3: styles.statusCancelled,
      4: styles.statusInvoiced,
      5: styles.statusInProgress,
      6: styles.statusExternal
    };
    return classMap[status] || styles.statusPending;
  };

  const getPriorityBadgeClass = (priority) => {
    const classMap = {
      1: styles.priorityNormal,
      2: styles.priorityUrgent,
      3: styles.priorityStat
    };
    return classMap[priority] || styles.priorityNormal;
  };

  if (localLoading) {
    return <div className={styles.loading}>Loading orders...</div>;
  }

  return (
    <>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <div className={styles.selectWrapper}>
            <FiCalendar className={styles.selectIcon} size={20} />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setFromDate('');
                setToDate('');
              }}
              className={styles.select}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(Number(e.target.value))}
            className={styles.select}
          >
            {statusOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`${styles.filterToggleBtn} ${showAdvancedFilters ? styles.filterToggleBtnActive : ''}`}
          >
            <FiFilter size={18} />
            {showAdvancedFilters ? 'Hide' : 'Show'} Filters
          </button>

          {(dateFilter || fromDate || toDate || searchInput || statusFilter !== -1) && (
            <button onClick={clearAllFilters} className={styles.clearBtn}>
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className={styles.advancedFilters}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setDateFilter('');
                }}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setDateFilter('');
                }}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.filterActions}>
              <button onClick={clearAllFilters} className={styles.filterClearBtn}>
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className={styles.searchWrapper}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search orders by patient name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className={styles.searchInput}
          />
          <button onClick={handleSearch} className={styles.searchIconBtn}>
            <FiSearch size={20} />
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Date Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.noData}>
                  {searchInput
                    ? 'No orders found matching your search.'
                    : 'No lab test orders found.'}
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <div className={styles.nameCell}>
                      <div className={styles.avatar}>
                        {order.patientName?.charAt(0).toUpperCase() || 'P'}
                      </div>
                      <div>
                        <div className={styles.name}>{order.patientName}</div>
                        <div className={styles.subText}>
                          {order.patientFileNo} • {order.patientMobile}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div className={styles.name}>{order.doctorFullName}</div>
                      <div className={styles.subText}>{order.doctorCode || '—'}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${getStatusBadgeClass(order.status)}`}>
                      {order.statusDesc}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${getPriorityBadgeClass(order.priority)}`}>
                      {order.priorityDesc}
                    </span>
                  </td>
                  <td>
                    <div className={styles.name}>{formatDate(order.dateCreated)}</div>
                  </td>
                  <td>
                    <div className={styles.actionsCell}>
                      <button
                        onClick={() => handleViewOrderDetails(order)}
                        className={styles.viewBtn}
                      >
                        <FiEye size={16} />
                        View
                      </button>
                      <button
                        onClick={() => handleMakeWorkClick(order)}
                        className={styles.makeWorkBtn}
                        disabled={order.status === 5 || order.status === 2}
                      >
                        Make Work
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {isOrderDetailsOpen && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setIsOrderDetailsOpen(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {isConfirmWorkOpen && selectedOrder && (
        <ConfirmMakeWorkModal
          order={selectedOrder}
          onClose={() => {
            setIsConfirmWorkOpen(false);
            setSelectedOrder(null);
          }}
          onConfirm={handleConfirmMakeWork}
        />
      )}
    </>
  );
};

export default OrderListTab;