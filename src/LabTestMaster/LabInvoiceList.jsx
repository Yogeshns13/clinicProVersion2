// src/components/LabWork/LabInvoiceList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX, FiCalendar, FiFilter, FiEye, FiFileText, FiDollarSign, FiDownload, FiPrinter } from 'react-icons/fi';
import { getLabInvoiceDetailList } from '../api/api-labtest.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './LabInvoiceList.module.css';

const LabInvoiceList = () => {
  const navigate = useNavigate();
  
  // Data States
  const [invoiceDetails, setInvoiceDetails] = useState([]);
  const [allInvoiceDetails, setAllInvoiceDetails] = useState([]);
  
  // Filter inputs (not applied until search)
  const [filterInputs, setFilterInputs] = useState({
    searchType: 'patientName', // patientName, invoiceNo, testName
    searchValue: '',
    dateFrom: '',
    dateTo: ''
  });

  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState({
    searchType: 'patientName',
    searchValue: '',
    dateFrom: '',
    dateTo: ''
  });

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal States
  const [isInvoiceDetailsOpen, setIsInvoiceDetailsOpen] = useState(false);
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState(null);

  // ── Derived: are any filters actually active?
  const hasActiveFilters =
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.dateFrom           !== '' ||
    appliedFilters.dateTo             !== '';

  // Fetch Lab Invoice Details
  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const options = {
        Page: 1,
        PageSize: 100,
        BranchID: branchId
      };

      const data = await getLabInvoiceDetailList(clinicId, options);

      // Group by invoice and sort
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a.dateCreated);
        const dateB = new Date(b.dateCreated);
        return dateB - dateA;
      });

      setInvoiceDetails(sortedData);
      setAllInvoiceDetails(sortedData);
    } catch (err) {
      console.error('fetchInvoiceDetails error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load lab invoice details' }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceDetails();
  }, []);

  // Computed filtered invoice details based on applied filters
  const filteredInvoiceDetails = useMemo(() => {
    let filtered = allInvoiceDetails;

    // Apply search filter based on search type
    if (appliedFilters.searchValue) {
      const term = appliedFilters.searchValue.toLowerCase();
      
      switch (appliedFilters.searchType) {
        case 'patientName':
          filtered = filtered.filter(inv => inv.patientName?.toLowerCase().includes(term));
          break;
        case 'invoiceNo':
          filtered = filtered.filter(inv => inv.invoiceNo?.toLowerCase().includes(term));
          break;
        case 'testName':
          filtered = filtered.filter(inv => inv.testName?.toLowerCase().includes(term));
          break;
        default:
          break;
      }
    }

    // Date from filter
    if (appliedFilters.dateFrom) {
      const fromDate = new Date(appliedFilters.dateFrom);
      filtered = filtered.filter(inv => {
        if (!inv.invoiceDate) return false;
        const invoiceDate = new Date(inv.invoiceDate);
        return invoiceDate >= fromDate;
      });
    }

    // Date to filter
    if (appliedFilters.dateTo) {
      const toDate = new Date(appliedFilters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(inv => {
        if (!inv.invoiceDate) return false;
        const invoiceDate = new Date(inv.invoiceDate);
        return invoiceDate <= toDate;
      });
    }

    return filtered;
  }, [allInvoiceDetails, appliedFilters]);

  // Group invoice details by invoice
  const groupedInvoices = useMemo(() => {
    const groups = {};
    
    filteredInvoiceDetails.forEach(detail => {
      const invoiceId = detail.invoiceId;
      if (!groups[invoiceId]) {
        groups[invoiceId] = {
          invoiceId: detail.invoiceId,
          invoiceNo: detail.invoiceNo,
          invoiceDate: detail.invoiceDate,
          patientId: detail.patientId,
          patientName: detail.patientName,
          patientMobile: detail.patientMobile,
          patientFileNo: detail.patientFileNo,
          clinicName: detail.clinicName,
          branchName: detail.branchName,
          dateCreated: detail.dateCreated,
          details: [],
          totalAmount: 0,
          totalCgst: 0,
          totalSgst: 0,
          totalNetAmount: 0
        };
      }
      
      groups[invoiceId].details.push(detail);
      groups[invoiceId].totalAmount += detail.amount || 0;
      groups[invoiceId].totalCgst += detail.cgstAmount || 0;
      groups[invoiceId].totalSgst += detail.sgstAmount || 0;
      groups[invoiceId].totalNetAmount += detail.netAmount || 0;
    });
    
    return Object.values(groups).sort((a, b) => {
      const dateA = new Date(a.dateCreated);
      const dateB = new Date(b.dateCreated);
      return dateB - dateA;
    });
  }, [filteredInvoiceDetails]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const uniqueInvoices = new Set(allInvoiceDetails.map(d => d.invoiceId)).size;
    const totalRevenue = allInvoiceDetails.reduce((sum, d) => sum + (d.netAmount || 0), 0);
    const totalTests = allInvoiceDetails.length;
    const avgInvoiceValue = uniqueInvoices > 0 ? totalRevenue / uniqueInvoices : 0;

    return {
      uniqueInvoices,
      totalRevenue,
      totalTests,
      avgInvoiceValue
    };
  }, [allInvoiceDetails]);

  // Filter handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filterInputs });
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      searchType: 'patientName',
      searchValue: '',
      dateFrom: '',
      dateTo: ''
    };
    setFilterInputs(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleViewInvoiceDetails = (invoice) => {
    setSelectedInvoiceDetail(invoice);
    setIsInvoiceDetailsOpen(true);
  };

  const handlePrintInvoice = (invoice) => {
    // Placeholder for print functionality
    console.log('Print invoice:', invoice.invoiceNo);
    alert(`Print functionality for Invoice ${invoice.invoiceNo} will be implemented.`);
  };

  const handleDownloadInvoice = (invoice) => {
    // Placeholder for download functionality
    console.log('Download invoice:', invoice.invoiceNo);
    alert(`Download functionality for Invoice ${invoice.invoiceNo} will be implemented.`);
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

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '₹0.00';
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading && !isInvoiceDetailsOpen) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading lab invoices...</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Lab Invoice Management" />

      {/* Quick Stats */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)' }}>
            <FiFileText size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{summaryStats.uniqueInvoices}</div>
            <div className={styles.statLabel}>Total Invoices</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
            <FiDollarSign size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{formatCurrency(summaryStats.totalRevenue)}</div>
            <div className={styles.statLabel}>Total Revenue</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #eab308, #ca8a04)' }}>
            <FiFileText size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{summaryStats.totalTests}</div>
            <div className={styles.statLabel}>Total Tests</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
            <FiDollarSign size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{formatCurrency(summaryStats.avgInvoiceValue)}</div>
            <div className={styles.statLabel}>Avg Invoice Value</div>
          </div>
        </div>
      </div>

      {/* Filters Container */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>

          {/* Fused search type + value */}
          <div className={styles.searchGroup}>
            <select
              name="searchType"
              value={filterInputs.searchType}
              onChange={handleFilterChange}
              className={styles.searchTypeSelect}
            >
              <option value="patientName">Patient Name</option>
              <option value="invoiceNo">Invoice No</option>
              <option value="testName">Test Name</option>
            </select>
            
            <input
              type="text"
              name="searchValue"
              placeholder={`Search by ${
                filterInputs.searchType === 'patientName' ? 'Patient Name' :
                filterInputs.searchType === 'invoiceNo' ? 'Invoice No' :
                'Test Name'
              }`}
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyPress={handleKeyPress}
              className={styles.searchInput}
            />
          </div>

          {/* From Date — VendorList overlay-placeholder style */}
          <div className={styles.filterGroup}>
            <div className={styles.dateWrapper}>
              {!filterInputs.dateFrom && (
                <span className={styles.datePlaceholder}>From Date</span>
              )}
              <input
                type="date"
                name="dateFrom"
                value={filterInputs.dateFrom}
                onChange={handleFilterChange}
                className={`${styles.filterInput} ${!filterInputs.dateFrom ? styles.dateEmpty : ''}`}
              />
            </div>
          </div>

          {/* To Date — VendorList overlay-placeholder style */}
          <div className={styles.filterGroup}>
            <div className={styles.dateWrapper}>
              {!filterInputs.dateTo && (
                <span className={styles.datePlaceholder}>To Date</span>
              )}
              <input
                type="date"
                name="dateTo"
                value={filterInputs.dateTo}
                onChange={handleFilterChange}
                className={`${styles.filterInput} ${!filterInputs.dateTo ? styles.dateEmpty : ''}`}
              />
            </div>
          </div>

          {/* Actions */}
          <div className={styles.filterActions}>
            <button onClick={handleSearch} className={styles.searchButton}>
              <FiSearch size={18} />
              Search
            </button>
            {hasActiveFilters && (
              <button onClick={handleClearFilters} className={styles.clearButton}>
                <FiX size={18} />
                Clear
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Invoices Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Invoice Details</th>
              <th>Patient Details</th>
              <th>Tests Count</th>
              <th>Amount</th>
              <th>Tax (CGST + SGST)</th>
              <th>Net Amount</th>
              <th>Invoice Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groupedInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.noData}>
                  {Object.values(appliedFilters).some(v => v && v !== 'patientName') 
                    ? 'No invoices found matching your search.'
                    : 'No lab invoices found.'}
                </td>
              </tr>
            ) : (
              groupedInvoices.map((invoice) => (
                <tr key={invoice.invoiceId} className={styles.tableRow}>
                  <td>
                    <div>
                      <div className={styles.name}>{invoice.invoiceNo}</div>
                      <div className={styles.subText}>ID: {invoice.invoiceId}</div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.nameCell}>
                      <div className={styles.avatar}>
                        {invoice.patientName?.charAt(0).toUpperCase() || 'P'}
                      </div>
                      <div>
                        <div className={styles.name}>{invoice.patientName}</div>
                        <div className={styles.subText}>
                          {invoice.patientFileNo} • {invoice.patientMobile}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.testCount}>
                      <span className={styles.badge}>{invoice.details.length}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.amountCell}>
                      <div className={styles.name}>{formatCurrency(invoice.totalAmount)}</div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.taxCell}>
                      <div className={styles.name}>{formatCurrency(invoice.totalCgst + invoice.totalSgst)}</div>
                      <div className={styles.subText}>
                        CGST: {formatCurrency(invoice.totalCgst)} | SGST: {formatCurrency(invoice.totalSgst)}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.netAmountCell}>
                      <div className={styles.name}>{formatCurrency(invoice.totalNetAmount)}</div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.dateCell}>
                      <div className={styles.name}>{formatDate(invoice.invoiceDate)}</div>
                      <div className={styles.subText}>
                        {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        }) : '—'}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.actionsCell}>
                      <div className={styles.actionDropdownWrapper}>
                        <button 
                         onClick={() => handleViewInvoiceDetails(invoice)}
                         className={styles.actionBtn}
                         title="View Details">
                          View Details
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invoice Details Modal */}
      {isInvoiceDetailsOpen && selectedInvoiceDetail && (
        <InvoiceDetailsModal
          invoice={selectedInvoiceDetail}
          onClose={() => {
            setIsInvoiceDetailsOpen(false);
            setSelectedInvoiceDetail(null);
          }}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      )}
    </div>
  );
};

// Invoice Details Modal Component
const InvoiceDetailsModal = ({ invoice, onClose, formatCurrency, formatDate }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Invoice Details - {invoice.invoiceNo}</h2>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>
        <div className={styles.modalBody}>
          {/* Invoice Header Info */}
          <div className={styles.invoiceHeader}>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <label>Invoice No:</label>
                <span>{invoice.invoiceNo}</span>
              </div>
              <div className={styles.detailItem}>
                <label>Invoice Date:</label>
                <span>{formatDate(invoice.invoiceDate)}</span>
              </div>
              <div className={styles.detailItem}>
                <label>Patient Name:</label>
                <span>{invoice.patientName}</span>
              </div>
              <div className={styles.detailItem}>
                <label>Patient File No:</label>
                <span>{invoice.patientFileNo}</span>
              </div>
              <div className={styles.detailItem}>
                <label>Patient Mobile:</label>
                <span>{invoice.patientMobile}</span>
              </div>
              <div className={styles.detailItem}>
                <label>Clinic:</label>
                <span>{invoice.clinicName}</span>
              </div>
              <div className={styles.detailItem}>
                <label>Branch:</label>
                <span>{invoice.branchName}</span>
              </div>
            </div>
          </div>

          {/* Test Details Table */}
          <div className={styles.testDetailsSection}>
            <h3>Test Details</h3>
            <table className={styles.detailsTable}>
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Amount</th>
                  <th>CGST %</th>
                  <th>CGST Amt</th>
                  <th>SGST %</th>
                  <th>SGST Amt</th>
                  <th>Net Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.details.map((detail, index) => (
                  <tr key={index}>
                    <td>
                      <div>
                        <div className={styles.testName}>{detail.testName}</div>
                        {detail.masterTestName && (
                          <div className={styles.masterTestName}>{detail.masterTestName}</div>
                        )}
                      </div>
                    </td>
                    <td>{formatCurrency(detail.amount)}</td>
                    <td>{detail.cgstPercentage ? `${detail.cgstPercentage}%` : '—'}</td>
                    <td>{formatCurrency(detail.cgstAmount)}</td>
                    <td>{detail.sgstPercentage ? `${detail.sgstPercentage}%` : '—'}</td>
                    <td>{formatCurrency(detail.sgstAmount)}</td>
                    <td><strong>{formatCurrency(detail.netAmount)}</strong></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={styles.totalRow}>
                  <td><strong>Total</strong></td>
                  <td><strong>{formatCurrency(invoice.totalAmount)}</strong></td>
                  <td>—</td>
                  <td><strong>{formatCurrency(invoice.totalCgst)}</strong></td>
                  <td>—</td>
                  <td><strong>{formatCurrency(invoice.totalSgst)}</strong></td>
                  <td><strong>{formatCurrency(invoice.totalNetAmount)}</strong></td>
                </tr>
              </tfoot>
            </table>
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

export default LabInvoiceList;