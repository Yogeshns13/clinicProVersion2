// src/components/LabTestMasterList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '../api/api-labtest.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import ViewLabMaster from './ViewLabMaster.jsx';
import ViewLabPackage from './ViewLabPackage.jsx';
import styles from './LabMaster.module.css';

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

// ────────────────────────────────────────────────
const LabMasterList = () => {
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState('master'); // 'master' or 'packages'

  // ===== LAB TEST MASTER DATA =====
  const [tests, setTests] = useState([]);
  const [allTests, setAllTests] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTest, setSelectedTest] = useState(null);
  const [isAddTestFormOpen, setIsAddTestFormOpen] = useState(false);
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

  // ===== LAB TEST PACKAGE DATA =====
  const [packages, setPackages] = useState([]);
  const [allPackages, setAllPackages] = useState([]);
  const [packageSearchInput, setPackageSearchInput] = useState('');
  const [packageSearchTerm, setPackageSearchTerm] = useState('');
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isAddPackageFormOpen, setIsAddPackageFormOpen] = useState(false);
  const [packageFormData, setPackageFormData] = useState({
    packName: '',
    packShortName: '',
    description: '',
    fees: '',
    cgstPercentage: '9',
    sgstPercentage: '9',
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

  // ────────────────────────────────────────────────
  // FETCH FUNCTIONS
  // ────────────────────────────────────────────────
  const fetchTests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      
      const data = await getLabTestMasterList(clinicId, { BranchID: branchId });
      
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

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      
      const data = await getLabTestPackageList(clinicId, { BranchID: branchId });
      
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
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      
      const data = await getLabTestPackageItemList({
        packageId: PackageId,
        ClinicID: clinicId,
        BranchID: branchId
      });
      
      console.log('Fetched package items:', data); // Debug log
      setPackageItems(data);
    } catch (err) {
      console.error('fetchPackageItems error:', err);
      setFormError(err.message || 'Failed to load package items');
    }
  };

  const fetchAvailableTests = async () => {
    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      
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
  const filteredTests = useMemo(() => {
    if (!searchTerm.trim()) return allTests;
    const term = searchTerm.toLowerCase();
    return allTests.filter(
      (test) =>
        test.testName?.toLowerCase().includes(term) ||
        test.shortName?.toLowerCase().includes(term) ||
        test.description?.toLowerCase().includes(term) ||
        test.units?.toLowerCase().includes(term) ||
        TEST_TYPES.find((t) => t.id === test.testType)?.label.toLowerCase().includes(term)
    );
  }, [allTests, searchTerm]);

  const filteredPackages = useMemo(() => {
    if (!packageSearchTerm.trim()) return allPackages;
    const term = packageSearchTerm.toLowerCase();
    return allPackages.filter(
      (pkg) =>
        pkg.packName?.toLowerCase().includes(term) ||
        pkg.packShortName?.toLowerCase().includes(term) ||
        pkg.description?.toLowerCase().includes(term)
    );
  }, [allPackages, packageSearchTerm]);

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
  const handleTestSearch = () => setSearchTerm(searchInput.trim());
  
  const handleTestKeyPress = (e) => {
    if (e.key === 'Enter') handleTestSearch();
  };

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
    setIsAddTestFormOpen(true);
  };

  const closeAddTestForm = () => {
    setIsAddTestFormOpen(false);
    setFormLoading(false);
    setFormError('');
    setFormSuccess(false);
  };

  const handleTestInputChange = (e) => {
    const { name, value } = e.target;
    setTestFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);
    setError(null);

    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

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

  const handleTestUpdateClick = (test) => {
    navigate(`/update-labmaster/${test.id}`);
  };

  const handleTestDelete = async (test) => {
    if (!window.confirm(`Are you sure you want to delete the lab test "${test.testName}"? This action cannot be undone.`)) {
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      await deleteLabTestMaster(test.id);
      
      // Close the modal
      closeTestModal();
      
      // Refresh the list
      await fetchTests();
      
      // Show success message
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
  const handlePackageSearch = () => setPackageSearchTerm(packageSearchInput.trim());
  
  const handlePackageKeyPress = (e) => {
    if (e.key === 'Enter') handlePackageSearch();
  };

  const openPackageDetails = async (pkg) => {
    setSelectedPackage(pkg);
    setFormError('');
    setPackageItems([]); // Clear previous items
    console.log('Opening package details for:', pkg.id); // Debug log
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
    setIsAddPackageFormOpen(true);
  };

  const closeAddPackageForm = () => {
    setIsAddPackageFormOpen(false);
    setFormLoading(false);
    setFormError('');
    setFormSuccess(false);
  };

  const handlePackageInputChange = (e) => {
    const { name, value } = e.target;
    setPackageFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePackageSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);
    setError(null);

    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      await addLabTestPackage({
        clinicId,
        branchId,
        packName: packageFormData.packName.trim(),
        packShortName: packageFormData.packShortName.trim(),
        description: packageFormData.description.trim(),
        fees: Number(packageFormData.fees) || 0,
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

  const handlePackageUpdateClick = (pkg) => {
    navigate(`/update-labpackage/${pkg.id}`);
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
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      // Add items in loop
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
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const result = await rebuildPackageFees({
        packageId: selectedPackage.id,
        clinicId: clinicId,
        branchId: branchId
      });

      alert(`Package fees rebuilt successfully! New Fees: ${result.formattedNewFees || result.newPackageFees}`);
      
      // Refresh package details
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
          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search by test name, short name, description..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleTestKeyPress}
                className={styles.searchInput}
              />
              <button onClick={handleTestSearch} className={styles.searchBtn}>
                <FiSearch size={20} />
              </button>
            </div>

            <div className={styles.addSection}>
              <button onClick={openAddTestForm} className={styles.addBtn}>
                <FiPlus size={22} />Add Lab Test
              </button>
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
                      {searchTerm ? 'No lab tests found.' : 'No lab tests registered yet.'}
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
          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search by package name, short name..."
                value={packageSearchInput}
                onChange={(e) => setPackageSearchInput(e.target.value)}
                onKeyPress={handlePackageKeyPress}
                className={styles.searchInput}
              />
              <button onClick={handlePackageSearch} className={styles.searchBtn}>
                <FiSearch size={20} />
              </button>
            </div>

            <div className={styles.addSection}>
              <button onClick={openAddPackageForm} className={styles.addBtn}>
                <FiPlus size={22} />Add Package
              </button>
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
                      {packageSearchTerm ? 'No packages found.' : 'No packages registered yet.'}
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

      {/* ──────────────── ADD TEST FORM MODAL ──────────────── */}
      {isAddTestFormOpen && (
        <div className={styles.modalOverlay} onClick={closeAddTestForm}>
          <div className={`${styles.modal} ${styles.formModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add New Lab Test</h2>
              <button onClick={closeAddTestForm} className={styles.modalClose}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleTestSubmit} className={styles.modalBody}>
              {formError && <div className={styles.formError}>{formError}</div>}
              {formSuccess && <div className={styles.formSuccess}>Lab test added successfully!</div>}

              <div className={styles.formGrid}>
                <h3 className={styles.formSectionTitle}>Test Information</h3>

                <div className={styles.formGroup}>
                  <label>
                    Test Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    required
                    name="TestName"
                    value={testFormData.TestName}
                    onChange={handleTestInputChange}
                    placeholder="e.g., Complete Blood Count"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>
                    Short Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    required
                    name="ShortName"
                    value={testFormData.ShortName}
                    onChange={handleTestInputChange}
                    placeholder="e.g., CBC"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>
                    Test Type <span className={styles.required}>*</span>
                  </label>
                  <select
                    required
                    name="TestType"
                    value={testFormData.TestType}
                    onChange={handleTestInputChange}
                  >
                    {TEST_TYPES.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Fees (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="Fees"
                    value={testFormData.Fees}
                    onChange={handleTestInputChange}
                    placeholder="0.00"
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Description</label>
                  <textarea
                    name="Description"
                    rows={2}
                    value={testFormData.Description}
                    onChange={handleTestInputChange}
                    placeholder="Brief description of the test"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Normal Range</label>
                  <input
                    name="NormalRange"
                    value={testFormData.NormalRange}
                    onChange={handleTestInputChange}
                    placeholder="e.g., 4.5-11.0"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Units</label>
                  <input
                    name="Units"
                    value={testFormData.Units}
                    onChange={handleTestInputChange}
                    placeholder="e.g., cells/mcL"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>CGST %</label>
                  <input
                    type="number"
                    step="0.01"
                    name="CGSTPercentage"
                    value={testFormData.CGSTPercentage}
                    onChange={handleTestInputChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>SGST %</label>
                  <input
                    type="number"
                    step="0.01"
                    name="SGSTPercentage"
                    value={testFormData.SGSTPercentage}
                    onChange={handleTestInputChange}
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Remarks</label>
                  <textarea
                    name="Remarks"
                    rows={2}
                    value={testFormData.Remarks}
                    onChange={handleTestInputChange}
                    placeholder="Additional notes"
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={closeAddTestForm} className={styles.btnCancel}>
                  Cancel
                </button>
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
              <button onClick={closeAddPackageForm} className={styles.modalClose}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handlePackageSubmit} className={styles.modalBody}>
              {formError && <div className={styles.formError}>{formError}</div>}
              {formSuccess && <div className={styles.formSuccess}>Package added successfully!</div>}

              <div className={styles.formGrid}>
                <h3 className={styles.formSectionTitle}>Package Information</h3>

                <div className={styles.formGroup}>
                  <label>
                    Package Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    required
                    name="packName"
                    value={packageFormData.packName}
                    onChange={handlePackageInputChange}
                    placeholder="e.g., Full Body Checkup"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>
                    Short Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    required
                    name="packShortName"
                    value={packageFormData.packShortName}
                    onChange={handlePackageInputChange}
                    placeholder="e.g., FBC"
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Description</label>
                  <textarea
                    name="description"
                    rows={2}
                    value={packageFormData.description}
                    onChange={handlePackageInputChange}
                    placeholder="Brief description of the package"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Fees (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="fees"
                    value={packageFormData.fees}
                    onChange={handlePackageInputChange}
                    placeholder="0.00"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>CGST %</label>
                  <input
                    type="number"
                    step="0.01"
                    name="cgstPercentage"
                    value={packageFormData.cgstPercentage}
                    onChange={handlePackageInputChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>SGST %</label>
                  <input
                    type="number"
                    step="0.01"
                    name="sgstPercentage"
                    value={packageFormData.sgstPercentage}
                    onChange={handlePackageInputChange}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={closeAddPackageForm} className={styles.btnCancel}>
                  Cancel
                </button>
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
                <p className={styles.selectionInfo}>
                  Select tests to add to this package. Selected: {selectedTestIds.length}
                </p>

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
                <button type="button" onClick={closeAddItemForm} className={styles.btnCancel}>
                  Cancel
                </button>
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