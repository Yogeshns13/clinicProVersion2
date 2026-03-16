// src/components/ViewInvoice.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiFileText, FiUser, FiDollarSign, FiCalendar, FiClock, FiInfo } from 'react-icons/fi';
import { getInvoiceList } from '../Api/ApiInvoicePayment.js';
import './ViewInvoice.css';
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

const ViewInvoice = ({ isOpen, onClose, invoiceId }) => {
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

  if (!isOpen) return null;

  return (
    <div className="invoice-modal-overlay">
      <div className="invoice-modal">
        {/* Header */}
        <div className="invoice-modal-header">
          <div className="invoice-header-content">
            <FiFileText className="invoice-header-icon" size={24} />
            <h2>Invoice Details</h2>
          </div>
          <div className="clinicNameone">
            <FaClinicMedical size={18} style={{ verticalAlign: 'middle', margin: '6px', marginTop: '0px' }} />  
              {localStorage.getItem('clinicName') || '—'}
                </div>
          <button onClick={onClose} className="invoice-modal-close">
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="invoice-modal-body">
          {loading && (
            <div className="invoice-loading">
              <div className="invoice-spinner"></div>
              <p>Loading invoice details...</p>
            </div>
          )}

          {error && (
            <div className="invoice-error">
              <p>Error: {error.message || error}</p>
            </div>
          )}

          {!loading && !error && invoice && (
            <>
              {/* Invoice Information */}
              <div className="invoice-details-section">
                <h3 className="invoice-section-title">
                  <FiFileText size={18} />
                  Invoice Information
                </h3>
                <div className="invoice-details-grid">
                  <div className="invoice-detail-item">
                    <span className="invoice-detail-label">Invoice Number</span>
                    <span className="invoice-detail-value">{invoice.invoiceNo || '—'}</span>
                  </div>
                  <div className="invoice-detail-item">
                    <span className="invoice-detail-label">Invoice Date</span>
                    <span className="invoice-detail-value">{formatDate(invoice.invoiceDate)}</span>
                  </div>
                  <div className="invoice-detail-item">
                    <span className="invoice-detail-label">Invoice Type</span>
                    <span className="invoice-detail-value">{invoice.invoiceTypeDesc || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Patient Information */}
              <div className="invoice-details-section">
                <h3 className="invoice-section-title">
                  <FiUser size={18} />
                  Patient & Clinic Information
                </h3>
                <div className="invoice-details-grid">
                  <div className="invoice-detail-item">
                    <span className="invoice-detail-label">Patient Name</span>
                    <span className="invoice-detail-value">{invoice.patientName || '—'}</span>
                  </div>
                  <div className="invoice-detail-item">
                    <span className="invoice-detail-label">File Number</span>
                    <span className="invoice-detail-value">{invoice.patientFileNo || '—'}</span>
                  </div>
                  <div className="invoice-detail-item">
                    <span className="invoice-detail-label">Mobile</span>
                    <span className="invoice-detail-value">{invoice.patientMobile || '—'}</span>
                  </div>
                  <div className="invoice-detail-item">
                    <span className="invoice-detail-label">Clinic Name</span>
                    <span className="invoice-detail-value">{invoice.clinicName || '—'}</span>
                  </div>
                  <div className="invoice-detail-item">
                    <span className="invoice-detail-label">Branch Name</span>
                    <span className="invoice-detail-value">{invoice.branchName || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Amount Details */}
              <div className="invoice-details-section">
                <h3 className="invoice-section-title">
                  <FiDollarSign size={18} />
                  Amount & Record Information
                </h3>
                <div className="invoice-details-grid">
                  <div className="invoice-detail-item">
                    <span className="invoice-detail-label">Total Amount</span>
                    <span className="invoice-detail-value invoice-amount-highlight">
                      {formatCurrency(invoice.totalAmount)}
                    </span>
                  </div>
                  <div className="invoice-detail-item">
                    <span className="invoice-detail-label">Discount</span>
                    <span className="invoice-detail-value">
                      {formatCurrency(invoice.discount)}
                    </span>
                  </div>
                  <div className="invoice-detail-item">
                    <span className="invoice-detail-label">CGST Amount</span>
                    <span className="invoice-detail-value">
                      {formatCurrency(invoice.cgstAmount)}
                    </span>
                  </div>
                  <div className="invoice-detail-item">
                    <span className="invoice-detail-label">SGST Amount</span>
                    <span className="invoice-detail-value">
                      {formatCurrency(invoice.sgstAmount)}
                    </span>
                  </div>
                  <div className="invoice-detail-item">
                    <span className="invoice-detail-label">Net Amount</span>
                    <span className="invoice-detail-value invoice-amount-highlight">
                      {formatCurrency(invoice.netAmount)}
                    </span>
                  </div>
                  <div className="invoice-detail-item">
                    <span className="invoice-detail-label">Paid Amount</span>
                    <span className="invoice-detail-value invoice-paid-amount">
                      {formatCurrency(invoice.paidAmount)}
                    </span>
                  </div>
                  <div className="invoice-detail-item">
                    <span className="invoice-detail-label">Balance Amount</span>
                    <span className="invoice-detail-value invoice-balance-amount">
                      {formatCurrency(calculateBalance(invoice.netAmount, invoice.paidAmount))}
                    </span>
                  </div>
                  <div className="invoice-detail-item">
                    <span className="invoice-detail-label">Date Created</span>
                    <span className="invoice-detail-value">{formatDate(invoice.dateCreated)}</span>
                  </div>
                  <div className="invoice-detail-item">
                    <span className="invoice-detail-label">Last Modified</span>
                    <span className="invoice-detail-value">{formatDate(invoice.dateModified)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="invoice-modal-footer">
          <button onClick={onClose} className="invoice-close-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewInvoice;