// src/components/AddConsultation.jsx
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  FiX, FiCalendar, FiCheck, FiSearch, FiChevronDown,
  FiUser, FiArrowLeft, FiPlus, FiFileText, FiPackage, FiMenu,
  FiActivity, FiEye, FiEdit3, FiAlertCircle,
  FiZap, FiClock, FiRefreshCw, FiChevronUp, FiHeart,
  FiThermometer, FiTrendingUp, FiSend, FiTrash2,
  FiClipboard, FiDroplet, FiCheckCircle, FiSave, FiUsers,
} from 'react-icons/fi';
import { getPatientVisitList, getPatientsList } from '../api/api.js';
import { addConsultation, updateConsultation, getConsultationList } from '../api/api-consultation.js';
import {
  addPrescription, addPrescriptionDetail, getMedicineMasterList,
  getPrescriptionList, getPrescriptionDetailList,
  updatePrescriptionDetail, deletePrescriptionDetail
} from '../api/api-pharmacy.js';
import {
  addLabTestOrder, addLabTestOrderItem, getLabTestMasterList,
  getLabTestPackageList, getLabTestOrderList, getLabTestOrderItemList,
  updateLabTestOrderItem, deleteLabTestOrder
} from '../api/api-labtest.js';
import './AddConsultation.css';

/* ─── Constants ─────────────────────────────────── */
const TIMING_OPTIONS = [
  { code: 'M', full: 'Morning' },
  { code: 'A', full: 'Afternoon' },
  { code: 'E', full: 'Evening' },
  { code: 'N', full: 'Night' },
];
const FOOD_OPTIONS = [
  { id: 1, label: 'Before' },
  { id: 2, label: 'After' },
  { id: 3, label: 'With' },
  { id: 4, label: 'Empty' },
];
const PRIORITY_OPTIONS = [
  { id: 1, label: 'Routine', icon: FiClock,       color: 'routine' },
  { id: 2, label: 'Urgent',  icon: FiAlertCircle, color: 'urgent'  },
  { id: 3, label: 'Stat',    icon: FiZap,         color: 'stat'    },
];
const TYPE_NAMES = {
  1: 'Tablet', 2: 'Capsule', 3: 'Syrup',   4: 'Injection',
  5: 'Ointment', 6: 'Drops', 7: 'Powder',  8: 'Gel',
  9: 'Cream', 10: 'Inhaler',
};

/* ─── Helpers ────────────────────────────────────── */
const generateTempId  = () => Date.now() + Math.random();
const parseTimings    = (s) => s ? s.split('|').map(t => t.trim()).filter(t => ['M','A','E','N'].includes(t)) : [];
const getDoseDefault  = (m) => { if (!m) return ''; const c = m.doseCount; if (!c || c <= 0) return ''; return `${c}${(TYPE_NAMES[m.type] || m.typeDesc) ? ' ' + (TYPE_NAMES[m.type] || m.typeDesc) : ''}`.trim(); };
const calcQuantity    = (days, timings) => { const d = parseInt(days) || 0; return d > 0 && timings.length > 0 ? d * timings.length : 0; };
const buildFrequency  = (timings) => timings.length ? timings.join('|') : '';
const formatDate      = (ds) => { if (!ds) return '—'; return new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
const formatTime      = (ts) => { if (!ts) return '—'; const [h, m] = ts.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };
const today           = () => new Date().toISOString().split('T')[0];
const thirtyDaysLater = () => new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

const createContainer = (medicine = null) => {
  const timings       = parseTimings(medicine?.timing);
  const dosePerIntake = getDoseDefault(medicine);
  return {
    tempId: generateTempId(),
    medicineId: medicine?.id || 0,
    medicineName: medicine?.name || '',
    form: medicine?.type || 0,
    strength: medicine?.dosageForm || '',
    defaultRoute: medicine?.defaultRoute || 1,
    timings,
    foodTiming: 2,
    days: '7',
    dosePerIntake,
    quantity: calcQuantity('7', timings),
    notes: '',
    refillAllowed: 0,
    refillCount: 0,
    expanded: true,
    startDate: today(),
    endDate: thirtyDaysLater(),
    prescriptionDetailId: null,
  };
};

/* ─── MedicineContainer ─────────────────────────── */
const MedicineContainer = ({ container, onUpdate, onRemove, readOnly = false }) => {
  const toggleTiming = (code) => {
    const timings = container.timings.includes(code)
      ? container.timings.filter(c => c !== code)
      : [...container.timings, code];
    onUpdate(container.tempId, { timings, quantity: calcQuantity(container.days, timings) });
  };
  const handleDays = (val) => onUpdate(container.tempId, { days: val, quantity: calcQuantity(val, container.timings) });
  const foodLabel  = FOOD_OPTIONS.find(f => f.id === container.foodTiming)?.label || '—';

  return (
    <div className={`med-card ${container.expanded ? 'med-card--open' : ''} ${readOnly ? 'med-card--readonly' : ''}`}>
      <div className="med-card__head">
        <button type="button" className="med-card__toggle"
          onClick={() => onUpdate(container.tempId, { expanded: !container.expanded })}>
          {container.expanded ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
        </button>
        <div className="med-card__head-info">
          <span className="med-card__name">{container.medicineName || <em className="med-card__unnamed">Unnamed Medicine</em>}</span>
          {!container.expanded && (
            <span className="med-card__summary">
              {container.dosePerIntake && <>{container.dosePerIntake}</>}
              {container.timings.length > 0 && <> · {container.timings.join('-')}</>}
              {container.quantity > 0 && <> · Qty {container.quantity}</>}
              <> · {foodLabel} food</>
            </span>
          )}
        </div>
        {container.quantity > 0 && container.expanded && (
          <span className="med-card__qty">Qty {container.quantity}</span>
        )}
        {!readOnly && (
          <button type="button" className="med-card__remove" onClick={() => onRemove(container.tempId)}>
            <FiTrash2 size={12} />
          </button>
        )}
      </div>

      {container.expanded && (
        <div className="med-card__body">
          {!container.medicineId && (
            <div className="mf">
              <label className="mf__label">Medicine Name <span className="req">*</span></label>
              <input type="text" className="mf__input" value={container.medicineName}
                onChange={e => onUpdate(container.tempId, { medicineName: e.target.value })}
                placeholder="Enter medicine name…" readOnly={readOnly} />
            </div>
          )}

          <div className="med-timing-row">
            <div className="med-timing-group">
              <label className="mf__label">Timing</label>
              <div className="timing-pills">
                {TIMING_OPTIONS.map(t => (
                  <button key={t.code} type="button" title={t.full}
                    className={`timing-pill ${container.timings.includes(t.code) ? 'timing-pill--on' : ''}`}
                    onClick={() => !readOnly && toggleTiming(t.code)}
                    disabled={readOnly}>{t.code}</button>
                ))}
              </div>
            </div>
            <div className="med-timing-sep" />
            <div className="med-timing-group">
              <label className="mf__label">Food</label>
              <div className="food-pills">
                {FOOD_OPTIONS.map(f => (
                  <button key={f.id} type="button"
                    className={`food-pill ${container.foodTiming === f.id ? 'food-pill--on' : ''}`}
                    onClick={() => !readOnly && onUpdate(container.tempId, { foodTiming: f.id })}
                    disabled={readOnly}>{f.label}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="med-inline-row">
            <div className="mf mf--inline">
              <label className="mf__label">Dose <span className="req">*</span></label>
              <input type="text" className="mf__input" value={container.dosePerIntake}
                onChange={e => onUpdate(container.tempId, { dosePerIntake: e.target.value })}
                placeholder="1 Tablet" readOnly={readOnly} />
            </div>
            <div className="mf mf--inline mf--sm">
              <label className="mf__label">Days</label>
              <input type="number" className="mf__input" value={container.days}
                onChange={e => !readOnly && handleDays(e.target.value)} placeholder="7" min="1" readOnly={readOnly} />
            </div>
            <div className="mf mf--inline mf--sm">
              <label className="mf__label">Qty</label>
              <input type="number" className="mf__input mf__input--qty" value={container.quantity}
                onChange={e => !readOnly && onUpdate(container.tempId, { quantity: Number(e.target.value) })} min="0" step="0.5" readOnly={readOnly} />
            </div>
            {!readOnly && (
              <div className="mf mf--inline mf--refill-inline">
                <label className="mf__label">Refill</label>
                <div className="refill-inline-row">
                  <label className="med-check-label">
                    <input type="checkbox" checked={container.refillAllowed === 1}
                      onChange={e => onUpdate(container.tempId, { refillAllowed: e.target.checked ? 1 : 0, refillCount: e.target.checked ? container.refillCount : 0 })} />
                  </label>
                  {container.refillAllowed === 1 && (
                    <input type="number" className="mf__input" style={{ width: 48 }} value={container.refillCount}
                      onChange={e => onUpdate(container.tempId, { refillCount: Number(e.target.value) })} min="1" max="12" placeholder="1" />
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mf">
            <label className="mf__label">Instructions</label>
            <textarea className="mf__input mf__textarea" value={container.notes} rows={2}
              onChange={e => !readOnly && onUpdate(container.tempId, { notes: e.target.value })}
              placeholder="e.g. Take with warm water…" readOnly={readOnly} />
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── SavedMedicineCard ─────────────────────────── */
const SavedMedicineCard = ({ item, clinicId, branchId, onUpdated, onDeleted, onError }) => {
  const [expanded, setExpanded]       = useState(true);
  const [editing, setEditing]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [confirmDel, setConfirmDel]   = useState(false);
  const [local, setLocal]             = useState(null);

  const foodLabel = FOOD_OPTIONS.find(f => f.id === (item.foodTiming || 2))?.label || '—';
  const timings   = parseTimings(item.frequency);

  const startEdit = () => {
    setLocal({
      tempId: item.id,
      medicineId: item.medicineId || 0,
      medicineName: item.medicineName || '',
      form: item.form || 0,
      strength: item.strength || '',
      defaultRoute: item.route || 1,
      timings: parseTimings(item.frequency),
      foodTiming: item.foodTiming || 2,
      days: item.duration ? item.duration.replace(/\D/g, '') : '7',
      dosePerIntake: item.dosage || '',
      quantity: item.quantity || 0,
      notes: item.instructions || '',
      refillAllowed: item.refillAllowed || 0,
      refillCount: item.refillCount || 0,
      expanded: true,
      startDate: item.startDate || today(),
      endDate: item.endDate || thirtyDaysLater(),
      prescriptionDetailId: item.id,
    });
    setEditing(true);
    setExpanded(true);
  };

  const cancelEdit = () => { setEditing(false); setLocal(null); };
  const handleUpdate = (tid, ch) => setLocal(prev => ({ ...prev, ...ch }));

  const handleSave = async () => {
    if (!local) return;
    try {
      setSaving(true);
      await updatePrescriptionDetail({
        PrescriptionDetailID: item.id,
        ClinicID: clinicId,
        BranchID: branchId,
        Form: local.form,
        Strength: local.strength,
        Dosage: local.dosePerIntake,
        Frequency: buildFrequency(local.timings),
        Duration: local.days ? `${local.days} Days` : '',
        Route: local.defaultRoute,
        FoodTiming: local.foodTiming,
        Instructions: local.notes,
        Quantity: local.quantity,
        RefillAllowed: local.refillAllowed,
        RefillCount: local.refillCount,
        StartDate: today(),
        EndDate: thirtyDaysLater(),
        Status: 1,
      });
      onUpdated(item.id, local);
      setEditing(false);
      setLocal(null);
    } catch (err) {
      onError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deletePrescriptionDetail(item.id);
      onDeleted(item.id);
    } catch (err) {
      onError(err);
    } finally {
      setDeleting(false);
      setConfirmDel(false);
    }
  };

  if (!editing) {
    return (
      <div className="saved-item-card">
        <div className="saved-item-card__head">
          <button
            type="button"
            className="saved-item-card__toggle"
            onClick={() => setExpanded(p => !p)}
          >
            {expanded ? <FiChevronUp size={11} /> : <FiChevronDown size={11} />}
          </button>

          <div className="saved-item-card__head-info">
            <span className="saved-item-card__name">{item.medicineName}</span>
            {!expanded && (
              <span className="saved-item-card__collapsed-summary">
                {item.dosage && <>{item.dosage}</>}
                {timings.length > 0 && <> · {timings.join('-')}</>}
                {item.quantity > 0 && <> · Qty {item.quantity}</>}
                <> · {foodLabel} food</>
              </span>
            )}
          </div>

          {item.quantity > 0 && expanded && (
            <span className="saved-item-card__qty-badge">Qty {item.quantity}</span>
          )}

          <div className="saved-item-card__actions">
            <button className="btn-item-edit" onClick={startEdit} title="Edit this medicine">
              <FiEdit3 size={12} /> Edit
            </button>
            {!confirmDel ? (
              <button className="btn-item-delete" onClick={() => setConfirmDel(true)} title="Delete this medicine">
                <FiTrash2 size={12} /> Delete
              </button>
            ) : (
              <div className="confirm-del-popup">
                <div className="confirm-del-popup__inner">
                  <p className="confirm-del-popup__msg"><FiAlertCircle size={14} /> Delete this medicine?</p>
                  <div className="confirm-del-popup__btns">
                    <button className="btn-confirm-yes" onClick={handleDelete} disabled={deleting}>
                      {deleting ? <span className="spin-sm" /> : <FiCheck size={11} />} Yes, Delete
                    </button>
                    <button className="btn-confirm-no" onClick={() => setConfirmDel(false)}>
                      <FiX size={11} /> Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {expanded && (
          <div className="saved-item-card__body">
            <div className="saved-item-card__strip">
              <FiCheckCircle size={11} /> Saved to prescription
            </div>
            <div className="saved-item-card__meta-row">
              {item.dosage    && <span className="tag">{item.dosage}</span>}
              {item.frequency && <span className="tag">{item.frequency}</span>}
              {item.duration  && <span className="tag">{item.duration}</span>}
              {item.quantity > 0 && <span className="tag tag--qty">Qty {item.quantity}</span>}
              {item.instructions && <span className="tag tag--note">{item.instructions}</span>}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="saved-item-card saved-item-card--editing">
      <div className="saved-item-card__edit-head">
        <FiEdit3 size={12} /> Editing: <strong>{item.medicineName}</strong>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className="btn-item-save" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="spin-sm" /> Saving…</> : <><FiSave size={12} /> Save</>}
          </button>
          <button className="btn-item-cancel" onClick={cancelEdit} disabled={saving}>
            <FiX size={12} /> Cancel
          </button>
        </div>
      </div>
      <MedicineContainer
        container={local}
        onUpdate={handleUpdate}
        onRemove={() => {}}
        readOnly={false}
      />
    </div>
  );
};

/* ─── SavedLabSection ────────────────────────────── */
const SavedLabSection = ({ labOrderId, labItems, labPriorityDesc, clinicId, branchId, onItemStatusChange, onOrderDeleted, onError }) => {
  const [deletingOrder, setDeletingOrder]     = useState(false);
  const [confirmDelOrder, setConfirmDelOrder] = useState(false);
  const [togglingId, setTogglingId]           = useState(null);

  const handleToggleItem = async (itemId, currentStatus) => {
    try {
      setTogglingId(itemId);
      const newStatus = currentStatus === 1 ? 2 : 1;
      await updateLabTestOrderItem({ itemId, clinicId, branchId, status: newStatus });
      onItemStatusChange(itemId, newStatus);
    } catch (err) {
      onError(err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteOrder = async () => {
    try {
      setDeletingOrder(true);
      await deleteLabTestOrder(labOrderId);
      onOrderDeleted();
    } catch (err) {
      onError(err);
    } finally {
      setDeletingOrder(false);
      setConfirmDelOrder(false);
    }
  };

  if (!labItems || labItems.length === 0) return null;

  return (
    <div className="saved-lab-section">
      <div className="saved-lab-section__head">
        <div className="saved-lab-section__title">
          <FiActivity size={13} />
          <span>Lab Order</span>
          {labPriorityDesc && <span className="priority-tag priority-tag--saved">{labPriorityDesc}</span>}
          <span className="saved-lab-section__count">{labItems.length} item{labItems.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="saved-lab-section__actions">
          {!confirmDelOrder ? (
            <button className="btn-del-order" onClick={() => setConfirmDelOrder(true)} title="Delete entire lab order">
              <FiTrash2 size={12} /> Delete Order
            </button>
          ) : (
            <div className="confirm-del-popup confirm-del-popup--inline">
              <div className="confirm-del-popup__inner">
                <p className="confirm-del-popup__msg"><FiAlertCircle size={14} /> Delete entire lab order?</p>
                <div className="confirm-del-popup__btns">
                  <button className="btn-confirm-yes" onClick={handleDeleteOrder} disabled={deletingOrder}>
                    {deletingOrder ? <span className="spin-sm" /> : <FiCheck size={11} />} Yes
                  </button>
                  <button className="btn-confirm-no" onClick={() => setConfirmDelOrder(false)}>
                    <FiX size={11} /> No
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="saved-lab-section__items">
        {labItems.map(item => (
          <div key={item.itemId} className={`saved-lab-item ${item.status === 0 ? 'saved-lab-item--inactive' : ''}`}>
            <div className="saved-lab-item__info">
              <span className="saved-lab-item__name">{item.testOrPackageName}</span>
              {item.totalAmount > 0 && (
                <span className="saved-lab-item__fee">₹{item.totalAmount?.toFixed(2)}</span>
              )}
            </div>
            <div className="saved-lab-item__status">
              <span className={`status-tag ${item.status === 1 ? 'status-tag--on' : ''}`}>
                {item.status === 1 ? 'Active' : 'Inactive'}
              </span>
              <button
                className={`btn-toggle-lab ${item.status === 1 ? 'btn-toggle-lab--deactivate' : 'btn-toggle-lab--activate'}`}
                onClick={() => handleToggleItem(item.itemId, item.status)}
                disabled={togglingId === item.itemId}
              >
                {togglingId === item.itemId
                  ? <span className="spin-sm" />
                  : item.status === 1
                    ? <><FiX size={11} /> Deactivate</>
                    : <><FiCheck size={11} /> Activate</>
                }
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Main Component ─────────────────────────────── */
const AddConsultation = ({ isOpen, onClose, onSuccess, preSelectedVisitId = null }) => {

  const [visitStep, setVisitStep]         = useState(1);
  const [todayVisits, setTodayVisits]     = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [loading, setLoading]             = useState(false);

  const [consultationNotes, setConsultationNotes]       = useState('');
  const [treatmentPlan, setTreatmentPlan]               = useState('');
  const [nextConsultationDate, setNextConsultationDate] = useState('');
  const [consultationId, setConsultationId]             = useState(null);
  const [prescriptionId, setPrescriptionId]             = useState(null);
  const [consultSaved, setConsultSaved]                 = useState(false);
  const [confirmedSuccess, setConfirmedSuccess]         = useState(false);
  const [submitProgress, setSubmitProgress]             = useState(null);

  const [savedNotes, setSavedNotes]         = useState('');
  const [savedPlan, setSavedPlan]           = useState('');
  const [savedNextDate, setSavedNextDate]   = useState('');
  const [updatingConsult, setUpdatingConsult] = useState(false);

  const [containers, setContainers]                       = useState([]);
  const [submittedContainerIds, setSubmittedContainerIds] = useState(new Set());
  const [savedPrescItems, setSavedPrescItems]             = useState([]);
  const [isDragOver, setIsDragOver]                       = useState(false);
  const [allMedicines, setAllMedicines]                   = useState([]);
  const [filteredMedicines, setFilteredMedicines]         = useState([]);
  const [searchQuery, setSearchQuery]                     = useState('');
  const [loadingMeds, setLoadingMeds]                     = useState(false);
  const [selectedMedIds, setSelectedMedIds]               = useState([]);
  const dragMedIdRef = useRef(null);

  const [showPatientModal, setShowPatientModal]     = useState(false);
  const [patientDetails, setPatientDetails]         = useState(null);
  const [loadingPatient, setLoadingPatient]         = useState(false);
  // Family patient: fetched quietly when primary patient loads; shown inline as name+mobile
  const [familyPatientData, setFamilyPatientData]   = useState(null);
  const [loadingFamilyData, setLoadingFamilyData]   = useState(false);
  // Second popup for full family patient details
  const [showFamilyModal, setShowFamilyModal]       = useState(false);
  const [familyPatientDetails, setFamilyPatientDetails] = useState(null);
  const [loadingFamilyDetails, setLoadingFamilyDetails] = useState(false);

  const [showLabModal, setShowLabModal]       = useState(false);
  const [labPriority, setLabPriority]         = useState(1);
  const [labOrderId, setLabOrderId]           = useState(null);
  const [labMasterItems, setLabMasterItems]   = useState([]);
  const [labPackages, setLabPackages]         = useState([]);
  const [selectedTestIds, setSelectedTestIds] = useState([]);
  const [selectedPkgIds, setSelectedPkgIds]   = useState([]);
  const [labItemsLoading, setLabItemsLoading] = useState(false);
  const [labTestSearch, setLabTestSearch]     = useState('');
  const [labPkgSearch, setLabPkgSearch]       = useState('');
  const [stagedLabPriority, setStagedLabPriority] = useState(1);
  const [stagedLabTestIds, setStagedLabTestIds]   = useState([]);
  const [stagedLabPkgIds, setStagedLabPkgIds]     = useState([]);
  const [submittedLabTestIds, setSubmittedLabTestIds] = useState([]);
  const [submittedLabPkgIds, setSubmittedLabPkgIds]   = useState([]);
  const [savedLabItems, setSavedLabItems]           = useState([]);
  const [savedLabPriorityDesc, setSavedLabPriorityDesc] = useState('');

  // ── BUG 2 FIX: Track deactivated lab item IDs separately ──
  // When an item is deactivated, keep its test/pkg ID in "deactivated" sets
  // so the modal knows to show a re-activate popup instead of adding a duplicate.
  const [deactivatedLabTestIds, setDeactivatedLabTestIds] = useState([]);
  const [deactivatedLabPkgIds, setDeactivatedLabPkgIds]   = useState([]);
  // Holds { itemId, name, testId?, pkgId? } for the re-activate confirm popup in modal
  const [reactivateConfirm, setReactivateConfirm]         = useState(null);
  const [reactivating, setReactivating]                   = useState(false);

  const [removingLabItemId, setRemovingLabItemId]   = useState(null);
  const [confirmRemoveLabId, setConfirmRemoveLabId] = useState(null);

  const [historyList, setHistoryList]           = useState([]);
  const [historyLoading, setHistoryLoading]     = useState(false);
  const [historyFrom, setHistoryFrom]           = useState('');
  const [historyTo, setHistoryTo]               = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [showViewDetail, setShowViewDetail]       = useState(false);
  const [viewDetail, setViewDetail]               = useState(null);
  const [viewDetailLoading, setViewDetailLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) document.body.classList.add('consultation-open');
    else document.body.classList.remove('consultation-open');
    return () => document.body.classList.remove('consultation-open');
  }, [isOpen]);

  useEffect(() => { if (isOpen) fetchTodayVisits(); }, [isOpen]);

  useEffect(() => {
    if (isOpen && preSelectedVisitId && todayVisits.length > 0) {
      const v = todayVisits.find(v => v.id === preSelectedVisitId);
      if (v) handleVisitSelect(v);
    }
  }, [isOpen, preSelectedVisitId, todayVisits]);

  useEffect(() => {
    if (visitStep === 2 && selectedVisit?.patientId) {
      fetchMedicines();
      fetchPatientHistory();
      fetchPatientDetails(selectedVisit.patientId);
    }
  }, [visitStep, selectedVisit]);

  useEffect(() => {
    if (visitStep === 2 && selectedVisit?.patientId) fetchPatientHistory();
  }, [historyFrom, historyTo]);

  const consultDataChanged = consultSaved && (
    consultationNotes !== savedNotes ||
    treatmentPlan !== savedPlan ||
    nextConsultationDate !== savedNextDate
  );

  const getIds = () => ({
    clinicId: Number(localStorage.getItem('clinicID')),
    branchId: Number(localStorage.getItem('branchID')),
  });

  const fetchTodayVisits = async () => {
    try {
      setLoading(true); setError(null);
      const { clinicId, branchId } = getIds();
      setTodayVisits(await getPatientVisitList(clinicId, { Page: 1, PageSize: 50, BranchID: branchId, VisitDate: today() }));
    } catch (err) { setError(err); } finally { setLoading(false); }
  };

  const fetchMedicines = async () => {
    try {
      setLoadingMeds(true);
      const { clinicId, branchId } = getIds();
      const meds = await getMedicineMasterList(clinicId, { BranchID: branchId, PageSize: 200, Status: 1 });
      setAllMedicines(meds); setFilteredMedicines(meds);
    } catch (err) { console.error(err); } finally { setLoadingMeds(false); }
  };

  const fetchPatientDetails = async (patientId) => {
    try {
      setLoadingPatient(true); setError(null);
      setFamilyPatientData(null);
      const { clinicId, branchId } = getIds();
      const pts = await getPatientsList(clinicId, { Page: 1, PageSize: 1, BranchID: branchId, PatientID: patientId, Status: 1 });
      const pt = pts?.[0] || null;
      setPatientDetails(pt);
      // Silently fetch family patient data (name + mobile) for the inline row
      if (pt?.familyPatientId) {
        fetchFamilyPatientData(pt.familyPatientId, clinicId, branchId);
      }
    } catch (err) { setError(err); } finally { setLoadingPatient(false); }
  };

  // Fetch family patient data quietly in background — used for the inline name+mobile row
  const fetchFamilyPatientData = async (familyPatientId, clinicId, branchId) => {
    try {
      setLoadingFamilyData(true);
      const pts = await getPatientsList(clinicId, { Page: 1, PageSize: 1, BranchID: branchId, PatientID: familyPatientId, Status: 1 });
      setFamilyPatientData(pts?.[0] || null);
    } catch (err) { console.error('fetchFamilyPatientData failed:', err); }
    finally { setLoadingFamilyData(false); }
  };

  // Open the second popup with full family patient details (data already fetched)
  const handleViewFamilyPatient = () => {
    if (!familyPatientData) return;
    setFamilyPatientDetails(familyPatientData);
    setShowFamilyModal(true);
  };

  const fetchPatientHistory = async () => {
    if (!selectedVisit?.patientId) return;
    try {
      setHistoryLoading(true);
      const { clinicId, branchId } = getIds();
      setHistoryList((await getConsultationList(clinicId, { Page: 1, PageSize: 50, BranchID: branchId, PatientID: selectedVisit.patientId, FromDate: historyFrom || '', ToDate: historyTo || '' })) || []);
    } catch (err) { console.error(err); } finally { setHistoryLoading(false); }
  };

  const fetchViewDetail = async (consultId) => {
    try {
      setViewDetailLoading(true); setShowViewDetail(true); setViewDetail(null);
      const { clinicId, branchId } = getIds();
      const [consultList, prescList, labOrders] = await Promise.all([
        getConsultationList(clinicId, { ConsultationID: consultId, BranchID: branchId, Page: 1, PageSize: 1 }),
        getPrescriptionList(clinicId, { ConsultationID: consultId, BranchID: branchId, Page: 1, PageSize: 5 }),
        getLabTestOrderList(clinicId, { ConsultationID: consultId, BranchID: branchId, Page: 1, PageSize: 10 }),
      ]);
      const consult      = consultList?.[0] || null;
      const prescription = prescList?.[0] || null;
      const [prescItems, labItems] = await Promise.all([
        prescription?.id ? getPrescriptionDetailList(clinicId, { PrescriptionID: prescription.id, BranchID: branchId, Page: 1, PageSize: 50 }) : Promise.resolve([]),
        labOrders?.length > 0 ? getLabTestOrderItemList(clinicId, { OrderID: labOrders[0].id, BranchID: branchId, Page: 1, PageSize: 50 }) : Promise.resolve([]),
      ]);
      setViewDetail({ consult, prescription, prescItems, labOrders, labItems });
    } catch (err) { setError(err); setShowViewDetail(false); }
    finally { setViewDetailLoading(false); }
  };

  const fetchLabItems = async () => {
    try {
      setLabItemsLoading(true);
      const { clinicId, branchId } = getIds();
      const [masters, pkgs] = await Promise.all([
        getLabTestMasterList(clinicId, { BranchID: branchId, PageSize: 200, Status: 1 }),
        getLabTestPackageList(clinicId, { BranchID: branchId, PageSize: 100, Status: 1 }),
      ]);
      setLabMasterItems(masters || []); setLabPackages(pkgs || []);
    } catch (err) { console.error(err); } finally { setLabItemsLoading(false); }
  };

  const submitPrescriptionDetails = async (clinicId, branchId, prescId, items) => {
    for (const c of items) {
      await addPrescriptionDetail({
        clinicId, branchId,
        PrescriptionID: prescId,
        MedicineID: c.medicineId,
        MedicineName: c.medicineName,
        Form: c.form,
        Strength: c.strength,
        Dosage: c.dosePerIntake,
        Frequency: buildFrequency(c.timings),
        Duration: c.days ? `${c.days} Days` : '',
        Route: c.defaultRoute,
        FoodTiming: c.foodTiming,
        Instructions: c.notes,
        Quantity: c.quantity,
        RefillAllowed: c.refillAllowed,
        RefillCount: c.refillCount,
        StartDate: c.startDate || today(),
        EndDate: c.endDate || thirtyDaysLater(),
      });
    }
    setSubmittedContainerIds(prev => new Set([...prev, ...items.map(c => c.tempId)]));
    setConfirmedSuccess(true);
    try {
      const items2 = await getPrescriptionDetailList(clinicId, { PrescriptionID: prescId, BranchID: branchId, Page: 1, PageSize: 50 });
      // Only show active (status 1) details — deleted (3) and inactive are excluded,
      setSavedPrescItems((items2 || []).filter(i => i.status === 1));
      // Clear submitted containers that are now reflected in savedPrescItems
      setContainers(prev => prev.filter(c => !items.some(i => i.tempId === c.tempId)));
      setSubmittedContainerIds(new Set());
    } catch (e) { console.error(e); }
  };

  const submitLabItems = async (clinicId, branchId, orderId, testIds, pkgIds, labOrder) => {
    for (const testId of testIds) {
      await addLabTestOrderItem({ clinicId, branchId, OrderID: orderId, PatientID: selectedVisit.patientId, DoctorID: selectedVisit.doctorId, TestID: testId, PackageID: 0 });
    }
    for (const pkgId of pkgIds) {
      await addLabTestOrderItem({ clinicId, branchId, OrderID: orderId, PatientID: selectedVisit.patientId, DoctorID: selectedVisit.doctorId, TestID: 0, PackageID: pkgId });
    }
    setSubmittedLabTestIds(prev => [...new Set([...prev, ...testIds])]);
    setSubmittedLabPkgIds(prev => [...new Set([...prev, ...pkgIds])]);
    // Remove from deactivated sets since they are now active
    setDeactivatedLabTestIds(prev => prev.filter(id => !testIds.includes(id)));
    setDeactivatedLabPkgIds(prev => prev.filter(id => !pkgIds.includes(id)));
    try {
      const items = await getLabTestOrderItemList(clinicId, { OrderID: orderId, BranchID: branchId, Page: 1, PageSize: 50 });
      setSavedLabItems(items || []);
      if (labOrder?.priorityDesc) setSavedLabPriorityDesc(labOrder.priorityDesc);
    } catch (e) { console.error(e); }
  };

  /* ── Inline update consultation ── */
  const handleInlineUpdateConsult = async () => {
    if (!consultationNotes.trim()) { setError({ message: 'Consultation Notes are required.' }); return; }
    try {
      setUpdatingConsult(true); setError(null);
      await updateConsultation({
        consultationId,
        clinicId: getIds().clinicId,
        reason: selectedVisit?.reason || '',
        symptoms: selectedVisit?.symptoms || '',
        bpSystolic:  selectedVisit?.bpSystolic  ?? 0,
        bpDiastolic: selectedVisit?.bpDiastolic ?? 0,
        temperature: selectedVisit?.temperature ?? 0,
        weight:      selectedVisit?.weight      ?? 0,
        emrNotes: '',
        ehrNotes: '',
        instructions: '',
        consultationNotes: consultationNotes.trim(),
        nextConsultationDate: nextConsultationDate || '',
        treatmentPlan: treatmentPlan.trim(),
      });
      setSavedNotes(consultationNotes);
      setSavedPlan(treatmentPlan);
      setSavedNextDate(nextConsultationDate);
    } catch (err) {
      setError(err?.message ? err : { message: err?.message || 'Update failed' });
    } finally {
      setUpdatingConsult(false);
    }
  };

  /* ── Lab order submit from modal (Save Items button) ──
     Always runs the full flow regardless of whether consultation exists yet:
     1. addConsultation (if no consultationId yet)
     2. addLabTestOrder (if no labOrderId yet)
     3. addLabTestOrderItem for each new test / package
  ── */
  const handleStageAndSubmitLabOrder = async () => {
    const newTestIds = selectedTestIds.filter(id => !submittedLabTestIds.includes(id) && !deactivatedLabTestIds.includes(id));
    const newPkgIds  = selectedPkgIds.filter(id => !submittedLabPkgIds.includes(id) && !deactivatedLabPkgIds.includes(id));

    if (newTestIds.length === 0 && newPkgIds.length === 0) {
      setShowLabModal(false);
      return;
    }

    // Validate: consultation notes required to create a consultation
    if (!consultationId && !consultationNotes.trim()) {
      setError({ message: 'Please enter Consultation Notes before saving lab items.' });
      return;
    }

    const { clinicId, branchId } = getIds();
    setShowLabModal(false);
    setError(null);

    // Build progress steps
    const steps = [];
    if (!consultationId)                               steps.push({ label: 'Creating consultation' });
    if (!labOrderId)                                   steps.push({ label: 'Creating lab order' });
    steps.push({ label: `Adding ${newTestIds.length + newPkgIds.length} lab item(s)` });
    setSubmitProgress({ steps, currentStep: 0, done: false });

    try {
      let s = 0;
      let activeConsultationId = consultationId;
      let activeLabOrderId     = labOrderId;

      // ── Step 1: Create consultation if not yet saved ──
      if (!activeConsultationId) {
        setSubmitProgress(p => ({ ...p, currentStep: s }));
        const cr = await addConsultation({
          clinicId, branchId,
          visitId:              selectedVisit.id,
          patientId:            selectedVisit.patientId,
          doctorId:             selectedVisit.doctorId,
          reason:               selectedVisit.reason      || '',
          symptoms:             selectedVisit.symptoms    || '',
          bpSystolic:           selectedVisit.bpSystolic  ?? null,
          bpDiastolic:          selectedVisit.bpDiastolic ?? null,
          temperature:          selectedVisit.temperature ?? null,
          weight:               selectedVisit.weight      ?? null,
          emrNotes:             '',
          ehrNotes:             '',
          instructions:         '',
          consultationNotes:    consultationNotes.trim(),
          nextConsultationDate: nextConsultationDate || '',
          treatmentPlan:        treatmentPlan.trim(),
        });
        if (!cr.success || !cr.consultationId) throw new Error('Failed to create consultation');
        activeConsultationId = cr.consultationId;
        setConsultationId(cr.consultationId);
        setConsultSaved(true);
        setSavedNotes(consultationNotes);
        setSavedPlan(treatmentPlan);
        setSavedNextDate(nextConsultationDate);
        s++;
      }

      // ── Step 2: Create lab order if not yet created ──
      if (!activeLabOrderId) {
        setSubmitProgress(p => ({ ...p, currentStep: s }));
        const lr = await addLabTestOrder({
          clinicId, branchId,
          ConsultationID: activeConsultationId,
          VisitID:        selectedVisit.id,
          PatientID:      selectedVisit.patientId,
          doctorId:       selectedVisit.doctorId,
          priority:       labPriority,
          Notes:          consultationNotes,
        });
        if (!lr.success) throw new Error('Failed to create lab order');
        activeLabOrderId = lr.orderId;
        setLabOrderId(lr.orderId);
        s++;
      }

      // ── Step 3: Add lab items ──
      setSubmitProgress(p => ({ ...p, currentStep: s }));
      await submitLabItems(
        clinicId, branchId,
        activeLabOrderId,
        newTestIds, newPkgIds,
        { priorityDesc: PRIORITY_OPTIONS.find(p => p.id === labPriority)?.label },
      );

      setStagedLabTestIds([]);
      setStagedLabPkgIds([]);
      setSubmitProgress(p => ({ ...p, done: true }));
      fetchPatientHistory();
      setTimeout(() => setSubmitProgress(null), 2500);
    } catch (err) {
      setError(err);
      setSubmitProgress(null);
    }
  };

  /* ── BUG 2 FIX: Re-activate a deactivated lab item from modal ── */
  const handleReactivateLabItem = async () => {
    if (!reactivateConfirm) return;
    const { itemId, testId, pkgId } = reactivateConfirm;
    try {
      setReactivating(true);
      const { clinicId, branchId } = getIds();
      await updateLabTestOrderItem({ itemId, clinicId, branchId, status: 1 });
      setSavedLabItems(prev => prev.map(i => i.itemId === itemId ? { ...i, status: 1 } : i));
      if (testId) {
        setSubmittedLabTestIds(prev => [...new Set([...prev, testId])]);
        setSelectedTestIds(prev => [...new Set([...prev, testId])]);
        setDeactivatedLabTestIds(prev => prev.filter(id => id !== testId));
      }
      if (pkgId) {
        setSubmittedLabPkgIds(prev => [...new Set([...prev, pkgId])]);
        setSelectedPkgIds(prev => [...new Set([...prev, pkgId])]);
        setDeactivatedLabPkgIds(prev => prev.filter(id => id !== pkgId));
      }
    } catch (err) {
      setError(err);
    } finally {
      setReactivating(false);
      setReactivateConfirm(null);
    }
  };

  /* ── Remove lab item from modal (deactivate) ── */
  const handleRemoveLabItemFromModal = async (itemId) => {
    try {
      setRemovingLabItemId(itemId);
      const { clinicId, branchId } = getIds();
      await updateLabTestOrderItem({ itemId, clinicId, branchId, status: 2 });
      const savedItem = savedLabItems.find(s => s.itemId === itemId);
      setSavedLabItems(prev => prev.map(i => i.itemId === itemId ? { ...i, status: 2 } : i));
      if (savedItem?.testId) {
        setSubmittedLabTestIds(prev => prev.filter(id => id !== savedItem.testId));
        setSelectedTestIds(prev => prev.filter(id => id !== savedItem.testId));
        setDeactivatedLabTestIds(prev => [...new Set([...prev, savedItem.testId])]);
      }
      if (savedItem?.packageId) {
        setSubmittedLabPkgIds(prev => prev.filter(id => id !== savedItem.packageId));
        setSelectedPkgIds(prev => prev.filter(id => id !== savedItem.packageId));
        setDeactivatedLabPkgIds(prev => [...new Set([...prev, savedItem.packageId])]);
      }
      setConfirmRemoveLabId(null);
    } catch (err) {
      setError(err);
    } finally {
      setRemovingLabItemId(null);
    }
  };

  const handleFinalSubmit = async () => {
    if (!consultationNotes.trim()) { setError({ message: 'Consultation Notes are required.' }); return; }
    if (!selectedVisit)            { setError({ message: 'No visit selected.' }); return; }

    // Only validate unsaved (pending) containers
    const pendingContainers = containers.filter(c => !submittedContainerIds.has(c.tempId));
    for (const c of pendingContainers) {
      if (!c.medicineName.trim())  { setError({ message: 'All medicines need a name.' }); return; }
      if (!c.dosePerIntake.trim()) { setError({ message: `Dose required for "${c.medicineName}".` }); return; }
      if (c.quantity <= 0)         { setError({ message: `Quantity > 0 required for "${c.medicineName}".` }); return; }
    }

    const hasMedicines = pendingContainers.length > 0;
    const hasLabOrder  = stagedLabTestIds.length > 0 || stagedLabPkgIds.length > 0;
    const { clinicId, branchId } = getIds();

    if (consultationId) {
      const newTestIds      = stagedLabTestIds.filter(id => !submittedLabTestIds.includes(id));
      const newPkgIds       = stagedLabPkgIds.filter(id => !submittedLabPkgIds.includes(id));
      const hasNewMeds      = pendingContainers.length > 0;
      const hasNewLab       = newTestIds.length > 0 || newPkgIds.length > 0;
      const needNewPresc    = hasNewMeds && prescriptionId === null;
      const needAddDetails  = hasNewMeds && prescriptionId !== null;
      const needNewLabOrder = hasNewLab  && labOrderId === null;
      const needAddLabItems = hasNewLab  && labOrderId !== null;

      const steps = [];
      if (needNewPresc)    { steps.push({ label: 'Creating prescription' }); steps.push({ label: `Adding ${pendingContainers.length} medicine(s)` }); }
      if (needAddDetails)  { steps.push({ label: `Adding ${pendingContainers.length} medicine(s)` }); }
      if (needNewLabOrder) { steps.push({ label: 'Creating lab order' }); steps.push({ label: `Adding ${newTestIds.length + newPkgIds.length} lab item(s)` }); }
      if (needAddLabItems) { steps.push({ label: `Adding ${newTestIds.length + newPkgIds.length} more lab item(s)` }); }

      if (steps.length === 0) { setError({ message: 'Nothing new to submit.' }); return; }

      setSubmitProgress({ steps, currentStep: 0, done: false }); setError(null);
      try {
        let s = 0;
        if (needNewPresc) {
          setSubmitProgress(p => ({ ...p, currentStep: s }));
          const d = (await getConsultationList(clinicId, { Page: 1, PageSize: 1, BranchID: branchId, ConsultationID: consultationId }))?.[0];
          const pr = await addPrescription({ clinicId, branchId, ConsultationID: consultationId, VisitID: d?.visitId ?? selectedVisit.id, PatientID: d?.patientId ?? selectedVisit.patientId, DoctorID: d?.doctorId ?? selectedVisit.doctorId, DateIssued: today(), ValidUntil: thirtyDaysLater(), Diagnosis: null, Notes: d?.consultationNotes || null, IsRepeat: 0, RepeatCount: 0, CreatedBy: d?.doctorId ?? selectedVisit.doctorId });
          if (!pr.success || !pr.prescriptionId) throw new Error('Failed to create prescription');
          setPrescriptionId(pr.prescriptionId); s++;
          setSubmitProgress(p => ({ ...p, currentStep: s }));
          await submitPrescriptionDetails(clinicId, branchId, pr.prescriptionId, pendingContainers); s++;
        }
        if (needAddDetails) {
          setSubmitProgress(p => ({ ...p, currentStep: s }));
          await submitPrescriptionDetails(clinicId, branchId, prescriptionId, pendingContainers); s++;
        }
        if (needNewLabOrder) {
          setSubmitProgress(p => ({ ...p, currentStep: s }));
          const lr = await addLabTestOrder({ clinicId, branchId, ConsultationID: consultationId, VisitID: selectedVisit.id, PatientID: selectedVisit.patientId, doctorId: selectedVisit.doctorId, priority: stagedLabPriority, Notes: consultationNotes });
          if (!lr.success) throw new Error('Failed to create lab order');
          setLabOrderId(lr.orderId); s++;
          setSubmitProgress(p => ({ ...p, currentStep: s }));
          await submitLabItems(clinicId, branchId, lr.orderId, newTestIds, newPkgIds, { priorityDesc: PRIORITY_OPTIONS.find(p => p.id === stagedLabPriority)?.label }); s++;
        }
        if (needAddLabItems) {
          setSubmitProgress(p => ({ ...p, currentStep: s }));
          await submitLabItems(clinicId, branchId, labOrderId, newTestIds, newPkgIds); s++;
        }

        setStagedLabTestIds([]);
        setStagedLabPkgIds([]);
        setSubmitProgress(p => ({ ...p, done: true }));
        fetchPatientHistory();
        setTimeout(() => setSubmitProgress(null), 2500);
      } catch (err) { setError(err); setSubmitProgress(null); }
      return;
    }

    const steps = [{ label: 'Creating consultation' }];
    if (hasMedicines) { steps.push({ label: 'Creating prescription' }); steps.push({ label: `Adding ${pendingContainers.length} medicine(s)` }); }
    if (hasLabOrder)  { steps.push({ label: 'Creating lab order' }); steps.push({ label: `Adding ${stagedLabTestIds.length + stagedLabPkgIds.length} lab item(s)` }); }

    setSubmitProgress({ steps, currentStep: 0, done: false }); setError(null);
    try {
      let s = 0;
      setSubmitProgress(p => ({ ...p, currentStep: s }));
      const cr = await addConsultation({ clinicId, branchId, visitId: selectedVisit.id, patientId: selectedVisit.patientId, doctorId: selectedVisit.doctorId, reason: selectedVisit.reason || '', symptoms: selectedVisit.symptoms || '', bpSystolic: selectedVisit.bpSystolic ?? null, bpDiastolic: selectedVisit.bpDiastolic ?? null, temperature: selectedVisit.temperature ?? null, weight: selectedVisit.weight ?? null, emrNotes: '', ehrNotes: '', instructions: '', consultationNotes: consultationNotes.trim(), nextConsultationDate: nextConsultationDate || '', treatmentPlan: treatmentPlan.trim() });
      if (!cr.success || !cr.consultationId) throw new Error('Failed to create consultation');
      setConsultationId(cr.consultationId); setConsultSaved(true);
      setSavedNotes(consultationNotes); setSavedPlan(treatmentPlan); setSavedNextDate(nextConsultationDate);
      s++;

      if (hasMedicines) {
        setSubmitProgress(p => ({ ...p, currentStep: s }));
        const d = (await getConsultationList(clinicId, { Page: 1, PageSize: 1, BranchID: branchId, ConsultationID: cr.consultationId }))?.[0];
        const pr = await addPrescription({ clinicId, branchId, ConsultationID: cr.consultationId, VisitID: d?.visitId ?? selectedVisit.id, PatientID: d?.patientId ?? selectedVisit.patientId, DoctorID: d?.doctorId ?? selectedVisit.doctorId, DateIssued: today(), ValidUntil: thirtyDaysLater(), Diagnosis: null, Notes: d?.consultationNotes || null, IsRepeat: 0, RepeatCount: 0, CreatedBy: d?.doctorId ?? selectedVisit.doctorId });
        if (!pr.success || !pr.prescriptionId) throw new Error('Failed to create prescription');
        setPrescriptionId(pr.prescriptionId); s++;
        setSubmitProgress(p => ({ ...p, currentStep: s }));
        await submitPrescriptionDetails(clinicId, branchId, pr.prescriptionId, pendingContainers); s++;
      }
      if (hasLabOrder) {
        setSubmitProgress(p => ({ ...p, currentStep: s }));
        const lr = await addLabTestOrder({ clinicId, branchId, ConsultationID: cr.consultationId, VisitID: selectedVisit.id, PatientID: selectedVisit.patientId, doctorId: selectedVisit.doctorId, priority: stagedLabPriority, Notes: consultationNotes });
        if (!lr.success) throw new Error('Failed to create lab order');
        setLabOrderId(lr.orderId); s++;
        setSubmitProgress(p => ({ ...p, currentStep: s }));
        await submitLabItems(clinicId, branchId, lr.orderId, stagedLabTestIds, stagedLabPkgIds, { priorityDesc: PRIORITY_OPTIONS.find(p => p.id === stagedLabPriority)?.label }); s++;
      }
      setStagedLabTestIds([]);
      setStagedLabPkgIds([]);
      setSubmitProgress(p => ({ ...p, done: true }));
      fetchPatientHistory();
      setTimeout(() => setSubmitProgress(null), 2500);
    } catch (err) { setError(err); setSubmitProgress(null); }
  };

  const handleVisitSelect   = (v) => { setSelectedVisit(v); setVisitStep(2); };
  const updateContainer     = (tid, ch) => setContainers(prev => prev.map(c => c.tempId === tid ? { ...c, ...ch } : c));
  const removeContainer     = (tid)      => setContainers(prev => prev.filter(c => c.tempId !== tid));
  const addBlankContainer   = ()         => setContainers(prev => [...prev, createContainer()]);

  const handleSearch = () => {
    const q = searchQuery.toLowerCase().trim();
    setFilteredMedicines(q ? allMedicines.filter(m => m.name.toLowerCase().includes(q) || (m.genericName && m.genericName.toLowerCase().includes(q))) : allMedicines);
  };

  const toggleMedSelection = (id) => setSelectedMedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const clearMedSelection  = () => setSelectedMedIds([]);

  const handleAddSelectedMeds = () => {
    if (!selectedMedIds.length) return;
    setContainers(prev => [...prev, ...selectedMedIds.map(id => createContainer(allMedicines.find(m => m.id === id)))]);
    setSelectedMedIds([]);
  };

  const handleDragStart = (e, medId) => { dragMedIdRef.current = medId; e.dataTransfer.effectAllowed = 'copy'; e.dataTransfer.setData('text/plain', String(medId)); };
  const handleDragEnd   = ()          => { dragMedIdRef.current = null; };
  const handleDragOver  = (e)         => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setIsDragOver(true); };
  const handleDragLeave = ()          => setIsDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragOver(false);
    const id = Number(e.dataTransfer.getData('text/plain') || dragMedIdRef.current);
    if (!id) return;
    const med = allMedicines.find(m => m.id === id);
    if (!med || containers.some(c => c.medicineId === id)) return;
    setContainers(prev => [...prev, createContainer(med)]);
  };

  const handleOpenHistory = () => { setShowHistoryModal(true); if (selectedVisit?.patientId) fetchPatientHistory(); };

  const handleOpenLabModal = () => {
    setLabPriority(stagedLabPriority);
    setSelectedTestIds([...new Set([...stagedLabTestIds, ...submittedLabTestIds])]);
    setSelectedPkgIds([...new Set([...stagedLabPkgIds, ...submittedLabPkgIds])]);
    setLabTestSearch(''); setLabPkgSearch('');
    setReactivateConfirm(null);
    setShowLabModal(true);
    if (!labMasterItems.length && !labPackages.length) fetchLabItems();
  };

  const handlePrescItemUpdated = (detailId, updatedLocal) => {
    setSavedPrescItems(prev => prev.map(item =>
      item.id === detailId
        ? { ...item, dosage: updatedLocal.dosePerIntake, frequency: buildFrequency(updatedLocal.timings), duration: updatedLocal.days ? `${updatedLocal.days} Days` : '', quantity: updatedLocal.quantity, instructions: updatedLocal.notes, foodTiming: updatedLocal.foodTiming }
        : item
    ));
  };

  /* ─────────────────────────────────────────────────────────────────
   BUG 1 FIX:
   After a prescription detail is saved, submitted containers are moved
   into savedPrescItems and cleared from the containers array inside
   submitPrescriptionDetails. So handlePrescItemDeleted only needs to
   remove from savedPrescItems — no container cleanup needed (they
   are already gone). This prevents the "3 shown instead of 2" issue
   where containers.length + savedPrescItems.length double-counted
   submitted medicines.
  ───────────────────────────────────────────────────────────────── */
  const handlePrescItemDeleted = (detailId) => {
    setSavedPrescItems(prev => prev.filter(item => item.id !== detailId));
  };

  /* ─────────────────────────────────────────────────────────────────
   BUG 2 FIX:
   handleLabItemStatusChange now syncs the deactivated ID sets so
   the lab modal can distinguish "deactivated (re-activate?)" from
   "never submitted (add fresh)".
  ───────────────────────────────────────────────────────────────── */
  const handleLabItemStatusChange = (itemId, newStatus) => {
    setSavedLabItems(prev =>
      prev.map(item => item.itemId === itemId ? { ...item, status: newStatus } : item)
    );

    const changedItem = savedLabItems.find(item => item.itemId === itemId);
    if (!changedItem) return;

    const isActive = newStatus === 1;
    const testId   = changedItem.testId   ?? changedItem.testID   ?? 0;
    const pkgId    = changedItem.packageId ?? changedItem.packageID ?? 0;

    if (testId) {
      if (isActive) {
        // Activated → move back to submitted, remove from deactivated
        setSubmittedLabTestIds(prev => [...new Set([...prev, testId])]);
        setSelectedTestIds(prev => [...new Set([...prev, testId])]);
        setDeactivatedLabTestIds(prev => prev.filter(id => id !== testId));
      } else {
        // Deactivated → move to deactivated, remove from submitted
        setSubmittedLabTestIds(prev => prev.filter(id => id !== testId));
        setSelectedTestIds(prev => prev.filter(id => id !== testId));
        setDeactivatedLabTestIds(prev => [...new Set([...prev, testId])]);
      }
    }
    if (pkgId) {
      if (isActive) {
        setSubmittedLabPkgIds(prev => [...new Set([...prev, pkgId])]);
        setSelectedPkgIds(prev => [...new Set([...prev, pkgId])]);
        setDeactivatedLabPkgIds(prev => prev.filter(id => id !== pkgId));
      } else {
        setSubmittedLabPkgIds(prev => prev.filter(id => id !== pkgId));
        setSelectedPkgIds(prev => prev.filter(id => id !== pkgId));
        setDeactivatedLabPkgIds(prev => [...new Set([...prev, pkgId])]);
      }
    }
  };

  const handleLabOrderDeleted = () => {
    setSavedLabItems([]); setLabOrderId(null);
    setSubmittedLabTestIds([]); setSubmittedLabPkgIds([]);
    setDeactivatedLabTestIds([]); setDeactivatedLabPkgIds([]);
    setStagedLabTestIds([]); setStagedLabPkgIds([]);
    setSelectedTestIds([]); setSelectedPkgIds([]);
  };

  const handleClose = () => {
    setVisitStep(1); setSelectedVisit(null); setTodayVisits([]);
    setConsultationNotes(''); setTreatmentPlan(''); setNextConsultationDate('');
    setSavedNotes(''); setSavedPlan(''); setSavedNextDate('');
    setConsultationId(null); setPrescriptionId(null); setConsultSaved(false); setConfirmedSuccess(false);
    setContainers([]); setSubmittedContainerIds(new Set()); setAllMedicines([]); setFilteredMedicines([]); setSearchQuery(''); setSelectedMedIds([]);
    setSavedPrescItems([]);
    setPatientDetails(null); setFamilyPatientData(null); setShowPatientModal(false); setShowFamilyModal(false); setFamilyPatientDetails(null);
    setShowLabModal(false); setLabOrderId(null);
    setStagedLabPriority(1); setStagedLabTestIds([]); setStagedLabPkgIds([]);
    setSubmittedLabTestIds([]); setSubmittedLabPkgIds([]);
    setDeactivatedLabTestIds([]); setDeactivatedLabPkgIds([]);
    setSelectedTestIds([]); setSelectedPkgIds([]);
    setSavedLabItems([]); setSavedLabPriorityDesc('');
    setHistoryList([]); setHistoryFrom(''); setHistoryTo(''); setShowHistoryModal(false);
    setShowViewDetail(false); setViewDetail(null);
    setIsDragOver(false); setSubmitProgress(null); setError(null);
    setUpdatingConsult(false); setConfirmRemoveLabId(null); setRemovingLabItemId(null);
    setReactivateConfirm(null); setReactivating(false);
    onClose();
  };

  if (!isOpen) return null;

  /* ── Derived helpers ── */
  const getLabName = (t) => t?.name || t?.testName || t?.test_name || t?.TestName || t?.test_title || t?.title || '';
  const getPkgName = (p) => p?.name || p?.packageName || p?.package_name || p?.PackageName || p?.packageTitle || p?.package_title || p?.title || p?.label || p?.description || p?.package_desc || p?.PackageDesc || Object.values(p).find(v => typeof v === 'string' && v.length > 1 && !/^[0-9]/.test(v)) || '';

  const filteredTests = labMasterItems.filter(t => !labTestSearch || getLabName(t).toLowerCase().includes(labTestSearch.toLowerCase()));
  const filteredPkgs  = labPackages.filter(p => !labPkgSearch || getPkgName(p).toLowerCase().includes(labPkgSearch.toLowerCase()));

  // ── BUG 1 FIX: Panel 2 count = saved items + truly pending (unsaved) containers only ──
  const pendingContainerCount = containers.filter(c => !submittedContainerIds.has(c.tempId)).length;
  const totalPrescCount       = savedPrescItems.length + pendingContainerCount;

  const stagedLabCount  = stagedLabTestIds.length + stagedLabPkgIds.length;
  const hasAnythingNew  = pendingContainerCount > 0 || stagedLabCount > 0;

  const submitBtnLabel = () => {
    const parts = [];
    if (pendingContainerCount > 0) parts.push(`${pendingContainerCount} med${pendingContainerCount > 1 ? 's' : ''}`);
    if (stagedLabCount > 0) parts.push(`${stagedLabCount} lab`);
    return parts.join(' · ');
  };

  const { clinicId, branchId } = getIds();

  return ReactDOM.createPortal(
    <div className="ac-overlay">
      <div className="ac-shell">

        {/* ── HEADER ── */}
        <header className="ac-header">
          <div className="ac-header__left">
            {visitStep === 2 && !consultationId && (
              <button className="btn-back" onClick={() => { setVisitStep(1); setSelectedVisit(null); }}>
                <FiArrowLeft size={16} />
              </button>
            )}
            <div className="ac-header__title-group">
              <h2 className="ac-header__title">{visitStep === 1 ? 'Select Visit' : 'New Consultation'}</h2>
              {selectedVisit && (
                <p className="ac-header__sub">
                  <strong>{selectedVisit.patientName}</strong>
                  <span> · </span>
                  <span>{selectedVisit.doctorFullName}</span>
                </p>
              )}
            </div>
          </div>

          <div className="ac-header__right">
            {visitStep === 2 && (
              <>
                <div className="header-nav-group">
                  <button className="btn-nav" onClick={() => { if (selectedVisit) { fetchPatientDetails(selectedVisit.patientId); setShowPatientModal(true); } }}>
                    <FiUser size={13} /> Patient
                  </button>
                  <button className="btn-nav btn-nav--violet" onClick={handleOpenHistory}>
                    <FiActivity size={13} /> History
                  </button>
                  <button className="btn-nav btn-nav--blue" onClick={handleOpenLabModal}>
                    <FiFileText size={13} /> Lab Order
                    {stagedLabCount > 0 && <span className="badge">{stagedLabCount}</span>}
                  </button>
                </div>
                <div className="header-submit-group">
                  {!consultSaved && (
                    <button
                      className="btn-submit"
                      onClick={handleFinalSubmit}
                      disabled={!!submitProgress}
                    >
                      {submitProgress && !submitProgress.done
                        ? <><span className="spin-sm" /> Processing…</>
                        : <><FiSend size={14} /> Submit{submitBtnLabel() && <span className="btn-submit__badge">{submitBtnLabel()}</span>}</>
                      }
                    </button>
                  )}
                  {consultSaved && hasAnythingNew && (
                    <button
                      className="btn-submit btn-submit--add"
                      onClick={handleFinalSubmit}
                      disabled={!!submitProgress}
                    >
                      {submitProgress && !submitProgress.done
                        ? <><span className="spin-sm" /> Processing…</>
                        : <><FiPlus size={14} /> Add{submitBtnLabel() && <span className="btn-submit__badge">{submitBtnLabel()}</span>}</>
                      }
                    </button>
                  )}
                </div>
              </>
            )}
            <button className="btn-close" onClick={handleClose}><FiX size={18} /></button>
          </div>
        </header>

        {/* ── BODY ── */}
        <main className="ac-body">

          {/* ═══ STEP 1 ═══ */}
          {visitStep === 1 && (
            <div className="visit-picker">
              <div className="visit-picker__header">
                <div className="visit-picker__title">
                  <FiCalendar size={16} />
                  <h3>Today's Patients</h3>
                  {!loading && <span className="visit-picker__count">{todayVisits.length} visit{todayVisits.length !== 1 ? 's' : ''}</span>}
                </div>
                <button className="btn-icon" onClick={fetchTodayVisits}><FiRefreshCw size={13} className={loading ? 'spinning' : ''} /></button>
              </div>

              {loading ? (
                <div className="state-loading"><div className="spinner-lg" /><p>Loading visits…</p></div>
              ) : todayVisits.length === 0 ? (
                <div className="state-empty">
                  <div className="state-empty__icon"><FiCalendar size={36} /></div>
                  <h4>No visits scheduled today</h4>
                  <p>Patients will appear here once added to the schedule.</p>
                </div>
              ) : (
                <div className="visit-grid">
                  {todayVisits.map(v => (
                    <div key={v.id} className="visit-card" onClick={() => handleVisitSelect(v)}>
                      <div className="visit-card__top">
                        <div className="visit-card__avatar">{v.patientName?.charAt(0).toUpperCase() || 'P'}</div>
                        <div className="visit-card__info">
                          <div className="visit-card__name">{v.patientName}</div>
                          <div className="visit-card__meta">{v.patientFileNo} · {v.patientMobile}</div>
                        </div>
                        <div className="visit-card__time">{formatTime(v.visitTime)}</div>
                      </div>
                      <div className="visit-card__body">
                        <div className="visit-card__field">
                          <span className="visit-card__fl">Doctor</span>
                          <span className="visit-card__fv">{v.doctorFullName}</span>
                        </div>
                        {v.reason && (
                          <div className="visit-card__field">
                            <span className="visit-card__fl">Reason</span>
                            <span className="visit-card__fv visit-card__fv--reason">{v.reason}</span>
                          </div>
                        )}
                        {(v.bpReading || v.temperature || v.weight) && (
                          <div className="vitals-row">
                            {v.bpReading   && <span className="vp vp--bp"><FiHeart size={9} /> {v.bpReading}</span>}
                            {v.temperature && <span className="vp vp--temp"><FiThermometer size={9} /> {v.temperature}°</span>}
                            {v.weight      && <span className="vp vp--wt"><FiTrendingUp size={9} /> {v.weight}kg</span>}
                          </div>
                        )}
                      </div>
                      <div className="visit-card__cta">
                        Start Consultation <FiArrowLeft size={12} style={{ transform: 'rotate(180deg)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ STEP 2 ═══ */}
          {visitStep === 2 && (
            <div className="step2">

              {patientDetails && (patientDetails.allergies || patientDetails.existingMedicalConditions || patientDetails.currentMedications) && (
                <div className="patient-bar">
                  {patientDetails.allergies && (
                    <div className="patient-bar__item patient-bar__item--alert">
                      <FiAlertCircle size={12} />
                      <strong>Allergies:</strong>
                      <span>{patientDetails.allergies}</span>
                    </div>
                  )}
                  {patientDetails.existingMedicalConditions && (
                    <div className="patient-bar__item">
                      <FiHeart size={12} />
                      <strong>Conditions:</strong>
                      <span>{patientDetails.existingMedicalConditions}</span>
                    </div>
                  )}
                  {patientDetails.currentMedications && (
                    <div className="patient-bar__item">
                      <FiDroplet size={12} />
                      <strong>Medications:</strong>
                      <span>{patientDetails.currentMedications}</span>
                    </div>
                  )}
                </div>
              )}

              {consultSaved && (
                <div className="saved-banner">
                  <FiCheckCircle size={14} />
                  <span>Consultation saved{confirmedSuccess ? ' · Prescription added' : ''}{labOrderId ? ' · Lab order added' : ''}</span>
                  {!confirmedSuccess && !labOrderId && (
                    <span className="saved-banner__hint">— Add medicines or lab items</span>
                  )}
                </div>
              )}

              {error && (
                <div className="error-banner">
                  <FiAlertCircle size={13} />
                  <span>{error?.message || String(error)}</span>
                  <button onClick={() => setError(null)}><FiX size={12} /></button>
                </div>
              )}

              <div className={`panels ${isDragOver ? 'panels--dragover' : ''}`}>

                {/* Panel 1 */}
                <section className="panel panel--1">
                  <div className="panel__head">
                    <span className="panel__num panel__num--1">1</span>
                    <h3 className="panel__title">Consultation Notes</h3>
                    {consultSaved && <span className="panel__saved"><FiCheck size={10} /> Saved</span>}
                  </div>
                  <div className="panel__body">
                    {selectedVisit && (selectedVisit.reason || selectedVisit.symptoms || selectedVisit.bpReading) && (
                      <div className="visit-snapshot">
                        {selectedVisit.reason && (
                          <div className="snapshot-row"><span className="snapshot-label">Reason</span><span>{selectedVisit.reason}</span></div>
                        )}
                        {selectedVisit.symptoms && (
                          <div className="snapshot-row"><span className="snapshot-label">Symptom</span><span>{selectedVisit.symptoms}</span></div>
                        )}
                        {(selectedVisit.bpReading || selectedVisit.temperature || selectedVisit.weight) && (
                          <div className="vitals-row" style={{ marginTop: 4 }}>
                            {selectedVisit.bpReading   && <span className="vp vp--bp"><FiHeart size={9} /> {selectedVisit.bpReading}</span>}
                            {selectedVisit.temperature && <span className="vp vp--temp"><FiThermometer size={9} /> {selectedVisit.temperature}°</span>}
                            {selectedVisit.weight      && <span className="vp vp--wt"><FiTrendingUp size={9} /> {selectedVisit.weight}kg</span>}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="form-stack">
                      <div className="form-group">
                        <label className="form-label">Notes <span className="req">*</span></label>
                        <textarea
                          className="form-textarea form-textarea--lg"
                          rows={9}
                          value={consultationNotes}
                          onChange={e => setConsultationNotes(e.target.value)}
                          placeholder="Describe findings, diagnosis, and clinical observations…"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label form-label--opt">Treatment Plan <span className="opt">(optional)</span></label>
                        <textarea
                          className="form-textarea"
                          rows={3}
                          value={treatmentPlan}
                          onChange={e => setTreatmentPlan(e.target.value)}
                          placeholder="Outline recommended treatment…"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label form-label--opt">Next Visit Date <span className="opt">(optional)</span></label>
                        <input
                          type="date"
                          className="form-input"
                          value={nextConsultationDate}
                          onChange={e => setNextConsultationDate(e.target.value)}
                          min={today()}
                        />
                      </div>
                      
                      {consultDataChanged && (
                        <div className="consult-update-bar">
                          <span className="consult-update-bar__hint">
                            <FiAlertCircle size={12} /> Unsaved changes
                          </span>
                          <button
                            className="consult-update-bar__btn"
                            onClick={handleInlineUpdateConsult}
                            disabled={updatingConsult}
                          >
                            {updatingConsult
                              ? <><span className="spin-sm spin-sm--teal" /> Updating…</>
                              : <><FiSave size={13} /> Save Changes</>
                            }
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* Panel 2 — Prescription */}
                <section
                  className={`panel panel--2 ${isDragOver ? 'panel--drop' : ''}`}
                  onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                >
                  <div className="panel__head">
                    <span className="panel__num panel__num--2">2</span>
                    <h3 className="panel__title">Prescription</h3>
                    {/* BUG 1 FIX: count only saved + truly pending — no double-counting */}
                    {totalPrescCount > 0 && (
                      <span className="panel__count">{totalPrescCount}</span>
                    )}
                    {confirmedSuccess && <span className="panel__saved"><FiCheck size={10} /> Saved</span>}
                  </div>
                  <div className="panel__body">

                    {savedPrescItems.length > 0 && (
                      <div className="saved-presc-list">
                        {savedPrescItems.map(item => (
                          <SavedMedicineCard
                            key={item.id}
                            item={item}
                            clinicId={clinicId}
                            branchId={branchId}
                            onUpdated={handlePrescItemUpdated}
                            onDeleted={handlePrescItemDeleted}
                            onError={setError}
                          />
                        ))}
                      </div>
                    )}

                    {pendingContainerCount === 0 && savedPrescItems.length === 0 ? (
                      <div className="panel-empty">
                        <div className="panel-empty__icon"><FiPackage size={28} /></div>
                        <p>No medicines added</p>
                        <span>Drag from the list or click Add below</span>
                      </div>
                    ) : (
                      <div className="rx-list">
                        {containers.filter(c => !submittedContainerIds.has(c.tempId)).map(c => (
                          <MedicineContainer
                            key={c.tempId}
                            container={c}
                            onUpdate={updateContainer}
                            onRemove={removeContainer}
                            readOnly={false}
                          />
                        ))}
                      </div>
                    )}

                    <button type="button" className="btn-add-med" onClick={addBlankContainer}>
                      <FiPlus size={13} /> Add Medicine Manually
                    </button>

                    {savedLabItems.length > 0 && (
                      <SavedLabSection
                        labOrderId={labOrderId}
                        labItems={savedLabItems}
                        labPriorityDesc={savedLabPriorityDesc}
                        clinicId={clinicId}
                        branchId={branchId}
                        onItemStatusChange={handleLabItemStatusChange}
                        onOrderDeleted={handleLabOrderDeleted}
                        onError={setError}
                      />
                    )}
                  </div>
                </section>

                {/* Panel 3 — Medicine List */}
                <section className="panel panel--3">
                  <div className="panel__head">
                    <span className="panel__num panel__num--3">3</span>
                    <h3 className="panel__title">Medicine List</h3>
                    {selectedMedIds.length > 0 && (
                      <>
                        <button className="btn-add-sel" onClick={handleAddSelectedMeds}>
                          <FiPlus size={11} /> Add {selectedMedIds.length}
                        </button>
                        <button className="btn-clear-sel" onClick={clearMedSelection} title="Clear selection">
                          <FiX size={11} /> Clear
                        </button>
                      </>
                    )}
                  </div>
                  <div className="panel__body">
                    <div className="med-search">
                      <FiSearch size={14} className="med-search__icon" />
                      <input type="text" className="med-search__input" value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder="Search by name or generic…" />
                      {searchQuery && (
                        <button className="med-search__clear" onClick={() => { setSearchQuery(''); setFilteredMedicines(allMedicines); }}>
                          <FiX size={12} />
                        </button>
                      )}
                    </div>

                    <p className="med-drag-tip"><FiMenu size={10} /> Drag to Prescription or click to select</p>

                    <div className="med-list">
                      {loadingMeds ? (
                        <div className="state-loading state-loading--sm"><div className="spin-sm" /><span>Loading…</span></div>
                      ) : filteredMedicines.length === 0 ? (
                        <div className="state-empty state-empty--sm"><p>No medicines found</p></div>
                      ) : filteredMedicines.map(m => {
                        const isSelected   = selectedMedIds.includes(m.id);
                        // alreadyAdded: in pending containers OR in saved prescription items
                        const alreadyAdded = containers.some(c => c.medicineId === m.id)
                          || savedPrescItems.some(item => item.medicineId === m.id);
                        return (
                          <div key={m.id}
                            className={`med-item ${isSelected ? 'med-item--sel' : ''} ${alreadyAdded ? 'med-item--added' : ''}`}
                            draggable={!alreadyAdded}
                            onClick={() => !alreadyAdded && toggleMedSelection(m.id)}
                            onDragStart={e => handleDragStart(e, m.id)} onDragEnd={handleDragEnd}>
                            <span className="med-item__drag"><FiMenu size={10} /></span>
                            <input type="checkbox" className="med-item__chk" checked={isSelected}
                              onChange={() => toggleMedSelection(m.id)} onClick={e => e.stopPropagation()} disabled={alreadyAdded} />
                            <div className="med-item__info">
                              <div className="med-item__name">
                                {m.name}
                                {alreadyAdded && <span className="tag tag--added"><FiCheck size={8} /> Added</span>}
                              </div>
                              <div className="med-item__tags">
                                {m.genericName && <span className="tag">{m.genericName}</span>}
                                {m.typeDesc    && <span className="tag">{m.typeDesc}</span>}
                                {m.dosageForm  && <span className="tag">{m.dosageForm}</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>

              </div>
            </div>
          )}
        </main>

        {/* ═══ PROGRESS ═══ */}
        {submitProgress && (
          <div className="progress-overlay">
            <div className="progress-modal">
              <div className={`progress-modal__head ${submitProgress.done ? 'progress-modal__head--done' : ''}`}>
                {submitProgress.done
                  ? <><FiCheckCircle size={19} /> All Done!</>
                  : <><span className="spin-sm" /> Processing…</>
                }
              </div>
              <div className="progress-modal__body">
                {submitProgress.steps.map((step, idx) => {
                  const state = submitProgress.done ? 'done'
                    : idx < submitProgress.currentStep ? 'done'
                    : idx === submitProgress.currentStep ? 'active' : 'wait';
                  return (
                    <div key={idx} className={`pstep pstep--${state}`}>
                      <div className="pstep__icon">
                        {state === 'done'   ? <FiCheck size={11} />
                          : state === 'active' ? <span className="spin-sm" />
                          : <span>{idx + 1}</span>}
                      </div>
                      <span className="pstep__label">{step.label}</span>
                    </div>
                  );
                })}
                {submitProgress.done && <div className="progress-done">Saved successfully!</div>}
              </div>
            </div>
          </div>
        )}

        {/* ═══ PATIENT MODAL ═══ */}
        {showPatientModal && (
          <div className="modal-overlay" onClick={() => setShowPatientModal(false)}>
            <div className="modal patient-modal" onClick={e => e.stopPropagation()}>
              <div className="modal__head">
                <span><FiUser size={14} /> Patient Details</span>
                <button className="modal__close" onClick={() => setShowPatientModal(false)}><FiX size={16} /></button>
              </div>

              {loadingPatient ? (
                <div className="state-loading"><div className="spinner-lg" /></div>
              ) : patientDetails ? (
                <>
                  <div className="pt-hero">
                    <div className="pt-hero__avatar">{patientDetails.patientName?.charAt(0).toUpperCase() || 'P'}</div>
                    <div>
                      <h3 className="pt-hero__name">{patientDetails.patientName}</h3>
                      <div className="pt-hero__chips">
                        {patientDetails.fileNo         && <span className="chip">{patientDetails.fileNo}</span>}
                        {patientDetails.genderDesc     && <span className="chip">{patientDetails.genderDesc}</span>}
                        {patientDetails.age            && <span className="chip">{patientDetails.age} yrs</span>}
                        {patientDetails.bloodGroupDesc && <span className="chip chip--blood"><FiDroplet size={9} /> {patientDetails.bloodGroupDesc}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="pt-grid">
                    {[
                      ['Mobile',            patientDetails.mobile],
                      ['Alt Mobile',        patientDetails.altMobile],
                      ['Email',             patientDetails.email],
                      ['Birth Date',        patientDetails.birthDate ? formatDate(patientDetails.birthDate) : null],
                      ['Marital Status',    patientDetails.maritalStatusDesc],
                      ['Emergency Contact', patientDetails.emergencyContactNo],
                    ].filter(([, v]) => v).map(([label, val]) => (
                      <div key={label} className="pt-cell"><label>{label}</label><span>{val}</span></div>
                    ))}

                    {patientDetails.address && (
                      <div className="pt-cell pt-cell--full"><label>Address</label><span>{patientDetails.address}</span></div>
                    )}

                    {/* ── Family Patient row ── */}
                    {patientDetails.familyPatientId && (
                      <div className="pt-cell pt-cell--full pt-cell--family">
                        <label><FiUsers size={10} /> Family Patient</label>
                        {loadingFamilyData ? (
                          <div className="pt-family-loading">
                            <span className="spin-sm spin-sm--teal" /> Fetching family patient…
                          </div>
                        ) : familyPatientData ? (
                          <div className="pt-family-row">
                            <div className="pt-family-info">
                              <span className="pt-family-name">{familyPatientData.patientName}</span>
                              {familyPatientData.mobile && (
                                <span className="pt-family-mobile">{familyPatientData.mobile}</span>
                              )}
                            </div>
                            <button className="btn-pt-view-family" onClick={handleViewFamilyPatient}>
                              <FiEye size={11} /> View Details
                            </button>
                          </div>
                        ) : (
                          <span className="pt-family-id-fallback">ID #{patientDetails.familyPatientId}</span>
                        )}
                      </div>
                    )}

                    {patientDetails.allergies && (
                      <div className="pt-cell pt-cell--full pt-cell--alert">
                        <label><FiAlertCircle size={10} /> Allergies</label>
                        <span>{patientDetails.allergies}</span>
                      </div>
                    )}
                    {patientDetails.existingMedicalConditions && (
                      <div className="pt-cell pt-cell--full"><label>Medical Conditions</label><span>{patientDetails.existingMedicalConditions}</span></div>
                    )}
                    {patientDetails.currentMedications && (
                      <div className="pt-cell pt-cell--full"><label>Current Medications</label><span>{patientDetails.currentMedications}</span></div>
                    )}
                  </div>
                </>
              ) : <div className="state-empty"><p>No details available</p></div>}
            </div>
          </div>
        )}

        {/* ═══ FAMILY PATIENT MODAL (second popup) ═══ */}
        {showFamilyModal && familyPatientDetails && (
          <div className="modal-overlay modal-overlay--family" onClick={() => setShowFamilyModal(false)}>
            <div className="modal patient-modal family-patient-modal" onClick={e => e.stopPropagation()}>
              <div className="modal__head modal__head--family">
                <span><FiUsers size={14} /> Family Patient Details</span>
                <button className="modal__close" onClick={() => setShowFamilyModal(false)}><FiX size={16} /></button>
              </div>

              <div className="pt-hero pt-hero--family">
                <div className="pt-hero__avatar pt-hero__avatar--family">
                  {familyPatientDetails.patientName?.charAt(0).toUpperCase() || 'F'}
                </div>
                <div>
                  <h3 className="pt-hero__name">{familyPatientDetails.patientName}</h3>
                  <div className="pt-hero__chips">
                    {familyPatientDetails.fileNo         && <span className="chip">{familyPatientDetails.fileNo}</span>}
                    {familyPatientDetails.genderDesc     && <span className="chip">{familyPatientDetails.genderDesc}</span>}
                    {familyPatientDetails.age            && <span className="chip">{familyPatientDetails.age} yrs</span>}
                    {familyPatientDetails.bloodGroupDesc && <span className="chip chip--blood"><FiDroplet size={9} /> {familyPatientDetails.bloodGroupDesc}</span>}
                    <span className="chip chip--family"><FiUsers size={9} /> Family Member</span>
                  </div>
                </div>
              </div>

              <div className="pt-grid">
                {[
                  ['Mobile',            familyPatientDetails.mobile],
                  ['Alt Mobile',        familyPatientDetails.altMobile],
                  ['Email',             familyPatientDetails.email],
                  ['Birth Date',        familyPatientDetails.birthDate ? formatDate(familyPatientDetails.birthDate) : null],
                  ['Marital Status',    familyPatientDetails.maritalStatusDesc],
                  ['Emergency Contact', familyPatientDetails.emergencyContactNo],
                ].filter(([, v]) => v).map(([label, val]) => (
                  <div key={label} className="pt-cell"><label>{label}</label><span>{val}</span></div>
                ))}

                {familyPatientDetails.address && (
                  <div className="pt-cell pt-cell--full"><label>Address</label><span>{familyPatientDetails.address}</span></div>
                )}
                {familyPatientDetails.allergies && (
                  <div className="pt-cell pt-cell--full pt-cell--alert">
                    <label><FiAlertCircle size={10} /> Allergies</label>
                    <span>{familyPatientDetails.allergies}</span>
                  </div>
                )}
                {familyPatientDetails.existingMedicalConditions && (
                  <div className="pt-cell pt-cell--full"><label>Medical Conditions</label><span>{familyPatientDetails.existingMedicalConditions}</span></div>
                )}
                {familyPatientDetails.currentMedications && (
                  <div className="pt-cell pt-cell--full"><label>Current Medications</label><span>{familyPatientDetails.currentMedications}</span></div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ LAB MODAL ═══ */}
        {showLabModal && (
          <div className="modal-overlay" onClick={() => setShowLabModal(false)}>
            <div className="modal lab-modal" onClick={e => e.stopPropagation()}>
              <div className="modal__head">
                <span><FiFileText size={14} /> Lab Order</span>
                <button className="modal__close" onClick={() => setShowLabModal(false)}><FiX size={16} /></button>
              </div>

              <div className="lab-priority">
                <span className="lab-priority__label">Priority</span>
                <div className="lab-priority__options">
                  {PRIORITY_OPTIONS.map(p => {
                    const Icon = p.icon;
                    return (
                      <button key={p.id} type="button"
                        className={`priority-btn priority-btn--${p.color} ${labPriority === p.id ? 'priority-btn--on' : ''}`}
                        onClick={() => setLabPriority(p.id)}>
                        <Icon size={13} /> {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="lab-cols">
                {/* Lab Tests column */}
                <div className="lab-col">
                  <div className="lab-col__head">
                    <FiActivity size={12} /> Lab Tests
                    {selectedTestIds.filter(id => !submittedLabTestIds.includes(id) && !deactivatedLabTestIds.includes(id)).length > 0 && (
                      <span className="lab-col__cnt">
                        {selectedTestIds.filter(id => !submittedLabTestIds.includes(id) && !deactivatedLabTestIds.includes(id)).length} selected
                      </span>
                    )}
                    {submittedLabTestIds.length > 0 && (
                      <span className="lab-col__frozen-cnt">{submittedLabTestIds.length} saved</span>
                    )}
                    {deactivatedLabTestIds.length > 0 && (
                      <span className="lab-col__deactivated-cnt">{deactivatedLabTestIds.length} inactive</span>
                    )}
                  </div>
                  <div className="lab-search-row">
                    <FiSearch size={12} />
                    <input type="text" placeholder="Search tests…" value={labTestSearch} onChange={e => setLabTestSearch(e.target.value)} />
                  </div>
                  <div className="lab-items-list">
                    {labItemsLoading
                      ? <div className="state-loading state-loading--sm"><div className="spin-sm" /></div>
                      : filteredTests.length === 0
                        ? <div className="state-empty state-empty--sm"><p>No tests found</p></div>
                        : filteredTests.map(t => {
                          const id         = t.id || t.testId;
                          const sel        = selectedTestIds.includes(id);
                          const frozen     = submittedLabTestIds.includes(id);
                          // BUG 2 FIX: detect deactivated items
                          const deactivated = deactivatedLabTestIds.includes(id);
                          const savedItem  = savedLabItems.find(s => (s.testId === id || s.testID === id));

                          return (
                            <label
                              key={id}
                              className={`lab-item ${frozen ? 'lab-item--frozen' : deactivated ? 'lab-item--deactivated' : sel ? 'lab-item--sel' : ''}`}
                              onClick={e => {
                                if (frozen && savedItem) {
                                  e.preventDefault();
                                  setConfirmRemoveLabId({ itemId: savedItem.itemId, name: getLabName(t) });
                                } else if (deactivated && savedItem) {
                                  // BUG 2 FIX: show re-activate popup instead of adding duplicate
                                  e.preventDefault();
                                  setReactivateConfirm({ itemId: savedItem.itemId, name: getLabName(t), testId: id, pkgId: 0 });
                                }
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={frozen || sel}
                                disabled={frozen || deactivated}
                                onChange={() => {
                                  if (!frozen && !deactivated) {
                                    setSelectedTestIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
                                  }
                                }}
                              />
                              <span className="lab-item__name">
                                {getLabName(t) || 'Unknown'}
                                {frozen && <span className="lab-item__saved-tag"><FiCheck size={8} /> Saved</span>}
                                {deactivated && <span className="lab-item__deact-tag"><FiX size={8} /> Inactive</span>}
                              </span>
                              {(t.fees || t.Fees) && <span className="lab-item__fee">₹{t.fees || t.Fees}</span>}
                              {frozen     && <span className="lab-item__remove-hint"><FiX size={9} /></span>}
                              {deactivated && <span className="lab-item__reactivate-hint"><FiRefreshCw size={9} /></span>}
                            </label>
                          );
                        })}
                  </div>
                </div>

                {/* Packages column */}
                <div className="lab-col">
                  <div className="lab-col__head">
                    <FiPackage size={12} /> Packages
                    {selectedPkgIds.filter(id => !submittedLabPkgIds.includes(id) && !deactivatedLabPkgIds.includes(id)).length > 0 && (
                      <span className="lab-col__cnt">
                        {selectedPkgIds.filter(id => !submittedLabPkgIds.includes(id) && !deactivatedLabPkgIds.includes(id)).length} selected
                      </span>
                    )}
                    {submittedLabPkgIds.length > 0 && (
                      <span className="lab-col__frozen-cnt">{submittedLabPkgIds.length} saved</span>
                    )}
                    {deactivatedLabPkgIds.length > 0 && (
                      <span className="lab-col__deactivated-cnt">{deactivatedLabPkgIds.length} inactive</span>
                    )}
                  </div>
                  <div className="lab-search-row">
                    <FiSearch size={12} />
                    <input type="text" placeholder="Search packages…" value={labPkgSearch} onChange={e => setLabPkgSearch(e.target.value)} />
                  </div>
                  <div className="lab-items-list">
                    {labItemsLoading
                      ? <div className="state-loading state-loading--sm"><div className="spin-sm" /></div>
                      : filteredPkgs.length === 0
                        ? <div className="state-empty state-empty--sm"><p>No packages found</p></div>
                        : filteredPkgs.map(p => {
                          const id          = p.id || p.packageId;
                          const sel         = selectedPkgIds.includes(id);
                          const frozen      = submittedLabPkgIds.includes(id);
                          // BUG 2 FIX: detect deactivated packages
                          const deactivated = deactivatedLabPkgIds.includes(id);
                          const savedItem   = savedLabItems.find(s => (s.packageId === id || s.packageID === id));

                          return (
                            <label
                              key={id}
                              className={`lab-item ${frozen ? 'lab-item--frozen' : deactivated ? 'lab-item--deactivated' : sel ? 'lab-item--sel' : ''}`}
                              onClick={e => {
                                if (frozen && savedItem) {
                                  e.preventDefault();
                                  setConfirmRemoveLabId({ itemId: savedItem.itemId, name: getPkgName(p) });
                                } else if (deactivated && savedItem) {
                                  // BUG 2 FIX: show re-activate popup instead of adding duplicate
                                  e.preventDefault();
                                  setReactivateConfirm({ itemId: savedItem.itemId, name: getPkgName(p), testId: 0, pkgId: id });
                                }
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={frozen || sel}
                                disabled={frozen || deactivated}
                                onChange={() => {
                                  if (!frozen && !deactivated) {
                                    setSelectedPkgIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
                                  }
                                }}
                              />
                              <span className="lab-item__name">
                                {getPkgName(p) || 'Unknown'}
                                {frozen && <span className="lab-item__saved-tag"><FiCheck size={8} /> Saved</span>}
                                {deactivated && <span className="lab-item__deact-tag"><FiX size={8} /> Inactive</span>}
                              </span>
                              {(p.fees || p.Fees) && <span className="lab-item__fee">₹{p.fees || p.Fees}</span>}
                              {frozen     && <span className="lab-item__remove-hint"><FiX size={9} /></span>}
                              {deactivated && <span className="lab-item__reactivate-hint"><FiRefreshCw size={9} /></span>}
                            </label>
                          );
                        })}
                  </div>
                </div>
              </div>

              <div className="lab-footer">
                <button className="lab-footer__cancel" onClick={() => setShowLabModal(false)}><FiX size={12} /> Cancel</button>
                <button className="lab-footer__save" onClick={handleStageAndSubmitLabOrder}>
                  <FiCheck size={13} />
                  {(() => {
                    const newTests = selectedTestIds.filter(id => !submittedLabTestIds.includes(id) && !deactivatedLabTestIds.includes(id)).length;
                    const newPkgs  = selectedPkgIds.filter(id => !submittedLabPkgIds.includes(id) && !deactivatedLabPkgIds.includes(id)).length;
                    const total    = newTests + newPkgs;
                    return total > 0
                      ? `${consultationId ? 'Submit' : 'Save'} ${total} Item${total !== 1 ? 's' : ''}`
                      : 'Done';
                  })()}
                </button>
              </div>

              {/* BUG 2 FIX: Re-activate confirm popup */}
              {reactivateConfirm && (
                <div className="lab-remove-confirm-overlay" onClick={() => setReactivateConfirm(null)}>
                  <div className="lab-remove-confirm lab-remove-confirm--reactivate" onClick={e => e.stopPropagation()}>
                    <div className="lab-remove-confirm__icon lab-remove-confirm__icon--green"><FiRefreshCw size={22} /></div>
                    <p className="lab-remove-confirm__title">Re-activate Lab Item?</p>
                    <p className="lab-remove-confirm__name">{reactivateConfirm.name}</p>
                    <p className="lab-remove-confirm__sub">This item is currently inactive. Re-activate it?</p>
                    <div className="lab-remove-confirm__btns">
                      <button
                        className="btn-confirm-reactivate"
                        onClick={handleReactivateLabItem}
                        disabled={reactivating}
                      >
                        {reactivating ? <span className="spin-sm" /> : <FiCheck size={12} />} Yes, Re-activate
                      </button>
                      <button className="btn-confirm-no" onClick={() => setReactivateConfirm(null)}>
                        <FiX size={11} /> Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Remove (deactivate) lab item confirm popup */}
              {confirmRemoveLabId && (
                <div className="lab-remove-confirm-overlay" onClick={() => setConfirmRemoveLabId(null)}>
                  <div className="lab-remove-confirm" onClick={e => e.stopPropagation()}>
                    <div className="lab-remove-confirm__icon"><FiAlertCircle size={22} /></div>
                    <p className="lab-remove-confirm__title">Remove Lab Item?</p>
                    <p className="lab-remove-confirm__name">{confirmRemoveLabId.name}</p>
                    <div className="lab-remove-confirm__btns">
                      <button
                        className="btn-confirm-yes"
                        onClick={() => handleRemoveLabItemFromModal(confirmRemoveLabId.itemId)}
                        disabled={removingLabItemId === confirmRemoveLabId.itemId}
                      >
                        {removingLabItemId === confirmRemoveLabId.itemId ? <span className="spin-sm" /> : <FiTrash2 size={12} />} Yes, Remove
                      </button>
                      <button className="btn-confirm-no" onClick={() => setConfirmRemoveLabId(null)}>
                        <FiX size={11} /> Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ HISTORY MODAL ═══ */}
        {showHistoryModal && (
          <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
            <div className="modal history-modal" onClick={e => e.stopPropagation()}>
              <div className="modal__head">
                <span><FiActivity size={14} /> Consultation History</span>
                <div className="modal__head-extra">
                  <div className="history-filters">
                    <label>From</label>
                    <input type="date" className="hist-date" value={historyFrom} onChange={e => setHistoryFrom(e.target.value)} />
                    <label>To</label>
                    <input type="date" className="hist-date" value={historyTo} onChange={e => setHistoryTo(e.target.value)} />
                    <button className="btn-icon" onClick={fetchPatientHistory}><FiRefreshCw size={12} className={historyLoading ? 'spinning' : ''} /></button>
                  </div>
                  <button className="modal__close" onClick={() => setShowHistoryModal(false)}><FiX size={16} /></button>
                </div>
              </div>

              <div className="history-body">
                {historyLoading ? (
                  <div className="state-loading"><div className="spinner-lg" /><p>Loading history…</p></div>
                ) : historyList.length === 0 ? (
                  <div className="state-empty"><div className="state-empty__icon"><FiActivity size={32} /></div><h4>No records found</h4></div>
                ) : (
                  <div className="history-table-wrap">
                    <table className="history-table">
                      <thead>
                        <tr><th>Date</th><th>Doctor</th><th>Reason / Symptoms</th><th>Vitals</th><th>Notes</th><th>Next Visit</th><th></th></tr>
                      </thead>
                      <tbody>
                        {historyList.map(h => (
                          <tr key={h.id}>
                            <td>
                              <div className="ht-date">
                                <span className="ht-date__main">{formatDate(h.dateCreated)}</span>
                                {h.visitTime && <span className="ht-date__time">{formatTime(h.visitTime)}</span>}
                              </div>
                            </td>
                            <td>
                              <div className="ht-doc">
                                <div className="ht-doc__av">{h.doctorFullName?.charAt(0) || 'D'}</div>
                                <span>{h.doctorFullName}</span>
                              </div>
                            </td>
                            <td>
                              {h.reason   && <span className="ht-tag ht-tag--reason">{h.reason}</span>}
                              {h.symptoms && <span className="ht-clamp">{h.symptoms}</span>}
                              {!h.reason && !h.symptoms && <span className="ht-na">—</span>}
                            </td>
                            <td>
                              <div className="vitals-row">
                                {h.bpReading   && <span className="vp vp--bp"><FiHeart size={9} /> {h.bpReading}</span>}
                                {h.temperature && <span className="vp vp--temp"><FiThermometer size={9} /> {h.temperature}°</span>}
                                {h.weight      && <span className="vp vp--wt"><FiTrendingUp size={9} /> {h.weight}kg</span>}
                                {!h.bpReading && !h.temperature && !h.weight && <span className="ht-na">—</span>}
                              </div>
                            </td>
                            <td>{h.consultationNotes ? <span className="ht-clamp">{h.consultationNotes}</span> : <span className="ht-na">—</span>}</td>
                            <td>{h.nextConsultationDate ? <span className="ht-tag ht-tag--next">{formatDate(h.nextConsultationDate)}</span> : <span className="ht-na">—</span>}</td>
                            <td><button className="btn-view" onClick={() => { setShowHistoryModal(false); fetchViewDetail(h.id); }}><FiEye size={11} /> View</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ DETAIL MODAL ═══ */}
        {showViewDetail && (
          <div className="modal-overlay">
            <div className="modal detail-modal">
              <div className="modal__head">
                <span><FiEye size={14} /> Consultation Details</span>
                <button className="modal__close" onClick={() => { setShowViewDetail(false); setViewDetail(null); }}><FiX size={16} /></button>
              </div>
              {viewDetailLoading ? (
                <div className="state-loading"><div className="spinner-lg" /><p>Loading…</p></div>
              ) : viewDetail ? (
                <div className="detail-body">
                  {viewDetail.consult && (
                    <div className="detail-section">
                      <div className="detail-section__head"><FiClipboard size={12} /> Consultation</div>
                      <div className="detail-grid">
                        <div className="detail-cell"><label>Date</label><span>{formatDate(viewDetail.consult.dateCreated)}</span></div>
                        <div className="detail-cell"><label>Doctor</label><span>{viewDetail.consult.doctorFullName}</span></div>
                        {viewDetail.consult.reason && <div className="detail-cell"><label>Reason</label><span>{viewDetail.consult.reason}</span></div>}
                        {viewDetail.consult.symptoms && <div className="detail-cell"><label>Symptoms</label><span>{viewDetail.consult.symptoms}</span></div>}
                        {viewDetail.consult.consultationNotes && <div className="detail-cell detail-cell--full"><label>Notes</label><span>{viewDetail.consult.consultationNotes}</span></div>}
                        {viewDetail.consult.treatmentPlan && <div className="detail-cell detail-cell--full"><label>Treatment Plan</label><span>{viewDetail.consult.treatmentPlan}</span></div>}
                        {(viewDetail.consult.bpReading || viewDetail.consult.temperature || viewDetail.consult.weight) && (
                          <div className="detail-cell detail-cell--full">
                            <label>Vitals</label>
                            <div className="vitals-row" style={{ marginTop: 4 }}>
                              {viewDetail.consult.bpReading   && <span className="vp vp--bp"><FiHeart size={9} /> {viewDetail.consult.bpReading}</span>}
                              {viewDetail.consult.temperature && <span className="vp vp--temp"><FiThermometer size={9} /> {viewDetail.consult.temperature}°</span>}
                              {viewDetail.consult.weight      && <span className="vp vp--wt"><FiTrendingUp size={9} /> {viewDetail.consult.weight}kg</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {viewDetail.prescItems?.length > 0 && (
                    <div className="detail-section">
                      <div className="detail-section__head"><FiFileText size={12} /> Prescription <span className="detail-section__count">{viewDetail.prescItems.length} item{viewDetail.prescItems.length > 1 ? 's' : ''}</span></div>
                      <table className="detail-table">
                        <thead><tr><th>Medicine</th><th>Dose</th><th>Frequency</th><th>Duration</th><th>Qty</th><th>Food</th></tr></thead>
                        <tbody>
                          {viewDetail.prescItems.map(item => (
                            <tr key={item.id}>
                              <td><strong>{item.medicineName}</strong>{item.strength && <em className="sub"> {item.strength}</em>}</td>
                              <td>{item.dosage || '—'}</td><td>{item.frequency || '—'}</td>
                              <td>{item.duration || '—'}</td><td>{item.quantity || '—'}</td>
                              <td>{item.foodTimingDesc || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {viewDetail.labOrders?.length > 0 && (
                    <div className="detail-section">
                      <div className="detail-section__head">
                        <FiActivity size={12} /> Lab Order
                        <span className={`priority-tag priority-tag--${viewDetail.labOrders[0].priority}`}>{viewDetail.labOrders[0].priorityDesc}</span>
                      </div>
                      {viewDetail.labItems?.length > 0 ? (
                        <table className="detail-table">
                          <thead><tr><th>Test / Package</th><th>Fees</th><th>CGST</th><th>SGST</th><th>Total</th><th>Status</th></tr></thead>
                          <tbody>
                            {viewDetail.labItems.map(item => (
                              <tr key={item.itemId}>
                                <td><strong>{item.testOrPackageName}</strong></td>
                                <td>₹{item.fees?.toFixed(2) || '0.00'}</td>
                                <td>₹{item.cgst?.toFixed(2) || '0.00'}</td>
                                <td>₹{item.sgst?.toFixed(2) || '0.00'}</td>
                                <td><strong>₹{item.totalAmount?.toFixed(2) || '0.00'}</strong></td>
                                <td><span className={`status-tag ${item.status === 1 ? 'status-tag--on' : ''}`}>{item.status === 1 ? 'Active' : 'Inactive'}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : <p className="detail-empty">No lab items found</p>}
                    </div>
                  )}
                  {(!viewDetail.prescItems?.length && !viewDetail.labOrders?.length) && (
                    <div className="state-empty"><p>No additional details</p></div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
};

export default AddConsultation;