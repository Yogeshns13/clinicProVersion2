// src/components/Pharmacy/PharmacyInvoiceList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX, FiCalendar, FiFilter, FiEye, FiFileText, FiDollarSign, FiDownload, FiPrinter, FiPackage } from 'react-icons/fi';
import { getPharmacyInvoiceDetailList } from '../Api/ApiPharmacy.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './PharmacyInvoiceList.module.css';


const SEARCH_TYPE_OPTIONS = [
  { value: 'customerName', label: 'Customer Name' },
  { value: 'invoiceNo',    label: 'Invoice No'    },
  { value: 'medicineName', label: 'Medicine Name' },
  { value: 'batchNo',      label: 'Batch No'      },
];

const PharmacyInvoiceList = () => {
  const navigate = useNavigate();
  
  // Data States
  const [invoiceDetails, setInvoiceDetails] = useState([]);
  const [allInvoiceDetails, setAllInvoiceDetails] = useState([]);
  
  // Filter inputs (staged — not applied until Search is clicked)
  const [filterInputs, setFilterInputs] = useState({
    searchType:  'customerName',
    searchValue: '',
    dateFrom:    '',
    dateTo:      '',
  });

  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState({
    searchType:  'customerName',
    searchValue: '',
    dateFrom:    '',
    dateTo:      '',
  });

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal States
  const [isInvoiceDetailsOpen, setIsInvoiceDetailsOpen] = useState(false);
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState(null);

  // Fetch Pharmacy Invoice Details
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

      const data = await getPharmacyInvoiceDetailList(clinicId, options);

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
          : { message: err.message || 'Failed to load pharmacy invoice details' }
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

    if (appliedFilters.searchValue) {
      const term = appliedFilters.searchValue.toLowerCase();
      
      switch (appliedFilters.searchType) {
        case 'customerName':
          filtered = filtered.filter(inv => inv.customerName?.toLowerCase().includes(term));
          break;
        case 'invoiceNo':
          filtered = filtered.filter(inv => inv.invoiceNo?.toLowerCase().includes(term));
          break;
        case 'medicineName':
          filtered = filtered.filter(inv => inv.medicineName?.toLowerCase().includes(term));
          break;
        case 'batchNo':
          filtered = filtered.filter(inv => inv.batchNo?.toLowerCase().includes(term));
          break;
        default:
          break;
      }
    }

    if (appliedFilters.dateFrom) {
      const fromDate = new Date(appliedFilters.dateFrom);
      filtered = filtered.filter(inv => {
        if (!inv.invoiceDate) return false;
        const invoiceDate = new Date(inv.invoiceDate);
        return invoiceDate >= fromDate;
      });
    }

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
          customerName: detail.customerName,
          patientMobile: detail.patientMobile,
          patientFileNo: detail.patientFileNo,
          clinicName: detail.clinicName,
          branchName: detail.branchName,
          dateCreated: detail.dateCreated,
          details: [],
          totalQuantity: 0,
          totalAmount: 0,
          totalCgst: 0,
          totalSgst: 0,
          totalNetAmount: 0
        };
      }
      
      groups[invoiceId].details.push(detail);
      groups[invoiceId].totalQuantity  += detail.quantity       || 0;
      groups[invoiceId].totalAmount    += detail.amount         || 0;
      groups[invoiceId].totalCgst      += detail.cgstAmount     || 0;
      groups[invoiceId].totalSgst      += detail.sgstAmount     || 0;
      groups[invoiceId].totalNetAmount += detail.totalLineAmount || 0;
    });
    
    return Object.values(groups).sort((a, b) => {
      const dateA = new Date(a.dateCreated);
      const dateB = new Date(b.dateCreated);
      return dateB - dateA;
    });
  }, [filteredInvoiceDetails]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    const uniqueInvoices = new Set(allInvoiceDetails.map(d => d.invoiceId)).size;
    const totalRevenue   = allInvoiceDetails.reduce((sum, d) => sum + (d.totalLineAmount || 0), 0);
    const totalMedicines = allInvoiceDetails.reduce((sum, d) => sum + (d.quantity || 0), 0);
    const avgInvoiceValue = uniqueInvoices > 0 ? totalRevenue / uniqueInvoices : 0;
    return { uniqueInvoices, totalRevenue, totalMedicines, avgInvoiceValue };
  }, [allInvoiceDetails]);

  // ── Derived: are any filters active?
  const hasActiveFilters =
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.dateFrom            !== '' ||
    appliedFilters.dateTo              !== '';

  // Filter handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filterInputs });
  };

  const handleClearFilters = () => {
    const empty = { searchType: 'customerName', searchValue: '', dateFrom: '', dateTo: '' };
    setFilterInputs(empty);
    setAppliedFilters(empty);
  };

  const handleViewInvoiceDetails = (invoice) => {
    setSelectedInvoiceDetail(invoice);
    setIsInvoiceDetailsOpen(true);
  };

  const handlePrintInvoice = (invoice) => {
    console.log('Print invoice:', invoice.invoiceNo);
    alert(`Print functionality for Invoice ${invoice.invoiceNo} will be implemented.`);
  };

  const handleDownloadInvoice = (invoice) => {
    console.log('Download invoice:', invoice.invoiceNo);
    alert(`Download functionality for Invoice ${invoice.invoiceNo} will be implemented.`);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
        <p>Loading pharmacy invoices...</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Pharmacy Invoice Management" />


      {/* ── Filter Bar — VendorList style ── */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>

          {/* VendorList-style fused search type + value */}
          <div className={styles.searchGroup}>
            <select
              name="searchType"
              value={filterInputs.searchType}
              onChange={handleFilterChange}
              className={styles.searchTypeSelect}
            >
              {SEARCH_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input
              type="text"
              name="searchValue"
              placeholder={`Search by ${SEARCH_TYPE_OPTIONS.find(o => o.value === filterInputs.searchType)?.label || ''}`}
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className={styles.searchInput}
            />
          </div>

          {/* From Date */}
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

          {/* To Date */}
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

          <div className={styles.filterActions}>
            <button onClick={handleSearch} className={styles.searchButton}>
              <FiSearch size={16} />
              Search
            </button>
            {hasActiveFilters && (
              <button onClick={handleClearFilters} className={styles.clearButton}>
                <FiX size={16} />
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
              <th>Customer Details</th>
              <th>Items Count</th>
              <th>Quantity</th>
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
                <td colSpan={9} className={styles.noData}>
                  {hasActiveFilters
                    ? 'No invoices found matching your search.'
                    : 'No pharmacy invoices found.'}
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
                        {invoice.customerName?.charAt(0).toUpperCase() || 'C'}
                      </div>
                      <div>
                        <div className={styles.name}>{invoice.customerName}</div>
                        <div className={styles.subText}>
                          {invoice.patientFileNo} • {invoice.patientMobile}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.itemCount}>
                      <span className={styles.badge}>{invoice.details.length}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.quantityCell}>
                      <div className={styles.name}>{invoice.totalQuantity}</div>
                      <div className={styles.subText}>units</div>
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
                          className={styles.actionBtn}
                          onClick={() => handleViewInvoiceDetails(invoice)}
                          title="View Details"
                        >
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

// ──────────────────────────────────────────────────
// Invoice Details Modal Component
// ──────────────────────────────────────────────────
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
                <label>Customer Name:</label>
                <span>{invoice.customerName}</span>
              </div>
              <div className={styles.detailItem}>
                <label>File No:</label>
                <span>{invoice.patientFileNo}</span>
              </div>
              <div className={styles.detailItem}>
                <label>Mobile:</label>
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

          {/* Medicine Details Table */}
          <div className={styles.medicineDetailsSection}>
            <h3>Medicine Details</h3>
            <table className={styles.detailsTable}>
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Batch No</th>
                  <th>Expiry</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Amount</th>
                  <th>CGST</th>
                  <th>SGST</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.details.map((detail, index) => (
                  <tr key={index}>
                    <td>
                      <div>
                        <div className={styles.medicineName}>{detail.medicineName}</div>
                        {detail.genericName && (
                          <div className={styles.genericName}>{detail.genericName}</div>
                        )}
                        {detail.manufacturer && (
                          <div className={styles.manufacturer}>Mfr: {detail.manufacturer}</div>
                        )}
                      </div>
                    </td>
                    <td>{detail.batchNo || '—'}</td>
                    <td>{formatDate(detail.expiryDate)}</td>
                    <td><strong>{detail.quantity}</strong></td>
                    <td>{formatCurrency(detail.unitPrice)}</td>
                    <td>{formatCurrency(detail.amount)}</td>
                    <td>
                      <div>
                        <div>{detail.cgstPercentage ? `${detail.cgstPercentage}%` : '—'}</div>
                        <div className={styles.taxAmount}>{formatCurrency(detail.cgstAmount)}</div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div>{detail.sgstPercentage ? `${detail.sgstPercentage}%` : '—'}</div>
                        <div className={styles.taxAmount}>{formatCurrency(detail.sgstAmount)}</div>
                      </div>
                    </td>
                    <td><strong>{formatCurrency(detail.totalLineAmount)}</strong></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={styles.totalRow}>
                  <td colSpan="3"><strong>Total</strong></td>
                  <td><strong>{invoice.totalQuantity}</strong></td>
                  <td>—</td>
                  <td><strong>{formatCurrency(invoice.totalAmount)}</strong></td>
                  <td><strong>{formatCurrency(invoice.totalCgst)}</strong></td>
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

export default PharmacyInvoiceList;