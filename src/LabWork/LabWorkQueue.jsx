// src/components/LabWork/LabWorkQueue.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSearch, FiCalendar, FiFilter, FiChevronDown, FiChevronRight, 
  FiClock, FiCheckCircle, FiAlertCircle, FiPackage, FiActivity, FiX,
  FiSave, FiXCircle, FiUser, FiFileText
} from 'react-icons/fi';
import { 
  getLabWorkItemsList, 
  updateSampleCollection,
  updateLabWorkItemResult,
  approveLabWorkItem,
  rejectLabWorkItem,
  getLabTestOrderList,
  updateLabTestOrder
} from '../api/api-labtest.js';
import { getEmployeeList } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './LabWorkQueue.module.css';
import detailStyles from './LabWorkDetail.module.css';

const LabWorkQueue = () => {
  const navigate = useNavigate();
  
  // Data States
  const [workItems, setWorkItems] = useState([]);
  const [groupedWorkItems, setGroupedWorkItems] = useState({});
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [doctors, setDoctors] = useState([]);
  
  // ORDER STATUS TRACKING - NEW: Store actual order statuses from API
  const [orderStatuses, setOrderStatuses] = useState({});
  
  // Filter inputs (not applied until search)
  const [filterInputs, setFilterInputs] = useState({
    searchType: 'patientName',
    searchValue: '',
    status: -1,
    doctorId: 0,
    dateFrom: '',
    dateTo: ''
  });

  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState({
    searchType: 'patientName',
    searchValue: '',
    status: -1,
    doctorId: 0,
    dateFrom: '',
    dateTo: ''
  });

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Work Detail Modal States
  const [showWorkDetailModal, setShowWorkDetailModal] = useState(false);
  const [selectedWorkItem, setSelectedWorkItem] = useState(null);
  const [selectedOrderData, setSelectedOrderData] = useState(null);

  // Mark as Complete States
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [orderToComplete, setOrderToComplete] = useState(null);
  const [completingOrder, setCompletingOrder] = useState(false);

  // Status options
  const statusOptions = [
    { id: -1, label: 'All Statuses', color: 'default' },
    { id: 1, label: 'Pending', color: 'warning' },
    { id: 2, label: 'In Progress', color: 'progress' },
    { id: 3, label: 'Completed', color: 'success' },
    { id: 4, label: 'Rejected', color: 'danger' }
  ];

  // Fetch Doctors List
  const fetchDoctors = async () => {
    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      
      const options = {
        Page: 1,
        PageSize: 100,
        BranchID: branchId,
        Designation: 1,
        Status: 1
      };
      
      const employeeList = await getEmployeeList(clinicId, options);
      setDoctors(employeeList);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    }
  };

  // NEW: Fetch order statuses for all unique order IDs
  const fetchOrderStatuses = async (orderIds) => {
    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      
      const statusesMap = {};
      
      // Fetch status for each unique order ID
      for (const orderId of orderIds) {
        try {
          const orderDetails = await getLabTestOrderList(clinicId, {
            OrderID: orderId,
            BranchID: branchId
          });
          
          if (orderDetails && orderDetails.length > 0) {
            statusesMap[orderId] = orderDetails[0].status;
          }
        } catch (err) {
          console.error(`Failed to fetch status for order ${orderId}:`, err);
        }
      }
      
      setOrderStatuses(statusesMap);
    } catch (err) {
      console.error('Failed to fetch order statuses:', err);
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
        Status: appliedFilters.status
      };

      // Apply search based on search type
      if (appliedFilters.searchValue.trim()) {
        const searchTerm = appliedFilters.searchValue.trim();
        
        switch (appliedFilters.searchType) {
          case 'orderId':
            options.OrderID = Number(searchTerm) || 0;
            break;
          default:
            options.Search = searchTerm;
            break;
        }
      }

      if (appliedFilters.doctorId > 0) {
        options.DoctorID = appliedFilters.doctorId;
      }

      if (appliedFilters.dateFrom && appliedFilters.dateTo) {
        options.FromDate = appliedFilters.dateFrom;
        options.ToDate = appliedFilters.dateTo;
      }

      const data = await getLabWorkItemsList(clinicId, options);

      // Additional client-side filtering for non-API supported searches
      let filteredData = data;
      
      if (appliedFilters.searchValue.trim() && appliedFilters.searchType !== 'orderId') {
        const term = appliedFilters.searchValue.toLowerCase();
        
        switch (appliedFilters.searchType) {
          case 'patientName':
            filteredData = filteredData.filter(item => 
              item.patientName?.toLowerCase().includes(term)
            );
            break;
          case 'mobile':
            filteredData = filteredData.filter(item => 
              item.mobile?.toLowerCase().includes(term)
            );
            break;
          case 'fileNo':
            filteredData = filteredData.filter(item => 
              item.fileNo?.toLowerCase().includes(term)
            );
            break;
          case 'testName':
            filteredData = filteredData.filter(item => 
              item.testName?.toLowerCase().includes(term)
            );
            break;
          default:
            break;
        }
      }

      const sortedData = filteredData.sort((a, b) => {
        const dateA = new Date(a.dateCreated);
        const dateB = new Date(b.dateCreated);
        return dateB - dateA;
      });

      setWorkItems(sortedData);
      
      // Group by OrderID
      const grouped = sortedData.reduce((acc, item) => {
        const orderId = item.orderId;
        if (!acc[orderId]) {
          acc[orderId] = {
            orderId: orderId,
            patientName: item.patientName,
            fileNo: item.fileNo,
            mobile: item.mobile,
            doctorName: item.doctorName,
            dateCreated: item.dateCreated,
            items: []
          };
        }
        acc[orderId].items.push(item);
        return acc;
      }, {});

      setGroupedWorkItems(grouped);
      
      // NEW: Fetch order statuses for all orders
      const uniqueOrderIds = Object.keys(grouped).map(Number);
      if (uniqueOrderIds.length > 0) {
        await fetchOrderStatuses(uniqueOrderIds);
      }
      
      if (Object.keys(grouped).length === 1) {
        setExpandedOrders(new Set([Number(Object.keys(grouped)[0])]));
      }
    } catch (err) {
      console.error('fetchWorkItems error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkItems();
    fetchDoctors();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filterInputs });
    fetchWorkItems();
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      searchType: 'patientName',
      searchValue: '',
      status: -1,
      doctorId: 0,
      dateFrom: '',
      dateTo: ''
    };
    setFilterInputs(emptyFilters);
    setAppliedFilters(emptyFilters);
    setTimeout(() => fetchWorkItems(), 100);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleOrderExpansion = (orderId) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const expandAll = () => {
    const allOrderIds = Object.keys(groupedWorkItems).map(Number);
    setExpandedOrders(new Set(allOrderIds));
  };

  const collapseAll = () => {
    setExpandedOrders(new Set());
  };

  const getOrderStatus = (items) => {
    const statuses = items.map(item => item.status);
    
    if (statuses.every(s => s === 3)) return { status: 3, label: 'All Completed', color: 'success' };
    if (statuses.some(s => s === 2)) return { status: 2, label: 'In Progress', color: 'progress' };
    if (statuses.some(s => s === 1)) return { status: 1, label: 'Pending', color: 'warning' };
    if (statuses.some(s => s === 4)) return { status: 4, label: 'Rejected', color: 'danger' };
    
    return { status: -1, label: 'Mixed', color: 'default' };
  };

  const getStatusBadgeClass = (color) => {
    return styles[`status${color}`] || styles.statusDefault;
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

  const formatTime = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getProgressColors = (percentage) => {
    if (percentage === 100) {
      return {
        gradient: 'linear-gradient(90deg, #207d9c, #30b2b5)',
        textColor: '#30b2b5'
      };
    } else if (percentage >= 71) {
      return {
        gradient: 'linear-gradient(90deg, #16a34a, #22c55e)',
        textColor: '#16a34a'
      };
    } else if (percentage >= 31) {
      return {
        gradient: 'linear-gradient(90deg, #eab308, #fbbf24)',
        textColor: '#eab308'
      };
    } else {
      return {
        gradient: 'linear-gradient(90deg, #dc2626, #ef4444)',
        textColor: '#dc2626'
      };
    }
  };

  const isOrderFullyCompleted = (items) => {
    return items.every(item => item.status === 3);
  };

  // NEW: Check if order should show as completed
  // Shows "Completed" badge when:
  // 1. All work items are status 3 (completed) AND
  // 2. Order status is 2 (marked as complete)
  const isOrderMarkedComplete = (orderId, items) => {
    const allWorkItemsCompleted = items.every(item => item.status === 3);
    const orderStatus = orderStatuses[orderId];
    return allWorkItemsCompleted && orderStatus === 2;
  };

  // NEW: Check if order should show "Mark as Complete" button
  // Shows button when:
  // 1. All work items are status 3 (completed) AND
  // 2. Order status is NOT 2 (not yet marked as complete)
  const shouldShowMarkCompleteButton = (orderId, items) => {
    const allWorkItemsCompleted = items.every(item => item.status === 3);
    const orderStatus = orderStatuses[orderId];
    return allWorkItemsCompleted && orderStatus !== 2;
  };

  // Handle Process Button Click
  const handleProcessWorkItem = (item, orderData) => {
    setSelectedWorkItem(item);
    setSelectedOrderData(orderData);
    setShowWorkDetailModal(true);
  };

  // Handle Work Detail Modal Close
  const handleCloseWorkDetail = () => {
    setShowWorkDetailModal(false);
    setSelectedWorkItem(null);
    setSelectedOrderData(null);
    fetchWorkItems();
  };

  // Handle Work Detail Save
  const handleSaveWorkDetail = () => {
    // This will be called from child to notify parent
  };

  // Handle Mark as Complete Click
  const handleMarkCompleteClick = (orderId, orderData) => {
    setOrderToComplete({ orderId, orderData });
    setShowCompleteConfirm(true);
  };

  // Handle Confirm Mark as Complete
  const handleConfirmMarkComplete = async () => {
    if (!orderToComplete) return;

    try {
      setCompletingOrder(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      // Fetch order details to get fileId, priority, notes, and doctorId
      const orderDetails = await getLabTestOrderList(clinicId, {
        OrderID: orderToComplete.orderId,
        BranchID: branchId
      });

      if (!orderDetails || orderDetails.length === 0) {
        throw new Error('Order details not found');
      }

      const orderDetail = orderDetails[0];

      // Prepare update data
      const updateData = {
        orderId: orderToComplete.orderId,
        clinicId: clinicId,
        branchId: branchId,
        status: 2, // Status 2 as requested
        fileId: orderDetail.fileId || 0,
        priority: orderDetail.priority || 1,
        notes: orderDetail.notes || '',
        testApprovedBy: orderDetail.doctorId || 0
      };

      // Call update API
      await updateLabTestOrder(updateData);

      // NEW: Update local order status state immediately
      setOrderStatuses(prev => ({
        ...prev,
        [orderToComplete.orderId]: 2
      }));

      // Close confirmation modal
      setShowCompleteConfirm(false);
      setOrderToComplete(null);

      // Refresh work items (this will also refresh order statuses)
      await fetchWorkItems();

    } catch (err) {
      console.error('Error marking order as complete:', err);
      setError({
        message: err.message || 'Failed to mark order as complete',
        status: err.status || 500
      });
    } finally {
      setCompletingOrder(false);
    }
  };

  // Handle Cancel Mark Complete
  const handleCancelMarkComplete = () => {
    setShowCompleteConfirm(false);
    setOrderToComplete(null);
  };

  const totalOrders = Object.keys(groupedWorkItems).length;
  const totalWorkItems = workItems.length;
  const pendingItems = workItems.filter(item => item.status === 1).length;
  const inProgressItems = workItems.filter(item => item.status === 2).length;
  const completedItems = workItems.filter(item => item.status === 3).length;

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading work queue...</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Lab Work Queue" />

      {/* Quick Stats */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #207d9c, #30b2b5)' }}>
            <FiPackage size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{totalOrders}</div>
            <div className={styles.statLabel}>Total Orders</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #eab308, #ca8a04)' }}>
            <FiClock size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{pendingItems}</div>
            <div className={styles.statLabel}>Pending Tests</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)' }}>
            <FiActivity size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{inProgressItems}</div>
            <div className={styles.statLabel}>In Progress</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
            <FiCheckCircle size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{completedItems}</div>
            <div className={styles.statLabel}>Completed</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>
          <div className={styles.searchGroup}>
            <select
              name="searchType"
              value={filterInputs.searchType}
              onChange={handleFilterChange}
              className={styles.searchTypeSelect}
            >
              <option value="patientName">Patient Name</option>
              <option value="mobile">Mobile</option>
              <option value="fileNo">File No</option>
              <option value="orderId">Order ID</option>
              <option value="testName">Test Name</option>
            </select>
            
            <input
              type="text"
              name="searchValue"
              placeholder={`Search by ${
                filterInputs.searchType === 'patientName' ? 'Patient Name' :
                filterInputs.searchType === 'mobile' ? 'Mobile' :
                filterInputs.searchType === 'fileNo' ? 'File No' :
                filterInputs.searchType === 'orderId' ? 'Order ID' :
                'Test Name'
              }`}
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyPress={handleKeyPress}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <select
              name="status"
              value={filterInputs.status}
              onChange={handleFilterChange}
              className={styles.filterInput}
            >
              {statusOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <select
              name="doctorId"
              value={filterInputs.doctorId}
              onChange={handleFilterChange}
              className={styles.filterInput}
            >
              <option value={0}>All Doctors</option>
              {doctors.map(doc => (
                <option key={doc.id} value={doc.id}>
                  {doc.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <input
              type="date"
              name="dateFrom"
              value={filterInputs.dateFrom}
              onChange={handleFilterChange}
              className={styles.filterInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <input
              type="date"
              name="dateTo"
              value={filterInputs.dateTo}
              onChange={handleFilterChange}
              className={styles.filterInput}
            />
          </div>

          <div className={styles.filterActions}>
            <button onClick={handleSearch} className={styles.searchButton}>
              <FiSearch size={18} />
              Search
            </button>
            <button onClick={handleClearFilters} className={styles.clearButton}>
              <FiX size={18} />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button onClick={expandAll} className={styles.expandBtn}>
            <FiChevronDown size={18} />
            Expand All
          </button>

          <button onClick={collapseAll} className={styles.collapseBtn}>
            <FiChevronRight size={18} />
            Collapse All
          </button>
        </div>

        <div className={styles.toolbarRight}>
          <button 
            onClick={() => navigate('/laborder-list')}
            className={styles.workQueueBtn}
          >
            <FiAlertCircle size={18} />
            Go to Orders
          </button>
        </div>
      </div>

      {/* Grouped Work Items */}
      <div className={styles.workQueueContainer}>
        {Object.keys(groupedWorkItems).length === 0 ? (
          <div className={styles.noData}>
            {Object.values(appliedFilters).some(v => v && v !== 'patientName' && v !== -1 && v !== 0)
              ? 'No work items found matching your filters.'
              : 'No work items found.'}
          </div>
        ) : (
          Object.entries(groupedWorkItems).map(([orderId, orderData]) => {
            const isExpanded = expandedOrders.has(Number(orderId));
            const orderStatus = getOrderStatus(orderData.items);
            const completedCount = orderData.items.filter(item => item.status === 3).length;
            const totalCount = orderData.items.length;
            const progressPercentage = Math.round((completedCount / totalCount) * 100);
            const progressColors = getProgressColors(progressPercentage);
            
            // NEW: Use new helper functions to determine button/badge display
            const showMarkCompleteBtn = shouldShowMarkCompleteButton(Number(orderId), orderData.items);
            const showCompletedBadge = isOrderMarkedComplete(Number(orderId), orderData.items);

            return (
              <div key={orderId} className={styles.orderGroup}>
                <div 
                  className={styles.orderHeader}
                  onClick={() => toggleOrderExpansion(Number(orderId))}
                >
                  <div className={styles.orderHeaderLeft}>
                    <button className={styles.expandIcon}>
                      {isExpanded ? <FiChevronDown size={20} /> : <FiChevronRight size={20} />}
                    </button>
                    
                    <div className={styles.orderInfo}>
                      <div className={styles.orderMeta}>
                        <div className={styles.patientInfo}>
                          <div className={styles.avatar}>
                            {orderData.patientName?.charAt(0).toUpperCase() || 'P'}
                          </div>
                          <div>
                            <div className={styles.patientName}>{orderData.patientName}</div>
                            <div className={styles.patientDetails}>
                              {orderData.fileNo} • {orderData.mobile}
                            </div>
                          </div>
                        </div>
                        
                        <div className={styles.orderStats}>
                          <div className={styles.statItem}>
                            <FiActivity size={14} />
                            <span>{totalCount} Tests</span>
                          </div>
                          <div className={styles.statItem}>
                            <FiCheckCircle size={14} />
                            <span>{completedCount} / {totalCount} Completed</span>
                          </div>
                          <div className={styles.statItem}>
                            <FiCalendar size={14} />
                            <span>{formatDate(orderData.dateCreated)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.orderHeaderRight}>
                    <div className={styles.progressContainer}>
                      <div className={styles.progressBar}>
                        <div 
                          className={styles.progressFill}
                          style={{ 
                            width: `${progressPercentage}%`,
                            background: progressColors.gradient
                          }}
                        />
                      </div>
                      <div 
                        className={styles.progressText}
                        style={{ color: progressColors.textColor }}
                      >
                        {progressPercentage}%
                      </div>
                    </div>

                    {/* Mark as Complete Button - Shows when all work items are complete but order not marked */}
                    {showMarkCompleteBtn && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkCompleteClick(Number(orderId), orderData);
                        }}
                        className={styles.markCompleteBtn}
                      >
                        <FiCheckCircle size={18} />
                        Mark as Complete
                      </button>
                    )}

                    {/* Completed Badge - Shows when all work items are complete AND order is marked */}
                    {showCompletedBadge && (
                      <div className={styles.completedBadge}>
                        <FiCheckCircle size={18} />
                        Completed
                      </div>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className={styles.workItemsList}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Test Name</th>
                          <th>Result</th>
                          <th>Sample Collection</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderData.items.map((item) => (
                          <tr key={item.workId} className={styles.workItemRow}>
                            <td>
                              <div>
                                <div className={styles.testName}>{item.testName}</div>
                              </div>
                            </td>
                            <td>
                              <div className={styles.resultCell}>
                                {item.resultValue ? (
                                  <>
                                    <div className={styles.resultValue}>
                                      {item.resultValue} {item.resultUnits || ''}
                                    </div>
                                    <div className={styles.normalRange}>
                                      Range: {item.normalRange || 'N/A'}
                                    </div>
                                  </>
                                ) : (
                                  <span className={styles.noResult}>Not entered</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className={styles.sampleCell}>
                                {item.sampleCollectedTime ? (
                                  <>
                                    <div className={styles.sampleTime}>
                                      <FiClock size={12} />
                                      {formatDate(item.sampleCollectedTime)} {formatTime(item.sampleCollectedTime)}
                                    </div>
                                    <div className={styles.samplePlace}>
                                      {item.sampleCollectedPlace || 'Not specified'}
                                    </div>
                                  </>
                                ) : (
                                  <span className={styles.noSample}>Not collected</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className={`${styles.badge} ${getStatusBadgeClass(
                                statusOptions.find(s => s.id === item.status)?.color || 'default'
                              )}`}>
                                {statusOptions.find(s => s.id === item.status)?.label || 'Unknown'}
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProcessWorkItem(item, orderData);
                                }}
                                className={styles.processBtn}
                              >
                                Process
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Work Detail Modal */}
      {showWorkDetailModal && selectedWorkItem && selectedOrderData && (
        <LabWorkDetailModal
          workItem={selectedWorkItem}
          orderData={selectedOrderData}
          onClose={handleCloseWorkDetail}
          onSave={handleSaveWorkDetail}
          employees={doctors}
        />
      )}

      {/* Mark as Complete Confirmation Modal */}
      {showCompleteConfirm && orderToComplete && (
        <div className={styles.modalOverlay} onClick={handleCancelMarkComplete}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmHeader}>
              <h3>Mark Order as Complete</h3>
              <button onClick={handleCancelMarkComplete} className={styles.closeBtn} disabled={completingOrder}>
                <FiX size={20} />
              </button>
            </div>
            <div className={styles.confirmBody}>
              <p>Are you sure you want to mark this order as complete?</p>
              <p><strong>Order ID:</strong> #{orderToComplete.orderId}</p>
              <p><strong>Patient:</strong> {orderToComplete.orderData.patientName}</p>
              <p className={styles.confirmSubtext}>This will update the order status to "In Progress".</p>
            </div>
            <div className={styles.confirmFooter}>
              <button onClick={handleCancelMarkComplete} className={styles.cancelBtn} disabled={completingOrder}>
                Cancel
              </button>
              <button onClick={handleConfirmMarkComplete} className={styles.confirmBtn} disabled={completingOrder}>
                <FiCheckCircle size={18} />
                {completingOrder ? 'Processing...' : 'Yes, Mark Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Lab Work Detail Modal Component - Keeping the same as before
const LabWorkDetailModal = ({ workItem, orderData, onClose, onSave, employees }) => {
  const [sampleData, setSampleData] = useState({
    sampleCollectedTime: workItem.sampleCollectedTime 
      ? new Date(workItem.sampleCollectedTime).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    sampleCollectedPlace: workItem.sampleCollectedPlace || ''
  });

  const [resultData, setResultData] = useState({
    resultValue: workItem.resultValue || '',
    resultUnits: workItem.resultUnits || '',
    normalRange: workItem.normalRange || '',
    interpretation: workItem.interpretation || null,
    remarks: '',
    testDoneBy: 0
  });

  const [approvalData, setApprovalData] = useState({
    testApprovedBy: 0,
    approvalRemarks: ''
  });

  const [rejectionData, setRejectionData] = useState({
    testApprovedBy: 0,
    rejectReason: ''
  });

  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const interpretationOptions = [
    { value: null, label: 'Not specified' },
    { value: 1, label: 'Normal' },
    { value: 2, label: 'Abnormal - High' },
    { value: 3, label: 'Abnormal - Low' },
    { value: 4, label: 'Critical' }
  ];

  useEffect(() => {
    let initialStep = 1;
    if (!workItem.sampleCollectedTime) {
      initialStep = 1;
    } else if (!workItem.resultValue) {
      initialStep = 2;
    } else {
      initialStep = 3;
    }
    setActiveStep(initialStep);
  }, []);

  const handleSampleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setStatusMessage({ type: '', text: '' });

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const formattedDateTime = sampleData.sampleCollectedTime.replace('T', ' ') + ':00';

      await updateSampleCollection({
        workId: workItem.workId,
        clinicId,
        branchId,
        sampleCollectedTime: formattedDateTime,
        sampleCollectedPlace: sampleData.sampleCollectedPlace
      });

      setStatusMessage({ type: 'success', text: 'Sample collection details saved successfully!' });
      
      setTimeout(() => {
        setActiveStep(2);
        setStatusMessage({ type: '', text: '' });
      }, 1000);
      
    } catch (err) {
      console.error('Error saving sample collection:', err);
      setError(err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save sample collection' });
    } finally {
      setLoading(false);
    }
  };

  const handleResultSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setStatusMessage({ type: '', text: '' });

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      await updateLabWorkItemResult({
        workId: workItem.workId,
        clinicId,
        branchId,
        resultValue: resultData.resultValue,
        resultUnits: resultData.resultUnits,
        normalRange: resultData.normalRange,
        interpretation: resultData.interpretation,
        remarks: resultData.remarks,
        testDoneBy: resultData.testDoneBy
      });

      setStatusMessage({ type: 'success', text: 'Test results saved successfully!' });
      
      setTimeout(() => {
        setActiveStep(3);
        setStatusMessage({ type: '', text: '' });
      }, 1000);
      
    } catch (err) {
      console.error('Error saving results:', err);
      setError(err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save results' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      if (!approvalData.testApprovedBy) {
        setStatusMessage({ type: 'error', text: 'Please select an approver' });
        return;
      }

      setLoading(true);
      setError(null);
      setStatusMessage({ type: '', text: '' });

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      await approveLabWorkItem({
        workId: workItem.workId,
        clinicId,
        branchId,
        testApprovedBy: approvalData.testApprovedBy,
        approvalRemarks: approvalData.approvalRemarks
      });

      setStatusMessage({ type: 'success', text: 'Work item approved successfully!' });
      
      setTimeout(() => {
        setShowApprovalModal(false);
        onClose && onClose();
      }, 1000);
      
    } catch (err) {
      console.error('Error approving work item:', err);
      setError(err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to approve work item' });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      if (!rejectionData.testApprovedBy) {
        setStatusMessage({ type: 'error', text: 'Please select an approver' });
        return;
      }

      if (!rejectionData.rejectReason.trim()) {
        setStatusMessage({ type: 'error', text: 'Please provide a reason for rejection' });
        return;
      }

      setLoading(true);
      setError(null);
      setStatusMessage({ type: '', text: '' });

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      await rejectLabWorkItem({
        WorkID: workItem.workId,
        clinicId,
        branchID: branchId,
        TestApprovedBy: rejectionData.testApprovedBy,
        RejectReason: rejectionData.rejectReason
      });

      setStatusMessage({ type: 'success', text: 'Work item rejected successfully!' });
      
      setTimeout(() => {
        setShowRejectionModal(false);
        onClose && onClose();
      }, 1000);
      
    } catch (err) {
      console.error('Error rejecting work item:', err);
      setError(err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to reject work item' });
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (step) => {
    if (step < activeStep) return 'completed';
    if (step === activeStep) return 'active';
    return 'pending';
  };

  return (
    <div className={detailStyles.modalOverlay} onClick={onClose}>
      <div className={detailStyles.modalContent} onClick={(e) => e.stopPropagation()}>
        <ErrorHandler error={error} />
        
        <div className={detailStyles.modalHeader}>
          <div className={detailStyles.headerContent}>
            <h2>Process Lab Work Item</h2>
            <div className={detailStyles.headerMeta}>
              <span className={detailStyles.workIdBadge}>Work ID: #{workItem.workId}</span>
              <span className={detailStyles.orderIdBadge}>Order ID: #{workItem.orderId}</span>
            </div>
          </div>
          <button onClick={onClose} className={detailStyles.closeBtn}>
            <FiX size={24} />
          </button>
        </div>

        {statusMessage.text && (
          <div className={`${detailStyles.statusMessage} ${detailStyles[statusMessage.type]}`}>
            {statusMessage.text}
          </div>
        )}

        <div className={detailStyles.infoSection}>
          <div className={detailStyles.infoCard}>
            <div className={detailStyles.infoHeader}>
              <FiUser size={18} />
              <h3>Patient Information</h3>
            </div>
            <div className={detailStyles.infoContent}>
              <div className={detailStyles.infoRow}>
                <span className={detailStyles.infoLabel}>Name:</span>
                <span className={detailStyles.infoValue}>{orderData.patientName}</span>
              </div>
              <div className={detailStyles.infoRow}>
                <span className={detailStyles.infoLabel}>File No:</span>
                <span className={detailStyles.infoValue}>{orderData.fileNo}</span>
              </div>
              <div className={detailStyles.infoRow}>
                <span className={detailStyles.infoLabel}>Mobile:</span>
                <span className={detailStyles.infoValue}>{orderData.mobile}</span>
              </div>
            </div>
          </div>

          <div className={detailStyles.infoCard}>
            <div className={detailStyles.infoHeader}>
              <FiActivity size={18} />
              <h3>Test Information</h3>
            </div>
            <div className={detailStyles.infoContent}>
              <div className={detailStyles.infoRow}>
                <span className={detailStyles.infoLabel}>Test Name:</span>
                <span className={detailStyles.infoValue}>{workItem.testName}</span>
              </div>
              <div className={detailStyles.infoRow}>
                <span className={detailStyles.infoLabel}>Test ID:</span>
                <span className={detailStyles.infoValue}>{workItem.testId}</span>
              </div>
              <div className={detailStyles.infoRow}>
                <span className={detailStyles.infoLabel}>Doctor:</span>
                <span className={detailStyles.infoValue}>{orderData.doctorName || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={detailStyles.stepsContainer}>
          <div className={`${detailStyles.step} ${detailStyles[getStepStatus(1)]}`}>
            <div className={detailStyles.stepIcon}>
              {getStepStatus(1) === 'completed' ? <FiCheckCircle size={20} /> : <FiClock size={20} />}
            </div>
            <div className={detailStyles.stepContent}>
              <div className={detailStyles.stepTitle}>Sample Collection</div>
              <div className={detailStyles.stepDesc}>Record collection details</div>
            </div>
          </div>

          <div className={detailStyles.stepConnector}></div>

          <div className={`${detailStyles.step} ${detailStyles[getStepStatus(2)]}`}>
            <div className={detailStyles.stepIcon}>
              {getStepStatus(2) === 'completed' ? <FiCheckCircle size={20} /> : <FiFileText size={20} />}
            </div>
            <div className={detailStyles.stepContent}>
              <div className={detailStyles.stepTitle}>Enter Results</div>
              <div className={detailStyles.stepDesc}>Record test results</div>
            </div>
          </div>

          <div className={detailStyles.stepConnector}></div>

          <div className={`${detailStyles.step} ${detailStyles[getStepStatus(3)]}`}>
            <div className={detailStyles.stepIcon}>
              {getStepStatus(3) === 'completed' ? <FiCheckCircle size={20} /> : <FiCheckCircle size={20} />}
            </div>
            <div className={detailStyles.stepContent}>
              <div className={detailStyles.stepTitle}>Approval</div>
              <div className={detailStyles.stepDesc}>Review and approve</div>
            </div>
          </div>
        </div>

        <div className={detailStyles.modalBody}>
          {activeStep === 1 && (
            <div className={detailStyles.formSection}>
              <div className={detailStyles.sectionHeader}>
                <FiClock size={20} />
                <h3>Sample Collection Details</h3>
              </div>

              <div className={detailStyles.formGrid}>
                <div className={detailStyles.formGroup}>
                  <label>Collection Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={sampleData.sampleCollectedTime}
                    onChange={(e) => setSampleData({...sampleData, sampleCollectedTime: e.target.value})}
                    className={detailStyles.formInput}
                    required
                  />
                </div>

                <div className={detailStyles.formGroup}>
                  <label>Collection Place</label>
                  <input
                    type="text"
                    value={sampleData.sampleCollectedPlace}
                    onChange={(e) => setSampleData({...sampleData, sampleCollectedPlace: e.target.value})}
                    className={detailStyles.formInput}
                    placeholder="e.g., Lab Room 1, Patient Room"
                  />
                </div>
              </div>

              <div className={detailStyles.formActions}>
                <button 
                  onClick={handleSampleSave} 
                  className={detailStyles.saveBtn}
                  disabled={loading}
                >
                  <FiSave size={18} />
                  {loading ? 'Saving...' : 'Save & Continue'}
                </button>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className={detailStyles.formSection}>
              <div className={detailStyles.sectionHeader}>
                <FiFileText size={20} />
                <h3>Test Results Entry</h3>
              </div>

              <div className={detailStyles.formGrid}>
                <div className={detailStyles.formGroup}>
                  <label>Result Value *</label>
                  <input
                    type="text"
                    value={resultData.resultValue}
                    onChange={(e) => setResultData({...resultData, resultValue: e.target.value})}
                    className={detailStyles.formInput}
                    placeholder="e.g., 120"
                    required
                  />
                </div>

                <div className={detailStyles.formGroup}>
                  <label>Result Units</label>
                  <input
                    type="text"
                    value={resultData.resultUnits}
                    onChange={(e) => setResultData({...resultData, resultUnits: e.target.value})}
                    className={detailStyles.formInput}
                    placeholder="e.g., mg/dL, mmol/L"
                  />
                </div>

                <div className={detailStyles.formGroup}>
                  <label>Normal Range</label>
                  <input
                    type="text"
                    value={resultData.normalRange}
                    onChange={(e) => setResultData({...resultData, normalRange: e.target.value})}
                    className={detailStyles.formInput}
                    placeholder="e.g., 70-100"
                  />
                </div>

                <div className={detailStyles.formGroup}>
                  <label>Interpretation</label>
                  <select
                    value={resultData.interpretation || ''}
                    onChange={(e) => setResultData({...resultData, interpretation: e.target.value ? Number(e.target.value) : null})}
                    className={detailStyles.formInput}
                  >
                    {interpretationOptions.map(opt => (
                      <option key={opt.value} value={opt.value || ''}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className={detailStyles.formGroup}>
                  <label>Test Done By</label>
                  <select
                    value={resultData.testDoneBy}
                    onChange={(e) => setResultData({...resultData, testDoneBy: Number(e.target.value)})}
                    className={detailStyles.formInput}
                  >
                    <option value={0}>Select Technician</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={detailStyles.formGroupFull}>
                  <label>Remarks</label>
                  <textarea
                    value={resultData.remarks}
                    onChange={(e) => setResultData({...resultData, remarks: e.target.value})}
                    className={detailStyles.formTextarea}
                    rows={3}
                    placeholder="Any additional notes or observations..."
                  />
                </div>
              </div>

              <div className={detailStyles.formActions}>
                <button 
                  onClick={() => setActiveStep(1)} 
                  className={detailStyles.backBtn}
                >
                  ← Back
                </button>
                <button 
                  onClick={handleResultSave} 
                  className={detailStyles.saveBtn}
                  disabled={loading || !resultData.resultValue}
                >
                  <FiSave size={18} />
                  {loading ? 'Saving...' : 'Save & Continue'}
                </button>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className={detailStyles.formSection}>
              <div className={detailStyles.sectionHeader}>
                <FiCheckCircle size={20} />
                <h3>Review & Approval</h3>
              </div>

              <div className={detailStyles.reviewSection}>
                <div className={detailStyles.reviewCard}>
                  <h4>Sample Collection</h4>
                  <div className={detailStyles.reviewRow}>
                    <span>Date & Time:</span>
                    <strong>
                      {workItem.sampleCollectedTime 
                        ? new Date(workItem.sampleCollectedTime).toLocaleString()
                        : sampleData.sampleCollectedTime
                        ? new Date(sampleData.sampleCollectedTime).toLocaleString()
                        : 'Not recorded'}
                    </strong>
                  </div>
                  <div className={detailStyles.reviewRow}>
                    <span>Place:</span>
                    <strong>{workItem.sampleCollectedPlace || sampleData.sampleCollectedPlace || 'Not specified'}</strong>
                  </div>
                </div>

                <div className={detailStyles.reviewCard}>
                  <h4>Test Results</h4>
                  <div className={detailStyles.reviewRow}>
                    <span>Value:</span>
                    <strong>{workItem.resultValue || resultData.resultValue || 'Not entered'} {workItem.resultUnits || resultData.resultUnits}</strong>
                  </div>
                  <div className={detailStyles.reviewRow}>
                    <span>Normal Range:</span>
                    <strong>{workItem.normalRange || resultData.normalRange || 'Not specified'}</strong>
                  </div>
                  <div className={detailStyles.reviewRow}>
                    <span>Interpretation:</span>
                    <strong>
                      {interpretationOptions.find(opt => opt.value === (workItem.interpretation || resultData.interpretation))?.label || 'Not specified'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className={detailStyles.formActions}>
                <button 
                  onClick={() => setActiveStep(2)} 
                  className={detailStyles.backBtn}
                >
                  ← Back
                </button>
                <button 
                  onClick={() => setShowRejectionModal(true)} 
                  className={detailStyles.rejectBtn}
                >
                  <FiXCircle size={18} />
                  Reject
                </button>
                <button 
                  onClick={() => setShowApprovalModal(true)} 
                  className={detailStyles.approveBtn}
                >
                  <FiCheckCircle size={18} />
                  Approve
                </button>
              </div>
            </div>
          )}
        </div>

        {showApprovalModal && (
          <div className={detailStyles.confirmOverlay} onClick={() => !loading && setShowApprovalModal(false)}>
            <div className={detailStyles.confirmModal} onClick={(e) => e.stopPropagation()}>
              <div className={detailStyles.confirmHeader}>
                <h3>Approve Work Item</h3>
                <button onClick={() => !loading && setShowApprovalModal(false)} className={detailStyles.confirmCloseBtn} disabled={loading}>
                  <FiX size={20} />
                </button>
              </div>
              <div className={detailStyles.confirmBody}>
                {statusMessage.text && (
                  <div className={`${detailStyles.statusMessage} ${detailStyles[statusMessage.type]}`}>
                    {statusMessage.text}
                  </div>
                )}
                <div className={detailStyles.formGroup}>
                  <label>Approved By *</label>
                  <select
                    value={approvalData.testApprovedBy}
                    onChange={(e) => setApprovalData({...approvalData, testApprovedBy: Number(e.target.value)})}
                    className={detailStyles.formInput}
                    required
                    disabled={loading}
                  >
                    <option value={0}>Select Doctor</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div className={detailStyles.formGroup}>
                  <label>Approval Remarks</label>
                  <textarea
                    value={approvalData.approvalRemarks}
                    onChange={(e) => setApprovalData({...approvalData, approvalRemarks: e.target.value})}
                    className={detailStyles.formTextarea}
                    rows={3}
                    placeholder="Optional remarks..."
                    disabled={loading}
                  />
                </div>
              </div>
              <div className={detailStyles.confirmFooter}>
                <button onClick={() => !loading && setShowApprovalModal(false)} className={detailStyles.cancelBtn} disabled={loading}>
                  Cancel
                </button>
                <button onClick={handleApprove} className={detailStyles.confirmApproveBtn} disabled={loading}>
                  <FiCheckCircle size={18} />
                  {loading ? 'Approving...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showRejectionModal && (
          <div className={detailStyles.confirmOverlay} onClick={() => !loading && setShowRejectionModal(false)}>
            <div className={detailStyles.confirmModal} onClick={(e) => e.stopPropagation()}>
              <div className={detailStyles.confirmHeader}>
                <h3>Reject Work Item</h3>
                <button onClick={() => !loading && setShowRejectionModal(false)} className={detailStyles.confirmCloseBtn} disabled={loading}>
                  <FiX size={20} />
                </button>
              </div>
              <div className={detailStyles.confirmBody}>
                {statusMessage.text && (
                  <div className={`${detailStyles.statusMessage} ${detailStyles[statusMessage.type]}`}>
                    {statusMessage.text}
                  </div>
                )}
                <div className={detailStyles.formGroup}>
                  <label>Rejected By *</label>
                  <select
                    value={rejectionData.testApprovedBy}
                    onChange={(e) => setRejectionData({...rejectionData, testApprovedBy: Number(e.target.value)})}
                    className={detailStyles.formInput}
                    required
                    disabled={loading}
                  >
                    <option value={0}>Select Doctor</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div className={detailStyles.formGroup}>
                  <label>Rejection Reason *</label>
                  <textarea
                    value={rejectionData.rejectReason}
                    onChange={(e) => setRejectionData({...rejectionData, rejectReason: e.target.value})}
                    className={detailStyles.formTextarea}
                    rows={4}
                    placeholder="Please provide a detailed reason for rejection..."
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div className={detailStyles.confirmFooter}>
                <button onClick={() => !loading && setShowRejectionModal(false)} className={detailStyles.cancelBtn} disabled={loading}>
                  Cancel
                </button>
                <button onClick={handleReject} className={detailStyles.confirmRejectBtn} disabled={loading}>
                  <FiXCircle size={18} />
                  {loading ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabWorkQueue;