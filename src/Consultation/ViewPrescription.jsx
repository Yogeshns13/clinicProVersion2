// src/components/ViewPrescription.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiFileText, FiPackage, FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiCheck } from 'react-icons/fi';
import { getConsultationList } from '../api/api-consultation.js';
import { 
  getPrescriptionList, 
  addPrescription, 
  updatePrescription, 
  deletePrescription,
  getPrescriptionDetailList,
  addPrescriptionDetail,
  updatePrescriptionDetail,
  deletePrescriptionDetail,
  getMedicineMasterList
} from '../api/api-pharmacy.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './ViewPrescription.module.css';

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

const ViewPrescription = () => {
  const { id } = useParams(); // consultation ID
  const navigate = useNavigate();

  const [consultation, setConsultation] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [prescriptionDetails, setPrescriptionDetails] = useState([]);
  const [activeTab, setActiveTab] = useState('prescription');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Prescription Form States
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [prescriptionFormData, setPrescriptionFormData] = useState({
    diagnosis: '',
    notes: '',
    isRepeat: 0,
    repeatCount: 0,
    dateIssued: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // Prescription Detail Form States
  const [showDetailForm, setShowDetailForm] = useState(false);
  const [editingDetail, setEditingDetail] = useState(null);
  const [detailFormData, setDetailFormData] = useState({
    medicineId: '',
    medicineName: '',
    form: 1,
    strength: '',
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
  });

  // Medicine Search States
  const [showMedicineSearch, setShowMedicineSearch] = useState(false);
  const [medicineSearchQuery, setMedicineSearchQuery] = useState('');
  const [allMedicines, setAllMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [searchingMedicines, setSearchingMedicines] = useState(false);

  useEffect(() => {
    if (id) {
      fetchConsultationAndPrescription();
    }
  }, [id]);

  const fetchConsultationAndPrescription = async () => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      // Fetch consultation details
      const consultOptions = {
        Page: 1,
        PageSize: 1,
        BranchID: branchId,
        ConsultationID: Number(id)
      };

      const consultData = await getConsultationList(clinicId, consultOptions);

      if (consultData && consultData.length > 0) {
        setConsultation(consultData[0]);

        // Fetch prescription for this consultation
        const prescOptions = {
          Page: 1,
          PageSize: 1,
          BranchID: branchId,
          ConsultationID: Number(id)
        };

        const prescData = await getPrescriptionList(clinicId, prescOptions);

        if (prescData && prescData.length > 0) {
          const prescriptionRecord = prescData[0];
          setPrescription(prescriptionRecord);

          // Fetch prescription details
          const detailOptions = {
            Page: 1,
            PageSize: 50,
            BranchID: branchId,
            PrescriptionID: prescriptionRecord.id,
            Status: 1
          };

          const detailsData = await getPrescriptionDetailList(clinicId, detailOptions);
          const activeMedicines = detailsData.filter(detail => detail.status === 1);
          setPrescriptionDetails(activeMedicines);
        }
      } else {
        setError({ message: 'Consultation not found' });
      }
    } catch (err) {
      console.error('fetchConsultationAndPrescription error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load prescription details' }
      );
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
        Status: 1
      });
      
      setAllMedicines(results || []);
      setFilteredMedicines(results || []);
    } catch (err) {
      console.error('fetchAllMedicines error:', err);
      setError(err);
      setAllMedicines([]);
      setFilteredMedicines([]);
    } finally {
      setSearchingMedicines(false);
    }
  };

  const handleMedicineSearch = (query) => {
    const searchQuery = query !== undefined ? query : medicineSearchQuery;
    
    if (!searchQuery.trim()) {
      setFilteredMedicines(allMedicines);
      return;
    }
    
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = allMedicines.filter(medicine => 
      medicine.name?.toLowerCase().includes(lowerQuery) ||
      medicine.genericName?.toLowerCase().includes(lowerQuery) ||
      medicine.manufacturer?.toLowerCase().includes(lowerQuery)
    );
    
    setFilteredMedicines(filtered);
  };

  const handleOpenMedicineSearch = () => {
    setShowMedicineSearch(true);
    setMedicineSearchQuery('');
    fetchAllMedicines();
  };

  const handleSelectMedicine = (medicine) => {
    setDetailFormData(prev => ({
      ...prev,
      medicineId: medicine.id,
      medicineName: medicine.name,
      form: medicine.type || 1,
      strength: medicine.dosageForm || ''
    }));
    setShowMedicineSearch(false);
    setMedicineSearchQuery('');
  };

  const handleCloseMedicineSearch = () => {
    setShowMedicineSearch(false);
    setMedicineSearchQuery('');
    setFilteredMedicines([]);
    setAllMedicines([]);
  };

  const calculateEndDate = (startDate, durationDays) => {
    if (!startDate || !durationDays || durationDays <= 0) return '';
    
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + parseInt(durationDays));
    
    return end.toISOString().split('T')[0];
  };

  const handleDetailInputChange = (e) => {
    const { name, value } = e.target;
    setDetailFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      if (name === 'durationDays') {
        const days = parseInt(value) || 0;
        updated.duration = days > 0 ? `${days} Days` : '';
        if (updated.startDate && days > 0) {
          updated.endDate = calculateEndDate(updated.startDate, days);
        }
      }
      
      if (name === 'startDate' && updated.durationDays) {
        updated.endDate = calculateEndDate(value, updated.durationDays);
      }
      
      return updated;
    });
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

  const handleAddPrescription = async (e) => {
    e.preventDefault();
    
    if (!consultation) {
      setError({ message: 'Consultation data is missing' });
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
        ConsultationID: consultation.id,
        VisitID: consultation.visitId,
        PatientID: consultation.patientId,
        DoctorID: consultation.doctorId,
        DateIssued: prescriptionFormData.dateIssued,
        ValidUntil: prescriptionFormData.validUntil,
        Diagnosis: prescriptionFormData.diagnosis,
        Notes: prescriptionFormData.notes,
        IsRepeat: prescriptionFormData.isRepeat,
        RepeatCount: prescriptionFormData.repeatCount,
        CreatedBy: consultation.doctorId
      };

      const result = await addPrescription(prescriptionData);
      
      if (result.success) {
        await fetchConsultationAndPrescription();
        setShowPrescriptionForm(false);
        resetPrescriptionForm();
      }
    } catch (err) {
      console.error('handleAddPrescription error:', err);
      setError(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdatePrescription = async (e) => {
    e.preventDefault();
    
    if (!prescription) {
      setError({ message: 'Prescription data is missing' });
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const prescriptionData = {
        PrescriptionID: prescription.id,
        clinicId,
        branchId,
        DateIssued: prescriptionFormData.dateIssued,
        ValidUntil: prescriptionFormData.validUntil,
        Notes: prescriptionFormData.notes,
        IsRepeat: prescriptionFormData.isRepeat,
        RepeatCount: prescriptionFormData.repeatCount,
        Status: 1
      };

      const result = await updatePrescription(prescriptionData);
      
      if (result.success) {
        await fetchConsultationAndPrescription();
        setShowPrescriptionForm(false);
        resetPrescriptionForm();
      }
    } catch (err) {
      console.error('handleUpdatePrescription error:', err);
      setError(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeletePrescription = async () => {
    if (!prescription) return;
    
    if (!window.confirm('Are you sure you want to delete this prescription? All prescription details will also be deleted.')) {
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);

      await deletePrescription(prescription.id);
      await fetchConsultationAndPrescription();
    } catch (err) {
      console.error('handleDeletePrescription error:', err);
      setError(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAddDetail = async (e) => {
    e.preventDefault();
    
    if (!prescription) {
      setError({ message: 'Please create a prescription first' });
      return;
    }

    if (!detailFormData.medicineId) {
      setError({ message: 'Please select a medicine' });
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const detailData = {
        clinicId,
        branchId,
        PrescriptionID: prescription.id,
        MedicineID: detailFormData.medicineId,
        MedicineName: detailFormData.medicineName,
        Form: detailFormData.form,
        Strength: detailFormData.strength,
        Dosage: detailFormData.dosage,
        Frequency: detailFormData.frequency,
        Duration: detailFormData.duration,
        Route: detailFormData.route,
        FoodTiming: detailFormData.foodTiming,
        Instructions: detailFormData.instructions,
        Quantity: detailFormData.quantity,
        RefillAllowed: detailFormData.refillAllowed,
        RefillCount: detailFormData.refillCount,
        StartDate: detailFormData.startDate,
        EndDate: detailFormData.endDate
      };

      const result = await addPrescriptionDetail(detailData);
      
      if (result.success) {
        await fetchConsultationAndPrescription();
        setShowDetailForm(false);
        resetDetailForm();
      }
    } catch (err) {
      console.error('handleAddDetail error:', err);
      setError(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateDetail = async (e) => {
    e.preventDefault();
    
    if (!editingDetail) return;

    try {
      setSubmitLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const detailData = {
        PrescriptionDetailID: editingDetail.id,
        ClinicID: clinicId,
        BranchID: branchId,
        Form: detailFormData.form,
        Strength: detailFormData.strength,
        Dosage: detailFormData.dosage,
        Frequency: detailFormData.frequency,
        Duration: detailFormData.duration,
        Route: detailFormData.route,
        FoodTiming: detailFormData.foodTiming,
        Instructions: detailFormData.instructions,
        Quantity: detailFormData.quantity,
        RefillAllowed: detailFormData.refillAllowed,
        RefillCount: detailFormData.refillCount,
        StartDate: detailFormData.startDate,
        EndDate: detailFormData.endDate,
        Status: 1
      };

      const result = await updatePrescriptionDetail(detailData);
      
      if (result.success) {
        await fetchConsultationAndPrescription();
        setShowDetailForm(false);
        setEditingDetail(null);
        resetDetailForm();
      }
    } catch (err) {
      console.error('handleUpdateDetail error:', err);
      setError(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteDetail = async (detailId) => {
    if (!window.confirm('Are you sure you want to delete this medicine?')) {
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);

      await deletePrescriptionDetail(detailId);
      await fetchConsultationAndPrescription();
    } catch (err) {
      console.error('handleDeleteDetail error:', err);
      setError(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const openAddPrescriptionForm = () => {
    resetPrescriptionForm();
    setShowPrescriptionForm(true);
  };

  const openUpdatePrescriptionForm = () => {
    if (prescription) {
      setPrescriptionFormData({
        diagnosis: prescription.diagnosis || '',
        notes: prescription.notes || '',
        isRepeat: prescription.isRepeat ? 1 : 0,
        repeatCount: prescription.repeatCount || 0,
        dateIssued: prescription.dateIssued?.split('T')[0] || new Date().toISOString().split('T')[0],
        validUntil: prescription.validUntil?.split('T')[0] || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      setShowPrescriptionForm(true);
    }
  };

  const openAddDetailForm = () => {
    resetDetailForm();
    setEditingDetail(null);
    setShowDetailForm(true);
  };

  const openEditDetailForm = (detail) => {
    setEditingDetail(detail);
    setDetailFormData({
      medicineId: detail.medicineId,
      medicineName: detail.medicineName,
      form: detail.form,
      strength: detail.strength || '',
      dosage: detail.dosage || '',
      frequency: detail.frequency || '',
      duration: detail.duration || '',
      durationDays: '',
      route: detail.route,
      foodTiming: detail.foodTiming,
      instructions: detail.instructions || '',
      quantity: detail.quantity ? parseFloat(detail.quantity) : 1,
      refillAllowed: detail.refillAllowed ? 1 : 0,
      refillCount: detail.refillCount || 0,
      startDate: detail.startDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      endDate: detail.endDate?.split('T')[0] || ''
    });
    setShowDetailForm(true);
  };

  const resetPrescriptionForm = () => {
    setPrescriptionFormData({
      diagnosis: '',
      notes: '',
      isRepeat: 0,
      repeatCount: 0,
      dateIssued: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  };

  const resetDetailForm = () => {
    setDetailFormData({
      medicineId: '',
      medicineName: '',
      form: 1,
      strength: '',
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
    });
  };

  const handleBack = () => {
    navigate('/consultation-list');
  };

  const handleTabClick = (tab, path) => {
    if (path) {
      navigate(path);
    } else {
      setActiveTab(tab);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateOnly = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFormName = (formId) => {
    const form = MEDICINE_FORMS.find(f => f.id === formId);
    return form ? form.name : 'Unknown';
  };

  const getRouteName = (routeId) => {
    const route = MEDICINE_ROUTES.find(r => r.id === routeId);
    return route ? route.name : 'Unknown';
  };

  const getFoodTimingName = (timingId) => {
    const timing = FOOD_TIMINGS.find(t => t.id === timingId);
    return timing ? timing.name : 'Unknown';
  };

  const getStatusClass = (status) => {
    if (status === 'active') return 'active';
    if (status === 'completed') return 'completed';
    if (status === 'inactive') return 'inactive';
    return 'inactive';
  };

  const canDeletePrescription = prescription && prescriptionDetails.length === 0;

  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.loading}>Loading prescription details...</div>;

  if (error) return <div className={styles.error}>Error: {error.message || error}</div>;

  if (!consultation) return <div className={styles.error}>Consultation not found</div>;

  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Prescription Details" />

      {/* Back Button */}
      <div className={styles.toolbar}>
        <button onClick={handleBack} className={styles.backBtn}>
          <FiArrowLeft size={20} /> Back to List
        </button>
      </div>

      {/* Common Card Header */}
      <div className={styles.detailsCard}>
        <div className={styles.cardHeader}>
          <div className={styles.headerInfo}>
            <h2>{consultation.patientName}</h2>
            <p className={styles.subtitle}>
              {consultation.doctorFullName} • {formatDateOnly(consultation.dateCreated)}
            </p>
            <span className={`${styles.statusBadge} ${styles.large} ${styles[getStatusClass(consultation.status || 'completed')]}`}>
              {(consultation.status || 'COMPLETED').toUpperCase()}
            </span>
          </div>

          {/* Tab Navigation */}
          <div className={styles.tabs}>
            <button
              className={styles.tabButton}
              onClick={() => handleTabClick('details', `/view-consultation/${id}`)}
            >
              Consultation Details
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'prescription' ? styles.active : ''}`}
              onClick={() => handleTabClick('prescription')}
            >
              Prescription Details
            </button>
            <button
              className={styles.tabButton}
              onClick={() => handleTabClick('laborder', `/view-laborder/${id}`)}
            >
              Lab Order Details
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className={styles.cardBody}>
          {/* Section 1: Prescription */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <FiFileText size={20} />
                <span>Prescription</span>
              </div>
              <div className={styles.sectionActions}>
                {!prescription ? (
                  <button onClick={openAddPrescriptionForm} className={styles.btnAdd}>
                    <FiPlus size={16} /> Add Prescription
                  </button>
                ) : (
                  <>
                    <button onClick={openUpdatePrescriptionForm} className={styles.btnUpdate}>
                      <FiEdit2 size={16} /> Update
                    </button>
                    {canDeletePrescription && (
                      <button onClick={handleDeletePrescription} className={styles.btnDelete} disabled={submitLoading}>
                        <FiTrash2 size={16} /> Delete
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {prescription ? (
              <div className={styles.prescriptionCard}>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Date Issued</span>
                    <span className={styles.detailValue}>{formatDate(prescription.dateIssued)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Valid Until</span>
                    <span className={styles.detailValue}>{formatDate(prescription.validUntil)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Is Repeat</span>
                    <span className={styles.detailValue}>{prescription.isRepeat ? `Yes (${prescription.repeatCount} times)` : 'No'}</span>
                  </div>
                </div>
                
                {prescription.diagnosis && (
                  <div className={styles.contentSection}>
                    <span className={styles.detailLabel}>Diagnosis</span>
                    <div className={styles.contentBox}>{prescription.diagnosis}</div>
                  </div>
                )}
                
                {prescription.notes && (
                  <div className={styles.contentSection}>
                    <span className={styles.detailLabel}>Notes</span>
                    <div className={styles.contentBox}>{prescription.notes}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <FiFileText size={48} />
                <p>No prescription created yet</p>
                <p className={styles.hintText}>Click "Add Prescription" to create one</p>
              </div>
            )}
          </div>

          {/* Section 2: Prescription Details (Medicines) */}
          {prescription && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                  <FiPackage size={20} />
                  <span>Medicines</span>
                </div>
                <div className={styles.sectionActions}>
                  <button onClick={openAddDetailForm} className={styles.btnAdd}>
                    <FiPlus size={16} /> Add Medicine
                  </button>
                </div>
              </div>

              {prescriptionDetails.length === 0 ? (
                <div className={styles.emptyState}>
                  <FiPackage size={48} />
                  <p>No medicines added yet</p>
                  <p className={styles.hintText}>Click "Add Medicine" to prescribe medications</p>
                </div>
              ) : (
                <div className={styles.medicinesList}>
                  {prescriptionDetails.map((detail, index) => (
                    <div key={detail.id} className={styles.medicineCard}>
                      <div className={styles.medicineHeader}>
                        <div>
                          <h4>Medicine {index + 1}: {detail.medicineName}</h4>
                          <span className={styles.formBadge}>{detail.formDesc}</span>
                        </div>
                        <div className={styles.medicineActions}>
                          <button onClick={() => openEditDetailForm(detail)} className={styles.btnEdit}>
                            <FiEdit2 size={14} /> Edit
                          </button>
                          <button onClick={() => handleDeleteDetail(detail.id)} className={styles.btnRemove} disabled={submitLoading}>
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className={styles.medicineBody}>
                        <div className={styles.detailsGrid}>
                          {detail.strength && (
                            <div className={styles.detailItem}>
                              <span className={styles.detailLabel}>Strength</span>
                              <span className={styles.detailValue}>{detail.strength}</span>
                            </div>
                          )}
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Dosage</span>
                            <span className={styles.detailValue}>{detail.dosage}</span>
                          </div>
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Frequency</span>
                            <span className={styles.detailValue}>{detail.frequency}</span>
                          </div>
                          {detail.duration && (
                            <div className={styles.detailItem}>
                              <span className={styles.detailLabel}>Duration</span>
                              <span className={styles.detailValue}>{detail.duration}</span>
                            </div>
                          )}
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Route</span>
                            <span className={styles.detailValue}>{detail.routeDesc}</span>
                          </div>
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Food Timing</span>
                            <span className={styles.detailValue}>{detail.foodTimingDesc}</span>
                          </div>
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Quantity</span>
                            <span className={styles.detailValue}>{detail.quantity}</span>
                          </div>
                          {detail.startDate && (
                            <div className={styles.detailItem}>
                              <span className={styles.detailLabel}>Start Date</span>
                              <span className={styles.detailValue}>{formatDate(detail.startDate)}</span>
                            </div>
                          )}
                          {detail.endDate && (
                            <div className={styles.detailItem}>
                              <span className={styles.detailLabel}>End Date</span>
                              <span className={styles.detailValue}>{formatDate(detail.endDate)}</span>
                            </div>
                          )}
                        </div>

                        {detail.instructions && (
                          <div className={styles.contentSection}>
                            <span className={styles.detailLabel}>Instructions</span>
                            <div className={styles.contentBox}>{detail.instructions}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Prescription Form Modal */}
      {showPrescriptionForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{prescription ? 'Update Prescription' : 'Add Prescription'}</h3>
              <button onClick={() => setShowPrescriptionForm(false)} className={styles.closeBtn}>
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={prescription ? handleUpdatePrescription : handleAddPrescription} className={styles.modalBody}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Date Issued *</label>
                  <input
                    type="date"
                    name="dateIssued"
                    value={prescriptionFormData.dateIssued}
                    onChange={handlePrescriptionInputChange}
                    className={styles.formInput}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Valid Until *</label>
                  <input
                    type="date"
                    name="validUntil"
                    value={prescriptionFormData.validUntil}
                    onChange={handlePrescriptionInputChange}
                    className={styles.formInput}
                    min={prescriptionFormData.dateIssued}
                    required
                  />
                </div>
              </div>

              {!prescription && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Diagnosis *</label>
                  <textarea
                    name="diagnosis"
                    value={prescriptionFormData.diagnosis}
                    onChange={handlePrescriptionInputChange}
                    placeholder="Patient diagnosis..."
                    className={styles.formTextarea}
                    rows={3}
                    required
                  />
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Prescription Notes</label>
                <textarea
                  name="notes"
                  value={prescriptionFormData.notes}
                  onChange={handlePrescriptionInputChange}
                  placeholder="Additional notes..."
                  className={styles.formTextarea}
                  rows={2}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="isRepeat"
                      checked={prescriptionFormData.isRepeat === 1}
                      onChange={handlePrescriptionInputChange}
                      className={styles.checkbox}
                    />
                    <span>Is Repeat Prescription</span>
                  </label>
                </div>

                {prescriptionFormData.isRepeat === 1 && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Repeat Count</label>
                    <input
                      type="number"
                      name="repeatCount"
                      value={prescriptionFormData.repeatCount}
                      onChange={handlePrescriptionInputChange}
                      className={styles.formInput}
                      min="1"
                      max="12"
                    />
                  </div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowPrescriptionForm(false)} className={styles.btnCancel}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnSubmit} disabled={submitLoading}>
                  {submitLoading ? 'Saving...' : prescription ? 'Update' : 'Create'} <FiCheck size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prescription Detail Form Modal */}
      {showDetailForm && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} ${styles.largeModal}`}>
            <div className={styles.modalHeader}>
              <h3>{editingDetail ? 'Update Medicine' : 'Add Medicine'}</h3>
              <button onClick={() => { setShowDetailForm(false); setEditingDetail(null); }} className={styles.closeBtn}>
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={editingDetail ? handleUpdateDetail : handleAddDetail} className={styles.modalBody}>
              {!editingDetail && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Medicine *</label>
                  <div className={styles.medicineSelectGroup}>
                    <input
                      type="text"
                      value={detailFormData.medicineName}
                      placeholder="Click to search medicine..."
                      className={styles.formInput}
                      readOnly
                      required
                    />
                    <button type="button" onClick={handleOpenMedicineSearch} className={styles.btnSearch}>
                      <FiSearch size={16} /> Search
                    </button>
                  </div>
                </div>
              )}

              {editingDetail && (
                <div className={styles.medicineInfoBanner}>
                  <FiPackage size={20} />
                  <div>
                    <strong>{detailFormData.medicineName}</strong>
                    <span>{getFormName(detailFormData.form)}</span>
                  </div>
                </div>
              )}

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Form</label>
                  <select
                    name="form"
                    value={detailFormData.form}
                    onChange={handleDetailInputChange}
                    className={styles.formInput}
                    disabled={editingDetail !== null}
                  >
                    {MEDICINE_FORMS.map(form => (
                      <option key={form.id} value={form.id}>{form.name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Strength</label>
                  <input
                    type="text"
                    name="strength"
                    value={detailFormData.strength}
                    onChange={handleDetailInputChange}
                    placeholder="e.g., 500mg"
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Dosage *</label>
                  <input
                    type="text"
                    name="dosage"
                    value={detailFormData.dosage}
                    onChange={handleDetailInputChange}
                    placeholder="e.g., 1 tablet"
                    className={styles.formInput}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Frequency *</label>
                  <input
                    type="text"
                    name="frequency"
                    value={detailFormData.frequency}
                    onChange={handleDetailInputChange}
                    placeholder="e.g., Twice daily"
                    className={styles.formInput}
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Duration Days</label>
                  <input
                    type="number"
                    name="durationDays"
                    value={detailFormData.durationDays}
                    onChange={handleDetailInputChange}
                    placeholder="e.g., 7"
                    className={styles.formInput}
                    min="1"
                  />
                  {detailFormData.duration && (
                    <span className={styles.formHint}>{detailFormData.duration}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Route</label>
                  <select
                    name="route"
                    value={detailFormData.route}
                    onChange={handleDetailInputChange}
                    className={styles.formInput}
                  >
                    {MEDICINE_ROUTES.map(route => (
                      <option key={route.id} value={route.id}>{route.name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Food Timing</label>
                  <select
                    name="foodTiming"
                    value={detailFormData.foodTiming}
                    onChange={handleDetailInputChange}
                    className={styles.formInput}
                  >
                    {FOOD_TIMINGS.map(timing => (
                      <option key={timing.id} value={timing.id}>{timing.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={detailFormData.quantity}
                    onChange={handleDetailInputChange}
                    className={styles.formInput}
                    min="0.5"
                    step="0.5"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={detailFormData.startDate}
                    onChange={handleDetailInputChange}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={detailFormData.endDate}
                    onChange={handleDetailInputChange}
                    className={styles.formInput}
                    min={detailFormData.startDate}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Instructions</label>
                <textarea
                  name="instructions"
                  value={detailFormData.instructions}
                  onChange={handleDetailInputChange}
                  placeholder="Additional instructions..."
                  className={styles.formTextarea}
                  rows={2}
                />
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={() => { setShowDetailForm(false); setEditingDetail(null); }} className={styles.btnCancel}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnSubmit} disabled={submitLoading}>
                  {submitLoading ? 'Saving...' : editingDetail ? 'Update' : 'Add'} <FiCheck size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Medicine Search Modal */}
      {showMedicineSearch && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} ${styles.searchModal}`}>
            <div className={styles.modalHeader}>
              <h3>Search Medicine</h3>
              <button onClick={handleCloseMedicineSearch} className={styles.closeBtn}>
                <FiX size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.searchInputGroup}>
                <FiSearch className={styles.searchIcon} size={18} />
                <input
                  type="text"
                  value={medicineSearchQuery}
                  onChange={(e) => {
                    setMedicineSearchQuery(e.target.value);
                    handleMedicineSearch(e.target.value);
                  }}
                  placeholder="Type medicine name, generic name, or manufacturer..."
                  className={styles.searchInputEnhanced}
                  autoFocus
                />
                {medicineSearchQuery && (
                  <button 
                    onClick={() => {
                      setMedicineSearchQuery('');
                      setFilteredMedicines(allMedicines);
                    }} 
                    className={styles.clearSearchBtn}
                    type="button"
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>

              <div className={styles.searchResultsHeader}>
                <span className={styles.resultsCount}>
                  {searchingMedicines ? 'Loading...' : `${filteredMedicines.length} medicine${filteredMedicines.length !== 1 ? 's' : ''} found`}
                </span>
              </div>

              <div className={styles.searchResults}>
                {searchingMedicines ? (
                  <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Loading medicines...</p>
                  </div>
                ) : filteredMedicines.length === 0 ? (
                  <div className={styles.emptyState}>
                    <FiPackage size={48} />
                    <p>No medicines found</p>
                    {medicineSearchQuery && (
                      <p className={styles.hintText}>Try a different search term</p>
                    )}
                  </div>
                ) : (
                  <div className={styles.medicineResultsList}>
                    {filteredMedicines.map(medicine => (
                      <div
                        key={medicine.id}
                        className={styles.medicineResultItem}
                        onClick={() => handleSelectMedicine(medicine)}
                      >
                        <div className={styles.medicineResultContent}>
                          <div className={styles.medicineResultHeader}>
                            <div className={styles.medicineName}>{medicine.name}</div>
                            <div className={styles.medicineResultTags}>
                              <span className={styles.medicineFormTag}>{getFormName(medicine.type)}</span>
                              {medicine.dosageForm && (
                                <span className={styles.medicineStrengthTag}>{medicine.dosageForm}</span>
                              )}
                            </div>
                          </div>
                          
                          {medicine.genericName && (
                            <div className={styles.medicineGeneric}>
                              <span className={styles.genericLabel}>Generic:</span> {medicine.genericName}
                            </div>
                          )}
                          
                          {medicine.manufacturer && (
                            <div className={styles.medicineManufacturer}>
                              <span className={styles.manufacturerLabel}>Mfr:</span> {medicine.manufacturer}
                            </div>
                          )}
                        </div>
                        
                        <div className={styles.selectIconWrapper}>
                          <FiCheck size={20} className={styles.selectIcon} />
                        </div>
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
  );
};

export default ViewPrescription;