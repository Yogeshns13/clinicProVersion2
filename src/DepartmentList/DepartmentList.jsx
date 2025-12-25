// src/components/DepartmentList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  getDepartmentList,
  getClinicList,
  getBranchList,
  addDepartment,
  updateDepartment
} from '../api/api.js';
import './DepartmentList.css';
import { FiSearch, FiPlus, FiHome, FiLayers, FiX } from "react-icons/fi";
import ErrorHandler from "../hooks/Errorhandler.jsx";

const DepartmentList = () => {
  const [departments, setDepartments] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [branches, setBranches] = useState([]);
  const [modalBranches, setModalBranches] = useState([]);

  const [selectedClinicId, setSelectedClinicId] = useState("all");
  const [selectedBranchId, setSelectedBranchId] = useState("all");
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState(null);

  // Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [deptIdForUpdate, setDeptIdForUpdate] = useState(null);

  const [formData, setFormData] = useState({
    clinicId: '',
    branchId: '',
    departmentName: '',
    profile: ''
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Load Clinics
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const data = await getClinicList();
        setClinics([{ id: "all", name: "All Clinics" }, ...data]);
      } catch (err) {
        if (err?.status >= 400) setError(err);
      }
    };
    fetchClinics();
  }, []);

  // Load Branches for Filter
  useEffect(() => {
    const fetchBranches = async () => {
      if (selectedClinicId === "all") {
        setBranches([{ id: "all", name: "All Branches" }]);
        setSelectedBranchId("all");
        return;
      }
      try {
        const data = await getBranchList(selectedClinicId);
        setBranches([{ id: "all", name: "All Branches" }, ...data]);
        setSelectedBranchId("all");
      } catch (err) {
        setBranches([{ id: "all", name: "All Branches" }]);
      }
    };
    fetchBranches();
  }, [selectedClinicId]);

  // Load Branches for Modal
  useEffect(() => {
    const loadModalBranches = async () => {
      if (!formData.clinicId) {
        setModalBranches([]);
        setFormData(prev => ({ ...prev, branchId: '' }));
        return;
      }
      try {
        const data = await getBranchList(formData.clinicId);
        setModalBranches(data);
      } catch (err) {
        setModalBranches([]);
      }
    };
    loadModalBranches();
  }, [formData.clinicId]);

  // Load Departments - FIXED: Removed extra { }
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        setError(null);

        const clinicId = selectedClinicId === "all" ? 0 : parseInt(selectedClinicId);
        const branchId = selectedBranchId === "all" ? 0 : parseInt(selectedBranchId);

        const data = await getDepartmentList(clinicId, branchId);
        setDepartments(data);
        setAllDepartments(data);
      } catch (err) {
        if (err?.status >= 400) {
          setError(err);
        } else {
          setError({ message: err.message || 'Failed to load departments' });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, [selectedClinicId, selectedBranchId]);

  const filteredDepartments = useMemo(() => {
    if (!searchTerm.trim()) return allDepartments;
    const term = searchTerm.toLowerCase();
    return allDepartments.filter(dept =>
      dept.name?.toLowerCase().includes(term) ||
      dept.profile?.toLowerCase().includes(term) ||
      dept.clinicName?.toLowerCase().includes(term) ||
      dept.branchName?.toLowerCase().includes(term)
    );
  }, [allDepartments, searchTerm]);

  const handleSearch = () => setSearchTerm(searchInput.trim());
  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSearch(); };

  const openDetails = (dept) => setSelectedDept(dept);
  const closeModal = () => setSelectedDept(null);

  const openAddForm = () => {
    setIsUpdateMode(false);
    setDeptIdForUpdate(null);
    setFormData({
      clinicId: selectedClinicId === "all" ? '' : selectedClinicId,
      branchId: '',
      departmentName: '',
      profile: ''
    });
    setFormError('');
    setFormSuccess(false);
    setModalBranches([]);
    setIsFormOpen(true);
  };

  const openUpdateForm = (dept) => {
    setIsUpdateMode(true);
    setDeptIdForUpdate(dept.id);
    setFormData({
      clinicId: dept.clinicId.toString(),
      branchId: dept.branchId ? dept.branchId.toString() : '',
      departmentName: dept.name || '',
      profile: dept.profile || ''
    });
    setFormError('');
    setFormSuccess(false);
    setSelectedDept(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormLoading(false);
    setFormError('');
    setFormSuccess(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);
    setError(null);

    const payload = {
      clinicId: parseInt(formData.clinicId),
      branchId: formData.branchId ? parseInt(formData.branchId) : 0,
      departmentName: formData.departmentName.trim(),
      profile: formData.profile.trim()
    };

    try {
      if (isUpdateMode) {
        await updateDepartment({
          departmentId: deptIdForUpdate,
          clinicId: payload.clinicId,
          DepartmentName: payload.departmentName,
          Profile: payload.profile
        });
      } else {
        await addDepartment(payload);
      }

      setFormSuccess(true);
      setTimeout(() => {
        closeForm();
        const cId = selectedClinicId === "all" ? 0 : parseInt(selectedClinicId);
        const bId = selectedBranchId === "all" ? 0 : parseInt(selectedBranchId);
        getDepartmentList(cId, bId).then(data => {
          setDepartments(data);
          setAllDepartments(data);
        });
      }, 1500);
    } catch (err) {
      console.error("Save error:", err);
      if (err?.status >= 400) {
        setError(err);
      } else {
        setFormError(err.message || 'Failed to save department');
      }
    } finally {
      setFormLoading(false);
    }
  };

  if (error && error?.status >= 400) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className="dept-loading">Loading departments...</div>;
  if (error) return <div className="dept-error">Error: {error.message}</div>;

  return (
    <div className="dept-list-wrapper">
      <ErrorHandler error={error} />

      <div className="dept-list-header">
        <h1>Department Management</h1>
        <p>Manage departments across clinics and branches</p>
      </div>

      <div className="dept-filters">
        <div className="dept-filter-item">
          <div className="filter-wrapper">
            <FiHome className="filter-icon" size={20} />
            <select value={selectedClinicId} onChange={(e) => setSelectedClinicId(e.target.value)} className="dept-select">
              {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="dept-filter-item">
          <div className="filter-wrapper">
            <FiLayers className="filter-icon" size={20} />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="dept-select"
              disabled={selectedClinicId === "all"}
            >
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="dept-search-section">
        <div className="dept-search-container">
          <input
            type="text"
            placeholder="Search department, profile, clinic, branch..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="dept-search-input"
          />
          <button onClick={handleSearch} className="dept-search-btn">
            <FiSearch size={20} />
          </button>
        </div>
      </div>

      <div className="dept-add-section">
        <button onClick={openAddForm} className="dept-add-btn-full">
          <FiPlus size={22} /> Add Department
        </button>
      </div>

      <div className="dept-table-container">
        <table className="dept-table">
          <thead>
            <tr>
              <th>Department</th>
              <th>Profile / Purpose</th>
              <th>Clinic</th>
              <th>Branch</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDepartments.length === 0 ? (
              <tr>
                <td colSpan="5" className="dept-no-data">
                  {searchTerm ? 'No departments found.' : 'No departments registered yet.'}
                </td>
              </tr>
            ) : (
              filteredDepartments.map((dept) => (
                <tr key={dept.id}>
                  <td>
                    <div className="dept-name-cell">
                      <div className="dept-avatar">
                        {dept.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="dept-name">{dept.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="dept-profile">{dept.profile || '—'}</td>
                  <td>{dept.clinicName || '—'}</td>
                  <td>{dept.branchName || '—'}</td>
                  <td>
                    <button onClick={() => openDetails(dept)} className="dept-details-btn">
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {selectedDept && (
        <div className="dept-modal-overlay" onClick={closeModal}>
          <div className="dept-modal" onClick={e => e.stopPropagation()}>
            <div className="dept-modal-header">
              <h2>{selectedDept.name}</h2>
              <button onClick={closeModal} className="dept-modal-close">×</button>
            </div>
            <div className="dept-modal-body">
              <div className="dept-info-grid">
                <div className="info-item"><label>Department ID</label><p>#{selectedDept.id}</p></div>
                <div className="info-item"><label>Clinic</label><p>{selectedDept.clinicName}</p></div>
                <div className="info-item"><label>Branch</label><p>{selectedDept.branchName || '—'}</p></div>
                <div className="info-item"><label>Profile / Purpose</label><p>{selectedDept.profile || '—'}</p></div>
                <div className="info-item"><label>Created</label><p>{new Date(selectedDept.dateCreated).toLocaleDateString()}</p></div>
                <div className="info-item"><label>Last Modified</label><p>{new Date(selectedDept.dateModified).toLocaleDateString()}</p></div>
              </div>
            </div>
            <div className="dept-modal-footer">
              <button onClick={() => openUpdateForm(selectedDept)} className="btn-update">
                Update Department
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Update Form Modal */}
      {isFormOpen && (
        <div className="dept-modal-overlay" onClick={closeForm}>
          <div className="dept-modal form-modal" onClick={e => e.stopPropagation()}>
            <div className="dept-modal-header">
              <h2>{isUpdateMode ? 'Update Department' : 'Add New Department'}</h2>
              <button onClick={closeForm} className="dept-modal-close">
                <FiX size={28} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="dept-modal-body">
              {formError && <div className="form-error">{formError}</div>}
              {formSuccess && <div className="form-success">Department {isUpdateMode ? 'updated' : 'added'} successfully!</div>}

              <div className="form-grid">
                <div className="form-group">
                  <label>Clinic <span className="required">*</span></label>
                  <select
                    name="clinicId"
                    value={formData.clinicId}
                    onChange={handleInputChange}
                    required
                    className="dept-select-input"
                  >
                    <option value="">Select Clinic</option>
                    {clinics.filter(c => c.id !== "all").map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Branch <span style={{color: '#94a3b8'}}>(Optional)</span></label>
                  <select
                    name="branchId"
                    value={formData.branchId}
                    onChange={handleInputChange}
                    className="dept-select-input"
                    disabled={!formData.clinicId}
                  >
                    <option value="">No Branch (Main)</option>
                    {modalBranches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Department Name <span className="required">*</span></label>
                  <input
                    required
                    name="departmentName"
                    value={formData.departmentName}
                    onChange={handleInputChange}
                    placeholder="e.g. Cardiology"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Profile / Purpose (Optional)</label>
                  <textarea
                    name="profile"
                    rows="3"
                    value={formData.profile}
                    onChange={handleInputChange}
                    placeholder="Describe department services..."
                  />
                </div>
              </div>

              <div className="dept-modal-footer">
                <button type="button" onClick={closeForm} className="btn-cancel">Cancel</button>
                <button type="submit" disabled={formLoading} className="btn-submit">
                  {formLoading ? 'Saving...' : (isUpdateMode ? 'Update' : 'Add')} Department
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