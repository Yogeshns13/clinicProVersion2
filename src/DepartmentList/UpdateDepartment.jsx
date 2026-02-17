// src/components/UpdateDepartment.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiX, FiArrowLeft, FiSave } from 'react-icons/fi';
import { getDepartmentList, getClinicList, getBranchList, updateDepartment } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
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
  const [validationMessages, setValidationMessages] = useState({});

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
    
    const filteredValue = filterInput(name, value);
    
    setFormData((prev) => ({ ...prev, [name]: filteredValue }));

    const validationMessage = getLiveValidationMessage(name, filteredValue);
    setValidationMessages((prev) => ({
      ...prev,
      [name]: validationMessage,
    }));
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
    return <div className={styles.clinicLoading}>Loading department data...</div>;
  }

  if (error) {
    return (
      <div className={styles.clinicListWrapper}>
        <Header title="Update Department" />
        <div className={styles.clinicError}>Error: {error.message || error}</div>
        <button onClick={handleBack} className={`${styles.clinicAddBtn} ${styles.clinicBackBtn}`}>
          <FiArrowLeft /> Back to List
        </button>
      </div>
    );
  }

  if (!departmentData) {
    return (
      <div className={styles.clinicListWrapper}>
        <Header title="Update Department" />
        <div className={styles.clinicError}>Department not found</div>
        <button onClick={handleBack} className={`${styles.clinicAddBtn} ${styles.clinicBackBtn}`}>
          <FiArrowLeft /> Back to List
        </button>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  return (
    <div className={styles.clinicListWrapper}>
      <ErrorHandler error={error} />
      <Header title="Update Department" />

      <div className={styles.clinicToolbar}>
        <button onClick={handleBack} className={styles.clinicAddBtn}>
          Back to List
        </button>
      </div>

      <div className={`${styles.clinicTableContainer} ${styles.updateEmployeeContainer}`} style={{ padding: '20px', borderRadius: '17px' }}>
        <div className={`${styles.clinicModal} ${styles.formModal} ${styles.updateEmployeeForm}`} style={{ maxWidth: 'none', width: '100%', maxHeight: 'none' }}>
          <div className={`${styles.clinicModalHeader} ${styles.updateEmployeeHeader}`}>
            <h2>Update Department: {formData.departmentName}</h2>
          </div>

          <form onSubmit={handleSubmit} className={styles.clinicModalBody}>
            {formError && <div className={styles.formError}>{formError}</div>}
            {formSuccess && <div className={styles.formSuccess}>Department updated successfully!</div>}

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
                
                {validationMessages.departmentName && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {validationMessages.departmentName}
                  </span>
                )}
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Description / Profile</label>
                <textarea
                  name="profile"
                  rows={3}
                  value={formData.profile}
                  onChange={handleInputChange}
                />
                
                {validationMessages.profile && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {validationMessages.profile}
                  </span>
                )}
              </div>
            </div>

            <div className={`${styles.clinicModalFooter} ${styles.updateEmployeeFooter}`}>
              <button type="button" onClick={handleBack} className={styles.btnCancel}>
                Cancel
              </button>
              <button type="submit" disabled={formLoading} className={styles.btnSubmit}>
                <FiSave className={styles.btnIcon} />
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