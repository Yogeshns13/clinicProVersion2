// src/components/LabTestMasterList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  FiSearch,
  FiPlus,
  FiX,
  FiPackage,
  FiFileText,
} from 'react-icons/fi';
import { 
  getLabTestMasterList,
  addLabTestMaster,
  deleteLabTestMaster,
  getLabTestPackageList,
  addLabTestPackage,
  getLabTestPackageItemList,
  addLabPackageItem,
  deleteLabPackageItem,
  rebuildPackageFees
} from '../Api/ApiLabTests.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import ViewLabMaster from './ViewLabMaster.jsx';
import ViewLabPackage from './ViewLabPackage.jsx';
import styles from './LabMaster.module.css';
import UpdateLabTestMaster from './UpdateLabTestMaster.jsx';
import UpdateLabTestPackage from './UpdateLabTestPackage.jsx';
import { FaClinicMedical } from 'react-icons/fa'; 
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';

const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'TestName':
    case 'packName':
      if (!value || !value.trim()) return `${fieldName === 'TestName' ? 'Test' : 'Package'} name is required`;
      if (/\d/.test(value)) return `${fieldName === 'TestName' ? 'Test' : 'Package'} name cannot contain numbers`;
      if (value.trim().length < 2) return `${fieldName === 'TestName' ? 'Test' : 'Package'} name must be at least 2 characters`;
      if (value.trim().length > 100) return `${fieldName === 'TestName' ? 'Test' : 'Package'} name must not exceed 100 characters`;
      return '';

    case 'ShortName':
    case 'packShortName':
      if (!value || !value.trim()) return 'Short name is required';
      if (/\d/.test(value)) return 'Short name cannot contain numbers';
      if (value.trim().length < 2) return 'Short name must be at least 2 characters';
      if (value.trim().length > 20) return 'Short name must not exceed 20 characters';
      return '';

    case 'Description':
    case 'description':
      if (value && value.length > 500) return 'Description must not exceed 500 characters';
      return '';

    case 'NormalRange':
      if (value && /[a-zA-Z]/.test(value)) return 'Normal range cannot contain letters';
      if (value && value.length > 50) return 'Normal range must not exceed 50 characters';
      return '';

    case 'Units':
      if (value && /[0-9]/.test(value)) return 'Units cannot contain numbers';
      if (value && /[^a-zA-Z\s]/.test(value)) return 'Units cannot contain special characters';
      if (value && value.length > 30) return 'Units must not exceed 30 characters';
      return '';

    case 'Remarks':
      if (value && value.length > 500) return 'Remarks must not exceed 500 characters';
      return '';

    case 'Fees':
      if (value === '' || value === null || value === undefined) return '';
      const testFee = Number(value);
      if (isNaN(testFee)) return 'Must be a valid number';
      if (testFee < 0) return 'Fees cannot be negative';
      if (testFee > 1000000) return 'Fees cannot exceed ₹10,00,000';
      return '';

    // ── fees (package) — required ──────────────────────────────────────────
    case 'fees':
      if (value === '' || value === null || value === undefined) return 'Fees is required';
      const fee = Number(value);
      if (isNaN(fee)) return 'Must be a valid number';
      if (fee < 0) return 'Fees cannot be negative';
      if (fee > 1000000) return 'Fees cannot exceed ₹10,00,000';
      return '';

    case 'CGSTPercentage':
    case 'SGSTPercentage':
    case 'cgstPercentage':
    case 'sgstPercentage':
      if (value === '' || value === null || value === undefined) return '';
      const percentage = Number(value);
      if (isNaN(percentage)) return 'Must be a valid number';
      if (percentage < 0) return 'Percentage cannot be negative';
      if (percentage > 100) return 'Percentage cannot exceed 100';
      return '';

    default:
      return '';
  }
};

const filterInput = (fieldName, value) => {
  switch (fieldName) {
    case 'TestName':
    case 'packName':
      return value.replace(/[^a-zA-Z\s\-().,&]/g, '');
    
    case 'ShortName':
    case 'packShortName':
      return value.replace(/[^A-Za-z-]/g, '');

    case 'Fees':
    case 'fees':
    case 'CGSTPercentage':
    case 'SGSTPercentage':
    case 'cgstPercentage':
    case 'sgstPercentage':
      if (value === '') return value;
      const filtered = value.replace(/[^0-9.]/g, '');
      const parts = filtered.split('.');
      if (parts.length > 2) {
        return parts[0] + '.' + parts.slice(1).join('');
      }
      return filtered;

    case 'Units':
      return value.replace(/[^a-zA-Z\s]/g, '');
    
    case 'NormalRange':
      return value.replace(/[a-zA-Z]/g, '');
    
    default:
      return value;
  }
};

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────
const TEST_TYPES = [
  { id: 1, label: 'Blood' },
  { id: 2, label: 'Urine' },
  { id: 3, label: 'Saliva' },
  { id: 4, label: 'Stool' },
  { id: 5, label: 'CSF' },
  { id: 6, label: 'Tissue' },
  { id: 7, label: 'Other' },
];

const TEST_STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
  { id: 3, label: 'Deprecated' },
];

const PACKAGE_STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
];

// ── Search type options for each tab ──
const MASTER_SEARCH_TYPE_OPTIONS = [
  { value: 'testName', label: 'Test Name' },
];

const PACKAGE_SEARCH_TYPE_OPTIONS = [
  { value: 'packName', label: 'Package Name' },
];

// ────────────────────────────────────────────────
const LabMasterList = () => {
  const today = new Date().toISOString().split('T')[0];

  // Tab State
  const [activeTab, setActiveTab] = useState('master');

  // ===== LAB TEST MASTER DATA =====
  const [tests, setTests] = useState([]);
  const [allTests, setAllTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [isAddTestFormOpen, setIsAddTestFormOpen] = useState(false);
  const [updateTest, setUpdateTest] = useState(null); // for update modal
  const [testFormData, setTestFormData] = useState({
    TestName: '',
    ShortName: '',
    Description: '',
    TestType: 1,
    NormalRange: '',
    Units: '',
    Remarks: '',
    Fees: '',
    CGSTPercentage: '9',
    SGSTPercentage: '9',
  });

  // ── Master filter inputs (not applied until Search) ──
  const [masterFilterInputs, setMasterFilterInputs] = useState({
    searchType: 'testName',
    searchValue: '',
    testType: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });

  // ── Master applied filters (drive fetch + client filter) ──
  const [masterAppliedFilters, setMasterAppliedFilters] = useState({
    searchType: 'testName',
    searchValue: '',
    testType: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });

  // ===== LAB TEST PACKAGE DATA =====
  const [packages, setPackages] = useState([]);
  const [allPackages, setAllPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isAddPackageFormOpen, setIsAddPackageFormOpen] = useState(false);
  const [updatePackage, setUpdatePackage] = useState(null); // for update modal
  const [packageFormData, setPackageFormData] = useState({
    packName: '',
    packShortName: '',
    description: '',
    fees: '',
    cgstPercentage: '9',
    sgstPercentage: '9',
  });

  // ── Package filter inputs ──
  const [packageFilterInputs, setPackageFilterInputs] = useState({
    searchType: 'packName',
    searchValue: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });

  // ── Package applied filters ──
  const [packageAppliedFilters, setPackageAppliedFilters] = useState({
    searchType: 'packName',
    searchValue: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });

  // ===== PACKAGE ITEMS DATA =====
  const [packageItems, setPackageItems] = useState([]);
  const [isAddItemFormOpen, setIsAddItemFormOpen] = useState(false);
  const [availableTests, setAvailableTests] = useState([]);
  const [selectedTestIds, setSelectedTestIds] = useState([]);

  // ===== SHARED STATES =====
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [testValidationMessages, setTestValidationMessages] = useState({});
  const [packageValidationMessages, setPackageValidationMessages] = useState({});

  // ── Derived: are any master filters active? ──
  const hasMasterActiveFilters =
    !!masterAppliedFilters.searchValue ||
    !!masterAppliedFilters.testType ||
    !!masterAppliedFilters.status ||
    !!masterAppliedFilters.dateFrom ||
    !!masterAppliedFilters.dateTo;

  // ── Derived: are any package filters active? ──
  const hasPackageActiveFilters =
    !!packageAppliedFilters.searchValue ||
    !!packageAppliedFilters.status ||
    !!packageAppliedFilters.dateFrom ||
    !!packageAppliedFilters.dateTo;

  // ────────────────────────────────────────────────
  // FETCH FUNCTIONS
  // ────────────────────────────────────────────────
  const fetchTests = async (filters = masterAppliedFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const options = { BranchID: branchId };
      if (filters.searchValue) options.TestName = filters.searchValue;
      if (filters.testType !== '') options.TestType = Number(filters.testType);
      if (filters.status !== '') options.Status = Number(filters.status);
      
      const data = await getLabTestMasterList(clinicId, options);
      
      setTests(data);
      setAllTests(data);
    } catch (err) {
      console.error('fetchTests error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load lab tests' }
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async (filters = packageAppliedFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const options = { BranchID: branchId };
      if (filters.searchValue) options.PackNameSearch = filters.searchValue;
      if (filters.status !== '') options.Status = Number(filters.status);
      
      const data = await getLabTestPackageList(clinicId, options);
      
      setPackages(data);
      setAllPackages(data);
    } catch (err) {
      console.error('fetchPackages error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load lab test packages' }
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchPackageItems = async (PackageId) => {
    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      
      const data = await getLabTestPackageItemList({
        packageId: PackageId,
        ClinicID: clinicId,
        BranchID: branchId
      });
      
      console.log('Fetched package items:', data);
      setPackageItems(data);
    } catch (err) {
      console.error('fetchPackageItems error:', err);
      setFormError(err.message || 'Failed to load package items');
    }
  };

  const fetchAvailableTests = async () => {
    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      
      const data = await getLabTestMasterList(clinicId, { BranchID: branchId, Status: 1 });
      setAvailableTests(data);
    } catch (err) {
      console.error('fetchAvailableTests error:', err);
    }
  };

  // ────────────────────────────────────────────────
  // INITIAL LOAD
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'master') {
      fetchTests();
    } else {
      fetchPackages();
    }
  }, [activeTab]);

  // ────────────────────────────────────────────────
  // COMPUTED VALUES
  // ────────────────────────────────────────────────

  // Client-side date filtering for master
  const filteredTests = useMemo(() => {
    let filtered = allTests;

    if (masterAppliedFilters.dateFrom) {
      const fromDate = new Date(masterAppliedFilters.dateFrom);
      filtered = filtered.filter(t => {
        if (!t.dateCreated) return false;
        return new Date(t.dateCreated) >= fromDate;
      });
    }

    if (masterAppliedFilters.dateTo) {
      const toDate = new Date(masterAppliedFilters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => {
        if (!t.dateCreated) return false;
        return new Date(t.dateCreated) <= toDate;
      });
    }

    return filtered;
  }, [allTests, masterAppliedFilters]);

  // Client-side date filtering for packages
  const filteredPackages = useMemo(() => {
    let filtered = allPackages;

    if (packageAppliedFilters.dateFrom) {
      const fromDate = new Date(packageAppliedFilters.dateFrom);
      filtered = filtered.filter(p => {
        if (!p.dateCreated) return false;
        return new Date(p.dateCreated) >= fromDate;
      });
    }

    if (packageAppliedFilters.dateTo) {
      const toDate = new Date(packageAppliedFilters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(p => {
        if (!p.dateCreated) return false;
        return new Date(p.dateCreated) <= toDate;
      });
    }

    return filtered;
  }, [allPackages, packageAppliedFilters]);

  // ────────────────────────────────────────────────
  // MASTER FILTER HANDLERS
  // ────────────────────────────────────────────────
  const handleMasterFilterChange = (e) => {
    const { name, value } = e.target;
    setMasterFilterInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleMasterSearch = () => {
    const newFilters = { ...masterFilterInputs };
    setMasterAppliedFilters(newFilters);
    fetchTests(newFilters);
  };

  const handleMasterClear = () => {
    const empty = { searchType: 'testName', searchValue: '', testType: '', status: '', dateFrom: '', dateTo: '' };
    setMasterFilterInputs(empty);
    setMasterAppliedFilters(empty);
    fetchTests(empty);
  };

  // ────────────────────────────────────────────────
  // PACKAGE FILTER HANDLERS
  // ────────────────────────────────────────────────
  const handlePackageFilterChange = (e) => {
    const { name, value } = e.target;
    setPackageFilterInputs(prev => ({ ...prev, [name]: value }));
  };

  const handlePackageSearch = () => {
    const newFilters = { ...packageFilterInputs };
    setPackageAppliedFilters(newFilters);
    fetchPackages(newFilters);
  };

  const handlePackageClear = () => {
    const empty = { searchType: 'packName', searchValue: '', status: '', dateFrom: '', dateTo: '' };
    setPackageFilterInputs(empty);
    setPackageAppliedFilters(empty);
    fetchPackages(empty);
  };

  // ────────────────────────────────────────────────
  // HELPER FUNCTIONS
  // ────────────────────────────────────────────────
  const getTestTypeLabel = (testTypeId) => {
    return TEST_TYPES.find((t) => t.id === testTypeId)?.label || 'Unknown';
  };

  const getTestStatusLabel = (statusId) => {
    return TEST_STATUS_OPTIONS.find((s) => s.id === statusId)?.label || 'Unknown';
  };

  const getPackageStatusLabel = (statusId) => {
    return PACKAGE_STATUS_OPTIONS.find((s) => s.id === statusId)?.label || 'Unknown';
  };

  const getStatusClass = (statusId) => {
    if (statusId === 1) return styles.active;
    if (statusId === 2) return styles.inactive;
    if (statusId === 3) return styles.deprecated;
    return styles.inactive;
  };

  // ────────────────────────────────────────────────
  // TEST HANDLERS
  // ────────────────────────────────────────────────
  const openTestDetails = (test) => setSelectedTest(test);
  
  const closeTestModal = () => setSelectedTest(null);

  const openAddTestForm = () => {
    setTestFormData({
      TestName: '',
      ShortName: '',
      Description: '',
      TestType: 1,
      NormalRange: '',
      Units: '',
      Remarks: '',
      Fees: '',
      CGSTPercentage: '9',
      SGSTPercentage: '9',
    });
    setFormError('');
    setFormSuccess(false);
    setTestValidationMessages({}); 
    setIsAddTestFormOpen(true);
  };

  const closeAddTestForm = () => {
    setIsAddTestFormOpen(false);
    setFormLoading(false);
    setFormError('');
    setFormSuccess(false);
    setTestValidationMessages({}); 
  };

  const handleTestInputChange = (e) => {
    const { name, value } = e.target;
    const filteredValue = filterInput(name, value);
    
    setTestFormData((prev) => ({ ...prev, [name]: filteredValue }));

    const validationMessage = getLiveValidationMessage(name, filteredValue);
    setTestValidationMessages((prev) => ({
      ...prev,
      [name]: validationMessage,
    }));
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);
    setError(null);

    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      await addLabTestMaster({
        clinicId,
        branchId,
        TestName: testFormData.TestName.trim(),
        ShortName: testFormData.ShortName.trim(),
        Description: testFormData.Description.trim(),
        TestType: Number(testFormData.TestType),
        NormalRange: testFormData.NormalRange.trim(),
        Units: testFormData.Units.trim(),
        Remarks: testFormData.Remarks.trim(),
        Fees: Number(testFormData.Fees) || 0,
        CGSTPercentage: Number(testFormData.CGSTPercentage) || 9,
        SGSTPercentage: Number(testFormData.SGSTPercentage) || 9,
      });

      setFormSuccess(true);
      setTimeout(async () => {
        closeAddTestForm();
        await fetchTests();
      }, 1500);
    } catch (err) {
      console.error('Add lab test failed:', err);
      setFormError(err.message || 'Failed to add lab test.');
    } finally {
      setFormLoading(false);
    }
  };

  // Opens the update modal inline (no routing)
  const handleTestUpdateClick = (test) => {
    setSelectedTest(null); // close view modal
    setUpdateTest(test);   // open update modal
  };

  const handleTestDelete = async (test) => {
    if (!window.confirm(`Are you sure you want to delete the lab test "${test.testName}"? This action cannot be undone.`)) {
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      await deleteLabTestMaster(test.id);
      closeTestModal();
      await fetchTests();
      alert('Lab test deleted successfully!');
    } catch (err) {
      console.error('Delete lab test failed:', err);
      setFormError(err.message || 'Failed to delete lab test.');
      alert(`Failed to delete lab test: ${err.message || 'Unknown error'}`);
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  // PACKAGE HANDLERS
  // ────────────────────────────────────────────────
  const openPackageDetails = async (pkg) => {
    setSelectedPackage(pkg);
    setFormError('');
    setPackageItems([]);
    console.log('Opening package details for:', pkg.id); 
    await fetchPackageItems(pkg.id);
  };
  
  const closePackageModal = () => {
    setSelectedPackage(null);
    setPackageItems([]);
    setFormError('');
  };

  const openAddPackageForm = () => {
    setPackageFormData({
      packName: '',
      packShortName: '',
      description: '',
      fees: '',
      cgstPercentage: '9',
      sgstPercentage: '9',
    });
    setFormError('');
    setFormSuccess(false);
    setPackageValidationMessages({}); 
    setIsAddPackageFormOpen(true);
  };

  const closeAddPackageForm = () => {
    setIsAddPackageFormOpen(false);
    setFormLoading(false);
    setFormError('');
    setFormSuccess(false);
    setPackageValidationMessages({}); 
  };

  const handlePackageInputChange = (e) => {
    const { name, value } = e.target;
    const filteredValue = filterInput(name, value);
    
    setPackageFormData((prev) => ({ ...prev, [name]: filteredValue }));

    const validationMessage = getLiveValidationMessage(name, filteredValue);
    setPackageValidationMessages((prev) => ({
      ...prev,
      [name]: validationMessage,
    }));
  };

  const handlePackageSubmit = async (e) => {
    e.preventDefault();

    // ── Validate fees before submitting ──────────────────────────────────────
    const feesMsg = getLiveValidationMessage('fees', packageFormData.fees);
    if (feesMsg) {
      setPackageValidationMessages((prev) => ({ ...prev, fees: feesMsg }));
      return;
    }

    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);
    setError(null);

    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      await addLabTestPackage({
        clinicId,
        branchId,
        packName: packageFormData.packName.trim(),
        packShortName: packageFormData.packShortName.trim(),
        description: packageFormData.description.trim(),
        fees: Number(packageFormData.fees),
        cgstPercentage: Number(packageFormData.cgstPercentage) || 9,
        sgstPercentage: Number(packageFormData.sgstPercentage) || 9,
      });

      setFormSuccess(true);
      setTimeout(async () => {
        closeAddPackageForm();
        await fetchPackages();
      }, 1500);
    } catch (err) {
      console.error('Add lab test package failed:', err);
      setFormError(err.message || 'Failed to add lab test package.');
    } finally {
      setFormLoading(false);
    }
  };

  // Opens the update modal inline (no routing)
  const handlePackageUpdateClick = (pkg) => {
    setSelectedPackage(null); // close view modal
    setUpdatePackage(pkg);    // open update modal
  };

  // ────────────────────────────────────────────────
  // PACKAGE ITEM HANDLERS
  // ────────────────────────────────────────────────
  const openAddItemForm = async () => {
    setFormError('');
    setFormSuccess(false);
    setSelectedTestIds([]);
    await fetchAvailableTests();
    setIsAddItemFormOpen(true);
  };

  const closeAddItemForm = () => {
    setIsAddItemFormOpen(false);
    setSelectedTestIds([]);
    setFormError('');
    setFormSuccess(false);
  };

  const handleTestSelection = (testId) => {
    setSelectedTestIds((prev) => {
      if (prev.includes(testId)) {
        return prev.filter((id) => id !== testId);
      } else {
        return [...prev, testId];
      }
    });
  };

  const handleAddPackageItems = async () => {
    if (selectedTestIds.length === 0) {
      setFormError('Please select at least one test');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      for (const testId of selectedTestIds) {
        await addLabPackageItem({
          clinicId,
          branchId,
          packageId: selectedPackage.id,
          testId: testId
        });
      }

      setFormSuccess(true);
      setTimeout(async () => {
        closeAddItemForm();
        await fetchPackageItems(selectedPackage.id);
      }, 1000);
    } catch (err) {
      console.error('Add package items failed:', err);
      setFormError(err.message || 'Failed to add package items.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeletePackageItem = async (packageItemId) => {
    if (!window.confirm('Are you sure you want to delete this test from the package?')) {
      return;
    }

    try {
      await deleteLabPackageItem(packageItemId);
      await fetchPackageItems(selectedPackage.id);
    } catch (err) {
      console.error('Delete package item failed:', err);
      setFormError(err.message || 'Failed to delete package item.');
    }
  };

  const handleRebuildFees = async () => {
    setFormLoading(true);
    setFormError('');

    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const result = await rebuildPackageFees({
        packageId: selectedPackage.id,
        clinicId: clinicId,
        branchId: branchId
      });

      alert(`Package fees rebuilt successfully! New Fees: ${result.formattedNewFees || result.newPackageFees}`);
      
      await fetchPackages();
      const updatedPkg = await getLabTestPackageList(clinicId, { BranchID: branchId });
      const updated = updatedPkg.find(p => p.id === selectedPackage.id);
      if (updated) {
        setSelectedPackage(updated);
      }
    } catch (err) {
      console.error('Rebuild fees failed:', err);
      setFormError(err.message || 'Failed to rebuild package fees.');
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  // EARLY RETURNS
  // ────────────────────────────────────────────────
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.loading}>Loading...</div>;

  if (error) return <div className={styles.error}>Error: {error.message || error}</div>;

  // ────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Lab Test Management" />

      {/* Tab Navigation */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'master' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('master')}
        >
          <FiFileText size={18} />
          Lab Test Master
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'packages' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('packages')}
        >
          <FiPackage size={18} />
          Lab Test Packages
        </button>
      </div>

      {/* ═══════════════ LAB TEST MASTER TAB ═══════════════ */}
      {activeTab === 'master' && (
        <>
          {/* ── Filter Bar ── */}
          <div className={styles.filtersContainer}>
            <div className={styles.masterFiltersGrid}>

              {/* Fused search type + value */}
              <div className={styles.searchGroup}>
                <select
                  name="searchType"
                  value={masterFilterInputs.searchType}
                  onChange={handleMasterFilterChange}
                  className={styles.searchTypeSelect}
                >
                  {MASTER_SEARCH_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  name="searchValue"
                  placeholder={`Search by ${
                    MASTER_SEARCH_TYPE_OPTIONS.find(o => o.value === masterFilterInputs.searchType)?.label || ''
                  }`}
                  value={masterFilterInputs.searchValue}
                  onChange={handleMasterFilterChange}
                  onKeyDown={(e) => e.key === 'Enter' && handleMasterSearch()}
                  className={styles.searchInput}
                />
              </div>

              {/* Test Type */}
              <div className={styles.filterGroup}>
                <select
                  name="testType"
                  value={masterFilterInputs.testType}
                  onChange={handleMasterFilterChange}
                  className={styles.filterInput}
                >
                  <option value="">All Types</option>
                  {TEST_TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className={styles.filterGroup}>
                <select
                  name="status"
                  value={masterFilterInputs.status}
                  onChange={handleMasterFilterChange}
                  className={styles.filterInput}
                >
                  <option value="">All Status</option>
                  {TEST_STATUS_OPTIONS.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div className={styles.filterGroup}>
                <div className={styles.dateWrapper}>
                  {!masterFilterInputs.dateFrom && (
                    <span className={styles.datePlaceholder}>From Date</span>
                  )}
                  <input
                    type="date"
                    name="dateFrom"
                    value={masterFilterInputs.dateFrom}
                    onChange={handleMasterFilterChange}
                    className={`${styles.filterInput} ${!masterFilterInputs.dateFrom ? styles.dateEmpty : ''}`}
                  />
                </div>
              </div>

              {/* Date To */}
              <div className={styles.filterGroup}>
                <div className={styles.dateWrapper}>
                  {!masterFilterInputs.dateTo && (
                    <span className={styles.datePlaceholder}>To Date</span>
                  )}
                  <input
                    type="date"
                    name="dateTo"
                    value={masterFilterInputs.dateTo}
                    onChange={handleMasterFilterChange}
                    className={`${styles.filterInput} ${!masterFilterInputs.dateTo ? styles.dateEmpty : ''}`}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className={styles.filterActions}>
                <button onClick={handleMasterSearch} className={styles.searchButton}>
                  <FiSearch size={16} />
                  Search
                </button>
                {hasMasterActiveFilters && (
                  <button onClick={handleMasterClear} className={styles.clearButton}>
                    <FiX size={16} />
                    Clear
                  </button>
                )}
                <button onClick={openAddTestForm} className={styles.addBtn}>
                  <FiPlus size={18} />
                  Add Test
                </button>
              </div>

            </div>
          </div>

          {/* Table */}
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Short Name</th>
                  <th>Type</th>
                  <th>Fees</th>
                  <th>Units</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.noData}>
                      {hasMasterActiveFilters ? 'No lab tests found for the applied filters.' : 'No lab tests registered yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredTests.map((test) => (
                    <tr key={test.id}>
                      <td>
                        <div className={styles.nameCell}>
                          <div className={styles.avatar}>
                            {test.testName?.charAt(0).toUpperCase() || 'T'}
                          </div>
                          <div>
                            <div className={styles.name}>{test.testName}</div>
                            <div className={styles.type}>
                              {getTestTypeLabel(test.testType)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{test.shortName || '—'}</td>
                      <td>
                        <span className={styles.testTypeBadge}>
                          {getTestTypeLabel(test.testType)}
                        </span>
                      </td>
                      <td>₹{parseFloat(test.fees || 0).toFixed(2)}</td>
                      <td>{test.units || '—'}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${getStatusClass(test.status)}`}>
                          {getTestStatusLabel(test.status)}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => openTestDetails(test)} className={styles.detailsBtn}>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ═══════════════ LAB TEST PACKAGES TAB ═══════════════ */}
      {activeTab === 'packages' && (
        <>
          {/* ── Filter Bar ── */}
          <div className={styles.filtersContainer}>
            <div className={styles.packageFiltersGrid}>

              {/* Fused search type + value */}
              <div className={styles.searchGroup}>
                <select
                  name="searchType"
                  value={packageFilterInputs.searchType}
                  onChange={handlePackageFilterChange}
                  className={styles.searchTypeSelect}
                >
                  {PACKAGE_SEARCH_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  name="searchValue"
                  placeholder={`Search by ${
                    PACKAGE_SEARCH_TYPE_OPTIONS.find(o => o.value === packageFilterInputs.searchType)?.label || ''
                  }`}
                  value={packageFilterInputs.searchValue}
                  onChange={handlePackageFilterChange}
                  onKeyDown={(e) => e.key === 'Enter' && handlePackageSearch()}
                  className={styles.searchInput}
                />
              </div>

              {/* Status */}
              <div className={styles.filterGroup}>
                <select
                  name="status"
                  value={packageFilterInputs.status}
                  onChange={handlePackageFilterChange}
                  className={styles.filterInput}
                >
                  <option value="">All Status</option>
                  {PACKAGE_STATUS_OPTIONS.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div className={styles.filterGroup}>
                <div className={styles.dateWrapper}>
                  {!packageFilterInputs.dateFrom && (
                    <span className={styles.datePlaceholder}>From Date</span>
                  )}
                  <input
                    type="date"
                    name="dateFrom"
                    value={packageFilterInputs.dateFrom}
                    onChange={handlePackageFilterChange}
                    className={`${styles.filterInput} ${!packageFilterInputs.dateFrom ? styles.dateEmpty : ''}`}
                  />
                </div>
              </div>

              {/* Date To */}
              <div className={styles.filterGroup}>
                <div className={styles.dateWrapper}>
                  {!packageFilterInputs.dateTo && (
                    <span className={styles.datePlaceholder}>To Date</span>
                  )}
                  <input
                    type="date"
                    name="dateTo"
                    value={packageFilterInputs.dateTo}
                    onChange={handlePackageFilterChange}
                    className={`${styles.filterInput} ${!packageFilterInputs.dateTo ? styles.dateEmpty : ''}`}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className={styles.filterActions}>
                <button onClick={handlePackageSearch} className={styles.searchButton}>
                  <FiSearch size={16} />
                  Search
                </button>
                {hasPackageActiveFilters && (
                  <button onClick={handlePackageClear} className={styles.clearButton}>
                    <FiX size={16} />
                    Clear
                  </button>
                )}
                <button onClick={openAddPackageForm} className={styles.addBtn}>
                  <FiPlus size={18} />
                  Add Package
                </button>
              </div>

            </div>
          </div>

          {/* Table */}
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Package Name</th>
                  <th>Short Name</th>
                  <th>Fees</th>
                  <th>CGST %</th>
                  <th>SGST %</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPackages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.noData}>
                      {hasPackageActiveFilters ? 'No packages found for the applied filters.' : 'No packages registered yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredPackages.map((pkg) => (
                    <tr key={pkg.id}>
                      <td>
                        <div className={styles.nameCell}>
                          <div className={styles.avatar}>
                            {pkg.packName?.charAt(0).toUpperCase() || 'P'}
                          </div>
                          <div>
                            <div className={styles.name}>{pkg.packName}</div>
                            {pkg.description && (
                              <div className={styles.type}>{pkg.description.substring(0, 30)}...</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{pkg.packShortName || '—'}</td>
                      <td>₹{parseFloat(pkg.fees || 0).toFixed(2)}</td>
                      <td>{pkg.cgstPercentage || '0'}%</td>
                      <td>{pkg.sgstPercentage || '0'}%</td>
                      <td>
                        <span className={`${styles.statusBadge} ${getStatusClass(pkg.status)}`}>
                          {getPackageStatusLabel(pkg.status)}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => openPackageDetails(pkg)} className={styles.detailsBtn}>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ──────────────── VIEW LAB TEST MODAL ──────────────── */}
      {selectedTest && (
        <ViewLabMaster
          test={selectedTest}
          onClose={closeTestModal}
          onUpdate={handleTestUpdateClick}
          onDelete={handleTestDelete}
        />
      )}

      {/* ──────────────── VIEW LAB PACKAGE MODAL ──────────────── */}
      {selectedPackage && (
        <ViewLabPackage
          package={selectedPackage}
          packageItems={packageItems}
          onClose={closePackageModal}
          onUpdate={handlePackageUpdateClick}
          onAddItems={openAddItemForm}
          onRebuildFees={handleRebuildFees}
          onDeleteItem={handleDeletePackageItem}
          formError={formError}
          formLoading={formLoading}
        />
      )}

      {/* ──────────────── UPDATE LAB TEST MODAL ──────────────── */}
      {updateTest && (
        <UpdateLabTestMaster
          test={updateTest}
          onClose={() => setUpdateTest(null)}
          onUpdateSuccess={() => fetchTests()}
        />
      )}

      {/* ──────────────── UPDATE LAB PACKAGE MODAL ──────────────── */}
      {updatePackage && (
        <UpdateLabTestPackage
          pkg={updatePackage}
          onClose={() => setUpdatePackage(null)}
          onUpdateSuccess={() => fetchPackages()}
        />
      )}

      {/* ──────────────── ADD TEST FORM MODAL ──────────────── */}
      {isAddTestFormOpen && (
        <div className={styles.modalOverlay} onClick={closeAddTestForm}>
          <div className={`${styles.modal} ${styles.formModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add New Lab Test</h2>

              <div className={styles.headerRight}>
              <div className={styles.clinicNameone}>
                 <FaClinicMedical size={20} style={{ verticalAlign: 'middle', margin: '6px' }} />  
                   {localStorage.getItem('clinicName') || '—'}
               </div>
              <button onClick={closeAddTestForm} className={styles.modalClose}>
                <FiX />
              </button>
             </div>
            </div>

            <form onSubmit={handleTestSubmit} className={styles.modalBody}>
              {formError && <div className={styles.formError}>{formError}</div>}
              {formSuccess && <div className={styles.formSuccess}>Lab test added successfully!</div>}

              <div className={styles.formGrid}>
                <h3 className={styles.formSectionTitle}>Test Information</h3>

                <div className={styles.formGroup}>
                  <label>Test Name <span className={styles.required}>*</span></label>
                  <input required name="TestName" value={testFormData.TestName} onChange={handleTestInputChange} placeholder="e.g., Complete Blood Count" />
                  {testValidationMessages.TestName && (
                    <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>{testValidationMessages.TestName}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Short Name <span className={styles.required}>*</span></label>
                  <input required name="ShortName" value={testFormData.ShortName} onChange={handleTestInputChange} placeholder="e.g., CBC" maxLength="20" />
                  {testValidationMessages.ShortName && (
                    <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>{testValidationMessages.ShortName}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Test Type <span className={styles.required}>*</span></label>
                  <select required name="TestType" value={testFormData.TestType} onChange={handleTestInputChange}>
                    {TEST_TYPES.map((type) => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Fees (₹)</label>
                  <input type="text" name="Fees" value={testFormData.Fees} onChange={handleTestInputChange} placeholder="0.00" />
                  {testValidationMessages.Fees && (
                    <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>{testValidationMessages.Fees}</span>
                  )}
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Description</label>
                  <textarea name="Description" rows={2} value={testFormData.Description} onChange={handleTestInputChange} placeholder="Brief description of the test" />
                  {testValidationMessages.Description && (
                    <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>{testValidationMessages.Description}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Normal Range</label>
                  <input name="NormalRange" value={testFormData.NormalRange} onChange={handleTestInputChange} placeholder="e.g., 4.5-11.0" maxLength="50" />
                  {testValidationMessages.NormalRange && (
                    <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>{testValidationMessages.NormalRange}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Units</label>
                  <input name="Units" value={testFormData.Units} onChange={handleTestInputChange} placeholder="e.g., cells/mcL" maxLength="30" />
                  {testValidationMessages.Units && (
                    <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>{testValidationMessages.Units}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>CGST %</label>
                  <input type="text" name="CGSTPercentage" value={testFormData.CGSTPercentage} onChange={handleTestInputChange} />
                  {testValidationMessages.CGSTPercentage && (
                    <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>{testValidationMessages.CGSTPercentage}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>SGST %</label>
                  <input type="text" name="SGSTPercentage" value={testFormData.SGSTPercentage} onChange={handleTestInputChange} />
                  {testValidationMessages.SGSTPercentage && (
                    <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>{testValidationMessages.SGSTPercentage}</span>
                  )}
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Remarks</label>
                  <textarea name="Remarks" rows={2} value={testFormData.Remarks} onChange={handleTestInputChange} placeholder="Additional notes" />
                  {testValidationMessages.Remarks && (
                    <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>{testValidationMessages.Remarks}</span>
                  )}
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={closeAddTestForm} className={styles.btnCancel}>Cancel</button>
                <button type="submit" disabled={formLoading} className={styles.btnSubmit}>
                  {formLoading ? 'Adding...' : 'Add Lab Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────── ADD PACKAGE FORM MODAL ──────────────── */}
      {isAddPackageFormOpen && (
        <div className={styles.modalOverlay} onClick={closeAddPackageForm}>
          <div className={`${styles.modal} ${styles.formModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add New Lab Test Package</h2>

              <div className={styles.headerRight}>
              <div className={styles.clinicNameone}>
                 <FaClinicMedical size={20} style={{ verticalAlign: 'middle', margin: '6px' }} />  
                   {localStorage.getItem('clinicName') || '—'}
               </div>
              <button onClick={closeAddPackageForm} className={styles.modalClose}>
                <FiX />
              </button>
            </div>
            </div>

            <form onSubmit={handlePackageSubmit} className={styles.modalBody}>
              {formError && <div className={styles.formError}>{formError}</div>}
              {formSuccess && <div className={styles.formSuccess}>Package added successfully!</div>}

              <div className={styles.formGrid}>
                <h3 className={styles.formSectionTitle}>Package Information</h3>

                <div className={styles.formGroup}>
                  <label>Package Name <span className={styles.required}>*</span></label>
                  <input required name="packName" value={packageFormData.packName} onChange={handlePackageInputChange} placeholder="e.g., Full Body Checkup" />
                  {packageValidationMessages.packName && (
                    <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>{packageValidationMessages.packName}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Short Name <span className={styles.required}>*</span></label>
                  <input required name="packShortName" value={packageFormData.packShortName} onChange={handlePackageInputChange} placeholder="e.g., FBC" maxLength="20" />
                  {packageValidationMessages.packShortName && (
                    <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>{packageValidationMessages.packShortName}</span>
                  )}
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Description</label>
                  <textarea name="description" rows={2} value={packageFormData.description} onChange={handlePackageInputChange} placeholder="Brief description of the package" />
                  {packageValidationMessages.description && (
                    <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>{packageValidationMessages.description}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Fees (₹) <span className={styles.required}>*</span></label>
                  <input required type="text" name="fees" value={packageFormData.fees} onChange={handlePackageInputChange} placeholder="0.00" />
                  {packageValidationMessages.fees && (
                    <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>{packageValidationMessages.fees}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>CGST %</label>
                  <input type="text" name="cgstPercentage" value={packageFormData.cgstPercentage} onChange={handlePackageInputChange} />
                  {packageValidationMessages.cgstPercentage && (
                    <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>{packageValidationMessages.cgstPercentage}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>SGST %</label>
                  <input type="text" name="sgstPercentage" value={packageFormData.sgstPercentage} onChange={handlePackageInputChange} />
                  {packageValidationMessages.sgstPercentage && (
                    <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>{packageValidationMessages.sgstPercentage}</span>
                  )}
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={closeAddPackageForm} className={styles.btnCancel}>Cancel</button>
                <button type="submit" disabled={formLoading} className={styles.btnSubmit}>
                  {formLoading ? 'Adding...' : 'Add Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────── ADD PACKAGE ITEMS MODAL ──────────────── */}
      {isAddItemFormOpen && (
        <div className={styles.modalOverlay} onClick={closeAddItemForm}>
          <div className={`${styles.modal} ${styles.testSelectionModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add Tests to Package</h2>
              <button onClick={closeAddItemForm} className={styles.modalClose}>
                <FiX />
              </button>
            </div>

            <div className={styles.modalBody}>
              {formError && <div className={styles.formError}>{formError}</div>}
              {formSuccess && <div className={styles.formSuccess}>Tests added successfully!</div>}

              <div className={styles.testSelectionContainer}>
                <div className={styles.testSelectionList}>
                  {availableTests.map((test) => (
                    <div
                      key={test.id}
                      className={`${styles.testSelectionItem} ${
                        selectedTestIds.includes(test.id) ? styles.testSelectionItemSelected : ''
                      }`}
                      onClick={() => handleTestSelection(test.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTestIds.includes(test.id)}
                        onChange={() => handleTestSelection(test.id)}
                        className={styles.testCheckbox}
                      />
                      <div className={styles.testSelectionInfo}>
                        <div className={styles.testSelectionName}>{test.testName}</div>
                        <div className={styles.testSelectionDetails}>
                          {test.shortName} • ₹{parseFloat(test.fees || 0).toFixed(2)} • {getTestTypeLabel(test.testType)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {availableTests.length === 0 && (
                    <div className={styles.noData}>No active tests available</div>
                  )}
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={closeAddItemForm} className={styles.btnCancel}>Cancel</button>
                <button
                  type="button"
                  onClick={handleAddPackageItems}
                  disabled={formLoading || selectedTestIds.length === 0}
                  className={styles.btnSubmit}
                >
                  {formLoading ? 'Adding...' : `Add ${selectedTestIds.length} Test(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabMasterList;