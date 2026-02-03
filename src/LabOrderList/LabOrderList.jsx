// src/components/LabWork.jsx
import React, { useState, useEffect } from 'react';
import { FiSearch, FiCalendar, FiFilter, FiEye, FiCheckCircle } from 'react-icons/fi';
import { 
  getLabTestOrderList, 
  updateLabTestOrder, 
  createWorkItemsForOrder,
  getLabWorkItemsList 
} from '../api/api-labtest.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './LabWork.module.css';

const LabWork = () => {
  // Tab State
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'workItems'

  // Data States
  const [orders, setOrders] = useState([]);
  const [workItems, setWorkItems] = useState([]);
  
  // Filter States
  const [searchInput, setSearchInput] = useState('');
  const todayDate = new Date().toISOString().split('T')[0];
  const [dateFilter, setDateFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState(-1);

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal States
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [isWorkDetailsOpen, setIsWorkDetailsOpen] = useState(false);
  const [isUpdateOrderOpen, setIsUpdateOrderOpen] = useState(false);
  const [isConfirmWorkOpen, setIsConfirmWorkOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedWorkItem, setSelectedWorkItem] = useState(null);

  // Status options for Lab Test Orders
  const statusOptions = [
    { id: -1, label: 'All Statuses' },
    { id: 1, label: 'Pending' },
    { id: 2, label: 'Completed' },
    { id: 3, label: 'Cancelled' },
    { id: 4, label: 'Invoice Processed' },
    { id: 5, label: 'Work in Progress' },
    { id: 6, label: 'External' }
  ];

  // Priority options
  const priorityOptions = [
    { id: 1, label: 'Normal' },
    { id: 2, label: 'Urgent' },
    { id: 3, label: 'STAT' }
  ];

  // Fetch Lab Test Orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const options = {
        Page: 1,
        PageSize: 100,
        BranchID: branchId,
        Status: statusFilter
      };

      // Apply search filter
      if (searchInput.trim()) {
        options.PatientName = searchInput.trim();
      }

      // Date filtering logic
      if (fromDate && toDate) {
        options.FromDate = fromDate;
        options.ToDate = toDate;
      } else if (dateFilter) {
        options.DateCreated = dateFilter;
      }

      const data = await getLabTestOrderList(clinicId, options);

      // Sort by date created (newest first)
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a.dateCreated);
        const dateB = new Date(b.dateCreated);
        return dateB - dateA;
      });

      setOrders(sortedData);
    } catch (err) {
      console.error('fetchOrders error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load lab test orders' }
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch Lab Work Items
  const fetchWorkItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const options = {
        Page: 1,
        PageSize: 100,
        BranchID: branchId,
        Status: statusFilter
      };

      // Apply search filter
      if (searchInput.trim()) {
        options.Search = searchInput.trim();
      }

      // Date filtering logic
      if (fromDate && toDate) {
        options.FromDate = fromDate;
        options.ToDate = toDate;
      }

      const data = await getLabWorkItemsList(clinicId, options);

      // Sort by date created (newest first)
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a.dateCreated);
        const dateB = new Date(b.dateCreated);
        return dateB - dateA;
      });

      setWorkItems(sortedData);
    } catch (err) {
      console.error('fetchWorkItems error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    } else {
      fetchWorkItems();
    }
  }, [activeTab]);

  // Handle search button click
  const handleSearch = () => {
    if (activeTab === 'orders') {
      fetchOrders();
    } else {
      fetchWorkItems();
    }
  };

  // Handle Enter key press in search input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchInput('');
    setDateFilter('');
    setFromDate('');
    setToDate('');
    setStatusFilter(-1);
    
    // Re-fetch with default filters
    if (activeTab === 'orders') {
      fetchOrders();
    } else {
      fetchWorkItems();
    }
  };

  // View Order Details
  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  };

  // View Work Item Details
  const handleViewWorkDetails = (workItem) => {
    setSelectedWorkItem(workItem);
    setIsWorkDetailsOpen(true);
  };

  // Open Update Order Modal
  const handleUpdateOrder = (order) => {
    setSelectedOrder(order);
    setIsUpdateOrderOpen(true);
  };

  // Open Confirm Make Work Modal
  const handleMakeWorkClick = (order) => {
    setSelectedOrder(order);
    setIsConfirmWorkOpen(true);
  };

  // Confirm and Create Work Items
  const handleConfirmMakeWork = async () => {
    if (!selectedOrder) return;

    try {
      setLoading(true);
      const clinicId = Number(localStorage.getItem('clinicID'));
      
      await createWorkItemsForOrder(selectedOrder.id, clinicId);
      
      setIsConfirmWorkOpen(false);
      setSelectedOrder(null);
      
      // Refresh orders list
      await fetchOrders();
      
      alert('Work items created successfully!');
    } catch (err) {
      console.error('Error creating work items:', err);
      alert(err.message || 'Failed to create work items');
    } finally {
      setLoading(false);
    }
  };

  // Handle Update Order Submit
  const handleUpdateOrderSubmit = async (orderData) => {
    try {
      setLoading(true);
      
      await updateLabTestOrder(orderData);
      
      setIsUpdateOrderOpen(false);
      setSelectedOrder(null);
      
      // Refresh orders list
      await fetchOrders();
      
      alert('Order updated successfully!');
    } catch (err) {
      console.error('Error updating order:', err);
      alert(err.message || 'Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  // Formatting functions
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 1: return styles.statusPending;
      case 2: return styles.statusCompleted;
      case 3: return styles.statusCancelled;
      case 4: return styles.statusInvoiced;
      case 5: return styles.statusInProgress;
      case 6: return styles.statusExternal;
      default: return styles.statusPending;
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch(priority) {
      case 1: return styles.priorityNormal;
      case 2: return styles.priorityUrgent;
      case 3: return styles.priorityStat;
      default: return styles.priorityNormal;
    }
  };

  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading && !isOrderDetailsOpen && !isWorkDetailsOpen && !isUpdateOrderOpen) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Lab Work Management" />

      {/* Tab Navigation */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'orders' ? styles.active : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <FiCheckCircle size={18} />
          Lab Order List
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'workItems' ? styles.active : ''}`}
          onClick={() => setActiveTab('workItems')}
        >
          <FiEye size={18} />
          Work List
        </button>
      </div>

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
            className={`${styles.filterToggleBtn} ${showAdvancedFilters ? styles.active : ''}`}
          >
            <FiFilter size={18} />
            {showAdvancedFilters ? 'Hide' : 'Show'} Filters
          </button>

          {(dateFilter || fromDate || toDate || searchInput || statusFilter !== -1) && (
            <button 
              onClick={clearAllFilters} 
              className={styles.clearBtn}
            >
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
            placeholder={
              activeTab === 'orders'
                ? 'Search orders by patient name...'
                : 'Search work items...'
            }
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className={styles.searchInput}
          />
          <button onClick={handleSearch} className={styles.searchBtn}>
            <FiSearch size={20} />
          </button>
        </div>
      </div>

      {/* Lab Order List Table */}
      {activeTab === 'orders' && (
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
                  <td colSpan={7} className={styles.noData}>
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
                          <div className={styles.type}>
                            {order.patientFileNo} • {order.patientMobile}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className={styles.name}>{order.doctorFullName}</div>
                        <div className={styles.type}>{order.doctorCode || '—'}</div>
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
      )}

      {/* Work List Table */}
      {activeTab === 'workItems' && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Test Name</th>
                <th>Result</th>
                <th>Status</th>
                <th>Date Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.noData}>
                    {searchInput
                      ? 'No work items found matching your search.'
                      : 'No work items found.'}
                  </td>
                </tr>
              ) : (
                workItems.map((item) => (
                  <tr key={item.workId}>
                    <td>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar}>
                          {item.patientName?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        <div>
                          <div className={styles.name}>{item.patientName}</div>
                          <div className={styles.type}>
                            {item.fileNo} • {item.mobile}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.name}>{item.testName}</div>
                      <div className={styles.type}>ID: {item.testId}</div>
                    </td>
                    <td>
                      <div className={styles.name}>
                        {item.resultValue || '—'} {item.resultUnits || ''}
                      </div>
                      <div className={styles.type}>{item.normalRange || '—'}</div>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${getStatusBadgeClass(item.status)}`}>
                        {statusOptions.find(s => s.id === item.status)?.label || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.name}>{formatDate(item.dateCreated)}</div>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          onClick={() => handleViewWorkDetails(item)}
                          className={styles.viewBtn}
                        >
                          <FiEye size={16} />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Details Modal */}
      {isOrderDetailsOpen && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setIsOrderDetailsOpen(false);
            setSelectedOrder(null);
          }}
          onUpdate={() => {
            setIsOrderDetailsOpen(false);
            handleUpdateOrder(selectedOrder);
          }}
        />
      )}

      {/* Work Item Details Modal */}
      {isWorkDetailsOpen && selectedWorkItem && (
        <WorkItemDetailsModal
          workItem={selectedWorkItem}
          onClose={() => {
            setIsWorkDetailsOpen(false);
            setSelectedWorkItem(null);
          }}
        />
      )}

      {/* Update Order Modal */}
      {isUpdateOrderOpen && selectedOrder && (
        <UpdateOrderModal
          order={selectedOrder}
          statusOptions={statusOptions}
          priorityOptions={priorityOptions}
          onClose={() => {
            setIsUpdateOrderOpen(false);
            setSelectedOrder(null);
          }}
          onSubmit={handleUpdateOrderSubmit}
        />
      )}

      {/* Confirm Make Work Modal */}
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
    </div>
  );
};

// Order Details Modal Component
const OrderDetailsModal = ({ order, onClose, onUpdate }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Order Details</h2>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <label>Order ID:</label>
              <span>#{order.id}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Unique Seq:</label>
              <span>{order.uniqueSeq}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Patient Name:</label>
              <span>{order.patientName}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Patient File No:</label>
              <span>{order.patientFileNo}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Patient Mobile:</label>
              <span>{order.patientMobile}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Doctor:</label>
              <span>{order.doctorFullName} ({order.doctorCode})</span>
            </div>
            <div className={styles.detailItem}>
              <label>Clinic:</label>
              <span>{order.clinicName}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Branch:</label>
              <span>{order.branchName}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Status:</label>
              <span>{order.statusDesc}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Priority:</label>
              <span>{order.priorityDesc}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Consultation ID:</label>
              <span>{order.consultationId || '—'}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Visit ID:</label>
              <span>{order.visitId || '—'}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Date Created:</label>
              <span>{new Date(order.dateCreated).toLocaleString()}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Date Modified:</label>
              <span>{new Date(order.dateModified).toLocaleString()}</span>
            </div>
            <div className={styles.detailItemFull}>
              <label>Notes:</label>
              <span>{order.notes || 'No notes'}</span>
            </div>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onUpdate} className={styles.updateBtn}>
            Update Order
          </button>
          <button onClick={onClose} className={styles.cancelBtn}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Work Item Details Modal Component
