// src/components/DepartmentList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  FiSearch,
  FiPlus,
  FiX,
} from 'react-icons/fi';
import { 
  getDepartmentList, 
  getClinicList, 
  getBranchList,
} from '../api/cachedApi.js';
import { addDepartment } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import UpdateDepartment from './UpdateDepartment.jsx';
import styles from './DepartmentList.module.css';

const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'departmentName':
      if (!value || !value.trim()) return 'Department name is required';
      if (value.trim().length < 3) return 'Department name must be at least 3 characters';
      if (value.trim().length > 100) return 'Department name must not exceed 100 characters';
      return '';

    case 'profile':
      if (value && value.length > 500) return 'Description must not exceed 500 characters';
      return '';

    default:
      return '';
  }
};

const filterInput = (fieldName, value) => {
  switch (fieldName) {
    case 'departmentName':
      return value.replace(/[^a-zA-Z\s]/g, '');
    default:
      return value;
  }
};

const SEARCH_TYPE_OPTIONS = [
  { value: 'departmentName', label: 'Department Name' },
];

const DEFAULT_FILTERS = {
  searchType:  'departmentName',
  searchValue: '',
  clinicId:    'all',
};

const DepartmentList = () => {
  const [departments, setDepartments]       = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [clinics, setClinics]               = useState([]);

  const [filterInputs, setFilterInputs]     = useState({ ...DEFAULT_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState({ ...DEFAULT_FILTERS });

  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [loading, setLoading]                       = useState(true);
  const [error, setError]                           = useState(null);
  const [isAddFormOpen, setIsAddFormOpen]           = useState(false);

  const [formData, setFormData] = useState({
    clinicId:       '',
    branchId:       '',
    departmentName: '',
    profile:        '',
  });

  const [branches, setBranches] = useState([]);

  const [formLoading, setFormLoading]               = useState(false);
  const [formError, setFormError]                   = useState('');
  const [formSuccess, setFormSuccess]               = useState(false);
  const [validationMessages, setValidationMessages] = useState({});

  // Update Modal
  const [updateDepartmentData, setUpdateDepartmentData] = useState(null);
  const [isUpdateFormOpen, setIsUpdateFormOpen]         = useState(false);

  // ────────────────────────────────────────────────
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const data = await getClinicList();
        setClinics(data);
      } catch (err) {
        console.error('Failed to load clinics:', err);
      }
    };
    fetchClinics();
  }, []);

  useEffect(() => {
    fetchDepartments(appliedFilters);
  }, [appliedFilters]);

  // forceRefresh = true bypasses cache → always fetches latest data from server
  const fetchDepartments = async (filters, forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = filters.clinicId === 'all' ? 0 : Number(filters.clinicId) || 0;

      const data = await getDepartmentList(clinicId, 0, {
        DepartmentName: filters.searchType === 'departmentName' ? filters.searchValue : '',
      }, forceRefresh);

      setDepartments(data);
      setAllDepartments(data);
    } catch (err) {
      console.error('fetchDepartments error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load departments' }
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredDepartments = useMemo(() => allDepartments, [allDepartments]);

  const hasActiveFilters =
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.clinicId           !== 'all';

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filterInputs });
  };

  const handleClearFilters = () => {
    setFilterInputs({ ...DEFAULT_FILTERS });
    setAppliedFilters({ ...DEFAULT_FILTERS });
  };

  const openDetails = (department) => setSelectedDepartment(department);
  const closeModal  = () => setSelectedDepartment(null);

  const openAddForm = () => {
    setFormData({ clinicId: '', branchId: '', departmentName: '', profile: '' });
    setFormError('');
    setFormSuccess(false);
    setValidationMessages({});
    setIsAddFormOpen(true);
  };

  const closeAddForm = () => {
    setIsAddFormOpen(false);
    setFormLoading(false);
    setFormError('');
    setFormSuccess(false);
    setValidationMessages({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const filteredValue = filterInput(name, value);
    setFormData((prev) => ({ ...prev, [name]: filteredValue }));
    const validationMessage = getLiveValidationMessage(name, filteredValue);
    setValidationMessages((prev) => ({ ...prev, [name]: validationMessage }));
  };

  useEffect(() => {
    const fetchBranches = async () => {
      if (formData.clinicId) {
        try {
          const branchData = await getBranchList(Number(formData.clinicId));
          setBranches(branchData || []);
        } catch (err) {
          console.error('Failed to load branches:', err);
          setBranches([]);
        }
      } else {
        setBranches([]);
      }
    };
    fetchBranches();
  }, [formData.clinicId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);
    setError(null);

    try {
      await addDepartment({
        clinicId:       Number(formData.clinicId),
        branchId:       Number(formData.branchId),
        departmentName: formData.departmentName.trim(),
        profile:        formData.profile.trim(),
      });

      setFormSuccess(true);
      setTimeout(() => {
        closeAddForm();
        fetchDepartments(appliedFilters, true); // forceRefresh = true
      }, 1500);
    } catch (err) {
      console.error('Add department failed:', err);
      setFormError(err.message || 'Failed to add department.');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Update handlers ──
  const handleUpdateClick = (department) => {
    setUpdateDepartmentData(department);
    setSelectedDepartment(null); // close details modal
    setIsUpdateFormOpen(true);
  };

  const handleUpdateClose = () => {
    setIsUpdateFormOpen(false);
    setUpdateDepartmentData(null);
  };

  const handleUpdateSuccess = () => {
    setIsUpdateFormOpen(false);
    setUpdateDepartmentData(null);
    fetchDepartments(appliedFilters, true); // forceRefresh = true
  };

  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.clinicLoading}>Loading departments...</div>;

  if (error) return <div className={styles.clinicError}>Error: {error.message || error}</div>;

  return (
    <div className={styles.clinicListWrapper}>
      <ErrorHandler error={error} />
      <Header title="Department Management" />

      {/* ── Filter Bar ── */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>

          <div className={styles.searchGroup}>
            <select
              name="searchType"
              value={filterInputs.searchType}
              onChange={handleFilterChange}
              className={styles.searchTypeSelect}
            >
              {SEARCH_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              name="searchValue"
              placeholder={`Search by ${
                SEARCH_TYPE_OPTIONS.find((o) => o.value === filterInputs.searchType)?.label || ''
              }`}
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <select
              name="clinicId"
              value={filterInputs.clinicId}
              onChange={handleFilterChange}
              className={styles.filterInput}
            >
              <option value="all">All Clinics</option>
              {clinics.map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterActions}>
            <button onClick={handleSearch} className={styles.searchButton}>
              <FiSearch size={16} />
              Search
            </button>

            {hasActiveFilters && (
              <button onClick={handleClearFilters} className={styles.clearButton}>
                <FiX size={16} />
                Clear
              </button>
            )}

            <button onClick={openAddForm} className={styles.clinicAddBtn}>
              <FiPlus size={18} />
              Add Dept
            </button>
          </div>

        </div>
      </div>

      {/* ── Table ── */}
      <div className={styles.clinicTableContainer}>
        <table className={styles.clinicTable}>
          <thead>
            <tr>
              <th>Department Name</th>
              <th>Description</th>
              <th>Clinic</th>
              <th>Branch</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDepartments.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.clinicNoData}>
                  {hasActiveFilters ? 'No departments found.' : 'No departments registered yet.'}
                </td>
              </tr>
            ) : (
              filteredDepartments.map((department) => (
                <tr key={department.id}>
                  <td>
                    <div className={styles.clinicNameCell}>
                      <div className={styles.clinicAvatar}>
                        {department.name?.charAt(0).toUpperCase() || 'D'}
                      </div>
                      <div>
                        <div className={styles.clinicName}>{department.name}</div>
                      </div>
                    </div>
                  </td>
                  <td>{department.profile || '—'}</td>
                  <td>{department.clinicName || '—'}</td>
                  <td>{department.branchName || '—'}</td>
                  <td>
                    <button onClick={() => openDetails(department)} className={styles.clinicDetailsBtn}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ──────────────── Details Modal ──────────────── */}
      {selectedDepartment && (
        <div className={styles.detailModalOverlay} onClick={closeModal}>
          <div className={styles.detailModalContent} onClick={(e) => e.stopPropagation()}>

            <div className={styles.detailModalHeader}>
              <div className={styles.detailHeaderContent}>
                <h2>{selectedDepartment.name}</h2>
                <div className={styles.detailHeaderMeta}>
                  <span className={styles.workIdBadge}>
                    {selectedDepartment.profile ? 'Department' : 'No Description'}
                  </span>
                </div>
              </div>
              <button onClick={closeModal} className={styles.detailCloseBtn}>✕</button>
            </div>

            <div className={styles.detailModalBody}>
              <div className={styles.infoSection}>
                <div className={styles.infoCard}>
                  <div className={styles.infoHeader}>
                    <h3>Department Information</h3>
                  </div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Department Name</span>
                      <span className={styles.infoValue}>{selectedDepartment.name || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Description</span>
                      <span className={styles.infoValue}>{selectedDepartment.profile || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Clinic</span>
                      <span className={styles.infoValue}>{selectedDepartment.clinicName || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Branch</span>
                      <span className={styles.infoValue}>{selectedDepartment.branchName || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.detailModalFooter}>
                <button onClick={closeModal} className={styles.btnCancel}>
                  Close
                </button>
                <button onClick={() => handleUpdateClick(selectedDepartment)} className={styles.btnUpdate}>
                  Update Department
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── Add Form Modal ──────────────── */}
      {isAddFormOpen && (
        <div className={styles.detailModalOverlay} onClick={closeAddForm}>
          <div className={styles.addModalContent} onClick={(e) => e.stopPropagation()}>

            <div className={styles.detailModalHeader}>
              <div className={styles.detailHeaderContent}>
                <h2>Add New Department</h2>
              </div>
              <button onClick={closeAddForm} className={styles.detailCloseBtn}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.addModalBody}>
              {formError && <div className={styles.formError}>{formError}</div>}
              {formSuccess && <div className={styles.formSuccess}>Department added successfully!</div>}

              <div className={styles.addSection}>
                <div className={styles.addSectionHeader}>
                  <h3>Department Information</h3>
                </div>
                <div className={styles.addFormGrid}>

                  <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                    <label>Clinic <span className={styles.required}>*</span></label>
                    <select
                      required
                      name="clinicId"
                      value={formData.clinicId}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Clinic</option>
                      {clinics.map((clinic) => (
                        <option key={clinic.id} value={clinic.id}>
                          {clinic.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                    <label>Branch <span className={styles.required}>*</span></label>
                    <select
                      required
                      name="branchId"
                      value={formData.branchId}
                      onChange={handleInputChange}
                      disabled={!formData.clinicId}
                    >
                      <option value="">Select Branch</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                    <label>Department Name <span className={styles.required}>*</span></label>
                    <input
                      required
                      name="departmentName"
                      value={formData.departmentName}
                      onChange={handleInputChange}
                      placeholder="Enter department name"
                    />
                    {validationMessages.departmentName && (
                      <span className={styles.validationMsg}>{validationMessages.departmentName}</span>
                    )}
                  </div>

                  <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                    <label>Description / Profile</label>
                    <textarea
                      name="profile"
                      rows={3}
                      value={formData.profile}
                      onChange={handleInputChange}
                      placeholder="Enter department description (optional)"
                    />
                    {validationMessages.profile && (
                      <span className={styles.validationMsg}>{validationMessages.profile}</span>
                    )}
                  </div>

                </div>
              </div>

              <div className={styles.detailModalFooter}>
                <button type="button" onClick={closeAddForm} className={styles.btnCancel}>
                  Cancel
                </button>
                <button type="submit" disabled={formLoading} className={styles.btnSubmit}>
                  {formLoading ? 'Adding...' : 'Add Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────── Update Department Modal ──────────────── */}
      {isUpdateFormOpen && updateDepartmentData && (
        <UpdateDepartment
          department={updateDepartmentData}
          clinics={clinics}
          onClose={handleUpdateClose}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
};

export default DepartmentList;