// src/components/DepartmentList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiPlus,
  FiX,
  FiHome,
  FiMapPin,
} from 'react-icons/fi';
import { 
  getDepartmentList, 
  getClinicList, 
  getBranchList,
  clearCacheByType 
} from '../api/cachedApi.js';
import { addDepartment } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './DepartmentList.module.css'; // CSS Module import

// ────────────────────────────────────────────────
const DepartmentList = () => {
  const navigate = useNavigate();

  // Data & Filter
  const [departments, setDepartments] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedClinicId, setSelectedClinicId] = useState('all');
  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected / Modal
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Form Modal
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    clinicId: '',
    branchId: '',
    departmentName: '',
    profile: '',
  });
  const [formBranches, setFormBranches] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // ────────────────────────────────────────────────
  // Data fetching with cache
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
    const fetchBranches = async () => {
      try {
        if (selectedClinicId && selectedClinicId !== 'all') {
          const data = await getBranchList(Number(selectedClinicId));
          setBranches(data);
        } else {
          setBranches([]);
        }
        setSelectedBranchId('all');
      } catch (err) {
        console.error('Failed to load branches:', err);
        setBranches([]);
      }
    };
    fetchBranches();
  }, [selectedClinicId]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const clinicId = selectedClinicId === 'all' ? 0 : Number(selectedClinicId) || 0;
        const branchId = selectedBranchId === 'all' ? 0 : Number(selectedBranchId) || 0;
        
        const data = await getDepartmentList(clinicId, branchId);
        
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
    fetchDepartments();
  }, [selectedClinicId, selectedBranchId]);

  useEffect(() => {
    const fetchFormBranches = async () => {
      if (formData.clinicId && formData.clinicId !== '') {
        try {
          const data = await getBranchList(Number(formData.clinicId));
          setFormBranches(data);
        } catch (err) {
          console.error('Failed to load form branches:', err);
          setFormBranches([]);
        }
      } else {
        setFormBranches([]);
      }
    };
    fetchFormBranches();
  }, [formData.clinicId]);

  // ────────────────────────────────────────────────
  // Computed values
  const filteredDepartments = useMemo(() => {
    if (!searchTerm.trim()) return allDepartments;
    const term = searchTerm.toLowerCase();
    return allDepartments.filter(
      (dept) =>
        dept.name?.toLowerCase().includes(term) ||
        dept.profile?.toLowerCase().includes(term) ||
        dept.clinicName?.toLowerCase().includes(term) ||
        dept.branchName?.toLowerCase().includes(term)
    );
  }, [allDepartments, searchTerm]);

  // ────────────────────────────────────────────────
  // Handlers
  const handleSearch = () => setSearchTerm(searchInput.trim());
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const openDetails = (department) => setSelectedDepartment(department);
  
  const closeModal = () => setSelectedDepartment(null);

  const openAddForm = () => {
    setFormData({
      clinicId: '',
      branchId: '',
      departmentName: '',
      profile: '',
    });
    setFormError('');
    setFormSuccess(false);
    setIsAddFormOpen(true);
  };

  const closeAddForm = () => {
    setIsAddFormOpen(false);
    setFormLoading(false);
    setFormError('');
    setFormSuccess(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'clinicId') {
      setFormData((prev) => ({ ...prev, [name]: value, branchId: '' }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);
    setError(null);

    try {
      await addDepartment({
        clinicId: Number(formData.clinicId),
        branchId: Number(formData.branchId),
        departmentName: formData.departmentName.trim(),
        profile: formData.profile.trim(),
      });

      clearCacheByType('GetDepartmentList');

      setFormSuccess(true);
      setTimeout(async () => {
        closeAddForm();
        const clinicId = selectedClinicId === 'all' ? 0 : Number(selectedClinicId) || 0;
        const branchId = selectedBranchId === 'all' ? 0 : Number(selectedBranchId) || 0;
        const data = await getDepartmentList(clinicId, branchId, {}, true);
        setDepartments(data);
        setAllDepartments(data);
      }, 1500);
    } catch (err) {
      console.error('Add department failed:', err);
      setFormError(err.message || 'Failed to add department.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateClick = (department) => {
    navigate(`/update-dept/${department.id}`);
  };

  // ────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.clinicLoading}>Loading departments...</div>;

  if (error) return <div className={styles.clinicError}>Error: {error.message || error}</div>;

  // ────────────────────────────────────────────────
  return (
    <div className={styles.clinicListWrapper}>
      <ErrorHandler error={error} />
      <Header title="Department Management" />

      {/* Toolbar */}
      <div className={styles.clinicToolbar}>
        <div className={styles.clinicSelectWrapper}>
          <FiHome className={styles.clinicSelectIcon} size={20} />
          <select
            value={selectedClinicId}
            onChange={(e) => setSelectedClinicId(e.target.value)}
            className={styles.clinicSelect}
          >
            <option value="all">All Clinics</option>
            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.clinicSelectWrapper}>
          <FiMapPin className={styles.clinicSelectIcon} size={20} />
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className={styles.clinicSelect}
            disabled={selectedClinicId === 'all' || branches.length === 0}
          >
            <option value="all">All Branches</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.clinicSearchContainer}>
          <input
            type="text"
            placeholder="Search by department name, clinic..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className={styles.clinicSearchInput}
          />
          <button onClick={handleSearch} className={styles.clinicSearchBtn}>
            <FiSearch size={20} />
          </button>
        </div>

        <div className={styles.clinicAddSection}>
          <button onClick={openAddForm} className={styles.clinicAddBtn}>
            <FiPlus size={22} /> Add Dept
          </button>
        </div>
      </div>

      {/* Table */}
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
                  {searchTerm ? 'No departments found.' : 'No departments registered yet.'}
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
        <div className={styles.clinicModalOverlay} onClick={closeModal}>
          <div className={`${styles.clinicModal} ${styles.detailsModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailsModalHeader}>
              <div className={styles.detailsHeaderContent}>
                <div className={styles.clinicAvatarLarge}>
                  {selectedDepartment.name?.charAt(0).toUpperCase() || 'D'}
                </div>
                <div>
                  <h2>{selectedDepartment.name}</h2>
                  <p className={styles.clinicSubtitle}>{selectedDepartment.profile || 'Department'}</p>
                </div>
              </div>
              <button onClick={closeModal} className={styles.clinicModalClose}>
                ×
              </button>
            </div>

            <div className={styles.detailsModalBody}>
              <table className={styles.detailsTable}>
                <tbody>
                  <tr>
                    <td className="label">Department Name</td>
                    <td className="value">{selectedDepartment.name || '—'}</td>
                  </tr>
                  <tr>
                    <td className="label">Description</td>
                    <td className="value">{selectedDepartment.profile || '—'}</td>
                  </tr>
                  <tr>
                    <td className="label">Clinic</td>
                    <td className="value">{selectedDepartment.clinicName || '—'}</td>
                  </tr>
                  <tr>
                    <td className="label">Branch</td>
                    <td className="value">{selectedDepartment.branchName || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={styles.clinicModalFooter}>
              <button onClick={() => handleUpdateClick(selectedDepartment)} className={styles.btnUpdate}>
                Update Department
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── Add Form Modal ──────────────── */}
      {isAddFormOpen && (
        <div className={styles.clinicModalOverlay} onClick={closeAddForm}>
          <div className={`${styles.clinicModal} ${styles.formModal} ${styles.employeeFormModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.clinicModalHeader}>
              <h2>Add New Department</h2>
              <button onClick={closeAddForm} className={styles.clinicModalClose}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.clinicModalBody}>
              {formError && <div className={styles.formError}>{formError}</div>}
              {formSuccess && <div className={styles.formSuccess}>Department added successfully!</div>}

              <div className={styles.formGrid}>
                <h3 className={styles.formSectionTitle}>Department Information</h3>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>
                    Clinic <span className={styles.required}>*</span>
                  </label>
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

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>
                    Branch <span className={styles.required}>*</span>
                  </label>
                  <select
                    required
                    name="branchId"
                    value={formData.branchId}
                    onChange={handleInputChange}
                    disabled={!formData.clinicId || formBranches.length === 0}
                  >
                    <option value="">
                      {!formData.clinicId 
                        ? 'Select clinic first' 
                        : formBranches.length === 0 
                        ? 'No branches available' 
                        : 'Select Branch'}
                    </option>
                    {formBranches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>
                    Department Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    required
                    name="departmentName"
                    value={formData.departmentName}
                    onChange={handleInputChange}
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Description / Profile</label>
                  <textarea
                    name="profile"
                    rows={3}
                    value={formData.profile}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className={styles.clinicModalFooter}>
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
    </div>
  );
};

export default DepartmentList;