const WorkItemDetailsModal = ({ workItem, onClose }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Work Item Details</h2>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <label>Work ID:</label>
              <span>#{workItem.workId}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Order ID:</label>
              <span>#{workItem.orderId}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Item ID:</label>
              <span>{workItem.itemId}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Patient Name:</label>
              <span>{workItem.patientName}</span>
            </div>
            <div className={styles.detailItem}>
              <label>File No:</label>
              <span>{workItem.fileNo || '—'}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Mobile:</label>
              <span>{workItem.mobile || '—'}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Test Name:</label>
              <span>{workItem.testName}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Test ID:</label>
              <span>{workItem.testId}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Result Value:</label>
              <span>{workItem.resultValue || '—'}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Result Units:</label>
              <span>{workItem.resultUnits || '—'}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Normal Range:</label>
              <span>{workItem.normalRange || '—'}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Interpretation:</label>
              <span>{workItem.interpretation || '—'}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Sample Collected:</label>
              <span>{workItem.sampleCollectedTime ? new Date(workItem.sampleCollectedTime).toLocaleString() : '—'}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Collection Place:</label>
              <span>{workItem.sampleCollectedPlace || '—'}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Result Entered:</label>
              <span>{workItem.resultEnteredTime ? new Date(workItem.resultEnteredTime).toLocaleString() : '—'}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Technician:</label>
              <span>{workItem.technicianName || '—'}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Approver:</label>
              <span>{workItem.approverName || '—'}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Doctor:</label>
              <span>{workItem.doctorName || '—'}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Date Created:</label>
              <span>{workItem.dateCreated ? new Date(workItem.dateCreated).toLocaleString() : '—'}</span>
            </div>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.cancelBtn}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Update Order Modal Component
const UpdateOrderModal = ({ order, statusOptions, priorityOptions, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    status: order.status,
    priority: order.priority,
    notes: order.notes || '',
    fileId: order.fileId || 0,
    testApprovedBy: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const clinicId = Number(localStorage.getItem('clinicID'));
    const branchId = Number(localStorage.getItem('branchID'));
    
    const orderData = {
      orderId: order.id,
      clinicId: clinicId,
      branchId: branchId,
      status: formData.status,
      priority: formData.priority,
      notes: formData.notes,
      fileId: formData.fileId,
      testApprovedBy: formData.testApprovedBy
    };
    
    onSubmit(orderData);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Update Order #{order.id}</h2>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: Number(e.target.value)})}
                  className={styles.formInput}
                  required
                >
                  {statusOptions.filter(s => s.id !== -1).map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Priority *</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: Number(e.target.value)})}
                  className={styles.formInput}
                  required
                >
                  {priorityOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroupFull}>
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className={styles.formTextarea}
                  rows={4}
                  placeholder="Enter any notes..."
                />
              </div>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="submit" className={styles.updateBtn}>
              Update Order
            </button>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Confirm Make Work Modal Component
const ConfirmMakeWorkModal = ({ order, onClose, onConfirm }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Confirm Create Work Items</h2>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>
        <div className={styles.modalBody}>
          <p>Are you sure you want to create work items for Order #{order.id}?</p>
          <p className={styles.confirmDetails}>
            Patient: <strong>{order.patientName}</strong><br />
            Doctor: <strong>{order.doctorFullName}</strong>
          </p>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onConfirm} className={styles.confirmBtn}>
            Yes, Create Work Items
          </button>
          <button onClick={onClose} className={styles.cancelBtn}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabWork;