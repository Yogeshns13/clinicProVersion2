// src/components/ViewConsultation.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiX, FiCalendar, FiCheck, FiSearch, FiChevronDown,
  FiUser, FiArrowLeft, FiPlus, FiFileText, FiPackage,
  FiActivity, FiEye, FiEdit3, FiAlertCircle,
  FiZap, FiClock, FiRefreshCw, FiChevronUp, FiHeart,
  FiThermometer, FiTrendingUp, FiTrash2, FiMenu,
  FiClipboard, FiDroplet, FiCheckCircle, FiSave, FiUsers,
  FiSend, FiFlag,
} from 'react-icons/fi';
import { getPatientsList } from '../Api/Api.js';
import { updateConsultation, getConsultationList } from '../Api/ApiConsultation.js';
import {
  getMedicineMasterList, getPrescriptionList, getPrescriptionDetailList,
  addPrescription, addPrescriptionDetail, updatePrescriptionDetail, deletePrescriptionDetail,
} from '../Api/ApiPharmacy.js';
import {
  addLabTestOrder, addLabTestOrderItem, getLabTestMasterList,
  getLabTestPackageList, getLabTestOrderList, getLabTestOrderItemList,
  updateLabTestOrderItem, deleteLabTestOrder,
} from '../Api/ApiLabTests.js';
import './ViewConsultation.css';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';
import { FaClinicMedical } from 'react-icons/fa';

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
const buildFrequency  = (timings) => timings.length ? timings.join('|') : '';
const calcQuantity    = (days, timings) => { const d = parseInt(days) || 0; return d > 0 && timings.length > 0 ? d * timings.length : 0; };
const getDoseDefault  = (m) => { if (!m) return ''; const c = m.doseCount; if (!c || c <= 0) return ''; return `${c}${(TYPE_NAMES[m.type] || m.typeDesc) ? ' ' + (TYPE_NAMES[m.type] || m.typeDesc) : ''}`.trim(); };
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
// clinicId / branchId props removed — component fetches its own fresh IDs
const SavedMedicineCard = ({ item, onUpdated, onDeleted, onError }) => {
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
    // Always fetch fresh IDs to guarantee correct values
    const clinicId = await getStoredClinicId();
    const branchId = await getStoredBranchId();
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
          <button type="button" className="saved-item-card__toggle" onClick={() => setExpanded(p => !p)}>
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

/* ─── SavedLabSection (inside Lab Modal) ────────── */
// clinicId / branchId props removed — component fetches its own fresh IDs
const SavedLabSection = ({ labItems, labPriorityDesc, onItemStatusChange, onError }) => {
  const [togglingId, setTogglingId] = useState(null);

  const handleToggleItem = async (itemId, currentStatus) => {
    try {
      setTogglingId(itemId);
      // Always fetch fresh IDs to guarantee correct values
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const newStatus = currentStatus === 1 ? 2 : 1;
      await updateLabTestOrderItem({ itemId, clinicId, branchId, status: newStatus });
      onItemStatusChange(itemId, newStatus);
    } catch (err) {
      onError(err);
    } finally {
      setTogglingId(null);
    }
  };

  if (!labItems || labItems.length === 0) return null;

  return (
    <div className="modal-lab-saved-section">
      <div className="modal-lab-saved-section__head">
        <div className="modal-lab-saved-section__title">
          <FiCheckCircle size={12} />
          <span>Saved Lab Items</span>
          {labPriorityDesc && <span className="priority-tag priority-tag--saved">{labPriorityDesc}</span>}
          <span className="modal-lab-saved-section__count">{labItems.length} item{labItems.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <div className="modal-lab-saved-section__items">
        {labItems.map(item => {
          const isActive   = item.status === 1;
          const isInactive = item.status !== 1;
          return (
            <div key={item.itemId} className={`saved-lab-item ${isInactive ? 'saved-lab-item--inactive' : ''}`}>
              <div className="saved-lab-item__info">
                <span className="saved-lab-item__name">{item.testOrPackageName}</span>
                {isActive && item.totalAmount > 0 && (
                  <span className="saved-lab-item__fee">₹{item.totalAmount?.toFixed(2)}</span>
                )}
              </div>
              <div className="saved-lab-item__status">
                {isActive ? (
                  <button
                    className="btn-toggle-lab btn-toggle-lab--deactivate"
                    onClick={() => handleToggleItem(item.itemId, item.status)}
                    disabled={togglingId === item.itemId}
                  >
                    {togglingId === item.itemId
                      ? <span className="spin-sm" />
                      : <><FiTrash2 size={11} /> Delete</>
                    }
                  </button>
                ) : (
                  <button
                    className="btn-toggle-lab btn-toggle-lab--activate"
                    onClick={() => handleToggleItem(item.itemId, item.status)}
                    disabled={togglingId === item.itemId}
                  >
                    {togglingId === item.itemId
                      ? <span className="spin-sm" />
                      : <><FiCheck size={11} /> Add Again</>
                    }
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── ErrorPopup ─────────────────────────────────── */
const ErrorPopup = ({ message, onClose }) => {
  if (!message) return null;
  return (
    <div className="error-popup-overlay" onClick={onClose}>
      <div className="error-popup" onClick={e => e.stopPropagation()}>
        <div className="error-popup__icon">
          <FiAlertCircle size={28} />
        </div>
        <p className="error-popup__title">Something went wrong</p>
        <p className="error-popup__msg">{message}</p>
        <button className="error-popup__btn" onClick={onClose}>
          <FiCheck size={14} /> OK
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   MAIN — ViewConsultation
   ═══════════════════════════════════════════════════ */
const ViewConsultation = ({ consultationId: propConsultationId, isOpen, onClose }) => {

  const { id: paramId } = useParams();
  const navigate        = useNavigate();

  const routeId         = paramId ? Number(paramId) : null;
  const isRoutePage     = !!routeId;
  const activeConsultId = routeId ?? propConsultationId;
  const activeIsOpen    = isRoutePage ? true : !!isOpen;

  /* ── Bootstrap / consultation data ── */
  const [consultation, setConsultation]   = useState(null);
  const [loading, setLoading]             = useState(false);

  /* ── Panel 1: editable consultation fields ── */
  const [consultationNotes, setConsultationNotes]       = useState('');
  const [treatmentPlan, setTreatmentPlan]               = useState('');
  const [nextConsultationDate, setNextConsultationDate] = useState('');
  const [savedNotes, setSavedNotes]                     = useState('');
  const [savedPlan, setSavedPlan]                       = useState('');
  const [savedNextDate, setSavedNextDate]               = useState('');
  const [updatingConsult, setUpdatingConsult]           = useState(false);

  /* ── Panel 2: prescription ── */
  const [prescriptionId, setPrescriptionId]           = useState(null);
  const [savedPrescItems, setSavedPrescItems]         = useState([]);
  const [containers, setContainers]                   = useState([]);
  const [submittedContainerIds, setSubmittedContainerIds] = useState(new Set());
  const [confirmedSuccess, setConfirmedSuccess]       = useState(false);
  const [isDragOver, setIsDragOver]                   = useState(false);
  const [allMedicines, setAllMedicines]               = useState([]);
  const [filteredMedicines, setFilteredMedicines]     = useState([]);
  const [searchQuery, setSearchQuery]                 = useState('');
  const [loadingMeds, setLoadingMeds]                 = useState(false);
  const [selectedMedIds, setSelectedMedIds]           = useState([]);
  const dragMedIdRef = useRef(null);

  /* ── Lab modal ── */
  const [showLabModal, setShowLabModal]                 = useState(false);
  const [labPriority, setLabPriority]                   = useState(1);
  const [labOrderId, setLabOrderId]                     = useState(null);
  const [labMasterItems, setLabMasterItems]             = useState([]);
  const [labPackages, setLabPackages]                   = useState([]);
  const [selectedTestIds, setSelectedTestIds]           = useState([]);
  const [selectedPkgIds, setSelectedPkgIds]             = useState([]);
  const [labItemsLoading, setLabItemsLoading]           = useState(false);
  const [labTestSearch, setLabTestSearch]               = useState('');
  const [labPkgSearch, setLabPkgSearch]                 = useState('');
  const [stagedLabPriority, setStagedLabPriority]       = useState(1);
  const [stagedLabTestIds, setStagedLabTestIds]         = useState([]);
  const [stagedLabPkgIds, setStagedLabPkgIds]           = useState([]);
  const [submittedLabTestIds, setSubmittedLabTestIds]   = useState([]);
  const [submittedLabPkgIds, setSubmittedLabPkgIds]     = useState([]);
  const [savedLabItems, setSavedLabItems]               = useState([]);
  const [savedLabPriorityDesc, setSavedLabPriorityDesc] = useState('');
  const [deactivatedLabTestIds, setDeactivatedLabTestIds] = useState([]);
  const [deactivatedLabPkgIds, setDeactivatedLabPkgIds]   = useState([]);
  const [reactivateConfirm, setReactivateConfirm]       = useState(null);
  const [reactivating, setReactivating]                 = useState(false);
  const [removingLabItemId, setRemovingLabItemId]       = useState(null);
  const [confirmRemoveLabId, setConfirmRemoveLabId]     = useState(null);
  const [confirmDelOrder, setConfirmDelOrder]           = useState(false);
  const [deletingOrder, setDeletingOrder]               = useState(false);

  /* ── Patient modal ── */
  const [showPatientModal, setShowPatientModal]         = useState(false);
  const [patientDetails, setPatientDetails]             = useState(null);
  const [loadingPatient, setLoadingPatient]             = useState(false);
  const [familyPatientData, setFamilyPatientData]       = useState(null);
  const [loadingFamilyData, setLoadingFamilyData]       = useState(false);
  const [showFamilyModal, setShowFamilyModal]           = useState(false);
  const [familyPatientDetails, setFamilyPatientDetails] = useState(null);

  /* ── Misc ── */
  const [submitProgress, setSubmitProgress]   = useState(null);
  const [isFinished, setIsFinished]           = useState(false);
  const [error, setError]                     = useState(null);

  // ── Clinic / Branch IDs — loaded once when the view opens ──
  // Stored in state so every render has the correct resolved values
  // (avoids passing a Promise or 0 to child components / API calls).
  const [clinicId, setClinicId] = useState(null);
  const [branchId, setBranchId] = useState(null);

  // Load IDs as soon as the view becomes active
  useEffect(() => {
    if (!activeIsOpen) return;
    (async () => {
      const cId = await getStoredClinicId();
      const bId = await getStoredBranchId();
      setClinicId(cId);
      setBranchId(bId);
    })();
  }, [activeIsOpen]);

  // ── Central helper: always returns fresh, resolved IDs and keeps state in sync ──
  const getIds = async () => {
    const cId = await getStoredClinicId();
    const bId = await getStoredBranchId();
    setClinicId(cId);
    setBranchId(bId);
    return { clinicId: cId, branchId: bId };
  };

  /* ─────────────────────────────────────────────── */

  useEffect(() => {
    if (activeIsOpen) document.body.classList.add('consultation-open');
    else              document.body.classList.remove('consultation-open');
    return () => document.body.classList.remove('consultation-open');
  }, [activeIsOpen]);

  useEffect(() => {
    if (activeIsOpen && activeConsultId) loadAll(activeConsultId);
  }, [isOpen, propConsultationId]);

  /* ── Derived: pending new items ── */
  const pendingContainerCount = containers.filter(c => !submittedContainerIds.has(c.tempId)).length;
  const stagedLabCount        = stagedLabTestIds.length + stagedLabPkgIds.length;
  const hasAnythingNew        = pendingContainerCount > 0 || stagedLabCount > 0;
  const consultDataChanged    = (
    consultationNotes !== savedNotes ||
    treatmentPlan     !== savedPlan  ||
    nextConsultationDate !== savedNextDate
  );

  useEffect(() => {
    if (isFinished && hasAnythingNew) setIsFinished(false);
  }, [hasAnythingNew]);

  /* ── Load everything ── */
  const loadAll = async (consultId) => {
    try {
      setLoading(true); setError(null);
      const { clinicId, branchId } = await getIds();

      const [consultList, prescList, labOrders] = await Promise.all([
        getConsultationList(clinicId, { ConsultationID: consultId, BranchID: branchId, Page: 1, PageSize: 1 }),
        getPrescriptionList(clinicId, { ConsultationID: consultId, BranchID: branchId, Page: 1, PageSize: 5 }),
        getLabTestOrderList(clinicId, { ConsultationID: consultId, BranchID: branchId, Page: 1, PageSize: 10 }),
      ]);

      const c = consultList?.[0] || null;
      if (!c) { setError({ message: 'Consultation not found' }); return; }

      setConsultation(c);
      setConsultationNotes(c.consultationNotes || '');
      setTreatmentPlan(c.treatmentPlan || '');
      setNextConsultationDate(c.nextConsultationDate ? c.nextConsultationDate.split('T')[0] : '');
      setSavedNotes(c.consultationNotes || '');
      setSavedPlan(c.treatmentPlan || '');
      setSavedNextDate(c.nextConsultationDate ? c.nextConsultationDate.split('T')[0] : '');

      const presc = prescList?.[0] || null;
      if (presc?.id) {
        setPrescriptionId(presc.id);
        const details = await getPrescriptionDetailList(clinicId, { PrescriptionID: presc.id, BranchID: branchId, Page: 1, PageSize: 50 });
        setSavedPrescItems((details || []).filter(i => i.status === 1));
        if ((details || []).filter(i => i.status === 1).length > 0) setConfirmedSuccess(true);
      }

      if (labOrders?.length > 0) {
        const order = labOrders[0];
        setLabOrderId(order.id);
        setSavedLabPriorityDesc(PRIORITY_OPTIONS.find(p => p.id === order.priority)?.label || '');
        setLabPriority(order.priority || 1);
        setStagedLabPriority(order.priority || 1);
        const items = await getLabTestOrderItemList(clinicId, { OrderID: order.id, BranchID: branchId, Page: 1, PageSize: 50 });
        const active = (items || []).filter(i => i.status === 1);
        const deact  = (items || []).filter(i => i.status !== 1);
        setSavedLabItems(items || []);
        setSubmittedLabTestIds(active.filter(i => i.testId).map(i => i.testId));
        setSubmittedLabPkgIds(active.filter(i => i.packageId).map(i => i.packageId));
        setSelectedTestIds(active.filter(i => i.testId).map(i => i.testId));
        setSelectedPkgIds(active.filter(i => i.packageId).map(i => i.packageId));
        setDeactivatedLabTestIds(deact.filter(i => i.testId).map(i => i.testId));
        setDeactivatedLabPkgIds(deact.filter(i => i.packageId).map(i => i.packageId));
      }

      fetchMedicines();
      if (c.patientId) fetchPatientDetails(c.patientId);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      setLoadingMeds(true);
      const { clinicId, branchId } = await getIds();
      const meds = await getMedicineMasterList(clinicId, { BranchID: branchId, PageSize: 200, Status: 1 });
      setAllMedicines(meds); setFilteredMedicines(meds);
    } catch (err) { console.error(err); } finally { setLoadingMeds(false); }
  };

  const fetchPatientDetails = async (patientId) => {
    try {
      setLoadingPatient(true); setFamilyPatientData(null);
      const { clinicId, branchId } = await getIds();
      const pts = await getPatientsList(clinicId, { Page: 1, PageSize: 1, BranchID: branchId, PatientID: patientId, Status: 1 });
      const pt = pts?.[0] || null;
      setPatientDetails(pt);
      if (pt?.familyPatientId) fetchFamilyPatientData(pt.familyPatientId, clinicId, branchId);
    } catch (err) { console.error(err); } finally { setLoadingPatient(false); }
  };

  const fetchFamilyPatientData = async (familyPatientId, clinicId, branchId) => {
    try {
      setLoadingFamilyData(true);
      const pts = await getPatientsList(clinicId, { Page: 1, PageSize: 1, BranchID: branchId, PatientID: familyPatientId, Status: 1 });
      setFamilyPatientData(pts?.[0] || null);
    } catch (err) { console.error(err); } finally { setLoadingFamilyData(false); }
  };

  const fetchLabItems = async () => {
    try {
      setLabItemsLoading(true);
      const { clinicId, branchId } = await getIds();
      const [masters, pkgs] = await Promise.all([
        getLabTestMasterList(clinicId, { BranchID: branchId, PageSize: 200, Status: 1 }),
        getLabTestPackageList(clinicId, { BranchID: branchId, PageSize: 100, Status: 1 }),
      ]);
      setLabMasterItems(masters || []); setLabPackages(pkgs || []);
    } catch (err) { console.error(err); } finally { setLabItemsLoading(false); }
  };

  /* ── Consultation update ── */
  const handleInlineUpdateConsult = async () => {
    if (!consultationNotes.trim()) { setError({ message: 'Consultation Notes are required.' }); return; }
    const consultId = consultation?.consultationId ?? consultation?.id ?? activeConsultId;
    if (!consultId) return;
    try {
      setUpdatingConsult(true); setError(null);
      const { clinicId, branchId } = await getIds();
      await updateConsultation({
        consultationId: consultId, clinicId, branchId,
        reason: consultation.reason || '',
        symptoms: consultation.symptoms || '',
        bpSystolic:  consultation.bpSystolic  ?? 0,
        bpDiastolic: consultation.bpDiastolic ?? 0,
        temperature: consultation.temperature ?? 0,
        weight:      consultation.weight      ?? 0,
        emrNotes: '', ehrNotes: '', instructions: '',
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

  /* ── Prescription helpers ── */
  const updateContainer   = (tid, ch) => setContainers(prev => prev.map(c => c.tempId === tid ? { ...c, ...ch } : c));
  const removeContainer   = (tid)      => setContainers(prev => prev.filter(c => c.tempId !== tid));

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

  /* ── Submit prescription details ── */
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
      setSavedPrescItems((items2 || []).filter(i => i.status === 1));
      setContainers(prev => prev.filter(c => !items.some(i => i.tempId === c.tempId)));
      setSubmittedContainerIds(new Set());
    } catch (e) { console.error(e); }
  };

  /* ── Submit lab items ── */
  const submitLabItems = async (clinicId, branchId, orderId, testIds, pkgIds, labOrder) => {
    for (const testId of testIds) {
      await addLabTestOrderItem({ clinicId, branchId, OrderID: orderId, PatientID: consultation.patientId, DoctorID: consultation.doctorId, TestID: testId, PackageID: 0 });
    }
    for (const pkgId of pkgIds) {
      await addLabTestOrderItem({ clinicId, branchId, OrderID: orderId, PatientID: consultation.patientId, DoctorID: consultation.doctorId, TestID: 0, PackageID: pkgId });
    }
    setSubmittedLabTestIds(prev => [...new Set([...prev, ...testIds])]);
    setSubmittedLabPkgIds(prev => [...new Set([...prev, ...pkgIds])]);
    setDeactivatedLabTestIds(prev => prev.filter(id => !testIds.includes(id)));
    setDeactivatedLabPkgIds(prev => prev.filter(id => !pkgIds.includes(id)));
    try {
      const items = await getLabTestOrderItemList(clinicId, { OrderID: orderId, BranchID: branchId, Page: 1, PageSize: 50 });
      setSavedLabItems(items || []);
      if (labOrder?.priorityDesc) setSavedLabPriorityDesc(labOrder.priorityDesc);
    } catch (e) { console.error(e); }
  };

  /* ── Lab modal open ── */
  const handleOpenLabModal = () => {
    setLabPriority(stagedLabPriority);
    setSelectedTestIds([...new Set([...stagedLabTestIds, ...submittedLabTestIds])]);
    setSelectedPkgIds([...new Set([...stagedLabPkgIds, ...submittedLabPkgIds])]);
    setLabTestSearch(''); setLabPkgSearch('');
    setReactivateConfirm(null);
    setConfirmDelOrder(false);
    setShowLabModal(true);
    if (!labMasterItems.length && !labPackages.length) fetchLabItems();
  };

  /* ── Stage and submit lab order (from modal) ── */
  const handleStageAndSubmitLabOrder = async () => {
    const newTestIds = selectedTestIds.filter(id => !submittedLabTestIds.includes(id) && !deactivatedLabTestIds.includes(id));
    const newPkgIds  = selectedPkgIds.filter(id => !submittedLabPkgIds.includes(id) && !deactivatedLabPkgIds.includes(id));

    if (newTestIds.length === 0 && newPkgIds.length === 0) { setShowLabModal(false); return; }

    const { clinicId, branchId } = await getIds();
    setShowLabModal(false); setError(null);

    const steps = [];
    if (!labOrderId) steps.push({ label: 'Creating lab order' });
    steps.push({ label: `Adding ${newTestIds.length + newPkgIds.length} lab item(s)` });
    setSubmitProgress({ steps, currentStep: 0, done: false });

    try {
      let s = 0;
      let activeLabOrderId = labOrderId;

      if (!activeLabOrderId) {
        setSubmitProgress(p => ({ ...p, currentStep: s }));
        const lr = await addLabTestOrder({
          clinicId, branchId,
          ConsultationID: activeConsultId,
          VisitID:   consultation.visitId,
          PatientID: consultation.patientId,
          doctorId:  consultation.doctorId,
          priority:  labPriority,
          Notes:     consultationNotes,
        });
        if (!lr.success) throw new Error('Failed to create lab order');
        activeLabOrderId = lr.orderId;
        setLabOrderId(lr.orderId);
        s++;
      }

      setSubmitProgress(p => ({ ...p, currentStep: s }));
      await submitLabItems(
        clinicId, branchId,
        activeLabOrderId,
        newTestIds, newPkgIds,
        { priorityDesc: PRIORITY_OPTIONS.find(p => p.id === labPriority)?.label },
      );

      setStagedLabTestIds([]); setStagedLabPkgIds([]);
      setSubmitProgress(p => ({ ...p, done: true }));
      setIsFinished(true);
      setTimeout(() => setSubmitProgress(null), 2500);
    } catch (err) {
      setError(err); setSubmitProgress(null);
    }
  };

  /* ── Main submit (prescription + optional lab) ── */
  const handleFinalSubmit = async () => {
    if (!consultationNotes.trim()) { setError({ message: 'Consultation Notes are required.' }); return; }

    const pendingContainers = containers.filter(c => !submittedContainerIds.has(c.tempId));
    for (const c of pendingContainers) {
      if (!c.medicineName.trim())  { setError({ message: 'All medicines need a name.' }); return; }
      if (!c.dosePerIntake.trim()) { setError({ message: `Dose required for "${c.medicineName}".` }); return; }
      if (c.quantity <= 0)         { setError({ message: `Quantity > 0 required for "${c.medicineName}".` }); return; }
    }

    const { clinicId, branchId } = await getIds();
    const consultId = consultation?.consultationId ?? consultation?.id ?? activeConsultId;

    const newTestIds      = stagedLabTestIds.filter(id => !submittedLabTestIds.includes(id));
    const newPkgIds       = stagedLabPkgIds.filter(id => !submittedLabPkgIds.includes(id));
    const hasNewMeds      = pendingContainers.length > 0;
    const hasNewLab       = newTestIds.length > 0 || newPkgIds.length > 0;
    const needNewPresc    = hasNewMeds && prescriptionId === null;
    const needAddDetails  = hasNewMeds && prescriptionId !== null;
    const needNewLabOrder = hasNewLab  && labOrderId === null;
    const needAddLabItems = hasNewLab  && labOrderId !== null;
    const notesChanged    = consultDataChanged;

    const steps = [];
    if (notesChanged)    steps.push({ label: 'Updating consultation notes' });
    if (needNewPresc)    { steps.push({ label: 'Creating prescription' }); steps.push({ label: `Adding ${pendingContainers.length} medicine(s)` }); }
    if (needAddDetails)  steps.push({ label: `Adding ${pendingContainers.length} medicine(s)` });
    if (needNewLabOrder) { steps.push({ label: 'Creating lab order' }); steps.push({ label: `Adding ${newTestIds.length + newPkgIds.length} lab item(s)` }); }
    if (needAddLabItems) steps.push({ label: `Adding ${newTestIds.length + newPkgIds.length} more lab item(s)` });

    if (steps.length === 0) { setError({ message: 'Nothing new to submit.' }); return; }

    setSubmitProgress({ steps, currentStep: 0, done: false }); setError(null);

    try {
      let s = 0;

      if (notesChanged) {
        setSubmitProgress(p => ({ ...p, currentStep: s }));
        await updateConsultation({
          consultationId: consultId, clinicId,
          reason: consultation?.reason || '', symptoms: consultation?.symptoms || '',
          bpSystolic: consultation?.bpSystolic ?? 0, bpDiastolic: consultation?.bpDiastolic ?? 0,
          temperature: consultation?.temperature ?? 0, weight: consultation?.weight ?? 0,
          emrNotes: '', ehrNotes: '', instructions: '',
          consultationNotes: consultationNotes.trim(),
          nextConsultationDate: nextConsultationDate || '',
          treatmentPlan: treatmentPlan.trim(),
        });
        setSavedNotes(consultationNotes); setSavedPlan(treatmentPlan); setSavedNextDate(nextConsultationDate);
        s++;
      }

      if (needNewPresc) {
        setSubmitProgress(p => ({ ...p, currentStep: s }));
        const d = (await getConsultationList(clinicId, { Page: 1, PageSize: 1, BranchID: branchId, ConsultationID: consultId }))?.[0];
        const pr = await addPrescription({
          clinicId, branchId, ConsultationID: consultId,
          VisitID: d?.visitId ?? consultation.visitId, PatientID: d?.patientId ?? consultation.patientId,
          DoctorID: d?.doctorId ?? consultation.doctorId, DateIssued: today(), ValidUntil: thirtyDaysLater(),
          Diagnosis: null, Notes: d?.consultationNotes || null, IsRepeat: 0, RepeatCount: 0,
          CreatedBy: d?.doctorId ?? consultation.doctorId,
        });
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
        const lr = await addLabTestOrder({
          clinicId, branchId, ConsultationID: consultId,
          VisitID: consultation.visitId, PatientID: consultation.patientId,
          doctorId: consultation.doctorId, priority: stagedLabPriority, Notes: consultationNotes,
        });
        if (!lr.success) throw new Error('Failed to create lab order');
        setLabOrderId(lr.orderId); s++;
        setSubmitProgress(p => ({ ...p, currentStep: s }));
        await submitLabItems(clinicId, branchId, lr.orderId, newTestIds, newPkgIds,
          { priorityDesc: PRIORITY_OPTIONS.find(p => p.id === stagedLabPriority)?.label }); s++;
      }

      if (needAddLabItems) {
        setSubmitProgress(p => ({ ...p, currentStep: s }));
        await submitLabItems(clinicId, branchId, labOrderId, newTestIds, newPkgIds); s++;
      }

      setStagedLabTestIds([]); setStagedLabPkgIds([]);
      setSubmitProgress(p => ({ ...p, done: true }));
      setIsFinished(true);
      setTimeout(() => setSubmitProgress(null), 2500);
    } catch (err) { setError(err); setSubmitProgress(null); }
  };

  /* ── Reactivate lab item ── */
  const handleReactivateLabItem = async () => {
    if (!reactivateConfirm) return;
    const { itemId, testId, pkgId } = reactivateConfirm;
    try {
      setReactivating(true);
      const { clinicId, branchId } = await getIds();
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
    } catch (err) { setError(err); }
    finally { setReactivating(false); setReactivateConfirm(null); }
  };

  /* ── Remove lab item from modal ── */
  const handleRemoveLabItemFromModal = async (itemId) => {
    try {
      setRemovingLabItemId(itemId);
      const { clinicId, branchId } = await getIds();
      await updateLabTestOrderItem({ itemId, clinicId, branchId, status: 2 });
      const savedItem = savedLabItems.find(s => s.itemId === itemId);
      setSavedLabItems(prev => prev.map(i => i.itemId === itemId ? { ...i, status: 2 } : i));
      if (savedItem?.testId)    { setSubmittedLabTestIds(prev => prev.filter(id => id !== savedItem.testId)); setSelectedTestIds(prev => prev.filter(id => id !== savedItem.testId)); setDeactivatedLabTestIds(prev => [...new Set([...prev, savedItem.testId])]); }
      if (savedItem?.packageId) { setSubmittedLabPkgIds(prev => prev.filter(id => id !== savedItem.packageId)); setSelectedPkgIds(prev => prev.filter(id => id !== savedItem.packageId)); setDeactivatedLabPkgIds(prev => [...new Set([...prev, savedItem.packageId])]); }
      setConfirmRemoveLabId(null);
    } catch (err) { setError(err); }
    finally { setRemovingLabItemId(null); }
  };

  /* ── Delete entire lab order ── */
  const handleDeleteLabOrder = async () => {
    try {
      setDeletingOrder(true);
      await deleteLabTestOrder(labOrderId);
      handleLabOrderDeleted();
      setConfirmDelOrder(false);
      setShowLabModal(false);
    } catch (err) { setError(err); }
    finally { setDeletingOrder(false); }
  };

  const handleLabOrderDeleted = () => {
    setSavedLabItems([]); setLabOrderId(null);
    setSubmittedLabTestIds([]); setSubmittedLabPkgIds([]);
    setDeactivatedLabTestIds([]); setDeactivatedLabPkgIds([]);
    setStagedLabTestIds([]); setStagedLabPkgIds([]);
    setSelectedTestIds([]); setSelectedPkgIds([]);
  };

  const handleLabItemStatusChange = (itemId, newStatus) => {
    setSavedLabItems(prev => prev.map(item => item.itemId === itemId ? { ...item, status: newStatus } : item));
    const changedItem = savedLabItems.find(item => item.itemId === itemId);
    if (!changedItem) return;
    const isActive = newStatus === 1;
    const testId   = changedItem.testId   ?? changedItem.testID   ?? 0;
    const pkgId    = changedItem.packageId ?? changedItem.packageID ?? 0;
    if (testId) {
      if (isActive) { setSubmittedLabTestIds(prev => [...new Set([...prev, testId])]); setSelectedTestIds(prev => [...new Set([...prev, testId])]); setDeactivatedLabTestIds(prev => prev.filter(id => id !== testId)); }
      else          { setSubmittedLabTestIds(prev => prev.filter(id => id !== testId)); setSelectedTestIds(prev => prev.filter(id => id !== testId)); setDeactivatedLabTestIds(prev => [...new Set([...prev, testId])]); }
    }
    if (pkgId) {
      if (isActive) { setSubmittedLabPkgIds(prev => [...new Set([...prev, pkgId])]); setSelectedPkgIds(prev => [...new Set([...prev, pkgId])]); setDeactivatedLabPkgIds(prev => prev.filter(id => id !== pkgId)); }
      else          { setSubmittedLabPkgIds(prev => prev.filter(id => id !== pkgId)); setSelectedPkgIds(prev => prev.filter(id => id !== pkgId)); setDeactivatedLabPkgIds(prev => [...new Set([...prev, pkgId])]); }
    }
  };

  const handlePrescItemUpdated = (detailId, updatedLocal) => {
    setSavedPrescItems(prev => prev.map(item =>
      item.id === detailId
        ? { ...item, dosage: updatedLocal.dosePerIntake, frequency: buildFrequency(updatedLocal.timings), duration: updatedLocal.days ? `${updatedLocal.days} Days` : '', quantity: updatedLocal.quantity, instructions: updatedLocal.notes, foodTiming: updatedLocal.foodTiming }
        : item
    ));
  };

  const handlePrescItemDeleted = (detailId) => {
    setSavedPrescItems(prev => prev.filter(item => item.id !== detailId));
  };

  const handleClose = () => {
    setConsultation(null); setLoading(false);
    setConsultationNotes(''); setTreatmentPlan(''); setNextConsultationDate('');
    setSavedNotes(''); setSavedPlan(''); setSavedNextDate('');
    setPrescriptionId(null); setSavedPrescItems([]); setContainers([]);
    setSubmittedContainerIds(new Set()); setConfirmedSuccess(false);
    setAllMedicines([]); setFilteredMedicines([]); setSearchQuery(''); setSelectedMedIds([]);
    setLabOrderId(null); setSavedLabItems([]); setSavedLabPriorityDesc('');
    setShowLabModal(false); setLabMasterItems([]); setLabPackages([]);
    setStagedLabPriority(1); setStagedLabTestIds([]); setStagedLabPkgIds([]);
    setSubmittedLabTestIds([]); setSubmittedLabPkgIds([]);
    setDeactivatedLabTestIds([]); setDeactivatedLabPkgIds([]);
    setSelectedTestIds([]); setSelectedPkgIds([]);
    setReactivateConfirm(null); setConfirmRemoveLabId(null);
    setPatientDetails(null); setFamilyPatientData(null);
    setShowPatientModal(false); setShowFamilyModal(false); setFamilyPatientDetails(null);
    setSubmitProgress(null); setError(null); setIsFinished(false);
    setIsDragOver(false); setConfirmDelOrder(false); setDeletingOrder(false);
    if (isRoutePage) navigate(-1);
    else if (onClose) onClose();
  };

  if (!activeIsOpen) return null;

  /* ── Derived helpers ── */
  const getLabName = (t) => t?.name || t?.testName || t?.test_name || t?.TestName || t?.test_title || t?.title || '';
  const getPkgName = (p) => p?.name || p?.packageName || p?.package_name || p?.PackageName || p?.packageTitle || p?.package_title || p?.title || p?.label || p?.description || p?.package_desc || p?.PackageDesc || Object.values(p).find(v => typeof v === 'string' && v.length > 1 && !/^[0-9]/.test(v)) || '';

  const filteredTests = labMasterItems.filter(t => !labTestSearch || getLabName(t).toLowerCase().includes(labTestSearch.toLowerCase()));
  const filteredPkgs  = labPackages.filter(p => !labPkgSearch || getPkgName(p).toLowerCase().includes(labPkgSearch.toLowerCase()));

  const totalPrescCount = savedPrescItems.length + pendingContainerCount;

  const submitBtnLabel = () => {
    const parts = [];
    if (pendingContainerCount > 0) parts.push(`${pendingContainerCount} med${pendingContainerCount > 1 ? 's' : ''}`);
    if (stagedLabCount > 0) parts.push(`${stagedLabCount} lab`);
    return parts.join(' · ');
  };

  const footerBtnIsFinish = isFinished && !hasAnythingNew && !consultDataChanged;

  const shell = (
    <div className="ac-overlay">
      <div className="ac-shell">

        {/* ── HEADER ── */}
        <header className="ac-header">
          <div className="ac-header__left">
            {isRoutePage && (
              <button className="btn-back" onClick={handleClose} title="Go back">
                <FiArrowLeft size={16} />
              </button>
            )}
            <div className="ac-header__title-group">
              <h2 className="ac-header__title">View Consultation</h2>
              {consultation && (
                <p className="ac-header__sub">
                  <strong>{consultation.patientName}</strong>
                  <span> · </span>
                  <span>{consultation.doctorFullName}</span>
                  <span> · </span>
                  <span>{formatDate(consultation.dateCreated)}</span>
                </p>
              )}
            </div>
          </div>

          <div className="ac-header__right">
            <div className="styles.clinicNameone">
               <FaClinicMedical size={20} style={{ verticalAlign: 'middle', margin: '6px', marginTop: '0px'}} />  
                {localStorage.getItem('clinicName') || '—'}
                </div>
            {consultation && (
              <div className="header-nav-group">
                <button className="btn-nav" onClick={() => { if (consultation) { fetchPatientDetails(consultation.patientId); setShowPatientModal(true); } }}>
                  <FiUser size={13} /> Patient
                </button>
                <button className="btn-nav btn-nav--blue" onClick={handleOpenLabModal}>
                  <FiFileText size={13} /> Lab Order
                  {stagedLabCount > 0 && <span className="badge">{stagedLabCount}</span>}
                  {savedLabItems.filter(i => i.status === 1).length > 0 && stagedLabCount === 0 && (
                    <span className="badge badge--saved">{savedLabItems.filter(i => i.status === 1).length}</span>
                  )}
                </button>
              </div>
            )}
            {!isRoutePage && (
              <button className="btn-close" onClick={handleClose}><FiX size={18} /></button>
            )}
          </div>
        </header>

        <main className="ac-body">
          {loading && (
            <div className="state-loading" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <div className="spinner-lg" />
              <p>Loading consultation…</p>
            </div>
          )}

          {!loading && consultation && (
            <div className="step2">

              {/* Patient alert bar */}
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

              <div className={`panels ${isDragOver ? 'panels--dragover' : ''}`}>

                {/* Panel 1 — Consultation Notes */}
                <section className="panel panel--1">
                  <div className="panel__head">
                    <span className="panel__num panel__num--1">1</span>
                    <h3 className="panel__title">Consultation Notes</h3>
                    <span className="panel__saved"><FiCheck size={10} /> Saved</span>
                  </div>
                  <div className="panel__body">
                    {(consultation.reason || consultation.symptoms || consultation.bpReading) && (
                      <div className="visit-snapshot">
                        {consultation.reason && (
                          <div className="snapshot-row"><span className="snapshot-label">Reason</span><span>{consultation.reason}</span></div>
                        )}
                        {consultation.symptoms && (
                          <div className="snapshot-row"><span className="snapshot-label">Symptom</span><span>{consultation.symptoms}</span></div>
                        )}
                        {(consultation.bpReading || consultation.temperature || consultation.weight) && (
                          <div className="vitals-row" style={{ marginTop: 4 }}>
                            {consultation.bpReading   && <span className="vp vp--bp"><FiHeart size={9} /> {consultation.bpReading}</span>}
                            {consultation.temperature && <span className="vp vp--temp"><FiThermometer size={9} /> {consultation.temperature}°</span>}
                            {consultation.weight      && <span className="vp vp--wt"><FiTrendingUp size={9} /> {consultation.weight}kg</span>}
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
                          placeholder="Consultation notes…"
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
                        />
                      </div>
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
                    {totalPrescCount > 0 && <span className="panel__count">{totalPrescCount}</span>}
                    {confirmedSuccess && <span className="panel__saved"><FiCheck size={10} /> Saved</span>}
                  </div>
                  <div className="panel__body">

                    {savedPrescItems.length > 0 && (
                      <div className="saved-presc-list">
                        {savedPrescItems.map(item => (
                          <SavedMedicineCard
                            key={item.id}
                            item={item}
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
                        <p>No medicines prescribed</p>
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

        {/* ── BOTTOM ACTION FOOTER BAR ── */}
        {consultation && (
          <footer className="ac-footer">
            <div className="ac-footer__left">
              {(confirmedSuccess || savedPrescItems.length > 0 || savedLabItems.length > 0) && (
                <div className="ac-footer__status">
                  <FiCheckCircle size={14} />
                  <span>
                    Saved
                    {confirmedSuccess && ' · Prescription'}
                    {labOrderId ? ' · Lab order' : ''}
                  </span>
                  {!footerBtnIsFinish && hasAnythingNew && (
                    <span className="ac-footer__pending">
                      — {submitBtnLabel()} pending
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="ac-footer__right">
              {(hasAnythingNew || consultDataChanged) ? (
                <button
                  className="btn-footer-submit"
                  onClick={handleFinalSubmit}
                  disabled={!!submitProgress}
                >
                  {submitProgress && !submitProgress.done ? (
                    <><span className="spin-sm" /> Processing…</>
                  ) : (
                    <><FiSend size={15} /> Submit</>
                  )}
                </button>
              ) : (
                <button className="btn-footer-finish" onClick={handleClose}>
                  <FiCheckCircle size={16} />
                  Done & Close
                </button>
              )}
            </div>
          </footer>
        )}

        {/* ── PROGRESS MODAL ── */}
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

        {/* ── ERROR POPUP ── */}
        <ErrorPopup
          message={error?.message || (typeof error === 'string' ? error : null)}
          onClose={() => setError(null)}
        />

        {/* ── PATIENT MODAL ── */}
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
                    {patientDetails.familyPatientId && (
                      <div className="pt-cell pt-cell--full pt-cell--family">
                        <label><FiUsers size={10} /> Family Patient</label>
                        {loadingFamilyData ? (
                          <div className="pt-family-loading"><span className="spin-sm spin-sm--teal" /> Fetching family patient…</div>
                        ) : familyPatientData ? (
                          <div className="pt-family-row">
                            <div className="pt-family-info">
                              <span className="pt-family-name">{familyPatientData.patientName}</span>
                              {familyPatientData.mobile && <span className="pt-family-mobile">{familyPatientData.mobile}</span>}
                            </div>
                            <button className="btn-pt-view-family" onClick={() => { setFamilyPatientDetails(familyPatientData); setShowFamilyModal(true); }}>
                              <FiEye size={11} /> View Details
                            </button>
                          </div>
                        ) : (
                          <span className="pt-family-id-fallback">ID #{patientDetails.familyPatientId}</span>
                        )}
                      </div>
                    )}
                    {patientDetails.allergies && (
                      <div className="pt-cell pt-cell--full pt-cell--alert"><label><FiAlertCircle size={10} /> Allergies</label><span>{patientDetails.allergies}</span></div>
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

        {/* ── FAMILY PATIENT MODAL ── */}
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
                  <div className="pt-cell pt-cell--full pt-cell--alert"><label><FiAlertCircle size={10} /> Allergies</label><span>{familyPatientDetails.allergies}</span></div>
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

        {/* ── LAB MODAL ── */}
        {showLabModal && (
          <div className="modal-overlay" onClick={() => setShowLabModal(false)}>
            <div className="modal lab-modal" onClick={e => e.stopPropagation()}>

              <div className="modal__head lab-modal__head">
                <span><FiFileText size={14} /> Lab Order</span>
                <div className="lab-modal__head-actions">
                  {labOrderId && !confirmDelOrder && (
                    <button className="btn-del-order-header" onClick={() => setConfirmDelOrder(true)} title="Delete entire lab order">
                      <FiTrash2 size={13} /> Delete Lab Order
                    </button>
                  )}
                  {labOrderId && confirmDelOrder && (
                    <div className="del-order-confirm-inline">
                      <span className="del-order-confirm-inline__msg">
                        <FiAlertCircle size={12} /> Delete entire order?
                      </span>
                      <button className="btn-confirm-yes-sm" onClick={handleDeleteLabOrder} disabled={deletingOrder}>
                        {deletingOrder ? <span className="spin-sm" /> : <FiCheck size={11} />} Yes
                      </button>
                      <button className="btn-confirm-no-sm" onClick={() => setConfirmDelOrder(false)}>
                        <FiX size={11} /> No
                      </button>
                    </div>
                  )}
                  <button className="modal__close" onClick={() => setShowLabModal(false)}><FiX size={16} /></button>
                </div>
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
                    {submittedLabTestIds.length > 0 && <span className="lab-col__frozen-cnt">{submittedLabTestIds.length} saved</span>}
                    {deactivatedLabTestIds.length > 0 && <span className="lab-col__deactivated-cnt">{deactivatedLabTestIds.length} inactive</span>}
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
                          const id          = t.id || t.testId;
                          const sel         = selectedTestIds.includes(id);
                          const frozen      = submittedLabTestIds.includes(id);
                          const deactivated = deactivatedLabTestIds.includes(id);
                          const savedItem   = savedLabItems.find(s => (s.testId === id || s.testID === id));
                          return (
                            <label key={id}
                              className={`lab-item ${frozen ? 'lab-item--frozen' : deactivated ? 'lab-item--deactivated' : sel ? 'lab-item--sel' : ''}`}
                              onClick={e => {
                                if (frozen && savedItem)      { e.preventDefault(); setConfirmRemoveLabId({ itemId: savedItem.itemId, name: getLabName(t) }); }
                                else if (deactivated && savedItem) { e.preventDefault(); setReactivateConfirm({ itemId: savedItem.itemId, name: getLabName(t), testId: id, pkgId: 0 }); }
                              }}
                            >
                              <input type="checkbox" checked={frozen || sel} disabled={frozen || deactivated}
                                onChange={() => { if (!frozen && !deactivated) setSelectedTestIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); }} />
                              <span className="lab-item__name">
                                {getLabName(t) || 'Unknown'}
                                {frozen      && <span className="lab-item__saved-tag"><FiCheck size={8} /> Saved</span>}
                                {deactivated && <span className="lab-item__deact-tag"><FiX size={8} /> Deleted</span>}
                              </span>
                              {(t.fees || t.Fees) && <span className="lab-item__fee">₹{t.fees || t.Fees}</span>}
                              {frozen      && <span className="lab-item__remove-hint"><FiX size={9} /></span>}
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
                    {submittedLabPkgIds.length > 0 && <span className="lab-col__frozen-cnt">{submittedLabPkgIds.length} saved</span>}
                    {deactivatedLabPkgIds.length > 0 && <span className="lab-col__deactivated-cnt">{deactivatedLabPkgIds.length} inactive</span>}
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
                          const deactivated = deactivatedLabPkgIds.includes(id);
                          const savedItem   = savedLabItems.find(s => (s.packageId === id || s.packageID === id));
                          return (
                            <label key={id}
                              className={`lab-item ${frozen ? 'lab-item--frozen' : deactivated ? 'lab-item--deactivated' : sel ? 'lab-item--sel' : ''}`}
                              onClick={e => {
                                if (frozen && savedItem)      { e.preventDefault(); setConfirmRemoveLabId({ itemId: savedItem.itemId, name: getPkgName(p) }); }
                                else if (deactivated && savedItem) { e.preventDefault(); setReactivateConfirm({ itemId: savedItem.itemId, name: getPkgName(p), testId: 0, pkgId: id }); }
                              }}
                            >
                              <input type="checkbox" checked={frozen || sel} disabled={frozen || deactivated}
                                onChange={() => { if (!frozen && !deactivated) setSelectedPkgIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); }} />
                              <span className="lab-item__name">
                                {getPkgName(p) || 'Unknown'}
                                {frozen      && <span className="lab-item__saved-tag"><FiCheck size={8} /> Saved</span>}
                                {deactivated && <span className="lab-item__deact-tag"><FiX size={8} /> Inactive</span>}
                              </span>
                              {(p.fees || p.Fees) && <span className="lab-item__fee">₹{p.fees || p.Fees}</span>}
                              {frozen      && <span className="lab-item__remove-hint"><FiX size={9} /></span>}
                              {deactivated && <span className="lab-item__reactivate-hint"><FiRefreshCw size={9} /></span>}
                            </label>
                          );
                        })}
                  </div>
                </div>
              </div>

              {/* Saved lab items inside modal */}
              {savedLabItems.length > 0 && (
                <div className="lab-modal__saved-wrap">
                  <SavedLabSection
                    labItems={savedLabItems}
                    labPriorityDesc={savedLabPriorityDesc}
                    onItemStatusChange={handleLabItemStatusChange}
                    onError={setError}
                  />
                </div>
              )}

              <div className="lab-footer">
                <button className="lab-footer__cancel" onClick={() => setShowLabModal(false)}><FiX size={12} /> Cancel</button>
                <button className="lab-footer__save" onClick={handleStageAndSubmitLabOrder}>
                  <FiCheck size={13} />
                  {(() => {
                    const newTests = selectedTestIds.filter(id => !submittedLabTestIds.includes(id) && !deactivatedLabTestIds.includes(id)).length;
                    const newPkgs  = selectedPkgIds.filter(id => !submittedLabPkgIds.includes(id) && !deactivatedLabPkgIds.includes(id)).length;
                    const total    = newTests + newPkgs;
                    return total > 0 ? `Submit ${total} Item${total !== 1 ? 's' : ''}` : 'Done';
                  })()}
                </button>
              </div>

              {/* Reactivate confirm */}
              {reactivateConfirm && (
                <div className="lab-remove-confirm-overlay" onClick={() => setReactivateConfirm(null)}>
                  <div className="lab-remove-confirm lab-remove-confirm--reactivate" onClick={e => e.stopPropagation()}>
                    <div className="lab-remove-confirm__icon lab-remove-confirm__icon--green"><FiRefreshCw size={22} /></div>
                    <p className="lab-remove-confirm__title">Re-activate Lab Item?</p>
                    <p className="lab-remove-confirm__name">{reactivateConfirm.name}</p>
                    <p className="lab-remove-confirm__sub">This item is currently inactive. Re-activate it?</p>
                    <div className="lab-remove-confirm__btns">
                      <button className="btn-confirm-reactivate" onClick={handleReactivateLabItem} disabled={reactivating}>
                        {reactivating ? <span className="spin-sm" /> : <FiCheck size={12} />} Yes, Re-activate
                      </button>
                      <button className="btn-confirm-no" onClick={() => setReactivateConfirm(null)}>
                        <FiX size={11} /> Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Remove lab item confirm */}
              {confirmRemoveLabId && (
                <div className="lab-remove-confirm-overlay" onClick={() => setConfirmRemoveLabId(null)}>
                  <div className="lab-remove-confirm" onClick={e => e.stopPropagation()}>
                    <div className="lab-remove-confirm__icon"><FiAlertCircle size={22} /></div>
                    <p className="lab-remove-confirm__title">Remove Lab Item?</p>
                    <p className="lab-remove-confirm__name">{confirmRemoveLabId.name}</p>
                    <div className="lab-remove-confirm__btns">
                      <button className="btn-confirm-yes"
                        onClick={() => handleRemoveLabItemFromModal(confirmRemoveLabId.itemId)}
                        disabled={removingLabItemId === confirmRemoveLabId.itemId}>
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

      </div>
    </div>
  );

  return isRoutePage
    ? shell
    : ReactDOM.createPortal(shell, document.body);
};

export default ViewConsultation;