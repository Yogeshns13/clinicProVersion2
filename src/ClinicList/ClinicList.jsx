// src/components/ClinicList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiPlus,
  FiX,
} from 'react-icons/fi';
import { 
  getClinicList, 
  addClinic, 
} from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import './ClinicList.css';

// ────────────────────────────────────────────────
const ClinicList = () => {
  const navigate = useNavigate();

  // Data & Filter
  const [clinics, setClinics] = useState([]);
  const [allClinics, setAllClinics] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected / Modal
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Form Modal
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
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
    lastFileSeq: 0,
    invoicePrefix: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // ────────────────────────────────────────────────
  // Data fetching
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await getClinicList();
        
        setClinics(data);
        setAllClinics(data);
      } catch (err) {
        console.error('fetchClinics error:', err);
        setError(
          err?.status >= 400 || err?.code >= 400
            ? err
            : { message: err.message || 'Failed to load clinics' }
        );
      } finally {
        setLoading(false);
      }
    };
    fetchClinics();
  }, []);

  // ────────────────────────────────────────────────
  // Computed values
  const filteredClinics = useMemo(() => {
    if (!searchTerm.trim()) return allClinics;
    const term = searchTerm.toLowerCase();
    return allClinics.filter(
      (clinic) =>
        clinic.name?.toLowerCase().includes(term) ||
        clinic.ownerName?.toLowerCase().includes(term) ||
        clinic.mobile?.toLowerCase().includes(term) ||
        clinic.email?.toLowerCase().includes(term) ||
        clinic.location?.toLowerCase().includes(term) ||
        clinic.gstNo?.toLowerCase().includes(term)
    );
  }, [allClinics, searchTerm]);

  // ────────────────────────────────────────────────
  // Helper functions
  const getStatusClass = (status) => {
    if (status === 'active') return 'active';
    if (status === 'inactive') return 'inactive';
    return 'inactive';
  };

  // ────────────────────────────────────────────────
  // Handlers
  const handleSearch = () => setSearchTerm(searchInput.trim());
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const openDetails = (clinic) => setSelectedClinic(clinic);
  
  const closeModal = () => setSelectedClinic(null);

  const openAddForm = () => {
    setFormData({
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
      lastFileSeq: 0,
      invoicePrefix: '',
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
      await addClinic({
        clinicName: formData.clinicName.trim(),
        address: formData.address.trim(),
        location: formData.location.trim(),
        clinicType: formData.clinicType.trim(),
        gstNo: formData.gstNo.trim(),
        cgstPercentage: Number(formData.cgstPercentage),
        sgstPercentage: Number(formData.sgstPercentage),
        ownerName: formData.ownerName.trim(),
        mobile: formData.mobile.trim(),
        altMobile: formData.altMobile.trim(),
        email: formData.email.trim(),
        fileNoPrefix: formData.fileNoPrefix.trim(),
        lastFileSeq: Number(formData.lastFileSeq),
        invoicePrefix: formData.invoicePrefix.trim(),
      });

      setFormSuccess(true);
      setTimeout(() => {
        closeAddForm();
        getClinicList().then((data) => {
          setClinics(data);
          setAllClinics(data);
        });
      }, 1500);
    } catch (err) {
      console.error('Add clinic failed:', err);
      setFormError(err.message || 'Failed to add clinic.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateClick = (clinic) => {
    navigate(`/update-clinic/${clinic.id}`);
  };

  // ────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className="clinic-loading">Loading clinics...</div>;

  if (error) return <div className="clinic-error">Error: {error.message || error}</div>;

  // ────────────────────────────────────────────────
  return (
    <div className="clinic-list-wrapper">
      <ErrorHandler error={error} />
      <Header title="Clinic Management" />

      {/* Toolbar */}
      <div className="clinic-toolbar">
        <div className="clinic-search-container">
          <input
            type="text"
            placeholder="Search by name, owner, mobile, GST..."
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
            <FiPlus size={22} /> Add Clinic
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="clinic-table-container">
        <table className="clinic-table">
          <thead>
            <tr>
              <th>Clinic Name</th>
              <th>Owner</th>
              <th>Location</th>
              <th>Mobile</th>
              <th>GST No</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClinics.length === 0 ? (
              <tr>
                <td colSpan={7} className="clinic-no-data">
                  {searchTerm ? 'No clinics found.' : 'No clinics registered yet.'}
                </td>
              </tr>
            ) : (
              filteredClinics.map((clinic) => (
                <tr key={clinic.id}>
                  <td>
                    <div className="clinic-name-cell">
                      <div className="clinic-avatar">
                        {clinic.name?.charAt(0).toUpperCase() || 'C'}
                      </div>
                      <div>
                        <div className="clinic-name">{clinic.name}</div>
                        <div className="clinic-type">{clinic.email || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{clinic.ownerName || '—'}</td>
                  <td>{clinic.location || '—'}</td>
                  <td>{clinic.mobile || '—'}</td>
                  <td>{clinic.gstNo || '—'}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(clinic.status)}`}>
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

      {/* ──────────────── Details Modal ──────────────── */}
      {selectedClinic && (
        <div className="clinic-modal-overlay" onClick={closeModal}>
          <div className="clinic-modal details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="details-modal-header">
              <div className="details-header-content">
                <div className="clinic-avatar-large">
                  {selectedClinic.name?.charAt(0).toUpperCase() || 'C'}
                </div>
                <div>
                  <h2>{selectedClinic.name}</h2>
                  <p className="clinic-subtitle">{selectedClinic.clinicType || 'Clinic'}</p>
                </div>
              </div>
              <div className="status-badge-large-wrapper">
                <span className={`status-badge large ${getStatusClass(selectedClinic.status)}`}>
                  {selectedClinic.status.toUpperCase()}
                </span>
              </div>
              <button onClick={closeModal} className="clinic-modal-close">
                ×
              </button>
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
                    <td className="value">{selectedClinic.mobile || '—'}</td>
                  </tr>
                  <tr>
                    <td className="label">Alt Mobile</td>
                    <td className="value">{selectedClinic.altMobile || '—'}</td>
                  </tr>
                  <tr>
                    <td className="label">Email</td>
                    <td className="value">{selectedClinic.email || '—'}</td>
                  </tr>
                  <tr>
                    <td className="label">Address</td>
                    <td className="value">{selectedClinic.address || '—'}</td>
                  </tr>
                  <tr>
                    <td className="label">Location</td>
                    <td className="value">{selectedClinic.location || '—'}</td>
                  </tr>
                  <tr>
                    <td className="label">GST No</td>
                    <td className="value">{selectedClinic.gstNo || '—'}</td>
                  </tr>
                  <tr>
                    <td className="label">CGST %</td>
                    <td className="value">{selectedClinic.cgstPercentage || 0}%</td>
                  </tr>
                  <tr>
                    <td className="label">SGST %</td>
                    <td className="value">{selectedClinic.sgstPercentage || 0}%</td>
                  </tr>
                  <tr>
                    <td className="label">File No Prefix</td>
                    <td className="value">{selectedClinic.fileNoPrefix || '—'}</td>
                  </tr>
                  <tr>
                    <td className="label">Invoice Prefix</td>
                    <td className="value">{selectedClinic.invoicePrefix || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="clinic-modal-footer">
              <button onClick={() => handleUpdateClick(selectedClinic)} className="btn-update">
                Update Clinic
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── Add Form Modal ──────────────── */}
      {isAddFormOpen && (
        <div className="clinic-modal-overlay" onClick={closeAddForm}>
          <div className="clinic-modal form-modal employee-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="clinic-modal-header">
              <h2>Add New Clinic</h2>
              <button onClick={closeAddForm} className="clinic-modal-close">
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="clinic-modal-body">
              {formError && <div className="form-error">{formError}</div>}
              {formSuccess && <div className="form-success">Clinic added successfully!</div>}

              <div className="form-grid">
                {/* Basic Information */}
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

                {/* Contact Information */}
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

                {/* Tax Information */}
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

                {/* Billing Configuration */}
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
                  <label>Last File Sequence</label>
                  <input
                    type="number"
                    name="lastFileSeq"
                    value={formData.lastFileSeq}
                    onChange={handleInputChange}
                    min="0"
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
              </div>

              <div className="clinic-modal-footer">
                <button type="button" onClick={closeAddForm} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" disabled={formLoading} className="btn-submit">
                  {formLoading ? 'Adding...' : 'Add Clinic'}
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