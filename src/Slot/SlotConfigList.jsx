// src/components/SlotConfigList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiTrash2, FiCalendar } from 'react-icons/fi';
import { getSlotConfigList, getDepartmentList, getEmployeeList, getShiftList, deleteSlotConfig } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import AddSlotConfig from './AddSlotConfig.jsx';
import GenerateSlots from './GenerateSlots.jsx';
import './SlotConfigList.css';

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────
const DURATION_OPTIONS = [
  { id: 1, label: 'Daily' },
  { id: 2, label: 'Weekend' },
  { id: 3, label: 'Specific Day' },
];

// ────────────────────────────────────────────────
const SlotConfigList = () => {
  const navigate = useNavigate();

  // Data & Filter
  const [configs, setConfigs] = useState([]);
  const [allConfigs, setAllConfigs] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [doctorShifts, setDoctorShifts] = useState([]); // Shifts mapped to doctors
  const [selectedDoctorId, setSelectedDoctorId] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Form Modal
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  
  // Generate Slots Modal
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);

  // Delete Confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // ────────────────────────────────────────────────
  // Data fetching
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const clinicId = localStorage.getItem('clinicID');
        const data = await getEmployeeList(clinicId, {
          Designation: 1, // Assuming 1 is for doctors
          Status: 1
        });
        setDoctors(data);
      } catch (err) {
        console.error('Failed to load doctors:', err);
      }
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const clinicId = localStorage.getItem('clinicID');
        const data = await getShiftList(clinicId, { Status: 1 });
        setShifts(data);
      } catch (err) {
        console.error('Failed to load shifts:', err);
      }
    };
    fetchShifts();
  }, []);

  // Fetch doctor-shift mappings
  useEffect(() => {
    const fetchDoctorShifts = async () => {
      try {
        const clinicId = localStorage.getItem('clinicID');
        const { getEmployeeShiftList } = await import('../api/api.js');
        const data = await getEmployeeShiftList(clinicId);
        console.log('Doctor Shifts Data:', data); // Debug log
        setDoctorShifts(data);
      } catch (err) {
        console.error('Failed to load doctor shifts:', err);
      }
    };
    fetchDoctorShifts();
  }, []);

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

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const doctorId = selectedDoctorId === 'all' ? 0 : Number(selectedDoctorId) || 0;

      const data = await getSlotConfigList(clinicId, {
        DoctorID: doctorId,
        BranchID: branchId,
      });

      setConfigs(data);
      setAllConfigs(data);
    } catch (err) {
      console.error('fetchConfigs error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load slot configurations' }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, [selectedDoctorId]);

  // ────────────────────────────────────────────────
  // Computed values
  const filteredConfigs = useMemo(() => {
    if (!searchTerm.trim()) return allConfigs;
    const term = searchTerm.toLowerCase();
    return allConfigs.filter(
      (config) =>
        config.doctorName?.toLowerCase().includes(term) ||
        config.doctorCode?.toLowerCase().includes(term) ||
        config.shiftName?.toLowerCase().includes(term) ||
        config.durationDesc?.toLowerCase().includes(term)
    );
  }, [allConfigs, searchTerm]);

  // ────────────────────────────────────────────────
  // Helper functions
  const getDurationLabel = (duration) => {
    return DURATION_OPTIONS.find((d) => d.id === duration)?.label || '—';
  };

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

  const openAddForm = () => setIsAddFormOpen(true);
  const closeAddForm = () => setIsAddFormOpen(false);

  const openGenerateSlots = () => setIsGenerateOpen(true);
  const closeGenerateSlots = () => setIsGenerateOpen(false);

  const handleAddSuccess = () => {
    fetchConfigs();
  };

  const handleGenerateSuccess = () => {
    // Optionally refresh or show success message
    console.log('Slots generated successfully');
  };

  const handleDeleteClick = (config) => {
    setDeleteConfirm(config);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    
    try {
      await deleteSlotConfig(deleteConfirm.id);
      setDeleteConfirm(null);
      fetchConfigs();
    } catch (err) {
      console.error('Delete failed:', err);
      setError(err);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  // ────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className="clinic-loading">Loading slot configurations...</div>;

  if (error) return <div className="clinic-error">Error: {error.message || error}</div>;

  // ────────────────────────────────────────────────
  return (
    <div className="clinic-list-wrapper">
      <ErrorHandler error={error} />
      <Header title="Slot Configuration Management" />

      {/* Toolbar */}
      <div className="clinic-toolbar">
        <div className="clinic-select-wrapper">
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="clinic-select"
          >
            <option value="all">All Doctors</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.firstName} {doc.lastName} ({doc.employeeCode})
              </option>
            ))}
          </select>
        </div>

        <div className="clinic-search-container">
          <input
            type="text"
            placeholder="Search by doctor, shift, duration..."
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
          <button onClick={openGenerateSlots} className="clinic-generate-btn">
            <FiCalendar size={22} /> Generate Slots
          </button>
          <button onClick={openAddForm} className="slot-add-btn">
            <FiPlus size={22} /> Add Config
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="clinic-table-container">
        <table className="clinic-table">
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Shift</th>
              <th>Duration</th>
              <th>Slot Interval</th>
              <th>Create Days</th>
              <th>Slot Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredConfigs.length === 0 ? (
              <tr>
                <td colSpan={8} className="clinic-no-data">
                  {searchTerm ? 'No configurations found.' : 'No slot configurations yet.'}
                </td>
              </tr>
            ) : (
              filteredConfigs.map((config) => (
                <tr key={config.id}>
                  <td>
                    <div className="clinic-name-cell">
                      <div className="clinic-avatar">
                        {config.doctorName?.charAt(0).toUpperCase() || 'D'}
                      </div>
                      <div>
                        <div className="clinic-name">{config.doctorFullName}</div>
                        <div className="clinic-type">{config.doctorCode || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="branch-type-badge">
                      {config.shiftName || '—'}
                    </span>
                  </td>
                  <td>{getDurationLabel(config.duration)}</td>
                  <td>{config.slotInterval} mins</td>
                  <td>{config.createSlotDays} days</td>
                  <td>{formatDate(config.slotDate) || '-'}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(config.status)}`}>
                      {config.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleDeleteClick(config)} 
                      className="btn-icon-delete"
                      title="Delete Configuration"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ──────────────── Add SlotConfig Modal ──────────────── */}
      <AddSlotConfig
        isOpen={isAddFormOpen}
        onClose={closeAddForm}
        doctors={doctors}
        shifts={shifts}
        doctorShifts={doctorShifts}
        onSuccess={handleAddSuccess}
      />

      {/* ──────────────── Generate Slots Modal ──────────────── */}
      <GenerateSlots
        isOpen={isGenerateOpen}
        onClose={closeGenerateSlots}
        onSuccess={handleGenerateSuccess}
      />

      {/* ──────────────── Delete Confirmation Modal ──────────────── */}
      {deleteConfirm && (
        <div className="clinic-modal-overlay">
          <div className="clinic-modal delete-modal">
            <div className="clinic-modal-header">
              <h2>Delete Slot Configuration</h2>
              <button onClick={handleDeleteCancel} className="clinic-modal-close">
                ×
              </button>
            </div>
            <div className="clinic-modal-body">
              <div className="delete-confirmation">
                <div className="delete-icon">
                  <FiTrash2 size={48} />
                </div>
                <p className="delete-message">
                  Are you sure you want to delete this slot configuration?
                </p>
                <div className="delete-details">
                  <p><strong>Doctor:</strong> {deleteConfirm.doctorFullName}</p>
                  <p><strong>Shift:</strong> {deleteConfirm.shiftName}</p>
                  <p><strong>Duration:</strong> {getDurationLabel(deleteConfirm.duration)}</p>
                </div>
                <p className="delete-warning">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="clinic-modal-footer">
              <button onClick={handleDeleteCancel} className="btn-cancel">
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} className="btn-delete">
                Delete Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotConfigList;