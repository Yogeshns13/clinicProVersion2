// src/components/AddConsultation.jsx
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  FiX, FiCalendar, FiCheck, FiSearch, FiChevronDown, FiChevronRight,
  FiUser, FiArrowLeft, FiPlus, FiFileText, FiPackage, FiMenu,
  FiActivity, FiEye, FiSave, FiEdit3, FiAlertCircle,
  FiZap, FiClock, FiRefreshCw, FiChevronUp, FiFilter
} from 'react-icons/fi';
import { getPatientVisitList, getPatientsList } from '../api/api.js';
import { addConsultation, updateConsultation, getConsultationList } from '../api/api-consultation.js';
import { addPrescription, addPrescriptionDetail, getMedicineMasterList, getPrescriptionList, getPrescriptionDetailList } from '../api/api-pharmacy.js';
import { addLabTestOrder, addLabTestOrderItem, getLabTestMasterList, getLabTestPackageList, getLabTestOrderList, getLabTestOrderItemList } from '../api/api-labtest.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import './AddConsultation.css';

/* ─── Constants ───────────────────────────────────── */
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
  { id: 1, label: 'Routine', icon: FiClock },
  { id: 2, label: 'Urgent', icon: FiAlertCircle },
  { id: 3, label: 'Stat', icon: FiZap },
];

/* ─── Helpers ─────────────────────────────────────── */
const generateTempId = () => Date.now() + Math.random();
const createContainer = (medicine = null) => ({
  tempId: generateTempId(),
  medicineId: medicine?.id || 0,
  medicineName: medicine?.name || '',
  form: medicine?.type || 0,
  strength: medicine?.dosageForm || '',
  defaultRoute: medicine?.defaultRoute || 1,
  timings: [], foodTiming: 0, days: '', dosePerIntake: '',
  quantity: 0, notes: '', refillAllowed: 0, refillCount: 0, expanded: true,
});
const calcQuantity = (days, timings) => { const d = parseInt(days) || 0; return d > 0 && timings.length > 0 ? d * timings.length : 0; };
const buildFrequency = (timings) => timings.length ? timings.map(c => TIMING_OPTIONS.find(t => t.code === c)?.full).join('-') : '';
const formatDate = (ds) => { if (!ds) return '—'; return new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
const formatTime = (ts) => { if (!ts) return '—'; const [h, m] = ts.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`; };
const today = () => new Date().toISOString().split('T')[0];
const thirtyDaysLater = () => new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

/* ─── MedicineContainer ───────────────────────────── */
const MedicineContainer = ({ container, onUpdate, onRemove }) => {
  const toggleTiming = (code) => {
    const timings = container.timings.includes(code) ? container.timings.filter(c => c !== code) : [...container.timings, code];
    onUpdate(container.tempId, { timings, quantity: calcQuantity(container.days, timings) });
  };
  const handleDays = (val) => onUpdate(container.tempId, { days: val, quantity: calcQuantity(val, container.timings) });

  return (
    <div className={`med-container ${container.expanded ? 'expanded' : 'collapsed'}`}>
      <div className="med-container-header">
        <button type="button" className={`med-toggle-btn ${container.expanded ? 'open' : 'closed'}`}
          onClick={() => onUpdate(container.tempId, { expanded: !container.expanded })}>
          {container.expanded ? <FiChevronUp size={11} /> : <FiChevronDown size={11} />}
        </button>
        <span className="med-name-label">
          {container.medicineName || <em className="med-unassigned">Unassigned</em>}
        </span>
        {container.quantity > 0 && !container.expanded && <span className="med-qty-pill">Qty {container.quantity}</span>}
        <button type="button" className="med-remove-btn" onClick={() => onRemove(container.tempId)}><FiX size={11} /></button>
      </div>
      {container.expanded && (
        <div className="med-container-body">
          {!container.medicineId && (
            <div className="med-field-row">
              <label className="med-label">Medicine *</label>
              <input type="text" className="med-input" value={container.medicineName}
                onChange={e => onUpdate(container.tempId, { medicineName: e.target.value })} placeholder="Medicine name..." />
            </div>
          )}
          {/* Timing — full width */}
          <div className="med-field-row">
            <label className="med-label">Timing</label>
            <div className="timing-btn-group">
              {TIMING_OPTIONS.map(t => (
                <button key={t.code} type="button" title={t.full}
                  className={`timing-btn ${container.timings.includes(t.code) ? 'active' : ''}`}
                  onClick={() => toggleTiming(t.code)}>{t.code}</button>
              ))}
            </div>
          </div>
          {/* Food — full width */}
          <div className="med-field-row">
            <label className="med-label">Food</label>
            <div className="food-btn-group">
              {FOOD_OPTIONS.map(f => (
                <button key={f.id} type="button"
                  className={`food-btn ${container.foodTiming === f.id ? 'active' : ''}`}
                  onClick={() => onUpdate(container.tempId, { foodTiming: f.id })}>{f.label}</button>
              ))}
            </div>
          </div>
          {/* Dose / Days / Qty — single full-width line */}
          <div className="med-numbers-row">
            <div className="med-num-field">
              <label className="med-label">Dose *</label>
              <input type="text" className="med-input" value={container.dosePerIntake}
                onChange={e => onUpdate(container.tempId, { dosePerIntake: e.target.value })} placeholder="1 tab" />
            </div>
            <div className="med-num-field">
              <label className="med-label">Days</label>
              <input type="number" className="med-input" value={container.days}
                onChange={e => handleDays(e.target.value)} placeholder="7" min="1" />
            </div>
            <div className="med-num-field">
              <label className="med-label">Qty</label>
              <input type="number" className="med-input med-qty-display" value={container.quantity}
                onChange={e => onUpdate(container.tempId, { quantity: Number(e.target.value) })} placeholder="0" min="0" step="0.5" />
            </div>
          </div>
          <div className="med-field-row">
            <label className="med-label">Notes</label>
            <textarea className="med-input med-textarea" value={container.notes} rows={2}
              onChange={e => onUpdate(container.tempId, { notes: e.target.value })} placeholder="Additional instructions..." />
          </div>
          <div className="med-refill-row">
            <label className="med-check-label">
              <input type="checkbox" className="med-checkbox" checked={container.refillAllowed === 1}
                onChange={e => onUpdate(container.tempId, { refillAllowed: e.target.checked ? 1 : 0, refillCount: e.target.checked ? container.refillCount : 0 })} />
              <span>Refill Allowed</span>
            </label>
            {container.refillAllowed === 1 && (
              <div className="med-refill-count">
                <label className="med-label">Count</label>
                <input type="number" className="med-input" style={{ width: 52 }} value={container.refillCount}
                  onChange={e => onUpdate(container.tempId, { refillCount: Number(e.target.value) })} min="1" max="12" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Main Component ──────────────────────────────── */
const AddConsultation = ({ isOpen, onClose, onSuccess, preSelectedVisitId = null }) => {

  /* ── UI state ── */
  const [visitStep, setVisitStep] = useState(1);
  const [todayVisits, setTodayVisits] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ── Consultation form ── */
  const [consultationNotes, setConsultationNotes] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [nextConsultationDate, setNextConsultationDate] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [consultationId, setConsultationId] = useState(null);
  const [prescriptionId, setPrescriptionId] = useState(null);
  const [consultSaved, setConsultSaved] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  /* ── Prescription / Medicines ── */
  const [containers, setContainers] = useState([]);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmedSuccess, setConfirmedSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [allMedicines, setAllMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingMeds, setLoadingMeds] = useState(false);
  const [selectedMedIds, setSelectedMedIds] = useState([]);
  const dragMedIdRef = useRef(null);

  /* ── Patient modal ── */
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [patientDetails, setPatientDetails] = useState(null);
  const [loadingPatient, setLoadingPatient] = useState(false);

  /* ── Lab Order modal ── */
  const [showLabModal, setShowLabModal] = useState(false);
  const [labPriority, setLabPriority] = useState(1);
  const [labOrderStep, setLabOrderStep] = useState('confirm'); // 'confirm' | 'items'
  const [labOrderId, setLabOrderId] = useState(null);
  const [labMasterItems, setLabMasterItems] = useState([]);
  const [labPackages, setLabPackages] = useState([]);
  const [selectedTestIds, setSelectedTestIds] = useState([]);
  const [selectedPkgIds, setSelectedPkgIds] = useState([]);
  const [labLoading, setLabLoading] = useState(false);
  const [labItemsLoading, setLabItemsLoading] = useState(false);
  const [labTestSearch, setLabTestSearch] = useState('');
  const [labPkgSearch, setLabPkgSearch] = useState('');
  const [labDone, setLabDone] = useState(false);

  /* ── History strip ── */
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');

  /* ── History Detail modal ── */
  const [showViewDetail, setShowViewDetail] = useState(false);
  const [viewDetail, setViewDetail] = useState(null);
  const [viewDetailLoading, setViewDetailLoading] = useState(false);

  const [error, setError] = useState(null);

  /* ─── Effects ─── */
  useEffect(() => {
    if (isOpen) document.body.classList.add('consultation-open');
    else document.body.classList.remove('consultation-open');
    return () => document.body.classList.remove('consultation-open');
  }, [isOpen]);

  useEffect(() => { if (isOpen) fetchTodayVisits(); }, [isOpen]);

  useEffect(() => {
    if (isOpen && preSelectedVisitId && todayVisits.length > 0) {
      const v = todayVisits.find(v => v.id === preSelectedVisitId);
      if (v) { setSelectedVisit(v); setVisitStep(2); }
    }
  }, [isOpen, preSelectedVisitId, todayVisits]);

  useEffect(() => { if (prescriptionId) fetchMedicines(); }, [prescriptionId]);

  useEffect(() => {
    if (visitStep === 2 && selectedVisit?.patientId) {
      fetchPatientHistory();
      fetchPatientDetails(selectedVisit.patientId);
    }
  }, [visitStep, selectedVisit]);

  useEffect(() => {
    if (visitStep === 2 && selectedVisit?.patientId) fetchPatientHistory();
  }, [historyFrom, historyTo]);

  /* ─── Fetch helpers ─── */
  const getIds = () => ({
    clinicId: Number(localStorage.getItem('clinicID')),
    branchId: Number(localStorage.getItem('branchID')),
  });

  const fetchTodayVisits = async () => {
    try { setLoading(true); setError(null);
      const { clinicId, branchId } = getIds();
      const visits = await getPatientVisitList(clinicId, { Page: 1, PageSize: 50, BranchID: branchId, VisitDate: today() });
      setTodayVisits(visits);
    } catch (err) { setError(err); } finally { setLoading(false); }
  };

  const fetchMedicines = async () => {
    try { setLoadingMeds(true);
      const { clinicId, branchId } = getIds();
      const meds = await getMedicineMasterList(clinicId, { BranchID: branchId, PageSize: 200, Status: 1 });
      setAllMedicines(meds); setFilteredMedicines(meds);
    } catch (err) { console.error(err); } finally { setLoadingMeds(false); }
  };

  const fetchPatientDetails = async (patientId) => {
    try { setLoadingPatient(true); setError(null);
      const { clinicId, branchId } = getIds();
      const pts = await getPatientsList(clinicId, { Page: 1, PageSize: 1, BranchID: branchId, PatientID: patientId, Status: 1 });
      setPatientDetails(pts?.[0] || null);
    } catch (err) { setError(err); } finally { setLoadingPatient(false); }
  };

  const fetchPatientHistory = async () => {
    if (!selectedVisit?.patientId) return;
    try { setHistoryLoading(true);
      const { clinicId, branchId } = getIds();
      const list = await getConsultationList(clinicId, {
        Page: 1, PageSize: 50, BranchID: branchId,
        PatientID: selectedVisit.patientId,
        FromDate: historyFrom || '', ToDate: historyTo || '',
      });
      setHistoryList(list || []);
    } catch (err) { console.error(err); } finally { setHistoryLoading(false); }
  };

  const fetchViewDetail = async (consultId) => {
    try {
      setViewDetailLoading(true); setShowViewDetail(true); setViewDetail(null);
      const { clinicId, branchId } = getIds();

      // Fetch consultation detail, prescriptions, lab orders in parallel
      const [consultList, prescList, labOrders] = await Promise.all([
        getConsultationList(clinicId, { ConsultationID: consultId, BranchID: branchId, Page: 1, PageSize: 1 }),
        getPrescriptionList(clinicId, { ConsultationID: consultId, BranchID: branchId, Page: 1, PageSize: 5 }),
        getLabTestOrderList(clinicId, { ConsultationID: consultId, BranchID: branchId, Page: 1, PageSize: 10 }),
      ]);

      const consult = consultList?.[0] || null;
      const prescription = prescList?.[0] || null;

      // Fetch prescription items and lab order items in parallel
      const [prescItems, labItems] = await Promise.all([
        prescription?.id
          ? getPrescriptionDetailList(clinicId, { PrescriptionID: prescription.id, BranchID: branchId, Page: 1, PageSize: 50 })
          : Promise.resolve([]),
        labOrders?.length > 0
          ? getLabTestOrderItemList(clinicId, { OrderID: labOrders[0].id, BranchID: branchId, Page: 1, PageSize: 50 })
          : Promise.resolve([]),
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
      setLabMasterItems(masters || []);
      setLabPackages(pkgs || []);
    } catch (err) { console.error(err); } finally { setLabItemsLoading(false); }
  };

  /* ─── Consultation handlers ─── */
  const handleVisitSelect = (v) => { setSelectedVisit(v); setVisitStep(2); };

  const handleConsultationSubmit = async (e) => {
    e.preventDefault();
    if (!consultationNotes.trim()) { setError({ message: 'Consultation Notes are required' }); return; }
    if (!selectedVisit) { setError({ message: 'No visit selected' }); return; }

    if (consultationId) {
      // UPDATE MODE
      try {
        setSubmitLoading(true); setError(null);
        const { clinicId } = getIds();
        await updateConsultation({
          consultationId, clinicId,
          reason: selectedVisit.reason || '',
          symptoms: selectedVisit.symptoms || '',
          bpSystolic: selectedVisit.bpSystolic ?? 0,
          bpDiastolic: selectedVisit.bpDiastolic ?? 0,
          temperature: selectedVisit.temperature ?? 0,
          weight: selectedVisit.weight ?? 0,
          emrNotes: '', ehrNotes: '', instructions: '',
          consultationNotes: consultationNotes.trim(),
          nextConsultationDate: nextConsultationDate || '',
          treatmentPlan: treatmentPlan.trim(),
        });
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 3000);
      } catch (err) { setError(err); } finally { setSubmitLoading(false); }
      return;
    }

    // CREATE MODE
    try {
      setSubmitLoading(true); setError(null);
      const { clinicId, branchId } = getIds();

      const consultResult = await addConsultation({
        clinicId, branchId, visitId: selectedVisit.id, patientId: selectedVisit.patientId, doctorId: selectedVisit.doctorId,
        reason: selectedVisit.reason || '', symptoms: selectedVisit.symptoms || '',
        bpSystolic: selectedVisit.bpSystolic ?? null, bpDiastolic: selectedVisit.bpDiastolic ?? null,
        temperature: selectedVisit.temperature ?? null, weight: selectedVisit.weight ?? null,
        emrNotes: '', ehrNotes: '', instructions: '',
        consultationNotes: consultationNotes.trim(),
        nextConsultationDate: nextConsultationDate || '',
        treatmentPlan: treatmentPlan.trim(),
      });
      if (!consultResult.success || !consultResult.consultationId) throw new Error('Failed to create consultation');
      const newConsultId = consultResult.consultationId;
      setConsultationId(newConsultId);
      setConsultSaved(true);

      const consultDetails = await getConsultationList(clinicId, { Page: 1, PageSize: 1, BranchID: branchId, ConsultationID: newConsultId });
      const detail = consultDetails?.[0];

      const prescResult = await addPrescription({
        clinicId, branchId, ConsultationID: newConsultId,
        VisitID: detail?.visitId ?? selectedVisit.id,
        PatientID: detail?.patientId ?? selectedVisit.patientId,
        DoctorID: detail?.doctorId ?? selectedVisit.doctorId,
        DateIssued: today(), ValidUntil: thirtyDaysLater(),
        Diagnosis: null, Notes: detail?.consultationNotes || null,
        IsRepeat: 0, RepeatCount: 0,
        CreatedBy: detail?.doctorId ?? selectedVisit.doctorId,
      });
      if (!prescResult.success || !prescResult.prescriptionId) throw new Error('Failed to create prescription');
      setPrescriptionId(prescResult.prescriptionId);
      fetchPatientHistory();
    } catch (err) { setError(err); } finally { setSubmitLoading(false); }
  };

  /* ─── Medicine container handlers ─── */
  const updateContainer = (tempId, changes) => setContainers(prev => prev.map(c => c.tempId === tempId ? { ...c, ...changes } : c));
  const removeContainer = (tempId) => setContainers(prev => prev.filter(c => c.tempId !== tempId));
  const addBlankContainer = () => setContainers(prev => [...prev, createContainer()]);

  const handleSearch = () => {
    const q = searchQuery.toLowerCase().trim();
    setFilteredMedicines(q ? allMedicines.filter(m => m.name.toLowerCase().includes(q) || (m.genericName && m.genericName.toLowerCase().includes(q))) : allMedicines);
  };
  const toggleMedSelection = (id) => setSelectedMedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const handleAddSelectedMeds = () => {
    if (!selectedMedIds.length) return;
    setContainers(prev => [...prev, ...selectedMedIds.map(id => createContainer(allMedicines.find(m => m.id === id)))]);
    setSelectedMedIds([]);
  };

  const handleDragStart = (e, medId) => { dragMedIdRef.current = medId; e.dataTransfer.effectAllowed = 'copy'; e.dataTransfer.setData('text/plain', String(medId)); };
  const handleDragEnd = () => { dragMedIdRef.current = null; };
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragOver(false);
    const id = Number(e.dataTransfer.getData('text/plain') || dragMedIdRef.current);
    if (!id) return;
    const med = allMedicines.find(m => m.id === id);
    if (!med || containers.some(c => c.medicineId === id)) return;
    setContainers(prev => [...prev, createContainer(med)]);
  };

  const handleConfirmMedicines = async () => {
    if (!prescriptionId) { setError({ message: 'No prescription found' }); return; }
    if (!containers.length) { setError({ message: 'Add at least one medicine' }); return; }
    for (const c of containers) {
      if (!c.medicineName.trim()) { setError({ message: 'All medicines need a name' }); return; }
      if (!c.dosePerIntake.trim()) { setError({ message: `Dose required for ${c.medicineName}` }); return; }
      if (c.quantity <= 0) { setError({ message: `Quantity > 0 required for ${c.medicineName}` }); return; }
    }
    try {
      setConfirmLoading(true); setError(null);
      const { clinicId, branchId } = getIds();
      for (const c of containers) {
        await addPrescriptionDetail({
          clinicId, branchId, PrescriptionID: prescriptionId,
          MedicineID: c.medicineId, MedicineName: c.medicineName, Form: c.form, Strength: c.strength,
          Dosage: c.dosePerIntake, Frequency: buildFrequency(c.timings),
          Duration: c.days ? `${c.days} Days` : '', Route: c.defaultRoute, FoodTiming: c.foodTiming,
          Instructions: c.notes, Quantity: c.quantity, RefillAllowed: c.refillAllowed,
          RefillCount: c.refillCount, StartDate: '', EndDate: '',
        });
      }
      setConfirmedSuccess(true);
    } catch (err) { setError(err); } finally { setConfirmLoading(false); }
  };

  /* ─── Lab Order handlers ─── */
  const handleOpenLabModal = () => {
    if (!consultationId) return;
    setLabPriority(1); setLabOrderStep('confirm');
    setLabOrderId(null); setSelectedTestIds([]); setSelectedPkgIds([]);
    setLabDone(false); setLabTestSearch(''); setLabPkgSearch('');
    setShowLabModal(true);
  };

  const handleLabOrderCreate = async () => {
    if (!consultationId) return;
    try {
      setLabLoading(true); setError(null);
      const { clinicId, branchId } = getIds();
      const result = await addLabTestOrder({
        clinicId, branchId,
        ConsultationID: consultationId,
        VisitID: selectedVisit.id,
        PatientID: selectedVisit.patientId,
        doctorId: selectedVisit.doctorId,
        priority: labPriority,
        Notes: consultationNotes,
      });
      if (!result.success) throw new Error('Failed to create lab order');
      setLabOrderId(result.orderId);
      setLabOrderStep('items');
      await fetchLabItems();
    } catch (err) { setError(err); } finally { setLabLoading(false); }
  };

  const handleLabItemsSubmit = async () => {
    if (!labOrderId) return;
    if (!selectedTestIds.length && !selectedPkgIds.length) { setError({ message: 'Select at least one test or package' }); return; }
    try {
      setLabLoading(true); setError(null);
      const { clinicId, branchId } = getIds();
      for (const testId of selectedTestIds) {
        await addLabTestOrderItem({ clinicId, branchId, OrderID: labOrderId, PatientID: selectedVisit.patientId, DoctorID: selectedVisit.doctorId, TestID: testId, PackageID: 0 });
      }
      for (const pkgId of selectedPkgIds) {
        await addLabTestOrderItem({ clinicId, branchId, OrderID: labOrderId, PatientID: selectedVisit.patientId, DoctorID: selectedVisit.doctorId, TestID: 0, PackageID: pkgId });
      }
      setLabDone(true);
      setTimeout(() => { setShowLabModal(false); setLabDone(false); }, 2000);
    } catch (err) { setError(err); } finally { setLabLoading(false); }
  };

  /* ─── Complete & Close ─── */
  const handleComplete = () => { handleClose(); if (onSuccess) onSuccess(); };
  const handleClose = () => {
    setVisitStep(1); setSelectedVisit(null); setTodayVisits([]);
    setConsultationNotes(''); setTreatmentPlan(''); setNextConsultationDate('');
    setConsultationId(null); setPrescriptionId(null); setConsultSaved(false); setUpdateSuccess(false);
    setContainers([]); setAllMedicines([]); setFilteredMedicines([]);
    setSearchQuery(''); setSelectedMedIds([]);
    setPatientDetails(null); setShowPatientModal(false);
    setShowLabModal(false); setLabOrderId(null); setLabDone(false);
    setHistoryList([]); setHistoryFrom(''); setHistoryTo('');
    setShowViewDetail(false); setViewDetail(null);
    setConfirmedSuccess(false); setIsDragOver(false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;
  const panelsActive = !!prescriptionId;

  const getLabName = (t) => t?.name || t?.testName || t?.test_name || t?.TestName || '';
  const getPkgName  = (p) => p?.name || p?.packageName || p?.package_name || p?.PackageName || '';
  const filteredTests = labMasterItems.filter(t => !labTestSearch || getLabName(t).toLowerCase().includes(labTestSearch.toLowerCase()));
  const filteredPkgs = labPackages.filter(p => !labPkgSearch || getPkgName(p).toLowerCase().includes(labPkgSearch.toLowerCase()));

  return ReactDOM.createPortal(
    <div className="ac-overlay">
      <div className="ac-modal">

        {/* ── HEADER ── */}
        <div className="ac-header">
          <div className="ac-header-left">
            {visitStep === 2 && !consultationId && (
              <button className="ac-back-btn" onClick={() => { setVisitStep(1); setSelectedVisit(null); }}><FiArrowLeft size={15} /></button>
            )}
            <div>
              <h2 className="ac-title">{visitStep === 1 ? 'Select Patient Visit' : 'New Consultation'}</h2>
              {selectedVisit && <p className="ac-subtitle">{selectedVisit.patientName} · {selectedVisit.doctorFullName}</p>}
            </div>
          </div>
          <div className="ac-header-actions">
            {visitStep === 2 && (
              <>
                <button className="ac-nav-btn" onClick={() => { if (selectedVisit) { fetchPatientDetails(selectedVisit.patientId); setShowPatientModal(true); } }}>
                  <FiUser size={13} /> Patient
                </button>
                <button
                  className={`ac-nav-btn ac-nav-lab ${!consultationId ? 'ac-nav-disabled' : ''}`}
                  onClick={handleOpenLabModal}
                  title={!consultationId ? 'Save consultation first to create a lab order' : 'Create Lab Order'}
                >
                  <FiUser size={13} /> Lab Order
                </button>
                {consultationId && (
                  <button className="ac-nav-btn ac-nav-done" onClick={handleComplete}>
                    <FiCheck size={13} /> Done
                  </button>
                )}
              </>
            )}
            <button className="ac-close-btn" onClick={handleClose}><FiX size={19} /></button>
          </div>
        </div>

        <ErrorHandler error={error} />

        {/* ── BODY ── */}
        <div className="ac-body">

          {/* ════ VISIT SELECTION ════ */}
          {visitStep === 1 && (
            <div className="ac-visit-picker">
              {loading ? (
                <div className="ac-loading"><div className="ac-spinner" /><span>Loading today's visits...</span></div>
              ) : todayVisits.length === 0 ? (
                <div className="ac-empty"><FiCalendar size={46} /><p>No patient visits today</p><span>Add a visit first</span></div>
              ) : (
                <div className="visit-grid">
                  {todayVisits.map(v => (
                    <div key={v.id} className="visit-card" onClick={() => handleVisitSelect(v)}>
                      <div className="visit-card-top">
                        <div className="visit-avatar">{v.patientName?.charAt(0).toUpperCase() || 'P'}</div>
                        <div><div className="visit-patient">{v.patientName}</div><div className="visit-meta">{v.patientFileNo} · {v.patientMobile}</div></div>
                      </div>
                      <div className="visit-card-mid"><span className="visit-field-label">Dr.</span><span>{v.doctorFullName}</span></div>
                      <div className="visit-card-mid"><span className="visit-field-label">Time</span><span>{formatDate(v.visitDate)} at {formatTime(v.visitTime)}</span></div>
                      {v.reason && <div className="visit-card-mid"><span className="visit-field-label">Reason</span><span className="visit-reason">{v.reason}</span></div>}
                      {(v.bpReading || v.temperature || v.weight) && (
                        <div className="visit-vitals">
                          {v.bpReading && <span className="vital-chip bp">{v.bpReading}</span>}
                          {v.temperature && <span className="vital-chip temp">{v.temperature}°F</span>}
                          {v.weight && <span className="vital-chip wt">{v.weight} kg</span>}
                        </div>
                      )}
                      <button className="visit-select-btn">Select <FiCheck size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ STEP 2 WRAPPER ════ */}
          {visitStep === 2 && (
            <div className="step2-wrapper">

              {/* Patient info bar — single horizontal line under header */}
              {patientDetails && (
                <div className="patient-info-bar">
                  {patientDetails.allergies && (
                    <span className="pib-item pib-allergy">
                      <span className="pib-label">⚠ Allergies</span>
                      <span className="pib-val">{patientDetails.allergies}</span>
                    </span>
                  )}
                  {patientDetails.existingMedicalConditions && (
                    <span className="pib-item">
                      <span className="pib-label">Conditions</span>
                      <span className="pib-val">{patientDetails.existingMedicalConditions}</span>
                    </span>
                  )}
                  {patientDetails.pastSurgeries && (
                    <span className="pib-item">
                      <span className="pib-label">Surgeries</span>
                      <span className="pib-val">{patientDetails.pastSurgeries}</span>
                    </span>
                  )}
                  {patientDetails.currentMedications && (
                    <span className="pib-item">
                      <span className="pib-label">Medications</span>
                      <span className="pib-val">{patientDetails.currentMedications}</span>
                    </span>
                  )}
                  {patientDetails.familyMedicalHistory && (
                    <span className="pib-item">
                      <span className="pib-label">Family Hx</span>
                      <span className="pib-val">{patientDetails.familyMedicalHistory}</span>
                    </span>
                  )}
                  {patientDetails.immunizationRecords && (
                    <span className="pib-item">
                      <span className="pib-label">Immunization</span>
                      <span className="pib-val">{patientDetails.immunizationRecords}</span>
                    </span>
                  )}
                </div>
              )}

              {/* 3-Panel Area — takes remaining height above history */}
              <div className="panels-area">

                {/* Panel 1 — Consultation */}
                <div className="panel panel-consult">
                  <div className="panel-header panel-header-1">
                    <span className="panel-badge">1</span>
                    <h3>Consultation</h3>
                    {consultSaved && <FiCheck className="panel-done-icon" size={14} />}
                  </div>
                  <div className="panel-body">
                    {/* Saved / Update indicator */}
                    {consultSaved && (
                      <div className="consult-saved-bar">
                        {updateSuccess
                          ? <><FiRefreshCw size={12} /> Updated successfully</>
                          : <><FiCheck size={12} /> Saved — Edit below to update</>
                        }
                      </div>
                    )}

                    {/* Visit snapshot */}
                    {selectedVisit && (selectedVisit.reason || selectedVisit.symptoms || selectedVisit.bpReading) && (
                      <div className="visit-snapshot">
                        {selectedVisit.reason && <div className="snap-row"><span className="snap-label">Reason</span><span>{selectedVisit.reason}</span></div>}
                        {selectedVisit.symptoms && <div className="snap-row"><span className="snap-label">Symptoms</span><span>{selectedVisit.symptoms}</span></div>}
                        {(selectedVisit.bpReading || selectedVisit.temperature || selectedVisit.weight) && (
                          <div className="snap-vitals">
                            {selectedVisit.bpReading && <span className="vital-chip bp">{selectedVisit.bpReading}</span>}
                            {selectedVisit.temperature && <span className="vital-chip temp">{selectedVisit.temperature}°F</span>}
                            {selectedVisit.weight && <span className="vital-chip wt">{selectedVisit.weight} kg</span>}
                          </div>
                        )}
                      </div>
                    )}

                    <form onSubmit={handleConsultationSubmit} className="consult-form">
                      <div className="cf-group">
                        <label className="cf-label">Consultation Notes <span className="cf-required">*</span></label>
                        <textarea className="cf-textarea" rows={4} required value={consultationNotes}
                          onChange={e => setConsultationNotes(e.target.value)} placeholder="Enter consultation notes..." />
                      </div>
                      <div className="cf-group">
                        <label className="cf-label">Treatment Plan <span className="cf-optional">(Optional)</span></label>
                        <textarea className="cf-textarea" rows={3} value={treatmentPlan}
                          onChange={e => setTreatmentPlan(e.target.value)} placeholder="Treatment plan..." />
                      </div>
                      <div className="cf-group">
                        <label className="cf-label">Next Consultation Date <span className="cf-optional">(Optional)</span></label>
                        <input type="date" className="cf-input" value={nextConsultationDate}
                          onChange={e => setNextConsultationDate(e.target.value)} min={today()} />
                      </div>
                      <button type="submit" className="btn-add-consultation" disabled={submitLoading}>
                        {submitLoading
                          ? <><div className="btn-spinner" /> {consultationId ? 'Updating...' : 'Processing...'}</>
                          : consultationId
                            ? <><FiSave size={14} /> Update Consultation</>
                            : <><FiCheck size={14} /> Add Consultation</>
                        }
                      </button>
                    </form>

                    {/* Prescription saved indicator */}
                    {confirmedSuccess && (
                      <div className="success-done-badge" style={{ marginTop: 8 }}>
                        <FiCheck size={12} /> {containers.length} medicine(s) saved
                      </div>
                    )}
                  </div>
                </div>

                {/* Panel 2 — Prescription */}
                <div className={`panel panel-prescription ${!panelsActive ? 'panel-disabled' : ''} ${isDragOver ? 'drag-over' : ''}`}
                  onDragOver={panelsActive ? handleDragOver : undefined}
                  onDragLeave={panelsActive ? handleDragLeave : undefined}
                  onDrop={panelsActive ? handleDrop : undefined}>
                  <div className="panel-header panel-header-2">
                    <span className="panel-badge">2</span>
                    <h3>Prescription</h3>
                    {confirmedSuccess && <FiCheck className="panel-done-icon" size={14} />}
                    {!panelsActive && <span className="panel-lock">Complete Step 1 first</span>}
                  </div>
                  <div className="panel-body">
                    {!panelsActive ? (
                      <div className="panel-placeholder"><FiFileText size={32} /><p>Prescription will appear here</p></div>
                    ) : (
                      <>
                        {containers.length === 0 ? (
                          <div className="panel-placeholder"><FiPackage size={28} /><p>No medicines yet</p><span>Drag from list or click Add</span></div>
                        ) : (
                          <div className="containers-list">
                            {containers.map(c => <MedicineContainer key={c.tempId} container={c} onUpdate={updateContainer} onRemove={removeContainer} />)}
                          </div>
                        )}
                        <button type="button" className="btn-add-more" onClick={addBlankContainer}><FiPlus size={12} /> Add Manually</button>
                        {containers.length > 0 && !confirmedSuccess && (
                          <button type="button" className="btn-confirm-meds" onClick={handleConfirmMedicines} disabled={confirmLoading}>
                            {confirmLoading ? <><div className="btn-spinner" /> Saving...</> : <><FiCheck size={14} /> Confirm {containers.length} Medicine{containers.length > 1 ? 's' : ''}</>}
                          </button>
                        )}
                        {confirmedSuccess && <div className="success-done-badge"><FiCheck size={12} /> {containers.length} medicine(s) saved successfully</div>}
                      </>
                    )}
                  </div>
                </div>

                {/* Panel 3 — Medicine List */}
                <div className={`panel panel-meds ${!panelsActive ? 'panel-disabled' : ''}`}>
                  <div className="panel-header panel-header-3">
                    <span className="panel-badge">3</span>
                    <h3>Medicines</h3>
                    {!panelsActive && <span className="panel-lock">Complete Step 1 first</span>}
                  </div>
                  <div className="panel-body">
                    {!panelsActive ? (
                      <div className="panel-placeholder"><FiSearch size={32} /><p>Available after Step 1</p></div>
                    ) : (
                      <>
                        <div className="med-search-bar">
                          <input type="text" className="med-search-input" value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Search medicines..." />
                          <button type="button" className="med-search-btn" onClick={handleSearch}><FiSearch size={13} /></button>
                        </div>
                        <p className="med-drag-hint"><FiMenu size={10} /> Drag to Panel 2 or use checkboxes</p>
                        {selectedMedIds.length > 0 && (
                          <div className="med-selection-bar">
                            <span>{selectedMedIds.length} selected</span>
                            <button type="button" className="btn-add-selected-meds" onClick={handleAddSelectedMeds}><FiPlus size={11} /> Add Selected</button>
                          </div>
                        )}
                        <div className="med-list-scroll">
                          {loadingMeds ? (
                            <div className="ac-loading"><div className="ac-spinner" /><span>Loading...</span></div>
                          ) : filteredMedicines.length === 0 ? (
                            <div className="ac-empty"><p>No medicines found</p></div>
                          ) : (
                            filteredMedicines.map(m => {
                              const isSelected = selectedMedIds.includes(m.id);
                              const alreadyAdded = containers.some(c => c.medicineId === m.id);
                              return (
                                <div key={m.id} className={`med-list-item ${isSelected ? 'selected' : ''} ${alreadyAdded ? 'already-added' : ''}`}
                                  draggable={!alreadyAdded} onDragStart={e => handleDragStart(e, m.id)} onDragEnd={handleDragEnd}>
                                  {/* Row 1: handle + checkbox + name */}
                                  <div className="med-list-row1">
                                    <span className="med-drag-handle"><FiMenu size={11} /></span>
                                    <input type="checkbox" className="med-list-checkbox" checked={isSelected}
                                      onChange={() => toggleMedSelection(m.id)} onClick={e => e.stopPropagation()} />
                                    <span className="med-list-name">{m.name}</span>
                                    {alreadyAdded && <span className="med-chip added">✓</span>}
                                  </div>
                                  {/* Row 2: generic + chips */}
                                  <div className="med-list-row2">
                                    {m.genericName && <span className="med-list-generic">{m.genericName}</span>}
                                    {m.typeDesc && <span className="med-chip">{m.typeDesc}</span>}
                                    {m.dosageForm && <span className="med-chip">{m.dosageForm}</span>}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>{/* /panels-area */}

              {/* History Strip — bottom 25% horizontal */}
              <div className="history-strip">
                <div className="history-strip-header">
                  <span className="history-strip-title"><FiActivity size={13} /> Consultation History</span>
                  <div className="history-filter-row">
                    <label className="history-filter-label"><FiFilter size={10} /> From</label>
                    <input type="date" className="history-date-input" value={historyFrom} onChange={e => setHistoryFrom(e.target.value)} />
                    <label className="history-filter-label">To</label>
                    <input type="date" className="history-date-input" value={historyTo} onChange={e => setHistoryTo(e.target.value)} />
                    <button className="history-refresh-btn" onClick={fetchPatientHistory} title="Refresh"><FiRefreshCw size={11} /></button>
                  </div>
                </div>
                <div className="history-table-wrap">
                  {historyLoading ? (
                    <div className="ac-loading" style={{ padding: '16px' }}><div className="ac-spinner" /><span>Loading history...</span></div>
                  ) : historyList.length === 0 ? (
                    <div className="ac-empty" style={{ padding: '16px' }}><p>No history found</p></div>
                  ) : (
                    <table className="history-table">
                      <thead><tr><th>Date</th><th>Doctor</th><th>Reason</th><th>Notes</th><th></th></tr></thead>
                      <tbody>
                        {historyList.map(h => (
                          <tr key={h.id}>
                            <td className="ht-date">{formatDate(h.dateCreated)}</td>
                            <td className="ht-doctor">{h.doctorFullName}</td>
                            <td className="ht-reason">{h.reason || '—'}</td>
                            <td className="ht-notes">{h.consultationNotes || '—'}</td>
                            <td><button className="ht-view-btn" onClick={() => fetchViewDetail(h.id)}><FiEye size={11} /> View</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>
          )}{/* /step2-wrapper */}
        </div>{/* /ac-body */}

        {/* ════ PATIENT DETAILS MODAL ════ */}
        {showPatientModal && (
          <div className="inner-modal-overlay" onClick={() => setShowPatientModal(false)}>
            <div className="inner-modal patient-modal" onClick={e => e.stopPropagation()}>
              <div className="inner-modal-header">
                <span><FiUser size={14} /> Patient Details</span>
                <button onClick={() => setShowPatientModal(false)}><FiX size={16} /></button>
              </div>
              {loadingPatient ? (
                <div className="ac-loading"><div className="ac-spinner" /><span>Loading...</span></div>
              ) : patientDetails ? (
                <>
                  <div className="patient-detail-header">
                    <div className="pt-avatar-lg">{patientDetails.patientName?.charAt(0).toUpperCase() || 'P'}</div>
                    <div>
                      <h3>{patientDetails.patientName}</h3>
                      <div className="pt-meta-chips">
                        <span className="meta-chip">{patientDetails.fileNo}</span>
                        {patientDetails.genderDesc && <span className="meta-chip">{patientDetails.genderDesc}</span>}
                        {patientDetails.age && <span className="meta-chip">{patientDetails.age} yrs</span>}
                        {patientDetails.bloodGroupDesc && <span className="meta-chip">{patientDetails.bloodGroupDesc}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="pt-details-grid">
                    {[['Mobile', patientDetails.mobile], ['Alt Mobile', patientDetails.altMobile], ['Email', patientDetails.email], ['Birth Date', patientDetails.birthDate ? formatDate(patientDetails.birthDate) : null], ['Marital Status', patientDetails.maritalStatusDesc], ['Emergency Contact', patientDetails.emergencyContactNo]].filter(([, v]) => v).map(([label, val]) => (
                      <div key={label} className="pt-detail-item"><label>{label}</label><span>{val}</span></div>
                    ))}
                    {patientDetails.address && <div className="pt-detail-item full"><label>Address</label><span>{patientDetails.address}</span></div>}
                    {patientDetails.allergies && <div className="pt-detail-item full highlight"><label>⚠ Allergies</label><span>{patientDetails.allergies}</span></div>}
                    {patientDetails.existingMedicalConditions && <div className="pt-detail-item full"><label>Medical Conditions</label><span>{patientDetails.existingMedicalConditions}</span></div>}
                    {patientDetails.currentMedications && <div className="pt-detail-item full"><label>Current Medications</label><span>{patientDetails.currentMedications}</span></div>}
                  </div>
                </>
              ) : <div className="ac-empty"><p>No details available</p></div>}
            </div>
          </div>
        )}

        {/* ════ LAB ORDER MODAL ════ */}
        {showLabModal && (
          <div className="inner-modal-overlay">
            <div className="inner-modal lab-modal">
              <div className="inner-modal-header lab-modal-header">
                <span><FiUser size={14} /> Lab Order</span>
                <button onClick={() => setShowLabModal(false)}><FiX size={16} /></button>
              </div>

              {/* Step: confirm */}
              {labOrderStep === 'confirm' && (
                <div className="lab-confirm-body">
                  <p className="lab-confirm-msg">Create a lab test order for <strong>{selectedVisit?.patientName}</strong>?</p>
                  <div className="lab-priority-group">
                    <label className="lab-label">Priority</label>
                    <div className="priority-select-row">
                      {PRIORITY_OPTIONS.map(p => {
                        const Icon = p.icon;
                        return (
                          <button key={p.id} type="button"
                            className={`priority-btn priority-${p.id} ${labPriority === p.id ? 'active' : ''}`}
                            onClick={() => setLabPriority(p.id)}>
                            <Icon size={13} /> {p.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="lab-confirm-actions">
                    <button className="lab-btn-no" onClick={() => setShowLabModal(false)}><FiX size={13} /> No, Cancel</button>
                    <button className="lab-btn-yes" onClick={handleLabOrderCreate} disabled={labLoading}>
                      {labLoading ? <><div className="btn-spinner" /> Creating...</> : <><FiCheck size={13} /> Yes, Create Order</>}
                    </button>
                  </div>
                </div>
              )}

              {/* Step: select items */}
              {labOrderStep === 'items' && (
                <div className="lab-items-body">
                  {labDone ? (
                    <div className="lab-done-state"><FiCheck size={28} /><p>Lab tests added successfully!</p></div>
                  ) : (
                    <>
                      <p className="lab-items-hint">Select tests and/or packages to include in this order</p>
                      <div className="lab-items-grid">
                        {/* Left: Tests */}
                        <div className="lab-items-panel">
                          <div className="lab-items-panel-header"><FiActivity size={12} /> Lab Tests ({selectedTestIds.length} selected)</div>
                          <div className="lab-items-search">
                            <FiSearch size={12} />
                            <input type="text" placeholder="Search tests..." value={labTestSearch} onChange={e => setLabTestSearch(e.target.value)} />
                          </div>
                          <div className="lab-items-list">
                            {labItemsLoading ? (
                              <div className="ac-loading" style={{ padding: 12 }}><div className="ac-spinner" /></div>
                            ) : filteredTests.length === 0 ? (
                              <div className="ac-empty" style={{ padding: 12 }}><p>No tests found</p></div>
                            ) : (
                              filteredTests.map(t => (
                                <label key={t.id || t.testId} className={`lab-item-row ${selectedTestIds.includes(t.id || t.testId) ? 'selected' : ''}`}>
                                  <input type="checkbox" checked={selectedTestIds.includes(t.id || t.testId)}
                                    onChange={() => { const id = t.id || t.testId; setSelectedTestIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); }} />
                                  <span className="lab-item-name">{t.name || t.testName || t.test_name || t.TestName || 'Unknown Test'}</span>
                                  {(t.fees || t.Fees) && <span className="lab-item-fee">₹{t.fees || t.Fees}</span>}
                                </label>
                              ))
                            )}
                          </div>
                        </div>
                        {/* Right: Packages */}
                        <div className="lab-items-panel">
                          <div className="lab-items-panel-header"><FiPackage size={12} /> Packages ({selectedPkgIds.length} selected)</div>
                          <div className="lab-items-search">
                            <FiSearch size={12} />
                            <input type="text" placeholder="Search packages..." value={labPkgSearch} onChange={e => setLabPkgSearch(e.target.value)} />
                          </div>
                          <div className="lab-items-list">
                            {labItemsLoading ? (
                              <div className="ac-loading" style={{ padding: 12 }}><div className="ac-spinner" /></div>
                            ) : filteredPkgs.length === 0 ? (
                              <div className="ac-empty" style={{ padding: 12 }}><p>No packages found</p></div>
                            ) : (
                              filteredPkgs.map(p => (
                                <label key={p.id || p.packageId} className={`lab-item-row ${selectedPkgIds.includes(p.id || p.packageId) ? 'selected' : ''}`}>
                                  <input type="checkbox" checked={selectedPkgIds.includes(p.id || p.packageId)}
                                    onChange={() => { const id = p.id || p.packageId; setSelectedPkgIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); }} />
                                  <span className="lab-item-name">{p.name || p.packageName || p.package_name || p.PackageName || 'Unknown Package'}</span>
                                  {(p.fees || p.Fees) && <span className="lab-item-fee">₹{p.fees || p.Fees}</span>}
                                </label>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="lab-items-footer">
                        <button className="lab-btn-no" onClick={() => setShowLabModal(false)}><FiX size={12} /> Cancel</button>
                        <button className="lab-btn-yes" onClick={handleLabItemsSubmit} disabled={labLoading || (!selectedTestIds.length && !selectedPkgIds.length)}>
                          {labLoading ? <><div className="btn-spinner" /> Saving...</> : <><FiCheck size={13} /> Add {selectedTestIds.length + selectedPkgIds.length} Item{(selectedTestIds.length + selectedPkgIds.length) !== 1 ? 's' : ''}</>}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════ HISTORY DETAIL MODAL ════ */}
        {showViewDetail && (
          <div className="inner-modal-overlay">
            <div className="inner-modal hd-modal">
              <div className="inner-modal-header">
                <span><FiEye size={14} /> Consultation Details</span>
                <button onClick={() => { setShowViewDetail(false); setViewDetail(null); }}><FiX size={16} /></button>
              </div>
              {viewDetailLoading ? (
                <div className="ac-loading"><div className="ac-spinner" /><span>Loading details...</span></div>
              ) : viewDetail ? (
                <div className="hd-content">
                  {/* Consultation info */}
                  {viewDetail.consult && (
                    <div className="hd-section">
                      <div className="hd-section-title"><FiEdit3 size={12} /> Consultation</div>
                      <div className="hd-info-grid">
                        <div className="hd-info-item"><label>Date</label><span>{formatDate(viewDetail.consult.dateCreated)}</span></div>
                        <div className="hd-info-item"><label>Doctor</label><span>{viewDetail.consult.doctorFullName}</span></div>
                        {viewDetail.consult.reason && <div className="hd-info-item"><label>Reason</label><span>{viewDetail.consult.reason}</span></div>}
                        {viewDetail.consult.symptoms && <div className="hd-info-item"><label>Symptoms</label><span>{viewDetail.consult.symptoms}</span></div>}
                        {viewDetail.consult.consultationNotes && <div className="hd-info-item full"><label>Notes</label><span>{viewDetail.consult.consultationNotes}</span></div>}
                        {viewDetail.consult.treatmentPlan && <div className="hd-info-item full"><label>Treatment Plan</label><span>{viewDetail.consult.treatmentPlan}</span></div>}
                        {(viewDetail.consult.bpReading || viewDetail.consult.temperature || viewDetail.consult.weight) && (
                          <div className="hd-info-item full"><label>Vitals</label>
                            <div className="visit-vitals" style={{ marginTop: 4 }}>
                              {viewDetail.consult.bpReading && <span className="vital-chip bp">{viewDetail.consult.bpReading}</span>}
                              {viewDetail.consult.temperature && <span className="vital-chip temp">{viewDetail.consult.temperature}°F</span>}
                              {viewDetail.consult.weight && <span className="vital-chip wt">{viewDetail.consult.weight} kg</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Prescription Items */}
                  {viewDetail.prescItems?.length > 0 && (
                    <div className="hd-section">
                      <div className="hd-section-title"><FiFileText size={12} /> Prescription ({viewDetail.prescItems.length} item{viewDetail.prescItems.length > 1 ? 's' : ''})</div>
                      <table className="hd-table">
                        <thead><tr><th>Medicine</th><th>Dose</th><th>Frequency</th><th>Duration</th><th>Qty</th><th>Food</th></tr></thead>
                        <tbody>
                          {viewDetail.prescItems.map(item => (
                            <tr key={item.id}>
                              <td><strong>{item.medicineName}</strong>{item.strength && <span className="hd-sub"> {item.strength}</span>}</td>
                              <td>{item.dosage || '—'}</td>
                              <td>{item.frequency || '—'}</td>
                              <td>{item.duration || '—'}</td>
                              <td>{item.quantity || '—'}</td>
                              <td>{item.foodTimingDesc || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Lab Order Items */}
                  {viewDetail.labOrders?.length > 0 && (
                    <div className="hd-section">
                      <div className="hd-section-title"><FiUser size={12} /> Lab Orders
                        <span className="hd-priority-badge priority-{viewDetail.labOrders[0].priority}">
                          {viewDetail.labOrders[0].priorityDesc}
                        </span>
                      </div>
                      {viewDetail.labItems?.length > 0 ? (
                        <table className="hd-table">
                          <thead><tr><th>Test / Package</th><th>Fees</th><th>CGST</th><th>SGST</th><th>Total</th><th>Status</th></tr></thead>
                          <tbody>
                            {viewDetail.labItems.map(item => (
                              <tr key={item.itemId}>
                                <td><strong>{item.testOrPackageName}</strong></td>
                                <td>₹{item.fees?.toFixed(2) || '0.00'}</td>
                                <td>₹{item.cgst?.toFixed(2) || '0.00'}</td>
                                <td>₹{item.sgst?.toFixed(2) || '0.00'}</td>
                                <td><strong>₹{item.totalAmount?.toFixed(2) || '0.00'}</strong></td>
                                <td><span className="hd-status-chip">{item.status === 1 ? 'Active' : 'Inactive'}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : <p className="hd-empty-msg">No lab items found for this order</p>}
                    </div>
                  )}
                  {(!viewDetail.prescItems?.length && !viewDetail.labOrders?.length) && (
                    <div className="ac-empty"><p>No additional details available</p></div>
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