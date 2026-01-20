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
import './DepartmentList.css';

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

  // Load branches for the add form when clinic is selected
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
    
    // Reset branchId when clinic changes
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

      // Clear cache after successful add
      clearCacheByType('GetDepartmentList');

      setFormSuccess(true);
      setTimeout(async () => {
        closeAddForm();
        const clinicId = selectedClinicId === 'all' ? 0 : Number(selectedClinicId) || 0;
        const branchId = selectedBranchId === 'all' ? 0 : Number(selectedBranchId) || 0;
        // Force refresh to get updated data
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

  if (loading) return <div className="clinic-loading">Loading departments...</div>;

  if (error) return <div className="clinic-error">Error: {error.message || error}</div>;

  // ────────────────────────────────────────────────
  return (
    <div className="clinic-list-wrapper">
      <ErrorHandler error={error} />
      <Header title="Department Management" />

      {/* Toolbar */}
      <div className="clinic-toolbar">
        <div className="clinic-select-wrapper">
          <FiHome className="clinic-select-icon" size={20} />
          <select
            value={selectedClinicId}
            onChange={(e) => setSelectedClinicId(e.target.value)}
            className="clinic-select"
          >
            <option value="all">All Clinics</option>
            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name}
              </option>
            ))}
          </select>
        </div>

        <div className="clinic-select-wrapper">
          <FiMapPin className="clinic-select-icon" size={20} />
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="clinic-select"
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

        <div className="clinic-search-container">
          <input
            type="text"
            placeholder="Search by department name, clinic..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="clinic-search-input"
          />
          <button onClick={handleSearch} className="clinic-search-btn">
            <FiSearch size={20} />
          </button>
        </div>

        <div className="clinic-add-section">
          <button onClick={openAddForm} className="clinic-add-btn">
            <FiPlus size={22} /> Add Dept
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="clinic-table-container">
        <table className="clinic-table">
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
                <td colSpan={5} className="clinic-no-data">
                  {searchTerm ? 'No departments found.' : 'No departments registered yet.'}
                </td>
              </tr>
            ) : (
              filteredDepartments.map((department) => (
                <tr key={department.id}>
                  <td>
                    <div className="clinic-name-cell">
                      <div className="clinic-avatar">
                        {department.name?.charAt(0).toUpperCase() || 'D'}
                      </div>
                      <div>
                        <div className="clinic-name">{department.name}</div>
                      </div>
                    </div>
                  </td>
                  <td>{department.profile || '—'}</td>
                  <td>{department.clinicName || '—'}</td>
                  <td>{department.branchName || '—'}</td>
                  <td>
                    <button onClick={() => openDetails(department)} className="clinic-details-btn">
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
        <div className="clinic-modal-overlay" onClick={closeModal}>
          <div className="clinic-modal details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="details-modal-header">
              <div className="details-header-content">
                <div className="clinic-avatar-large">
                  {selectedDepartment.name?.charAt(0).toUpperCase() || 'D'}
                </div>
                <div>
                  <h2>{selectedDepartment.name}</h2>
                  <p className="clinic-subtitle">{selectedDepartment.profile || 'Department'}</p>
                </div>
              </div>
              <button onClick={closeModal} className="clinic-modal-close">
                ×
              </button>
            </div>

            <div className="details-modal-body">
              <table className="details-table">
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

            <div className="clinic-modal-footer">
              <button onClick={() => handleUpdateClick(selectedDepartment)} className="btn-update">
                Update Department
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── Add Form Modal ──────────────── */}
      {isAddFormOpen && (
        <div className="clinic-modal-overlay" onClick={closeAddForm}>
          <div className="clinic-modal form-modal employee-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="clinic-modal-header">
              <h2>Add New Department</h2>
              <button onClick={closeAddForm} className="clinic-modal-close">
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="clinic-modal-body">
              {formError && <div className="form-error">{formError}</div>}
              {formSuccess && <div className="form-success">Department added successfully!</div>}

              <div className="form-grid">
                <h3 className="form-section-title">Department Information</h3>

                <div className="form-group full-width">
                  <label>
                    Clinic <span className="required">*</span>
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

                <div className="form-group full-width">
                  <label>
                    Branch <span className="required">*</span>
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

                <div className="form-group full-width">
                  <label>
                    Department Name <span className="required">*</span>
                  </label>
                  <input
                    required
                    name="departmentName"
                    value={formData.departmentName}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Description / Profile</label>
                  <textarea
                    name="profile"
                    rows={3}
                    value={formData.profile}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="clinic-modal-footer">
                <button type="button" onClick={closeAddForm} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" disabled={formLoading} className="btn-submit">
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