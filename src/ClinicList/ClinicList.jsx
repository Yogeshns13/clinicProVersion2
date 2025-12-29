// src/components/ClinicList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { getClinicList, addClinic, updateClinic } from '../api/api.js';
import './ClinicList.css';
import { FiSearch, FiPlus, FiX, FiUser } from "react-icons/fi";
import ErrorHandler from "../hooks/Errorhandler.jsx";
import { useNavigate } from 'react-router-dom';

const ClinicList = () => {
  const navigate = useNavigate();

  const [clinics, setClinics] = useState([]);
  const [allClinics, setAllClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClinic, setSelectedClinic] = useState(null);

  // Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [clinicIdForUpdate, setClinicIdForUpdate] = useState(null);

  const [formData, setFormData] = useState({
    clinicName: '',
    ownerName: '',
    mobile: '',
    altMobile: '',
    email: '',
    address: '',
    location: '',
    clinicType: 'General Clinic',
    gstNo: '',
    cgstPercentage: 9,
    sgstPercentage: 9,
    fileNoPrefix: 'CL-',
    invoicePrefix: 'INV-',
    status: 'active'
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Profile name from localStorage
  const profileName = localStorage.getItem("profileName") || "User";

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getClinicList();
      setClinics(data);
      setAllClinics(data);
    } catch (err) {
      if (err?.status >= 400 || err?.code >= 400) {
        setError(err);
      } else {
        setError({ message: err.message || 'Failed to load clinics' });
      }
      console.error('fetchClinics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredClinics = useMemo(() => {
    if (!searchTerm.trim()) return allClinics;
    const term = searchTerm.toLowerCase();
    return allClinics.filter(clinic =>
      clinic.name?.toLowerCase().includes(term) ||
      clinic.mobile?.includes(searchTerm) ||
      clinic.gstNo?.toLowerCase().includes(term) ||
      clinic.ownerName?.toLowerCase().includes(term)
    );
  }, [allClinics, searchTerm]);

  const handleSearch = () => setSearchTerm(searchInput.trim());
  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSearch(); };

  const openDetails = (clinic) => setSelectedClinic(clinic);
  const closeModal = () => setSelectedClinic(null);

  const openAddForm = () => {
    setIsUpdateMode(false);
    setClinicIdForUpdate(null);
    setFormData({
      clinicName: '', ownerName: '', mobile: '', altMobile: '', email: '',
      address: '', location: '', clinicType: 'General Clinic',
      gstNo: '', cgstPercentage: 9, sgstPercentage: 9,
      fileNoPrefix: 'CL-', invoicePrefix: 'INV-', status: 'active'
    });
    setFormError('');
    setFormSuccess(false);
    setIsFormOpen(true);
  };

  const openUpdateForm = (clinic) => {
    setIsUpdateMode(true);
    setClinicIdForUpdate(clinic.id);

    setFormData({
      clinicName: clinic.name || '',
      ownerName: clinic.ownerName || '',
      mobile: clinic.mobile || '',
      altMobile: clinic.altMobile || '',
      email: clinic.email || '',
      address: clinic.address || '',
      location: clinic.location || '',
      clinicType: clinic.clinicType || 'General Clinic',
      gstNo: clinic.gstNo || '',
      cgstPercentage: clinic.cgstPercentage ?? 9,
      sgstPercentage: clinic.sgstPercentage ?? 9,
      fileNoPrefix: clinic.fileNoPrefix || 'CL-',
      invoicePrefix: clinic.invoicePrefix || 'INV-',
      status: clinic.status || 'active'
    });

    setFormError('');
    setFormSuccess(false);
    setSelectedClinic(null);
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
        await updateClinic({
          clinicId: clinicIdForUpdate,
          ClinicName: formData.clinicName.trim(),
          OwnerName: formData.ownerName.trim(),
          Mobile: formData.mobile.trim(),
          AltMobile: formData.altMobile.trim() || "",
          Email: formData.email.trim() || "",
          Address: formData.address.trim(),
          Location: formData.location.trim(),
          ClinicType: formData.clinicType.trim(),
          GstNo: formData.gstNo.trim(),
          CgstPercentage: Number(formData.cgstPercentage) || 0,
          SgstPercentage: Number(formData.sgstPercentage) || 0,
          FileNoPrefix: formData.fileNoPrefix.trim() || "",
          InvoicePrefix: formData.invoicePrefix.trim() || "",
          Status: formData.status === 'active' ? 1 : 2
        });
      } else {
        await addClinic({
          clinicName: formData.clinicName.trim(),
          ownerName: formData.ownerName.trim(),
          mobile: formData.mobile.trim(),
          altMobile: formData.altMobile.trim() || "",
          email: formData.email.trim() || "",
          address: formData.address.trim(),
          location: formData.location.trim(),
          clinicType: formData.clinicType.trim(),
          gstNo: formData.gstNo.trim(),
          cgstPercentage: Number(formData.cgstPercentage),
          sgstPercentage: Number(formData.sgstPercentage),
          fileNoPrefix: formData.fileNoPrefix.trim(),
          invoicePrefix: formData.invoicePrefix.trim(),
        });
      }

      setFormSuccess(true);
      setTimeout(() => {
        closeForm();
        fetchClinics();
      }, 1500);

    } catch (err) {
      console.error("Save failed:", err);
      if (err?.status >= 400 || err?.code >= 400) {
        setError(err);
      } else {
        setFormError(err.message || "Failed to save clinic.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleHold = (clinic) => {
    const toggled = {
      ...clinic,
      status: clinic.status === 'active' ? 'inactive' : 'active'
    };
    openUpdateForm(toggled);
  };

  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className="clinic-loading">Loading clinics...</div>;
  if (error) return <div className="clinic-error">Error: {error.message || error}</div>;

  return (
    <div className="clinic-list-wrapper">
      <ErrorHandler error={error} />

      {/* Header with Profile on right */}
      <div className="clinic-list-header">
        <h1>Clinic Management</h1>

        <div 
          className="header-profile"
          onClick={() => navigate('/settings')}
          role="button"
          tabIndex={0}
        >
          <FiUser size={20} />
          <span>{profileName}</span>
        </div>
      </div>

      {/* Toolbar: Search + Add Button in Same Line */}
      <div className="clinic-toolbar">
        <div className="clinic-search-container">
          <input
            type="text"
            placeholder="Search by name, mobile, GST no, owner..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="clinic-search-input"
          />
          <button onClick={handleSearch} className="clinic-search-btn">
            <FiSearch size={20} />
          </button>
        </div>

        <button onClick={openAddForm} className="clinic-add-btn">
          <FiPlus size={22} /> Add Clinic
        </button>
      </div>

      {/* Table */}
      <div className="clinic-table-container">
        <table className="clinic-table">
          <thead>
            <tr>
              <th>Clinic Name</th>
              <th>Owner</th>
              <th>Mobile</th>
              <th>Location</th>
              <th>GST No</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClinics.length === 0 ? (
              <tr>
                <td colSpan="7" className="clinic-no-data">
                  {searchTerm ? 'No clinics found.' : 'No clinics registered yet.'}
                </td>
              </tr>
            ) : (
              filteredClinics.map((clinic) => (
                <tr key={clinic.id}>
                  <td>
                    <div className="clinic-name-cell">
                      <div className="clinic-avatar">
                        {clinic.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="clinic-name">{clinic.name}</div>
                        <div className="clinic-type">{clinic.clinicType || 'General Clinic'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{clinic.ownerName || '—'}</td>
                  <td>{clinic.mobile}</td>
                  <td>{clinic.location || clinic.address?.split(',')[0] || '—'}</td>
                  <td className="gst-cell">{clinic.gstNo || '—'}</td>
                  <td>
                    <span className={`status-badge ${clinic.status}`}>
                      {clinic.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => openDetails(clinic)} className="clinic-details-btn">
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* DETAILS MODAL */}
      {selectedClinic && (
        <div className="clinic-modal-overlay" onClick={closeModal}>
          <div className="clinic-modal details-modal" onClick={e => e.stopPropagation()}>
            <div className="details-modal-header">
              <div className="details-header-content">
                <div className="clinic-avatar-large">
                  {selectedClinic.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2>{selectedClinic.name}</h2>
                  <p className="clinic-subtitle">{selectedClinic.clinicType || 'General Clinic'}</p>
                </div>
              </div>
              <div className="status-badge-large-wrapper">
                <span className={`status-badge large ${selectedClinic.status}`}>
                  {selectedClinic.status.toUpperCase()}
                </span>
              </div>
              <button onClick={closeModal} className="clinic-modal-close">×</button>
            </div>

            <div className="details-modal-body">
              <table className="details-table">
                <tbody>
                  <tr>
                    <td className="label">Owner Name</td>
                    <td className="value">{selectedClinic.ownerName || '—'}</td>
                  </tr>
                  <tr>
                    <td className="label">Mobile</td>
                    <td className="value">{selectedClinic.mobile}</td>
                  </tr>
                  <tr>
                    <td className="label">Alternate Mobile</td>
                    <td className="value">{selectedClinic.altMobile || '—'}</td>
                  </tr>
                  <tr>
                    <td className="label">Email</td>
                    <td className="value">{selectedClinic.email || '—'}</td>
                  </tr>
                  <tr>
                    <td className="label">Full Address</td>
                    <td className="value">{selectedClinic.address || '—'}</td>
                  </tr>
                  <tr>
                    <td className="label">Location</td>
                    <td className="value">{selectedClinic.location || '—'}</td>
                  </tr>
                  <tr>
                    <td className="label">GST No</td>
                    <td className="value gst-value">{selectedClinic.gstNo || '—'}</td>
                  </tr>
                  <tr>
                    <td className="label">File No Prefix</td>
                    <td className="value">{selectedClinic.fileNoPrefix || 'CL-'}</td>
                  </tr>
                  <tr>
                    <td className="label">Invoice Prefix</td>
                    <td className="value">{selectedClinic.invoicePrefix || 'INV-'}</td>
                  </tr>
                  <tr>
                    <td className="label">CGST %</td>
                    <td className="value">{selectedClinic.cgstPercentage ?? 9}%</td>
                  </tr>
                  <tr>
                    <td className="label">SGST %</td>
                    <td className="value">{selectedClinic.sgstPercentage ?? 9}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="clinic-modal-footer">
              <button onClick={() => handleHold(selectedClinic)} className="btn-hold">
                {selectedClinic.status === 'active' ? 'Hold Clinic' : 'Activate Clinic'}
              </button>
              <button onClick={() => openUpdateForm(selectedClinic)} className="btn-update">
                Update Clinic
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Update Form Modal */}
      {isFormOpen && (
        <div className="clinic-modal-overlay" onClick={closeForm}>
          <div className="clinic-modal form-modal" onClick={e => e.stopPropagation()}>
            <div className="clinic-modal-header">
              <h2>{isUpdateMode ? 'Update Clinic' : 'Add New Clinic'}</h2>
              <button onClick={closeForm} className="clinic-modal-close">
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="clinic-modal-body">
              {formError && <div className="form-error">{formError}</div>}
              {formSuccess && <div className="form-success">Clinic {isUpdateMode ? 'updated' : 'added'} successfully!</div>}

              <div className="form-grid">
                <div className="form-group">
                  <label>Clinic Name <span className="required">*</span></label>
                  <input required name="clinicName" value={formData.clinicName} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Owner Name</label>
                  <input name="ownerName" value={formData.ownerName} onChange={handleInputChange} />
                </div>

                <div className="form-group">
                  <label>Mobile <span className="required">*</span></label>
                  <input required name="mobile" value={formData.mobile} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Alternate Mobile</label>
                  <input name="altMobile" value={formData.altMobile} onChange={handleInputChange} />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Clinic Type</label>
                  <input name="clinicType" value={formData.clinicType} onChange={handleInputChange} placeholder="e.g. Dental, Ayurvedic" />
                </div>

                <div className="form-group">
                  <label>Full Address</label>
                  <textarea name="address" rows="2" value={formData.address} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Location (Area/City)</label>
                  <input name="location" value={formData.location} onChange={handleInputChange} />
                </div>

                <div className="form-group">
                  <label>GST No</label>
                  <input name="gstNo" value={formData.gstNo} onChange={handleInputChange} />
                </div>

                <div className="form-group">
                  <label>CGST %</label>
                  <input type="number" step="0.01" min="0" name="cgstPercentage" value={formData.cgstPercentage} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>SGST %</label>
                  <input type="number" step="0.01" min="0" name="sgstPercentage" value={formData.sgstPercentage} onChange={handleInputChange} />
                </div>

                <div className="form-group">
                  <label>File No Prefix</label>
                  <input name="fileNoPrefix" value={formData.fileNoPrefix} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Invoice Prefix</label>
                  <input name="invoicePrefix" value={formData.invoicePrefix} onChange={handleInputChange} />
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
                <button type="button" onClick={closeForm} className="btn-cancel">Cancel</button>
                <button type="submit" disabled={formLoading} className="btn-submit">
                  {formLoading ? 'Saving...' : (isUpdateMode ? 'Update Clinic' : 'Add Clinic')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicList;