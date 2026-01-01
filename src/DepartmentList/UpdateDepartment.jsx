// src/components/UpdateDepartment.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiX, FiArrowLeft, FiSave } from 'react-icons/fi';
import { getDepartmentList, getClinicList, getBranchList, updateDepartment } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import './DepartmentList.css';

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
];

// ────────────────────────────────────────────────
const UpdateDepartment = () => {
  const navigate = useNavigate();
  const params = useParams();
  
  const departmentId = params.departmentId || params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departmentData, setDepartmentData] = useState(null);

  const [formData, setFormData] = useState({
    clinicId: '',
    branchId: '',
    departmentName: '',
    profile: '',
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

        const departmentList = await getDepartmentList(0, 0);
        const department = departmentList.find((d) => d.id === Number(departmentId));

        if (!department) {
          throw new Error(`Department not found with ID: ${departmentId}`);
        }

        setDepartmentData(department);

        const branchData = await getBranchList(department.clinicId);
        setBranches(branchData || []);

        setFormData({
          clinicId: department.clinicId || '',
          branchId: department.branchId || '',
          departmentName: department.name || '',
          profile: department.profile || '',
          status: 1,
        });
      } catch (err) {
        setError({
          message: err.message || 'Failed to load department data',
          status: err.status || 500,
        });
      } finally {
        setLoading(false);
      }
    };

    if (departmentId) {
      fetchData();
    } else {
      setLoading(false);
      setError({ message: 'No department ID provided', status: 400 });
    }
  }, [departmentId]);

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

  // ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBack = () => {
    navigate('/dept-list');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);

    try {
      await updateDepartment({
        departmentId: Number(departmentId),
        clinicId: Number(formData.clinicId),
        DepartmentName: formData.departmentName.trim(),
        Profile: formData.profile.trim(),
      });

      setFormSuccess(true);
      setTimeout(() => {
        navigate('/dept-list');
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to update department.');
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  if (error && error?.status >= 400) {
    return <ErrorHandler error={error} />;
  }

  if (loading) {
    return <div className="clinic-loading">Loading department data...</div>;
  }

  if (error) {
    return (
      <div className="clinic-list-wrapper">
        <Header title="Update Department" />
        <div className="clinic-error">Error: {error.message || error}</div>
        <button onClick={handleBack} className="clinic-add-btn clinic-back-btn">
          <FiArrowLeft /> Back to List
        </button>
      </div>
    );
  }

  if (!departmentData) {
    return (
      <div className="clinic-list-wrapper">
        <Header title="Update Department" />
        <div className="clinic-error">Department not found</div>
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
      <Header title="Update Department" />

      <div className="clinic-toolbar">
        <button onClick={handleBack} className="clinic-add-btn">
          <FiArrowLeft size={20} /> Back to List
        </button>
      </div>

      <div className="clinic-table-container update-employee-container">
        <div className="clinic-modal form-modal update-employee-form">
          <div className="clinic-modal-header update-employee-header">
            <h2>Update Department: {formData.departmentName}</h2>
          </div>

          <form onSubmit={handleSubmit} className="clinic-modal-body">
            {formError && <div className="form-error">{formError}</div>}
            {formSuccess && <div className="form-success">Department updated successfully!</div>}

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

            <div className="clinic-modal-footer update-employee-footer">
              <button type="button" onClick={handleBack} className="btn-cancel">
                Cancel
              </button>
              <button type="submit" disabled={formLoading} className="btn-submit">
                <FiSave className="btn-icon" />
                {formLoading ? 'Updating...' : 'Update Department'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateDepartment;