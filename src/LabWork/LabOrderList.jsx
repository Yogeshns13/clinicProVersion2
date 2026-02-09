// src/components/LabWork/LabOrderList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiCalendar, FiFilter, FiEye, FiCheckCircle, FiClock, FiAlertCircle, FiFileText, FiX, FiUser, FiEdit } from 'react-icons/fi';
import { 
  getLabTestOrderList, 
  updateLabTestOrder, 
  createWorkItemsForOrder,
  generateLabInvoice,
  addLabTestReport,
  getLabTestReportList,
  updateLabTestReport
} from '../api/api-labtest.js';
import { getEmployeeList } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './LabOrderList.module.css';

const LabOrderList = () => {
  const navigate = useNavigate();
  
  // Data States
  const [orders, setOrders] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [orderReports, setOrderReports] = useState({}); // Map of orderId -> reportId
  
  // Filter States
  const [searchInput, setSearchInput] = useState('');
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
  const [isUpdateOrderOpen, setIsUpdateOrderOpen] = useState(false);
  const [isConfirmWorkOpen, setIsConfirmWorkOpen] = useState(false);
  const [isMakeInvoiceOpen, setIsMakeInvoiceOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Report Modal States
  const [showReportModal, setShowReportModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedOrderForReport, setSelectedOrderForReport] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportMessage, setReportMessage] = useState({ type: '', text: '' });
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [currentReportId, setCurrentReportId] = useState(null);
  
  // Report Form States
  const [reportForm, setReportForm] = useState({
    verifiedBy: 0,
    verifiedDateTime: '',
    remarks: '',
    status: 1 // Default to "Created" status
  });

  // Status options for Lab Test Orders
  const statusOptions = [
    { id: -1, label: 'All Statuses', color: 'default' },
    { id: 1, label: 'Pending', color: 'warning' },
    { id: 2, label: 'Completed', color: 'success' },
    { id: 3, label: 'Cancelled', color: 'danger' },
    { id: 4, label: 'Invoice Processed', color: 'info' },
    { id: 5, label: 'Work in Progress', color: 'progress' },
    { id: 6, label: 'External', color: 'external' }
  ];

  // Status options for Lab Test Reports
  const reportStatusOptions = [
    { id: -1, label: 'No Change', color: 'default' },
    { id: 1, label: 'Created', color: 'info' },
    { id: 2, label: 'Cancelled', color: 'danger' },
    { id: 3, label: 'Verified', color: 'success' }
  ];

  // Priority options
  const priorityOptions = [
    { id: 1, label: 'Normal' },
    { id: 2, label: 'Urgent' },
    { id: 3, label: 'STAT' }
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

  // Fetch Lab Test Reports to check if orders have reports
  const fetchLabTestReports = async () => {
    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      
      const options = {
        Page: 1,
        PageSize: 100,
        BranchID: branchId
      };
      
      const reports = await getLabTestReportList(clinicId, options);
      
      // Create a map of orderId -> reportId
      const reportsMap = {};
      reports.forEach(report => {
        if (report.orderId) {
          reportsMap[report.orderId] = report.id;
        }
      });
      
      setOrderReports(reportsMap);
    } catch (err) {
      console.error('Failed to fetch lab test reports:', err);
    }
  };

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

      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a.dateCreated);
        const dateB = new Date(b.dateCreated);
        return dateB - dateA;
      });

      setOrders(sortedData);
      
      // Fetch reports after orders are loaded
      await fetchLabTestReports();
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

  useEffect(() => {
    fetchOrders();
    fetchDoctors();
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

  const handleUpdateOrder = (order) => {
    setSelectedOrder(order);
    setIsUpdateOrderOpen(true);
  };

  const handleMakeWorkClick = (order) => {
    setSelectedOrder(order);
    setIsConfirmWorkOpen(true);
  };

  const handleMakeInvoiceClick = (order) => {
    setSelectedOrder(order);
    setIsMakeInvoiceOpen(true);
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
      
      alert('Work items created successfully! Navigate to Work Queue to process them.');
    } catch (err) {
      console.error('Error creating work items:', err);
      alert(err.message || 'Failed to create work items');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async (invoiceData) => {
    try {
      setLoading(true);
      
      await generateLabInvoice(invoiceData);
      
      setIsMakeInvoiceOpen(false);
      setSelectedOrder(null);
      
      await fetchOrders();
      
      alert('Invoice generated successfully!');
    } catch (err) {
      console.error('Error generating invoice:', err);
      alert(err.message || 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderSubmit = async (orderData) => {
    try {
      setLoading(true);
      
      await updateLabTestOrder(orderData);
      
      setIsUpdateOrderOpen(false);
      setSelectedOrder(null);
      
      await fetchOrders();
      
      alert('Order updated successfully!');
    } catch (err) {
      console.error('Error updating order:', err);
      alert(err.message || 'Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  // Handle Add Report Button Click
  const handleAddReportClick = (order) => {
    setIsUpdateMode(false);
    setCurrentReportId(null);
    setSelectedOrderForReport(order);
    setShowConfirmDialog(true);
  };

  // Handle Update Report Button Click
  const handleUpdateReportClick = async (order) => {
    try {
      setSubmittingReport(true);
      
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      
      // Fetch the existing report for this order
      const reportOptions = {
        OrderID: order.id,
        BranchID: branchId,
        Page: 1,
        PageSize: 1
      };
      
      const reports = await getLabTestReportList(clinicId, reportOptions);
      
      if (!reports || reports.length === 0) {
        throw new Error('Report not found for this order');
      }
      
      const existingReport = reports[0];
      
      // Fetch order details
      const orderListOptions = {
        OrderID: order.id,
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
      
      // Set form with existing report data
      setIsUpdateMode(true);
      setCurrentReportId(existingReport.id);
      setSelectedOrderForReport(order);
      
      const formattedDateTime = existingReport.verifiedDateTime 
        ? new Date(existingReport.verifiedDateTime).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16);
      
      setReportForm({
        verifiedBy: existingReport.verifiedBy || 0,
        verifiedDateTime: formattedDateTime,
        remarks: existingReport.remarks || '',
        status: existingReport.status ?? 1 // Use existing status or default to "Created"
      });
      
      setShowReportModal(true);
      
    } catch (err) {
      console.error('Error loading report for update:', err);
      setError(err);
      alert(err.message || 'Failed to load report details');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Handle Confirmation Dialog
  const handleConfirmYes = async () => {
    setShowConfirmDialog(false);
    
    try {
      setSubmittingReport(true);
      
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      
      const orderListOptions = {
        OrderID: selectedOrderForReport.id,
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
      
      const updateData = {
        orderId: selectedOrderForReport.id,
        clinicId: clinicId,
        branchId: branchId,
        status: 2,
        fileId: orderDetail.fileId || 0,
        priority: orderDetail.priority || 1,
        notes: orderDetail.notes || '',
        testApprovedBy: orderDetail.doctorId || 0
      };
      
      await updateLabTestOrder(updateData);
      
      const now = new Date();
      const formattedDateTime = now.toISOString().slice(0, 16);
      
      setReportForm({
        verifiedBy: 0,
        verifiedDateTime: formattedDateTime,
        remarks: '',
        status: 1 // Default to "Created" status
      });
      
      setShowReportModal(true);
      
    } catch (err) {
      console.error('Error processing add report:', err);
      setError(err);
      setReportMessage({ type: 'error', text: err.message || 'Failed to process report request' });
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
      setReportMessage({ type: 'error', text: 'Please select a verified by doctor' });
      return;
    }
    
    if (!reportForm.verifiedDateTime) {
      setReportMessage({ type: 'error', text: 'Please select verified date and time' });
      return;
    }
    
    try {
      setSubmittingReport(true);
      setReportMessage({ type: '', text: '' });
      
      if (isUpdateMode) {
        // Update existing report
        const updateReportData = {
          reportId: currentReportId,
          clinicId: orderDetails.clinicId,
          branchId: orderDetails.branchId,
          fileId: orderDetails.fileId || 0,
          verifiedBy: reportForm.verifiedBy,
          verifiedDateTime: reportForm.verifiedDateTime,
          remarks: reportForm.remarks,
          status: reportForm.status
        };
        
        const result = await updateLabTestReport(updateReportData);
        
        if (result.success) {
          setReportMessage({ type: 'success', text: 'Lab test report updated successfully!' });
          setTimeout(() => {
            setShowReportModal(false);
            setSelectedOrderForReport(null);
            setOrderDetails(null);
            setIsUpdateMode(false);
            setCurrentReportId(null);
            setReportForm({
              verifiedBy: 0,
              verifiedDateTime: '',
              remarks: '',
              status: 1 // Default to "Created" status
            });
            setReportMessage({ type: '', text: '' });
            fetchOrders();
          }, 1500);
        }
      } else {
        // Add new report
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
          setReportMessage({ type: 'success', text: 'Lab test report added successfully!' });
          setTimeout(() => {
            setShowReportModal(false);
            setSelectedOrderForReport(null);
            setOrderDetails(null);
            setReportForm({
              verifiedBy: 0,
              verifiedDateTime: '',
              remarks: '',
              status: 1 // Default to "Created" status
            });
            setReportMessage({ type: '', text: '' });
            fetchOrders();
          }, 1500);
        }
      }
      
    } catch (err) {
      console.error('Error submitting report:', err);
      setReportMessage({ type: 'error', text: err.message || `Failed to ${isUpdateMode ? 'update' : 'add'} lab test report` });
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setSelectedOrderForReport(null);
    setOrderDetails(null);
    setIsUpdateMode(false);
    setCurrentReportId(null);
    setReportMessage({ type: '', text: '' });
    setReportForm({
      verifiedBy: 0,
      verifiedDateTime: '',
      remarks: '',
      status: 1 // Default to "Created" status
    });
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
    const statusObj = statusOptions.find(s => s.id === status);
    return styles[`status${statusObj?.color || 'default'}`] || styles.statusDefault;
  };

  const getPriorityBadgeClass = (priority) => {
    switch(priority) {
      case 1: return styles.priorityNormal;
      case 2: return styles.priorityUrgent;
      case 3: return styles.priorityStat;
      default: return styles.priorityNormal;
    }
  };

  const getOrderStatusIcon = (status) => {
    switch(status) {
      case 1: return <FiClock className={styles.statusIcon} />;
      case 2: return <FiCheckCircle className={styles.statusIcon} />;
      case 5: return <FiAlertCircle className={styles.statusIcon} />;
      default: return null;
    }
  };

  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading && !isOrderDetailsOpen && !isUpdateOrderOpen) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading lab orders...</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Lab Order Management" />

      {/* Quick Stats */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #eab308, #ca8a04)' }}>
            <FiClock size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{orders.filter(o => o.status === 1).length}</div>
            <div className={styles.statLabel}>Pending Orders</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)' }}>
            <FiAlertCircle size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{orders.filter(o => o.status === 5).length}</div>
            <div className={styles.statLabel}>In Progress</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
            <FiCheckCircle size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{orders.filter(o => o.status === 2).length}</div>
            <div className={styles.statLabel}>Completed</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #207d9c, #30b2b5)' }}>
            <FiEye size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{orders.length}</div>
            <div className={styles.statLabel}>Total Orders</div>
          </div>
        </div>
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

        <div className={styles.toolbarRight}>
          <button 
            onClick={() => navigate('/labwork-list')}
            className={styles.workQueueBtn}
          >
            <FiAlertCircle size={18} />
            Go to Work Queue
          </button>
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
              <button onClick={handleSearch} className={styles.searchBtn}>
                <FiSearch size={18} />
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order Info</th>
              <th>Patient Details</th>
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
              orders.map((order) => {
                const hasReport = orderReports[order.id];
                
                return (
                  <tr key={order.id} className={styles.tableRow}>
                    <td>
                      <div className={styles.orderIdCell}>
                        <div className={styles.orderIcon}>
                          {getOrderStatusIcon(order.status)}
                        </div>
                        <div>
                          <div className={styles.orderId}>#{order.id}</div>
                          <div className={styles.orderSeq}>Seq: {order.uniqueSeq}</div>
                        </div>
                      </div>
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
                      <div className={styles.dateCell}>
                        <div className={styles.name}>{formatDate(order.dateCreated)}</div>
                        <div className={styles.subText}>
                          {new Date(order.dateCreated).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          onClick={() => handleViewOrderDetails(order)}
                          className={styles.viewBtn}
                          title="View Details"
                        >
                          <FiEye size={16} />
                        </button>
                        
                        <div className={styles.actionDropdownWrapper}>
                          <button className={styles.actionBtn}>
                            Actions
                          </button>
                          <div className={styles.actionDropdown}>
                            <button
                              onClick={() => handleMakeWorkClick(order)}
                              className={styles.dropdownItem}
                              disabled={order.status === 5 || order.status === 2 || order.status === 3 || order.status === 6}
                            >
                              {order.status === 5 ? 'In Progress' : 'Make Work'}
                            </button>
                            
                            {(order.status === 2) && !hasReport && (
                              <button
                                onClick={() => handleAddReportClick(order)}
                                className={styles.dropdownItem}
                              >
                                <FiFileText size={14} />
                                Add Report
                              </button>
                            )}
                            
                            {(order.status === 2) && hasReport && (
                              <button
                                onClick={() => handleUpdateReportClick(order)}
                                className={styles.dropdownItem}
                              >
                                <FiEdit size={14} />
                                Update Report
                              </button>
                            )}
                            
                            {(order.status === 1 || order.status === 5) && (
                              <button
                                onClick={() => handleMakeInvoiceClick(order)}
                                className={styles.dropdownItem}
                              >
                                <FiFileText size={14} />
                                Make Invoice
                              </button>
                            )}
                            
                            {order.status === 4 && (
                              <button
                                className={`${styles.dropdownItem} ${styles.invoicedItem}`}
                                disabled
                              >
                                <FiCheckCircle size={14} />
                                Invoiced!
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
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
          onUpdate={() => {
            setIsOrderDetailsOpen(false);
            handleUpdateOrder(selectedOrder);
          }}
        />
      )}

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

      {isMakeInvoiceOpen && selectedOrder && (
        <MakeInvoiceModal
          order={selectedOrder}
          onClose={() => {
            setIsMakeInvoiceOpen(false);
            setSelectedOrder(null);
          }}
          onSubmit={handleGenerateInvoice}
        />
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmDialog}>
            <div className={styles.confirmHeader}>
              <h3>Confirm Add Report</h3>
            </div>
            <div className={styles.confirmBody}>
              <p>Are you sure you want to add a report for Order #{selectedOrderForReport?.id}?</p>
              <p className={styles.confirmSubtext}>
                This will update the order status to Completed and open the report form.
              </p>
            </div>
            <div className={styles.confirmFooter}>
              <button 
                onClick={handleConfirmNo} 
                className={styles.cancelModalBtn}
                disabled={submittingReport}
              >
                No
              </button>
              <button 
                onClick={handleConfirmYes} 
                className={styles.confirmModalBtn}
                disabled={submittingReport}
              >
                {submittingReport ? 'Processing...' : 'Yes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Update Report Modal */}
      {showReportModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.reportModal}>
            <div className={styles.reportModalHeader}>
              <h3>{isUpdateMode ? 'Update Lab Test Report' : 'Add Lab Test Report'}</h3>
              <button 
                onClick={handleCloseReportModal} 
                className={styles.reportCloseBtn}
                disabled={submittingReport}
              >
                <FiX size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitReport} className={styles.reportForm}>
              <div className={styles.reportModalBody}>
                {reportMessage.text && (
                  <div className={`${styles.reportMessage} ${styles[reportMessage.type]}`}>
                    {reportMessage.text}
                  </div>
                )}

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

                <div className={styles.reportFormGroup}>
                  <label className={styles.reportFormLabel}>
                    Verified By <span className={styles.reportRequired}>*</span>
                  </label>
                  <select
                    value={reportForm.verifiedBy}
                    onChange={(e) => setReportForm({ ...reportForm, verifiedBy: Number(e.target.value) })}
                    className={styles.reportFormSelect}
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

                <div className={styles.reportFormGroup}>
                  <label className={styles.reportFormLabel}>
                    Verified Date & Time <span className={styles.reportRequired}>*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={reportForm.verifiedDateTime}
                    onChange={(e) => setReportForm({ ...reportForm, verifiedDateTime: e.target.value })}
                    className={styles.reportFormInput}
                    required
                    disabled={submittingReport}
                  />
                </div>

                {isUpdateMode && (
                  <div className={styles.reportFormGroup}>
                    <label className={styles.reportFormLabel}>Status</label>
                    <select
                      value={reportForm.status}
                      onChange={(e) => setReportForm({ ...reportForm, status: Number(e.target.value) })}
                      className={styles.reportFormSelect}
                      disabled={submittingReport}
                    >
                      {reportStatusOptions.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={styles.reportFormGroup}>
                  <label className={styles.reportFormLabel}>Remarks</label>
                  <textarea
                    value={reportForm.remarks}
                    onChange={(e) => setReportForm({ ...reportForm, remarks: e.target.value })}
                    className={styles.reportFormTextarea}
                    rows={4}
                    placeholder="Enter any additional remarks..."
                    disabled={submittingReport}
                  />
                </div>
              </div>

              <div className={styles.reportModalFooter}>
                <button 
                  type="button"
                  onClick={handleCloseReportModal} 
                  className={styles.reportCancelBtn}
                  disabled={submittingReport}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.reportSubmitBtn}
                  disabled={submittingReport}
                >
                  {submittingReport ? (isUpdateMode ? 'Updating...' : 'Submitting...') : (isUpdateMode ? 'Update Report' : 'Submit Report')}
                </button>
              </div>
            </form>
          </div>
        </div>
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
          <div className={styles.confirmIcon}>
            <FiAlertCircle size={48} />
          </div>
          <p className={styles.confirmText}>
            Are you sure you want to create work items for this order?
          </p>
          <div className={styles.confirmDetails}>
            <div className={styles.confirmDetailRow}>
              <span className={styles.confirmLabel}>Order ID:</span>
              <span className={styles.confirmValue}>#{order.id}</span>
            </div>
            <div className={styles.confirmDetailRow}>
              <span className={styles.confirmLabel}>Patient:</span>
              <span className={styles.confirmValue}>{order.patientName}</span>
            </div>
            <div className={styles.confirmDetailRow}>
              <span className={styles.confirmLabel}>Doctor:</span>
              <span className={styles.confirmValue}>{order.doctorFullName}</span>
            </div>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onConfirm} className={styles.confirmBtn}>
            <FiCheckCircle size={18} />
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

// Make Invoice Modal Component
const MakeInvoiceModal = ({ order, onClose, onSubmit }) => {
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    invoiceDate: getTodayDate(),
    discount: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const clinicId = Number(localStorage.getItem('clinicID'));
    const branchId = Number(localStorage.getItem('branchID'));
    
    const invoiceData = {
      orderId: order.id,
      clinicId: clinicId,
      branchId: branchId,
      invoiceDate: formData.invoiceDate,
      discount: Number(formData.discount)
    };
    
    onSubmit(invoiceData);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Generate Invoice</h2>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.confirmIcon}>
              <FiFileText size={48} />
            </div>
            <p className={styles.confirmText}>
              Generate invoice for Order #{order.id}
            </p>
            <div className={styles.confirmDetails}>
              <div className={styles.confirmDetailRow}>
                <span className={styles.confirmLabel}>Patient:</span>
                <span className={styles.confirmValue}>{order.patientName}</span>
              </div>
              <div className={styles.confirmDetailRow}>
                <span className={styles.confirmLabel}>Doctor:</span>
                <span className={styles.confirmValue}>{order.doctorFullName}</span>
              </div>
            </div>

            <div className={styles.invoiceFormGrid}>
              <div className={styles.formGroup}>
                <label>Invoice Date *</label>
                <input
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData({...formData, invoiceDate: e.target.value})}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Discount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discount}
                  onChange={(e) => setFormData({...formData, discount: e.target.value})}
                  className={styles.formInput}
                  placeholder="Enter discount amount"
                />
              </div>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="submit" className={styles.confirmBtn}>
              <FiFileText size={18} />
              Generate Invoice
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

export default LabOrderList;