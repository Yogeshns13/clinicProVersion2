// src/components/SalesCartDetailList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiShoppingCart,
  FiPackage,
  FiUser,
  FiHash,
  FiCalendar,
  FiAlertCircle,
  FiRefreshCw,
  FiDownload,
  FiMapPin,
  FiFileText,
  FiCheckCircle,
  FiX,
  FiPercent,
  FiEdit2,
} from 'react-icons/fi';
import {
  getSalesCartDetailList,
  generatePharmacyInvoice,
  deleteSalesCartDetail,
  addSalesCartDetail,
} from '../api/api-pharmacy.js';
import Header from '../Header/Header.jsx';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import styles from './SalesCartDetailList.module.css';

// ─────────────────────────────────────────────────────────
const SalesCartDetailList = () => {
  const params   = useParams();
  const navigate = useNavigate();

  const cartId =
    params.cartId ||
    params.id ||
    Object.values(params)[0] ||
    window.location.pathname.split('/').filter(Boolean).pop();

  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // ── Invoice modal state ───────────────────────────────
  const [invoice, setInvoice] = useState({
    isOpen:      false,
    discount:    '',
    submitting:  false,
    error:       null,
    success:     false,
    invoiceId:   null,
    message:     '',
  });

  // ── Update Quantity modal state ───────────────────────
  const [updateQty, setUpdateQty] = useState({
    isOpen:       false,
    item:         null,      // the full cart detail item being edited
    newQty:       '',
    newDiscount:  '',        // discount % for this line item
    submitting:   false,
    error:        null,
    success:      false,
  });

  // ─────────────────────────────────────────────────────
  // FETCH
  // ─────────────────────────────────────────────────────
  const fetchDetails = async () => {
    const numericId = Number(cartId);
    if (!cartId || isNaN(numericId) || numericId <= 0) {
      setError({ message: `Invalid cart ID: "${cartId}".` });
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setDetails([]);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const data = await getSalesCartDetailList(clinicId, {
        CartID:   numericId,
        BranchID: branchId,
        PageSize: 100,
      });
      // Auto-delete cancelled (status 3) items silently, then show the rest
      const cancelled = data.filter((item) => item.status === 3);
      if (cancelled.length > 0) {
        await Promise.allSettled(cancelled.map((item) => deleteSalesCartDetail(item.id)));
      }
      setDetails(data.filter((item) => item.status !== 3));
    } catch (err) {
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load cart details.' }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (cartId) fetchDetails(); }, [cartId]);

  // ─────────────────────────────────────────────────────
  // TOTALS
  // ─────────────────────────────────────────────────────
  const totals = useMemo(() => {
    return details.reduce(
      (acc, item) => {
        acc.totalAmount += Number(item.totalAmount) || 0;
        acc.discount    += Number(item.discount)    || 0;
        acc.cgst        += Number(item.cgstAmount)  || 0;
        acc.sgst        += Number(item.sgstAmount)  || 0;
        acc.netAmount   += Number(item.netAmount)   || 0;
        return acc;
      },
      { totalAmount: 0, discount: 0, cgst: 0, sgst: 0, netAmount: 0 }
    );
  }, [details]);

  const meta = details[0] ?? null;

  // ─────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────
  const fmt = (val) =>
    val == null ? '—' : `₹${Number(val).toFixed(2)}`;

  const fmtDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const exportCSV = () => {
    const headers = [
      '#','Medicine','Generic Name','Manufacturer',
      'Batch No','Expiry','Qty',
      'Unit Price','Discount %','Discount Amt',
      'Total','CGST','SGST','Net Amount','Status',
    ];
    const rows = details.map((item, idx) => [
      idx + 1,
      item.medicineName,
      item.genericName   || '',
      item.manufacturer  || '',
      item.batchNo       || '',
      fmtDate(item.expiryDate),
      item.quantity,
      Number(item.unitPrice).toFixed(2),
      Number(item.discountPercentage).toFixed(2),
      Number(item.discount).toFixed(2),
      Number(item.totalAmount).toFixed(2),
      Number(item.cgstAmount).toFixed(2),
      Number(item.sgstAmount).toFixed(2),
      Number(item.netAmount).toFixed(2),
      item.statusDesc,
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href: url, download: `sales-cart-${cartId}.csv`,
    });
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─────────────────────────────────────────────────────
  // INVOICE MODAL HANDLERS
  // ─────────────────────────────────────────────────────
  const openInvoiceModal = () => {
    setInvoice({
      isOpen:     true,
      discount:   '',
      submitting: false,
      error:      null,
      success:    false,
      invoiceId:  null,
      message:    '',
    });
  };

  const closeInvoiceModal = () => {
    if (invoice.submitting) return;
    setInvoice((prev) => ({ ...prev, isOpen: false }));
  };

  const handleGenerateInvoice = async () => {
    const discountVal = Number(invoice.discount) || 0;
    if (discountVal < 0 || discountVal > 100) {
      setInvoice((prev) => ({
        ...prev,
        error: 'Discount must be between 0 and 100.',
      }));
      return;
    }

    setInvoice((prev) => ({ ...prev, submitting: true, error: null }));

    try {
      const clinicId    = Number(localStorage.getItem('clinicID'));
      const branchId    = Number(localStorage.getItem('branchID'));
      const invoiceDate = new Date().toISOString().split('T')[0];

      const result = await generatePharmacyInvoice({
        cartId:      Number(cartId),
        clinicId,
        branchId,
        invoiceDate,
        discount:    discountVal,
      });

      setInvoice((prev) => ({
        ...prev,
        submitting: false,
        success:    true,
        invoiceId:  result.invoiceId,
        message:    result.message || 'Invoice generated successfully!',
      }));
    } catch (err) {
      setInvoice((prev) => ({
        ...prev,
        submitting: false,
        error: err.message || 'Failed to generate invoice.',
      }));
    }
  };

  // ─────────────────────────────────────────────────────
  // UPDATE QUANTITY MODAL HANDLERS
  // ─────────────────────────────────────────────────────
  const openUpdateQtyModal = (item) => {
    setUpdateQty({
      isOpen:       true,
      item,
      newQty:       String(item.quantity ?? ''),
      newDiscount:  String(Number(item.discountPercentage) || 0),
      submitting:   false,
      error:        null,
      success:      false,
    });
  };

  const closeUpdateQtyModal = () => {
    if (updateQty.submitting) return;
    setUpdateQty((prev) => ({ ...prev, isOpen: false }));
  };

  const handleUpdateQty = async () => {
    const newQtyVal = Number(updateQty.newQty);

    if (!updateQty.newQty || isNaN(newQtyVal) || newQtyVal <= 0 || !Number.isInteger(newQtyVal)) {
      setUpdateQty((prev) => ({
        ...prev,
        error: 'Please enter a valid whole number greater than 0.',
      }));
      return;
    }

    const newDiscountVal = Number(updateQty.newDiscount) || 0;
    if (isNaN(newDiscountVal) || newDiscountVal < 0 || newDiscountVal > 100) {
      setUpdateQty((prev) => ({
        ...prev,
        error: 'Discount must be a number between 0 and 100.',
      }));
      return;
    }

    setUpdateQty((prev) => ({ ...prev, submitting: true, error: null }));

    const item     = updateQty.item;
    const clinicId = Number(localStorage.getItem('clinicID'));
    const branchId = Number(localStorage.getItem('branchID'));

    // ── Phase 1: Delete existing cart detail ──────────────
    try {
      await deleteSalesCartDetail(item.id);
    } catch (err) {
      setUpdateQty((prev) => ({
        ...prev,
        submitting: false,
        error: `Delete failed: ${err.message || 'Could not remove existing item. No changes made.'}`,
      }));
      return; // abort — nothing was changed yet
    }

    // ── Phase 2: Re-add with updated quantity & discount ──
    try {
      await addSalesCartDetail({
        CartID:             item.cartId,
        MedicineID:         item.medicineId,
        Quantity:           newQtyVal,
        UnitPrice:          Number(item.unitPrice) || 0,
        DiscountPercentage: newDiscountVal,
        BatchSelection:     'FEFO',   // selection strategy — NOT the batch number string
        clinicId,
        branchId,
      });
    } catch (err) {
      // Delete already succeeded — keep modal open so the user sees the warning clearly
      setUpdateQty((prev) => ({
        ...prev,
        submitting: false,
        error: `⚠️ Item was deleted but could not be re-added: ${err.message || 'Please add it manually.'}`,
      }));
      return; // do NOT call fetchDetails here — let the user read the error first
    }

    // ── Done: close modal and refresh list ────────────────
    setUpdateQty((prev) => ({ ...prev, submitting: false, success: true }));
    setTimeout(() => {
      setUpdateQty((prev) => ({ ...prev, isOpen: false }));
      fetchDetails();
    }, 900);
  };

  // ─────────────────────────────────────────────────────
  // EARLY RETURN
  // ─────────────────────────────────────────────────────
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  // ─────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <Header title="Sales Cart Detail" />

      {/* ══ PAGE HEADER ══ */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <FiArrowLeft size={17} />
            Back
          </button>
        </div>

        {!loading && !error && details.length > 0 && (
          <div className={styles.headerActions}>
            <button className={styles.exportBtn} onClick={exportCSV}>
              <FiDownload size={15} />
              Export CSV
            </button>
            <button className={styles.invoiceBtn} onClick={openInvoiceModal}>
              <FiFileText size={15} />
              Generate Invoice
            </button>
          </div>
        )}
      </div>

      {/* ══ PATIENT INFO CARD ══ */}
      {!loading && meta && (
        <div className={styles.infoCard}>
          <div className={styles.infoItem}>
            <FiUser size={13} className={styles.infoIcon} />
            <div>
              <span className={styles.infoLabel}>Patient</span>
              <span className={styles.infoValue}>{meta.customerName || '—'}</span>
            </div>
          </div>
          {meta.patientFileNo && (
            <div className={styles.infoItem}>
              <FiHash size={13} className={styles.infoIcon} />
              <div>
                <span className={styles.infoLabel}>File No</span>
                <span className={styles.infoValue}>{meta.patientFileNo}</span>
              </div>
            </div>
          )}
          {meta.patientMobile && (
            <div className={styles.infoItem}>
              <div>
                <span className={styles.infoLabel}>Mobile</span>
                <span className={styles.infoValue}>{meta.patientMobile}</span>
              </div>
            </div>
          )}
          {meta.branchName && (
            <div className={styles.infoItem}>
              <FiMapPin size={13} className={styles.infoIcon} />
              <div>
                <span className={styles.infoLabel}>Branch</span>
                <span className={styles.infoValue}>{meta.branchName}</span>
              </div>
            </div>
          )}
          <div className={styles.infoItem}>
            <FiCalendar size={13} className={styles.infoIcon} />
            <div>
              <span className={styles.infoLabel}>Created</span>
              <span className={styles.infoValue}>{fmtDate(meta.dateCreated)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ══ LOADING / ERROR / EMPTY STATES ══ */}
      {loading && (
        <div className={styles.centerState}>
          <div className={styles.spinner} />
          <span>Loading cart items...</span>
        </div>
      )}
      {!loading && error && (
        <div className={`${styles.centerState} ${styles.errorState}`}>
          <FiAlertCircle size={26} />
          <p>{error.message || 'Something went wrong.'}</p>
          <button className={styles.retryBtn} onClick={fetchDetails}>
            <FiRefreshCw size={14} /> Retry
          </button>
        </div>
      )}
      {!loading && !error && details.length === 0 && (
        <div className={styles.centerState}>
          <FiPackage size={48} className={styles.emptyIcon} />
          <p>No items found in this cart.</p>
        </div>
      )}

      {/* ══ TABLE ══ */}
      {!loading && !error && details.length > 0 && (
        <>
          <div className={styles.tableCard}>
            <div className={styles.tableCardHeader}>
              <h3 className={styles.tableCardTitle}>
                <FiPackage size={16} />
                Cart Items
              </h3>
              <span className={styles.itemCountBadge}>
                {details.length} item{details.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Medicine</th>
                    <th>Batch No</th>
                    <th>Expiry</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Discount</th>
                    <th>Total</th>
                    <th>CGST</th>
                    <th>SGST</th>
                    <th>Net Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((item, idx) => (
                    <tr key={item.id}>
                      <td className={styles.idxCell}>{idx + 1}</td>
                      <td>
                        <div className={styles.medName}>{item.medicineName}</div>
                        {item.genericName && <div className={styles.medSub}>{item.genericName}</div>}
                      </td>
                      <td>
                        {item.batchNo
                          ? <span className={styles.batchBadge}>{item.batchNo}</span>
                          : <span className={styles.dash}>—</span>}
                      </td>
                      <td className={styles.dateCell}>{fmtDate(item.expiryDate)}</td>
                      <td><span className={styles.qtyBadge}>{item.quantity ?? 0}</span></td>
                      <td className={styles.numCell}>{fmt(item.unitPrice)}</td>
                      <td className={styles.numCell}>
                        {Number(item.discountPercentage) > 0 ? (
                          <div className={styles.discountGroup}>
                            <span className={styles.discPct}>{Number(item.discountPercentage).toFixed(1)}%</span>
                            <span className={styles.discAmt}>({fmt(item.discount)})</span>
                          </div>
                        ) : (
                          <span className={styles.dash}>—</span>
                        )}
                      </td>
                      <td className={styles.numCell}><span className={styles.totalAmt}>{fmt(item.totalAmount)}</span></td>
                      <td className={styles.numCell}><span className={styles.taxAmt}>{fmt(item.cgstAmount)}</span></td>
                      <td className={styles.numCell}><span className={styles.taxAmt}>{fmt(item.sgstAmount)}</span></td>
                      <td className={styles.numCell}><span className={styles.netAmt}>{fmt(item.netAmount)}</span></td>
                      <td>
                        <span className={`${styles.statusBadge} ${item.status === 1 ? styles.statusActive : styles.statusInactive}`}>
                          {item.statusDesc}
                        </span>
                      </td>
                      {/* ── Update Qty action ── */}
                      <td className={styles.actionCell}>
                        <button
                          className={styles.updateQtyBtn}
                          onClick={() => openUpdateQtyModal(item)}
                          title="Update Quantity"
                        >
                          <FiEdit2 size={13} />
                          Qty
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={7} className={styles.footerLabel}>Subtotals</td>
                    <td className={styles.footerCell}>{fmt(totals.totalAmount)}</td>
                    <td className={styles.footerCell}>{fmt(totals.cgst)}</td>
                    <td className={styles.footerCell}>{fmt(totals.sgst)}</td>
                    <td className={styles.footerCell}>{fmt(totals.netAmount)}</td>
                    <td /><td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ══ SUMMARY STRIP ══ */}
          <div className={styles.summaryStrip}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Items</span>
              <span className={styles.summaryValue}>{details.length}</span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Subtotal</span>
              <span className={styles.summaryValue}>{fmt(totals.totalAmount)}</span>
            </div>
            {totals.discount > 0 && (
              <>
                <div className={styles.summaryDivider} />
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Discount</span>
                  <span className={`${styles.summaryValue} ${styles.discountValue}`}>-{fmt(totals.discount)}</span>
                </div>
              </>
            )}
            <div className={styles.summaryDivider} />
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>CGST + SGST</span>
              <span className={styles.summaryValue}>{fmt(totals.cgst + totals.sgst)}</span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={`${styles.summaryItem} ${styles.grandTotalItem}`}>
              <span className={styles.summaryLabel}>Grand Total</span>
              <span className={`${styles.summaryValue} ${styles.grandTotalValue}`}>{fmt(totals.netAmount)}</span>
            </div>
          </div>
        </>
      )}

      {/* ══ GENERATE INVOICE MODAL ══ */}
      {invoice.isOpen && (
        <div
          className={styles.modalOverlay}
          onClick={!invoice.submitting ? closeInvoiceModal : undefined}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

            {/* ── Modal Header ── */}
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderContent}>
                <div className={styles.modalHeaderIcon}>
                  <FiFileText size={20} />
                </div>
                <div>
                  <h2 className={styles.modalTitle}>Generate Invoice</h2>
                  <p className={styles.modalSubtitle}>Cart ID: #{cartId}</p>
                </div>
              </div>
              {!invoice.submitting && !invoice.success && (
                <button className={styles.modalClose} onClick={closeInvoiceModal}>
                  <FiX size={16} />
                </button>
              )}
            </div>

            {/* ── Modal Body ── */}
            <div className={styles.modalBody}>

              {/* Success */}
              {invoice.success && (
                <div className={styles.successState}>
                  <div className={styles.successIconWrap}>
                    <FiCheckCircle size={48} />
                  </div>
                  <h3>Invoice Generated!</h3>
                  {invoice.invoiceId && (
                    <p>Invoice ID: <strong>#{invoice.invoiceId}</strong></p>
                  )}
                  <p className={styles.successMsg}>{invoice.message}</p>
                </div>
              )}

              {/* Form */}
              {!invoice.success && (
                <>
                  {/* Confirmation prompt */}
                  <div className={styles.confirmPrompt}>
                    <FiAlertCircle size={18} className={styles.confirmIcon} />
                    <p>
                      Are you sure you want to generate a pharmacy invoice for this cart?
                      This action cannot be undone.
                    </p>
                  </div>

                  {/* Discount input */}
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>
                      <FiPercent size={13} />
                      Discount (%)
                    </label>
                    <div className={styles.inputWrapper}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="Enter discount % (0 – 100)"
                        value={invoice.discount}
                        onChange={(e) =>
                          setInvoice((prev) => ({
                            ...prev,
                            discount: e.target.value,
                            error: null,
                          }))
                        }
                        className={styles.discountInput}
                        disabled={invoice.submitting}
                      />
                      <span className={styles.inputSuffix}>%</span>
                    </div>
                    <span className={styles.inputHint}>Leave 0 for no discount</span>
                  </div>

                  {/* Error banner */}
                  {invoice.error && (
                    <div className={styles.errorBanner}>
                      <FiAlertCircle size={15} />
                      <span>{invoice.error}</span>
                    </div>
                  )}

                  {/* Submitting progress */}
                  {invoice.submitting && (
                    <div className={styles.progressBanner}>
                      <div className={styles.modalSpinner} />
                      <span>Generating invoice, please wait...</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Modal Footer ── */}
            {!invoice.success && (
              <div className={styles.modalFooter}>
                <button
                  className={styles.btnNo}
                  onClick={closeInvoiceModal}
                  disabled={invoice.submitting}
                >
                  No, Cancel
                </button>
                <button
                  className={styles.btnYes}
                  onClick={handleGenerateInvoice}
                  disabled={invoice.submitting}
                >
                  {invoice.submitting ? (
                    <>
                      <div className={styles.btnSpinner} />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle size={15} />
                      Yes, Generate
                    </>
                  )}
                </button>
              </div>
            )}

            {invoice.success && (
              <div className={styles.modalFooter}>
                <button className={styles.btnYes} onClick={closeInvoiceModal}>
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ UPDATE QUANTITY MODAL ══ */}
      {updateQty.isOpen && updateQty.item && (
        <div
          className={styles.modalOverlay}
          onClick={!updateQty.submitting ? closeUpdateQtyModal : undefined}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

            {/* ── Header ── */}
            <div className={`${styles.modalHeader} ${styles.uqModalHeader}`}>
              <div className={styles.modalHeaderContent}>
                <div className={`${styles.modalHeaderIcon} ${styles.uqHeaderIcon}`}>
                  <FiEdit2 size={19} />
                </div>
                <div>
                  <h2 className={`${styles.modalTitle} ${styles.uqModalTitle}`}>
                    Update Quantity & Discount
                  </h2>
                  <p className={styles.modalSubtitle}>
                    {updateQty.item.medicineName}
                  </p>
                </div>
              </div>
              {!updateQty.submitting && !updateQty.success && (
                <button className={styles.modalClose} onClick={closeUpdateQtyModal}>
                  <FiX size={16} />
                </button>
              )}
            </div>

            {/* ── Body ── */}
            <div className={styles.modalBody}>

              {/* Success flash */}
              {updateQty.success && (
                <div className={styles.successState}>
                  <div className={styles.successIconWrap}>
                    <FiCheckCircle size={48} />
                  </div>
                  <h3>Updated Successfully!</h3>
                  <p className={styles.successMsg}>
                    <strong>{updateQty.item.medicineName}</strong> — qty set to{' '}
                    <strong>{updateQty.newQty}</strong>{' '}
                    {Number(updateQty.newDiscount) > 0 && (
                      <>with <strong>{Number(updateQty.newDiscount).toFixed(2)}%</strong> discount</>
                    )}.
                  </p>
                </div>
              )}

              {!updateQty.success && (
                <>
                  {/* Current info strip */}
                  <div className={styles.uqInfoStrip}>
                    <div className={styles.uqInfoBlock}>
                      <span className={styles.uqInfoLabel}>Medicine</span>
                      <span className={styles.uqInfoVal}>{updateQty.item.medicineName}</span>
                    </div>
                    {updateQty.item.batchNo && (
                      <div className={styles.uqInfoBlock}>
                        <span className={styles.uqInfoLabel}>Batch</span>
                        <span className={styles.uqInfoVal}>{updateQty.item.batchNo}</span>
                      </div>
                    )}
                    <div className={styles.uqInfoBlock}>
                      <span className={styles.uqInfoLabel}>Current Qty</span>
                      <span className={`${styles.uqInfoVal} ${styles.uqCurrQty}`}>
                        {updateQty.item.quantity}
                      </span>
                    </div>
                    <div className={styles.uqInfoBlock}>
                      <span className={styles.uqInfoLabel}>Current Disc.</span>
                      <span className={`${styles.uqInfoVal} ${styles.uqCurrDiscount}`}>
                        {Number(updateQty.item.discountPercentage) > 0
                          ? `${Number(updateQty.item.discountPercentage).toFixed(2)}%`
                          : '—'}
                      </span>
                    </div>
                  </div>

                  {/* ── Quantity input ── */}
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>
                      New Quantity
                    </label>
                    <div className={styles.inputWrapper}>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Enter new quantity"
                        value={updateQty.newQty}
                        onChange={(e) =>
                          setUpdateQty((prev) => ({
                            ...prev,
                            newQty: e.target.value,
                            error: null,
                          }))
                        }
                        className={`${styles.discountInput} ${styles.uqInput}`}
                        disabled={updateQty.submitting}
                        autoFocus
                      />
                    </div>
                    <span className={styles.inputHint}>
                      Enter whole numbers only (e.g. 5, 10, 25)
                    </span>
                  </div>

                  {/* ── Discount input ── */}
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>
                      <FiPercent size={13} />
                      Discount (%)
                    </label>
                    <div className={styles.inputWrapper}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="Enter discount % (0 – 100)"
                        value={updateQty.newDiscount}
                        onChange={(e) =>
                          setUpdateQty((prev) => ({
                            ...prev,
                            newDiscount: e.target.value,
                            error: null,
                          }))
                        }
                        className={`${styles.discountInput} ${styles.uqInput} ${styles.uqDiscountInput}`}
                        disabled={updateQty.submitting}
                      />
                      <span className={`${styles.inputSuffix} ${styles.uqInputSuffix}`}>%</span>
                    </div>
                    <span className={styles.inputHint}>
                      Leave 0 for no discount (0 – 100)
                    </span>
                  </div>

                  {/* Error banner */}
                  {updateQty.error && (
                    <div className={styles.errorBanner}>
                      <FiAlertCircle size={15} />
                      <span>{updateQty.error}</span>
                    </div>
                  )}

                  {/* Progress banner */}
                  {updateQty.submitting && (
                    <div className={`${styles.progressBanner} ${styles.uqProgressBanner}`}>
                      <div className={`${styles.modalSpinner} ${styles.uqSpinner}`} />
                      <span>Updating, please wait...</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Footer ── */}
            {!updateQty.success && (
              <div className={styles.modalFooter}>
                <button
                  className={styles.btnNo}
                  onClick={closeUpdateQtyModal}
                  disabled={updateQty.submitting}
                >
                  Cancel
                </button>
                <button
                  className={`${styles.btnYes} ${styles.uqBtnYes}`}
                  onClick={handleUpdateQty}
                  disabled={updateQty.submitting}
                >
                  {updateQty.submitting ? (
                    <>
                      <div className={styles.btnSpinner} />
                      Updating...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle size={15} />
                      Update
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesCartDetailList;