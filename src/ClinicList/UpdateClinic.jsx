// src/components/UpdateClinic.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiX, FiArrowLeft, FiSave } from 'react-icons/fi';
import { getClinicList, updateClinic } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import './ClinicList.css';

// ────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
];

// ────────────────────────────────────────────────
const UpdateClinic = () => {
  const navigate = useNavigate();
  const params = useParams();
  
  const clinicId = params.clinicId || params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clinicData, setClinicData] = useState(null);

  const [formData, setFormData] = useState({
    clinicName: '',
    address: '',
    location: '',
    clinicType: '',
    gstNo: '',
    cgstPercentage: 0,
    sgstPercentage: 0,
    ownerName: '',
    mobile: '',
    altMobile: '',
    email: '',
    fileNoPrefix: '',
    invoicePrefix: '',
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

        const clinicList = await getClinicList();
        const clinic = clinicList.find((c) => c.id === Number(clinicId));

        if (!clinic) {
          throw new Error(`Clinic not found with ID: ${clinicId}`);
        }

        setClinicData(clinic);

        setFormData({
          clinicName: clinic.name || '',
          address: clinic.address || '',
          location: clinic.location || '',
          clinicType: clinic.clinicType || '',
          gstNo: clinic.gstNo || '',
          cgstPercentage: clinic.cgstPercentage || 0,
          sgstPercentage: clinic.sgstPercentage || 0,
          ownerName: clinic.ownerName || '',
          mobile: clinic.mobile || '',
          altMobile: clinic.altMobile || '',
          email: clinic.email || '',
          fileNoPrefix: clinic.fileNoPrefix || '',
          invoicePrefix: clinic.invoicePrefix || '',
          status: clinic.status === 'active' ? 1 : 2,
        });
      } catch (err) {
        setError({
          message: err.message || 'Failed to load clinic data',
          status: err.status || 500,
        });
      } finally {
        setLoading(false);
      }
    };

    if (clinicId) {
      fetchData();
    } else {
      setLoading(false);
      setError({ message: 'No clinic ID provided', status: 400 });
    }
  }, [clinicId]);

  // ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBack = () => {
    navigate('/clinic-list');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);

    try {
      await updateClinic({
        clinicId: Number(clinicId),
        ClinicName: formData.clinicName.trim(),
        Address: formData.address.trim(),
        Location: formData.location.trim(),
        ClinicType: formData.clinicType.trim(),
        GstNo: formData.gstNo.trim(),
        CgstPercentage: Number(formData.cgstPercentage),
        SgstPercentage: Number(formData.sgstPercentage),
        OwnerName: formData.ownerName.trim(),
        Mobile: formData.mobile.trim(),
        AltMobile: formData.altMobile.trim(),
        Email: formData.email.trim(),
        FileNoPrefix: formData.fileNoPrefix.trim(),
        InvoicePrefix: formData.invoicePrefix.trim(),
        Status: Number(formData.status),
      });

      setFormSuccess(true);
      setTimeout(() => {
        navigate('/clinic-list');
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to update clinic.');
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  if (error && error?.status >= 400) {
    return <ErrorHandler error={error} />;
  }

  if (loading) {
    return <div className="clinic-loading">Loading clinic data...</div>;
  }

  if (error) {
    return (
      <div className="clinic-list-wrapper">
        <Header title="Update Clinic" />
        <div className="clinic-error">Error: {error.message || error}</div>
        <button onClick={handleBack} className="clinic-add-btn clinic-back-btn">
          <FiArrowLeft /> Back to List
        </button>
      </div>
    );
  }

  if (!clinicData) {
    return (
      <div className="clinic-list-wrapper">
        <Header title="Update Clinic" />
        <div className="clinic-error">Clinic not found</div>
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
      <Header title="Update Clinic" />

      <div className="clinic-toolbar">
        <button onClick={handleBack} className="clinic-add-btn">
          <FiArrowLeft size={20} /> Back to List
        </button>
      </div>

      <div className="clinic-table-container update-employee-container">
        <div className="clinic-modal form-modal update-employee-form">
          <div className="clinic-modal-header update-employee-header">
            <h2>Update Clinic: {formData.clinicName}</h2>
          </div>

          <form onSubmit={handleSubmit} className="clinic-modal-body">
            {formError && <div className="form-error">{formError}</div>}
            {formSuccess && <div className="form-success">Clinic updated successfully!</div>}

            <div className="form-grid">
              <h3 className="form-section-title">Basic Information</h3>

              <div className="form-group">
                <label>
                  Clinic Name <span className="required">*</span>
                </label>
                <input
                  required
                  name="clinicName"
                  value={formData.clinicName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Clinic Type</label>
                <input
                  name="clinicType"
                  value={formData.clinicType}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>
                  Owner Name <span className="required">*</span>
                </label>
                <input
                  required
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group full-width">
                <label>Address</label>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Location</label>
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </div>

              <h3 className="form-section-title">Contact Information</h3>

              <div className="form-group">
                <label>
                  Mobile <span className="required">*</span>
                </label>
                <input
                  required
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Alternate Mobile</label>
                <input
                  name="altMobile"
                  value={formData.altMobile}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group full-width">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <h3 className="form-section-title">Tax Information</h3>

              <div className="form-group">
                <label>GST Number</label>
                <input
                  name="gstNo"
                  value={formData.gstNo}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>CGST Percentage</label>
                <input
                  type="number"
                  name="cgstPercentage"
                  value={formData.cgstPercentage}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>SGST Percentage</label>
                <input
                  type="number"
                  name="sgstPercentage"
                  value={formData.sgstPercentage}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <h3 className="form-section-title">Billing Configuration</h3>

              <div className="form-group">
                <label>File No Prefix</label>
                <input
                  name="fileNoPrefix"
                  value={formData.fileNoPrefix}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Invoice Prefix</label>
                <input
                  name="invoicePrefix"
                  value={formData.invoicePrefix}
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
                {formLoading ? 'Updating...' : 'Update Clinic'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateClinic;