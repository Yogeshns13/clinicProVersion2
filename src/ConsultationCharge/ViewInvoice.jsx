// src/components/ViewInvoice.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiFileText, FiUser, FiDollarSign, FiCalendar, FiClock, FiInfo } from 'react-icons/fi';
import { getInvoiceList } from '../Api/ApiInvoicePayment.js';
import styles from './ViewInvoice.module.css';
import {FaClinicMedical} from 'react-icons/fa';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';

const INVOICE_STATUSES = [
  { id: 1, label: 'Draft' },
  { id: 2, label: 'Issued' },
  { id: 3, label: 'Paid' },
  { id: 4, label: 'Partially Paid' },
  { id: 5, label: 'Cancelled' },
  { id: 6, label: 'Refunded' },
  { id: 7, label: 'Credit Note' }
];

const ViewInvoice = ({
  isOpen,
  onClose,
  invoiceId,
  invoiceStatus,
  invoiceNo,
  onCancelInvoice,
  cancelCooldown = {},
}) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (!invoiceId || !isOpen) return;

      try {
        setLoading(true);
        setError(null);

        const clinicId = await getStoredClinicId();
        const branchId = await getStoredBranchId();

        const data = await getInvoiceList(clinicId, {
          BranchID: branchId,
          InvoiceID: Number(invoiceId),
        });

        if (data && data.length > 0) {
          setInvoice(data[0]);
        } else {
          setError({ message: 'Invoice not found' });
        }
      } catch (err) {
        console.error('fetchInvoiceDetails error:', err);
        setError({
          message: err.message || 'Failed to load invoice details',
        });
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchInvoiceDetails();
    }
  }, [invoiceId, isOpen]);

  const formatCurrency = (amount) => {
    return amount != null ? `₹${Number(amount).toFixed(2)}` : '₹0.00';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusClass = (status) => {
    const statusMap = {
      1: 'draft',
      2: 'issued',
      3: 'paid',
      4: 'partial',
      5: 'cancelled',
      6: 'refunded',
      7: 'credit'
    };
    return statusMap[status] || 'draft';
  };

  const getStatusLabel = (status) => {
    const statusObj = INVOICE_STATUSES.find(s => s.id === status);
    return statusObj?.label || 'Unknown';
  };

  const calculateBalance = (netAmount, paidAmount) => {
    const net = Number(netAmount) || 0;
    const paid = Number(paidAmount) || 0;
    return net - paid;
  };

  // Use fetched invoice status when available, fall back to prop
  const currentStatus = invoice?.status ?? invoiceStatus;
  const isCancelled   = currentStatus === 5;
  
  const clinicName = localStorage.getItem('clinicName') || '—';
  const branchName = localStorage.getItem('branchName') || '—';

  if (!isOpen) return null;

  return (
    <div className={styles.invoiceModalOverlay}>
      <div className={styles.invoiceModal}>
        {/* Header */}
        <div className={styles.invoiceModalHeader}>
          <div className={styles.invoiceHeaderContent}>
            <FiFileText className={styles.invoiceHeaderIcon} size={24} />
            <h2>Invoice Details</h2>
          </div>
          <div className={styles.addModalHeaderCard}>
                      <div className={styles.clinicInfoIcon}>
                        <FaClinicMedical size={18} />
                      </div>
                      <div className={styles.clinicInfoText}>
                        <span className={styles.clinicInfoName}>{clinicName}</span>
                        <span className={styles.clinicInfoBranch}>{branchName}</span>
                      </div>
                      </div>
          <button onClick={onClose} className={styles.invoiceModalClose}>
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.invoiceModalBody}>
          {loading && (
            <div className={styles.invoiceLoading}>
              <div className={styles.invoiceSpinner}></div>
              <p>Loading invoice details...</p>
            </div>
          )}

          {error && (
            <div className={styles.invoiceError}>
              <p>Error: {error.message || error}</p>
            </div>
          )}

          {!loading && !error && invoice && (
            <>
              {/* Invoice Information */}
              <div className={styles.invoiceDetailsSection}>
                <h3 className={styles.invoiceSectionTitle}>
                  <FiFileText size={18} />
                  Invoice Information
                </h3>
                <div className={styles.invoiceDetailsGrid}>
                  <div className={styles.invoiceDetailItem}>
                    <span className={styles.invoiceDetailLabel}>Invoice Number</span>
                    <span className={styles.invoiceDetailValue}>{invoice.invoiceNo || '—'}</span>
                  </div>
                  <div className={styles.invoiceDetailItem}>
                    <span className={styles.invoiceDetailLabel}>Invoice Date</span>
                    <span className={styles.invoiceDetailValue}>{formatDate(invoice.invoiceDate)}</span>
                  </div>
                  <div className={styles.invoiceDetailItem}>
                    <span className={styles.invoiceDetailLabel}>Invoice Type</span>
                    <span className={styles.invoiceDetailValue}>{invoice.invoiceTypeDesc || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Patient Information */}
              <div className={styles.invoiceDetailsSection}>
                <h3 className={styles.invoiceSectionTitle}>
                  <FiUser size={18} />
                  Patient & Clinic Information
                </h3>
                <div className={styles.invoiceDetailsGrid}>
                  <div className={styles.invoiceDetailItem}>
                    <span className={styles.invoiceDetailLabel}>Patient Name</span>
                    <span className={styles.invoiceDetailValue}>{invoice.patientName || '—'}</span>
                  </div>
                  <div className={styles.invoiceDetailItem}>
                    <span className={styles.invoiceDetailLabel}>File Number</span>
                    <span className={styles.invoiceDetailValue}>{invoice.patientFileNo || '—'}</span>
                  </div>
                  <div className={styles.invoiceDetailItem}>
                    <span className={styles.invoiceDetailLabel}>Mobile</span>
                    <span className={styles.invoiceDetailValue}>{invoice.patientMobile || '—'}</span>
                  </div>
                  <div className={styles.invoiceDetailItem}>
                    <span className={styles.invoiceDetailLabel}>Clinic Name</span>
                    <span className={styles.invoiceDetailValue}>{invoice.clinicName || '—'}</span>
                  </div>
                  <div className={styles.invoiceDetailItem}>
                    <span className={styles.invoiceDetailLabel}>Branch Name</span>
                    <span className={styles.invoiceDetailValue}>{invoice.branchName || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Amount Details */}
              <div className={styles.invoiceDetailsSection}>
                <h3 className={styles.invoiceSectionTitle}>
                  <FiDollarSign size={18} />
                  Amount & Record Information
                </h3>
                <div className={styles.invoiceDetailsGrid}>
                  <div className={styles.invoiceDetailItem}>
                    <span className={styles.invoiceDetailLabel}>Total Amount</span>
                    <span className={`${styles.invoiceDetailValue} ${styles.invoiceAmountHighlight}`}>
                      {formatCurrency(invoice.totalAmount)}
                    </span>
                  </div>
                  <div className={styles.invoiceDetailItem}>
                    <span className={styles.invoiceDetailLabel}>Discount</span>
                    <span className={styles.invoiceDetailValue}>
                      {formatCurrency(invoice.discount)}
                    </span>
                  </div>
                  <div className={styles.invoiceDetailItem}>
                    <span className={styles.invoiceDetailLabel}>CGST Amount</span>
                    <span className={styles.invoiceDetailValue}>
                      {formatCurrency(invoice.cgstAmount)}
                    </span>
                  </div>
                  <div className={styles.invoiceDetailItem}>
                    <span className={styles.invoiceDetailLabel}>SGST Amount</span>
                    <span className={styles.invoiceDetailValue}>
                      {formatCurrency(invoice.sgstAmount)}
                    </span>
                  </div>
                  <div className={styles.invoiceDetailItem}>
                    <span className={styles.invoiceDetailLabel}>Net Amount</span>
                    <span className={`${styles.invoiceDetailValue} ${styles.invoiceAmountHighlight}`}>
                      {formatCurrency(invoice.netAmount)}
                    </span>
                  </div>
                  <div className={styles.invoiceDetailItem}>
                    <span className={styles.invoiceDetailLabel}>Paid Amount</span>
                    <span className={`${styles.invoiceDetailValue} ${styles.invoicePaidAmount}`}>
                      {formatCurrency(invoice.paidAmount)}
                    </span>
                  </div>
                  <div className={styles.invoiceDetailItem}>
                    <span className={styles.invoiceDetailLabel}>Balance Amount</span>
                    <span className={`${styles.invoiceDetailValue} ${styles.invoiceBalanceAmount}`}>
                      {formatCurrency(calculateBalance(invoice.netAmount, invoice.paidAmount))}
                    </span>
                  </div>
                  <div className={styles.invoiceDetailItem}>
                    <span className={styles.invoiceDetailLabel}>Date Created</span>
                    <span className={styles.invoiceDetailValue}>{formatDate(invoice.dateCreated)}</span>
                  </div>
                  <div className={styles.invoiceDetailItem}>
                    <span className={styles.invoiceDetailLabel}>Last Modified</span>
                    <span className={styles.invoiceDetailValue}>{formatDate(invoice.dateModified)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.invoiceModalFooter}>
          {/* Cancel Invoice — only shown when invoice is NOT already cancelled */}
          {!isCancelled && !loading && !error && invoice && (
            <button
              onClick={() => onCancelInvoice && onCancelInvoice(invoice)}
              className={styles.invoiceCancelBtn}
              disabled={!!cancelCooldown[`cancel-${invoiceId}`]}
              title="Cancel this invoice"
            >
              Cancel Invoice
            </button>
          )}
          <button onClick={onClose} className={styles.invoiceCloseBtn}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewInvoice;