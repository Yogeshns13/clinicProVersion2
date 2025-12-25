// src/components/BranchList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { getBranchList, getClinicList, addBranch, updateBranch } from '../api/api.js';
import './BranchList.css';
import { FiSearch, FiPlus, FiHome, FiX } from "react-icons/fi";
import ErrorHandler from '../hooks/Errorhandler.jsx';

// Complete Branch Type List
const BRANCH_TYPES = [
  { id: 1, label: "Main Branch" },
  { id: 2, label: "Satellite Branch" },
  { id: 3, label: "Clinic" },
  { id: 4, label: "Hospital" },
  { id: 5, label: "Diagnostic Center" },
  { id: 6, label: "Research Center" }
];

const BranchList = () => {
  const [branches, setBranches] = useState([]);
  const [allBranches, setAllBranches] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [selectedClinicId, setSelectedClinicId] = useState("all");
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [branchIdForUpdate, setBranchIdForUpdate] = useState(null);

  const [formData, setFormData] = useState({
    clinicId: '',
    branchName: '',
    address: '',
    location: '',
    branchType: 1,
    status: 'active'
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Load clinics for dropdown
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const data = await getClinicList();
        setClinics(data);
      } catch (err) {
        if (err?.status >= 400 || err?.code >= 400) setError(err);
        console.error("Failed to load clinics:", err);
      }
    };
    fetchClinics();
  }, []);

  // Load branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true);
        setError(null);

        const clinicId = selectedClinicId === "all" ? 0 : parseInt(selectedClinicId) || 0;
        const data = await getBranchList(clinicId);

        setBranches(data);
        setAllBranches(data);
      } catch (err) {
        if (err?.status >= 400 || err?.code >= 400) {
          setError(err);
        } else {
          setError({ message: err.message || 'Failed to load branches' });
        }
        console.error('fetchBranches error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (clinics.length > 0 || selectedClinicId === "all") {
      fetchBranches();
    }
  }, [selectedClinicId, clinics.length]);

  const filteredBranches = useMemo(() => {
    if (!searchTerm.trim()) return allBranches;
    const term = searchTerm.toLowerCase();
    return allBranches.filter(branch =>
      branch.name?.toLowerCase().includes(term) ||
      branch.clinicName?.toLowerCase().includes(term) ||
      branch.location?.toLowerCase().includes(term) ||
      branch.address?.toLowerCase().includes(term) ||
      branch.branchType?.toLowerCase().includes(term)
    );
  }, [allBranches, searchTerm]);

  const handleSearch = () => setSearchTerm(searchInput.trim());
  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSearch(); };

  const openDetails = (branch) => setSelectedBranch(branch);
  const closeModal = () => setSelectedBranch(null);

  const openAddForm = () => {
    setIsUpdateMode(false);
    setBranchIdForUpdate(null);
    setFormData({
      clinicId: '',
      branchName: '',
      address: '',
      location: '',
      branchType: 1,
      status: 'active'
    });
    setFormError('');
    setFormSuccess(false);
    setIsFormOpen(true);
  };

  const openUpdateForm = (branch) => {
    setIsUpdateMode(true);
    setBranchIdForUpdate(branch.id);

    setFormData({
      clinicId: branch.clinicId || '',
      branchName: branch.name || '',
      address: branch.address || '',
      location: branch.location || '',
      branchType: branch.branchType || 1,
      status: branch.status === 'active' ? 'active' : 'inactive'
    });

    setFormError('');
    setFormSuccess(false);
    setSelectedBranch(null);
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

    try {
      if (isUpdateMode) {
        await updateBranch({
          branchId: branchIdForUpdate,
          clinicId: parseInt(formData.clinicId),
          BranchName: formData.branchName.trim(),
          Address: formData.address.trim(),
          Location: formData.location.trim(),
          BranchType: parseInt(formData.branchType),
          // Critical Fix: Active = 1, Inactive = 2
          Status: formData.status === 'active' ? 1 : 2
        });
      } else {
        await addBranch({
          clinicId: parseInt(formData.clinicId),
          branchName: formData.branchName.trim(),
          address: formData.address.trim(),
          location: formData.location.trim(),
          branchType: parseInt(formData.branchType)
          // addBranch doesn't need Status — defaults to active (1)
        });
      }

      setFormSuccess(true);
      setTimeout(() => {
        closeForm();
        // Refresh branches
        const clinicId = selectedClinicId === "all" ? 0 : parseInt(selectedClinicId) || 0;
        getBranchList(clinicId).then(data => {
          setBranches(data);
          setAllBranches(data);
        });
      }, 1500);

    } catch (err) {
      console.error("Save branch failed:", err);

      if (err?.status >= 400 || err?.code >= 400) {
        setError(err); // Triggers full-screen ErrorHandler
      } else {
        setFormError(err.message || "Failed to save branch.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleHold = (branch) => {
    const toggled = {
      ...branch,
      status: branch.status === 'active' ? 'inactive' : 'active'
    };
    openUpdateForm(toggled);
  };

  // Full-screen ErrorHandler for 400+ errors
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className="branch-loading">Loading branches...</div>;
  if (error) return <div className="branch-error">Error: {error.message || error}</div>;

  return (
    <div className="branch-list-wrapper">
      <ErrorHandler error={error} />

      {/* Header */}
      <div className="branch-list-header">
        <div>
          <h1>Branch Management</h1>
          <p>Manage all clinic branches across the system</p>
        </div>
      </div>

      {/* Clinic Filter + Search */}
      <div className="branch-controls">
        <div className="branch-clinic-filter">
          <div className="clinic-select-wrapper">
            <FiHome className="clinic-select-icon" size={20} />
            <select
              value={selectedClinicId}
              onChange={(e) => setSelectedClinicId(e.target.value)}
              className="clinic-select"
            >
              <option value="all">All Clinics</option>
              {clinics.map(clinic => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="branch-search-section">
          <div className="branch-search-container">
            <input
              type="text"
              placeholder="Search by branch name, clinic, location..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="branch-search-input"
            />
            <button onClick={handleSearch} className="branch-search-btn">
              <FiSearch size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Add Button */}
      <div className="branch-add-section">
        <button onClick={openAddForm} className="branch-add-btn-full">
          <FiPlus size={22} /> Add Branch
        </button>
      </div>

      {/* Table */}
      <div className="branch-table-container">
        <table className="branch-table">
          <thead>
            <tr>
              <th>Branch Name</th>
              <th>Clinic</th>
              <th>Type</th>
              <th>Location</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBranches.length === 0 ? (
              <tr>
                <td colSpan="6" className="branch-no-data">
                  {searchTerm ? 'No branches found matching your search.' : 'No branches registered yet.'}
                </td>
              </tr>
            ) : (
              filteredBranches.map((branch) => (
                <tr key={branch.id}>
                  <td>
                    <div className="branch-name-cell">
                      <div className="branch-avatar">
                        {branch.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="branch-name">{branch.name}</div>
                        <div className="branch-id">{
    BRANCH_TYPES.find(type => type.id === branch.branchType)?.label || 
    'Unknown'
  }
</div>
                      </div>
                    </div>
                  </td>
                  <td>{branch.clinicName || '—'}</td>
                  <td>
                    <span className="branch-type-badge">
                      {BRANCH_TYPES.find(t => t.id === branch.branchType)?.label || 'Main'}
                    </span>
                  </td>
                  <td>{branch.location || branch.address?.split(',')[0] || '—'}</td>
                  <td>
                    <span className={`status-badge ${branch.status}`}>
                      {branch.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => openDetails(branch)} className="branch-details-btn">
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
      {selectedBranch && (
        <div className="branch-modal-overlay" onClick={closeModal}>
          <div className="branch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="branch-modal-header">
              <h2>{selectedBranch.name}</h2>
              <button onClick={closeModal} className="branch-modal-close">×</button>
            </div>
            <div className="branch-modal-body">
              <div className="branch-info-grid">
                <div className="info-item"><label>Clinic</label><p>{selectedBranch.clinicName}</p></div>
                <div className="info-item"><label>Branch Type</label>
                  <p>{BRANCH_TYPES.find(t => t.id === selectedBranch.branchType)?.label || 'Main'}</p>
                </div>
                <div className="info-item"><label>Full Address</label><p>{selectedBranch.address || '—'}</p></div>
                <div className="info-item"><label>Location</label><p>{selectedBranch.location || '—'}</p></div>
                <div className="info-item"><label>Status</label>
                  <span className={`status-badge large ${selectedBranch.status}`}>
                    {selectedBranch.status.toUpperCase()}
                  </span>
                </div>
                <div className="info-item"><label>Branch ID</label><p>#{selectedBranch.id}</p></div>
              </div>
            </div>
            <div className="branch-modal-footer">
              <button onClick={() => handleHold(selectedBranch)} className="btn-hold">
                {selectedBranch.status === 'active' ? 'Hold Branch' : 'Activate Branch'}
              </button>
              <button onClick={() => openUpdateForm(selectedBranch)} className="btn-update">
                Update Branch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Update Form Modal */}
      {isFormOpen && (
        <div className="branch-modal-overlay" onClick={closeForm}>
          <div className="branch-modal form-modal" onClick={e => e.stopPropagation()}>
            <div className="branch-modal-header">
              <h2>{isUpdateMode ? 'Update Branch' : 'Add New Branch'}</h2>
              <button onClick={closeForm} className="branch-modal-close">
                <FiX size={28} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="branch-modal-body">
              {formError && <div className="form-error">{formError}</div>}
              {formSuccess && <div className="form-success">Branch {isUpdateMode ? 'updated' : 'added'} successfully!</div>}

              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Clinic <span className="required">*</span></label>
                  <select
                    name="clinicId"
                    value={formData.clinicId}
                    onChange={handleInputChange}
                    required
                    disabled={isUpdateMode}
                  >
                    <option value="">Select Clinic</option>
                    {clinics.map(clinic => (
                      <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Branch Name <span className="required">*</span></label>
                  <input required name="branchName" value={formData.branchName} onChange={handleInputChange} />
                </div>

                <div className="form-group">
                  <label>Branch Type <span className="required">*</span></label>
                  <select
                    name="branchType"
                    value={formData.branchType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Branch Type</option>
                    {BRANCH_TYPES.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Full Address</label>
                  <textarea name="address" rows="2" value={formData.address} onChange={handleInputChange} />
                </div>

                <div className="form-group full-width">
                  <label>Location (Area/City)</label>
                  <input name="location" value={formData.location} onChange={handleInputChange} />
                </div>

                {isUpdateMode && (
                  <div className="form-group full-width">
                    <label>Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="branch-modal-footer">
                <button type="button" onClick={closeForm} className="btn-cancel">Cancel</button>
                <button type="submit" disabled={formLoading} className="btn-submit">
                  {formLoading ? 'Saving...' : (isUpdateMode ? 'Update Branch' : 'Add Branch')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchList;