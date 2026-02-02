// src/components/AddConsultation.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiUser, FiCalendar, FiCheck, FiChevronRight, FiChevronLeft, FiPackage, FiSearch, FiPlus, FiTrash2, FiFileText } from 'react-icons/fi';
import { getPatientVisitList} from '../api/api.js';
import { addConsultation, getConsultationList  } from '../api/api-consultation.js';
import { addPrescription, addPrescriptionDetail, getMedicineMasterList } from '../api/api-pharmacy.js';
import { addLabTestOrder } from '../api/api-labtest.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import './AddConsultation.css';

const MEDICINE_FORMS = [
  { id: 1, name: 'Tablet' },
  { id: 2, name: 'Capsule' },
  { id: 3, name: 'Syrup' },
  { id: 4, name: 'Injection' },
  { id: 5, name: 'Ointment' },
  { id: 6, name: 'Drops' },
  { id: 7, name: 'Powder' },
  { id: 8, name: 'Gel' },
  { id: 9, name: 'Cream' },
  { id: 10, name: 'Inhaler' }
];

const MEDICINE_ROUTES = [
  { id: 1, name: 'Oral' },
  { id: 2, name: 'IV' },
  { id: 3, name: 'IM' },
  { id: 4, name: 'Topical' },
  { id: 5, name: 'Nasal' },
  { id: 6, name: 'Ophthalmic' },
  { id: 7, name: 'Sublingual' },
  { id: 8, name: 'Rectal' },
  { id: 9, name: 'Inhalation' },
  { id: 10, name: 'Transdermal' }
];

const FOOD_TIMINGS = [
  { id: 1, name: 'Before Food' },
  { id: 2, name: 'After Food' },
  { id: 3, name: 'With Food' },
  { id: 4, name: 'Empty Stomach' }
];

const LAB_PRIORITIES = [
  { id: 1, name: 'Routine' },
  { id: 2, name: 'Urgent' },
  { id: 3, name: 'Stat' }
];

const WIZARD_STEPS = [
  { id: 1, name: 'Consultation', icon: FiUser },
  { id: 2, name: 'Prescription', icon: FiPackage },
  { id: 3, name: 'Lab Tests', icon: FiPlus }
];

const AddConsultation = ({ isOpen, onClose, onSuccess, preSelectedVisitId = null }) => {
  const [currentWizardStep, setCurrentWizardStep] = useState(1);
  const [visitSelectionStep, setVisitSelectionStep] = useState(1);
  const [todayVisits, setTodayVisits] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [consultationId, setConsultationId] = useState(null);
  const [prescriptionId, setPrescriptionId] = useState(null);
  const [prescriptionCreated, setPrescriptionCreated] = useState(false);

  const [consultationFormData, setConsultationFormData] = useState({
    emrNotes: '',
    ehrNotes: '',
    instructions: '',
    consultationNotes: '',
    nextConsultationDate: '',
    treatmentPlan: ''
  });

  const [prescriptionFormData, setPrescriptionFormData] = useState({
    diagnosis: '',
    notes: '',
    isRepeat: 0,
    repeatCount: 0,
    dateIssued: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [prescriptionDetails, setPrescriptionDetails] = useState([]);
  const [showMedicineSearch, setShowMedicineSearch] = useState(false);
  const [medicineSearchQuery, setMedicineSearchQuery] = useState('');
  const [allMedicines, setAllMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [searchingMedicines, setSearchingMedicines] = useState(false);

  const [labTestFormData, setLabTestFormData] = useState({
    priority: 1,
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchTodayVisits();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && preSelectedVisitId && todayVisits.length > 0) {
      const preSelected = todayVisits.find(v => v.id === preSelectedVisitId);
      if (preSelected) {
        setSelectedVisit(preSelected);
        setVisitSelectionStep(2);
      }
    }
  }, [isOpen, preSelectedVisitId, todayVisits]);

  const fetchTodayVisits = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const today = new Date().toISOString().split('T')[0];

      const options = {
        Page: 1,
        PageSize: 50,
        BranchID: branchId,
        VisitDate: today
      };

      const visits = await getPatientVisitList(clinicId, options);
      setTodayVisits(visits);
    } catch (err) {
      console.error('fetchTodayVisits error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMedicines = async () => {
    try {
      setSearchingMedicines(true);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      
      const results = await getMedicineMasterList(clinicId, {
        BranchID: branchId,
        PageSize: 50,
        Status: 1 // Only active medicines
      });
      
      setAllMedicines(results);
      setFilteredMedicines(results);
    } catch (err) {
      console.error('fetchAllMedicines error:', err);
      setError(err);
    } finally {
      setSearchingMedicines(false);
    }
  };

  const handleMedicineSearch = () => {
    if (!medicineSearchQuery.trim()) {
      setFilteredMedicines(allMedicines);
      return;
    }
    
    const query = medicineSearchQuery.toLowerCase();
    const filtered = allMedicines.filter(medicine => 
      medicine.name.toLowerCase().includes(query) ||
      medicine.genericName.toLowerCase().includes(query) ||
      medicine.manufacturer.toLowerCase().includes(query)
    );
    
    setFilteredMedicines(filtered);
  };

  const handleOpenMedicineSearch = () => {
    setShowMedicineSearch(true);
    setMedicineSearchQuery('');
    fetchAllMedicines();
  };

  const handleVisitSelect = (visit) => {
    setSelectedVisit(visit);
    setVisitSelectionStep(2);
  };

  const handleConsultationInputChange = (e) => {
    const { name, value } = e.target;
    setConsultationFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePrescriptionInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'isRepeat') {
      setPrescriptionFormData(prev => ({
        ...prev,
        isRepeat: checked ? 1 : 0,
        repeatCount: checked ? prev.repeatCount : 0
      }));
    } else {
      setPrescriptionFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? Number(value) : value
      }));
    }
  };

  const handleLabTestInputChange = (e) => {
    const { name, value } = e.target;
    setLabTestFormData(prev => ({
      ...prev,
      [name]: name === 'priority' ? Number(value) : value
    }));
  };

  const calculateEndDate = (startDate, durationDays) => {
    if (!startDate || !durationDays || durationDays <= 0) return '';
    
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + parseInt(durationDays));
    
    return end.toISOString().split('T')[0];
  };

  const addMedicineToDetails = (medicine) => {
    const newDetail = {
      tempId: Date.now(),
      medicineId: medicine.id,
      medicineName: medicine.name,
      form: medicine.type || 1,
      strength: medicine.dosageForm || '',
      dosage: '',
      frequency: '',
      duration: '',
      durationDays: '',
      route: 1,
      foodTiming: 2,
      instructions: '',
      quantity: 1,
      refillAllowed: 0,
      refillCount: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: ''
    };
    
    setPrescriptionDetails(prev => [...prev, newDetail]);
    setShowMedicineSearch(false);
    setMedicineSearchQuery('');
    setFilteredMedicines([]);
  };

  const updatePrescriptionDetail = (tempId, field, value) => {
    setPrescriptionDetails(prev => 
      prev.map(detail => {
        if (detail.tempId === tempId) {
          const updated = { ...detail, [field]: value };
          
          // Auto-calculate duration text when days change
          if (field === 'durationDays') {
            const days = parseInt(value) || 0;
            updated.duration = days > 0 ? `${days} Days` : '';
            // Auto-calculate end date
            if (updated.startDate && days > 0) {
              updated.endDate = calculateEndDate(updated.startDate, days);
            }
          }
          
          // Recalculate end date when start date changes
          if (field === 'startDate' && updated.durationDays) {
            updated.endDate = calculateEndDate(value, updated.durationDays);
          }
          
          return updated;
        }
        return detail;
      })
    );
  };

  const removePrescriptionDetail = (tempId) => {
    setPrescriptionDetails(prev => prev.filter(detail => detail.tempId !== tempId));
  };

  const handleConsultationSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedVisit) {
      setError({ message: 'Please select a patient visit' });
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const consultationData = {
        clinicId,
        branchId,
        visitId: selectedVisit.id,
        patientId: selectedVisit.patientId,
        doctorId: selectedVisit.doctorId,
        reason: selectedVisit.reason || '',
        symptoms: selectedVisit.symptoms || '',
        bpSystolic: selectedVisit.bpSystolic || null,
        bpDiastolic: selectedVisit.bpDiastolic || null,
        temperature: selectedVisit.temperature || null,
        weight: selectedVisit.weight || null,
        emrNotes: consultationFormData.emrNotes.trim(),
        ehrNotes: consultationFormData.ehrNotes.trim(),
        instructions: consultationFormData.instructions.trim(),
        consultationNotes: consultationFormData.consultationNotes.trim(),
        nextConsultationDate: consultationFormData.nextConsultationDate || '',
        treatmentPlan: consultationFormData.treatmentPlan.trim()
      };

      const result = await addConsultation(consultationData);
      
      if (result.success && result.consultationId) {
        setConsultationId(result.consultationId);
        setCurrentWizardStep(2);
      }
    } catch (err) {
      console.error('handleConsultationSubmit error:', err);
      setError(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    
    if (!consultationId) {
      setError({ message: 'Consultation ID is missing' });
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const prescriptionData = {
        clinicId,
        branchId,
        ConsultationID: consultationId,
        VisitID: selectedVisit.id,
        PatientID: selectedVisit.patientId,
        DoctorID: selectedVisit.doctorId,
        DateIssued: prescriptionFormData.dateIssued,
        ValidUntil: prescriptionFormData.validUntil,
        Diagnosis: prescriptionFormData.diagnosis,
        Notes: prescriptionFormData.notes,
        IsRepeat: prescriptionFormData.isRepeat,
        RepeatCount: prescriptionFormData.repeatCount,
        CreatedBy: selectedVisit.doctorId
      };

      const prescResult = await addPrescription(prescriptionData);
      
      if (prescResult.success && prescResult.prescriptionId) {
        setPrescriptionId(prescResult.prescriptionId);
        setPrescriptionCreated(true);
      }
    } catch (err) {
      console.error('handleCreatePrescription error:', err);
      setError(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSavePrescriptionDetails = async () => {
    if (!prescriptionId) {
      setError({ message: 'Prescription ID is missing' });
      return;
    }

    if (prescriptionDetails.length === 0) {
      setError({ message: 'Please add at least one medicine' });
      return;
    }

    // Validate required fields
    for (const detail of prescriptionDetails) {
      if (!detail.dosage.trim()) {
        setError({ message: `Dosage is required for ${detail.medicineName}` });
        return;
      }
      if (!detail.frequency.trim()) {
        setError({ message: `Frequency is required for ${detail.medicineName}` });
        return;
      }
      if (detail.quantity <= 0) {
        setError({ message: `Quantity must be greater than 0 for ${detail.medicineName}` });
        return;
      }
    }

    try {
      setSubmitLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      for (const detail of prescriptionDetails) {
        const detailData = {
          clinicId,
          branchId,
          PrescriptionID: prescriptionId,
          MedicineID: detail.medicineId,
          MedicineName: detail.medicineName,
          Form: detail.form,
          Strength: detail.strength,
          Dosage: detail.dosage,
          Frequency: detail.frequency,
          Duration: detail.duration,
          Route: detail.route,
          FoodTiming: detail.foodTiming,
          Instructions: detail.instructions,
          Quantity: detail.quantity,
          RefillAllowed: detail.refillAllowed,
          RefillCount: detail.refillCount,
          StartDate: detail.startDate,
          EndDate: detail.endDate
        };
        
        await addPrescriptionDetail(detailData);
      }
      
      setCurrentWizardStep(3);
    } catch (err) {
      console.error('handleSavePrescriptionDetails error:', err);
      setError(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleLabTestSubmit = async (e) => {
    e.preventDefault();
    
    if (!consultationId) {
      setError({ message: 'Consultation ID is missing' });
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const labTestData = {
        clinicId,
        branchId,
        ConsultationID: consultationId,
        VisitID: selectedVisit.id,
        PatientID: selectedVisit.patientId,
        doctorId: selectedVisit.doctorId,
        priority: labTestFormData.priority,
        notes: labTestFormData.notes
      };

      await addLabTestOrder(labTestData);
      
      handleClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('handleLabTestSubmit error:', err);
      setError(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSkipStep = () => {
    if (currentWizardStep === 2) {
      setCurrentWizardStep(3);
    } else if (currentWizardStep === 3) {
      handleClose();
      if (onSuccess) onSuccess();
    }
  };

  const handleClose = () => {
    setCurrentWizardStep(1);
    setVisitSelectionStep(1);
    setSelectedVisit(null);
    setConsultationId(null);
    setPrescriptionId(null);
    setPrescriptionCreated(false);
    setConsultationFormData({
      emrNotes: '',
      ehrNotes: '',
      instructions: '',
      consultationNotes: '',
      nextConsultationDate: '',
      treatmentPlan: ''
    });
    setPrescriptionFormData({
      diagnosis: '',
      notes: '',
      isRepeat: 0,
      repeatCount: 0,
      dateIssued: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setPrescriptionDetails([]);
    setLabTestFormData({
      priority: 1,
      notes: ''
    });
    setAllMedicines([]);
    setFilteredMedicines([]);
    setMedicineSearchQuery('');
    setError(null);
    onClose();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getFormName = (formId) => {
    const form = MEDICINE_FORMS.find(f => f.id === formId);
    return form ? form.name : 'Unknown';
  };

  if (!isOpen) return null;

  return (
    <div className="add-consultation-overlay">
      <div className="add-consultation-modal">
        <div className="add-consultation-header">
          <div>
            <h2>New Consultation Wizard</h2>
            <p className="add-consultation-subtitle">
              {visitSelectionStep === 1 && currentWizardStep === 1 
                ? 'Step 1: Select Patient Visit' 
                : `${WIZARD_STEPS.find(s => s.id === currentWizardStep)?.name || 'Form'}`}
            </p>
          </div>
          <button onClick={handleClose} className="add-consultation-close-btn">
            <FiX size={24} />
          </button>
        </div>

        {visitSelectionStep === 2 && (
          <div className="wizard-progress">
            {WIZARD_STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className={`wizard-step ${currentWizardStep === step.id ? 'active' : ''} ${currentWizardStep > step.id ? 'completed' : ''}`}>
                  <div className="wizard-step-icon">
                    {currentWizardStep > step.id ? <FiCheck size={20} /> : <step.icon size={20} />}
                  </div>
                  <span className="wizard-step-label">{step.name}</span>
                </div>
                {index < WIZARD_STEPS.length - 1 && (
                  <div className={`wizard-connector ${currentWizardStep > step.id ? 'completed' : ''}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        <ErrorHandler error={error} />

        {currentWizardStep === 1 && visitSelectionStep === 1 && (
          <div className="add-consultation-body">
            {loading ? (
              <div className="add-consultation-loading">Loading today's visits...</div>
            ) : todayVisits.length === 0 ? (
              <div className="add-consultation-no-data">
                <FiCalendar size={48} />
                <p>No patient visits recorded today</p>
                <p className="add-consultation-hint">
                  Please add a patient visit first before creating a consultation
                </p>
              </div>
            ) : (
              <div className="visit-selection-grid">
                {todayVisits.map((visit) => (
                  <div 
                    key={visit.id} 
                    className="visit-card"
                    onClick={() => handleVisitSelect(visit)}
                  >
                    <div className="visit-card-header">
                      <div className="visit-avatar">
                        {visit.patientName?.charAt(0).toUpperCase() || 'P'}
                      </div>
                      <div className="visit-info">
                        <div className="visit-patient-name">{visit.patientName}</div>
                        <div className="visit-details">
                          {visit.patientFileNo} • {visit.patientMobile}
                        </div>
                      </div>
                    </div>
                    
                    <div className="visit-card-body">
                      <div className="visit-field">
                        <span className="visit-label">Doctor:</span>
                        <span className="visit-value">{visit.doctorFullName}</span>
                      </div>
                      <div className="visit-field">
                        <span className="visit-label">Time:</span>
                        <span className="visit-value">
                          {formatDate(visit.visitDate)} at {formatTime(visit.visitTime)}
                        </span>
                      </div>
                      {visit.reason && (
                        <div className="visit-field">
                          <span className="visit-label">Reason:</span>
                          <span className="visit-value">{visit.reason}</span>
                        </div>
                      )}
                      
                      {(visit.bpReading || visit.temperature || visit.weight) && (
                        <div className="visit-vitals">
                          {visit.bpReading && (
                            <span className="vital-badge bp">{visit.bpReading}</span>
                          )}
                          {visit.temperature && (
                            <span className="vital-badge temp">{visit.temperature}°F</span>
                          )}
                          {visit.weight && (
                            <span className="vital-badge weight">{visit.weight}kg</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="visit-card-footer">
                      <button className="select-visit-btn">
                        Select Visit <FiCheck size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentWizardStep === 1 && visitSelectionStep === 2 && selectedVisit && (
          <div className="add-consultation-body">
            <div className="selected-visit-summary">
              <div className="summary-header">
                <FiUser size={20} />
                <span>Selected Visit</span>
              </div>
              <div className="summary-content">
                <div className="summary-row">
                  <span className="summary-label">Patient:</span>
                  <span className="summary-value">{selectedVisit.patientName}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Doctor:</span>
                  <span className="summary-value">{selectedVisit.doctorFullName}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Visit Time:</span>
                  <span className="summary-value">
                    {formatDate(selectedVisit.visitDate)} at {formatTime(selectedVisit.visitTime)}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setVisitSelectionStep(1)} 
                className="change-visit-btn"
              >
                Change Visit
              </button>
            </div>

            <form onSubmit={handleConsultationSubmit} className="consultation-form">
              <div className="form-section">
                <h3 className="form-section-title">Medical Records</h3>
                
                <div className="form-group">
                  <label className="form-label">EMR Notes</label>
                  <textarea
                    name="emrNotes"
                    value={consultationFormData.emrNotes}
                    onChange={handleConsultationInputChange}
                    placeholder="Electronic Medical Record notes..."
                    className="form-textarea"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">EHR Notes</label>
                  <textarea
                    name="ehrNotes"
                    value={consultationFormData.ehrNotes}
                    onChange={handleConsultationInputChange}
                    placeholder="Electronic Health Record notes..."
                    className="form-textarea"
                    rows={3}
                  />
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">Consultation Details</h3>
                
                <div className="form-group">
                  <label className="form-label">Consultation Notes *</label>
                  <textarea
                    name="consultationNotes"
                    value={consultationFormData.consultationNotes}
                    onChange={handleConsultationInputChange}
                    placeholder="Detailed consultation notes..."
                    className="form-textarea"
                    rows={4}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Instructions</label>
                  <textarea
                    name="instructions"
                    value={consultationFormData.instructions}
                    onChange={handleConsultationInputChange}
                    placeholder="Instructions for patient..."
                    className="form-textarea"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Treatment Plan</label>
                  <textarea
                    name="treatmentPlan"
                    value={consultationFormData.treatmentPlan}
                    onChange={handleConsultationInputChange}
                    placeholder="Recommended treatment plan..."
                    className="form-textarea"
                    rows={4}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Next Consultation Date</label>
                  <input
                    type="date"
                    name="nextConsultationDate"
                    value={consultationFormData.nextConsultationDate}
                    onChange={handleConsultationInputChange}
                    className="form-input"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="add-consultation-actions">
                <button 
                  type="button" 
                  onClick={() => setVisitSelectionStep(1)} 
                  className="btn-secondary"
                  disabled={submitLoading}
                >
                  <FiChevronLeft size={18} /> Back
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={submitLoading}
                >
                  {submitLoading ? 'Saving...' : 'Next: Prescription'} <FiChevronRight size={18} />
                </button>
              </div>
            </form>
          </div>
        )}

        {currentWizardStep === 2 && (
          <div className="add-consultation-body">
            {!prescriptionCreated ? (
              <form onSubmit={handleCreatePrescription} className="consultation-form">
                <div className="prescription-info-banner">
                  <FiFileText size={24} />
                  <div>
                    <h4>Create Prescription Record</h4>
                    <p>First, create the prescription record with diagnosis and basic information. You'll be able to add medicines after.</p>
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="form-section-title">Prescription Information</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Date Issued *</label>
                      <input
                        type="date"
                        name="dateIssued"
                        value={prescriptionFormData.dateIssued}
                        onChange={handlePrescriptionInputChange}
                        className="form-input"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Valid Until *</label>
                      <input
                        type="date"
                        name="validUntil"
                        value={prescriptionFormData.validUntil}
                        onChange={handlePrescriptionInputChange}
                        className="form-input"
                        min={prescriptionFormData.dateIssued}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Diagnosis *</label>
                    <textarea
                      name="diagnosis"
                      value={prescriptionFormData.diagnosis}
                      onChange={handlePrescriptionInputChange}
                      placeholder="Patient diagnosis..."
                      className="form-textarea"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Prescription Notes</label>
                    <textarea
                      name="notes"
                      value={prescriptionFormData.notes}
                      onChange={handlePrescriptionInputChange}
                      placeholder="Additional notes..."
                      className="form-textarea"
                      rows={2}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-checkbox-label">
                        <input
                          type="checkbox"
                          name="isRepeat"
                          checked={prescriptionFormData.isRepeat === 1}
                          onChange={handlePrescriptionInputChange}
                          className="form-checkbox"
                        />
                        <span>Is Repeat Prescription</span>
                      </label>
                    </div>

                    {prescriptionFormData.isRepeat === 1 && (
                      <div className="form-group">
                        <label className="form-label">Repeat Count</label>
                        <input
                          type="number"
                          name="repeatCount"
                          value={prescriptionFormData.repeatCount}
                          onChange={handlePrescriptionInputChange}
                          className="form-input"
                          min="1"
                          max="12"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="add-consultation-actions">
                  <button 
                    type="button" 
                    onClick={handleSkipStep}
                    className="btn-secondary"
                    disabled={submitLoading}
                  >
                    Skip Prescription
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={submitLoading}
                  >
                    {submitLoading ? 'Creating...' : 'Create Prescription'} <FiChevronRight size={18} />
                  </button>
                </div>
              </form>
            ) : (
              <div className="consultation-form">
                <div className="prescription-created-banner">
                  <FiCheck size={24} />
                  <div>
                    <h4>Prescription Created Successfully</h4>
                    <p>Prescription ID: <strong>#{prescriptionId}</strong> • Now you can add medicines to this prescription</p>
                  </div>
                </div>

                <div className="form-section">
                  <div className="section-header-with-action">
                    <h3 className="form-section-title">Medicines</h3>
                    <button
                      type="button"
                      onClick={handleOpenMedicineSearch}
                      className="btn-add-medicine"
                    >
                      <FiPlus size={18} /> Add Medicine
                    </button>
                  </div>

                  {prescriptionDetails.length === 0 ? (
                    <div className="empty-medicines-state">
                      <FiPackage size={48} />
                      <p>No medicines added yet</p>
                      <p className="hint-text">Click "Add Medicine" to prescribe medications</p>
                    </div>
                  ) : (
                    <div className="medicines-list">
                      {prescriptionDetails.map((detail, index) => (
                        <div key={detail.tempId} className="medicine-detail-card">
                          <div className="medicine-card-header">
                            <div>
                              <h4>Medicine {index + 1}: {detail.medicineName}</h4>
                              <span className="medicine-form-badge">{getFormName(detail.form)}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removePrescriptionDetail(detail.tempId)}
                              className="btn-remove-medicine"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>

                          <div className="medicine-card-body">
                            <div className="form-row">
                              <div className="form-group">
                                <label className="form-label">Strength</label>
                                <input
                                  type="text"
                                  value={detail.strength}
                                  onChange={(e) => updatePrescriptionDetail(detail.tempId, 'strength', e.target.value)}
                                  placeholder="e.g., 500mg"
                                  className="form-input"
                                />
                              </div>

                              <div className="form-group">
                                <label className="form-label">Dosage *</label>
                                <input
                                  type="text"
                                  value={detail.dosage}
                                  onChange={(e) => updatePrescriptionDetail(detail.tempId, 'dosage', e.target.value)}
                                  placeholder="e.g., 1 tablet"
                                  className="form-input"
                                  required
                                />
                              </div>

                              <div className="form-group">
                                <label className="form-label">Frequency *</label>
                                <input
                                  type="text"
                                  value={detail.frequency}
                                  onChange={(e) => updatePrescriptionDetail(detail.tempId, 'frequency', e.target.value)}
                                  placeholder="e.g., Twice daily"
                                  className="form-input"
                                  required
                                />
                              </div>
                            </div>

                            <div className="form-row">
                              <div className="form-group">
                                <label className="form-label">Duration Days</label>
                                <input
                                  type="number"
                                  value={detail.durationDays}
                                  onChange={(e) => updatePrescriptionDetail(detail.tempId, 'durationDays', e.target.value)}
                                  placeholder="e.g., 7"
                                  className="form-input"
                                  min="1"
                                />
                                {detail.duration && (
                                  <span className="form-hint">{detail.duration}</span>
                                )}
                              </div>

                              <div className="form-group">
                                <label className="form-label">Route</label>
                                <select
                                  value={detail.route}
                                  onChange={(e) => updatePrescriptionDetail(detail.tempId, 'route', Number(e.target.value))}
                                  className="form-input"
                                >
                                  {MEDICINE_ROUTES.map(route => (
                                    <option key={route.id} value={route.id}>{route.name}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="form-group">
                                <label className="form-label">Food Timing</label>
                                <select
                                  value={detail.foodTiming}
                                  onChange={(e) => updatePrescriptionDetail(detail.tempId, 'foodTiming', Number(e.target.value))}
                                  className="form-input"
                                >
                                  {FOOD_TIMINGS.map(timing => (
                                    <option key={timing.id} value={timing.id}>{timing.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="form-row">
                              <div className="form-group">
                                <label className="form-label">Quantity *</label>
                                <input
                                  type="number"
                                  value={detail.quantity}
                                  onChange={(e) => updatePrescriptionDetail(detail.tempId, 'quantity', Number(e.target.value))}
                                  className="form-input"
                                  min="0.5"
                                  step="0.5"
                                  required
                                />
                              </div>

                              <div className="form-group">
                                <label className="form-label">Start Date</label>
                                <input
                                  type="date"
                                  value={detail.startDate}
                                  onChange={(e) => updatePrescriptionDetail(detail.tempId, 'startDate', e.target.value)}
                                  className="form-input"
                                />
                              </div>

                              <div className="form-group">
                                <label className="form-label">End Date</label>
                                <input
                                  type="date"
                                  value={detail.endDate}
                                  onChange={(e) => updatePrescriptionDetail(detail.tempId, 'endDate', e.target.value)}
                                  className="form-input"
                                  min={detail.startDate}
                                />
                              </div>
                            </div>

                            <div className="form-group">
                              <label className="form-label">Instructions</label>
                              <textarea
                                value={detail.instructions}
                                onChange={(e) => updatePrescriptionDetail(detail.tempId, 'instructions', e.target.value)}
                                placeholder="Additional instructions..."
                                className="form-textarea"
                                rows={2}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="add-consultation-actions">
                  <button 
                    type="button" 
                    onClick={() => setCurrentWizardStep(3)}
                    className="btn-secondary"
                    disabled={submitLoading}
                  >
                    Skip & Continue
                  </button>
                  <button 
                    type="button"
                    onClick={handleSavePrescriptionDetails}
                    className="btn-primary"
                    disabled={submitLoading || prescriptionDetails.length === 0}
                  >
                    {submitLoading ? 'Saving...' : 'Save Medicines & Continue'} <FiChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentWizardStep === 3 && (
          <div className="add-consultation-body">
            <form onSubmit={handleLabTestSubmit} className="consultation-form">
              <div className="form-section">
                <h3 className="form-section-title">Lab Test Order</h3>
                
                <div className="form-group">
                  <label className="form-label">Priority *</label>
                  <select
                    name="priority"
                    value={labTestFormData.priority}
                    onChange={handleLabTestInputChange}
                    className="form-input"
                    required
                  >
                    {LAB_PRIORITIES.map(priority => (
                      <option key={priority.id} value={priority.id}>{priority.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    name="notes"
                    value={labTestFormData.notes}
                    onChange={handleLabTestInputChange}
                    placeholder="Lab test notes and instructions..."
                    className="form-textarea"
                    rows={4}
                  />
                </div>
              </div>

              <div className="add-consultation-actions">
                <button 
                  type="button" 
                  onClick={handleSkipStep}
                  className="btn-secondary"
                  disabled={submitLoading}
                >
                  Skip Lab Tests
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={submitLoading}
                >
                  {submitLoading ? 'Saving...' : 'Complete'} <FiCheck size={18} />
                </button>
              </div>
            </form>
          </div>
        )}

        {showMedicineSearch && (
          <div className="medicine-search-overlay">
            <div className="medicine-search-modal">
              <div className="medicine-search-header">
                <h3>Search Medicine</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowMedicineSearch(false);
                    setMedicineSearchQuery('');
                    setFilteredMedicines([]);
                    setAllMedicines([]);
                  }}
                  className="close-search-btn"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="medicine-search-body">
                <div className="search-input-group">
                  <input
                    type="text"
                    value={medicineSearchQuery}
                    onChange={(e) => setMedicineSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleMedicineSearch()}
                    placeholder="Enter medicine name..."
                    className="search-input"
                  />
                  <button
                    type="button"
                    onClick={handleMedicineSearch}
                    className="search-btn"
                    disabled={searchingMedicines}
                  >
                    <FiSearch size={18} />
                    {searchingMedicines ? 'Searching...' : 'Search'}
                  </button>
                </div>

                <div className="search-results">
                  {searchingMedicines ? (
                    <div className="loading-medicines">
                      <div className="spinner"></div>
                      <p>Loading medicines...</p>
                    </div>
                  ) : filteredMedicines.length === 0 ? (
                    <div className="no-results">
                      <FiPackage size={48} />
                      <p>No medicines found</p>
                      <p className="hint-text">Try searching with a different name</p>
                    </div>
                  ) : (
                    <div className="medicine-results-grid">
                      {filteredMedicines.map(medicine => (
                        <div
                          key={medicine.id}
                          className="medicine-result-card"
                          onClick={() => addMedicineToDetails(medicine)}
                        >
                          <div className="medicine-name">{medicine.name}</div>
                          {medicine.genericName && (
                            <div className="medicine-generic">{medicine.genericName}</div>
                          )}
                          <div className="medicine-info-row">
                            <span className="medicine-form-tag">{getFormName(medicine.type)}</span>
                            {medicine.dosageForm && (
                              <span className="medicine-strength-tag">{medicine.dosageForm}</span>
                            )}
                          </div>
                          {medicine.manufacturer && (
                            <div className="medicine-manufacturer">{medicine.manufacturer}</div>
                          )}
                          <button className="select-medicine-btn">
                            <FiPlus size={16} /> Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddConsultation;