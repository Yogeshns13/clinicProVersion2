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
import styles from './ClinicList.module.css';

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

  if (loading) return <div className={styles.clinicLoading}>Loading clinics...</div>;

  if (error) return <div className={styles.clinicError}>Error: {error.message || error}</div>;

  // ────────────────────────────────────────────────
  return (
    <div className={styles.clinicListWrapper}>
      <ErrorHandler error={error} />
      <Header title="Clinic Management" />

      {/* Toolbar */}
      <div className={styles.clinicToolbar}>
        <div className={styles.clinicSearchContainer}>
          <input
            type="text"
            placeholder="Search by name, owner, mobile, GST..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className={styles.clinicSearchInput}
          />
          <button onClick={handleSearch} className={styles.clinicSearchBtn}>
            <FiSearch size={20} />
          </button>
        </div>

        <div className={styles.clinicAddSection}>
          <button onClick={openAddForm} className={styles.clinicAddBtn}>
            <FiPlus size={22} /> Add Clinic
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={styles.clinicTableContainer}>
        <table className={styles.clinicTable}>
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
                <td colSpan={7} className={styles.clinicNoData}>
                  {searchTerm ? 'No clinics found.' : 'No clinics registered yet.'}
                </td>
              </tr>
            ) : (
              filteredClinics.map((clinic) => (
                <tr key={clinic.id}>
                  <td>
                    <div className={styles.clinicNameCell}>
                      <div className={styles.clinicAvatar}>
                        {clinic.name?.charAt(0).toUpperCase() || 'C'}
                      </div>
                      <div>
                        <div className={styles.clinicName}>{clinic.name}</div>
                        <div className={styles.clinicType}>{clinic.email || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{clinic.ownerName || '—'}</td>
                  <td>{clinic.location || '—'}</td>
                  <td>{clinic.mobile || '—'}</td>
                  <td>{clinic.gstNo || '—'}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClass(clinic.status)}`}>
                      {clinic.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => openDetails(clinic)} className={styles.clinicDetailsBtn}>
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
        <div className={styles.clinicModalOverlay} onClick={closeModal}>
          <div className={`${styles.clinicModal} ${styles.detailsModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailsModalHeader}>
              <div className={styles.detailsHeaderContent}>
                <div className={styles.clinicAvatarLarge}>
                  {selectedClinic.name?.charAt(0).toUpperCase() || 'C'}
                </div>
                <div>
                  <h2>{selectedClinic.name}</h2>
                  <p className={styles.clinicSubtitle}>{selectedClinic.clinicType || 'Clinic'}</p>
                </div>
              </div>
              <div className={styles.statusBadgeLargeWrapper}>
                <span className={`${styles.statusBadge} ${styles.large} ${getStatusClass(selectedClinic.status)}`}>
                  {selectedClinic.status.toUpperCase()}
                </span>
              </div>
              <button onClick={closeModal} className={styles.clinicModalClose}>
                ×
              </button>
            </div>

            <div className={styles.detailsModalBody}>
              <table className={styles.detailsTable}>
                <tbody>
                  <tr>
                    <td className={styles.label}>Owner Name</td>
                    <td className={styles.value}>{selectedClinic.ownerName || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Mobile</td>
                    <td className={styles.value}>{selectedClinic.mobile || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Alt Mobile</td>
                    <td className={styles.value}>{selectedClinic.altMobile || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Email</td>
                    <td className={styles.value}>{selectedClinic.email || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Address</td>
                    <td className={styles.value}>{selectedClinic.address || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Location</td>
                    <td className={styles.value}>{selectedClinic.location || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>GST No</td>
                    <td className={styles.value}>{selectedClinic.gstNo || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>CGST %</td>
                    <td className={styles.value}>{selectedClinic.cgstPercentage || 0}%</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>SGST %</td>
                    <td className={styles.value}>{selectedClinic.sgstPercentage || 0}%</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>File No Prefix</td>
                    <td className={styles.value}>{selectedClinic.fileNoPrefix || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Invoice Prefix</td>
                    <td className={styles.value}>{selectedClinic.invoicePrefix || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={styles.clinicModalFooter}>
              <button onClick={() => handleUpdateClick(selectedClinic)} className={styles.btnUpdate}>
                Update Clinic
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── Add Form Modal ──────────────── */}
      {isAddFormOpen && (
        <div className={styles.clinicModalOverlay} onClick={closeAddForm}>
          <div className={`${styles.clinicModal} ${styles.formModal} ${styles.employeeFormModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.clinicModalHeader}>
              <h2>Add New Clinic</h2>
              <button onClick={closeAddForm} className={styles.clinicModalClose}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.clinicModalBody}>
              {formError && <div className={styles.formError}>{formError}</div>}
              {formSuccess && <div className={styles.formSuccess}>Clinic added successfully!</div>}

              <div className={styles.formGrid}>
                {/* Basic Information */}
                <h3 className={styles.formSectionTitle}>Basic Information</h3>

                <div className={styles.formGroup}>
                  <label>
                    Clinic Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    required
                    name="clinicName"
                    value={formData.clinicName}
                    onChange={handleInputChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Clinic Type</label>
                  <input
                    name="clinicType"
                    value={formData.clinicType}
                    onChange={handleInputChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>
                    Owner Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    required
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleInputChange}
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Address</label>
                  <textarea
                    name="address"
                    rows={2}
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Location</label>
                  <input
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Contact Information */}
                <h3 className={styles.formSectionTitle}>Contact Information</h3>

                <div className={styles.formGroup}>
                  <label>
                    Mobile <span className={styles.required}>*</span>
                  </label>
                  <input
                    required
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Alternate Mobile</label>
                  <input
                    name="altMobile"
                    value={formData.altMobile}
                    onChange={handleInputChange}
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Tax Information */}
                <h3 className={styles.formSectionTitle}>Tax Information</h3>

                <div className={styles.formGroup}>
                  <label>GST Number</label>
                  <input
                    name="gstNo"
                    value={formData.gstNo}
                    onChange={handleInputChange}
                  />
                </div>

                <div className={styles.formGroup}>
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

                <div className={styles.formGroup}>
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
                <h3 className={styles.formSectionTitle}>Billing Configuration</h3>

                <div className={styles.formGroup}>
                  <label>File No Prefix</label>
                  <input
                    name="fileNoPrefix"
                    value={formData.fileNoPrefix}
                    onChange={handleInputChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Last File Sequence</label>
                  <input
                    type="number"
                    name="lastFileSeq"
                    value={formData.lastFileSeq}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Invoice Prefix</label>
                  <input
                    name="invoicePrefix"
                    value={formData.invoicePrefix}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className={styles.clinicModalFooter}>
                <button type="button" onClick={closeAddForm} className={styles.btnCancel}>
                  Cancel
                </button>
                <button type="submit" disabled={formLoading} className={styles.btnSubmit}>
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