// src/components/SalesCartList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch,
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

const SalesCartList = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('prescriptions');
  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [salesCarts, setSalesCarts] = useState([]);
  const [filteredSalesCarts, setFilteredSalesCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartedPrescriptionIds, setCartedPrescriptionIds] = useState(new Set());

  const today = new Date().toISOString().split('T')[0];

  const [presFilterInputs, setPresFilterInputs] = useState({
    patientName: '',
    doctorName:  '',
    fromDate:    today,
    toDate:      today,
    status:      '',
  });

  const [cartFilterInputs, setCartFilterInputs] = useState({
    patientName: '',
    status:      '',
  });

  const [confirm, setConfirm] = useState({
    isOpen: false, prescription: null, details: [], medicineMap: {},
    loadingDetails: false, submitting: false, submitProgress: '',
    error: null, success: false, cartId: null,
  });

  const fetchPrescriptions = async (overrides = {}) => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const f = { ...presFilterInputs, ...overrides };
      const options = {
        Page: 1, PageSize: 100, BranchID: branchId,
        PatientName: f.patientName.trim(),
        DoctorName:  f.doctorName.trim(),
        FromDate:    f.fromDate || '',
        ToDate:      f.toDate   || '',
        IsRepeat:    -1,
        Status:      f.status !== '' ? Number(f.status) : -1,
      };
      const data = await getPrescriptionList(clinicId, options);
      const sorted = [...data].sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
      setPrescriptions(sorted);
      setFilteredPrescriptions(sorted);
    } catch (err) {
      console.error('fetchPrescriptions error:', err);
      setError(err?.status >= 400 || err?.code >= 400 ? err : { message: err.message || 'Failed to load prescriptions' });
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesCarts = async (overrides = {}) => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const f = { ...cartFilterInputs, ...overrides };
      const options = {
        Page: 1, PageSize: 100, BranchID: branchId,
        PatientName: f.patientName.trim(),
        Status: f.status !== '' ? Number(f.status) : -1,
      };
      const data = await getSalesCartList(clinicId, options);
      const sorted = [...data].sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
      setSalesCarts(sorted);
      setFilteredSalesCarts(sorted);
    } catch (err) {
      console.error('fetchSalesCarts error:', err);
      setError(err?.status >= 400 || err?.code >= 400 ? err : { message: err.message || 'Failed to load sales carts' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'prescriptions') fetchPrescriptions();
    else fetchSalesCarts();
  }, [activeTab]);

  const handlePresFilterChange  = (e) => { const { name, value } = e.target; setPresFilterInputs(prev => ({ ...prev, [name]: value })); };
  const handleCartFilterChange  = (e) => { const { name, value } = e.target; setCartFilterInputs(prev => ({ ...prev, [name]: value })); };
  const handlePresSearch        = () => fetchPrescriptions();
  const handleCartSearch        = () => fetchSalesCarts();

  const clearPresFilters = () => {
    const empty = { patientName: '', doctorName: '', fromDate: today, toDate: today, status: '' };
    setPresFilterInputs(empty);
    fetchPrescriptions(empty);
  };
  const clearCartFilters = () => {
    const empty = { patientName: '', status: '' };
    setCartFilterInputs(empty);
    fetchSalesCarts(empty);
  };

  const hasPresFilters = !!(presFilterInputs.patientName || presFilterInputs.doctorName || presFilterInputs.fromDate !== today || presFilterInputs.toDate !== today || presFilterInputs.status);
  const hasCartFilters = !!(cartFilterInputs.patientName || cartFilterInputs.status);

  const handleAddToCartClick = async (prescription) => {
    setConfirm({ isOpen: true, prescription, details: [], medicineMap: {}, loadingDetails: true, submitting: false, submitProgress: '', error: null, success: false, cartId: null });
    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const details = await getPrescriptionDetailList(clinicId, { BranchID: branchId, PrescriptionID: prescription.id, PageSize: 50 });
      if (!details.length) { setConfirm((prev) => ({ ...prev, loadingDetails: false, error: 'No medicine details found for this prescription.' })); return; }
      const uniqueMedicineIds = [...new Set(details.map((d) => d.medicineId))];
      const medicinePriceResults = await Promise.all(
        uniqueMedicineIds.map((medId) =>
          getMedicineMasterList(clinicId, { BranchID: branchId, MedicineID: medId, PageSize: 1 })
            .then((res) => { const med = res?.[0]; return { id: medId, sellPrice: med ? Number(med.sellPrice) || 0 : 0, name: med?.name || '' }; })
            .catch(() => ({ id: medId, sellPrice: 0, name: '' }))
        )
      );
      const medicineMap = {};
      medicinePriceResults.forEach((m) => { medicineMap[m.id] = { sellPrice: m.sellPrice, name: m.name }; });
      setConfirm((prev) => ({ ...prev, details, medicineMap, loadingDetails: false }));
    } catch (err) {
      console.error('Error loading prescription details:', err);
      setConfirm((prev) => ({ ...prev, loadingDetails: false, error: err.message || 'Failed to load prescription details.' }));
    }
  };

  const handleConfirmAddToCart = async () => {
    const { prescription, details, medicineMap } = confirm;
    if (!prescription || !details.length) return;
    setConfirm((prev) => ({ ...prev, submitting: true, submitProgress: 'Creating sales cart...', error: null }));
    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const cartResult = await addSalesCart({ clinicId, branchId, PatientID: prescription.patientId, Name: prescription.patientName || '' });
      const cartId = cartResult.cartId;
      setConfirm((prev) => ({ ...prev, cartId, submitProgress: `Cart created (ID: ${cartId}). Adding medicines...` }));
      const errors = [];
      for (let i = 0; i < details.length; i++) {
        const detail = details[i];
        const unitPrice = medicineMap[detail.medicineId]?.sellPrice ?? 0;
        setConfirm((prev) => ({ ...prev, submitProgress: `Adding medicine ${i + 1} of ${details.length}: ${detail.medicineName}...` }));
        try {
          await addSalesCartDetail({ clinicId, branchId, CartID: cartId, MedicineID: detail.medicineId, Quantity: Number(detail.quantity) || 1, UnitPrice: unitPrice, DiscountPercentage: 0, BatchSelection: 'FEFO' });
        } catch (detailErr) {
          console.error(`addSalesCartDetail failed for medicine ${detail.medicineId}:`, detailErr);
          errors.push(`${detail.medicineName}: ${detailErr.message}`);
        }
      }
      if (errors.length > 0) {
        setConfirm((prev) => ({ ...prev, submitting: false, submitProgress: '', error: `Cart created but some medicines failed:\n${errors.join('\n')}`, success: false, cartId }));
      } else {
        setCartedPrescriptionIds((prev) => new Set([...prev, prescription.id]));
        setConfirm((prev) => ({ ...prev, submitting: false, submitProgress: '', success: true, cartId }));
        setTimeout(() => { closeConfirm(); if (activeTab === 'prescriptions') fetchPrescriptions(); else fetchSalesCarts(); }, 2000);
      }
    } catch (err) {
      console.error('Add to cart failed:', err);
      setConfirm((prev) => ({ ...prev, submitting: false, submitProgress: '', error: err.message || 'Failed to add sales cart.' }));
    }
  };

  const closeConfirm = () => {
    if (confirm.submitting) return;
    setConfirm({ isOpen: false, prescription: null, details: [], medicineMap: {}, loadingDetails: false, submitting: false, submitProgress: '', error: null, success: false, cartId: null });
  };

  const formatDate = (dateStr) => { if (!dateStr) return '—'; return new Date(dateStr).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }); };
  const formatCurrency = (val) => val == null ? '—' : `₹${Number(val).toFixed(2)}`;
  const totalCartValue = useMemo(() => { const { details, medicineMap } = confirm; return details.reduce((sum, d) => { const price = medicineMap[d.medicineId]?.sellPrice ?? 0; return sum + price * (Number(d.quantity) || 1); }, 0); }, [confirm.details, confirm.medicineMap]);

  if (error && (error?.status >= 400 || error?.code >= 400)) return <ErrorHandler error={error} />;
  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error)   return <div className={styles.error}>Error: {error.message || error}</div>;

  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Sales Cart Management" />

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'prescriptions' ? styles.tabActive : ''}`} onClick={() => setActiveTab('prescriptions')}>
          <FiFileText size={18} /> Prescriptions
        </button>
        <button className={`${styles.tab} ${activeTab === 'salesCarts' ? styles.tabActive : ''}`} onClick={() => setActiveTab('salesCarts')}>
          <FiShoppingCart size={18} /> Sales Carts
        </button>
      </div>

      {/* ══ PRESCRIPTION INLINE FILTERS ══ */}
      {activeTab === 'prescriptions' && (
        <div className={styles.inlineFiltersContainer}>
          <div className={styles.presFiltersGrid}>
            <input type="text" name="patientName" placeholder=" Search by Patient Name" value={presFilterInputs.patientName} onChange={handlePresFilterChange} onKeyPress={(e) => { if (e.key === 'Enter') handlePresSearch(); }} className={styles.inlineFilterInput} />
            <input type="text" name="doctorName"  placeholder="Search by Doctor Name"  value={presFilterInputs.doctorName}  onChange={handlePresFilterChange} onKeyPress={(e) => { if (e.key === 'Enter') handlePresSearch(); }} className={styles.inlineFilterInput} />
            <div className={styles.dateWrapper}>
              <span className={styles.dateLabel}>From Date</span>
              <input type="date" name="fromDate" value={presFilterInputs.fromDate} onChange={handlePresFilterChange} className={`${styles.inlineFilterInput} ${styles.dateInput}`} />
            </div>
            <div className={styles.dateWrapper}>
              <span className={styles.dateLabel}>To Date</span>
              <input type="date" name="toDate" value={presFilterInputs.toDate} onChange={handlePresFilterChange} className={`${styles.inlineFilterInput} ${styles.dateInput}`} />
            </div>
            <select name="status" value={presFilterInputs.status} onChange={handlePresFilterChange} className={styles.inlineFilterSelect}>
              <option value="">All Status</option>
              <option value="1">Active</option>
              <option value="2">Cancelled</option>
            </select>
            <div className={styles.inlineFilterActions}>
              <button onClick={handlePresSearch} className={styles.searchButton}><FiSearch size={15} /> Search</button>
              {hasPresFilters && <button onClick={clearPresFilters} className={styles.clearButton}><FiX size={15} /> Clear</button>}
            </div>
          </div>
        </div>
      )}

      {/* ══ SALES CARTS INLINE FILTERS ══ */}
      {activeTab === 'salesCarts' && (
        <div className={styles.inlineFiltersContainer}>
          <div className={styles.cartFiltersGrid}>
            <input type="text" name="patientName" placeholder="Search by Patient Name" value={cartFilterInputs.patientName} onChange={handleCartFilterChange} onKeyPress={(e) => { if (e.key === 'Enter') handleCartSearch(); }} className={styles.inlineFilterInput} />
            <select name="status" value={cartFilterInputs.status} onChange={handleCartFilterChange} className={styles.inlineFilterSelect}>
              <option value="">All Status</option>
              <option value="1">Active</option>
              <option value="2">Cancelled</option>
              <option value="3">Completed</option>
            </select>
            <div className={styles.inlineFilterActions}>
              <button onClick={handleCartSearch} className={styles.searchButton}><FiSearch size={15} /> Search</button>
              {hasCartFilters && <button onClick={clearCartFilters} className={styles.clearButton}><FiX size={15} /> Clear</button>}
            </div>
          </div>
        </div>
      )}

      {/* ══ PRESCRIPTION TABLE ══ */}
      {activeTab === 'prescriptions' && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date Issued</th>
                <th>Valid Until</th>
                <th>Notes</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrescriptions.length === 0 ? (
                <tr><td colSpan={7} className={styles.noData}>No prescriptions found.</td></tr>
              ) : (
                filteredPrescriptions.map((pres) => {
                  const isCarted = cartedPrescriptionIds.has(pres.id);
                  return (
                    <tr key={pres.id}>
                      <td>
                        <div className={styles.nameCell}>
                          <div className={styles.avatar}>{pres.patientName?.charAt(0).toUpperCase() || 'P'}</div>
                          <div>
                            <div className={styles.name}>{pres.patientName}</div>
                            
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.name}>{pres.doctorFullName}</div>
                        <div className={styles.subText}>{pres.doctorCode || '—'}</div>
                      </td>
                      <td><div className={styles.name}>{formatDate(pres.dateIssued)}</div></td>
                      <td><div className={styles.name}>{formatDate(pres.validUntil)}</div></td>
                      <td>
                        <div className={styles.notesCell}>
                          {pres.notes && <div className={styles.subText}>{pres.notes}</div>}
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${pres.status === 1 ? styles.activeBadge : styles.inactiveBadge}`}>{pres.statusDesc}</span>
                      </td>
                      <td>
                        <div className={styles.actionsCell}>
                          <button onClick={() => handleAddToCartClick(pres)} className={`${styles.addCartBtn} ${isCarted ? styles.addCartBtnDone : ''}`} disabled={isCarted}>
                            {isCarted ? <><FiCheckCircle size={15} /> Cart Added</> : <><FiShoppingCart size={15} /> Add to Cart</>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ══ SALES CART TABLE ══ */}
      {activeTab === 'salesCarts' && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cart ID</th><th>Patient</th><th>Total Items</th><th>Total Amount</th><th>Status</th><th>Created Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSalesCarts.length === 0 ? (
                <tr><td colSpan={7} className={styles.noData}>No sales carts found.</td></tr>
              ) : (
                filteredSalesCarts.map((cart) => (
                  <tr key={cart.id}>
                    <td><span className={styles.cartIdBadge}>#{cart.id}</span></td>
                    <td><div className={styles.name}>{cart.customerName || '—'}</div></td>
                    <td><span className={styles.itemCountBadge}>{cart.totalItems ?? 0} items</span></td>
                    <td><span className={styles.amountBadge}>{formatCurrency(cart.totalAmount)}</span></td>
                    <td><span className={`${styles.badge} ${cart.status === 1 ? styles.activeBadge : styles.inactiveBadge}`}>{cart.statusDesc || 'Active'}</span></td>
                    <td><div className={styles.name}>{formatDate(cart.dateCreated)}</div></td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button onClick={() => navigate(`/salescartdetail-list/${cart.id}`)} className={styles.viewBtn}>View Cart</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ══ CONFIRM MODAL ══ */}
      {confirm.isOpen && (
        <div className={styles.modalOverlay} onClick={!confirm.submitting ? closeConfirm : undefined}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderContent}>
                <div className={styles.modalHeaderIcon}><FiShoppingCart size={20} /></div>
                <div>
                  <h2>Add to Sales Cart</h2>
                  <p className={styles.modalSubtitle}>{confirm.prescription?.patientName}</p>
                </div>
              </div>
              {!confirm.submitting && !confirm.success && <button onClick={closeConfirm} className={styles.modalClose}><FiX size={16} /></button>}
            </div>
            <div className={styles.modalBody}>
              {confirm.success && (
                <div className={styles.successState}>
                  <FiCheckCircle size={48} className={styles.successIcon} />
                  <h3>Cart Created Successfully!</h3>
                  <p>Cart ID: <strong>#{confirm.cartId}</strong></p>
                  <p className={styles.successSub}>All {confirm.details.length} medicine(s) have been added to the cart.</p>
                </div>
              )}
              {!confirm.success && confirm.error && (
                <div className={styles.errorBanner}><FiAlertCircle size={18} /><span style={{ whiteSpace: 'pre-line' }}>{confirm.error}</span></div>
              )}
              {!confirm.success && confirm.loadingDetails && (
                <div className={styles.loadingDetails}><div className={styles.spinner} /><span>Loading prescription medicines...</span></div>
              )}
              {confirm.submitting && (
                <div className={styles.progressBanner}><div className={styles.spinner} /><span>{confirm.submitProgress}</span></div>
              )}
              {!confirm.success && !confirm.loadingDetails && confirm.prescription && (
                <>
                  <div className={styles.presInfoGrid}>
                    <div className={styles.presInfoItem}>
                      <FiUser size={14} className={styles.presInfoIcon} />
                      <span className={styles.presInfoLabel}>Patient</span>
                      <span className={styles.presInfoValue}>{confirm.prescription.patientName}<span className={styles.presInfoSub}>{confirm.prescription.patientFileNo}</span></span>
                    </div>
                    <div className={styles.presInfoItem}>
                      <FiCalendar size={14} className={styles.presInfoIcon} />
                      <span className={styles.presInfoLabel}>Issued</span>
                      <span className={styles.presInfoValue}>{formatDate(confirm.prescription.dateIssued)}</span>
                    </div>
                    {confirm.prescription.diagnosis && (
                      <div className={`${styles.presInfoItem} ${styles.presInfoFullWidth}`}>
                        <FiFileText size={14} className={styles.presInfoIcon} />
                        <span className={styles.presInfoLabel}>Diagnosis</span>
                        <span className={styles.presInfoValue}>{confirm.prescription.diagnosis}</span>
                      </div>
                    )}
                  </div>
                  {confirm.details.length > 0 && (
                    <div className={styles.medicineSection}>
                      <h4 className={styles.medicineSectionTitle}><FiPackage size={15} />Medicines to be added ({confirm.details.length})</h4>
                      <div className={styles.medicineTableWrapper}>
                        <table className={styles.medicineTable}>
                          <thead><tr><th>#</th><th>Medicine</th><th>Form</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
                          <tbody>
                            {confirm.details.map((detail, idx) => {
                              const price = confirm.medicineMap[detail.medicineId]?.sellPrice ?? 0;
                              const qty = Number(detail.quantity) || 1;
                              return (
                                <tr key={detail.id}>
                                  <td className={styles.medIdx}>{idx + 1}</td>
                                  <td><div className={styles.medName}>{detail.medicineName}</div>{detail.genericName && <div className={styles.medGeneric}>{detail.genericName}</div>}</td>
                                  <td><span className={styles.formBadge}>{detail.formDesc}</span></td>
                                  <td><span className={styles.qtyBadge}>{qty}</span></td>
                                  <td className={styles.priceCell}>{formatCurrency(price)}</td>
                                  <td className={styles.totalCell}>{formatCurrency(price * qty)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot><tr><td colSpan={5} className={styles.grandTotalLabel}>Grand Total</td><td className={styles.grandTotalValue}>{formatCurrency(totalCartValue)}</td></tr></tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            {!confirm.success && (
              <div className={styles.modalFooter}>
                <button type="button" onClick={closeConfirm} disabled={confirm.submitting} className={styles.btnCancel}>No, Cancel</button>
                <button type="button" onClick={handleConfirmAddToCart} disabled={confirm.submitting || confirm.loadingDetails || !confirm.details.length} className={styles.btnConfirm}>
                  <FiShoppingCart size={16} />{confirm.submitting ? 'Processing...' : 'Yes, Add to Cart'}
                </button>
              </div>
            )}
            {confirm.success && (
              <div className={styles.modalFooter}><button onClick={closeConfirm} className={styles.btnConfirm}>Done</button></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesCartList;