// src/components/SalesCartList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiFilter,
  FiShoppingCart,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiCalendar,
  FiUser,
  FiPackage,
} from 'react-icons/fi';
import {
  getPrescriptionList,
  getPrescriptionDetailList,
  addSalesCart,
  addSalesCartDetail,
  getSalesCartList,
} from '../api/api-pharmacy.js';
import { getMedicineMasterList } from '../api/api-pharmacy.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './SalesCartList.module.css';

// ─────────────────────────────────────────────────────────
const SalesCartList = () => {
  const navigate = useNavigate();

  // ── Tab ──────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('prescriptions');

  // ── Prescription list state ───────────────────────────
  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);

  // ── Sales cart list state ─────────────────────────────
  const [salesCarts, setSalesCarts] = useState([]);
  const [filteredSalesCarts, setFilteredSalesCarts] = useState([]);

  // ── Shared UI state ───────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // ── Prescription filters ──────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const [presFromDate, setPresFromDate] = useState(today);
  const [presToDate, setPresTodDate] = useState(today);
  const [presPatientFilter, setPresPatientFilter] = useState('');
  const [presDoctorFilter, setPresDoctorFilter] = useState('');

  // ── Sales cart filters ────────────────────────────────
  const [cartFromDate, setCartFromDate] = useState(today);
  const [cartToDate, setCartToDate] = useState(today);
  const [cartPatientFilter, setCartPatientFilter] = useState('');

  // ── Confirm Modal state ───────────────────────────────
  const [confirm, setConfirm] = useState({
    isOpen: false,
    prescription: null,         // selected prescription object
    details: [],                // getPrescriptionDetailList results
    medicineMap: {},            // { medicineId: { sellPrice, name } }
    loadingDetails: false,
    submitting: false,
    submitProgress: '',         // e.g. "Adding cart... (2/5)"
    error: null,
    success: false,
    cartId: null,
  });

  // ─────────────────────────────────────────────────────
  // DATA FETCHING
  // ─────────────────────────────────────────────────────

  const fetchPrescriptions = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const options = {
        Page: 1,
        PageSize: 100,
        BranchID: branchId,
        FromDate: filters.from ?? presFromDate,
        ToDate: filters.to ?? presToDate,
        PatientName: (filters.patient ?? presPatientFilter).trim(),
        DoctorName: (filters.doctor ?? presDoctorFilter).trim(),
      };
      const data = await getPrescriptionList(clinicId, options);
      const sorted = [...data].sort(
        (a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)
      );
      setPrescriptions(sorted);
      setFilteredPrescriptions(sorted);
    } catch (err) {
      console.error('fetchPrescriptions error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load prescriptions' }
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesCarts = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const options = {
        Page: 1,
        PageSize: 100,
        BranchID: branchId,
        FromDate: filters.from ?? cartFromDate,
        ToDate: filters.to ?? cartToDate,
        PatientName: (filters.patient ?? cartPatientFilter).trim(),
      };
      const data = await getSalesCartList(clinicId, options);
      const sorted = [...data].sort(
        (a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)
      );
      setSalesCarts(sorted);
      setFilteredSalesCarts(sorted);
    } catch (err) {
      console.error('fetchSalesCarts error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load sales carts' }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchInput('');
    if (activeTab === 'prescriptions') {
      fetchPrescriptions();
    } else {
      fetchSalesCarts();
    }
  }, [activeTab]);

  // ─────────────────────────────────────────────────────
  // SEARCH FILTER
  // ─────────────────────────────────────────────────────

  const handleSearch = () => {
    const term = searchInput.trim().toLowerCase();
    if (activeTab === 'prescriptions') {
      if (!term) { setFilteredPrescriptions(prescriptions); return; }
      setFilteredPrescriptions(prescriptions.filter(
        (p) =>
          p.patientName?.toLowerCase().includes(term) ||
          p.doctorFullName?.toLowerCase().includes(term) ||
          p.patientFileNo?.toLowerCase().includes(term) ||
          p.patientMobile?.toLowerCase().includes(term) ||
          p.diagnosis?.toLowerCase().includes(term) ||
          p.notes?.toLowerCase().includes(term)
      ));
    } else {
      if (!term) { setFilteredSalesCarts(salesCarts); return; }
      setFilteredSalesCarts(salesCarts.filter(
        (c) =>
          c.patientName?.toLowerCase().includes(term) ||
          c.patientFileNo?.toLowerCase().includes(term) ||
          c.patientMobile?.toLowerCase().includes(term)
      ));
    }
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSearch(); };

  const clearFilters = () => {
    setSearchInput('');
    if (activeTab === 'prescriptions') {
      setPresFromDate(today);
      setPresTodDate(today);
      setPresPatientFilter('');
      setPresDoctorFilter('');
      fetchPrescriptions({ from: today, to: today, patient: '', doctor: '' });
    } else {
      setCartFromDate(today);
      setCartToDate(today);
      setCartPatientFilter('');
      fetchSalesCarts({ from: today, to: today, patient: '' });
    }
  };

  // ─────────────────────────────────────────────────────
  // ADD TO CART FLOW
  // ─────────────────────────────────────────────────────

  /**
   * Step 1 — Open confirmation modal and load prescription details + prices.
   */
  const handleAddToCartClick = async (prescription) => {
    setConfirm({
      isOpen: true,
      prescription,
      details: [],
      medicineMap: {},
      loadingDetails: true,
      submitting: false,
      submitProgress: '',
      error: null,
      success: false,
      cartId: null,
    });

    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      // Fetch prescription details (medicines) for this prescription
      const details = await getPrescriptionDetailList(clinicId, {
        BranchID: branchId,
        PrescriptionID: prescription.id,
        PageSize: 50,
      });

      if (!details.length) {
        setConfirm((prev) => ({
          ...prev,
          loadingDetails: false,
          error: 'No medicine details found for this prescription.',
        }));
        return;
      }

      // Fetch UnitPrice (sellPrice) for each unique medicine in parallel
      const uniqueMedicineIds = [...new Set(details.map((d) => d.medicineId))];

      const medicinePriceResults = await Promise.all(
        uniqueMedicineIds.map((medId) =>
          getMedicineMasterList(clinicId, {
            BranchID: branchId,
            MedicineID: medId,
            PageSize: 1,
          }).then((res) => {
            const med = res?.[0];
            return {
              id: medId,
              sellPrice: med ? Number(med.sellPrice) || 0 : 0,
              name: med?.name || '',
            };
          }).catch(() => ({ id: medId, sellPrice: 0, name: '' }))
        )
      );

      const medicineMap = {};
      medicinePriceResults.forEach((m) => {
        medicineMap[m.id] = { sellPrice: m.sellPrice, name: m.name };
      });

      setConfirm((prev) => ({
        ...prev,
        details,
        medicineMap,
        loadingDetails: false,
      }));
    } catch (err) {
      console.error('Error loading prescription details:', err);
      setConfirm((prev) => ({
        ...prev,
        loadingDetails: false,
        error: err.message || 'Failed to load prescription details.',
      }));
    }
  };

  /**
   * Step 2 — Execute addSalesCart then loop addSalesCartDetail.
   */
  const handleConfirmAddToCart = async () => {
    const { prescription, details, medicineMap } = confirm;
    if (!prescription || !details.length) return;

    setConfirm((prev) => ({
      ...prev,
      submitting: true,
      submitProgress: 'Creating sales cart...',
      error: null,
    }));

    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      // ── 1. addSalesCart ──────────────────────────────
      const cartResult = await addSalesCart({
        clinicId,
        branchId,
        PatientID: prescription.patientId,
        Name: prescription.patientName || '',
      });

      const cartId = cartResult.cartId;

      setConfirm((prev) => ({
        ...prev,
        cartId,
        submitProgress: `Cart created (ID: ${cartId}). Adding medicines...`,
      }));

      // ── 2. addSalesCartDetail for each medicine ──────
      const errors = [];
      for (let i = 0; i < details.length; i++) {
        const detail = details[i];
        const unitPrice = medicineMap[detail.medicineId]?.sellPrice ?? 0;

        setConfirm((prev) => ({
          ...prev,
          submitProgress: `Adding medicine ${i + 1} of ${details.length}: ${detail.medicineName}...`,
        }));

        try {
          await addSalesCartDetail({
            clinicId,
            branchId,
            CartID: cartId,
            MedicineID: detail.medicineId,
            Quantity: Number(detail.quantity) || 1,
            UnitPrice: unitPrice,
            DiscountPercentage: 0,
            BatchSelection: 'FEFO',
          });
        } catch (detailErr) {
          console.error(`addSalesCartDetail failed for medicine ${detail.medicineId}:`, detailErr);
          errors.push(`${detail.medicineName}: ${detailErr.message}`);
        }
      }

      if (errors.length > 0) {
        setConfirm((prev) => ({
          ...prev,
          submitting: false,
          submitProgress: '',
          error: `Cart created but some medicines failed:\n${errors.join('\n')}`,
          success: false,
          cartId,
        }));
      } else {
        setConfirm((prev) => ({
          ...prev,
          submitting: false,
          submitProgress: '',
          success: true,
          cartId,
        }));
        // Auto-refresh sales carts tab data after success
        setTimeout(() => {
          closeConfirm();
          if (activeTab === 'prescriptions') {
            fetchPrescriptions();
          } else {
            fetchSalesCarts();
          }
        }, 2000);
      }
    } catch (err) {
      console.error('Add to cart failed:', err);
      setConfirm((prev) => ({
        ...prev,
        submitting: false,
        submitProgress: '',
        error: err.message || 'Failed to add sales cart.',
      }));
    }
  };

  const closeConfirm = () => {
    if (confirm.submitting) return; // block close while submitting
    setConfirm({
      isOpen: false,
      prescription: null,
      details: [],
      medicineMap: {},
      loadingDetails: false,
      submitting: false,
      submitProgress: '',
      error: null,
      success: false,
      cartId: null,
    });
  };

  // ─────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const formatCurrency = (val) =>
    val == null ? '—' : `₹${Number(val).toFixed(2)}`;

  const totalCartValue = useMemo(() => {
    const { details, medicineMap } = confirm;
    return details.reduce((sum, d) => {
      const price = medicineMap[d.medicineId]?.sellPrice ?? 0;
      const qty = Number(d.quantity) || 1;
      return sum + price * qty;
    }, 0);
  }, [confirm.details, confirm.medicineMap]);

  // ─────────────────────────────────────────────────────
  // EARLY RETURNS
  // ─────────────────────────────────────────────────────

  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.loading}>Loading...</div>;

  if (error) return <div className={styles.error}>Error: {error.message || error}</div>;

  // ─────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Sales Cart Management" />

      {/* ── Tab Navigation ── */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'prescriptions' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('prescriptions')}
        >
          <FiFileText size={18} />
          Prescriptions
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'salesCarts' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('salesCarts')}
        >
          <FiShoppingCart size={18} />
          Sales Carts
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`${styles.filterToggleBtn} ${showAdvancedFilters ? styles.filterToggleBtnActive : ''}`}
          >
            <FiFilter size={18} />
            {showAdvancedFilters ? 'Hide' : 'Show'} Filters
          </button>
          {(searchInput || presFromDate !== today || presToDate !== today ||
            presPatientFilter || presDoctorFilter ||
            cartFromDate !== today || cartToDate !== today || cartPatientFilter) && (
            <button onClick={clearFilters} className={styles.clearBtn}>
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* ── Advanced Filters — Prescriptions ── */}
      {activeTab === 'prescriptions' && showAdvancedFilters && (
        <div className={styles.advancedFilters}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>From Date</label>
              <input
                type="date"
                value={presFromDate}
                onChange={(e) => setPresFromDate(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>To Date</label>
              <input
                type="date"
                value={presToDate}
                onChange={(e) => setPresTodDate(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Patient Name</label>
              <input
                type="text"
                placeholder="Filter by patient..."
                value={presPatientFilter}
                onChange={(e) => setPresPatientFilter(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Doctor Name</label>
              <input
                type="text"
                placeholder="Filter by doctor..."
                value={presDoctorFilter}
                onChange={(e) => setPresDoctorFilter(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.applyFilterBtnGroup}>
              <button onClick={() => fetchPrescriptions()} className={styles.applyBtn}>
                <FiSearch size={18} /> Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Advanced Filters — Sales Carts ── */}
      {activeTab === 'salesCarts' && showAdvancedFilters && (
        <div className={styles.advancedFilters}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>From Date</label>
              <input
                type="date"
                value={cartFromDate}
                onChange={(e) => setCartFromDate(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>To Date</label>
              <input
                type="date"
                value={cartToDate}
                onChange={(e) => setCartToDate(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Patient Name</label>
              <input
                type="text"
                placeholder="Filter by patient..."
                value={cartPatientFilter}
                onChange={(e) => setCartPatientFilter(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.applyFilterBtnGroup}>
              <button onClick={() => fetchSalesCarts()} className={styles.applyBtn}>
                <FiSearch size={18} /> Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Search ── */}
      <div className={styles.searchWrapper}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder={
              activeTab === 'prescriptions'
                ? 'Search by patient, doctor, diagnosis...'
                : 'Search by patient name, file no...'
            }
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

      {/* ══════════════ PRESCRIPTION TABLE ══════════════ */}
      {activeTab === 'prescriptions' && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date Issued</th>
                <th>Valid Until</th>
                <th>Diagnosis</th>
                <th>Repeat</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.noData}>
                    No prescriptions found.
                  </td>
                </tr>
              ) : (
                filteredPrescriptions.map((pres) => (
                  <tr key={pres.id}>
                    <td>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar}>
                          {pres.patientName?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        <div>
                          <div className={styles.name}>{pres.patientName}</div>
                          <div className={styles.subText}>
                            {pres.patientFileNo} • {pres.patientMobile || '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.name}>{pres.doctorFullName}</div>
                      <div className={styles.subText}>{pres.doctorCode || '—'}</div>
                    </td>
                    <td>
                      <div className={styles.name}>{formatDate(pres.dateIssued)}</div>
                    </td>
                    <td>
                      <div className={styles.name}>{formatDate(pres.validUntil)}</div>
                    </td>
                    <td>
                      <div className={styles.diagnosisCell}>
                        {pres.diagnosis ? (
                          <span className={styles.diagnosisBadge}>{pres.diagnosis}</span>
                        ) : '—'}
                        {pres.notes && (
                          <div className={styles.subText}>{pres.notes}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      {pres.isRepeat ? (
                        <span className={`${styles.badge} ${styles.repeatBadge}`}>
                          Repeat ({pres.repeatCount})
                        </span>
                      ) : (
                        <span className={`${styles.badge} ${styles.newBadge}`}>New</span>
                      )}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${pres.status === 1 ? styles.activeBadge : styles.inactiveBadge}`}>
                        {pres.statusDesc}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          onClick={() => handleAddToCartClick(pres)}
                          className={styles.addCartBtn}
                        >
                          <FiShoppingCart size={15} />
                          Add to Cart
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

      {/* ══════════════ SALES CART TABLE ══════════════ */}
      {activeTab === 'salesCarts' && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cart ID</th>
                <th>Patient</th>
                <th>Total Items</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSalesCarts.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.noData}>
                    No sales carts found.
                  </td>
                </tr>
              ) : (
                filteredSalesCarts.map((cart) => (
                  <tr key={cart.id}>
                    <td>
                      <span className={styles.cartIdBadge}>#{cart.id}</span>
                    </td>
                    <td>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar}>
                          {cart.patientName?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        <div>
                          <div className={styles.name}>{cart.patientName}</div>
                          <div className={styles.subText}>
                            {cart.patientFileNo} • {cart.patientMobile || '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.itemCountBadge}>
                        {cart.totalItems ?? 0} items
                      </span>
                    </td>
                    <td>
                      <span className={styles.amountBadge}>
                        {formatCurrency(cart.totalAmount)}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${cart.status === 1 ? styles.activeBadge : styles.inactiveBadge}`}>
                        {cart.statusDesc || 'Active'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.name}>{formatDate(cart.dateCreated)}</div>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          onClick={() => navigate(`/salescartdetail-list/${cart.id}`)}
                          className={styles.viewBtn}
                        >
                          View Cart
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

      {/* ══════════════ CONFIRM MODAL ══════════════ */}
      {confirm.isOpen && (
        <div className={styles.modalOverlay} onClick={!confirm.submitting ? closeConfirm : undefined}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderContent}>
                <div className={styles.modalHeaderIcon}>
                  <FiShoppingCart size={20} />
                </div>
                <div>
                  <h2>Add to Sales Cart</h2>
                  <p className={styles.modalSubtitle}>
                    {confirm.prescription?.patientName}
                  </p>
                </div>
              </div>
              {!confirm.submitting && !confirm.success && (
                <button onClick={closeConfirm} className={styles.modalClose}>
                  <FiX size={16} />
                </button>
              )}
            </div>

            {/* Body */}
            <div className={styles.modalBody}>

              {/* ── Success state ── */}
              {confirm.success && (
                <div className={styles.successState}>
                  <FiCheckCircle size={48} className={styles.successIcon} />
                  <h3>Cart Created Successfully!</h3>
                  <p>Cart ID: <strong>#{confirm.cartId}</strong></p>
                  <p className={styles.successSub}>
                    All {confirm.details.length} medicine(s) have been added to the cart.
                  </p>
                </div>
              )}

              {/* ── Error state ── */}
              {!confirm.success && confirm.error && (
                <div className={styles.errorBanner}>
                  <FiAlertCircle size={18} />
                  <span style={{ whiteSpace: 'pre-line' }}>{confirm.error}</span>
                </div>
              )}

              {/* ── Loading details state ── */}
              {!confirm.success && confirm.loadingDetails && (
                <div className={styles.loadingDetails}>
                  <div className={styles.spinner} />
                  <span>Loading prescription medicines...</span>
                </div>
              )}

              {/* ── Submitting progress ── */}
              {confirm.submitting && (
                <div className={styles.progressBanner}>
                  <div className={styles.spinner} />
                  <span>{confirm.submitProgress}</span>
                </div>
              )}

              {/* ── Prescription Summary ── */}
              {!confirm.success && !confirm.loadingDetails && confirm.prescription && (
                <>
                  <div className={styles.presInfoGrid}>
                    <div className={styles.presInfoItem}>
                      <FiUser size={14} className={styles.presInfoIcon} />
                      <span className={styles.presInfoLabel}>Patient</span>
                      <span className={styles.presInfoValue}>
                        {confirm.prescription.patientName}
                        <span className={styles.presInfoSub}>
                          {confirm.prescription.patientFileNo}
                        </span>
                      </span>
                    </div>
                    <div className={styles.presInfoItem}>
                      <FiCalendar size={14} className={styles.presInfoIcon} />
                      <span className={styles.presInfoLabel}>Issued</span>
                      <span className={styles.presInfoValue}>
                        {formatDate(confirm.prescription.dateIssued)}
                      </span>
                    </div>
                    {confirm.prescription.diagnosis && (
                      <div className={`${styles.presInfoItem} ${styles.presInfoFullWidth}`}>
                        <FiFileText size={14} className={styles.presInfoIcon} />
                        <span className={styles.presInfoLabel}>Diagnosis</span>
                        <span className={styles.presInfoValue}>
                          {confirm.prescription.diagnosis}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Medicine Table */}
                  {confirm.details.length > 0 && (
                    <div className={styles.medicineSection}>
                      <h4 className={styles.medicineSectionTitle}>
                        <FiPackage size={15} />
                        Medicines to be added ({confirm.details.length})
                      </h4>
                      <div className={styles.medicineTableWrapper}>
                        <table className={styles.medicineTable}>
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Medicine</th>
                              <th>Form</th>
                              <th>Qty</th>
                              <th>Unit Price</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {confirm.details.map((detail, idx) => {
                              const price = confirm.medicineMap[detail.medicineId]?.sellPrice ?? 0;
                              const qty = Number(detail.quantity) || 1;
                              return (
                                <tr key={detail.id}>
                                  <td className={styles.medIdx}>{idx + 1}</td>
                                  <td>
                                    <div className={styles.medName}>{detail.medicineName}</div>
                                    {detail.genericName && (
                                      <div className={styles.medGeneric}>{detail.genericName}</div>
                                    )}
                                  </td>
                                  <td>
                                    <span className={styles.formBadge}>{detail.formDesc}</span>
                                  </td>
                                  <td>
                                    <span className={styles.qtyBadge}>{qty}</span>
                                  </td>
                                  <td className={styles.priceCell}>
                                    {formatCurrency(price)}
                                  </td>
                                  <td className={styles.totalCell}>
                                    {formatCurrency(price * qty)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan={5} className={styles.grandTotalLabel}>
                                Grand Total
                              </td>
                              <td className={styles.grandTotalValue}>
                                {formatCurrency(totalCartValue)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!confirm.success && (
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={closeConfirm}
                  disabled={confirm.submitting}
                  className={styles.btnCancel}
                >
                  No, Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddToCart}
                  disabled={
                    confirm.submitting ||
                    confirm.loadingDetails ||
                    !confirm.details.length
                  }
                  className={styles.btnConfirm}
                >
                  <FiShoppingCart size={16} />
                  {confirm.submitting ? 'Processing...' : 'Yes, Add to Cart'}
                </button>
              </div>
            )}

            {confirm.success && (
              <div className={styles.modalFooter}>
                <button onClick={closeConfirm} className={styles.btnConfirm}>
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesCartList;