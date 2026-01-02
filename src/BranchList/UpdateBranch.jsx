// src/components/UpdateBranch.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiX, FiArrowLeft, FiSave } from 'react-icons/fi';
import { getBranchList, getClinicList, updateBranch } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import './BranchList.css';

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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBack = () => {
    navigate('/branch-list');
  };

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
  if (error && error?.status >= 400) {
    return <ErrorHandler error={error} />;
  }

  if (loading) {
    return <div className="clinic-loading">Loading branch data...</div>;
  }

  if (error) {
    return (
      <div className="clinic-list-wrapper">
        <Header title="Update Branch" />
        <div className="clinic-error">Error: {error.message || error}</div>
        <button onClick={handleBack} className="clinic-add-btn clinic-back-btn">
          <FiArrowLeft /> Back to List
        </button>
      </div>
    );
  }

  if (!branchData) {
    return (
      <div className="clinic-list-wrapper">
        <Header title="Update Branch" />
        <div className="clinic-error">Branch not found</div>
        <button onClick={handleBack} className="clinic-add-btn clinic-back-btn">
          <FiArrowLeft /> Back to List
        </button>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  return (
    <div className="clinic-list-wrapper">
      <ErrorHandler error={error} />
      <Header title="Update Branch" />

      <div className="clinic-toolbar">
        <button onClick={handleBack} className="clinic-add-btn">
         Back to List
        </button>
      </div>

      <div className="clinic-table-container update-employee-container" style={{ padding: '20px', borderRadius: '17px' }}>
        <div className="clinic-modal form-modal update-employee-form" style={{ maxWidth: 'none', width: '100%', maxHeight: 'none' }}>
          <div className="clinic-modal-header update-employee-header">
            <h2>Update Branch: {formData.branchName}</h2>
          </div>

          <form onSubmit={handleSubmit} className="clinic-modal-body">
            {formError && <div className="form-error">{formError}</div>}
            {formSuccess && <div className="form-success">Branch updated successfully!</div>}

            <div className="form-grid">
              <h3 className="form-section-title">Branch Information</h3>

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

              <div className="form-group full-width">
                <label>Full Address</label>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group full-width">
                <label>Location (Area/City)</label>
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>
                  Status <span className="required">*</span>
                </label>
                <select required name="status" value={formData.status} onChange={handleInputChange}>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="clinic-modal-footer update-employee-footer">
              <button type="button" onClick={handleBack} className="btn-cancel">
                Cancel
              </button>
              <button type="submit" disabled={formLoading} className="btn-submit">
                <FiSave className="btn-icon" />
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