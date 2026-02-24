// src/components/ViewConsultation.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiX, FiCalendar, FiCheck, FiSearch, FiChevronDown,
  FiUser, FiArrowLeft, FiPlus, FiFileText, FiPackage,
  FiActivity, FiEye, FiEdit3, FiAlertCircle,
  FiZap, FiClock, FiRefreshCw, FiChevronUp, FiHeart,
  FiThermometer, FiTrendingUp, FiTrash2,
  FiClipboard, FiDroplet, FiCheckCircle, FiSave, FiUsers,
  FiMove,
} from 'react-icons/fi';
import { getPatientsList } from '../api/api.js';
import { updateConsultation, getConsultationList } from '../api/api-consultation.js';
import {
  getMedicineMasterList, getPrescriptionList, getPrescriptionDetailList,
  addPrescription, addPrescriptionDetail, updatePrescriptionDetail, deletePrescriptionDetail,
} from '../api/api-pharmacy.js';
import {
  addLabTestOrder, addLabTestOrderItem, getLabTestMasterList,
  getLabTestPackageList, getLabTestOrderList, getLabTestOrderItemList,
  updateLabTestOrderItem, deleteLabTestOrder,
} from '../api/api-labtest.js';
import './ViewConsultation.css';

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

/* ─── Drag-and-drop transfer key ─────────────────── */
const DND_MED_FROM_LIST   = 'application/x-med-from-list';   // Panel 3 → Panel 2
const DND_MED_FROM_PRESC  = 'application/x-med-from-presc';  // Panel 2 → Panel 3 (remove)

