// src/components/UserList.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FiSearch, FiPlus, FiX } from 'react-icons/fi';
import {
  getUserList,
  addUser,
  getClinicList,
  getBranchList,
  getEmployeeList,
} from '../Api/Api.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import UpdateUser from './UpdateUser.jsx';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import ConfirmPopup from '../Hooks/ConfirmPopup.jsx';
import LoadingPage from '../Hooks/LoadingPage.jsx';
import styles from './UserList.module.css';

// ─────────────────────────────────────────────────────────────────────────────
// Validation helpers
// ─────────────────────────────────────────────────────────────────────────────
const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'userName':
      if (!value || !value.trim()) return 'Username is required';
      if (value.trim().length > 100) return 'Username should not exceed 100 characters';
      if (/\s/.test(value.trim())) return 'Username should not contain spaces';
      return '';

    case 'email':
      if (!value || !value.trim()) return 'Email is required';
      if (!value.includes('@')) return 'Email must contain @';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
        return 'Please enter a valid email address';
      if (value.trim().length > 100) return 'Email must not exceed 100 characters';
      return '';

    case 'mobile':
      if (!value || !value.trim()) return '';
      if (value.trim().length !== 10) return 'Mobile number must be 10 digits';
      if (!/^\d{10}$/.test(value.trim())) return 'Mobile number must contain only digits';
      return '';

    case 'password':
      if (!value || !value.trim()) return 'Password is required';
      if (value.trim().length < 6) return 'Password must be at least 6 characters';
      if (value.trim().length > 50) return 'Password must not exceed 50 characters';
      return '';

    case 'profileName':
      if (!value || !value.trim()) return 'Profile/Role is required';
      return '';

    case 'clinicId':
      if (!value || value === 0 || value === '0') return 'Please select a clinic';
      return '';

    default:
      return '';
  }
};

// ── Search payload builder ──
const buildSearchPayload = (searchType, searchValue) => {
  const val = searchValue.trim();
  switch (searchType) {
    case 'userName': return { UserName: val, Mobile: '', Email: '' };
    case 'mobile':   return { UserName: '',  Mobile: val, Email: '' };
    case 'email':    return { UserName: '',  Mobile: '',  Email: val };
    default:         return { UserName: '',  Mobile: '',  Email: '' };
  }
};

const buildStatusParam = (statusFilter) => {
  if (statusFilter === '0') return 0;
  if (statusFilter === '1') return 1;
  if (statusFilter === '2') return 2;
  return -1;
};

