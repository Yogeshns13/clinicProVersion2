// src/components/BranchList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiPlus,
  FiX,
  FiHome,
} from 'react-icons/fi';
import { 
  getBranchList, 
  getClinicList, 
  clearCacheByType 
} from '../api/cachedApi.js';
import { addBranch } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './BranchList.module.css';

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────
const BRANCH_TYPES = [
  { id: 1, label: 'Main' },
  { id: 2, label: 'Satellite' },
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

  // Add Form Modal
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    clinicId: '',
    branchName: '',
    address: '',
    location: '',
    branchType: 1,
  });
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
        setLoading(true);
        setError(null);
        
        const clinicId = selectedClinicId === 'all' ? 0 : Number(selectedClinicId) || 0;
        const data = await getBranchList(clinicId);
        
        setBranches(data);
        setAllBranches(data);
      } catch (err) {
        console.error('fetchBranches error:', err);
        setError(
          err?.status >= 400 || err?.code >= 400
            ? err
            : { message: err.message || 'Failed to load branches' }
        );
      } finally {
        setLoading(false);
      }
    };
    fetchBranches();
  }, [selectedClinicId]);

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
  // Helper functions
  const getBranchTypeLabel = (branchTypeId) => {
    return BRANCH_TYPES.find((t) => t.id === branchTypeId)?.label || 'Main';
  };

  const getStatusClass = (status) => {
    if (status === 'active') return styles.active;
    if (status === 'inactive') return styles.inactive;
    return styles.inactive;
  };

  // ────────────────────────────────────────────────
  // Handlers
  const handleSearch = () => setSearchTerm(searchInput.trim());
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const openDetails = (branch) => setSelectedBranch(branch);
  
  const closeModal = () => setSelectedBranch(null);

  const openAddForm = () => {
    setFormData({
      clinicId: '',
      branchName: '',
      address: '',
      location: '',
      branchType: 1,
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);
    setError(null);

    try {
      await addBranch({
        clinicId: Number(formData.clinicId),
        branchName: formData.branchName.trim(),
        address: formData.address.trim(),
        location: formData.location.trim(),
        branchType: Number(formData.branchType),
      });

      // Clear cache after successful add
      clearCacheByType('GetBranchList');

      setFormSuccess(true);
      setTimeout(async () => {
        closeAddForm();
        const clinicId = selectedClinicId === 'all' ? 0 : Number(selectedClinicId) || 0;
        // Force refresh to get updated data
        const data = await getBranchList(clinicId, {}, true);
        setBranches(data);
        setAllBranches(data);
      }, 1500);
    } catch (err) {
      console.error('Add branch failed:', err);
      setFormError(err.message || 'Failed to add branch.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateClick = (branch) => {
    navigate(`/update-branch/${branch.id}`);
  };

  // ────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.loading}>Loading branches...</div>;

  if (error) return <div className={styles.error}>Error: {error.message || error}</div>;

  // ────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Branch Management" />

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.selectWrapper}>
          <FiHome className={styles.selectIcon} size={20} />
          <select
            value={selectedClinicId}
            onChange={(e) => setSelectedClinicId(e.target.value)}
            className={styles.select}
          >
            <option value="all">All Clinics</option>
            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search by branch name, clinic, location..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className={styles.searchInput}
          />
          <button onClick={handleSearch} className={styles.searchBtn}>
            <FiSearch size={20} />
          </button>
        </div>

        <div className={styles.addSection}>
          <button onClick={openAddForm} className={styles.addBtn}>
            <FiPlus size={22} />Add Branch
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
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
                <td colSpan={6} className={styles.noData}>
                  {searchTerm ? 'No branches found.' : 'No branches registered yet.'}
                </td>
              </tr>
            ) : (
              filteredBranches.map((branch) => (
                <tr key={branch.id}>
                  <td>
                    <div className={styles.nameCell}>
                      <div className={styles.avatar}>
                        {branch.name?.charAt(0).toUpperCase() || 'B'}
                      </div>
                      <div>
                        <div className={styles.name}>{branch.name}</div>
                        <div className={styles.type}>
                          {getBranchTypeLabel(branch.branchType)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{branch.clinicName || '—'}</td>
                  <td>
                    <span className={styles.branchTypeBadge}>
                      {getBranchTypeLabel(branch.branchType)}
                    </span>
                  </td>
                  <td>{branch.location || branch.address?.split(',')[0] || '—'}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClass(branch.status)}`}>
                      {branch.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => openDetails(branch)} className={styles.detailsBtn}>
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
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={`${styles.modal} ${styles.detailsModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailsModalHeader}>
              <div className={styles.detailsHeaderContent}>
                <div className={styles.avatarLarge}>
                  {selectedBranch.name?.charAt(0).toUpperCase() || 'B'}
                </div>
                <div>
                  <h2>{selectedBranch.name}</h2>
                  <p className={styles.subtitle}>
                    {getBranchTypeLabel(selectedBranch.branchType)}
                  </p>
                </div>
              </div>
              <div className={styles.statusBadgeLargeWrapper}>
                <span className={`${styles.statusBadge} ${styles.large} ${getStatusClass(selectedBranch.status)}`}>
                  {selectedBranch.status.toUpperCase()}
                </span>
              </div>
              <button onClick={closeModal} className={styles.modalClose}>
                ×
              </button>
            </div>

            <div className={styles.detailsModalBody}>
              <table className={styles.detailsTable}>
                <tbody>
                  <tr>
                    <td className={styles.label}>Clinic</td>
                    <td className={styles.value}>{selectedBranch.clinicName || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Branch Type</td>
                    <td className={styles.value}>
                      {getBranchTypeLabel(selectedBranch.branchType)}
                    </td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Full Address</td>
                    <td className={styles.value}>{selectedBranch.address || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Location</td>
                    <td className={styles.value}>{selectedBranch.location || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={styles.modalFooter}>
              <button onClick={() => handleUpdateClick(selectedBranch)} className={styles.btnUpdate}>
                Update Branch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── Add Form Modal ──────────────── */}
      {isAddFormOpen && (
        <div className={styles.modalOverlay} onClick={closeAddForm}>
          <div className={`${styles.modal} ${styles.formModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add New Branch</h2>
              <button onClick={closeAddForm} className={styles.modalClose}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.modalBody}>
              {formError && <div className={styles.formError}>{formError}</div>}
              {formSuccess && <div className={styles.formSuccess}>Branch added successfully!</div>}

              <div className={styles.formGrid}>
                <h3 className={styles.formSectionTitle}>Branch Information</h3>

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

                <div className={styles.formGroup}>
                  <label>
                    Branch Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    required
                    name="branchName"
                    value={formData.branchName}
                    onChange={handleInputChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>
                    Branch Type <span className={styles.required}>*</span>
                  </label>
                  <select
                    required
                    name="branchType"
                    value={formData.branchType}
                    onChange={handleInputChange}
                  >
                    {BRANCH_TYPES.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Full Address</label>
                  <textarea
                    name="address"
                    rows={2}
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Location (Area/City)</label>
                  <input
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={closeAddForm} className={styles.btnCancel}>
                  Cancel
                </button>
                <button type="submit" disabled={formLoading} className={styles.btnSubmit}>
                  {formLoading ? 'Adding...' : 'Add Branch'}
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