/* ─── Helpers ────────────────────────────────────── */
const parseTimings    = (s) => s ? s.split('|').map(t => t.trim()).filter(t => ['M','A','E','N'].includes(t)) : [];
const buildFrequency  = (timings) => timings.length ? timings.join('|') : '';
const calcQuantity    = (days, timings) => { const d = parseInt(days) || 0; return d > 0 && timings.length > 0 ? d * timings.length : 0; };
const formatDate      = (ds) => { if (!ds) return '—'; return new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
const today           = () => new Date().toISOString().split('T')[0];
const thirtyDaysLater = () => new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
const getIds          = () => ({ clinicId: Number(localStorage.getItem('clinicID')), branchId: Number(localStorage.getItem('branchID')) });

/* ─── useDragGhost — creates a styled ghost element ── */
const useDragGhost = () => {
  const ghostRef = useRef(null);

  const createGhost = useCallback((label) => {
    if (ghostRef.current) ghostRef.current.remove();
    const el = document.createElement('div');
    el.className = 'med-drag-ghost';
    el.innerHTML = `<div class="med-drag-ghost__icon">Rx</div><span>${label}</span>`;
    document.body.appendChild(el);
    ghostRef.current = el;
    return el;
  }, []);

  const removeGhost = useCallback(() => {
    if (ghostRef.current) { ghostRef.current.remove(); ghostRef.current = null; }
  }, []);

  useEffect(() => () => removeGhost(), [removeGhost]);

  return { createGhost, removeGhost };
};

/* ─── MedicineContainer (inline form for adding / editing) ──────── */
const MedicineContainer = ({ container, onUpdate, onRemove, isDropFlash }) => {
  const toggleTiming = (code) => {
    const timings = container.timings.includes(code)
      ? container.timings.filter(c => c !== code)
      : [...container.timings, code];
    onUpdate(container.tempId, { timings, quantity: calcQuantity(container.days, timings) });
  };
  const handleDays = (val) => onUpdate(container.tempId, { days: val, quantity: calcQuantity(val, container.timings) });
  const foodLabel  = FOOD_OPTIONS.find(f => f.id === container.foodTiming)?.label || '—';

  return (
    <div className={`med-card ${container.expanded ? 'med-card--open' : ''} ${isDropFlash ? 'med-card--drop-flash' : ''}`}>
      <div className="med-card__head">
        <button type="button" className="med-card__toggle"
          onClick={() => onUpdate(container.tempId, { expanded: !container.expanded })}>
          {container.expanded ? <FiChevronUp size={11} /> : <FiChevronDown size={11} />}
        </button>
        <div className="med-card__head-info">
          <span className={`med-card__name ${!container.medicineName ? 'med-card__unnamed' : ''}`}>
            {container.medicineName || 'Unnamed Medicine'}
          </span>
          {!container.expanded && (
            <span className="med-card__summary">
              {container.dosePerIntake && <>{container.dosePerIntake}</>}
              {container.timings.length > 0 && <> · {container.timings.join('-')}</>}
              {container.quantity > 0 && <> · Qty {container.quantity}</>}
              <> · {foodLabel} food</>
            </span>
          )}
        </div>
        {container.quantity > 0 && <span className="med-card__qty">Qty {container.quantity}</span>}
        <button className="med-card__remove" onClick={() => onRemove(container.tempId)}><FiX size={12} /></button>
      </div>

      {container.expanded && (
        <div className="med-card__body">
          <div className="mf">
            <span className="mf__label">Medicine Name</span>
            <input className="mf__input" value={container.medicineName}
              onChange={e => onUpdate(container.tempId, { medicineName: e.target.value })}
              placeholder="Enter medicine name" />
          </div>

          <div className="med-timing-row">
            <div className="med-timing-group">
              <span className="mf__label">Timing</span>
              <div className="timing-pills">
                {TIMING_OPTIONS.map(t => (
                  <button key={t.code} type="button"
                    className={`timing-pill ${container.timings.includes(t.code) ? 'timing-pill--on' : ''}`}
                    onClick={() => toggleTiming(t.code)}>
                    {t.code}
                  </button>
                ))}
              </div>
            </div>
            <div className="med-timing-sep" />
            <div className="med-timing-group">
              <span className="mf__label">Food</span>
              <div className="food-pills">
                {FOOD_OPTIONS.map(f => (
                  <button key={f.id} type="button"
                    className={`food-pill ${container.foodTiming === f.id ? 'food-pill--on' : ''}`}
                    onClick={() => onUpdate(container.tempId, { foodTiming: f.id })}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="med-inline-row">
            <div className="mf mf--inline">
              <span className="mf__label">Dose</span>
              <input className="mf__input" value={container.dosePerIntake}
                onChange={e => onUpdate(container.tempId, { dosePerIntake: e.target.value })}
                placeholder="e.g. 1 Tablet" />
            </div>
            <div className="mf mf--sm">
              <span className="mf__label">Days</span>
              <input className="mf__input" type="number" min="1" value={container.days}
                onChange={e => handleDays(e.target.value)} />
            </div>
            <div className="mf mf--sm">
              <span className="mf__label">Qty</span>
              <input className="mf__input mf__input--qty" type="number" min="0" value={container.quantity}
                onChange={e => onUpdate(container.tempId, { quantity: Number(e.target.value) })} />
            </div>
          </div>

          <div className="mf">
            <span className="mf__label">Instructions</span>
            <textarea className="mf__input mf__textarea" rows={2} value={container.notes}
              onChange={e => onUpdate(container.tempId, { notes: e.target.value })}
              placeholder="e.g. Take with warm water…" />
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── SavedMedicineCard — now draggable back to Panel 3 ── */
const SavedMedicineCard = ({
  item, clinicId, branchId, onUpdated, onDeleted, onError,
  onDragStart, onDragEnd,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [local, setLocal]       = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const foodLabel = FOOD_OPTIONS.find(f => f.id === (item.foodTiming || 2))?.label || '—';
  const timings   = parseTimings(item.frequency);

  const startEdit = () => {
    setLocal({
      tempId: item.id, medicineId: item.medicineId || 0,
      medicineName: item.medicineName || '', form: item.form || 0,
      strength: item.strength || '', defaultRoute: item.route || 1,
      timings: parseTimings(item.frequency), foodTiming: item.foodTiming || 2,
      days: item.duration ? item.duration.replace(/\D/g, '') : '7',
      dosePerIntake: item.dosage || '', quantity: item.quantity || 0,
      notes: item.instructions || '', refillAllowed: item.refillAllowed || 0,
      refillCount: item.refillCount || 0, expanded: true,
      startDate: item.startDate || today(), endDate: item.endDate || thirtyDaysLater(),
    });
    setEditing(true); setExpanded(true);
  };

  const handleSave = async () => {
    if (!local) return;
    try {
      setSaving(true);
      await updatePrescriptionDetail({
        PrescriptionDetailID: item.id, ClinicID: clinicId, BranchID: branchId,
        Form: local.form, Strength: local.strength, Dosage: local.dosePerIntake,
        Frequency: buildFrequency(local.timings),
        Duration: local.days ? `${local.days} Days` : '',
        Route: local.defaultRoute, FoodTiming: local.foodTiming,
        Instructions: local.notes, Quantity: local.quantity,
        RefillAllowed: local.refillAllowed, RefillCount: local.refillCount,
        StartDate: today(), EndDate: thirtyDaysLater(), Status: 1,
      });
      onUpdated(item.id, local); setEditing(false); setLocal(null);
    } catch (err) { onError(err); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deletePrescriptionDetail(item.id);
      onDeleted(item.id);
    } catch (err) { onError(err); } finally { setDeleting(false); setConfirmDel(false); }
  };

  /* ── Drag handlers (drag saved card → Panel 3 to remove) ── */
  const handleDragStart = (e) => {
    if (editing) { e.preventDefault(); return; }
    const payload = JSON.stringify({ detailId: item.id, medicineName: item.medicineName, medicineId: item.medicineId });
    e.dataTransfer.setData(DND_MED_FROM_PRESC, payload);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
    onDragStart?.(item.medicineName);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd?.();
  };

  if (!editing) return (
    <div
      className={`saved-item-card ${isDragging ? 'saved-item-card--dragging' : ''}`}
      draggable={!editing}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
        {item.quantity > 0 && expanded && <span className="saved-item-card__qty-badge">Qty {item.quantity}</span>}
        <div className="saved-item-card__actions">
          <button className="btn-item-edit" onClick={startEdit}><FiEdit3 size={12} /> Edit</button>
          {!confirmDel ? (
            <button className="btn-item-delete" onClick={() => setConfirmDel(true)}><FiTrash2 size={12} /> Delete</button>
          ) : (
            <div className="confirm-del-popup">
              <div className="confirm-del-popup__inner">
                <p className="confirm-del-popup__msg"><FiAlertCircle size={14} /> Delete this medicine?</p>
                <div className="confirm-del-popup__btns">
                  <button className="btn-confirm-yes" onClick={handleDelete} disabled={deleting}>
                    {deleting ? <span className="spin-sm" /> : <FiCheck size={11} />} Yes, Delete
                  </button>
                  <button className="btn-confirm-no" onClick={() => setConfirmDel(false)}><FiX size={11} /> Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {expanded && (
        <div className="saved-item-card__body">
          <div className="saved-item-card__strip"><FiCheckCircle size={11} /> Saved to prescription · <span style={{opacity:.65,fontWeight:400}}>Drag to medicine list to remove</span></div>
          <div className="saved-item-card__meta-row">
            {item.dosage     && <span className="tag">{item.dosage}</span>}
            {item.frequency  && <span className="tag">{item.frequency}</span>}
            {item.duration   && <span className="tag">{item.duration}</span>}
            {item.quantity > 0 && <span className="tag tag--qty">Qty {item.quantity}</span>}
            {item.instructions && <span className="tag tag--note">{item.instructions}</span>}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="saved-item-card saved-item-card--editing">
      <div className="saved-item-card__edit-head">
        <FiEdit3 size={12} /> Editing: <strong>{item.medicineName}</strong>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className="btn-item-save" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="spin-sm" /> Saving…</> : <><FiSave size={12} /> Save</>}
          </button>
          <button className="btn-item-cancel" onClick={() => { setEditing(false); setLocal(null); }} disabled={saving}>
            <FiX size={12} /> Cancel
          </button>
        </div>
      </div>
      <MedicineContainer container={local} onUpdate={(_, ch) => setLocal(p => ({ ...p, ...ch }))} onRemove={() => {}} />
    </div>
  );
};

/* ─── SavedLabSection ───────────────────────────── */
const SavedLabSection = ({ labOrderId, labItems, labPriorityDesc, clinicId, branchId, onItemStatusChange, onOrderDeleted, onError }) => {
  const [togglingId, setTogglingId]       = useState(null);
  const [deletingOrder, setDeletingOrder] = useState(false);
  const [confirmDelOrder, setConfirmDelOrder] = useState(false);

  const handleToggleItem = async (itemId, currentStatus) => {
    const newStatus = currentStatus === 1 ? 2 : 1;
    try {
      setTogglingId(itemId);
      await updateLabTestOrderItem({ itemId, clinicId, branchId, status: newStatus });
      onItemStatusChange(itemId, newStatus);
    } catch (err) { onError(err); } finally { setTogglingId(null); }
  };

  const handleDeleteOrder = async () => {
    try {
      setDeletingOrder(true);
      await deleteLabTestOrder({ clinicId, branchId, OrderID: labOrderId });
      onOrderDeleted();
    } catch (err) { onError(err); } finally { setDeletingOrder(false); setConfirmDelOrder(false); }
  };

  return (
    <div className="saved-lab-section">
      <div className="saved-lab-section__head">
        <div className="saved-lab-section__title">
          <FiClipboard size={13} /> Lab Order
          {labPriorityDesc && <span className="priority-tag--saved">{labPriorityDesc}</span>}
          <span className="saved-lab-section__count">{labItems.length} item{labItems.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="saved-lab-section__actions">
          {!confirmDelOrder ? (
            <button className="btn-del-order" onClick={() => setConfirmDelOrder(true)}><FiTrash2 size={12} /> Delete Order</button>
          ) : (
            <div className="confirm-del-popup confirm-del-popup--inline">
              <div className="confirm-del-popup__inner">
                <p className="confirm-del-popup__msg"><FiAlertCircle size={14} /> Delete entire lab order?</p>
                <div className="confirm-del-popup__btns">
                  <button className="btn-confirm-yes" onClick={handleDeleteOrder} disabled={deletingOrder}>
                    {deletingOrder ? <span className="spin-sm" /> : <FiCheck size={11} />} Yes
                  </button>
                  <button className="btn-confirm-no" onClick={() => setConfirmDelOrder(false)}><FiX size={11} /> No</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="saved-lab-section__items">
        {labItems.map(item => (
          <div key={item.itemId} className={`saved-lab-item ${item.status !== 1 ? 'saved-lab-item--inactive' : ''}`}>
            <div className="saved-lab-item__info">
              <span className="saved-lab-item__name">{item.testOrPackageName}</span>
              {item.totalAmount > 0 && <span className="saved-lab-item__fee">₹{item.totalAmount?.toFixed(2)}</span>}
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
                  : item.status === 1 ? <><FiX size={11} /> Deactivate</> : <><FiCheck size={11} /> Activate</>}
              </button>
            </div>
          </div>
        ))}
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

  const { createGhost, removeGhost } = useDragGhost();

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
  const [prescriptionId, setPrescriptionId]             = useState(null);
  const [savedPrescItems, setSavedPrescItems]           = useState([]);
  const [containers, setContainers]                     = useState([]);
  const [allMedicines, setAllMedicines]                 = useState([]);
  const [filteredMedicines, setFilteredMedicines]       = useState([]);
  const [searchQuery, setSearchQuery]                   = useState('');
  const [loadingMeds, setLoadingMeds]                   = useState(false);
  const [selectedMedIds, setSelectedMedIds]             = useState([]);
  const [submitPrescProgress, setSubmitPrescProgress]   = useState(null);

  /* ── Panel 2: lab ── */
  const [labOrderId, setLabOrderId]                     = useState(null);
  const [savedLabItems, setSavedLabItems]               = useState([]);
  const [savedLabPriorityDesc, setSavedLabPriorityDesc] = useState('');

  /* ── Lab modal ── */
  const [showLabModal, setShowLabModal]                 = useState(false);
  const [labPriority, setLabPriority]                   = useState(1);
  const [labMasterItems, setLabMasterItems]             = useState([]);
  const [labPackages, setLabPackages]                   = useState([]);
  const [selectedTestIds, setSelectedTestIds]           = useState([]);
  const [selectedPkgIds, setSelectedPkgIds]             = useState([]);
  const [labItemsLoading, setLabItemsLoading]           = useState(false);
  const [labTestSearch, setLabTestSearch]               = useState('');
  const [labPkgSearch, setLabPkgSearch]                 = useState('');
  const [submittedLabTestIds, setSubmittedLabTestIds]   = useState([]);
  const [submittedLabPkgIds, setSubmittedLabPkgIds]     = useState([]);
  const [deactivatedLabTestIds, setDeactivatedLabTestIds] = useState([]);
  const [deactivatedLabPkgIds, setDeactivatedLabPkgIds]   = useState([]);
  const [reactivateConfirm, setReactivateConfirm]       = useState(null);
  const [reactivating, setReactivating]                 = useState(false);
  const [confirmRemoveLabId, setConfirmRemoveLabId]     = useState(null);
  const [removingLabItemId, setRemovingLabItemId]       = useState(null);
  const [savingLabModal, setSavingLabModal]             = useState(false);

  /* ── Patient modal ── */
  const [showPatientModal, setShowPatientModal]         = useState(false);
  const [patientDetails, setPatientDetails]             = useState(null);
  const [loadingPatient, setLoadingPatient]             = useState(false);
  const [familyPatientData, setFamilyPatientData]       = useState(null);
  const [loadingFamilyData, setLoadingFamilyData]       = useState(false);
  const [showFamilyModal, setShowFamilyModal]           = useState(false);
  const [familyPatientDetails, setFamilyPatientDetails] = useState(null);

  /* ── Misc ── */
  const [submitProgress, setSubmitProgress]             = useState(null);
  const [error, setError]                               = useState(null);

  /* ── DnD state ── */
  const [panel2DragOver, setPanel2DragOver]   = useState(false); // medicine list → prescription
  const [panel3DragOver, setPanel3DragOver]   = useState(false); // prescription → medicine list (remove)
  const [dropFlashId, setDropFlashId]         = useState(null);  // tempId of newly dropped container
  const dragOverCounterP2 = useRef(0);  // enter/leave counters to handle child elements
  const dragOverCounterP3 = useRef(0);
  const [draggingMedItemId, setDraggingMedItemId] = useState(null); // which med-item is being dragged

  /* ─────────────────────────────────────────────── */

  useEffect(() => {
    if (activeIsOpen) document.body.classList.add('consultation-open');
    else              document.body.classList.remove('consultation-open');
    return () => document.body.classList.remove('consultation-open');
  }, [activeIsOpen]);

  useEffect(() => {
    if (activeIsOpen && activeConsultId) loadAll(activeConsultId);
  }, [isOpen, propConsultationId]);

  /* ── Load everything ── */
  const loadAll = async (consultId) => {
    try {
      setLoading(true); setError(null);
      const { clinicId, branchId } = getIds();

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
      }

      if (labOrders?.length > 0) {
        const order = labOrders[0];
        setLabOrderId(order.id);
        setSavedLabPriorityDesc(PRIORITY_OPTIONS.find(p => p.id === order.priority)?.label || '');
        setLabPriority(order.priority || 1);
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
      const { clinicId, branchId } = getIds();
      const meds = await getMedicineMasterList(clinicId, { BranchID: branchId, PageSize: 200, Status: 1 });
      setAllMedicines(meds); setFilteredMedicines(meds);
    } catch (err) { console.error(err); } finally { setLoadingMeds(false); }
  };

  const fetchPatientDetails = async (patientId) => {
    try {
      setLoadingPatient(true); setFamilyPatientData(null);
      const { clinicId, branchId } = getIds();
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

  const fetchLabModalItems = async () => {
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

  /* ── Consultation update ── */
  const consultDataChanged = (
    consultationNotes !== savedNotes ||
    treatmentPlan     !== savedPlan  ||
    nextConsultationDate !== savedNextDate
  );

  const handleUpdateConsult = async () => {
    if (!consultation?.consultationId) return;
    try {
      setUpdatingConsult(true); setError(null);
      const { clinicId, branchId } = getIds();
      await updateConsultation({
        consultationId: consultation.consultationId, branchId, clinicId,
        visitId: consultation.visitId, patientId: consultation.patientId,
        doctorId: consultation.doctorId, reason: consultation.reason || '',
        symptoms: consultation.symptoms || '', bpSystolic: consultation.bpSystolic ?? 0,
        bpDiastolic: consultation.bpDiastolic ?? 0, temperature: consultation.temperature ?? 0,
        weight: consultation.weight ?? 0, emrNotes: consultation.emrNotes || '',
        ehrNotes: consultation.ehrNotes || '', instructions: consultation.instructions || '',
        consultationNotes: consultationNotes.trim(),
        nextConsultationDate: nextConsultationDate || '',
        treatmentPlan: treatmentPlan.trim(),
      });
      setSavedNotes(consultationNotes); setSavedPlan(treatmentPlan); setSavedNextDate(nextConsultationDate);
    } catch (err) { setError(err); } finally { setUpdatingConsult(false); }
  };

  /* ── Prescription helpers ── */
  const updateContainer = (tid, ch) => setContainers(prev => prev.map(c => c.tempId === tid ? { ...c, ...ch } : c));
  const removeContainer = (tid)      => setContainers(prev => prev.filter(c => c.tempId !== tid));

  const addBlankContainer = () => setContainers(prev => [...prev, {
    tempId: Date.now() + Math.random(), medicineId: 0, medicineName: '', form: 0, strength: '',
    defaultRoute: 1, timings: [], foodTiming: 2, days: '7', dosePerIntake: '', quantity: 0,
    notes: '', refillAllowed: 0, refillCount: 0, expanded: true,
    startDate: today(), endDate: thirtyDaysLater(),
  }]);

  const toggleMedSelection = (id) =>
    setSelectedMedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  /* Build a container from a medicine master record */
  const buildContainerFromMed = (m) => {
    const timings = m.timing ? m.timing.split('|').map(t => t.trim()).filter(t => ['M','A','E','N'].includes(t)) : [];
    return {
      tempId: Date.now() + Math.random(),
      medicineId: m.id, medicineName: m.name,
      form: m.type || 0, strength: m.dosageForm || '', defaultRoute: m.defaultRoute || 1,
      timings, foodTiming: 2, days: '7',
      dosePerIntake: m.doseCount ? `${m.doseCount}` : '',
      quantity: calcQuantity('7', timings), notes: '', refillAllowed: 0, refillCount: 0,
      expanded: true, startDate: today(), endDate: thirtyDaysLater(),
    };
  };

  const handleAddSelectedMeds = () => {
    const toAdd = allMedicines.filter(m =>
      selectedMedIds.includes(m.id) &&
      !containers.some(c => c.medicineId === m.id) &&
      !savedPrescItems.some(s => s.medicineId === m.id)
    );
    setContainers(prev => [...prev, ...toAdd.map(buildContainerFromMed)]);
    setSelectedMedIds([]);
  };

  /* ── DRAG & DROP: Panel 3 → Panel 2 (add medicine) ── */

  /* med-item drag start */
  const handleMedItemDragStart = (e, medicine) => {
    const alreadyAdded = containers.some(c => c.medicineId === medicine.id)
      || savedPrescItems.some(s => s.medicineId === medicine.id);
    if (alreadyAdded) { e.preventDefault(); return; }

    const payload = JSON.stringify({ medId: medicine.id });
    e.dataTransfer.setData(DND_MED_FROM_LIST, payload);
    e.dataTransfer.effectAllowed = 'copy';

    // Custom ghost
    const ghost = createGhost(medicine.name);
    e.dataTransfer.setDragImage(ghost, 20, 16);

    setDraggingMedItemId(medicine.id);
  };

  const handleMedItemDragEnd = () => {
    setDraggingMedItemId(null);
    removeGhost();
  };

  /* Panel 2 drop zone */
  const handlePanel2DragEnter = (e) => {
    if (![...e.dataTransfer.types].includes(DND_MED_FROM_LIST)) return;
    dragOverCounterP2.current++;
    setPanel2DragOver(true);
    e.preventDefault();
  };

  const handlePanel2DragOver = (e) => {
    if (![...e.dataTransfer.types].includes(DND_MED_FROM_LIST)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handlePanel2DragLeave = (e) => {
    dragOverCounterP2.current--;
    if (dragOverCounterP2.current === 0) setPanel2DragOver(false);
  };

  const handlePanel2Drop = (e) => {
    e.preventDefault();
    dragOverCounterP2.current = 0;
    setPanel2DragOver(false);
    removeGhost();

    const raw = e.dataTransfer.getData(DND_MED_FROM_LIST);
    if (!raw) return;
    try {
      const { medId } = JSON.parse(raw);
      const medicine = allMedicines.find(m => m.id === medId);
      if (!medicine) return;

      const alreadyAdded = containers.some(c => c.medicineId === medId)
        || savedPrescItems.some(s => s.medicineId === medId);
      if (alreadyAdded) return;

      const newContainer = buildContainerFromMed(medicine);
      setContainers(prev => [...prev, newContainer]);

      // Flash animation on the new card
      setDropFlashId(newContainer.tempId);
      setTimeout(() => setDropFlashId(null), 600);
    } catch (err) { console.error('DnD parse error', err); }
  };

  /* ── DRAG & DROP: Panel 2 → Panel 3 (remove / unselect saved medicine) ── */

  const handleSavedCardDragStart = (medName) => {
    const ghost = createGhost(medName);
    // ghost is already set by SavedMedicineCard's dragstart; just track state
  };

  const handleSavedCardDragEnd = () => {
    removeGhost();
    setPanel3DragOver(false);
    dragOverCounterP3.current = 0;
  };

  /* Panel 3 drop zone */
  const handlePanel3DragEnter = (e) => {
    if (![...e.dataTransfer.types].includes(DND_MED_FROM_PRESC)) return;
    dragOverCounterP3.current++;
    setPanel3DragOver(true);
    e.preventDefault();
  };

  const handlePanel3DragOver = (e) => {
    if (![...e.dataTransfer.types].includes(DND_MED_FROM_PRESC)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handlePanel3DragLeave = (e) => {
    dragOverCounterP3.current--;
    if (dragOverCounterP3.current === 0) setPanel3DragOver(false);
  };

  const handlePanel3Drop = async (e) => {
    e.preventDefault();
    dragOverCounterP3.current = 0;
    setPanel3DragOver(false);
    removeGhost();

    const raw = e.dataTransfer.getData(DND_MED_FROM_PRESC);
    if (!raw) return;
    try {
      const { detailId } = JSON.parse(raw);
      // Show confirmation via a simple prompt-style state; we just delete directly here
      // to keep UX smooth (user can always re-add). Could also show a toast.
      const { clinicId, branchId } = getIds();
      await deletePrescriptionDetail(detailId);
      setSavedPrescItems(prev => prev.filter(i => i.id !== detailId));
    } catch (err) {
      setError({ message: 'Failed to remove medicine from prescription.' });
    }
  };

  /* ── Submit new meds ── */
  const handleSubmitNewMeds = async () => {
    if (containers.length === 0) return;
    for (const c of containers) {
      if (!c.medicineName.trim()) { setError({ message: 'All medicines need a name.' }); return; }
      if (!c.dosePerIntake.trim()) { setError({ message: `Dose required for "${c.medicineName}".` }); return; }
      if (c.quantity <= 0) { setError({ message: `Quantity > 0 required for "${c.medicineName}".` }); return; }
    }
    const { clinicId, branchId } = getIds();
    setError(null);

    const steps = [];
    if (!prescriptionId) { steps.push({ label: 'Creating prescription' }); }
    steps.push({ label: `Adding ${containers.length} medicine(s)` });
    setSubmitProgress({ steps, currentStep: 0, done: false });

    try {
      let s = 0;
      let activePrescId = prescriptionId;

      if (!activePrescId) {
        setSubmitProgress(p => ({ ...p, currentStep: s }));
        const d = (await getConsultationList(clinicId, { Page: 1, PageSize: 1, BranchID: branchId, ConsultationID: activeConsultId }))?.[0];
        const pr = await addPrescription({ clinicId, branchId, ConsultationID: activeConsultId,
          VisitID: d?.visitId ?? consultation?.visitId, PatientID: d?.patientId ?? consultation?.patientId,
          DoctorID: d?.doctorId ?? consultation?.doctorId, DateIssued: today(), ValidUntil: thirtyDaysLater(),
          Diagnosis: null, Notes: d?.consultationNotes || null, IsRepeat: 0, RepeatCount: 0,
          CreatedBy: d?.doctorId ?? consultation?.doctorId });
        if (!pr.success || !pr.prescriptionId) throw new Error('Failed to create prescription');
        activePrescId = pr.prescriptionId;
        setPrescriptionId(pr.prescriptionId); s++;
      }

      setSubmitProgress(p => ({ ...p, currentStep: s }));
      for (const c of containers) {
        await addPrescriptionDetail({ clinicId, branchId, PrescriptionID: activePrescId,
          MedicineID: c.medicineId, MedicineName: c.medicineName, Form: c.form, Strength: c.strength,
          Dosage: c.dosePerIntake, Frequency: buildFrequency(c.timings),
          Duration: c.days ? `${c.days} Days` : '', Route: c.defaultRoute, FoodTiming: c.foodTiming,
          Instructions: c.notes, Quantity: c.quantity, RefillAllowed: 0, RefillCount: 0,
          StartDate: today(), EndDate: thirtyDaysLater() });
      }

      const items2 = await getPrescriptionDetailList(clinicId, { PrescriptionID: activePrescId, BranchID: branchId, Page: 1, PageSize: 50 });
      setSavedPrescItems((items2 || []).filter(i => i.status === 1));
      setContainers([]);
      setSubmitProgress(p => ({ ...p, done: true }));
      setTimeout(() => setSubmitProgress(null), 2500);
    } catch (err) { setError(err); setSubmitProgress(null); }
  };

  const handlePrescItemUpdated = (detailId, localData) => {
    setSavedPrescItems(prev => prev.map(item => item.id !== detailId ? item : {
      ...item,
      dosage: localData.dosePerIntake, frequency: buildFrequency(localData.timings),
      duration: localData.days ? `${localData.days} Days` : '', quantity: localData.quantity,
      instructions: localData.notes, foodTiming: localData.foodTiming,
    }));
  };

  const handlePrescItemDeleted = (detailId) => {
    setSavedPrescItems(prev => prev.filter(item => item.id !== detailId));
  };

  /* ── Lab modal ── */
  const handleOpenLabModal = () => {
    if (labMasterItems.length === 0) fetchLabModalItems();
    setShowLabModal(true);
  };

  const handleSaveLabItems = async () => {
    const newTestIds = selectedTestIds.filter(id => !submittedLabTestIds.includes(id) && !deactivatedLabTestIds.includes(id));
    const newPkgIds  = selectedPkgIds.filter(id => !submittedLabPkgIds.includes(id) && !deactivatedLabPkgIds.includes(id));
    if (newTestIds.length === 0 && newPkgIds.length === 0) { setShowLabModal(false); return; }

    const { clinicId, branchId } = getIds();
    setShowLabModal(false); setError(null);

    const steps = [];
    if (!labOrderId) steps.push({ label: 'Creating lab order' });
    steps.push({ label: `Adding ${newTestIds.length + newPkgIds.length} lab item(s)` });
    setSubmitProgress({ steps, currentStep: 0, done: false });

    try {
      let s = 0;
      let activeOrderId = labOrderId;

      if (!activeOrderId) {
        setSubmitProgress(p => ({ ...p, currentStep: s }));
        const lr = await addLabTestOrder({ clinicId, branchId, ConsultationID: activeConsultId,
          VisitID: consultation?.visitId, PatientID: consultation?.patientId,
          doctorId: consultation?.doctorId, priority: labPriority, Notes: consultationNotes });
        if (!lr.success) throw new Error('Failed to create lab order');
        activeOrderId = lr.orderId;
        setLabOrderId(lr.orderId);
        setSavedLabPriorityDesc(PRIORITY_OPTIONS.find(p => p.id === labPriority)?.label || '');
        s++;
      }

      setSubmitProgress(p => ({ ...p, currentStep: s }));
      for (const testId of newTestIds) {
        await addLabTestOrderItem({ clinicId, branchId, OrderID: activeOrderId,
          PatientID: consultation?.patientId, DoctorID: consultation?.doctorId, TestID: testId, PackageID: 0 });
      }
      for (const pkgId of newPkgIds) {
        await addLabTestOrderItem({ clinicId, branchId, OrderID: activeOrderId,
          PatientID: consultation?.patientId, DoctorID: consultation?.doctorId, TestID: 0, PackageID: pkgId });
      }

      setSubmittedLabTestIds(prev => [...new Set([...prev, ...newTestIds])]);
      setSubmittedLabPkgIds(prev => [...new Set([...prev, ...newPkgIds])]);
      setDeactivatedLabTestIds(prev => prev.filter(id => !newTestIds.includes(id)));
      setDeactivatedLabPkgIds(prev => prev.filter(id => !newPkgIds.includes(id)));

      const items = await getLabTestOrderItemList(clinicId, { OrderID: activeOrderId, BranchID: branchId, Page: 1, PageSize: 50 });
      setSavedLabItems(items || []);
      setSubmitProgress(p => ({ ...p, done: true }));
      setTimeout(() => setSubmitProgress(null), 2500);
    } catch (err) { setError(err); setSubmitProgress(null); }
  };

  const handleLabItemStatusChange = (itemId, newStatus) => {
    setSavedLabItems(prev => prev.map(i => i.itemId === itemId ? { ...i, status: newStatus } : i));
    const changedItem = savedLabItems.find(i => i.itemId === itemId);
    if (!changedItem) return;
    const isActive = newStatus === 1;
    const testId   = changedItem.testId   ?? 0;
    const pkgId    = changedItem.packageId ?? 0;
    if (testId) {
      if (isActive) { setSubmittedLabTestIds(prev => [...new Set([...prev, testId])]); setSelectedTestIds(prev => [...new Set([...prev, testId])]); setDeactivatedLabTestIds(prev => prev.filter(id => id !== testId)); }
      else          { setSubmittedLabTestIds(prev => prev.filter(id => id !== testId)); setSelectedTestIds(prev => prev.filter(id => id !== testId)); setDeactivatedLabTestIds(prev => [...new Set([...prev, testId])]); }
    }
    if (pkgId) {
      if (isActive) { setSubmittedLabPkgIds(prev => [...new Set([...prev, pkgId])]); setSelectedPkgIds(prev => [...new Set([...prev, pkgId])]); setDeactivatedLabPkgIds(prev => prev.filter(id => id !== pkgId)); }
      else          { setSubmittedLabPkgIds(prev => prev.filter(id => id !== pkgId)); setSelectedPkgIds(prev => prev.filter(id => id !== pkgId)); setDeactivatedLabPkgIds(prev => [...new Set([...prev, pkgId])]); }
    }
  };

  const handleLabOrderDeleted = () => {
    setSavedLabItems([]); setLabOrderId(null);
    setSubmittedLabTestIds([]); setSubmittedLabPkgIds([]);
    setDeactivatedLabTestIds([]); setDeactivatedLabPkgIds([]);
    setSelectedTestIds([]); setSelectedPkgIds([]);
  };

  const handleReactivateLabItem = async () => {
    if (!reactivateConfirm) return;
    const { itemId, testId, pkgId } = reactivateConfirm;
    try {
      setReactivating(true);
      const { clinicId, branchId } = getIds();
      await updateLabTestOrderItem({ itemId, clinicId, branchId, status: 1 });
      setSavedLabItems(prev => prev.map(i => i.itemId === itemId ? { ...i, status: 1 } : i));
      if (testId) { setSubmittedLabTestIds(prev => [...new Set([...prev, testId])]); setSelectedTestIds(prev => [...new Set([...prev, testId])]); setDeactivatedLabTestIds(prev => prev.filter(id => id !== testId)); }
      if (pkgId)  { setSubmittedLabPkgIds(prev => [...new Set([...prev, pkgId])]); setSelectedPkgIds(prev => [...new Set([...prev, pkgId])]); setDeactivatedLabPkgIds(prev => prev.filter(id => id !== pkgId)); }
    } catch (err) { setError(err); }
    finally { setReactivating(false); setReactivateConfirm(null); }
  };

  const handleRemoveLabItemFromModal = async (itemId) => {
    try {
      setRemovingLabItemId(itemId);
      const { clinicId, branchId } = getIds();
      await updateLabTestOrderItem({ itemId, clinicId, branchId, status: 2 });
      const savedItem = savedLabItems.find(s => s.itemId === itemId);
      setSavedLabItems(prev => prev.map(i => i.itemId === itemId ? { ...i, status: 2 } : i));
      if (savedItem?.testId)    { setSubmittedLabTestIds(prev => prev.filter(id => id !== savedItem.testId)); setSelectedTestIds(prev => prev.filter(id => id !== savedItem.testId)); setDeactivatedLabTestIds(prev => [...new Set([...prev, savedItem.testId])]); }
      if (savedItem?.packageId) { setSubmittedLabPkgIds(prev => prev.filter(id => id !== savedItem.packageId)); setSelectedPkgIds(prev => prev.filter(id => id !== savedItem.packageId)); setDeactivatedLabPkgIds(prev => [...new Set([...prev, savedItem.packageId])]); }
      setConfirmRemoveLabId(null);
    } catch (err) { setError(err); }
    finally { setRemovingLabItemId(null); }
  };

  const handleClose = () => {
    setConsultation(null); setLoading(false);
    setConsultationNotes(''); setTreatmentPlan(''); setNextConsultationDate('');
    setSavedNotes(''); setSavedPlan(''); setSavedNextDate('');
    setPrescriptionId(null); setSavedPrescItems([]); setContainers([]);
    setAllMedicines([]); setFilteredMedicines([]); setSearchQuery(''); setSelectedMedIds([]);
    setLabOrderId(null); setSavedLabItems([]); setSavedLabPriorityDesc('');
    setShowLabModal(false); setLabMasterItems([]); setLabPackages([]);
    setSelectedTestIds([]); setSelectedPkgIds([]);
    setSubmittedLabTestIds([]); setSubmittedLabPkgIds([]);
    setDeactivatedLabTestIds([]); setDeactivatedLabPkgIds([]);
    setReactivateConfirm(null); setConfirmRemoveLabId(null);
    setPatientDetails(null); setFamilyPatientData(null);
    setShowPatientModal(false); setShowFamilyModal(false); setFamilyPatientDetails(null);
    setSubmitProgress(null); setSubmitPrescProgress(null); setError(null);
    setPanel2DragOver(false); setPanel3DragOver(false); setDraggingMedItemId(null);
    if (isRoutePage) navigate(-1);
    else if (onClose) onClose();
  };

  if (!activeIsOpen) return null;

  /* ── Derived ── */
  const getLabName = (t) => t?.name || t?.testName || t?.test_name || t?.TestName || t?.title || '';
  const getPkgName = (p) => p?.name || p?.packageName || p?.PackageName || p?.title || p?.description || Object.values(p).find(v => typeof v === 'string' && v.length > 1 && !/^[0-9]/.test(v)) || '';

  const filteredTests = labMasterItems.filter(t => !labTestSearch || getLabName(t).toLowerCase().includes(labTestSearch.toLowerCase()));
  const filteredPkgs  = labPackages.filter(p => !labPkgSearch || getPkgName(p).toLowerCase().includes(labPkgSearch.toLowerCase()));

  const newTestCount = selectedTestIds.filter(id => !submittedLabTestIds.includes(id) && !deactivatedLabTestIds.includes(id)).length;
  const newPkgCount  = selectedPkgIds.filter(id => !submittedLabPkgIds.includes(id) && !deactivatedLabPkgIds.includes(id)).length;

  const hasNewMeds = containers.length > 0;

  const { clinicId, branchId } = getIds();

  const shell = (
    <div className="ac-overlay">
      <div className="ac-shell">

        {/* ── HEADER ── */}
        <header className="ac-header">
          <div className="ac-header__left">
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
            {consultation && (
              <div className="header-nav-group">
                <button className="btn-nav" onClick={() => { fetchPatientDetails(consultation.patientId); setShowPatientModal(true); }}>
                  <FiUser size={13} /> Patient
                </button>
                <button className="btn-nav btn-nav--blue" onClick={handleOpenLabModal}>
                  <FiFileText size={13} /> Lab Order
                  {(newTestCount + newPkgCount) > 0 && <span className="badge">{newTestCount + newPkgCount}</span>}
                </button>
                {hasNewMeds && (
                  <button className="btn-submit btn-submit--add" onClick={handleSubmitNewMeds} disabled={!!submitProgress}>
                    {submitProgress && !submitProgress.done
                      ? <><span className="spin-sm" /> Processing…</>
                      : <><FiPlus size={13} /> Add {containers.length} Med{containers.length !== 1 ? 's' : ''}</>
                    }
                  </button>
                )}
              </div>
            )}
            {isRoutePage
              ? <button className="btn-back" onClick={handleClose} title="Go back"><FiArrowLeft size={16} /></button>
              : <button className="btn-close" onClick={handleClose}><FiX size={18} /></button>
            }
          </div>
        </header>

        {/* ── BODY ── */}
        <main className="ac-body">

          {loading && (
            <div className="state-loading" style={{ flex: 1, justifyContent: 'center' }}>
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
                      <FiActivity size={12} />
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

              {/* Saved banner */}
              <div className="saved-banner">
                <FiCheckCircle size={14} />
                <span>
                  Consultation #{activeConsultId}
                  {savedPrescItems.length > 0 && ` · ${savedPrescItems.length} medicine${savedPrescItems.length !== 1 ? 's' : ''}`}
                  {savedLabItems.filter(i => i.status === 1).length > 0 && ` · ${savedLabItems.filter(i => i.status === 1).length} lab item${savedLabItems.filter(i => i.status === 1).length !== 1 ? 's' : ''}`}
                </span>
              </div>

              {/* Error banner */}
              {error && (
                <div className="error-banner">
                  <FiAlertCircle size={13} />
                  <span>{error?.message || String(error)}</span>
                  <button onClick={() => setError(null)}><FiX size={12} /></button>
                </div>
              )}

              <div className="panels">

                {/* ── Panel 1: Consultation Notes ── */}
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
                          <div className="snapshot-row"><span className="snapshot-label">Symptoms</span><span>{consultation.symptoms}</span></div>
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
                        <textarea className="form-textarea form-textarea--lg" rows={9}
                          value={consultationNotes} onChange={e => setConsultationNotes(e.target.value)}
                          placeholder="Consultation notes…" />
                      </div>
                      <div className="form-group">
                        <label className="form-label form-label--opt">Treatment Plan <span className="opt">(optional)</span></label>
                        <textarea className="form-textarea" rows={3}
                          value={treatmentPlan} onChange={e => setTreatmentPlan(e.target.value)}
                          placeholder="Treatment plan…" />
                      </div>
                      <div className="form-group">
                        <label className="form-label form-label--opt">Next Visit Date <span className="opt">(optional)</span></label>
                        <input type="date" className="form-input"
                          value={nextConsultationDate} onChange={e => setNextConsultationDate(e.target.value)} />
                      </div>
                      {consultDataChanged && (
                        <div className="consult-update-bar">
                          <span className="consult-update-bar__hint"><FiAlertCircle size={12} /> Unsaved changes</span>
                          <button className="consult-update-bar__btn" onClick={handleUpdateConsult} disabled={updatingConsult}>
                            {updatingConsult
                              ? <><span className="spin-sm spin-sm--teal" /> Updating…</>
                              : <><FiSave size={13} /> Save Changes</>}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* ── Panel 2: Prescription + Lab — DROP ZONE for Panel 3 → 2 ── */}
                <section
                  className={`panel panel--2 ${panel2DragOver ? 'panel--drop-add-active' : ''}`}
                  onDragEnter={handlePanel2DragEnter}
                  onDragOver={handlePanel2DragOver}
                  onDragLeave={handlePanel2DragLeave}
                  onDrop={handlePanel2Drop}
                >
                  <div className="panel__head">
                    <span className="panel__num panel__num--2">2</span>
                    <h3 className="panel__title">Prescription</h3>
                    {(savedPrescItems.length + containers.length) > 0 && (
                      <span className="panel__count">{savedPrescItems.length + containers.length}</span>
                    )}
                    {savedPrescItems.length > 0 && <span className="panel__saved"><FiCheck size={10} /> Saved</span>}
                  </div>
                  <div className={`panel__body ${panel2DragOver ? 'panel__body--droptarget' : ''}`}>

                    {/* Saved prescription items */}
                    {savedPrescItems.length > 0 && (
                      <div className="saved-presc-list">
                        {savedPrescItems.map(item => (
                          <SavedMedicineCard
                            key={item.id} item={item}
                            clinicId={clinicId} branchId={branchId}
                            onUpdated={handlePrescItemUpdated}
                            onDeleted={handlePrescItemDeleted}
                            onError={setError}
                            onDragStart={handleSavedCardDragStart}
                            onDragEnd={handleSavedCardDragEnd}
                          />
                        ))}
                      </div>
                    )}

                    {/* Pending new medicine containers */}
                    {containers.length > 0 && (
                      <div className="rx-list">
                        {containers.map(c => (
                          <MedicineContainer
                            key={c.tempId} container={c}
                            onUpdate={updateContainer} onRemove={removeContainer}
                            isDropFlash={dropFlashId === c.tempId}
                          />
                        ))}
                      </div>
                    )}

                    {savedPrescItems.length === 0 && containers.length === 0 && (
                      <div className="panel-empty">
                        <div className="panel-empty__icon"><FiPackage size={28} /></div>
                        <p>No medicines prescribed</p>
                        <span>Drag from the list → or click Add below</span>
                      </div>
                    )}

                    <button type="button" className="btn-add-med" onClick={addBlankContainer}>
                      <FiPlus size={13} /> Add Medicine Manually
                    </button>

                    {/* Saved lab order */}
                    {savedLabItems.length > 0 && (
                      <SavedLabSection
                        labOrderId={labOrderId}
                        labItems={savedLabItems}
                        labPriorityDesc={savedLabPriorityDesc}
                        clinicId={clinicId} branchId={branchId}
                        onItemStatusChange={handleLabItemStatusChange}
                        onOrderDeleted={handleLabOrderDeleted}
                        onError={setError}
                      />
                    )}
                  </div>
                </section>

                {/* ── Panel 3: Medicine List — DROP ZONE for Panel 2 → 3 (remove) ── */}
                <section
                  className={`panel panel--3 ${panel3DragOver ? 'panel--drop-remove-active' : ''}`}
                  onDragEnter={handlePanel3DragEnter}
                  onDragOver={handlePanel3DragOver}
                  onDragLeave={handlePanel3DragLeave}
                  onDrop={handlePanel3Drop}
                >
                  <div className="panel__head">
                    <span className="panel__num panel__num--3">3</span>
                    <h3 className="panel__title">Medicine List</h3>
                    {selectedMedIds.length > 0 && (
                      <>
                        <button className="btn-add-sel" onClick={handleAddSelectedMeds}>
                          <FiPlus size={11} /> Add {selectedMedIds.length}
                        </button>
                        <button className="btn-clear-sel" onClick={() => setSelectedMedIds([])} title="Clear selection">
                          <FiX size={11} /> Clear
                        </button>
                      </>
                    )}
                  </div>
                  <div className={`panel__body ${panel3DragOver ? 'panel__body--droptarget-remove' : ''}`}>
                    <div className="med-search">
                      <FiSearch size={14} className="med-search__icon" />
                      <input type="text" className="med-search__input" value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            const q = searchQuery.toLowerCase().trim();
                            setFilteredMedicines(q
                              ? allMedicines.filter(m => m.name.toLowerCase().includes(q) || (m.genericName && m.genericName.toLowerCase().includes(q)))
                              : allMedicines);
                          }
                        }}
                        placeholder="Search by name or generic…" />
                      {searchQuery && (
                        <button className="med-search__clear" onClick={() => { setSearchQuery(''); setFilteredMedicines(allMedicines); }}>
                          <FiX size={12} />
                        </button>
                      )}
                    </div>

                    <div className="med-list">
                      {loadingMeds ? (
                        <div className="state-loading state-loading--sm"><div className="spin-sm" /><span>Loading…</span></div>
                      ) : filteredMedicines.length === 0 ? (
                        <div className="state-empty state-empty--sm"><p>No medicines found</p></div>
                      ) : filteredMedicines.map(m => {
                        const isSelected   = selectedMedIds.includes(m.id);
                        const alreadyAdded = containers.some(c => c.medicineId === m.id)
                          || savedPrescItems.some(item => item.medicineId === m.id);
                        const isDraggingThis = draggingMedItemId === m.id;

                        return (
                          <div
                            key={m.id}
                            className={`med-item
                              ${isSelected   ? 'med-item--sel'      : ''}
                              ${alreadyAdded ? 'med-item--added'    : ''}
                              ${isDraggingThis ? 'med-item--dragging' : ''}
                            `}
                            draggable={!alreadyAdded}
                            onDragStart={e => !alreadyAdded && handleMedItemDragStart(e, m)}
                            onDragEnd={handleMedItemDragEnd}
                            onClick={() => !alreadyAdded && toggleMedSelection(m.id)}
                          >
                            <span className="med-item__drag" title="Drag to prescription">
                            </span>
                            <input type="checkbox" className="med-item__chk"
                              checked={isSelected || alreadyAdded} readOnly disabled={alreadyAdded}
                              onChange={() => {}} />
                            <div className="med-item__info">
                              <span className="med-item__name">{m.name}</span>
                              <div className="med-item__tags">
                                {m.genericName && <span className="tag">{m.genericName}</span>}
                                {m.dosageForm  && <span className="tag">{m.dosageForm}</span>}
                                {alreadyAdded  && <span className="tag tag--added">Added</span>}
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

        {/* ── PROGRESS MODAL ── */}
        {submitProgress && (
          <div className="progress-overlay">
            <div className="progress-modal">
              <div className={`progress-modal__head ${submitProgress.done ? 'progress-modal__head--done' : ''}`}>
                {submitProgress.done ? <><FiCheckCircle size={18} /> Done!</> : <><span className="spin-sm" /> Processing…</>}
              </div>
              <div className="progress-modal__body">
                {submitProgress.steps.map((step, i) => {
                  const state = i < submitProgress.currentStep ? 'done' : i === submitProgress.currentStep ? 'active' : 'wait';
                  return (
                    <div key={i} className={`pstep pstep--${state}`}>
                      <div className="pstep__icon">
                        {state === 'done' ? <FiCheck size={13} /> : state === 'active' ? <span className="spin-sm" /> : i + 1}
                      </div>
                      <span className="pstep__label">{step.label}</span>
                    </div>
                  );
                })}
                {submitProgress.done && <p className="progress-done">All changes saved successfully!</p>}
              </div>
            </div>
          </div>
        )}

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
                    {[['Mobile', patientDetails.mobile], ['Alt Mobile', patientDetails.altMobile], ['Email', patientDetails.email],
                      ['Birth Date', patientDetails.birthDate ? formatDate(patientDetails.birthDate) : null],
                      ['Marital Status', patientDetails.maritalStatusDesc], ['Emergency Contact', patientDetails.emergencyContactNo],
                    ].filter(([, v]) => v).map(([label, val]) => (
                      <div key={label} className="pt-cell"><label>{label}</label><span>{val}</span></div>
                    ))}
                    {patientDetails.address && <div className="pt-cell pt-cell--full"><label>Address</label><span>{patientDetails.address}</span></div>}
                    {patientDetails.familyPatientId && (
                      <div className="pt-cell pt-cell--full pt-cell--family">
                        <label><FiUsers size={10} /> Family Patient</label>
                        {loadingFamilyData ? (
                          <div className="pt-family-loading"><span className="spin-sm spin-sm--teal" /> Fetching…</div>
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
                    {patientDetails.allergies && <div className="pt-cell pt-cell--full pt-cell--alert"><label><FiAlertCircle size={10} /> Allergies</label><span>{patientDetails.allergies}</span></div>}
                    {patientDetails.existingMedicalConditions && <div className="pt-cell pt-cell--full"><label>Medical Conditions</label><span>{patientDetails.existingMedicalConditions}</span></div>}
                    {patientDetails.currentMedications && <div className="pt-cell pt-cell--full"><label>Current Medications</label><span>{patientDetails.currentMedications}</span></div>}
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
                <div className="pt-hero__avatar pt-hero__avatar--family">{familyPatientDetails.patientName?.charAt(0).toUpperCase() || 'F'}</div>
                <div>
                  <h3 className="pt-hero__name">{familyPatientDetails.patientName}</h3>
                  <div className="pt-hero__chips">
                    {familyPatientDetails.fileNo && <span className="chip">{familyPatientDetails.fileNo}</span>}
                    {familyPatientDetails.genderDesc && <span className="chip">{familyPatientDetails.genderDesc}</span>}
                    {familyPatientDetails.age && <span className="chip">{familyPatientDetails.age} yrs</span>}
                    {familyPatientDetails.bloodGroupDesc && <span className="chip chip--blood"><FiDroplet size={9} /> {familyPatientDetails.bloodGroupDesc}</span>}
                    <span className="chip chip--family"><FiUsers size={9} /> Family Member</span>
                  </div>
                </div>
              </div>
              <div className="pt-grid">
                {[['Mobile', familyPatientDetails.mobile], ['Alt Mobile', familyPatientDetails.altMobile],
                  ['Email', familyPatientDetails.email], ['Birth Date', familyPatientDetails.birthDate ? formatDate(familyPatientDetails.birthDate) : null],
                  ['Marital Status', familyPatientDetails.maritalStatusDesc], ['Emergency Contact', familyPatientDetails.emergencyContactNo],
                ].filter(([, v]) => v).map(([label, val]) => (
                  <div key={label} className="pt-cell"><label>{label}</label><span>{val}</span></div>
                ))}
                {familyPatientDetails.address && <div className="pt-cell pt-cell--full"><label>Address</label><span>{familyPatientDetails.address}</span></div>}
                {familyPatientDetails.allergies && <div className="pt-cell pt-cell--full pt-cell--alert"><label><FiAlertCircle size={10} /> Allergies</label><span>{familyPatientDetails.allergies}</span></div>}
                {familyPatientDetails.existingMedicalConditions && <div className="pt-cell pt-cell--full"><label>Medical Conditions</label><span>{familyPatientDetails.existingMedicalConditions}</span></div>}
                {familyPatientDetails.currentMedications && <div className="pt-cell pt-cell--full"><label>Current Medications</label><span>{familyPatientDetails.currentMedications}</span></div>}
              </div>
            </div>
          </div>
        )}

        {/* ── LAB MODAL ── */}
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
                {/* Tests */}
                <div className="lab-col">
                  <div className="lab-col__head">
                    <FiActivity size={12} /> Lab Tests
                    {newTestCount > 0 && <span className="lab-col__cnt">{newTestCount} selected</span>}
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
                          const id = t.id || t.testId;
                          const sel = selectedTestIds.includes(id);
                          const frozen = submittedLabTestIds.includes(id);
                          const deactivated = deactivatedLabTestIds.includes(id);
                          const savedItem = savedLabItems.find(s => s.testId === id || s.testID === id);
                          return (
                            <label key={id}
                              className={`lab-item ${frozen ? 'lab-item--frozen' : deactivated ? 'lab-item--deactivated' : sel ? 'lab-item--sel' : ''}`}
                              onClick={e => {
                                if (frozen && savedItem) { e.preventDefault(); setConfirmRemoveLabId({ itemId: savedItem.itemId, name: getLabName(t) }); }
                                else if (deactivated && savedItem) { e.preventDefault(); setReactivateConfirm({ itemId: savedItem.itemId, name: getLabName(t), testId: id, pkgId: 0 }); }
                              }}
                            >
                              <input type="checkbox" checked={frozen || sel} disabled={frozen || deactivated}
                                onChange={() => { if (!frozen && !deactivated) setSelectedTestIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); }} />
                              <span className="lab-item__name">
                                {getLabName(t) || 'Unknown'}
                                {frozen      && <span className="lab-item__saved-tag"><FiCheck size={8} /> Saved</span>}
                                {deactivated && <span className="lab-item__deact-tag"><FiX size={8} /> Inactive</span>}
                              </span>
                              {(t.fees || t.Fees) && <span className="lab-item__fee">₹{t.fees || t.Fees}</span>}
                              {frozen      && <span className="lab-item__remove-hint"><FiX size={9} /></span>}
                              {deactivated && <span className="lab-item__reactivate-hint"><FiRefreshCw size={9} /></span>}
                            </label>
                          );
                        })}
                  </div>
                </div>

                {/* Packages */}
                <div className="lab-col">
                  <div className="lab-col__head">
                    <FiPackage size={12} /> Packages
                    {newPkgCount > 0 && <span className="lab-col__cnt">{newPkgCount} selected</span>}
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
                          const id = p.id || p.packageId;
                          const sel = selectedPkgIds.includes(id);
                          const frozen = submittedLabPkgIds.includes(id);
                          const deactivated = deactivatedLabPkgIds.includes(id);
                          const savedItem = savedLabItems.find(s => s.packageId === id || s.packageID === id);
                          return (
                            <label key={id}
                              className={`lab-item ${frozen ? 'lab-item--frozen' : deactivated ? 'lab-item--deactivated' : sel ? 'lab-item--sel' : ''}`}
                              onClick={e => {
                                if (frozen && savedItem) { e.preventDefault(); setConfirmRemoveLabId({ itemId: savedItem.itemId, name: getPkgName(p) }); }
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

              <div className="lab-footer">
                <button className="lab-footer__cancel" onClick={() => setShowLabModal(false)}><FiX size={12} /> Cancel</button>
                <button className="lab-footer__save" onClick={handleSaveLabItems}>
                  <FiCheck size={13} />
                  {(newTestCount + newPkgCount) > 0
                    ? `Submit ${newTestCount + newPkgCount} Item${(newTestCount + newPkgCount) !== 1 ? 's' : ''}`
                    : 'Done'}
                </button>
              </div>

              {reactivateConfirm && (
                <div className="lab-remove-confirm-overlay" onClick={() => setReactivateConfirm(null)}>
                  <div className="lab-remove-confirm lab-remove-confirm--reactivate" onClick={e => e.stopPropagation()}>
                    <div className="lab-remove-confirm__icon lab-remove-confirm__icon--green"><FiRefreshCw size={22} /></div>
                    <p className="lab-remove-confirm__title">Re-activate Lab Item?</p>
                    <p className="lab-remove-confirm__name">{reactivateConfirm.name}</p>
                    <p className="lab-remove-confirm__sub">This item is currently inactive. Re-activate it?</p>
                    <div className="lab-remove-confirm__btns">
                      <button className="btn-confirm-reactivate" onClick={handleReactivateLabItem} disabled={reactivating}>
                        {reactivating ? <span className="spin-sm" /> : <><FiRefreshCw size={11} /> Re-activate</>}
                      </button>
                      <button className="btn-confirm-no" onClick={() => setReactivateConfirm(null)}><FiX size={11} /> Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              {confirmRemoveLabId && (
                <div className="lab-remove-confirm-overlay" onClick={() => setConfirmRemoveLabId(null)}>
                  <div className="lab-remove-confirm" onClick={e => e.stopPropagation()}>
                    <div className="lab-remove-confirm__icon"><FiTrash2 size={22} /></div>
                    <p className="lab-remove-confirm__title">Remove Lab Item?</p>
                    <p className="lab-remove-confirm__name">{confirmRemoveLabId.name}</p>
                    <div className="lab-remove-confirm__btns">
                      <button className="btn-confirm-yes" onClick={() => handleRemoveLabItemFromModal(confirmRemoveLabId.itemId)} disabled={!!removingLabItemId}>
                        {removingLabItemId ? <span className="spin-sm" /> : <><FiCheck size={11} /> Remove</>}
                      </button>
                      <button className="btn-confirm-no" onClick={() => setConfirmRemoveLabId(null)}><FiX size={11} /> Cancel</button>
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