// ─────────────────────────────────────────────────────────────────────────────
// Clinic Dropdown component (used inside Add User modal)
// ─────────────────────────────────────────────────────────────────────────────
const ClinicDropdownField = ({ selectedClinic, onSelect, error }) => {
  const [clinicList, setClinicList] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [fetched, setFetched]       = useState(false);

  // Fetch all clinics once when component mounts
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getClinicList({ Page: 1, PageSize: 200, Status: 1 });
        setClinicList(Array.isArray(data) ? data : []);
      } catch {
        setClinicList([]);
      } finally {
        setLoading(false);
        setFetched(true);
      }
    };
    load();
  }, []);

  const handleChange = (e) => {
    const id = e.target.value;
    if (!id) {
      onSelect(null);
      return;
    }
    const found = clinicList.find((c) => String(c.id) === id);
    onSelect(found || null);
  };

  return (
    <div>
      <select
        className={styles.addSelect}
        value={selectedClinic?.id || ''}
        onChange={handleChange}
        disabled={loading}
      >
        <option value="">
          {loading ? 'Loading clinics…' : fetched && clinicList.length === 0 ? 'No clinics available' : 'Select Clinic'}
        </option>
        {clinicList.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      {error && <span className={styles.validationMsg}>{error}</span>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// UserList
// ─────────────────────────────────────────────────────────────────────────────
const UserList = () => {
  // ── Data ──
  const [users, setUsers] = useState([]);

  // ── Popup ──
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopup  = (message, type = 'success') => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });

  // ── Delete confirm ──
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Filters ──
  const [filterInputs, setFilterInputs] = useState({
    searchType: 'userName', searchValue: '', statusFilter: '0',
  });
  const [appliedFilters, setAppliedFilters] = useState({
    searchType: 'userName', searchValue: '', statusFilter: '0',
  });

  // ── Pagination ──
  const [page, setPage]       = useState(1);
  const [pageSize]            = useState(20);

  // ── Table state ──
  const [selectedUser, setSelectedUser]   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  // ── Button cooldowns ──
  const [searchBtnDisabled, setSearchBtnDisabled] = useState(false);
  const [clearBtnDisabled,  setClearBtnDisabled]  = useState(false);
  const [deleteBtnCooldown, setDeleteBtnCooldown] = useState(false);

  // ── Add Form ──
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    userName: '', email: '', mobile: '', password: '', profileName: '',
  });
  const [selectedClinic,   setSelectedClinic]   = useState(null);
  const [selectedBranch,   setSelectedBranch]   = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [branchList,       setBranchList]       = useState([]);
  const [employeeList,     setEmployeeList]     = useState([]);
  const [branchLoading,    setBranchLoading]    = useState(false);
  const [employeeLoading,  setEmployeeLoading]  = useState(false);
  const [formLoading,        setFormLoading]        = useState(false);
  const [validationMessages, setValidationMessages] = useState({});
  const [submitAttempted,    setSubmitAttempted]    = useState(false);

  // ── Update Modal ──
  const [updateUserData,   setUpdateUserData]   = useState(null);
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);

  // ─────────────────────────────────────────────
  const fetchUsers = async (filters, currentPage) => {
    try {
      setLoading(true);
      setError(null);
      const searchPayload = buildSearchPayload(filters.searchType, filters.searchValue);
      const data = await getUserList(0, {
        Page:     currentPage,
        PageSize: pageSize,
        ...searchPayload,
        Status: buildStatusParam(filters.statusFilter),
      });
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('fetchUsers error:', err);
      showPopup('Failed to fetch users. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(appliedFilters, page); }, []);  // eslint-disable-line

  // ── When clinic changes → load branches ──
  useEffect(() => {
    if (!selectedClinic) {
      setBranchList([]);
      setSelectedBranch(null);
      setEmployeeList([]);
      setSelectedEmployee(null);
      return;
    }
    const load = async () => {
      setBranchLoading(true);
      setSelectedBranch(null);
      setEmployeeList([]);
      setSelectedEmployee(null);
      try {
        const data = await getBranchList(selectedClinic.id, { Status: 1, PageSize: 50 });
        setBranchList(Array.isArray(data) ? data : []);
      } catch {
        setBranchList([]);
      } finally {
        setBranchLoading(false);
      }
    };
    load();
  }, [selectedClinic]);

  // ── When branch changes → load employees ──
  useEffect(() => {
    if (!selectedClinic) return;
    const load = async () => {
      setEmployeeLoading(true);
      setSelectedEmployee(null);
      try {
        const data = await getEmployeeList(selectedClinic.id, {
          BranchID: selectedBranch?.id || 0,
          Status: 1,
          PageSize: 100,
        });
        setEmployeeList(Array.isArray(data) ? data : []);
      } catch {
        setEmployeeList([]);
      } finally {
        setEmployeeLoading(false);
      }
    };
    load();
  }, [selectedClinic, selectedBranch]);

  // ─────────────────────────────────────────────
  const isFormValid = useMemo(() => {
    const requiredFields = ['userName', 'email', 'password', 'profileName'];
    const allFilled = requiredFields.every((f) => formData[f] && String(formData[f]).trim());
    if (!allFilled) return false;
    if (!selectedClinic) return false;
    const hasErrors = Object.values(validationMessages).some((msg) => !!msg);
    if (hasErrors) return false;
    return true;
  }, [formData, validationMessages, selectedClinic]);

  const getStatusClass = (status) => {
    if (status === 'active')   return styles.active;
    if (status === 'inactive') return styles.inactive;
    return styles.inactive;
  };

  const refreshUsers = () => fetchUsers(appliedFilters, page);

  const validateAllFields = () => {
    const toValidate = {
      userName: formData.userName,
      email:    formData.email,
      mobile:   formData.mobile,
      password: formData.password,
      profileName: formData.profileName,
      clinicId: selectedClinic?.id || 0,
    };
    const messages = {};
    let hasErrors = false;
    for (const [field, value] of Object.entries(toValidate)) {
      const msg = getLiveValidationMessage(field, value);
      messages[field] = msg;
      if (msg) hasErrors = true;
    }
    setValidationMessages(messages);
    return !hasErrors;
  };

  // ── Filter handlers ──
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async () => {
    if (searchBtnDisabled) return;
    setSearchBtnDisabled(true);
    const newFilters = { ...filterInputs };
    setAppliedFilters(newFilters);
    setPage(1);
    await fetchUsers(newFilters, 1);
    setTimeout(() => setSearchBtnDisabled(false), 2000);
  };

  const handleClearFilters = async () => {
    if (clearBtnDisabled) return;
    setClearBtnDisabled(true);
    const def = { searchType: 'userName', searchValue: '', statusFilter: '0' };
    setFilterInputs(def);
    setAppliedFilters(def);
    setPage(1);
    await fetchUsers(def, 1);
    setTimeout(() => setClearBtnDisabled(false), 2000);
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSearch(); };

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    setPage(newPage);
    fetchUsers(appliedFilters, newPage);
  };

  // ── Details modal ──
  const openDetails = (user) => setSelectedUser(user);
  const closeModal  = ()     => setSelectedUser(null);

  // ── Add form ──
  const openAddForm = () => {
    setFormData({ userName: '', email: '', mobile: '', password: '', profileName: '' });
    setSelectedClinic(null);
    setSelectedBranch(null);
    setSelectedEmployee(null);
    setBranchList([]);
    setEmployeeList([]);
    setValidationMessages({});
    setSubmitAttempted(false);
    setIsAddFormOpen(true);
  };

  const closeAddForm = () => {
    setIsAddFormOpen(false);
    setFormLoading(false);
    setValidationMessages({});
    setSubmitAttempted(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let filtered = value;
    if (name === 'mobile') filtered = value.replace(/[^0-9]/g, '').slice(0, 10);
    setFormData((prev) => ({ ...prev, [name]: filtered }));
    const msg = getLiveValidationMessage(name, filtered);
    setValidationMessages((prev) => ({ ...prev, [name]: msg }));
  };

  const handleClinicSelect = (clinic) => {
    setSelectedClinic(clinic);
    const msg = getLiveValidationMessage('clinicId', clinic?.id || 0);
    setValidationMessages((prev) => ({ ...prev, clinicId: msg }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      setSubmitAttempted(true);
      validateAllFields();
      showPopup('Please fill all required fields before submitting.', 'warning');
      return;
    }
    const isValid = validateAllFields();
    if (!isValid) {
      showPopup('Please fill all required fields before submitting.', 'warning');
      return;
    }

    setFormLoading(true);
    try {
      await addUser({
        userName:    formData.userName.trim(),
        email:       formData.email.trim(),
        mobile:      formData.mobile.trim(),
        password:    formData.password.trim(),
        profileName: formData.profileName.trim(),
        clinicId:    selectedClinic?.id    || 0,
        branchId:    selectedBranch?.id    || 0,
        employeeId:  selectedEmployee?.id  || 0,
      });
      closeAddForm();
      refreshUsers();
      showPopup('User added successfully!', 'success');
    } catch (err) {
      console.error('Add user failed:', err);
      showPopup(err.message || 'Failed to add user. Please try again.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Update ──
  const handleUpdateClick = (user) => {
    setUpdateUserData(user);
    setSelectedUser(null);
    setIsUpdateFormOpen(true);
  };

  const handleUpdateClose = () => {
    setIsUpdateFormOpen(false);
    setUpdateUserData(null);
  };

  const handleUpdateSuccess = () => {
    setIsUpdateFormOpen(false);
    setUpdateUserData(null);
    refreshUsers();
  };

  const handleUpdateError = (message) => {
    console.error('Update user error (handled by UpdateUser popup):', message);
  };

  // ── Delete ──
  const handleDeleteClick = (user) => {
    if (deleteBtnCooldown) return;
    setDeleteBtnCooldown(true);
    setTimeout(() => setDeleteBtnCooldown(false), 2000);
    setDeleteConfirm(user);
  };
  const handleDeleteCancel  = () => setDeleteConfirm(null);

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    setDeleteConfirm(null);
    setSelectedUser(null);
    try {
      setLoading(true);
      await deleteUser(deleteConfirm.id);
      showPopup('User deleted successfully!', 'success');
      refreshUsers();
    } catch (err) {
      console.error('Delete user failed:', err);
      showPopup(err.message || 'Failed to delete user.', 'error');
    } finally {
      setDeleteLoading(false);
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  if (error && (error?.status >= 400 || error?.code >= 400)) return <ErrorHandler error={error} />;
  if (loading) return <div className={styles.userLoading}><LoadingPage /></div>;
  if (error)   return <div className={styles.userError}>Error: {error.message || error}</div>;

  const hasActiveFilter =
    appliedFilters.searchValue.trim() !== '' || appliedFilters.statusFilter !== '0';

  const startRecord = users.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord   = (page - 1) * pageSize + users.length;

  // ─────────────────────────────────────────────
  return (
    <div className={styles.userListWrapper}>
      <ErrorHandler error={error} />
      <Header title="User Management" />

      <MessagePopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
      />

      <ConfirmPopup
        visible={!!deleteConfirm}
        message={`Delete user "${deleteConfirm?.userName || 'this user'}"?`}
        subMessage="This action cannot be undone. The user account will be permanently removed."
        confirmLabel={deleteLoading ? 'Deleting...' : 'Yes, Delete'}
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* ── Filters ── */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>
          <div className={styles.searchGroup}>
            <select
              name="searchType"
              value={filterInputs.searchType}
              onChange={handleFilterChange}
              className={styles.searchTypeSelect}
            >
              <option value="userName">Username</option>
              <option value="mobile">Mobile</option>
              <option value="email">Email</option>
            </select>
            <input
              type="text"
              name="searchValue"
              placeholder={`Search by ${
                filterInputs.searchType === 'userName' ? 'Username' :
                filterInputs.searchType === 'mobile'   ? 'Mobile'   : 'Email'
              }`}
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyPress={handleKeyPress}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <select
              name="statusFilter"
              value={filterInputs.statusFilter}
              onChange={handleFilterChange}
              className={styles.statusFilterSelect}
            >
              <option value="-1">All Status</option>
              <option value="0">Active</option>
              <option value="1">Deleted</option>
              <option value="2">Suspended</option>
            </select>
          </div>

          <div className={styles.filterActions}>
            <button
              onClick={handleSearch}
              className={styles.searchButton}
              disabled={searchBtnDisabled}
              style={{ opacity: searchBtnDisabled ? 0.6 : 1, cursor: searchBtnDisabled ? 'not-allowed' : 'pointer' }}
            >
              <FiSearch size={18} /> Search
            </button>

            {hasActiveFilter && (
              <button
                onClick={handleClearFilters}
                className={styles.clearButton}
                disabled={clearBtnDisabled}
                style={{ opacity: clearBtnDisabled ? 0.6 : 1, cursor: clearBtnDisabled ? 'not-allowed' : 'pointer' }}
              >
                <FiX size={18} /> Clear
              </button>
            )}

            <button onClick={openAddForm} className={styles.addUserBtn}>
              <FiPlus size={18} /> Add User
            </button>
          </div>
        </div>
      </div>

      {/* ── Table + Pagination ── */}
      <div className={styles.tableSection}>
        <div className={styles.userTableContainer}>
          <table className={styles.userTable}>
            <thead>
              <tr>
                <th>User</th>
                <th>Clinic</th>
                <th>Branch</th>
                <th>Employee</th>
                <th>Profile</th>
                <th>Last Login</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.userNoData}>
                    {hasActiveFilter ? 'No users found.' : 'No users registered yet.'}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className={styles.userNameCell}>
                        <div className={styles.userAvatar}>
                          {user.userName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className={styles.userName}>{user.userName}</div>
                          <div className={styles.userSub}>{user.email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{user.clinicName || '—'}</td>
                    <td>{user.branchName || '—'}</td>
                    <td>{user.employeeName || '—'}</td>
                    <td>{user.profileName || '—'}</td>
                    <td>
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString()
                        : '—'}
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusClass(user.status)}`}>
                        {user.status?.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => openDetails(user)}
                        className={styles.userDetailsBtn}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className={styles.paginationBar}>
          <div className={styles.paginationInfo}>
            {users.length > 0 ? `Showing ${startRecord}–${endRecord} records` : 'No records'}
          </div>
          <div className={styles.paginationControls}>
            <span className={styles.paginationLabel}>Page</span>
            <button className={styles.pageBtn} onClick={() => handlePageChange(1)} disabled={page === 1} title="First page">«</button>
            <button className={styles.pageBtn} onClick={() => handlePageChange(page - 1)} disabled={page === 1} title="Previous page">‹</button>
            <span className={styles.pageIndicator}>{page}</span>
            <button className={styles.pageBtn} onClick={() => handlePageChange(page + 1)} disabled={users.length < pageSize} title="Next page">›</button>
          </div>
          <div className={styles.pageSizeInfo}>Page Size: <strong>{pageSize}</strong></div>
        </div>
      </div>

      {/* ──────────────── Details Modal ──────────────── */}
      {selectedUser && (
        <div className={styles.detailModalOverlay} onClick={closeModal}>
          <div className={styles.detailModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailModalHeader}>
              <div className={styles.detailHeaderContent}>
                <h2>{selectedUser.userName}</h2>
                <div className={styles.detailHeaderMeta}>
                  <span className={styles.workIdBadge}>{selectedUser.profileName || 'User'}</span>
                  <span className={`${styles.workIdBadge} ${selectedUser.status === 'active' ? styles.activeBadge : styles.inactiveBadge}`}>
                    {selectedUser.status?.toUpperCase()}
                  </span>
                </div>
              </div>
              <button onClick={closeModal} className={styles.detailCloseBtn}>✕</button>
            </div>

            <div className={styles.detailModalBody}>
              <div className={styles.infoSection}>

                <div className={styles.infoCard}>
                  <div className={styles.infoHeader}><h3>Account Information</h3></div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Username</span>
                      <span className={styles.infoValue}>{selectedUser.userName || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Email</span>
                      <span className={styles.infoValue}>{selectedUser.email || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Mobile</span>
                      <span className={styles.infoValue}>{selectedUser.mobile || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Profile / Role</span>
                      <span className={styles.infoValue}>{selectedUser.profileName || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Last Login</span>
                      <span className={styles.infoValue}>
                        {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.infoCard}>
                  <div className={styles.infoHeader}><h3>Association Details</h3></div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Clinic</span>
                      <span className={styles.infoValue}>{selectedUser.clinicName || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Branch</span>
                      <span className={styles.infoValue}>{selectedUser.branchName || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Employee</span>
                      <span className={styles.infoValue}>{selectedUser.employeeName || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Employee Code</span>
                      <span className={styles.infoValue}>{selectedUser.employeeCode || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Date Created</span>
                      <span className={styles.infoValue}>
                        {selectedUser.dateCreated ? new Date(selectedUser.dateCreated).toLocaleDateString() : '—'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              <div className={styles.detailModalFooter}>
                <button
                  onClick={() => handleDeleteClick(selectedUser)}
                  disabled={deleteBtnCooldown || deleteLoading}
                  className={styles.btnCancel}
                >
                  Delete User
                </button>
                <button
                  onClick={() => handleUpdateClick(selectedUser)}
                  className={styles.btnUpdate}
                >
                  Update User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── Add Form Modal ──────────────── */}
      {isAddFormOpen && (
        <div className={styles.detailModalOverlay}>
          <div className={styles.addModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailModalHeader}>
              <div className={styles.detailHeaderContent}>
                <h2>Add New User</h2>
              </div>
              <button onClick={closeAddForm} className={styles.detailCloseBtn}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.addModalBody}>

              {/* ── Clinic & Branch & Employee ── */}
              <div className={styles.addSection}>
                <div className={styles.addSectionHeader}><h3>Clinic Association</h3></div>
                <div className={styles.addFormGrid}>

                  <div className={styles.addFormGroup}>
                    <label>Clinic <span className={styles.required}>*</span></label>
                    <ClinicDropdownField
                      selectedClinic={selectedClinic}
                      onSelect={handleClinicSelect}
                      error={validationMessages.clinicId}
                    />
                  </div>

                  <div className={styles.addFormGroup}>
                    <label>Branch</label>
                    <select
                      className={styles.addSelect}
                      value={selectedBranch?.id || ''}
                      onChange={(e) => {
                        const found = branchList.find((b) => String(b.id) === e.target.value);
                        setSelectedBranch(found || null);
                      }}
                      disabled={!selectedClinic || branchLoading}
                    >
                      <option value="">
                        {branchLoading ? 'Loading branches…' : !selectedClinic ? 'Select a clinic first' : 'Select Branch (optional)'}
                      </option>
                      {branchList.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.addFormGroup}>
                    <label>Employee</label>
                    <select
                      className={styles.addSelect}
                      value={selectedEmployee?.id || ''}
                      onChange={(e) => {
                        const found = employeeList.find((emp) => String(emp.id) === e.target.value);
                        setSelectedEmployee(found || null);
                      }}
                      disabled={!selectedClinic || employeeLoading}
                    >
                      <option value="">
                        {employeeLoading ? 'Loading employees…' : !selectedClinic ? 'Select a clinic first' : 'Select Employee (optional)'}
                      </option>
                      {employeeList.map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>

                </div>
              </div>

              {/* ── Account Details ── */}
              <div className={styles.addSection}>
                <div className={styles.addSectionHeader}><h3>Account Details</h3></div>
                <div className={styles.addFormGrid}>

                  <div className={styles.addFormGroup}>
                    <label>Username <span className={styles.required}>*</span></label>
                    <input
                      name="userName"
                      value={formData.userName}
                      onChange={handleInputChange}
                      placeholder="Enter username"
                      autoComplete="off"
                    />
                    {validationMessages.userName && (
                      <span className={styles.validationMsg}>{validationMessages.userName}</span>
                    )}
                  </div>

                  <div className={styles.addFormGroup}>
                    <label>Email <span className={styles.required}>*</span></label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="user@example.com"
                      autoComplete="off"
                    />
                    {validationMessages.email && (
                      <span className={styles.validationMsg}>{validationMessages.email}</span>
                    )}
                  </div>

                  <div className={styles.addFormGroup}>
                    <label>Mobile</label>
                    <input
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      placeholder="10-digit mobile"
                      maxLength={10}
                    />
                    {validationMessages.mobile && (
                      <span className={styles.validationMsg}>{validationMessages.mobile}</span>
                    )}
                  </div>

                  <div className={styles.addFormGroup}>
                    <label>Password <span className={styles.required}>*</span></label>
                    <input
                      type="text"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter password"
                      autoComplete="new-password"
                    />
                    {validationMessages.password && (
                      <span className={styles.validationMsg}>{validationMessages.password}</span>
                    )}
                  </div>

                  <div className={styles.addFormGroup}>
                    <label>Profile / Role <span className={styles.required}>*</span></label>
                    <input
                      name="profileName"
                      value={formData.profileName}
                      onChange={handleInputChange}
                      placeholder="e.g. Admin, Doctor, Receptionist"
                    />
                    {validationMessages.profileName && (
                      <span className={styles.validationMsg}>{validationMessages.profileName}</span>
                    )}
                  </div>

                </div>
              </div>

              <div className={styles.detailModalFooter}>
                <button type="button" onClick={closeAddForm} className={styles.btnCancel}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className={`${styles.btnSubmit} ${!isFormValid ? styles.btnSubmitDisabled : ''}`}
                  title={!isFormValid ? 'Please fill all required fields' : ''}
                >
                  {formLoading ? 'Adding…' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────── Update User Modal ──────────────── */}
      {isUpdateFormOpen && updateUserData && (
        <UpdateUser
          user={updateUserData}
          onClose={handleUpdateClose}
          onSuccess={handleUpdateSuccess}
          onError={handleUpdateError}
        />
      )}
    </div>
  );
};

export default UserList;