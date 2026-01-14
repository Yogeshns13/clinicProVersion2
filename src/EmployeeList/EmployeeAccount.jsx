// src/components/EmployeeAccount.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiX, FiEdit, FiCheckCircle, FiTrash2 } from 'react-icons/fi';
import { 
  getEmployeeBeneficiaryAccountList, 
  addEmployeeBeneficiaryAccount, 
  updateEmployeeBeneficiaryAccount,
  deleteEmployeeBeneficiaryAccount,
  getEmployeeList
} from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import './EmployeeAccount.css';

// ────────────────────────────────────────────────
const EmployeeAccount = () => {
  const { id } = useParams(); // Employee ID from URL
  const navigate = useNavigate();

  // Employee & Account data
  const [employee, setEmployee] = useState(null);
  const [accountList, setAccountList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    accountHolderName: '',
    accountNo: '',
    ifscCode: '',
    bankName: '',
    bankAddress: '',
    isDefault: false,
  });

  // Form submission states
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Delete confirmation states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ────────────────────────────────────────────────
  // Fetch employee details and account list
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

        // Fetch employee beneficiary account list (pass -1 to get all)
        const accountData = await getEmployeeBeneficiaryAccountList(clinicId, {
          EmployeeID: Number(id),
          IsDefault: -1,
        });

        setAccountList(accountData || []);

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

  // ────────────────────────────────────────────────
  // Helper functions
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

  const maskAccountNumber = (accountNo) => {
    if (!accountNo) return '—';
    const cleanAcc = accountNo.replace(/\s|-/g, '');
    if (cleanAcc.length <= 4) return accountNo;
    const lastFour = cleanAcc.slice(-4);
    const masked = 'X'.repeat(Math.min(cleanAcc.length - 4, 8));
    return `${masked}-${lastFour}`;
  };

  // ────────────────────────────────────────────────
  // Modal Handlers
  // ────────────────────────────────────────────────
  const handleOpenAddModal = () => {
    setModalMode('add');
    setSelectedAccount(null);
    setFormData({
      accountHolderName: '',
      accountNo: '',
      ifscCode: '',
      bankName: '',
      bankAddress: '',
      isDefault: false,
    });
    setFormError('');
    setFormSuccess(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (account) => {
    setModalMode('edit');
    setSelectedAccount(account);
    setFormData({
      accountHolderName: account.accountHolderName || '',
      accountNo: account.accountNo || '',
      ifscCode: account.ifscCode || '',
      bankName: account.bankName || '',
      bankAddress: account.bankAddress || '',
      isDefault: account.isDefault || false,
    });
    setFormError('');
    setFormSuccess(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAccount(null);
    setFormData({
      accountHolderName: '',
      accountNo: '',
      ifscCode: '',
      bankName: '',
      bankAddress: '',
      isDefault: false,
    });
    setFormError('');
    setFormSuccess(false);
  };

  // ────────────────────────────────────────────────
  // Form Handlers
  // ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
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
        ClinicID: clinicId ? Number(clinicId) : 0,
        BranchID: branchId ? Number(branchId) : 0,
        EmployeeID: Number(id),
        AccountHolderName: formData.accountHolderName.trim(),
        AccountNo: formData.accountNo.trim(),
        IFSCCode: formData.ifscCode.trim().toUpperCase(),
        BankName: formData.bankName.trim(),
        BankAddress: formData.bankAddress.trim(),
        IsDefault: formData.isDefault ? 1 : 0,
      };

      if (modalMode === 'add') {
        await addEmployeeBeneficiaryAccount(payload);
        setFormSuccess(true);
        
        // Refresh account list
        setTimeout(async () => {
          const accountData = await getEmployeeBeneficiaryAccountList(clinicId, {
            EmployeeID: Number(id),
            IsDefault: -1,
          });
          setAccountList(accountData || []);
          handleCloseModal();
        }, 1500);
      } else {
        // Update mode
        payload.BeneficiaryID = selectedAccount.beneficiaryId;
        payload.Status = 1; // Keep active
        await updateEmployeeBeneficiaryAccount(payload);
        setFormSuccess(true);
        
        // Refresh account list
        setTimeout(async () => {
          const accountData = await getEmployeeBeneficiaryAccountList(clinicId, {
            EmployeeID: Number(id),
            IsDefault: -1,
          });
          setAccountList(accountData || []);
          handleCloseModal();
        }, 1500);
      }
    } catch (err) {
      console.error('Form submission failed:', err);
      setFormError(err.message || 'Failed to save beneficiary account.');
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  // Delete Handlers
  // ────────────────────────────────────────────────
  const handleOpenDeleteModal = (account) => {
    setAccountToDelete(account);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setAccountToDelete(null);
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (!accountToDelete) return;

    setDeleteLoading(true);
    setDeleteError('');

    try {
      await deleteEmployeeBeneficiaryAccount(accountToDelete.beneficiaryId);

      const clinicId = localStorage.getItem('clinicID');

      
      // Refresh account list
      const accountData = await getEmployeeBeneficiaryAccountList(clinicId, {
        EmployeeID: Number(id),
        IsDefault: -1,
      });
      setAccountList(accountData || []);
      
      handleCloseDeleteModal();
    } catch (err) {
      console.error('Delete failed:', err);
      setDeleteError(err.message || 'Failed to delete beneficiary account.');
    } finally {
      setDeleteLoading(false);
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

  if (loading) return <div className="clinic-loading">Loading employee account details...</div>;

  if (error) return <div className="clinic-error">Error: {error.message || error}</div>;

  if (!employee) return <div className="clinic-error">Employee not found</div>;

  // ────────────────────────────────────────────────
  return (
    <div className="clinic-list-wrapper">
      <ErrorHandler error={error} />
      <Header title="Employee Beneficiary Account" />

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
          <div className="employee-tabs">
            <button
              className="tab-button"
              onClick={() => handleTabClick('details', `/view-employee/${id}`)}
            >
              Employee Details
            </button>
            <button
              className="tab-button"
              onClick={() => handleTabClick('proof', `/employee-proof/${id}`)}
            >
              Employee Proof
            </button>
            <button
              className="tab-button active"
              onClick={() => handleTabClick('account')}
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

        {/* Account List Body */}
        <div className="details-card-body">
          
          {accountList.length === 0 ? (
            <div className="empty-state">
              <p>No beneficiary account found for this employee.</p>
              <button onClick={handleOpenAddModal} className="btn-add-primary">
                Add Beneficiary Account
              </button>
            </div>
          ) : (
            <>
              <div className="proof-list-header">
                <h3 className="section-title">Beneficiary Account Records</h3>
                <button onClick={handleOpenAddModal} className="btn-add-secondary">
                  Add New Account
                </button>
              </div>

              {accountList.map((account) => (
                <div key={account.beneficiaryId} className="details-section proof-item">
                  <div className="proof-item-header">
                    <h4 className="proof-type-title">
                      {account.accountHolderName}
                      {account.isDefault && (
                        <span className="default-badge">
                          <FiCheckCircle size={16} /> Default
                        </span>
                      )}
                    </h4>
                    <div className="proof-item-actions">
                      <button
                        onClick={() => handleOpenEditModal(account)}
                        className="btn-icon-edit"
                        title="Edit account"
                      >
                        <FiEdit size={18} />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(account)}
                        className="btn-icon-delete"
                        title="Delete account"
                      >
                        <FiTrash2 size={18} />
                      </button>
                      <span className={`status-badge ${getStatusClass(account.status)}`}>
                        {account.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="detail-label">Account Holder Name</span>
                      <span className="detail-value">{account.accountHolderName}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Account Number</span>
                      <span className="detail-value">{maskAccountNumber(account.accountNo)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">IFSC Code</span>
                      <span className="detail-value">{account.ifscCode || '—'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Bank Name</span>
                      <span className="detail-value">{account.bankName || '—'}</span>
                    </div>
                    <div className="detail-item full-width">
                      <span className="detail-label">Bank Address</span>
                      <span className="detail-value">{account.bankAddress || '—'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Date Created</span>
                      <span className="detail-value">{formatDate(account.dateCreated)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Last Modified</span>
                      <span className="detail-value">{formatDate(account.dateModified)}</span>
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
              <h2>{modalMode === 'add' ? 'Add Beneficiary Account' : 'Update Beneficiary Account'}</h2>
              <button onClick={handleCloseModal} className="clinic-modal-close">
                <FiX />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="clinic-modal-body">
              {formError && <div className="form-error">{formError}</div>}
              {formSuccess && <div className="form-success">
                {modalMode === 'add' ? 'Account added successfully!' : 'Account updated successfully!'}
              </div>}

              <div className="form-grid">
                <div className="form-group full-width">
                  <label>
                    Account Holder Name <span className="required">*</span>
                  </label>
                  <input
                    required
                    name="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={handleInputChange}
                    placeholder="Enter account holder name"
                  />
                </div>

                <div className="form-group">
                  <label>
                    Account Number <span className="required">*</span>
                  </label>
                  <input
                    required
                    name="accountNo"
                    value={formData.accountNo}
                    onChange={handleInputChange}
                    placeholder="Enter account number"
                  />
                </div>

                <div className="form-group">
                  <label>
                    IFSC Code <span className="required">*</span>
                  </label>
                  <input
                    required
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleInputChange}
                    placeholder="Enter IFSC code"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Bank Name</label>
                  <input
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    placeholder="Enter bank name"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Bank Address</label>
                  <input
                    name="bankAddress"
                    value={formData.bankAddress}
                    onChange={handleInputChange}
                    placeholder="Enter bank address (optional)"
                  />
                </div>

                <div className="form-group full-width">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={formData.isDefault}
                      onChange={handleInputChange}
                    />
                    Set as default account
                  </label>
                </div>
              </div>

              <div className="clinic-modal-footer">
                <button type="button" onClick={handleCloseModal} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" disabled={formLoading} className="btn-submit">
                  {formLoading ? 'Saving...' : modalMode === 'add' ? 'Add Account' : 'Update Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && accountToDelete && (
        <div className="clinic-modal-overlay" onClick={handleCloseDeleteModal}>
          <div className="clinic-modal delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="clinic-modal-header">
              <h2>Delete Beneficiary Account</h2>
              <button onClick={handleCloseDeleteModal} className="clinic-modal-close">
                <FiX />
              </button>
            </div>

            <div className="clinic-modal-body">
              {deleteError && <div className="form-error">{deleteError}</div>}
              
              <div className="delete-confirmation">
                <div className="delete-icon">
                  <FiTrash2 size={48} />
                </div>
                <p className="delete-message">
                  Are you sure you want to delete this beneficiary account?
                </p>
                <div className="delete-details">
                  <p><strong>Account Holder:</strong> {accountToDelete.accountHolderName}</p>
                  <p><strong>Account Number:</strong> {maskAccountNumber(accountToDelete.accountNo)}</p>
                  <p><strong>Bank:</strong> {accountToDelete.bankName || '—'}</p>
                </div>
              </div>
            </div>

            <div className="clinic-modal-footer">
              <button 
                type="button" 
                onClick={handleCloseDeleteModal} 
                className="btn-cancel"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleConfirmDelete} 
                className="btn-delete"
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeAccount;