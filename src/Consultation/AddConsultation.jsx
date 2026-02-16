// src/components/AddConsultation.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  FiX, FiCalendar, FiCheck, FiSearch, FiTrash2,
  FiChevronDown, FiChevronRight, FiUser, FiList,
  FiArrowLeft, FiPlus, FiAlertCircle, FiFileText, FiPackage
} from 'react-icons/fi';
import { getPatientVisitList, getPatientsList } from '../api/api.js';
import { addConsultation, getConsultationList } from '../api/api-consultation.js';
import { addPrescription, addPrescriptionDetail, getMedicineMasterList } from '../api/api-pharmacy.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import './AddConsultation.css';

/* ─── Constants ─────────────────────────────────────────────── */
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

/* ─── Helpers ─────────────────────────────────────────────────── */
const generateTempId = () => Date.now() + Math.random();

const createContainer = (medicine = null) => ({
  tempId: generateTempId(),
  medicineId: medicine?.id || 0,
  medicineName: medicine?.name || '',
  form: medicine?.type || 0,
  strength: medicine?.dosageForm || '',
  defaultRoute: medicine?.defaultRoute || 1,
  timings: [],          // ['M','A','E','N']
  foodTiming: 0,        // 1-4
  days: '',
  dosePerIntake: '',    // maps to Dosage
  quantity: 0,
  notes: '',
  refillAllowed: 0,
  refillCount: 0,
  expanded: true,
});

const calcQuantity = (days, timings) => {
  const d = parseInt(days) || 0;
  const t = timings.length;
  return d > 0 && t > 0 ? d * t : 0;
};

const buildFrequency = (timings) =>
  timings.length ? timings.map(c => TIMING_OPTIONS.find(t => t.code === c)?.full).join('-') : '';

const formatDate = (ds) => {
  if (!ds) return '—';
  return new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (ts) => {
  if (!ts) return '—';
  const [h, m] = ts.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${period}`;
};

const today = () => new Date().toISOString().split('T')[0];
const thirtyDaysLater = () =>
  new Date(Date.now() + 30 * 86400 * 1000).toISOString().split('T')[0];

/* ─── Medicine Container Sub-component ──────────────────────── */
const MedicineContainer = ({ container, onUpdate, onRemove }) => {
  const toggleTiming = (code) => {
    const timings = container.timings.includes(code)
      ? container.timings.filter(c => c !== code)
      : [...container.timings, code];
    const qty = calcQuantity(container.days, timings);
    onUpdate(container.tempId, { timings, quantity: qty });
  };

  const handleDaysChange = (val) => {
    const qty = calcQuantity(val, container.timings);
    onUpdate(container.tempId, { days: val, quantity: qty });
  };

  return (
    <div className={`med-container ${container.expanded ? 'expanded' : 'collapsed'}`}>
      {/* Header */}
      <div className="med-container-header">
        <button
          type="button"
          className="med-toggle-btn"
          onClick={() => onUpdate(container.tempId, { expanded: !container.expanded })}
          title={container.expanded ? 'Collapse' : 'Expand'}
        >
          {container.expanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
        </button>
        <span className="med-name-label">
          {container.medicineName || <em className="med-unassigned">Unassigned Medicine</em>}
        </span>
        {container.quantity > 0 && !container.expanded && (
          <span className="med-qty-pill">Qty {container.quantity}</span>
        )}
        <button
          type="button"
          className="med-remove-btn"
          onClick={() => onRemove(container.tempId)}
          title="Remove"
        >
          <FiX size={14} />
        </button>
      </div>

      {/* Body */}
      {container.expanded && (
        <div className="med-container-body">
          {/* Medicine name input if not pre-filled */}
          {!container.medicineId && (
            <div className="med-field-row">
              <label className="med-label">Medicine Name *</label>
              <input
                type="text"
                className="med-input"
                value={container.medicineName}
                onChange={e => onUpdate(container.tempId, { medicineName: e.target.value })}
                placeholder="Type medicine name..."
              />
            </div>
          )}

          {/* Timing row */}
          <div className="med-field-row">
            <label className="med-label">Timing</label>
            <div className="timing-btn-group">
              {TIMING_OPTIONS.map(t => (
                <button
                  key={t.code}
                  type="button"
                  className={`timing-btn ${container.timings.includes(t.code) ? 'active' : ''}`}
                  onClick={() => toggleTiming(t.code)}
                  title={t.full}
                >
                  {t.code}
                </button>
              ))}
            </div>
          </div>

          {/* Food row */}
          <div className="med-field-row">
            <label className="med-label">Food</label>
            <div className="food-btn-group">
              {FOOD_OPTIONS.map(f => (
                <button
                  key={f.id}
                  type="button"
                  className={`food-btn ${container.foodTiming === f.id ? 'active' : ''}`}
                  onClick={() => onUpdate(container.tempId, { foodTiming: f.id })}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Days + Qty + Dose */}
          <div className="med-numbers-row">
            <div className="med-num-field">
              <label className="med-label">Dose *</label>
              <input
                type="text"
                className="med-input med-input-sm"
                value={container.dosePerIntake}
                onChange={e => onUpdate(container.tempId, { dosePerIntake: e.target.value })}
                placeholder="1 tab"
              />
            </div>
            <div className="med-num-field">
              <label className="med-label">Days</label>
              <input
                type="number"
                className="med-input med-input-sm"
                value={container.days}
                onChange={e => handleDaysChange(e.target.value)}
                placeholder="7"
                min="1"
              />
            </div>
            <div className="med-num-field">
              <label className="med-label">Qty</label>
              <input
                type="number"
                className="med-input med-input-sm med-qty-display"
                value={container.quantity}
                onChange={e => onUpdate(container.tempId, { quantity: Number(e.target.value) })}
                placeholder="0"
                min="0"
                step="0.5"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="med-field-row">
            <label className="med-label">Notes (Optional)</label>
            <textarea
              className="med-input med-textarea"
              value={container.notes}
              onChange={e => onUpdate(container.tempId, { notes: e.target.value })}
              placeholder="Additional instructions..."
              rows={2}
            />
          </div>

          {/* Refill */}
          <div className="med-refill-row">
            <label className="med-check-label">
              <input
                type="checkbox"
                checked={container.refillAllowed === 1}
                onChange={e => onUpdate(container.tempId, {
                  refillAllowed: e.target.checked ? 1 : 0,
                  refillCount: e.target.checked ? container.refillCount : 0
                })}
                className="med-checkbox"
              />
              <span>Refill Allowed</span>
            </label>
            {container.refillAllowed === 1 && (
              <div className="med-refill-count">
                <label className="med-label">Count</label>
                <input
                  type="number"
                  className="med-input med-input-sm"
                  value={container.refillCount}
                  onChange={e => onUpdate(container.tempId, { refillCount: Number(e.target.value) })}
                  min="1"
                  max="12"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────────── */
const AddConsultation = ({ isOpen, onClose, onSuccess, preSelectedVisitId = null }) => {
  /* ── view state ── */
  const [mainView, setMainView] = useState('create');   // 'create' | 'patient-details' | 'consult-list'
  const [visitStep, setVisitStep] = useState(1);

  /* ── visit / patient ── */
  const [todayVisits, setTodayVisits] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ── consultation form ── */
  const [consultationNotes, setConsultationNotes] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [nextConsultationDate, setNextConsultationDate] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [consultationId, setConsultationId] = useState(null);
  const [prescriptionId, setPrescriptionId] = useState(null);

  /* ── medicine containers (Panel 2) ── */
  const [containers, setContainers] = useState([]);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmedSuccess, setConfirmedSuccess] = useState(false);

  /* ── medicine search (Panel 3) ── */
  const [allMedicines, setAllMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingMeds, setLoadingMeds] = useState(false);
  const [selectedMedIds, setSelectedMedIds] = useState([]);

  /* ── side views ── */
  const [patientDetails, setPatientDetails] = useState(null);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [consultList, setConsultList] = useState([]);
  const [loadingConsults, setLoadingConsults] = useState(false);

  const [error, setError] = useState(null);

  /* ─── Effects ──────────────────────────────────────────────── */
  useEffect(() => {
    if (isOpen) fetchTodayVisits();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && preSelectedVisitId && todayVisits.length > 0) {
      const v = todayVisits.find(v => v.id === preSelectedVisitId);
      if (v) { setSelectedVisit(v); setVisitStep(2); }
    }
  }, [isOpen, preSelectedVisitId, todayVisits]);

  useEffect(() => {
    if (prescriptionId) fetchMedicines();
  }, [prescriptionId]);

  /* ─── Fetch helpers ─────────────────────────────────────────── */
  const fetchTodayVisits = async () => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const visits = await getPatientVisitList(clinicId, {
        Page: 1, PageSize: 50, BranchID: branchId, VisitDate: today()
      });
      setTodayVisits(visits);
    } catch (err) { setError(err); }
    finally { setLoading(false); }
  };

  const fetchMedicines = async () => {
    try {
      setLoadingMeds(true);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const meds = await getMedicineMasterList(clinicId, {
        BranchID: branchId, PageSize: 200, Status: 1
      });
      setAllMedicines(meds);
      setFilteredMedicines(meds);
    } catch (err) { console.error(err); }
    finally { setLoadingMeds(false); }
  };

  const fetchPatientDetails = async (patientId) => {
    try {
      setLoadingPatient(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const pts = await getPatientsList(clinicId, {
        Page: 1, PageSize: 1, BranchID: branchId, PatientID: patientId, Status: 1
      });
      setPatientDetails(pts?.[0] || null);
    } catch (err) { setError(err); }
    finally { setLoadingPatient(false); }
  };

  const fetchConsultList = async (patientId) => {
    try {
      setLoadingConsults(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const list = await getConsultationList(clinicId, {
        Page: 1, PageSize: 100, BranchID: branchId, PatientID: patientId, Status: 1
      });
      setConsultList(list || []);
    } catch (err) { setError(err); }
    finally { setLoadingConsults(false); }
  };

  /* ─── Handlers ──────────────────────────────────────────────── */
  const handleVisitSelect = (v) => {
    setSelectedVisit(v);
    setVisitStep(2);
  };

  const handleAddConsultation = async (e) => {
    e.preventDefault();
    if (!consultationNotes.trim()) { setError({ message: 'Consultation Notes are required' }); return; }
    if (!selectedVisit) { setError({ message: 'No visit selected' }); return; }

    try {
      setSubmitLoading(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      /* 1 — Add Consultation */
      const consultResult = await addConsultation({
        clinicId, branchId,
        visitId: selectedVisit.id,
        patientId: selectedVisit.patientId,
        doctorId: selectedVisit.doctorId,
        reason: selectedVisit.reason || '',
        symptoms: selectedVisit.symptoms || '',
        bpSystolic: selectedVisit.bpSystolic ?? null,
        bpDiastolic: selectedVisit.bpDiastolic ?? null,
        temperature: selectedVisit.temperature ?? null,
        weight: selectedVisit.weight ?? null,
        emrNotes: '',
        ehrNotes: '',
        instructions: '',
        consultationNotes: consultationNotes.trim(),
        nextConsultationDate: nextConsultationDate || '',
        treatmentPlan: treatmentPlan.trim(),
      });

      if (!consultResult.success || !consultResult.consultationId) throw new Error('Failed to create consultation');
      const newConsultId = consultResult.consultationId;
      setConsultationId(newConsultId);

      /* 2 — Fetch that consultation to get full details */
      const consultDetails = await getConsultationList(clinicId, {
        Page: 1, PageSize: 1, BranchID: branchId,
        ConsultationID: newConsultId, Status: 1
      });
      const detail = consultDetails?.[0];

      /* 3 — Add Prescription */
      const prescResult = await addPrescription({
        clinicId, branchId,
        ConsultationID: newConsultId,
        VisitID: detail?.visitId ?? selectedVisit.id,
        PatientID: detail?.patientId ?? selectedVisit.patientId,
        DoctorID: detail?.doctorId ?? selectedVisit.doctorId,
        DateIssued: today(),
        ValidUntil: thirtyDaysLater(),
        Diagnosis: null,
        Notes: detail?.consultationNotes || null,
        IsRepeat: 0,
        RepeatCount: 0,
        CreatedBy: detail?.doctorId ?? selectedVisit.doctorId,
      });

      if (!prescResult.success || !prescResult.prescriptionId) throw new Error('Failed to create prescription');
      setPrescriptionId(prescResult.prescriptionId);

    } catch (err) {
      console.error('handleAddConsultation:', err);
      setError(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  /* ── Container updates ── */
  const updateContainer = (tempId, changes) => {
    setContainers(prev => prev.map(c => c.tempId === tempId ? { ...c, ...changes } : c));
  };

  const removeContainer = (tempId) => {
    setContainers(prev => prev.filter(c => c.tempId !== tempId));
  };

  const addBlankContainer = () => {
    setContainers(prev => [...prev, createContainer()]);
  };

  /* ── Medicine search ── */
  const handleSearch = () => {
    const q = searchQuery.toLowerCase().trim();
    setFilteredMedicines(q
      ? allMedicines.filter(m =>
          m.name.toLowerCase().includes(q) ||
          (m.genericName && m.genericName.toLowerCase().includes(q)))
      : allMedicines
    );
  };

  const handleSearchKey = (e) => { if (e.key === 'Enter') handleSearch(); };

  const toggleMedSelection = (id) => {
    setSelectedMedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleAddSelectedMeds = () => {
    if (!selectedMedIds.length) return;
    const newContainers = selectedMedIds.map(id => createContainer(allMedicines.find(m => m.id === id)));
    setContainers(prev => [...prev, ...newContainers]);
    setSelectedMedIds([]);
  };

  /* ── Confirm Medicines ── */
  const handleConfirmMedicines = async () => {
    if (!prescriptionId) { setError({ message: 'No prescription found' }); return; }
    if (!containers.length) { setError({ message: 'Add at least one medicine' }); return; }

    for (const c of containers) {
      if (!c.medicineName.trim()) { setError({ message: 'All medicines must have a name' }); return; }
      if (!c.dosePerIntake.trim()) { setError({ message: `Dose is required for ${c.medicineName}` }); return; }
      if (c.quantity <= 0) { setError({ message: `Quantity must be > 0 for ${c.medicineName}` }); return; }
    }

    try {
      setConfirmLoading(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      for (const c of containers) {
        await addPrescriptionDetail({
          clinicId, branchId,
          PrescriptionID: prescriptionId,
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
          StartDate: '',
          EndDate: '',
        });
      }

      setConfirmedSuccess(true);
    } catch (err) {
      console.error('handleConfirmMedicines:', err);
      setError(err);
    } finally {
      setConfirmLoading(false);
    }
  };

  /* ── Complete & Close ── */
  const handleComplete = () => {
    handleClose();
    if (onSuccess) onSuccess();
  };

  const handleClose = () => {
    setMainView('create');
    setVisitStep(1);
    setSelectedVisit(null);
    setTodayVisits([]);
    setConsultationNotes('');
    setTreatmentPlan('');
    setNextConsultationDate('');
    setConsultationId(null);
    setPrescriptionId(null);
    setContainers([]);
    setAllMedicines([]);
    setFilteredMedicines([]);
    setSearchQuery('');
    setSelectedMedIds([]);
    setPatientDetails(null);
    setConsultList([]);
    setConfirmedSuccess(false);
    setError(null);
    onClose();
  };

  /* ─── Early return ──────────────────────────────────────────── */
  if (!isOpen) return null;

  const panelsActive = !!prescriptionId;

  /* ─── Render ─────────────────────────────────────────────────── */
  return (
    <div className="ac-overlay">
      <div className="ac-modal">
        {/* ── Header ── */}
        <div className="ac-header">
          <div className="ac-header-left">
            {(mainView !== 'create' || visitStep === 2) && (
              <button
                className="ac-back-btn"
                onClick={() => {
                  if (mainView !== 'create') {
                    setMainView('create');
                    setPatientDetails(null);
                    setConsultList([]);
                  } else if (visitStep === 2 && !consultationId) {
                    setVisitStep(1);
                    setSelectedVisit(null);
                  }
                }}
              >
                <FiArrowLeft size={16} />
              </button>
            )}
            <div>
              <h2 className="ac-title">
                {mainView === 'patient-details' ? 'Patient Details' :
                  mainView === 'consult-list' ? 'Consultation History' :
                  visitStep === 1 ? 'Select Patient Visit' : 'New Consultation'}
              </h2>
              {selectedVisit && (
                <p className="ac-subtitle">{selectedVisit.patientName} · {selectedVisit.doctorFullName}</p>
              )}
            </div>
          </div>

          <div className="ac-header-actions">
            {visitStep === 2 && mainView === 'create' && (
              <>
                <button className="ac-nav-btn" onClick={() => {
                  if (selectedVisit) { fetchPatientDetails(selectedVisit.patientId); setMainView('patient-details'); }
                }}>
                  <FiUser size={14} /> Patient
                </button>
                <button className="ac-nav-btn" onClick={() => {
                  if (selectedVisit) { fetchConsultList(selectedVisit.patientId); setMainView('consult-list'); }
                }}>
                  <FiList size={14} /> History
                </button>
              </>
            )}
            <button className="ac-close-btn" onClick={handleClose}><FiX size={20} /></button>
          </div>
        </div>

        <ErrorHandler error={error} />

        {/* ── Body ── */}
        <div className="ac-body">

          {/* ════════════════ VISIT SELECTION (Step 1) ════════════════ */}
          {mainView === 'create' && visitStep === 1 && (
            <div className="ac-visit-picker">
              {loading ? (
                <div className="ac-loading"><div className="ac-spinner" /><span>Loading today's visits...</span></div>
              ) : todayVisits.length === 0 ? (
                <div className="ac-empty">
                  <FiCalendar size={48} />
                  <p>No patient visits recorded today</p>
                  <span>Add a patient visit first before creating a consultation</span>
                </div>
              ) : (
                <div className="visit-grid">
                  {todayVisits.map(v => (
                    <div key={v.id} className="visit-card" onClick={() => handleVisitSelect(v)}>
                      <div className="visit-card-top">
                        <div className="visit-avatar">{v.patientName?.charAt(0).toUpperCase() || 'P'}</div>
                        <div className="visit-info">
                          <div className="visit-patient">{v.patientName}</div>
                          <div className="visit-meta">{v.patientFileNo} · {v.patientMobile}</div>
                        </div>
                      </div>
                      <div className="visit-card-mid">
                        <span className="visit-field-label">Dr.</span>
                        <span className="visit-field-val">{v.doctorFullName}</span>
                      </div>
                      <div className="visit-card-mid">
                        <span className="visit-field-label">Time</span>
                        <span className="visit-field-val">{formatDate(v.visitDate)} at {formatTime(v.visitTime)}</span>
                      </div>
                      {v.reason && (
                        <div className="visit-card-mid">
                          <span className="visit-field-label">Reason</span>
                          <span className="visit-field-val visit-reason">{v.reason}</span>
                        </div>
                      )}
                      {(v.bpReading || v.temperature || v.weight) && (
                        <div className="visit-vitals">
                          {v.bpReading && <span className="vital-chip bp">{v.bpReading}</span>}
                          {v.temperature && <span className="vital-chip temp">{v.temperature}°F</span>}
                          {v.weight && <span className="vital-chip wt">{v.weight} kg</span>}
                        </div>
                      )}
                      <button className="visit-select-btn">Select <FiCheck size={13} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════════════════ 3-PANEL LAYOUT (Step 2) ════════════════ */}
          {mainView === 'create' && visitStep === 2 && (
            <div className="three-panel-layout">

              {/* ─── PANEL 1 : Add Consultation ─── */}
              <div className="panel panel-consult">
                <div className="panel-header panel-header-1">
                  <span className="panel-badge">1</span>
                  <h3>Add Consultation</h3>
                  {consultationId && <FiCheck className="panel-done-icon" size={16} />}
                </div>
                <div className="panel-body">
                  {consultationId ? (
                    <div className="consult-done-state">
                      <div className="done-badge">
                        <FiCheck size={18} />
                        <span>Consultation & Prescription Created</span>
                      </div>
                      <div className="done-ids">
                        <span>Consultation ID <strong>#{consultationId}</strong></span>
                        <span>Prescription ID <strong>#{prescriptionId}</strong></span>
                      </div>
                      {confirmedSuccess && (
                        <div className="success-done-badge">
                          <FiCheck size={14} /> Medicines Confirmed
                        </div>
                      )}
                      <button className="btn-complete" onClick={handleComplete}>
                        Complete &amp; Close <FiCheck size={15} />
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleAddConsultation} className="consult-form">
                      {/* Visit snapshot */}
                      {selectedVisit && (
                        <div className="visit-snapshot">
                          {selectedVisit.reason && (
                            <div className="snap-row"><span className="snap-label">Reason</span><span>{selectedVisit.reason}</span></div>
                          )}
                          {selectedVisit.symptoms && (
                            <div className="snap-row"><span className="snap-label">Symptoms</span><span>{selectedVisit.symptoms}</span></div>
                          )}
                          {(selectedVisit.bpReading || selectedVisit.temperature || selectedVisit.weight) && (
                            <div className="snap-vitals">
                              {selectedVisit.bpReading && <span className="vital-chip bp">{selectedVisit.bpReading}</span>}
                              {selectedVisit.temperature && <span className="vital-chip temp">{selectedVisit.temperature}°F</span>}
                              {selectedVisit.weight && <span className="vital-chip wt">{selectedVisit.weight} kg</span>}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="cf-group">
                        <label className="cf-label">Consultation Notes <span className="cf-required">*</span></label>
                        <textarea
                          className="cf-textarea"
                          rows={4}
                          required
                          value={consultationNotes}
                          onChange={e => setConsultationNotes(e.target.value)}
                          placeholder="Enter consultation notes..."
                        />
                      </div>

                      <div className="cf-group">
                        <label className="cf-label">Treatment Plan <span className="cf-optional">(Optional)</span></label>
                        <textarea
                          className="cf-textarea"
                          rows={3}
                          value={treatmentPlan}
                          onChange={e => setTreatmentPlan(e.target.value)}
                          placeholder="Treatment plan..."
                        />
                      </div>

                      <div className="cf-group">
                        <label className="cf-label">Next Consultation Date <span className="cf-optional">(Optional)</span></label>
                        <input
                          type="date"
                          className="cf-input"
                          value={nextConsultationDate}
                          onChange={e => setNextConsultationDate(e.target.value)}
                          min={today()}
                        />
                      </div>

                      <button type="submit" className="btn-add-consultation" disabled={submitLoading}>
                        {submitLoading ? (
                          <><div className="btn-spinner" /> Processing...</>
                        ) : (
                          <><FiCheck size={15} /> Add Consultation</>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* ─── PANEL 2 : Prescription Details ─── */}
              <div className={`panel panel-prescription ${!panelsActive ? 'panel-disabled' : ''}`}>
                <div className="panel-header panel-header-2">
                  <span className="panel-badge">2</span>
                  <h3>Prescription Details</h3>
                  {confirmedSuccess && <FiCheck className="panel-done-icon" size={16} />}
                  {!panelsActive && <span className="panel-lock">Complete Step 1 first</span>}
                </div>
                <div className="panel-body">
                  {!panelsActive ? (
                    <div className="panel-placeholder">
                      <FiFileText size={36} />
                      <p>Prescription details will appear here</p>
                    </div>
                  ) : (
                    <>
                      {containers.length === 0 ? (
                        <div className="panel-placeholder">
                          <FiPackage size={32} />
                          <p>No medicines added yet</p>
                          <span>Select from the medicine list →</span>
                        </div>
                      ) : (
                        <div className="containers-list">
                          {containers.map(c => (
                            <MedicineContainer
                              key={c.tempId}
                              container={c}
                              onUpdate={updateContainer}
                              onRemove={removeContainer}
                            />
                          ))}
                        </div>
                      )}

                      <button type="button" className="btn-add-more" onClick={addBlankContainer}>
                        <FiPlus size={14} /> Add Medicine Manually
                      </button>

                      {containers.length > 0 && !confirmedSuccess && (
                        <button
                          type="button"
                          className="btn-confirm-meds"
                          onClick={handleConfirmMedicines}
                          disabled={confirmLoading}
                        >
                          {confirmLoading ? (
                            <><div className="btn-spinner" /> Saving...</>
                          ) : (
                            <><FiCheck size={15} /> Confirm {containers.length} Medicine{containers.length > 1 ? 's' : ''}</>
                          )}
                        </button>
                      )}

                      {confirmedSuccess && (
                        <div className="success-done-badge">
                          <FiCheck size={14} /> {containers.length} medicine(s) saved successfully
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* ─── PANEL 3 : Medicine List ─── */}
              <div className={`panel panel-meds ${!panelsActive ? 'panel-disabled' : ''}`}>
                <div className="panel-header panel-header-3">
                  <span className="panel-badge">3</span>
                  <h3>Medicine List</h3>
                  {!panelsActive && <span className="panel-lock">Complete Step 1 first</span>}
                </div>
                <div className="panel-body">
                  {!panelsActive ? (
                    <div className="panel-placeholder">
                      <FiSearch size={36} />
                      <p>Medicine search will be available here</p>
                    </div>
                  ) : (
                    <>
                      {/* Search */}
                      <div className="med-search-bar">
                        <input
                          type="text"
                          className="med-search-input"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          onKeyDown={handleSearchKey}
                          placeholder="Search by name or generic..."
                        />
                        <button type="button" className="med-search-btn" onClick={handleSearch}>
                          <FiSearch size={15} />
                        </button>
                      </div>

                      {/* Multi-select note */}
                      {selectedMedIds.length > 0 && (
                        <div className="med-selection-bar">
                          <span>{selectedMedIds.length} selected</span>
                          <button type="button" className="btn-add-selected-meds" onClick={handleAddSelectedMeds}>
                            <FiPlus size={13} /> Add Selected
                          </button>
                        </div>
                      )}

                      {/* Medicine list */}
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
                              <label
                                key={m.id}
                                className={`med-list-item ${isSelected ? 'selected' : ''} ${alreadyAdded ? 'already-added' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleMedSelection(m.id)}
                                  className="med-list-checkbox"
                                />
                                <div className="med-list-info">
                                  <span className="med-list-name">{m.name}</span>
                                  {m.genericName && <span className="med-list-generic">{m.genericName}</span>}
                                  <div className="med-list-meta">
                                    {m.typeDesc && <span className="med-chip">{m.typeDesc}</span>}
                                    {m.dosageForm && <span className="med-chip">{m.dosageForm}</span>}
                                    {alreadyAdded && <span className="med-chip added">Added</span>}
                                  </div>
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ PATIENT DETAILS VIEW ════════════════ */}
          {mainView === 'patient-details' && (
            <div className="side-view-container">
              <button className="ac-back-btn-inline" onClick={() => { setMainView('create'); setPatientDetails(null); }}>
                <FiArrowLeft size={15} /> Back to Consultation
              </button>
              {loadingPatient ? (
                <div className="ac-loading"><div className="ac-spinner" /><span>Loading patient details...</span></div>
              ) : patientDetails ? (
                <div className="patient-detail-card">
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
                    {[
                      ['Mobile', patientDetails.mobile],
                      ['Alt. Mobile', patientDetails.altMobile],
                      ['Email', patientDetails.email],
                      ['Birth Date', patientDetails.birthDate ? formatDate(patientDetails.birthDate) : null],
                      ['Marital Status', patientDetails.maritalStatusDesc],
                      ['Emergency Contact', patientDetails.emergencyContactNo],
                    ].filter(([, v]) => v).map(([label, val]) => (
                      <div key={label} className="pt-detail-item">
                        <label>{label}</label><span>{val}</span>
                      </div>
                    ))}
                    {patientDetails.address && (
                      <div className="pt-detail-item full"><label>Address</label><span>{patientDetails.address}</span></div>
                    )}
                    {patientDetails.allergies && (
                      <div className="pt-detail-item full highlight">
                        <label>⚠ Allergies</label><span>{patientDetails.allergies}</span>
                      </div>
                    )}
                    {patientDetails.existingMedicalConditions && (
                      <div className="pt-detail-item full"><label>Medical Conditions</label><span>{patientDetails.existingMedicalConditions}</span></div>
                    )}
                    {patientDetails.currentMedications && (
                      <div className="pt-detail-item full"><label>Current Medications</label><span>{patientDetails.currentMedications}</span></div>
                    )}
                    {patientDetails.familyMedicalHistory && (
                      <div className="pt-detail-item full"><label>Family History</label><span>{patientDetails.familyMedicalHistory}</span></div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="ac-empty"><p>Patient details not available</p></div>
              )}
            </div>
          )}

          {/* ════════════════ CONSULTATION HISTORY VIEW ════════════════ */}
          {mainView === 'consult-list' && (
            <div className="side-view-container">
              <button className="ac-back-btn-inline" onClick={() => { setMainView('create'); setConsultList([]); }}>
                <FiArrowLeft size={15} /> Back to Consultation
              </button>
              {loadingConsults ? (
                <div className="ac-loading"><div className="ac-spinner" /><span>Loading history...</span></div>
              ) : consultList.length === 0 ? (
                <div className="ac-empty"><FiList size={48} /><p>No consultations found</p></div>
              ) : (
                <div className="consult-history-table-wrap">
                  <table className="consult-history-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Doctor</th>
                        <th>Reason</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consultList.map(c => (
                        <tr key={c.id}>
                          <td>{formatDate(c.dateCreated)}</td>
                          <td>{c.doctorFullName}</td>
                          <td>{c.reason || '—'}</td>
                          <td className="notes-cell">{c.consultationNotes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>{/* /ac-body */}
      </div>
    </div>
  );
};

export default AddConsultation;