// src/components/EmployeeProof.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUpload, FiX, FiEdit, FiTrash2 } from 'react-icons/fi';
import { 
  getEmployeeProofList, 
  addEmployeeProof, 
  updateEmployeeProof,
  deleteEmployeeProof,
  uploadIDProof,
  getFile,
  getEmployeeList
} from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import './EmployeeProof.css';

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────
const ID_PROOF_OPTIONS = [
  { id: 1, label: 'Aadhar' },
  { id: 2, label: 'Passport' },
  { id: 3, label: 'Driving Licence' },
  { id: 4, label: 'Voter ID' },
  { id: 5, label: 'PAN Card' },
];

// ────────────────────────────────────────────────
const EmployeeProof = () => {
  const { id } = useParams(); // Employee ID from URL
  const navigate = useNavigate();

  // Employee & Proof data
  const [employee, setEmployee] = useState(null);
  const [proofList, setProofList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedProof, setSelectedProof] = useState(null);

  // Delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [proofToDelete, setProofToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    proofType: 0,
    idNumber: '',
    detail: '',
    expiryDate: '',
    fileId: 0,
  });

  // File upload states
  const [proofFile, setProofFile] = useState(null);
  const [proofFileUrl, setProofFileUrl] = useState(null);
  const [proofFileUploaded, setProofFileUploaded] = useState(false);
  const [proofUploadStatus, setProofUploadStatus] = useState('');
  const [isProofUploading, setIsProofUploading] = useState(false);

  // Proof file viewing
  const [viewingProofUrl, setViewingProofUrl] = useState(null);
  const [viewingProofType, setViewingProofType] = useState(null);
  const [loadingProofFile, setLoadingProofFile] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);

  // Form submission states
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // ────────────────────────────────────────────────
  // Fetch employee details and proof list
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const clinicId = localStorage.getItem('clinicID');

        // Fetch employee details
        const empData = await getEmployeeList(clinicId, {
          EmployeeID: Number(id),
        });

        if (empData && empData.length > 0) {
          setEmployee(empData[0]);
        } else {
          setError({ message: 'Employee not found' });
          return;
        }

        // Fetch employee proof list
        const proofData = await getEmployeeProofList(clinicId, {
          EmployeeID: Number(id),
        });

        setProofList(proofData || []);

      } catch (err) {
        console.error('fetchData error:', err);
        setError(
          err?.status >= 400 || err?.code >= 400
            ? err
            : { message: err.message || 'Failed to load data' }
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  // Cleanup file URLs
  useEffect(() => {
    return () => {
      if (proofFileUrl) {
        URL.revokeObjectURL(proofFileUrl);
      }
      if (viewingProofUrl) {
        URL.revokeObjectURL(viewingProofUrl);
      }
    };
  }, [proofFileUrl, viewingProofUrl]);

  // ────────────────────────────────────────────────
  // Helper functions
  const getProofTypeLabel = (proofTypeId) => {
    return ID_PROOF_OPTIONS.find((p) => p.id === proofTypeId)?.label || '—';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const getStatusClass = (status) => {
    if (status === 'active') return 'active';
    if (status === 'inactive') return 'inactive';
    return 'inactive';
  };

  const maskIdNumber = (idNumber) => {
    if (!idNumber) return '—';
    const cleanId = idNumber.replace(/\s|-/g, '');
    if (cleanId.length <= 4) return idNumber;
    const lastFour = cleanId.slice(-4);
    const masked = 'X'.repeat(Math.min(cleanId.length - 4, 8));
    return `${masked}-${lastFour}`;
  };

  // ────────────────────────────────────────────────
  // File Upload Handlers
  // ────────────────────────────────────────────────
  const handleProofFileUpload = (e) => {
    const file = e.target.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!file) {
      setProofUploadStatus('No file selected.');
      setProofFile(null);
      setProofFileUploaded(false);
      setProofFileUrl(null);
      setFormData((prev) => ({ ...prev, fileId: 0 }));
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setProofUploadStatus('Please upload a valid JPG, JPEG, PNG, or PDF file.');
      setProofFile(null);
      setProofFileUploaded(false);
      setProofFileUrl(null);
      setFormData((prev) => ({ ...prev, fileId: 0 }));
      return;
    }

    if (file.size > maxSize) {
      setProofUploadStatus('File size exceeds 5MB limit.');
      setProofFile(null);
      setProofFileUploaded(false);
      setProofFileUrl(null);
      setFormData((prev) => ({ ...prev, fileId: 0 }));
      return;
    }

    setProofFile(file);
    if (file.type.startsWith('image/')) {
      setProofFileUrl(URL.createObjectURL(file));
    } else {
      setProofFileUrl(null); // PDF - no preview
    }
    setProofUploadStatus('File selected. Click "Upload ID Proof" to submit.');
    setProofFileUploaded(false);
    setFormData((prev) => ({ ...prev, fileId: 0 }));
  };

  const handleProofFileUploadSubmit = async () => {
    if (!proofFile) {
      setProofUploadStatus('Please select an ID proof file first.');
      return;
    }

    setIsProofUploading(true);
    setProofUploadStatus('Uploading ID proof...');

    try {
      const response = await uploadIDProof(proofFile);
      setFormData((prev) => ({ ...prev, fileId: response.fileId }));
      setProofUploadStatus('ID proof uploaded successfully!');
      setProofFileUploaded(true);
    } catch (err) {
      setProofFileUploaded(false);
      setFormData((prev) => ({ ...prev, fileId: 0 }));
      setProofUploadStatus(`Failed to upload ID proof: ${err.message}`);
    } finally {
      setIsProofUploading(false);
    }
  };

  const handleRemoveProofFile = () => {
    setProofFile(null);
    setProofFileUrl(null);
    setProofFileUploaded(false);
    setProofUploadStatus('');
    setFormData((prev) => ({ ...prev, fileId: 0 }));
  };

  // ────────────────────────────────────────────────
  // View Proof File
  // ────────────────────────────────────────────────
  const handleViewProofFile = async (fileId) => {
    if (!fileId || fileId <= 0) return;
    
    setLoadingProofFile(true);
    setIsFileModalOpen(true);
    
    try {
      const fileData = await getFile(fileId);
      setViewingProofUrl(fileData.url);
      
      // Determine file type from blob
      const fileType = fileData.blob.type;
      if (fileType === 'application/pdf') {
        setViewingProofType('pdf');
      } else if (fileType.startsWith('image/')) {
        setViewingProofType('image');
      } else {
        setViewingProofType('unknown');
      }
    } catch (err) {
      console.error('Failed to load proof file:', err);
      setError({ message: err.message || 'Failed to load proof file' });
      setIsFileModalOpen(false);
    } finally {
      setLoadingProofFile(false);
    }
  };

  const handleCloseFileModal = () => {
    setIsFileModalOpen(false);
    if (viewingProofUrl) {
      URL.revokeObjectURL(viewingProofUrl);
    }
    setViewingProofUrl(null);
    setViewingProofType(null);
  };

  // ────────────────────────────────────────────────
  // Delete Handlers
  // ────────────────────────────────────────────────
  const handleOpenDeleteModal = (proof) => {
    setProofToDelete(proof);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setProofToDelete(null);
    setDeleteError('');
  };

  const handleDeleteProof = async () => {
    if (!proofToDelete) return;

    setIsDeleting(true);
    setDeleteError('');

    try {
      await deleteEmployeeProof(proofToDelete.proofId);

      const clinicId = localStorage.getItem('clinicID');
      
      // Refresh proof list
      const proofData = await getEmployeeProofList(clinicId, {
        EmployeeID: Number(id),
      });
      setProofList(proofData || []);
      
      // Close modal
      handleCloseDeleteModal();
    } catch (err) {
      console.error('Delete proof failed:', err);
      setDeleteError(err.message || 'Failed to delete employee proof.');
    } finally {
      setIsDeleting(false);
    }
  };

  // ────────────────────────────────────────────────
  // Modal Handlers
  // ────────────────────────────────────────────────
  const handleOpenAddModal = () => {
    setModalMode('add');
    setSelectedProof(null);
    setFormData({
      proofType: 0,
      idNumber: '',
      detail: '',
      expiryDate: '',
      fileId: 0,
    });
    setProofFile(null);
    setProofFileUrl(null);
    setProofFileUploaded(false);
    setProofUploadStatus('');
    setFormError('');
    setFormSuccess(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (proof) => {
    setModalMode('edit');
    setSelectedProof(proof);
    setFormData({
      proofType: proof.proofType,
      idNumber: proof.idNumber || '',
      detail: proof.detail || '',
      expiryDate: proof.expiryDate ? proof.expiryDate.split('T')[0] : '',
      fileId: proof.fileId || 0,
    });
    setProofFile(null);
    setProofFileUrl(null);
    setProofFileUploaded(false);
    setProofUploadStatus('');
    setFormError('');
    setFormSuccess(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProof(null);
    setFormData({
      proofType: 0,
      idNumber: '',
      detail: '',
      expiryDate: '',
      fileId: 0,
    });
    setProofFile(null);
    setProofFileUrl(null);
    setProofFileUploaded(false);
    setProofUploadStatus('');
    setFormError('');
    setFormSuccess(false);
  };

  // ────────────────────────────────────────────────
  // Form Handlers
  // ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);

    try {
      const clinicId = localStorage.getItem('clinicID');
      const branchId = localStorage.getItem('branchID');

      const payload = {
        clinicId: clinicId ? Number(clinicId) : 0,
        branchId: branchId ? Number(branchId) : 0,
        employeeId: Number(id),
        proofType: Number(formData.proofType),
        idNumber: formData.idNumber.trim(),
        detail: formData.detail.trim(),
        expiryDate: formData.expiryDate,
        fileId: Number(formData.fileId),
      };

      if (modalMode === 'add') {
        await addEmployeeProof(payload);
        setFormSuccess(true);
        
        // Refresh proof list
        setTimeout(async () => {
          const proofData = await getEmployeeProofList(clinicId, {
            EmployeeID: Number(id),
          });
          setProofList(proofData || []);
          handleCloseModal();
        }, 1500);
      } else {
        // Update mode
        payload.proofId = selectedProof.proofId;
        await updateEmployeeProof(payload);
        setFormSuccess(true);
        
        // Refresh proof list
        setTimeout(async () => {
          const proofData = await getEmployeeProofList(clinicId, {
            EmployeeID: Number(id),
          });
          setProofList(proofData || []);
          handleCloseModal();
        }, 1500);
      }
    } catch (err) {
      console.error('Form submission failed:', err);
      setFormError(err.message || 'Failed to save employee proof.');
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  // Navigation Handlers
  // ────────────────────────────────────────────────
  const handleBack = () => {
    navigate(`/view-employee/${id}`);
  };

  const handleTabClick = (tab, path) => {
    if (path) {
      navigate(path);
    }
  };

  // ────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className="clinic-loading">Loading employee proof details...</div>;

  if (error) return <div className="clinic-error">Error: {error.message || error}</div>;

  if (!employee) return <div className="clinic-error">Employee not found</div>;

  // ────────────────────────────────────────────────
  return (
    <div className="clinic-list-wrapper">
      <ErrorHandler error={error} />
      <Header title="Employee Proof" />

      {/* Back Button */}
      <div className="clinic-toolbar">
        <button onClick={handleBack} className="clinic-back-btn">
          <FiArrowLeft size={20} /> Back to Employee Details
        </button>
      </div>

      {/* Employee Details Card */}
      <div className="employee-details-card">
        
        {/* Header Section with Tabs */}
        <div className="details-card-header">
          <div className="employee-header-info">
            <h2>
              {employee.firstName} {employee.lastName}
            </h2>
            <p className="clinic-subtitle">
              {employee.designationDesc} - {employee.departmentName}
            </p>
            <span className={`status-badge large ${getStatusClass(employee.status)}`}>
              {employee.status.toUpperCase()}
            </span>
          </div>

          {/* Tab Navigation */}
          <div className="employee-tabs1">
            <button
              className="tab-button"
              onClick={() => handleTabClick('details', `/view-employee/${id}`)}
            >
              Employee Details
            </button>
            <button
              className="tab-button active"
              onClick={() => handleTabClick('proof')}
            >
              Employee Proof
            </button>
            <button
              className="tab-button"
              onClick={() => handleTabClick('account', `/employee-account/${id}`)}
            >
              Beneficiary Account
            </button>
            <button
              className="tab-button"
              onClick={() => handleTabClick('shift', `/employee-shift/${id}`)}
            >
              Employee Shift
            </button>
          </div>
        </div>  

        {/* Proof List Body */}
        <div className="details-card-body">
          
          {proofList.length === 0 ? (
            <div className="empty-state">
              <p>No ID proof records found for this employee.</p>
              <button onClick={handleOpenAddModal} className="btn-add-primary">
                Add ID Proof
              </button>
            </div>
          ) : (
            <>
              <div className="proof-list-header">
                <h3 className="section-title">ID Proof Records</h3>
                <button onClick={handleOpenAddModal} className="btn-add-secondary">
                  Add New Proof
                </button>
              </div>

              {proofList.map((proof) => (
                <div key={proof.proofId} className="details-section proof-item">
                  <div className="proof-item-header">
                    <h4 className="proof-type-title">{getProofTypeLabel(proof.proofType)}</h4>
                    <div className="proof-item-actions">
                      <button
                        onClick={() => handleOpenEditModal(proof)}
                        className="btn-icon-edit"
                        title="Edit proof"
                      >
                        <FiEdit size={18} />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(proof)}
                        className="btn-icon-delete"
                        title="Delete proof"
                      >
                        <FiTrash2 size={18} />
                      </button>
                      <span className={`status-badge ${getStatusClass(proof.status)}`}>
                        {proof.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="detail-label">Proof Type</span>
                      <span className="detail-value">{proof.proofTypeDesc}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">ID Number</span>
                      <span className="detail-value">{maskIdNumber(proof.idNumber)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Expiry Date</span>
                      <span className="detail-value">{formatDate(proof.expiryDate)}</span>
                    </div>
                    <div className="detail-item full-width">
                      <span className="detail-label">Detail</span>
                      <span className="detail-value">{proof.detail || '—'}</span>
                    </div>
                    {proof.fileId && proof.fileId > 0 && (
                      <div className="detail-item">
                        <span className="detail-label">Attached File</span>
                        <button
                          onClick={() => handleViewProofFile(proof.fileId)}
                          className="btn-view-file"
                          disabled={loadingProofFile}
                        >
                          {loadingProofFile ? 'Loading...' : 'View File'}
                        </button>
                      </div>
                    )}
                    <div className="detail-item">
                      <span className="detail-label">Date Created</span>
                      <span className="detail-value">{formatDate(proof.dateCreated)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Last Modified</span>
                      <span className="detail-value">{formatDate(proof.dateModified)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="clinic-modal-overlay" onClick={handleCloseModal}>
          <div className="clinic-modal form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="clinic-modal-header">
              <h2>{modalMode === 'add' ? 'Add Employee ID Proof' : 'Update Employee ID Proof'}</h2>
              <button onClick={handleCloseModal} className="clinic-modal-close">
                <FiX />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="clinic-modal-body">
              {formError && <div className="form-error">{formError}</div>}
              {formSuccess && <div className="form-success">
                {modalMode === 'add' ? 'Proof added successfully!' : 'Proof updated successfully!'}
              </div>}

              <div className="form-grid">
                {/* File Upload Section */}
                <div className="form-group full-width">
                  <div className="photo-upload-container">
                    <div className="photo-preview-section">
                      {proofFileUrl ? (
                        <div className="photo-preview">
                          <img src={proofFileUrl} alt="ID Proof Preview" />
                          <button
                            type="button"
                            onClick={handleRemoveProofFile}
                            className="remove-photo-btn"
                            title="Remove file"
                          >
                            <FiX />
                          </button>
                        </div>
                      ) : proofFile && proofFile.type === 'application/pdf' ? (
                        <div className="photo-placeholder">
                          <FiUpload size={40} />
                          <p>PDF Selected: {proofFile.name}</p>
                          <button
                            type="button"
                            onClick={handleRemoveProofFile}
                            className="remove-photo-btn"
                            title="Remove file"
                          >
                            <FiX />
                          </button>
                        </div>
                      ) : (
                        <div className="photo-placeholder">
                          <FiUpload size={40} />
                          <p>No file selected</p>
                          {modalMode === 'edit' && formData.fileId > 0 && (
                            <p className="file-exists-hint">File already uploaded</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="photo-upload-controls">
                      <input
                        type="file"
                        id="proofFileInput"
                        accept="image/jpeg,image/jpg,image/png,application/pdf"
                        onChange={handleProofFileUpload}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="proofFileInput" className="btn-select-photo">
                        Select ID Proof File
                      </label>
                      
                      {proofFile && !proofFileUploaded && (
                        <button
                          type="button"
                          onClick={handleProofFileUploadSubmit}
                          disabled={isProofUploading}
                          className="btn-upload-photo"
                        >
                          {isProofUploading ? 'Uploading...' : 'Upload ID Proof'}
                        </button>
                      )}
                      
                      {proofUploadStatus && (
                        <p className={`photo-status ${proofFileUploaded ? 'success' : 'info'}`}>
                          {proofUploadStatus}
                        </p>
                      )}
                      
                      <p className="photo-hint">
                        JPG, JPEG, PNG, or PDF. Max size: 5MB
                        {modalMode === 'edit' && ' (Optional: Upload new file to replace existing)'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    Proof Type <span className="required">*</span>
                  </label>
                  <select
                    required
                    name="proofType"
                    value={formData.proofType}
                    onChange={handleInputChange}
                  >
                    <option value="0">Select Proof Type</option>
                    {ID_PROOF_OPTIONS.map((proof) => (
                      <option key={proof.id} value={proof.id}>
                        {proof.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    ID Number <span className="required">*</span>
                  </label>
                  <input
                    required
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleInputChange}
                    placeholder="Enter ID number"
                  />
                </div>

                <div className="form-group">
                  <label>Detail</label>
                  <input
                    name="detail"
                    value={formData.detail}
                    onChange={handleInputChange}
                    placeholder="Additional details (optional)"
                  />
                </div>

                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="clinic-modal-footer">
                <button type="button" onClick={handleCloseModal} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" disabled={formLoading} className="btn-submit">
                  {formLoading ? 'Saving...' : modalMode === 'add' ? 'Add Proof' : 'Update Proof'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="clinic-modal-overlay" onClick={handleCloseDeleteModal}>
          <div className="clinic-modal delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="clinic-modal-header">
              <h2>Delete Employee Proof</h2>
              <button onClick={handleCloseDeleteModal} className="clinic-modal-close">
                <FiX />
              </button>
            </div>

            <div className="clinic-modal-body">
              {deleteError && <div className="form-error">{deleteError}</div>}
              
              <p className="delete-confirmation-text">
                Are you sure you want to delete this ID proof record?
              </p>
              
              {proofToDelete && (
                <div className="delete-proof-details">
                  <p><strong>Proof Type:</strong> {getProofTypeLabel(proofToDelete.proofType)}</p>
                  <p><strong>ID Number:</strong> {maskIdNumber(proofToDelete.idNumber)}</p>
                </div>
              )}
            </div>

            <div className="clinic-modal-footer">
              <button 
                type="button" 
                onClick={handleCloseDeleteModal} 
                className="btn-cancel"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleDeleteProof} 
                className="btn-delete"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Proof'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Viewing Modal */}
      {isFileModalOpen && (
        <div className="clinic-modal-overlay" onClick={handleCloseFileModal}>
          <div className="clinic-modal file-viewer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="clinic-modal-header">
              <h2>ID Proof Document</h2>
              <button onClick={handleCloseFileModal} className="clinic-modal-close">
                <FiX />
              </button>
            </div>

            <div className="clinic-modal-body file-viewer-body">
              {loadingProofFile ? (
                <div className="file-loading">
                  <p>Loading file...</p>
                </div>
              ) : viewingProofUrl ? (
                <div className="file-viewer-content">
                  {viewingProofType === 'image' && (
                    <img 
                      src={viewingProofUrl} 
                      alt="ID Proof Document" 
                      className="proof-file-image"
                    />
                  )}
                  {viewingProofType === 'pdf' && (
                    <iframe
                      src={viewingProofUrl}
                      title="ID Proof PDF"
                      className="proof-file-pdf"
                    />
                  )}
                  {viewingProofType === 'unknown' && (
                    <div className="file-error">
                      <p>Unable to preview this file type</p>
                      <a 
                        href={viewingProofUrl} 
                        download 
                        className="btn-download-file"
                      >
                        Download File
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="file-error">
                  <p>Failed to load file</p>
                </div>
              )}
            </div>

            <div className="clinic-modal-footer">
              <button onClick={handleCloseFileModal} className="btn-cancel">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeProof;