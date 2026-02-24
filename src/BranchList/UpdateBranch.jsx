// src/components/UpdateBranch.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSave } from 'react-icons/fi';
import { getBranchList, getClinicList, updateBranch } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './BranchList.module.css';

const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'branchName':
      if (!value || !value.trim()) return 'Branch name is required';
      if (value.trim().length < 3) return 'Branch name must be at least 3 characters';
      if (value.trim().length > 100) return 'Branch name must not exceed 100 characters';
      return '';

    case 'address':
      if (value && value.length > 500) return 'Address must not exceed 500 characters';
      return '';

    case 'location':
      if (value && value.length > 100) return 'Location must not exceed 100 characters';
      return '';

    default:
      return '';
  }
};

const filterInput = (fieldName, value) => {
  switch (fieldName) {
    case 'branchName':
    case 'location':
      return value.replace(/[^a-zA-Z\s]/g, '');
    default:
      return value;
  }
};

const BRANCH_TYPES = [
  { id: 1, label: 'Main' },
  { id: 2, label: 'Satellite' },
  { id: 3, label: 'Clinic' },
  { id: 4, label: 'Hospital' },
  { id: 5, label: 'Diagnostic Center' },
  { id: 6, label: 'Research Center' },
];

const STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
];

// ────────────────────────────────────────────────
const UpdateBranch = () => {
  const navigate = useNavigate();
  const params = useParams();
  const branchId = params.branchId || params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [branchData, setBranchData] = useState(null);

  const [formData, setFormData] = useState({
    clinicId: '',
    branchName: '',
    address: '',
    location: '',
    branchType: 1,
    status: 1,
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [validationMessages, setValidationMessages] = useState({});

  // ────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const clinicData = await getClinicList();
        setClinics(clinicData || []);

        const branchList = await getBranchList(0);
        const branch = branchList.find((b) => b.id === Number(branchId));

        if (!branch) {
          throw new Error(`Branch not found with ID: ${branchId}`);
        }

        setBranchData(branch);

        setFormData({
          clinicId: branch.clinicId || '',
          branchName: branch.name || '',
          address: branch.address || '',
          location: branch.location || '',
          branchType: branch.branchType || 1,
          status: branch.status === 'active' ? 1 : 2,
        });
      } catch (err) {
        setError({
          message: err.message || 'Failed to load branch data',
          status: err.status || 500,
        });
      } finally {
        setLoading(false);
      }
    };

    if (branchId) {
      fetchData();
    } else {
      setLoading(false);
      setError({ message: 'No branch ID provided', status: 400 });
    }
  }, [branchId]);

  // ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    const filteredValue = filterInput(name, value);
    
    setFormData((prev) => ({ ...prev, [name]: filteredValue }));

    const validationMessage = getLiveValidationMessage(name, filteredValue);
    setValidationMessages((prev) => ({
      ...prev,
      [name]: validationMessage,
    }));
  };

  const handleClose = () => navigate('/branch-list');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);

    try {
      await updateBranch({
        branchId: Number(branchId),
        clinicId: Number(formData.clinicId),
        BranchName: formData.branchName.trim(),
        Address: formData.address.trim(),
        Location: formData.location.trim(),
        BranchType: Number(formData.branchType),
        Status: Number(formData.status),
      });

      setFormSuccess(true);
      setTimeout(() => {
        navigate('/branch-list');
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to update branch.');
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  if (error && error?.status >= 400) return <ErrorHandler error={error} />;
  if (loading) return <div className={styles.clinicLoading}>Loading branch data...</div>;

  if (error) {
    return (
      <div className={styles.clinicListWrapper}>
        <Header title="Update Branch" />
        <div className={styles.clinicError}>
          {error.message || 'No branch ID provided'}
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  return (
    <div className={styles.clinicListWrapper}>
      <ErrorHandler error={error} />
      <Header title="Update Branch" />

      {/* Modal Overlay */}
      <div className={styles.detailModalOverlay} onClick={handleClose}>
        <div className={styles.addModalContent} onClick={(e) => e.stopPropagation()}>

          {/* Gradient Header */}
          <div className={styles.detailModalHeader}>
            <div className={styles.detailHeaderContent}>
              <h2>Update Branch</h2>
              <div className={styles.detailHeaderMeta}>
                <span className={styles.workIdBadge}>
                  {formData.branchName || 'Branch'}
                </span>
                <span
                  className={`${styles.workIdBadge} ${
                    formData.status === 1 ? styles.activeBadge : styles.inactiveBadge
                  }`}
                >
                  {formData.status === 1 ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            </div>
            <button onClick={handleClose} className={styles.detailCloseBtn}>
              ✕
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className={styles.addModalBody}>
            {formError && <div className={styles.formError}>{formError}</div>}
            {formSuccess && <div className={styles.formSuccess}>Branch updated successfully!</div>}

            <div className={styles.addSection}>
              <div className={styles.addSectionHeader}>
                <h3>Branch Information</h3>
              </div>

              <div className={styles.addFormGrid}>

                <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
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

                <div className={styles.addFormGroup}>
                  <label>
                    Branch Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    required
                    name="branchName"
                    value={formData.branchName}
                    onChange={handleInputChange}
                    placeholder="Enter branch name"
                  />
                  {validationMessages.branchName && (
                    <span className={styles.validationMsg}>
                      {validationMessages.branchName}
                    </span>
                  )}
                </div>

                <div className={styles.addFormGroup}>
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

                <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                  <label>Full Address</label>
                  <textarea
                    name="address"
                    rows={2}
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter full address"
                  />
                  {validationMessages.address && (
                    <span className={styles.validationMsg}>
                      {validationMessages.address}
                    </span>
                  )}
                </div>

                <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                  <label>Location (Area/City)</label>
                  <input
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g. Anna Nagar, Madurai"
                  />
                  {validationMessages.location && (
                    <span className={styles.validationMsg}>
                      {validationMessages.location}
                    </span>
                  )}
                </div>

                <div className={styles.addFormGroup}>
                  <label>
                    Status <span className={styles.required}>*</span>
                  </label>
                  <select
                    required
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className={styles.detailModalFooter}>
              <button type="button" onClick={handleClose} className={styles.btnCancel}>
                Cancel
              </button>
              <button type="submit" disabled={formLoading} className={styles.btnSubmit}>
                <FiSave style={{ marginRight: '8px' }} />
                {formLoading ? 'Updating...' : 'Update Branch'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default UpdateBranch;