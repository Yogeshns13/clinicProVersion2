// src/components/AddConsultation.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiCheck, FiPackage, FiSearch, FiTrash2, FiFileText, FiClipboard, FiChevronDown, FiEye, FiUser, FiList, FiArrowLeft, FiFilter } from 'react-icons/fi';
import { getPatientVisitList, getPatientsList } from '../api/api.js';
import { addConsultation, getConsultationList } from '../api/api-consultation.js';
import { addPrescription, addPrescriptionDetail, getMedicineMasterList, getPrescriptionList, getPrescriptionDetailList } from '../api/api-pharmacy.js';
import { addLabTestOrder, getLabTestOrderItemList, addLabTestOrderItem, updateLabTestOrderItem, getLabTestMasterList, getLabTestPackageList, getLabTestOrderList } from '../api/api-labtest.js';
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

const AddConsultation = ({ isOpen, onClose, onSuccess, preSelectedVisitId = null }) => {
  // Main view state: 'create' | 'patient-details' | 'consultation-list' | 'consultation-view'
  const [mainView, setMainView] = useState('create');
 
  const [visitSelectionStep, setVisitSelectionStep] = useState(1);
  const [todayVisits, setTodayVisits] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // Patient Details view
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [loadingPatient, setLoadingPatient] = useState(false);
  
  // Consultation List view with date filtering
  const [consultationList, setConsultationList] = useState([]);
  const [filteredConsultationList, setFilteredConsultationList] = useState([]);
  const [loadingConsultations, setLoadingConsultations] = useState(false);
  const [consultationDateFilter, setConsultationDateFilter] = useState({
    fromDate: '',
    toDate: ''
  });
 
  // Consultation Details view
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [consultationDetails, setConsultationDetails] = useState(null);
  const [prescriptionDetails, setPrescriptionDetails] = useState([]);
  const [labOrderDetails, setLabOrderDetails] = useState(null);
  const [labOrderItems, setLabOrderItems] = useState([]);
  const [loadingConsultationDetails, setLoadingConsultationDetails] = useState(false);
  
  // Section completion states
  const [consultationId, setConsultationId] = useState(null);
  const [prescriptionId, setPrescriptionId] = useState(null);
  const [labTestOrderId, setLabTestOrderId] = useState(null);
  
  // Form data
  const [consultationFormData, setConsultationFormData] = useState({
    emrNotes: '',
    consultationNotes: '',
    nextConsultationDate: '',
    treatmentPlan: ''
  });
  const [prescriptionFormData, setPrescriptionFormData] = useState({
    isRepeat: 0,
    repeatCount: 0,
    dateIssued: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
 
  // Medicine selection states
  const [allMedicines, setAllMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [medicineSearchQuery, setMedicineSearchQuery] = useState('');
  const [searchingMedicines, setSearchingMedicines] = useState(false);
  const [selectedMedicineIds, setSelectedMedicineIds] = useState([]);
  const [labTestFormData, setLabTestFormData] = useState({
    priority: 1,
    notes: ''
  });
  const [labTestOrderItems, setLabTestOrderItems] = useState([]);
 
  // Lab Test/Package states
  const [allLabTests, setAllLabTests] = useState([]);
  const [allLabPackages, setAllLabPackages] = useState([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [selectedTestIds, setSelectedTestIds] = useState([]);
  const [selectedPackageIds, setSelectedPackageIds] = useState([]);
  const [showTestDropdown, setShowTestDropdown] = useState(false);
  const [showPackageDropdown, setShowPackageDropdown] = useState(false);
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [packageSearchQuery, setPackageSearchQuery] = useState('');

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

  // Load medicines when prescription is created
  useEffect(() => {
    if (prescriptionId) {
      fetchAllMedicines();
    }
  }, [prescriptionId]);

  // Load lab tests/packages when lab order is created
  useEffect(() => {
    if (labTestOrderId) {
      fetchLabTests();
      fetchLabPackages();
      fetchLabTestOrderItems();
    }
  }, [labTestOrderId]);

  // Filter consultations when date filter changes
  useEffect(() => {
    filterConsultations();
  }, [consultationDateFilter, consultationList]);

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

  const fetchPatientDetails = async (patientId) => {
    try {
      setLoadingPatient(true);
      setError(null);
     
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const options = {
        Page: 1,
        PageSize: 1,
        BranchID: branchId,
        PatientID: patientId,
        Status: 1
      };
      const patients = await getPatientsList(clinicId, options);
     
      if (patients && patients.length > 0) {
        setPatientDetails(patients[0]);
      } else {
        setError({ message: 'Patient details not found' });
      }
    } catch (err) {
      console.error('fetchPatientDetails error:', err);
      setError(err);
    } finally {
      setLoadingPatient(false);
    }
  };

  const fetchConsultationList = async (patientId) => {
    try {
      setLoadingConsultations(true);
      setError(null);
     
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const options = {
        Page: 1,
        PageSize: 100,
        BranchID: branchId,
        PatientID: patientId,
        Status: 1
      };
      const consultations = await getConsultationList(clinicId, options);
      setConsultationList(consultations || []);
      setFilteredConsultationList(consultations || []);
    } catch (err) {
      console.error('fetchConsultationList error:', err);
      setError(err);
    } finally {
      setLoadingConsultations(false);
    }
  };

  const filterConsultations = () => {
    if (!consultationDateFilter.fromDate && !consultationDateFilter.toDate) {
      setFilteredConsultationList(consultationList);
      return;
    }

    const filtered = consultationList.filter(consultation => {
      const consultDate = new Date(consultation.dateCreated);
      const fromDate = consultationDateFilter.fromDate ? new Date(consultationDateFilter.fromDate) : null;
      const toDate = consultationDateFilter.toDate ? new Date(consultationDateFilter.toDate) : null;

      if (fromDate && consultDate < fromDate) return false;
      if (toDate) {
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (consultDate > endOfDay) return false;
      }
      return true;
    });

    setFilteredConsultationList(filtered);
  };

  const handleDateFilterChange = (field, value) => {
    setConsultationDateFilter(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearDateFilter = () => {
    setConsultationDateFilter({
      fromDate: '',
      toDate: ''
    });
  };

  const fetchConsultationDetails = async (consultation) => {
    try {
      setLoadingConsultationDetails(true);
      setError(null);
     
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      setConsultationDetails(consultation);
      
      // Fetch prescription list for this consultation
      const prescOptions = {
        Page: 1,
        PageSize: 10,
        BranchID: branchId,
        ConsultationID: consultation.id,
        Status: 1
      };
      const prescriptions = await getPrescriptionList(clinicId, prescOptions);
     
      if (prescriptions && prescriptions.length > 0) {
        const prescription = prescriptions[0];
       
        // Fetch prescription details
        const detailOptions = {
          Page: 1,
          PageSize: 100,
          BranchID: branchId,
          PrescriptionID: prescription.id,
          Status: 1
        };
       
        const details = await getPrescriptionDetailList(clinicId, detailOptions);
        setPrescriptionDetails(details || []);
      } else {
        setPrescriptionDetails([]);
      }
      
      // Fetch lab test order for this consultation
      const labOrderOptions = {
        Page: 1,
        PageSize: 10,
        BranchID: branchId,
        ConsultationID: consultation.id,
        Status: 1
      };
      const labOrders = await getLabTestOrderList(clinicId, labOrderOptions);
     
      if (labOrders && labOrders.length > 0) {
        const labOrder = labOrders[0];
        setLabOrderDetails(labOrder);
       
        // Fetch lab order items
        const itemOptions = {
          Page: 1,
          PageSize: 100,
          BranchID: branchId,
          OrderID: labOrder.id,
          Status: 1
        };
       
        const items = await getLabTestOrderItemList(clinicId, itemOptions);
        setLabOrderItems(items || []);
      } else {
        setLabOrderDetails(null);
        setLabOrderItems([]);
      }
    } catch (err) {
      console.error('fetchConsultationDetails error:', err);
      setError(err);
    } finally {
      setLoadingConsultationDetails(false);
    }
  };

  const fetchAllMedicines = async () => {
    try {
      setSearchingMedicines(true);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
     
      const results = await getMedicineMasterList(clinicId, {
        BranchID: branchId,
        PageSize: 100,
        Status: 1
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

  const fetchLabTests = async () => {
    try {
      setLoadingTests(true);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const testOptions = {
        Page: 1,
        PageSize: 100,
        BranchID: branchId,
        Status: 1
      };
      const testsData = await getLabTestMasterList(clinicId, testOptions);
      setAllLabTests(testsData || []);
    } catch (err) {
      console.error('fetchLabTests error:', err);
      setError(err);
    } finally {
      setLoadingTests(false);
    }
  };

  const fetchLabPackages = async () => {
    try {
      setLoadingPackages(true);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const packageOptions = {
        Page: 1,
        PageSize: 100,
        BranchID: branchId,
        Status: 1
      };
      const packagesData = await getLabTestPackageList(clinicId, packageOptions);
      setAllLabPackages(packagesData || []);
    } catch (err) {
      console.error('fetchLabPackages error:', err);
      setError(err);
    } finally {
      setLoadingPackages(false);
    }
  };

  const fetchLabTestOrderItems = async () => {
    if (!labTestOrderId) return;
    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const itemOptions = {
        Page: 1,
        PageSize: 100,
        BranchID: branchId,
        OrderID: labTestOrderId,
        Status: 1
      };
      const itemsData = await getLabTestOrderItemList(clinicId, itemOptions);
      setLabTestOrderItems(itemsData || []);
    } catch (err) {
      console.error('fetchLabTestOrderItems error:', err);
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
      (medicine.genericName && medicine.genericName.toLowerCase().includes(query)) ||
      (medicine.manufacturer && medicine.manufacturer.toLowerCase().includes(query))
    );
   
    setFilteredMedicines(filtered);
  };

  const handleMedicineSelection = (medicineId) => {
    setSelectedMedicineIds(prev =>
      prev.includes(medicineId)
        ? prev.filter(id => id !== medicineId)
        : [...prev, medicineId]
    );
  };

  const handleAddSelectedMedicines = () => {
    if (selectedMedicineIds.length === 0) {
      alert('Please select at least one medicine');
      return;
    }
    selectedMedicineIds.forEach(medicineId => {
      const medicine = allMedicines.find(m => m.id === medicineId);
      if (medicine) {
        const defaultRoute = medicine.defaultRoute || 1;
       
        const newDetail = {
          tempId: Date.now() + Math.random(),
          medicineId: medicine.id,
          medicineName: medicine.name,
          form: medicine.type || 1,
          strength: medicine.dosageForm || '',
          dosage: '',
          frequency: '',
          duration: '',
          durationDays: '',
          route: defaultRoute,
          foodTiming: 2,
          instructions: '',
          quantity: 1,
          refillAllowed: 0,
          refillCount: 0,
          startDate: new Date().toISOString().split('T')[0],
          endDate: ''
        };
       
        setPrescriptionDetails(prev => [...prev, newDetail]);
      }
    });
    setSelectedMedicineIds([]);
    setMedicineSearchQuery('');
    setFilteredMedicines(allMedicines);
  };

  const handleTestSelection = (testId) => {
    setSelectedTestIds(prev =>
      prev.includes(testId)
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const handlePackageSelection = (packageId) => {
    setSelectedPackageIds(prev =>
      prev.includes(packageId)
        ? prev.filter(id => id !== packageId)
        : [...prev, packageId]
    );
  };

  const handleAddSelectedLabItems = async () => {
    if (selectedTestIds.length === 0 && selectedPackageIds.length === 0) {
      alert('Please select at least one test or package');
      return;
    }
    if (!labTestOrderId) return;
    try {
      setSubmitLoading(true);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      let successCount = 0;
      let failCount = 0;
      for (const testId of selectedTestIds) {
        try {
          const itemData = {
            clinicId,
            branchId,
            OrderID: labTestOrderId,
            PatientID: selectedVisit.patientId,
            DoctorID: selectedVisit.doctorId,
            TestID: testId,
            PackageID: 0
          };
          await addLabTestOrderItem(itemData);
          successCount++;
        } catch (err) {
          console.error(`Failed to add test ${testId}:`, err);
          failCount++;
        }
      }
      for (const packageId of selectedPackageIds) {
        try {
          const itemData = {
            clinicId,
            branchId,
            OrderID: labTestOrderId,
            PatientID: selectedVisit.patientId,
            DoctorID: selectedVisit.doctorId,
            TestID: 0,
            PackageID: packageId
          };
          await addLabTestOrderItem(itemData);
          successCount++;
        } catch (err) {
          console.error(`Failed to add package ${packageId}:`, err);
          failCount++;
        }
      }
      if (successCount > 0) {
        alert(`Successfully added ${successCount} item(s)${failCount > 0 ? ` (${failCount} failed)` : ''}`);
        setSelectedTestIds([]);
        setSelectedPackageIds([]);
        await fetchLabTestOrderItems();
      } else {
        alert('Failed to add any items. Please try again.');
      }
    } catch (err) {
      console.error('handleAddSelectedLabItems error:', err);
      alert('Error while adding items');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleVisitSelect = (visit) => {
    setSelectedVisit(visit);
    setSelectedPatient({ id: visit.patientId, name: visit.patientName });
    setVisitSelectionStep(2);
  };

  const handleViewPatientDetails = () => {
    if (selectedVisit) {
      fetchPatientDetails(selectedVisit.patientId);
      setMainView('patient-details');
    }
  };

  const handleViewConsultationList = () => {
    if (selectedVisit) {
      fetchConsultationList(selectedVisit.patientId);
      setMainView('consultation-list');
    }
  };

  const handleViewConsultationDetails = (consultation) => {
    setSelectedConsultation(consultation);
    fetchConsultationDetails(consultation);
    setMainView('consultation-view');
  };

  const handleBackToCreate = () => {
    setMainView('create');
    setPatientDetails(null);
    setConsultationList([]);
    setFilteredConsultationList([]);
    setConsultationDateFilter({ fromDate: '', toDate: '' });
    setSelectedConsultation(null);
    setConsultationDetails(null);
    setPrescriptionDetails([]);
    setLabOrderDetails(null);
    setLabOrderItems([]);
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

  const updatePrescriptionDetail = (tempId, field, value) => {
    setPrescriptionDetails(prev =>
      prev.map(detail => {
        if (detail.tempId === tempId) {
          const updated = { ...detail, [field]: value };
         
          if (field === 'durationDays') {
            const days = parseInt(value) || 0;
            updated.duration = days > 0 ? `${days} Days` : '';
            if (updated.startDate && days > 0) {
              updated.endDate = calculateEndDate(updated.startDate, days);
            }
          }
         
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
        ehrNotes: '',
        instructions: '',
        consultationNotes: consultationFormData.consultationNotes.trim(),
        nextConsultationDate: consultationFormData.nextConsultationDate || '',
        treatmentPlan: consultationFormData.treatmentPlan.trim()
      };
      const result = await addConsultation(consultationData);
     
      if (result.success && result.consultationId) {
        setConsultationId(result.consultationId);
        alert('Consultation created successfully!');
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
      setError({ message: 'Please complete consultation first' });
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
        Diagnosis: null,
        Notes: null,
        IsRepeat: prescriptionFormData.isRepeat,
        RepeatCount: prescriptionFormData.repeatCount,
        CreatedBy: selectedVisit.doctorId
      };
      const prescResult = await addPrescription(prescriptionData);
     
      if (prescResult.success && prescResult.prescriptionId) {
        setPrescriptionId(prescResult.prescriptionId);
        alert('Prescription created successfully!');
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
      setError({ message: 'Please create prescription first' });
      return;
    }
    if (prescriptionDetails.length === 0) {
      setError({ message: 'Please add at least one medicine' });
      return;
    }
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
     
      alert('Prescription details saved successfully!');
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
      setError({ message: 'Please complete consultation first' });
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
      const result = await addLabTestOrder(labTestData);
     
      if (result.success && result.orderId) {
        setLabTestOrderId(result.orderId);
        alert('Lab test order created successfully!');
      }
    } catch (err) {
      console.error('handleLabTestSubmit error:', err);
      setError(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteLabOrderItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this lab test item?')) {
      return;
    }
    try {
      setSubmitLoading(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const updateData = {
        itemId: Number(itemId),
        clinicId,
        branchId,
        status: 2
      };
      const result = await updateLabTestOrderItem(updateData);
     
      if (result.success) {
        alert('Lab test item deleted successfully!');
        await fetchLabTestOrderItems();
      }
    } catch (err) {
      console.error('handleDeleteLabOrderItem error:', err);
      setError(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleComplete = () => {
    handleClose();
    if (onSuccess) onSuccess();
  };

  const handleClose = () => {
    setMainView('create');
    setVisitSelectionStep(1);
    setSelectedVisit(null);
    setSelectedPatient(null);
    setPatientDetails(null);
    setConsultationList([]);
    setFilteredConsultationList([]);
    setConsultationDateFilter({ fromDate: '', toDate: '' });
    setSelectedConsultation(null);
    setConsultationDetails(null);
    setPrescriptionDetails([]);
    setLabOrderDetails(null);
    setLabOrderItems([]);
    setConsultationId(null);
    setPrescriptionId(null);
    setLabTestOrderId(null);
    setLabTestOrderItems([]);
    setConsultationFormData({
      emrNotes: '',
      consultationNotes: '',
      nextConsultationDate: '',
      treatmentPlan: ''
    });
    setPrescriptionFormData({
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
    setSelectedMedicineIds([]);
    setAllLabTests([]);
    setAllLabPackages([]);
    setSelectedTestIds([]);
    setSelectedPackageIds([]);
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

  const getRouteName = (routeId) => {
    const route = MEDICINE_ROUTES.find(r => r.id === routeId);
    return route ? route.name : 'Unknown';
  };

  const getFoodTimingName = (timingId) => {
    const timing = FOOD_TIMINGS.find(t => t.id === timingId);
    return timing ? timing.name : 'Unknown';
  };

  const getAlreadyAddedTestIds = () => {
    return labTestOrderItems
      .filter(item => item.testId && item.testId > 0)
      .map(item => item.testId);
  };

  const getAlreadyAddedPackageIds = () => {
    return labTestOrderItems
      .filter(item => item.packageId && item.packageId > 0)
      .map(item => item.packageId);
  };

  const filteredTests = allLabTests.filter(test =>
    !testSearchQuery || test.testName?.toLowerCase().includes(testSearchQuery.toLowerCase())
  );

  const filteredPackages = allLabPackages.filter(pkg =>
    !packageSearchQuery || pkg.packName?.toLowerCase().includes(packageSearchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="add-consultation-overlay">
      <div className="add-consultation-modal add-consultation-modal-compact">
        <div className="add-consultation-header">
          <div>
            <h2>
              {mainView === 'create' && 'Add New Consultation'}
              {mainView === 'patient-details' && 'Patient Details'}
              {mainView === 'consultation-list' && 'Consultation History'}
              {mainView === 'consultation-view' && 'Consultation Details'}
            </h2>
            <p className="add-consultation-subtitle">
              {visitSelectionStep === 1 && mainView === 'create'
                ? 'Select Patient Visit'
                : selectedVisit?.patientName || 'View Details'}
            </p>
          </div>
          <button onClick={handleClose} className="add-consultation-close-btn">
            <FiX size={24} />
          </button>
        </div>
        <ErrorHandler error={error} />
        <div className="add-consultation-body add-consultation-body-compact">
          {/* Main View Switcher */}
          {mainView === 'create' && visitSelectionStep === 1 ? (
            <>
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
            </>
          ) : mainView === 'create' && visitSelectionStep === 2 ? (
            <>
              {/* Action Buttons */}
              <div className="view-action-buttons">
                <button
                  onClick={handleViewPatientDetails}
                  className="view-action-btn patient-btn"
                >
                  <FiUser size={16} />
                  View Patient Details
                </button>
                <button
                  onClick={handleViewConsultationList}
                  className="view-action-btn consultation-btn"
                >
                  <FiList size={16} />
                  View Consultation History
                </button>
              </div>

              {/* Visit Details Display */}
              {selectedVisit && (
                <div className="visit-details-display">
                  <h4 className="visit-details-title">Visit Information</h4>
                  <div className="visit-details-grid">
                    {selectedVisit.reason && (
                      <div className="visit-detail-item">
                        <label>Reason</label>
                        <span>{selectedVisit.reason}</span>
                      </div>
                    )}
                    {selectedVisit.symptoms && (
                      <div className="visit-detail-item">
                        <label>Symptoms</label>
                        <span>{selectedVisit.symptoms}</span>
                      </div>
                    )}
                    {selectedVisit.bpReading && (
                      <div className="visit-detail-item">
                        <label>Blood Pressure</label>
                        <span className="vital-text bp-text">{selectedVisit.bpReading}</span>
                      </div>
                    )}
                    {selectedVisit.temperature && (
                      <div className="visit-detail-item">
                        <label>Temperature</label>
                        <span className="vital-text temp-text">{selectedVisit.temperature}°F</span>
                      </div>
                    )}
                    {selectedVisit.weight && (
                      <div className="visit-detail-item">
                        <label>Weight</label>
                        <span className="vital-text weight-text">{selectedVisit.weight} kg</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Original Create Consultation Form */}
              <div className="compact-form-container">
                {/* Section 1: Consultation */}
                <div className="compact-section">
                  <div className="compact-section-header">
                    <span className="section-badge">1</span>
                    <h3>Consultation</h3>
                    {consultationId && <FiCheck className="check-icon" />}
                  </div>
                  <form onSubmit={handleConsultationSubmit} className="compact-section-body">
                    <div className="form-row-compact">
                      <div className="form-group-compact">
                        <label className="label-compact">EMR Notes</label>
                        <textarea
                          name="emrNotes"
                          value={consultationFormData.emrNotes}
                          onChange={handleConsultationInputChange}
                          placeholder="EMR notes..."
                          className="input-compact textarea-compact"
                          rows={2}
                          disabled={!!consultationId}
                        />
                      </div>
                     
                      <div className="form-group-compact">
                        <label className="label-compact">Consultation Notes *</label>
                        <textarea
                          name="consultationNotes"
                          value={consultationFormData.consultationNotes}
                          onChange={handleConsultationInputChange}
                          placeholder="Consultation notes..."
                          className="input-compact textarea-compact"
                          rows={2}
                          required
                          disabled={!!consultationId}
                        />
                      </div>
                    </div>
                    <div className="form-row-compact">
                      <div className="form-group-compact">
                        <label className="label-compact">Treatment Plan</label>
                        <textarea
                          name="treatmentPlan"
                          value={consultationFormData.treatmentPlan}
                          onChange={handleConsultationInputChange}
                          placeholder="Treatment plan..."
                          className="input-compact textarea-compact"
                          rows={2}
                          disabled={!!consultationId}
                        />
                      </div>
                      <div className="form-group-compact">
                        <label className="label-compact">Next Consultation Date</label>
                        <input
                          type="date"
                          name="nextConsultationDate"
                          value={consultationFormData.nextConsultationDate}
                          onChange={handleConsultationInputChange}
                          className="input-compact"
                          min={new Date().toISOString().split('T')[0]}
                          disabled={!!consultationId}
                        />
                      </div>
                    </div>
                    {!consultationId && (
                      <button type="submit" className="btn-submit-compact" disabled={submitLoading}>
                        {submitLoading ? 'Submitting...' : 'Submit Consultation'}
                      </button>
                    )}
                  </form>
                </div>
                {/* Section 2: Prescription */}
                <div className="compact-section">
                  <div className="compact-section-header">
                    <span className="section-badge">2</span>
                    <h3>Prescription</h3>
                    {prescriptionId && <FiCheck className="check-icon" />}
                  </div>
                  <div className="compact-section-body">
                    {!prescriptionId ? (
                      <form onSubmit={handleCreatePrescription}>
                        <div className="form-row-compact">
                          <div className="form-group-compact">
                            <label className="label-compact">Date Issued *</label>
                            <input
                              type="date"
                              name="dateIssued"
                              value={prescriptionFormData.dateIssued}
                              onChange={handlePrescriptionInputChange}
                              className="input-compact"
                              required
                              disabled={!consultationId}
                            />
                          </div>
                          <div className="form-group-compact">
                            <label className="label-compact">Valid Until *</label>
                            <input
                              type="date"
                              name="validUntil"
                              value={prescriptionFormData.validUntil}
                              onChange={handlePrescriptionInputChange}
                              className="input-compact"
                              min={prescriptionFormData.dateIssued}
                              required
                              disabled={!consultationId}
                            />
                          </div>
                          <div className="form-group-compact">
                            <label className="checkbox-label-compact">
                              <input
                                type="checkbox"
                                name="isRepeat"
                                checked={prescriptionFormData.isRepeat === 1}
                                onChange={handlePrescriptionInputChange}
                                className="checkbox-compact"
                                disabled={!consultationId}
                              />
                              <span>Repeat</span>
                            </label>
                          </div>
                          {prescriptionFormData.isRepeat === 1 && (
                            <div className="form-group-compact">
                              <label className="label-compact">Repeat Count</label>
                              <input
                                type="number"
                                name="repeatCount"
                                value={prescriptionFormData.repeatCount}
                                onChange={handlePrescriptionInputChange}
                                className="input-compact"
                                min="1"
                                max="12"
                                disabled={!consultationId}
                              />
                            </div>
                          )}
                        </div>
                        <button
                          type="submit"
                          className="btn-submit-compact"
                          disabled={!consultationId || submitLoading}
                        >
                          {submitLoading ? 'Creating...' : 'Create Prescription'}
                        </button>
                      </form>
                    ) : (
                      <>
                        <div className="id-badge-compact">
                          <FiFileText size={14} />
                          <span><strong>Prescription Created</strong></span>
                        </div>
                        {/* Medicine Search & Selection */}
                        <div className="medicine-search-inline">
                          <div className="search-inline-header">
                            <h4>Select Medicines</h4>
                          </div>
                         
                          <div className="search-inline-input">
                            <FiSearch size={16} />
                            <input
                              type="text"
                              value={medicineSearchQuery}
                              onChange={(e) => {
                                setMedicineSearchQuery(e.target.value);
                                handleMedicineSearch();
                              }}
                              placeholder="Search medicines..."
                              className="input-search-inline"
                            />
                          </div>
                          <div className="medicine-checkbox-list">
                            {searchingMedicines ? (
                              <div className="loading-inline">
                                <div className="spinner-small"></div>
                                <span>Loading...</span>
                              </div>
                            ) : filteredMedicines.length === 0 ? (
                              <div className="empty-inline">No medicines found</div>
                            ) : (
                              filteredMedicines.slice(0, 10).map(medicine => (
                                <label key={medicine.id} className="checkbox-item-inline">
                                  <input
                                    type="checkbox"
                                    checked={selectedMedicineIds.includes(medicine.id)}
                                    onChange={() => handleMedicineSelection(medicine.id)}
                                    className="checkbox-inline"
                                  />
                                  <span className="checkbox-item-name">{medicine.name}</span>
                                </label>
                              ))
                            )}
                          </div>
                          {selectedMedicineIds.length > 0 && (
                            <button
                              type="button"
                              onClick={handleAddSelectedMedicines}
                              className="btn-add-selected"
                            >
                              Add {selectedMedicineIds.length} Selected Medicine(s)
                            </button>
                          )}
                        </div>
                        {/* Added Medicines */}
                        {prescriptionDetails.length > 0 && (
                          <div className="medicines-compact">
                            <h4 className="section-subtitle">Added Medicines</h4>
                            <div className="medicines-list-compact">
                              {prescriptionDetails.map((detail) => (
                                <div key={detail.tempId} className="medicine-card-compact">
                                  <div className="medicine-header-compact">
                                    <strong>{detail.medicineName}</strong>
                                    <button
                                      type="button"
                                      onClick={() => removePrescriptionDetail(detail.tempId)}
                                      className="btn-remove-compact"
                                    >
                                      <FiTrash2 size={12} />
                                    </button>
                                  </div>
                                  <div className="form-grid-compact">
                                    <div className="form-group-compact">
                                      <label className="label-compact">Dosage *</label>
                                      <input
                                        type="text"
                                        value={detail.dosage}
                                        onChange={(e) => updatePrescriptionDetail(detail.tempId, 'dosage', e.target.value)}
                                        placeholder="1 tablet"
                                        className="input-compact input-mini"
                                        required
                                      />
                                    </div>
                                    <div className="form-group-compact">
                                      <label className="label-compact">Frequency *</label>
                                      <select
                                        value={detail.frequency}
                                        onChange={(e) => updatePrescriptionDetail(detail.tempId, 'frequency', e.target.value)}
                                        className="input-compact input-mini"
                                        required
                                      >
                                        <option value="">Select</option>
                                        <option value="Once daily">Once daily</option>
                                        <option value="Twice daily">Twice daily</option>
                                        <option value="Three times daily">Three times daily</option>
                                        <option value="Four times daily">Four times daily</option>
                                        <option value="Every 6 hours">Every 6 hours</option>
                                        <option value="Every 8 hours">Every 8 hours</option>
                                        <option value="Every 12 hours">Every 12 hours</option>
                                        <option value="At bedtime">At bedtime</option>
                                        <option value="Once Weekly">Once Weekly</option>
                                        <option value="As needed (PRN)">As needed (PRN)</option>
                                      </select>
                                    </div>
                                    <div className="form-group-compact">
                                      <label className="label-compact">Duration (Days)</label>
                                      <input
                                        type="number"
                                        value={detail.durationDays}
                                        onChange={(e) => updatePrescriptionDetail(detail.tempId, 'durationDays', e.target.value)}
                                        placeholder="7"
                                        className="input-compact input-mini"
                                        min="1"
                                      />
                                    </div>
                                    <div className="form-group-compact">
                                      <label className="label-compact">Route</label>
                                      <select
                                        value={detail.route}
                                        onChange={(e) => updatePrescriptionDetail(detail.tempId, 'route', Number(e.target.value))}
                                        className="input-compact input-mini"
                                      >
                                        {MEDICINE_ROUTES.map(route => (
                                          <option key={route.id} value={route.id}>{route.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="form-group-compact">
                                      <label className="label-compact">Food Timing</label>
                                      <select
                                        value={detail.foodTiming}
                                        onChange={(e) => updatePrescriptionDetail(detail.tempId, 'foodTiming', Number(e.target.value))}
                                        className="input-compact input-mini"
                                      >
                                        {FOOD_TIMINGS.map(timing => (
                                          <option key={timing.id} value={timing.id}>{timing.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="form-group-compact">
                                      <label className="label-compact">Quantity *</label>
                                      <input
                                        type="number"
                                        value={detail.quantity}
                                        onChange={(e) => updatePrescriptionDetail(detail.tempId, 'quantity', Number(e.target.value))}
                                        className="input-compact input-mini"
                                        min="0.5"
                                        step="0.5"
                                        required
                                      />
                                    </div>
                                  </div>
                                  <div className="form-group-compact">
                                    <label className="label-compact">Instructions (Optional)</label>
                                    <textarea
                                      value={detail.instructions}
                                      onChange={(e) => updatePrescriptionDetail(detail.tempId, 'instructions', e.target.value)}
                                      placeholder="Additional instructions..."
                                      className="input-compact textarea-compact"
                                      rows={1}
                                    />
                                  </div>
                                  <div className="form-row-compact">
                                    <div className="form-group-compact">
                                      <label className="checkbox-label-compact">
                                        <input
                                          type="checkbox"
                                          checked={detail.refillAllowed === 1}
                                          onChange={(e) => updatePrescriptionDetail(detail.tempId, 'refillAllowed', e.target.checked ? 1 : 0)}
                                          className="checkbox-compact"
                                        />
                                        <span>Refill Allowed</span>
                                      </label>
                                    </div>
                                    {detail.refillAllowed === 1 && (
                                      <div className="form-group-compact">
                                        <label className="label-compact">Refill Count</label>
                                        <input
                                          type="number"
                                          value={detail.refillCount}
                                          onChange={(e) => updatePrescriptionDetail(detail.tempId, 'refillCount', Number(e.target.value))}
                                          className="input-compact input-mini"
                                          min="1"
                                          max="12"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={handleSavePrescriptionDetails}
                              className="btn-submit-compact"
                              disabled={submitLoading}
                            >
                              {submitLoading ? 'Saving...' : 'Save All Medicines'}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {/* Section 3: Lab Tests */}
                <div className="compact-section">
                  <div className="compact-section-header">
                    <span className="section-badge">3</span>
                    <h3>Lab Tests (Optional)</h3>
                    {labTestOrderId && <FiCheck className="check-icon" />}
                  </div>
                  <div className="compact-section-body">
                    {!labTestOrderId ? (
                      <form onSubmit={handleLabTestSubmit}>
                        <div className="form-row-compact">
                          <div className="form-group-compact">
                            <label className="label-compact">Priority *</label>
                            <select
                              name="priority"
                              value={labTestFormData.priority}
                              onChange={handleLabTestInputChange}
                              className="input-compact"
                              required
                              disabled={!consultationId}
                            >
                              {LAB_PRIORITIES.map(priority => (
                                <option key={priority.id} value={priority.id}>{priority.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group-compact">
                            <label className="label-compact">Notes</label>
                            <textarea
                              name="notes"
                              value={labTestFormData.notes}
                              onChange={handleLabTestInputChange}
                              placeholder="Lab notes..."
                              className="input-compact textarea-compact"
                              rows={2}
                              disabled={!consultationId}
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="btn-submit-compact"
                          disabled={!consultationId || submitLoading}
                        >
                          {submitLoading ? 'Creating...' : 'Create Lab Order'}
                        </button>
                      </form>
                    ) : (
                      <>
                        <div className="id-badge-compact">
                          <FiClipboard size={14} />
                          <span><strong>Order Created</strong></span>
                        </div>
                        {/* Lab Test & Package Inline Panels */}
                        <div className="lab-dropdowns-container">
                          <div className="form-row-compact">
                            {/* Tests Panel */}
                            <div className="inline-panel">
                              <button
                                type="button"
                                onClick={() => { setShowTestDropdown(!showTestDropdown); setShowPackageDropdown(false); }}
                                className="inline-panel-trigger"
                              >
                                <span>
                                  {selectedTestIds.length > 0
                                    ? `Lab Tests (${selectedTestIds.length} selected)`
                                    : 'Lab Tests'}
                                </span>
                                <FiChevronDown size={16} className={showTestDropdown ? 'chevron-open' : ''} />
                              </button>
                              {showTestDropdown && (
                                <div className="inline-panel-body">
                                  <div className="inline-panel-search">
                                    <FiSearch size={13} />
                                    <input
                                      type="text"
                                      value={testSearchQuery}
                                      onChange={(e) => setTestSearchQuery(e.target.value)}
                                      placeholder="Search tests..."
                                      className="inline-panel-search-input"
                                    />
                                  </div>
                                  <div className="inline-panel-list">
                                    {loadingTests ? (
                                      <div className="loading-inline"><div className="spinner-small"></div> Loading...</div>
                                    ) : filteredTests.length === 0 ? (
                                      <div className="empty-inline">No tests found</div>
                                    ) : (
                                      filteredTests.map(test => {
                                        const alreadyAdded = getAlreadyAddedTestIds().includes(test.id);
                                        return (
                                          <label key={test.id} className={`inline-panel-item ${alreadyAdded ? 'disabled' : ''}`}>
                                            <input
                                              type="checkbox"
                                              checked={selectedTestIds.includes(test.id)}
                                              onChange={() => handleTestSelection(test.id)}
                                              className="checkbox-inline"
                                              disabled={alreadyAdded}
                                            />
                                            <span className="checkbox-item-name">
                                              {test.testName}
                                              {alreadyAdded && <span className="added-tag">Added</span>}
                                            </span>
                                          </label>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            {/* Packages Panel */}
                            <div className="inline-panel">
                              <button
                                type="button"
                                onClick={() => { setShowPackageDropdown(!showPackageDropdown); setShowTestDropdown(false); }}
                                className="inline-panel-trigger"
                              >
                                <span>
                                  {selectedPackageIds.length > 0
                                    ? `Lab Packages (${selectedPackageIds.length} selected)`
                                    : 'Lab Packages'}
                                </span>
                                <FiChevronDown size={16} className={showPackageDropdown ? 'chevron-open' : ''} />
                              </button>
                              {showPackageDropdown && (
                                <div className="inline-panel-body">
                                  <div className="inline-panel-search">
                                    <FiSearch size={13} />
                                    <input
                                      type="text"
                                      value={packageSearchQuery}
                                      onChange={(e) => setPackageSearchQuery(e.target.value)}
                                      placeholder="Search packages..."
                                      className="inline-panel-search-input"
                                    />
                                  </div>
                                  <div className="inline-panel-list">
                                    {loadingPackages ? (
                                      <div className="loading-inline"><div className="spinner-small"></div> Loading...</div>
                                    ) : filteredPackages.length === 0 ? (
                                      <div className="empty-inline">No packages found</div>
                                    ) : (
                                      filteredPackages.map(pkg => {
                                        const alreadyAdded = getAlreadyAddedPackageIds().includes(pkg.id);
                                        return (
                                          <label key={pkg.id} className={`inline-panel-item ${alreadyAdded ? 'disabled' : ''}`}>
                                            <input
                                              type="checkbox"
                                              checked={selectedPackageIds.includes(pkg.id)}
                                              onChange={() => handlePackageSelection(pkg.id)}
                                              className="checkbox-inline"
                                              disabled={alreadyAdded}
                                            />
                                            <span className="checkbox-item-name">
                                              {pkg.packName}
                                              {alreadyAdded && <span className="added-tag">Added</span>}
                                            </span>
                                          </label>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          {(selectedTestIds.length > 0 || selectedPackageIds.length > 0) && (
                            <button
                              type="button"
                              onClick={handleAddSelectedLabItems}
                              className="btn-add-selected"
                              disabled={submitLoading}
                            >
                              {submitLoading ? 'Adding...' : `Add ${selectedTestIds.length + selectedPackageIds.length} Selected Item(s)`}
                            </button>
                          )}
                        </div>
                        {/* Added Lab Items */}
                        {labTestOrderItems.length > 0 && (
                          <div className="medicines-compact">
                            <h4 className="section-subtitle">Added Test Items</h4>
                            <div className="lab-items-compact">
                              {labTestOrderItems.map((item) => (
                                <div key={item.itemId} className="lab-item-compact">
                                  <div className="lab-item-info-compact">
                                    {item.packageId > 0 ? (
                                      <FiPackage size={12} className="package-icon" />
                                    ) : (
                                      <FiClipboard size={12} className="test-icon" />
                                    )}
                                    <span>{item.testOrPackageName || 'Unknown'}</span>
                                    {item.fees > 0 && (
                                      <span className="lab-fee-compact">₹{item.fees.toFixed(2)}</span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLabOrderItem(item.itemId)}
                                    className="btn-remove-compact"
                                    disabled={submitLoading}
                                  >
                                    <FiTrash2 size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {/* Complete Button */}
                <div className="complete-section">
                  <button
                    type="button"
                    onClick={handleComplete}
                    className="btn-complete-compact"
                    disabled={!consultationId}
                  >
                    Complete & Close <FiCheck size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : mainView === 'patient-details' ? (
            <div className="details-view-container">
              <button onClick={handleBackToCreate} className="back-btn">
                <FiArrowLeft size={16} />
                Back to Consultation
              </button>
              {loadingPatient ? (
                <div className="add-consultation-loading">Loading patient details...</div>
              ) : patientDetails ? (
                <div className="patient-details-card">
                  <div className="patient-header-section">
                    <div className="patient-avatar-large">
                      {patientDetails.patientName?.charAt(0).toUpperCase() || 'P'}
                    </div>
                    <div className="patient-info-large">
                      <h3>{patientDetails.patientName}</h3>
                      <div className="patient-meta">
                        <span className="meta-badge">File No: {patientDetails.fileNo}</span>
                        <span className="meta-badge">{patientDetails.genderDesc}</span>
                        {patientDetails.age && <span className="meta-badge">{patientDetails.age} years</span>}
                      </div>
                    </div>
                  </div>
                  <div className="details-grid details-grid-three-col">
                    <div className="detail-item">
                      <label>Mobile</label>
                      <span>{patientDetails.mobile || '—'}</span>
                    </div>
                    {patientDetails.altMobile && (
                      <div className="detail-item">
                        <label>Alt. Mobile</label>
                        <span>{patientDetails.altMobile}</span>
                      </div>
                    )}
                    {patientDetails.email && (
                      <div className="detail-item">
                        <label>Email</label>
                        <span>{patientDetails.email}</span>
                      </div>
                    )}
                    {patientDetails.birthDate && (
                      <div className="detail-item">
                        <label>Birth Date</label>
                        <span>{formatDate(patientDetails.birthDate)}</span>
                      </div>
                    )}
                    {patientDetails.bloodGroupDesc && (
                      <div className="detail-item">
                        <label>Blood Group</label>
                        <span>{patientDetails.bloodGroupDesc}</span>
                      </div>
                    )}
                    {patientDetails.maritalStatusDesc && (
                      <div className="detail-item">
                        <label>Marital Status</label>
                        <span>{patientDetails.maritalStatusDesc}</span>
                      </div>
                    )}
                    {patientDetails.address && (
                      <div className="detail-item full-width">
                        <label>Address</label>
                        <span>{patientDetails.address}</span>
                      </div>
                    )}
                    {patientDetails.emergencyContactNo && (
                      <div className="detail-item">
                        <label>Emergency Contact</label>
                        <span>{patientDetails.emergencyContactNo}</span>
                      </div>
                    )}
                    {patientDetails.allergies && (
                      <div className="detail-item full-width">
                        <label>Allergies</label>
                        <span className="highlight-text">{patientDetails.allergies}</span>
                      </div>
                    )}
                    {patientDetails.existingMedicalConditions && (
                      <div className="detail-item full-width">
                        <label>Existing Medical Conditions</label>
                        <span>{patientDetails.existingMedicalConditions}</span>
                      </div>
                    )}
                    {patientDetails.pastSurgeries && (
                      <div className="detail-item full-width">
                        <label>Past Surgeries</label>
                        <span>{patientDetails.pastSurgeries}</span>
                      </div>
                    )}
                    {patientDetails.currentMedications && (
                      <div className="detail-item full-width">
                        <label>Current Medications</label>
                        <span>{patientDetails.currentMedications}</span>
                      </div>
                    )}
                    {patientDetails.familyMedicalHistory && (
                      <div className="detail-item full-width">
                        <label>Family Medical History</label>
                        <span>{patientDetails.familyMedicalHistory}</span>
                      </div>
                    )}
                    {patientDetails.immunizationRecords && (
                      <div className="detail-item full-width">
                        <label>Immunization Records</label>
                        <span>{patientDetails.immunizationRecords}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="add-consultation-no-data">
                  <p>Patient details not available</p>
                </div>
              )}
            </div>
          ) : mainView === 'consultation-list' ? (
            <div className="details-view-container">
              <button onClick={handleBackToCreate} className="back-btn">
                <FiArrowLeft size={16} />
                Back to Consultation
              </button>

              {/* Date Filter */}
              <div className="consultation-filter-bar">
                <div className="filter-header">
                  <FiFilter size={14} />
                  <span>Filter by Date</span>
                </div>
                <div className="filter-inputs">
                  <div className="filter-group">
                    <label>From Date</label>
                    <input
                      type="date"
                      value={consultationDateFilter.fromDate}
                      onChange={(e) => handleDateFilterChange('fromDate', e.target.value)}
                      className="filter-input"
                    />
                  </div>
                  <div className="filter-group">
                    <label>To Date</label>
                    <input
                      type="date"
                      value={consultationDateFilter.toDate}
                      onChange={(e) => handleDateFilterChange('toDate', e.target.value)}
                      className="filter-input"
                      min={consultationDateFilter.fromDate}
                    />
                  </div>
                  {(consultationDateFilter.fromDate || consultationDateFilter.toDate) && (
                    <button onClick={clearDateFilter} className="clear-filter-btn">
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {loadingConsultations ? (
                <div className="add-consultation-loading">Loading consultation history...</div>
              ) : filteredConsultationList.length === 0 ? (
                <div className="add-consultation-no-data">
                  <FiList size={48} />
                  <p>No consultations found</p>
                  {(consultationDateFilter.fromDate || consultationDateFilter.toDate) && (
                    <p className="add-consultation-hint">Try adjusting the date filter</p>
                  )}
                </div>
              ) : (
                <div className="consultation-history-table-container">
                  <table className="consultation-history-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Doctor</th>
                        <th>Reason</th>
                        <th>Notes</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredConsultationList.map((consultation) => (
                        <tr key={consultation.id}>
                          <td>{formatDate(consultation.dateCreated)}</td>
                          <td>{consultation.doctorFullName}</td>
                          <td>{consultation.reason || '—'}</td>
                          <td className="notes-cell">
                            {consultation.consultationNotes ? (
                              <span className="notes-preview-table">{consultation.consultationNotes}</span>
                            ) : '—'}
                          </td>
                          <td>
                            <button
                              onClick={() => handleViewConsultationDetails(consultation)}
                              className="view-details-table-btn"
                            >
                              <FiEye size={14} />
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : mainView === 'consultation-view' ? (
            <div className="details-view-container">
              <button onClick={() => setMainView('consultation-list')} className="back-btn">
                <FiArrowLeft size={16} />
                Back to List
              </button>
              {loadingConsultationDetails ? (
                <div className="add-consultation-loading">Loading consultation details...</div>
              ) : consultationDetails ? (
                <div className="consultation-full-details">
                  {/* Consultation Info */}
                  <div className="detail-section">
                    <h3 className="section-title">Consultation Information</h3>
                    <div className="details-grid">
                      <div className="detail-item">
                        <label>Consultation ID</label>
                        <span>{consultationDetails.id}</span>
                      </div>
                      <div className="detail-item">
                        <label>Date</label>
                        <span>{formatDate(consultationDetails.dateCreated)}</span>
                      </div>
                      <div className="detail-item">
                        <label>Doctor</label>
                        <span>{consultationDetails.doctorFullName}</span>
                      </div>
                      {consultationDetails.reason && (
                        <div className="detail-item full-width">
                          <label>Reason</label>
                          <span>{consultationDetails.reason}</span>
                        </div>
                      )}
                      {consultationDetails.symptoms && (
                        <div className="detail-item full-width">
                          <label>Symptoms</label>
                          <span>{consultationDetails.symptoms}</span>
                        </div>
                      )}
                      {consultationDetails.consultationNotes && (
                        <div className="detail-item full-width">
                          <label>Consultation Notes</label>
                          <span>{consultationDetails.consultationNotes}</span>
                        </div>
                      )}
                      {consultationDetails.treatmentPlan && (
                        <div className="detail-item full-width">
                          <label>Treatment Plan</label>
                          <span>{consultationDetails.treatmentPlan}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Prescription Details - Simplified */}
                  {prescriptionDetails.length > 0 && (
                    <div className="detail-section">
                      <h3 className="section-title">Prescription</h3>
                      <div className="simple-prescription-list">
                        {prescriptionDetails.map((detail, index) => (
                          <div key={detail.id} className="simple-prescription-item">
                            <span className="medicine-number-simple">#{index + 1}</span>
                            <span className="medicine-name-simple">{detail.medicineName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lab Order Details - Simplified */}
                  {labOrderItems.length > 0 && (
                    <div className="detail-section">
                      <h3 className="section-title">Lab Tests</h3>
                      <div className="simple-lab-list">
                        {labOrderItems.map((item, index) => (
                          <div key={item.itemId} className="simple-lab-item">
                            <span className="lab-number-simple">#{index + 1}</span>
                            {item.packageId > 0 ? (
                              <FiPackage size={14} className="package-icon-simple" />
                            ) : (
                              <FiClipboard size={14} className="test-icon-simple" />
                            )}
                            <span className="lab-name-simple">{item.testOrPackageName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="add-consultation-no-data">
                  <p>Consultation details not available</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AddConsultation;