// src/components/BranchList.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiPlus,
  FiX,
  FiUser,
  FiLogOut,
  FiMoon,
  FiSun,
  FiKey,
  FiHome,
} from 'react-icons/fi';
import { FaUserCircle } from 'react-icons/fa';

import { getBranchList, getClinicList, addBranch, updateBranch } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';


import './BranchList.css';

// ────────────────────────────────────────────────
const BRANCH_TYPES = [
  { id: 1, label: 'Main Branch' },
  { id: 2, label: 'Satellite Branch' },
  { id: 3, label: 'Clinic' },
  { id: 4, label: 'Hospital' },
  { id: 5, label: 'Diagnostic Center' },
  { id: 6, label: 'Research Center' },
];

// ────────────────────────────────────────────────
const BranchList = () => {
  const navigate = useNavigate();

  // Data & Filter
  const [branches, setBranches] = useState([]);
  const [allBranches, setAllBranches] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [selectedClinicId, setSelectedClinicId] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected / Modal
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [branchIdForUpdate, setBranchIdForUpdate] = useState(null);

  const [formData, setFormData] = useState({
    clinicId: '',
    branchName: '',
    address: '',
    location: '',
    branchType: 1,
    status: 'active',
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // UI / Profile / Theme
  const profileName = localStorage.getItem('profileName') || 'Admin';
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileDetailsOpen, setIsProfileDetailsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  const profileRef = useRef(null);

  // ────────────────────────────────────────────────
  // Data fetching
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
        setLoading(true);
        setError(null);

        const clinicId = selectedClinicId === 'all' ? 0 : Number(selectedClinicId) || 0;
        const data = await getBranchList(clinicId);

        setBranches(data);
        setAllBranches(data);
      } catch (err) {
        console.error('fetchBranches error:', err);
        setError(err?.status >= 400 || err?.code >= 400 ? err : { message: err.message || 'Failed to load branches' });
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, [selectedClinicId]);

  // Dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'false');
    }
  }, [isDarkMode]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ────────────────────────────────────────────────
  // Computed values
  const filteredBranches = useMemo(() => {
    if (!searchTerm.trim()) return allBranches;

    const term = searchTerm.toLowerCase();
    return allBranches.filter(
      (branch) =>
        branch.name?.toLowerCase().includes(term) ||
        branch.clinicName?.toLowerCase().includes(term) ||
        branch.location?.toLowerCase().includes(term) ||
        branch.address?.toLowerCase().includes(term) ||
        BRANCH_TYPES.find((t) => t.id === branch.branchType)?.label.toLowerCase().includes(term)
    );
  }, [allBranches, searchTerm]);

  // ────────────────────────────────────────────────
  // Handlers
  const handleSearch = () => setSearchTerm(searchInput.trim());
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

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
      status: 'active',
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
      status: branch.status === 'active' ? 'active' : 'inactive',
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
    setFormData((prev) => ({ ...prev, [name]: value }));
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
          clinicId: Number(formData.clinicId),
          BranchName: formData.branchName.trim(),
          Address: formData.address.trim(),
          Location: formData.location.trim(),
          BranchType: Number(formData.branchType),
          Status: formData.status === 'active' ? 1 : 2,
        });
      } else {
        await addBranch({
          clinicId: Number(formData.clinicId),
          branchName: formData.branchName.trim(),
          address: formData.address.trim(),
          location: formData.location.trim(),
          branchType: Number(formData.branchType),
        });
      }

      setFormSuccess(true);
      setTimeout(() => {
        closeForm();
        const clinicId = selectedClinicId === 'all' ? 0 : Number(selectedClinicId) || 0;
        getBranchList(clinicId).then((data) => {
          setBranches(data);
          setAllBranches(data);
        });
      }, 1500);
    } catch (err) {
      console.error('Save branch failed:', err);
      setFormError(err.message || 'Failed to save branch.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleHold = (branch) => {
    const toggled = {
      ...branch,
      status: branch.status === 'active' ? 'inactive' : 'active',
    };
    openUpdateForm(toggled);
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
    setIsProfileOpen(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const openProfileDetails = () => {
    setIsProfileDetailsOpen(true);
    setIsProfileOpen(false);
  };

  // ────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className="clinic-loading">Loading branches...</div>;
  if (error) return <div className="clinic-error">Error: {error.message || error}</div>;

  // ────────────────────────────────────────────────
  return (
    <div className="clinic-list-wrapper">
      <ErrorHandler error={error} />

      <Header title="Branch Management" />


      {/* Toolbar */}
      <div className="clinic-toolbar">
        <div className="clinic-select-wrapper" >
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
        <div className="clinic-search-container">
            <input
              type="text"
              placeholder="Search by branch name, clinic, location..."
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
            <FiPlus size={22} /> Add Branch
          </button>
        </div>
      </div>





      {/* Table */}
      <div className="clinic-table-container">
        <table className="clinic-table">
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
                <td colSpan={6} className="clinic-no-data">
                  {searchTerm ? 'No branches found.' : 'No branches registered yet.'}
                </td>
              </tr>
            ) : (
              filteredBranches.map((branch) => (
                <tr key={branch.id}>
                  <td>
                    <div className="clinic-name-cell">
                      <div className="clinic-avatar">{branch.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <div className="clinic-name">{branch.name}</div>
                        <div className="clinic-type">
                          {BRANCH_TYPES.find((t) => t.id === branch.branchType)?.label || 'Main Branch'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{branch.clinicName || '—'}</td>
                  <td>
                    <span className="branch-type-badge">
                      {BRANCH_TYPES.find((t) => t.id === branch.branchType)?.label || 'Main'}
                    </span>
                  </td>
                  <td>{branch.location || branch.address?.split(',')[0] || '—'}</td>
                  <td>
                    <span className={`status-badge ${branch.status}`}>
                      {branch.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => openDetails(branch)} className="clinic-details-btn">
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
      {selectedBranch && (
        <div className="clinic-modal-overlay" onClick={closeModal}>
          <div className="clinic-modal details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="details-modal-header">
              <div className="details-header-content">
                <div className="clinic-avatar-large">{selectedBranch.name.charAt(0).toUpperCase()}</div>
                <div>
                  <h2>{selectedBranch.name}</h2>
                  <p className="clinic-subtitle">
                    {BRANCH_TYPES.find((t) => t.id === selectedBranch.branchType)?.label || 'Main Branch'}
                  </p>
                </div>
              </div>

              <div className="status-badge-large-wrapper">
                <span className={`status-badge large ${selectedBranch.status}`}>
                  {selectedBranch.status.toUpperCase()}
                </span>
              </div>

              <button onClick={closeModal} className="clinic-modal-close">×</button>
            </div>

            <div className="details-modal-body">
              <table className="details-table">
                <tbody>
                  <tr>
                    <td className="label">Clinic</td>
                    <td className="value">{selectedBranch.clinicName || '—'}</td>
                  </tr>
                  <tr>
                    <td className="label">Branch Type</td>
                    <td className="value">
                      {BRANCH_TYPES.find((t) => t.id === selectedBranch.branchType)?.label || 'Main'}
                    </td>
                  </tr>
                  <tr>
                    <td className="label">Full Address</td>
                    <td className="value">{selectedBranch.address || '—'}</td>
                  </tr>
                  <tr>
                    <td className="label">Location</td>
                    <td className="value">{selectedBranch.location || '—'}</td>
                  </tr>
                  <tr>
                    <td className="label">Branch ID</td>
                    <td className="value">#{selectedBranch.id}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="clinic-modal-footer">
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

      {/* ──────────────── Add/Update Form Modal ──────────────── */}
      {isFormOpen && (
        <div className="clinic-modal-overlay" onClick={closeForm}>
          <div className="clinic-modal form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="clinic-modal-header">
              <h2>{isUpdateMode ? 'Update Branch' : 'Add New Branch'}</h2>
              <button onClick={closeForm} className="clinic-modal-close">
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="clinic-modal-body">
              {formError && <div className="form-error">{formError}</div>}
              {formSuccess && (
                <div className="form-success">Branch {isUpdateMode ? 'updated' : 'added'} successfully!</div>
              )}

              <div className="form-grid">
                <div className="form-group full-width">
                  <label>
                    Clinic <span className="required">*</span>
                  </label>
                  <select
                    name="clinicId"
                    value={formData.clinicId}
                    onChange={handleInputChange}
                    required
                    disabled={isUpdateMode}
                  >
                    <option value="">Select Clinic</option>
                    {clinics.map((clinic) => (
                      <option key={clinic.id} value={clinic.id}>
                        {clinic.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Branch Name <span className="required">*</span>
                  </label>
                  <input
                    required
                    name="branchName"
                    value={formData.branchName}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>
                    Branch Type <span className="required">*</span>
                  </label>
                  <select
                    name="branchType"
                    value={formData.branchType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Type</option>
                    {BRANCH_TYPES.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Full Address</label>
                  <textarea name="address" rows={2} value={formData.address} onChange={handleInputChange} />
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

              <div className="clinic-modal-footer">
                <button type="button" onClick={closeForm} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" disabled={formLoading} className="btn-submit">
                  {formLoading ? 'Saving...' : isUpdateMode ? 'Update Branch' : 'Add Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────── Profile Details Modal ──────────────── */}
      {isProfileDetailsOpen && (
        <div className="clinic-modal-overlay" onClick={() => setIsProfileDetailsOpen(false)}>
          <div className="clinic-modal profile-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="clinic-modal-header">
              <h2>Admin Profile</h2>
              <button onClick={() => setIsProfileDetailsOpen(false)} className="clinic-modal-close">
                <FiX />
              </button>
            </div>

            <div className="clinic-modal-body profile-details-body">
              <div className="profile-avatar-large">{profileName.charAt(0).toUpperCase()}</div>

              <h3>{profileName}</h3>
              <p className="profile-role">Administrator</p>

              <div className="profile-info-grid">
                <div className="profile-info-item">
                  <label>Full Name</label>
                  <p>{profileName}</p>
                </div>
                <div className="profile-info-item">
                  <label>Email</label>
                  <p>admin@example.com</p>
                </div>
                <div className="profile-info-item">
                  <label>Role</label>
                  <p>Super Admin</p>
                </div>
                <div className="profile-info-item">
                  <label>Last Login</label>
                  <p>December 30, 2025</p>
                </div>
              </div>
            </div>

            <div className="clinic-modal-footer">
              <button className="btn-cancel" onClick={() => setIsProfileDetailsOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchList;