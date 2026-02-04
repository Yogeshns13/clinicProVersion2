// src/components/LabWorkManagement/tabs/ReportsTab.jsx
import React, { useState, useEffect } from 'react';
import { FiSearch, FiFileText, FiAlertCircle } from 'react-icons/fi';
import { getLabTestOrderList } from '../../api/api-labtest.js';
import GenerateReportModal from '../modals/GenerateReportModal.jsx';
import styles from '../LabWorkManagement.module.css';

const ReportsTab = ({ workItems, employeeList, refreshWorkItems, setError, setLoading }) => {
  const [orders, setOrders] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [localLoading, setLocalLoading] = useState(true);

  // Modal States
  const [isGenerateReportOpen, setIsGenerateReportOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Fetch Completed Orders
  const fetchCompletedOrders = async () => {
    try {
      setLocalLoading(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const options = {
        Page: 1,
        PageSize: 100,
        BranchID: branchId,
        Status: 5 // Work in Progress status - orders with work items
      };

      if (searchInput.trim()) {
        options.PatientName = searchInput.trim();
      }

      const data = await getLabTestOrderList(clinicId, options);
      const sortedData = data.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
      setOrders(sortedData);
    } catch (err) {
      console.error('fetchCompletedOrders error:', err);
      setError(err);
    } finally {
      setLocalLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedOrders();
  }, []);

  const handleSearch = () => {
    fetchCompletedOrders();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchInput('');
    fetchCompletedOrders();
  };

  // Check if all work items for an order are approved
  const areAllWorkItemsApproved = (orderId) => {
    const orderWorkItems = workItems.filter(item => item.orderId === orderId);
    if (orderWorkItems.length === 0) return false;
    return orderWorkItems.every(item => item.status === 4); // Status 4 = Approved
  };

  // Get work item summary for an order
  const getWorkItemSummary = (orderId) => {
    const orderWorkItems = workItems.filter(item => item.orderId === orderId);
    const total = orderWorkItems.length;
    const approved = orderWorkItems.filter(item => item.status === 4).length;
    const pending = total - approved;

    return { total, approved, pending };
  };

  const handleGenerateReport = (order) => {
    setSelectedOrder(order);
    setIsGenerateReportOpen(true);
  };

  const handleReportSuccess = () => {
    fetchCompletedOrders();
    refreshWorkItems();
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

  if (localLoading) {
    return <div className={styles.loading}>Loading orders...</div>;
  }

  return (
    <>
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
        {searchInput && (
          <button onClick={clearSearch} className={styles.clearBtn} style={{ marginTop: '10px' }}>
            Clear Search
          </button>
        )}
      </div>

      {/* Info Banner */}
      <div className={styles.infoBanner}>
        <FiAlertCircle size={20} />
        <p>
          Reports can only be generated for orders where <strong>all work items are approved</strong>.
          Check the work item status before generating reports.
        </p>
      </div>

      {/* Orders Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Work Items Status</th>
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
                    : 'No orders with work items found.'}
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const allApproved = areAllWorkItemsApproved(order.id);
                const summary = getWorkItemSummary(order.id);

                return (
                  <tr key={order.id}>
                    <td>
                      <span className={styles.orderIdBadge}>#{order.id}</span>
                    </td>
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
                      <div className={styles.workItemStatusCell}>
                        <div className={styles.statusSummary}>
                          <span className={styles.totalBadge}>{summary.total} Total</span>
                          <span className={styles.approvedBadge}>{summary.approved} Approved</span>
                          {summary.pending > 0 && (
                            <span className={styles.pendingBadge}>{summary.pending} Pending</span>
                          )}
                        </div>
                        {allApproved ? (
                          <div className={styles.allApprovedIndicator}>
                            <FiFileText size={14} />
                            <span>Ready for Report</span>
                          </div>
                        ) : (
                          <div className={styles.notReadyIndicator}>
                            <FiAlertCircle size={14} />
                            <span>Not Ready</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={styles.name}>{formatDate(order.dateCreated)}</div>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          onClick={() => handleGenerateReport(order)}
                          className={styles.generateReportBtn}
                          disabled={!allApproved}
                        >
                          <FiFileText size={16} />
                          Generate Report
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Generate Report Modal */}
      {isGenerateReportOpen && selectedOrder && (
        <GenerateReportModal
          order={selectedOrder}
          employeeList={employeeList}
          onClose={() => {
            setIsGenerateReportOpen(false);
            setSelectedOrder(null);
          }}
          onSuccess={handleReportSuccess}
          setLoading={setLoading}
        />
      )}
    </>
  );
};

export default ReportsTab;