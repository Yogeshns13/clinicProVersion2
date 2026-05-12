// src/components/UserList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { FiSearch, FiPlus, FiX, FiLock, FiUnlock } from 'react-icons/fi';
import {
  getUserList, addUser, getClinicList, getBranchList,
  getEmployeeList, updatePassword, updateUser,
} from '../Api/Api.js';
import ErrorHandler   from '../Hooks/ErrorHandler.jsx';
import Header         from '../Header/Header.jsx';
import UpdateUser     from './UpdateUser.jsx';
import MessagePopup   from '../Hooks/MessagePopup.jsx';
import ConfirmPopup   from '../Hooks/ConfirmPopup.jsx';
import LoadingPage    from '../Hooks/LoadingPage.jsx';
import styles         from './UserList.module.css';
import { getStoredClinicId } from '../Utils/Cryptoutils.js';

// ── Shared reusable password modal ──
import UpdatePassword from '../UpdatePassword/UpdatePassword';

import { FaLock, FaLockOpen, FaUnlockAlt } from 'react-icons/fa';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const PROFILE_OPTIONS = [
  'admin','spradmin','frontdesk','nurse','pharmacy','labtech','accounts','doctor',
];

const getLocalProfileName = () => {
  try { return localStorage.getItem('profileName') || ''; } catch { return ''; }
};
const isSprAdmin = () => getLocalProfileName().toLowerCase() === 'spradmin';

// ─────────────────────────────────────────────────────────────────────────────
// Status helpers
// ─────────────────────────────────────────────────────────────────────────────
const getStatusLabel = (status) => {
  if (status === 0 || status === '0') return 'Active';
  if (status === 1 || status === '1') return 'Deleted';
  if (status === 2 || status === '2') return 'Suspended';
  if (typeof status === 'string') {
    const lower = status.toLowerCase();
    if (lower === 'active')    return 'Active';
    if (lower === 'deleted')   return 'Deleted';
    if (lower === 'suspended') return 'Suspended';
    if (lower === 'inactive')  return 'Deleted';
  }
  return String(status ?? '—').toUpperCase();
};

const getStatusClass = (status) => {
  const label = getStatusLabel(status).toLowerCase();
  if (label === 'active') return styles.active;
  return styles.inactive;
};

const isUserDeleted = (status) => getStatusLabel(status).toLowerCase() === 'deleted';

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
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Please enter a valid email address';
      if (value.trim().length > 100) return 'Email must not exceed 100 characters';
      return '';
    case 'mobile':
      if (!value || !value.trim()) return '';
      if (value.trim().length !== 10) return 'Mobile number must be 10 digits';
      if (!/^\d{10}$/.test(value.trim())) return 'Mobile number must contain only digits';
      return '';
    case 'password':
      if (!value || !value.trim()) return 'Password is required';
      if (value.trim().length < 6)  return 'Password must be at least 6 characters';
      if (value.trim().length > 50) return 'Password must not exceed 50 characters';
      return '';
    case 'profileName':
      if (!value || !value.trim()) return 'Profile/Role is required';
      return '';
    case 'clinicId':
      if (!value || value === 0 || value === '0') return 'Please select a clinic';
      return '';
    case 'branchId':
      if (!value || value === 0 || value === '0') return 'Please select a branch';
      return '';
    case 'employeeId':
      if (!value || value === 0 || value === '0') return 'Please select an employee';
      return '';
    default: return '';
  }
};

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
// Clinic Dropdown (only for spradmin)
// ─────────────────────────────────────────────────────────────────────────────
const ClinicDropdownField = ({ selectedClinic, onSelect, error }) => {
  const [clinicList, setClinicList] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [fetched, setFetched]       = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getClinicList({ Page: 1, PageSize: 200, Status: 1 });
        setClinicList(Array.isArray(data) ? data : []);
      } catch { setClinicList([]); }
      finally { setLoading(false); setFetched(true); }
    };
    load();
  }, []);

  return (
    <div>
      <select
        className={styles.addSelect}
        value={selectedClinic?.id || ''}
        onChange={(e) => {
          const id = e.target.value;
          if (!id) { onSelect(null); return; }
          const found = clinicList.find((c) => String(c.id) === id);
          onSelect(found || null);
        }}
        disabled={loading}
      >
        <option value="">
          {loading ? 'Loading clinics…' : fetched && clinicList.length === 0 ? 'No clinics available' : 'Select Clinic'}
        </option>
        {clinicList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      {error && <span className={styles.validationMsg}>{error}</span>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// UserList
// ─────────────────────────────────────────────────────────────────────────────
const UserList = () => {
  const [users, setUsers] = useState([]);

  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopup  = (message, type = 'success') => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [lockConfirm, setLockConfirm] = useState(null);
  const [lockLoading, setLockLoading] = useState(false);

  const [filterInputs, setFilterInputs] = useState({
    searchType: 'userName', searchValue: '', statusFilter: '0',
  });
  const [appliedFilters, setAppliedFilters] = useState({
    searchType: 'userName', searchValue: '', statusFilter: '0',
  });

  const [page, setPage]   = useState(1);
  const [pageSize]        = useState(20);
  const [selectedUser, setSelectedUser]   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  const [searchBtnDisabled, setSearchBtnDisabled] = useState(false);
  const [clearBtnDisabled,  setClearBtnDisabled]  = useState(false);
  const [deleteBtnCooldown, setDeleteBtnCooldown] = useState(false);

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

  const [updateUserData,   setUpdateUserData]   = useState(null);
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);

  // ── Update Password Modal state ──
  const [passwordUser,        setPasswordUser]        = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const sprAdmin = isSprAdmin();

  // ── Fetch users ──
  const fetchUsers = async (filters, currentPage) => {
    try {
      setLoading(true);
      setError(null);
      const searchPayload = buildSearchPayload(filters.searchType, filters.searchValue);
      const clinicId = sprAdmin ? 0 : await getStoredClinicId();
      const data = await getUserList(clinicId, {
        Page: currentPage, PageSize: pageSize, BranchID: 0,
        ...searchPayload,
        Status: buildStatusParam(filters.statusFilter),
      });
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('fetchUsers error:', err);
      showPopup('Failed to fetch users. Please try again.', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(appliedFilters, page); }, []); // eslint-disable-line

  // ── Clinic → branches ──
  useEffect(() => {
    if (sprAdmin) {
      if (!selectedClinic) { setBranchList([]); setSelectedBranch(null); setEmployeeList([]); setSelectedEmployee(null); return; }
      const load = async () => {
        setBranchLoading(true);
        setSelectedBranch(null); setEmployeeList([]); setSelectedEmployee(null);
        try { const data = await getBranchList(selectedClinic.id, { Status: 1, PageSize: 50 }); setBranchList(Array.isArray(data) ? data : []); }
        catch { setBranchList([]); }
        finally { setBranchLoading(false); }
      };
      load();
    } else {
      if (!isAddFormOpen) return;
      const load = async () => {
        setBranchLoading(true);
        setSelectedBranch(null); setEmployeeList([]); setSelectedEmployee(null);
        try { const clinicId = await getStoredClinicId(); const data = await getBranchList(clinicId, { Status: 1, PageSize: 50 }); setBranchList(Array.isArray(data) ? data : []); }
        catch { setBranchList([]); }
        finally { setBranchLoading(false); }
      };
      load();
    }
  }, [selectedClinic, isAddFormOpen]); // eslint-disable-line

  // ── Branch → employees ──
  useEffect(() => {
    if (!selectedBranch) { setEmployeeList([]); setSelectedEmployee(null); return; }
    const load = async () => {
      setEmployeeLoading(true); setSelectedEmployee(null);
      try {
        const clinicId = sprAdmin ? selectedClinic?.id : await getStoredClinicId();
        const data = await getEmployeeList(clinicId, { BranchID: selectedBranch.id, Status: 1, PageSize: 100 });
        setEmployeeList(Array.isArray(data) ? data : []);
      } catch { setEmployeeList([]); }
      finally { setEmployeeLoading(false); }
    };
    if (sprAdmin ? selectedClinic : isAddFormOpen) load();
  }, [selectedClinic, selectedBranch, isAddFormOpen]); // eslint-disable-line

  const isFormValid = useMemo(() => {
    const requiredFields = ['userName', 'email', 'password', 'profileName'];
    if (!requiredFields.every((f) => formData[f] && String(formData[f]).trim())) return false;
    if (sprAdmin && !selectedClinic) return false;
    if (!selectedBranch || !selectedEmployee) return false;
    return !Object.values(validationMessages).some(Boolean);
  }, [formData, validationMessages, selectedClinic, selectedBranch, selectedEmployee, sprAdmin]);

  const refreshUsers = () => fetchUsers(appliedFilters, page);

  const validateAllFields = () => {
    const toValidate = {
      userName: formData.userName, email: formData.email, mobile: formData.mobile,
      password: formData.password, profileName: formData.profileName,
      ...(sprAdmin ? { clinicId: selectedClinic?.id || 0 } : {}),
      branchId: selectedBranch?.id || 0, employeeId: selectedEmployee?.id || 0,
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
    setFilterInputs(def); setAppliedFilters(def); setPage(1);
    await fetchUsers(def, 1);
    setTimeout(() => setClearBtnDisabled(false), 2000);
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSearch(); };

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    setPage(newPage);
    fetchUsers(appliedFilters, newPage);
  };

  const openDetails = (user) => setSelectedUser(user);
  const closeModal  = ()     => setSelectedUser(null);

  const openAddForm = () => {
    setFormData({ userName: '', email: '', mobile: '', password: '', profileName: '' });
    setSelectedClinic(null); setSelectedBranch(null); setSelectedEmployee(null);
    setBranchList([]); setEmployeeList([]);
    setValidationMessages({}); setSubmitAttempted(false);
    setIsAddFormOpen(true);
  };

  const closeAddForm = () => {
    setIsAddFormOpen(false); setFormLoading(false);
    setValidationMessages({}); setSubmitAttempted(false);
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
    if (!isFormValid) { setSubmitAttempted(true); validateAllFields(); showPopup('Please fill all required fields before submitting.', 'warning'); return; }
    const isValid = validateAllFields();
    if (!isValid) { showPopup('Please fill all required fields before submitting.', 'warning'); return; }
    setFormLoading(true);
    try {
      const clinicId = sprAdmin ? (selectedClinic?.id || 0) : await getStoredClinicId();
      await addUser({
        userName: formData.userName.trim(), email: formData.email.trim(),
        mobile: formData.mobile.trim(), password: formData.password.trim(),
        profileName: formData.profileName.trim(),
        clinicId, branchId: selectedBranch?.id || 0, employeeId: selectedEmployee?.id || 0,
      });
      closeAddForm(); refreshUsers();
      showPopup('User added successfully!', 'success');
    } catch (err) {
      console.error('Add user failed:', err);
      showPopup(err.message || 'Failed to add user. Please try again.', 'error');
    } finally { setFormLoading(false); }
  };

  // ── Update ──
  const handleUpdateClick  = (user) => { setUpdateUserData(user); setSelectedUser(null); setIsUpdateFormOpen(true); };
  const handleUpdateClose  = ()     => { setIsUpdateFormOpen(false); setUpdateUserData(null); };
  const handleUpdateSuccess = ()    => { setIsUpdateFormOpen(false); setUpdateUserData(null); refreshUsers(); };
  const handleUpdateError   = (msg) => console.error('Update user error:', msg);

  // ── Update Password (now via shared component) ──
  const handlePasswordClick = (user) => { setSelectedUser(null); setPasswordUser(user); setIsPasswordModalOpen(true); };
  const handlePasswordClose = ()     => { setIsPasswordModalOpen(false); setPasswordUser(null); };
  const handlePasswordSuccess = ()   => { setIsPasswordModalOpen(false); setPasswordUser(null); showPopup('Password updated successfully!', 'success'); };

  // ── Delete ──
  const handleDeleteClick   = (user) => { if (deleteBtnCooldown) return; setDeleteBtnCooldown(true); setTimeout(() => setDeleteBtnCooldown(false), 2000); setDeleteConfirm(user); };
  const handleDeleteCancel  = ()     => setDeleteConfirm(null);
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true); setDeleteConfirm(null); setSelectedUser(null);
    try {
      setLoading(true);
      await deleteUser(deleteConfirm.id);
      showPopup('User deleted successfully!', 'success');
      refreshUsers();
    } catch (err) {
      console.error('Delete user failed:', err);
      showPopup(err.message || 'Failed to delete user.', 'error');
    } finally { setDeleteLoading(false); setLoading(false); }
  };

  // ── Lock / Unlock ──
  const handleLockIconClick = (user, e) => {
    e.stopPropagation();
    const isLocked = user.isLocked === 1 || user.isLocked === '1';
    setLockConfirm({ user, action: isLocked ? 'unlock' : 'lock' });
  };
  const handleLockCancel  = () => setLockConfirm(null);
  const handleLockConfirm = async () => {
    if (!lockConfirm) return;
    const { user, action } = lockConfirm;
    setLockConfirm(null); setLockLoading(true);
    try {
      await updateUser({
        userId: Number(user.userId || user.id), clinicId: user.clinicId || 0,
        email: user.email || '', mobile: user.mobile || '', profileName: user.profileName || '',
        status: Number(user.status ?? 0),
        isLocked: action === 'lock' ? 1 : 0,
        failedLoginAttempts: action === 'lock' ? (user.failedLoginAttempts ?? 0) : 0,
      });
      showPopup(action === 'lock' ? 'User account locked successfully!' : 'User account unlocked successfully!', 'success');
      refreshUsers();
    } catch (err) {
      console.error('Lock/Unlock failed:', err);
      showPopup(err.message || 'Failed to update lock status. Please try again.', 'error');
    } finally { setLockLoading(false); }
  };

  if (error && (error?.status >= 400 || error?.code >= 400)) return <ErrorHandler error={error} />;
  if (loading) return <div className={styles.userLoading}><LoadingPage /></div>;
  if (error)   return <div className={styles.userError}>Error: {error.message || error}</div>;

  const hasActiveFilter = appliedFilters.searchValue.trim() !== '' || appliedFilters.statusFilter !== '0';
  const startRecord = users.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord   = (page - 1) * pageSize + users.length;

  return (
    <div className={styles.userListWrapper}>
      <ErrorHandler error={error} />
      <Header title="User Management" />

      <MessagePopup visible={popup.visible} message={popup.message} type={popup.type} onClose={closePopup} />

      <ConfirmPopup
        visible={!!deleteConfirm}
        message={`Delete user "${deleteConfirm?.userName || 'this user'}"?`}
        subMessage="This action cannot be undone."
        confirmLabel={deleteLoading ? 'Deleting...' : 'Yes, Delete'}
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <ConfirmPopup
        visible={!!lockConfirm}
        message={lockConfirm?.action === 'unlock' ? `Unlock account for "${lockConfirm?.user?.userName}"?` : `Lock account for "${lockConfirm?.user?.userName}"?`}
        subMessage={lockConfirm?.action === 'unlock' ? 'This will unlock the account and reset failed login attempts to 0.' : 'This will lock the user account immediately.'}
        confirmLabel={lockConfirm?.action === 'unlock' ? 'Yes, Unlock' : 'Yes, Lock'}
        cancelLabel="No, Cancel"
        onConfirm={handleLockConfirm}
        onCancel={handleLockCancel}
      />

      {/* ── Filters ── */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>
          <div className={styles.searchGroup}>
            <select name="searchType" value={filterInputs.searchType} onChange={handleFilterChange} className={styles.searchTypeSelect}>
              <option value="userName">Username</option>
              <option value="mobile">Mobile</option>
              <option value="email">Email</option>
            </select>
            <input
              type="text" name="searchValue"
              placeholder={`Search by ${filterInputs.searchType === 'userName' ? 'Username' : filterInputs.searchType === 'mobile' ? 'Mobile' : 'Email'}`}
              value={filterInputs.searchValue}
              onChange={handleFilterChange} onKeyPress={handleKeyPress}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <select name="statusFilter" value={filterInputs.statusFilter} onChange={handleFilterChange} className={styles.statusFilterSelect}>
              <option value="-1">All Status</option>
              <option value="0">Active</option>
              <option value="1">Deleted</option>
              <option value="2">Suspended</option>
            </select>
          </div>
          <div className={styles.filterActions}>
            <button onClick={handleSearch} className={styles.searchButton} disabled={searchBtnDisabled} style={{ opacity: searchBtnDisabled ? 0.6 : 1, cursor: searchBtnDisabled ? 'not-allowed' : 'pointer' }}>
              <FiSearch size={18} /> Search
            </button>
            {hasActiveFilter && (
              <button onClick={handleClearFilters} className={styles.clearButton} disabled={clearBtnDisabled} style={{ opacity: clearBtnDisabled ? 0.6 : 1, cursor: clearBtnDisabled ? 'not-allowed' : 'pointer' }}>
                <FiX size={18} /> Clear
              </button>
            )}
            <button onClick={openAddForm} className={styles.addUserBtn}>
              <FiPlus size={18} /> Add User
            </button>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className={styles.tableSection}>
        <div className={styles.userTableContainer}>
          <table className={styles.userTable}>
            <thead>
              <tr>
                <th>User</th><th>Clinic</th><th>Branch</th><th>Employee</th>
                <th>Profile</th><th>Last Login</th><th>Status</th><th>Lock</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={9} className={styles.userNoData}>{hasActiveFilter ? 'No users found.' : 'No users registered yet.'}</td></tr>
              ) : (
                users.map((user) => {
                  const isLocked = user.isLocked === 1 || user.isLocked === '1';
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className={styles.userNameCell}>
                          <div className={styles.userAvatar}>{user.userName?.charAt(0).toUpperCase() || 'U'}</div>
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
                      <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '—'}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${getStatusClass(user.status)}`}>
                          {getStatusLabel(user.status).toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <button
                          className={styles.lockIconBtn}
                          onClick={(e) => handleLockIconClick(user, e)}
                          disabled={lockLoading}
                          title={isLocked ? 'Click to Unlock account' : 'Click to Lock account'}
                        >
                          {isLocked
                            ? <FaLock size={17} color="#ef4444" className={styles.lockIconRed}   />
                            : <FaLockOpen size={20} color="#22c55e" className={styles.lockIconGreen} />}
                        </button>
                      </td>
                      <td>
                        <button onClick={() => openDetails(user)} className={styles.userDetailsBtn}>
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className={styles.paginationBar}>
          <div className={styles.paginationInfo}>{users.length > 0 ? `Showing ${startRecord}–${endRecord} records` : 'No records'}</div>
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

      {/* ── Details Modal ── */}
      {selectedUser && (
        <div className={styles.detailModalOverlay} onClick={closeModal}>
          <div className={styles.detailModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailModalHeader}>
              <div className={styles.detailHeaderContent}>
                <h2>{selectedUser.userName}</h2>
                <div className={styles.detailHeaderMeta}>
                  <span className={styles.workIdBadge}>{selectedUser.profileName || 'User'}</span>
                  <span className={`${styles.workIdBadge} ${getStatusClass(selectedUser.status) === styles.active ? styles.activeBadge : styles.inactiveBadge}`}>
                    {getStatusLabel(selectedUser.status).toUpperCase()}
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
                    {[
                      ['Username', selectedUser.userName],
                      ['Email', selectedUser.email],
                      ['Mobile', selectedUser.mobile],
                      ['Profile / Role', selectedUser.profileName],
                      ['Last Login', selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : null],
                      ['Failed Login Attempts', selectedUser.failedLoginAttempts],
                    ].map(([label, val]) => (
                      <div className={styles.infoRow} key={label}>
                        <span className={styles.infoLabel}>{label}</span>
                        <span className={styles.infoValue}>{val ?? '—'}</span>
                      </div>
                    ))}
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Account Locked</span>
                      <span className={`${styles.infoValue} ${selectedUser.isLocked === 1 || selectedUser.isLocked === '1' ? styles.lockedYes : styles.lockedNo}`}>
                        {selectedUser.isLocked === 1 || selectedUser.isLocked === '1' ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={styles.infoCard}>
                  <div className={styles.infoHeader}><h3>Association Details</h3></div>
                  <div className={styles.infoContent}>
                    {[
                      ['Clinic', selectedUser.clinicName],
                      ['Branch', selectedUser.branchName],
                      ['Employee', selectedUser.employeeName],
                      ['Employee Code', selectedUser.employeeCode],
                      ['Date Created', selectedUser.dateCreated ? new Date(selectedUser.dateCreated).toLocaleDateString() : null],
                    ].map(([label, val]) => (
                      <div className={styles.infoRow} key={label}>
                        <span className={styles.infoLabel}>{label}</span>
                        <span className={styles.infoValue}>{val ?? '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className={styles.detailModalFooter}>
                <button onClick={() => handleDeleteClick(selectedUser)} disabled={deleteBtnCooldown || deleteLoading} className={styles.btnCancel}>Delete User</button>
                <button onClick={() => handlePasswordClick(selectedUser)} className={styles.btnPassword}>
                  <FiLock size={15} style={{ marginRight: 5 }} /> Update Password
                </button>
                {!isUserDeleted(selectedUser.status) && (
                  <button onClick={() => handleUpdateClick(selectedUser)} className={styles.btnUpdate}>Update User</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Form Modal ── */}
      {isAddFormOpen && (
        <div className={styles.detailModalOverlay}>
          <div className={styles.addModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailModalHeader}>
              <div className={styles.detailHeaderContent}><h2>Add New User</h2></div>
              <button onClick={closeAddForm} className={styles.detailCloseBtn}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.addModalBody}>
              <div className={styles.addSection}>
                <div className={styles.addSectionHeader}><h3>Clinic Association</h3></div>
                <div className={styles.addFormGrid}>
                  {sprAdmin && (
                    <div className={styles.addFormGroup}>
                      <label>Clinic <span className={styles.required}>*</span></label>
                      <ClinicDropdownField selectedClinic={selectedClinic} onSelect={handleClinicSelect} error={validationMessages.clinicId} />
                    </div>
                  )}
                  <div className={styles.addFormGroup}>
                    <label>Branch <span className={styles.required}>*</span></label>
                    <select
                      className={styles.addSelect}
                      value={selectedBranch?.id || ''}
                      onChange={(e) => {
                        const found = branchList.find((b) => String(b.id) === e.target.value);
                        setSelectedBranch(found || null);
                        setValidationMessages((prev) => ({ ...prev, branchId: found ? '' : 'Please select a branch' }));
                      }}
                      disabled={sprAdmin ? (!selectedClinic || branchLoading) : branchLoading}
                    >
                      <option value="">{branchLoading ? 'Loading branches…' : sprAdmin && !selectedClinic ? 'Select a clinic first' : 'Select Branch'}</option>
                      {branchList.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    {validationMessages.branchId && <span className={styles.validationMsg}>{validationMessages.branchId}</span>}
                  </div>
                  <div className={styles.addFormGroup}>
                    <label>Employee <span className={styles.required}>*</span></label>
                    <select
                      className={styles.addSelect}
                      value={selectedEmployee?.id || ''}
                      onChange={(e) => {
                        const found = employeeList.find((emp) => String(emp.id) === e.target.value);
                        setSelectedEmployee(found || null);
                        setValidationMessages((prev) => ({ ...prev, employeeId: found ? '' : 'Please select an employee' }));
                      }}
                      disabled={sprAdmin ? (!selectedClinic || !selectedBranch || employeeLoading) : (!selectedBranch || employeeLoading)}
                    >
                      <option value="">{employeeLoading ? 'Loading employees…' : sprAdmin && !selectedClinic ? 'Select a clinic first' : !selectedBranch ? 'Select a branch first' : 'Select Employee'}</option>
                      {employeeList.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                    </select>
                    {validationMessages.employeeId && <span className={styles.validationMsg}>{validationMessages.employeeId}</span>}
                  </div>
                </div>
              </div>
              <div className={styles.addSection}>
                <div className={styles.addSectionHeader}><h3>Account Details</h3></div>
                <div className={styles.addFormGrid}>
                  {[
                    { name: 'userName', label: 'Username', placeholder: 'Enter username', required: true },
                    { name: 'email',    label: 'Email',    placeholder: 'user@example.com', type: 'email', required: true },
                    { name: 'mobile',   label: 'Mobile',   placeholder: '10-digit mobile', maxLength: 10 },
                    { name: 'password', label: 'Password', placeholder: 'Enter password', type: 'text', required: true },
                  ].map(({ name, label, placeholder, type = 'text', required, maxLength }) => (
                    <div className={styles.addFormGroup} key={name}>
                      <label>{label} {required && <span className={styles.required}>*</span>}</label>
                      <input type={type} name={name} value={formData[name]} onChange={handleInputChange} placeholder={placeholder} autoComplete="off" maxLength={maxLength} />
                      {validationMessages[name] && <span className={styles.validationMsg}>{validationMessages[name]}</span>}
                    </div>
                  ))}
                  <div className={styles.addFormGroup}>
                    <label>Profile / Role <span className={styles.required}>*</span></label>
                    <select name="profileName" value={formData.profileName} onChange={handleInputChange} className={styles.addSelect}>
                      <option value="">Select Profile / Role</option>
                      {PROFILE_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {validationMessages.profileName && <span className={styles.validationMsg}>{validationMessages.profileName}</span>}
                  </div>
                </div>
              </div>
              <div className={styles.detailModalFooter}>
                <button type="button" onClick={closeAddForm} className={styles.btnCancel}>Cancel</button>
                <button type="submit" disabled={formLoading} className={`${styles.btnSubmit} ${!isFormValid ? styles.btnSubmitDisabled : ''}`}>
                  {formLoading ? 'Adding…' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Update User Modal ── */}
      {isUpdateFormOpen && updateUserData && (
        <UpdateUser user={updateUserData} onClose={handleUpdateClose} onSuccess={handleUpdateSuccess} onError={handleUpdateError} />
      )}

      {/* ── Update Password Modal (shared component) ── */}
      {isPasswordModalOpen && passwordUser && (
        <UpdatePassword
          mode="admin"
          user={passwordUser}
          updatePasswordApi={updatePassword}
          getStoredUserId={async () => passwordUser.userId || passwordUser.id}
          getStoredClinicId={async () => passwordUser.clinicId || 0}
          onClose={handlePasswordClose}
          onSuccess={handlePasswordSuccess}
        />
      )}
    </div>
  );
};

export default UserList;