// src/components/LabWork/LabWorkQueue.jsx
import React, { useState, useEffect } from 'react';
import { 
  FiSearch, FiCalendar, FiFilter, FiChevronDown, FiChevronRight, 
  FiClock, FiCheckCircle, FiAlertCircle, FiPackage, FiActivity, FiFileText, FiX 
} from 'react-icons/fi';
import { getLabWorkItemsList } from '../api/api-labtest.js';
import { updateLabTestOrder } from '../api/api-labtest.js';
import { addLabTestReport } from '../api/api-labtest.js';
import { getLabTestOrderList } from '../api/api-labtest.js';
import { getEmployeeList } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './LabWorkQueue.module.css';

const LabWorkQueue = ({ onSelectWorkItem, onNavigateToOrders }) => {
  // Data States
  const [workItems, setWorkItems] = useState([]);
  const [groupedWorkItems, setGroupedWorkItems] = useState({});
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [doctors, setDoctors] = useState([]);
  
  // Filter States
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState(-1);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Report Modal States
  const [showReportModal, setShowReportModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedOrderForReport, setSelectedOrderForReport] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [submittingReport, setSubmittingReport] = useState(false);
  
  // Report Form States
  const [reportForm, setReportForm] = useState({
    verifiedBy: 0,
    verifiedDateTime: '',
    remarks: ''
  });

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
        Designation: 1, // Assuming 1 is for doctors - adjust if needed
        Status: 1 // Active only
      };
      
      const employeeList = await getEmployeeList(clinicId, options);
      setDoctors(employeeList);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
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

      if (searchInput.trim()) {
        options.Search = searchInput.trim();
      }

      if (fromDate && toDate) {
        options.FromDate = fromDate;
        options.ToDate = toDate;
      }

      const data = await getLabWorkItemsList(clinicId, options);

      const sortedData = data.sort((a, b) => {
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
      
      // Auto-expand if only one order
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

  const handleSearch = () => {
    fetchWorkItems();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setFromDate('');
    setToDate('');
    setStatusFilter(-1);
    fetchWorkItems();
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

  // Check if all work items in an order are completed
  const isOrderFullyCompleted = (items) => {
    return items.every(item => item.status === 3);
  };

  // Handle Add Report Button Click
  const handleAddReportClick = (orderData) => {
    setSelectedOrderForReport(orderData);
    setShowConfirmDialog(true);
  };

  // Handle Confirmation Dialog
  const handleConfirmYes = async () => {
    setShowConfirmDialog(false);
    
    try {
      setSubmittingReport(true);
      
      // Step 1: Fetch order details
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      
      const orderListOptions = {
        OrderID: selectedOrderForReport.orderId,
        BranchID: branchId,
        Page: 1,
        PageSize: 1
      };
      
      const orderList = await getLabTestOrderList(clinicId, orderListOptions);
      
      if (!orderList || orderList.length === 0) {
        throw new Error('Order details not found');
      }
      
      const orderDetail = orderList[0];
      setOrderDetails(orderDetail);
      
      // Step 2: Update order status to 2 (Completed)
      const updateData = {
        orderId: selectedOrderForReport.orderId,
        clinicId: clinicId,
        branchId: branchId,
        status: 2, // Completed
        fileId: orderDetail.fileId || 0,
        priority: orderDetail.priority || 1,
        notes: orderDetail.notes || '',
        testApprovedBy: orderDetail.doctorId || 0
      };
      
      await updateLabTestOrder(updateData);
      
      // Step 3: Reset report form with current date/time
      const now = new Date();
      const formattedDateTime = now.toISOString().slice(0, 16); // Format for datetime-local input
      
      setReportForm({
        verifiedBy: 0,
        verifiedDateTime: formattedDateTime,
        remarks: ''
      });
      
      // Step 4: Open report modal
      setShowReportModal(true);
      
    } catch (err) {
      console.error('Error processing add report:', err);
      setError(err);
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleConfirmNo = () => {
    setShowConfirmDialog(false);
    setSelectedOrderForReport(null);
  };

  // Handle Report Form Submission
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    
    if (!reportForm.verifiedBy || reportForm.verifiedBy === 0) {
      alert('Please select a verified by doctor');
      return;
    }
    
    if (!reportForm.verifiedDateTime) {
      alert('Please select verified date and time');
      return;
    }
    
    try {
      setSubmittingReport(true);
      
      const reportData = {
        orderId: orderDetails.id,
        consultationId: orderDetails.consultationId,
        visitId: orderDetails.visitId,
        patientId: orderDetails.patientId,
        doctorId: orderDetails.doctorId,
        clinicId: orderDetails.clinicId,
        branchId: orderDetails.branchId,
        fileId: orderDetails.fileId || 0,
        verifiedBy: reportForm.verifiedBy,
        verifiedDateTime: reportForm.verifiedDateTime,
        remarks: reportForm.remarks
      };
      
      const result = await addLabTestReport(reportData);
      
      if (result.success) {
        alert('Lab test report added successfully!');
        setShowReportModal(false);
        setSelectedOrderForReport(null);
        setOrderDetails(null);
        setReportForm({
          verifiedBy: 0,
          verifiedDateTime: '',
          remarks: ''
        });
        
        // Refresh the work items list
        fetchWorkItems();
      }
      
    } catch (err) {
      console.error('Error submitting report:', err);
      alert(err.message || 'Failed to add lab test report');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setSelectedOrderForReport(null);
    setOrderDetails(null);
    setReportForm({
      verifiedBy: 0,
      verifiedDateTime: '',
      remarks: ''
    });
  };

  // Calculate stats
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

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
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

          <button onClick={expandAll} className={styles.expandBtn}>
            <FiChevronDown size={18} />
            Expand All
          </button>

          <button onClick={collapseAll} className={styles.collapseBtn}>
            <FiChevronRight size={18} />
            Collapse All
          </button>

          {(fromDate || toDate || searchInput || statusFilter !== -1) && (
            <button onClick={clearAllFilters} className={styles.clearBtn}>
              Clear All
            </button>
          )}
        </div>
        <div className={styles.searchWrapper}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search by patient name, test name..."
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
                onChange={(e) => setFromDate(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.filterActions}>
              <button onClick={handleSearch} className={styles.searchBtn}>
                <FiSearch size={18} />
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grouped Work Items */}
      <div className={styles.workQueueContainer}>
        {Object.keys(groupedWorkItems).length === 0 ? (
          <div className={styles.noData}>
            {searchInput
              ? 'No work items found matching your search.'
              : 'No work items found.'}
          </div>
        ) : (
          Object.entries(groupedWorkItems).map(([orderId, orderData]) => {
            const isExpanded = expandedOrders.has(Number(orderId));
            const orderStatus = getOrderStatus(orderData.items);
            const completedCount = orderData.items.filter(item => item.status === 3).length;
            const totalCount = orderData.items.length;
            const isFullyCompleted = isOrderFullyCompleted(orderData.items);

            return (
              <div key={orderId} className={styles.orderGroup}>
                {/* Order Header */}
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
                          style={{ width: `${(completedCount / totalCount) * 100}%` }}
                        />
                      </div>
                      <div className={styles.progressText}>
                        {Math.round((completedCount / totalCount) * 100)}%
                      </div>
                    </div>
                    
                    {/* Add Report Button - Only show when all items are completed */}
                    {isFullyCompleted && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddReportClick(orderData);
                        }}
                        className={styles.addReportBtn}
                      >
                        <FiFileText size={18} />
                        Add Report
                      </button>
                    )}
                  </div>
                </div>

                {/* Work Items List */}
                {isExpanded && (
                  <div className={styles.workItemsList}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Work ID</th>
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
                              <div className={styles.workIdCell}>
                                <FiActivity className={styles.workIcon} />
                                <span className={styles.workId}>#{item.workId}</span>
                              </div>
                            </td>
                            <td>
                              <div>
                                <div className={styles.testName}>{item.testName}</div>
                                <div className={styles.testId}>Test ID: {item.testId}</div>
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
                                  onSelectWorkItem && onSelectWorkItem(item, orderData);
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

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmDialog}>
            <div className={styles.confirmHeader}>
              <h3>Confirm Add Report</h3>
            </div>
            <div className={styles.confirmBody}>
              <p>Are you sure you want to add a report for Order #{selectedOrderForReport?.orderId}?</p>
              <p className={styles.confirmSubtext}>
                This will update the order status to Completed and open the report form.
              </p>
            </div>
            <div className={styles.confirmFooter}>
              <button 
                onClick={handleConfirmNo} 
                className={styles.cancelBtn}
                disabled={submittingReport}
              >
                No
              </button>
              <button 
                onClick={handleConfirmYes} 
                className={styles.confirmBtn}
                disabled={submittingReport}
              >
                {submittingReport ? 'Processing...' : 'Yes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Report Modal */}
      {showReportModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.reportModal}>
            <div className={styles.modalHeader}>
              <h3>Add Lab Test Report</h3>
              <button 
                onClick={handleCloseReportModal} 
                className={styles.closeBtn}
                disabled={submittingReport}
              >
                <FiX size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitReport} className={styles.reportForm}>
              <div className={styles.modalBody}>
                {/* Order Information */}
                <div className={styles.orderInfoSection}>
                  <h4>Order Information</h4>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Order ID:</span>
                      <span className={styles.infoValue}>#{orderDetails?.id}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Patient:</span>
                      <span className={styles.infoValue}>{orderDetails?.patientName}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Doctor:</span>
                      <span className={styles.infoValue}>{orderDetails?.doctorFullName}</span>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Verified By <span className={styles.required}>*</span>
                  </label>
                  <select
                    value={reportForm.verifiedBy}
                    onChange={(e) => setReportForm({ ...reportForm, verifiedBy: Number(e.target.value) })}
                    className={styles.formSelect}
                    required
                    disabled={submittingReport}
                  >
                    <option value={0}>Select Doctor</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name} ({doctor.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Verified Date & Time <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={reportForm.verifiedDateTime}
                    onChange={(e) => setReportForm({ ...reportForm, verifiedDateTime: e.target.value })}
                    className={styles.formInput}
                    required
                    disabled={submittingReport}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Remarks</label>
                  <textarea
                    value={reportForm.remarks}
                    onChange={(e) => setReportForm({ ...reportForm, remarks: e.target.value })}
                    className={styles.formTextarea}
                    rows={4}
                    placeholder="Enter any additional remarks..."
                    disabled={submittingReport}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button 
                  type="button"
                  onClick={handleCloseReportModal} 
                  className={styles.cancelBtn}
                  disabled={submittingReport}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.submitBtn}
                  disabled={submittingReport}
                >
                  {submittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabWorkQueue;