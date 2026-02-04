// src/components/LabWorkManagement/tabs/WorkItemsTab.jsx
import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiEdit, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { getLabWorkItemsList } from '../../api/api-labtest.js';
import WorkItemDetailsModal from '../modals/WorkItemDetailsModal.jsx';
import SampleCollectionModal from '../modals/SampleCollectionModal.jsx';
import ResultEntryModal from '../modals/ResultEntryModal.jsx';
import ApprovalModal from '../modals/ApprovalModal.jsx';
import RejectionModal from '../modals/RejectionModal.jsx';
import styles from '../LabWorkManagement.module.css';

const WorkItemsTab = ({ employeeList, setError, setLoading }) => {
  const [workItems, setWorkItems] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState(-1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);

  // Modal States
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSampleCollectionOpen, setIsSampleCollectionOpen] = useState(false);
  const [isResultEntryOpen, setIsResultEntryOpen] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [isRejectionOpen, setIsRejectionOpen] = useState(false);
  const [selectedWorkItem, setSelectedWorkItem] = useState(null);

  // Status options
  const statusOptions = [
    { id: -1, label: 'All Statuses' },
    { id: 1, label: 'Sample Pending' },
    { id: 2, label: 'Sample Collected' },
    { id: 3, label: 'Result Entered' },
    { id: 4, label: 'Approved' },
    { id: 5, label: 'Rejected' }
  ];

  // Fetch Work Items
  const fetchWorkItems = async () => {
    try {
      setLocalLoading(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const options = {
        Page: 1,
        PageSize: 200,
        BranchID: branchId,
        Status: statusFilter
      };

      if (searchInput.trim()) {
        options.Search = searchInput.trim();
      }

      const data = await getLabWorkItemsList(clinicId, options);
      const sortedData = data.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
      setWorkItems(sortedData);
    } catch (err) {
      console.error('fetchWorkItems error:', err);
      setError(err);
    } finally {
      setLocalLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkItems();
  }, []);

  const handleSearch = () => {
    fetchWorkItems();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setStatusFilter(-1);
    fetchWorkItems();
  };

  const handleViewDetails = (item) => {
    setSelectedWorkItem(item);
    setIsDetailsOpen(true);
  };

  const handleCollectSample = (item) => {
    setSelectedWorkItem(item);
    setIsSampleCollectionOpen(true);
  };

  const handleEnterResult = (item) => {
    setSelectedWorkItem(item);
    setIsResultEntryOpen(true);
  };

  const handleApprove = (item) => {
    setSelectedWorkItem(item);
    setIsApprovalOpen(true);
  };

  const handleReject = (item) => {
    setSelectedWorkItem(item);
    setIsRejectionOpen(true);
  };

  const handleModalSuccess = () => {
    fetchWorkItems();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    const classMap = {
      1: styles.statusPending,
      2: styles.statusSampleCollected,
      3: styles.statusResultEntered,
      4: styles.statusApproved,
      5: styles.statusRejected
    };
    return classMap[status] || styles.statusPending;
  };

  // Determine which actions are available based on status
  const getAvailableActions = (item) => {
    const actions = [];

    // Sample Collection (if status is 1)
    if (item.status === 1) {
      actions.push({
        label: 'Collect Sample',
        onClick: () => handleCollectSample(item),
        className: styles.collectBtn,
        icon: <FiEdit size={14} />
      });
    }

    // Result Entry (if status is 2)
    if (item.status === 2) {
      actions.push({
        label: 'Enter Result',
        onClick: () => handleEnterResult(item),
        className: styles.resultBtn,
        icon: <FiEdit size={14} />
      });
    }

    // Approval/Rejection (if status is 3)
    if (item.status === 3) {
      actions.push({
        label: 'Approve',
        onClick: () => handleApprove(item),
        className: styles.approveBtn,
        icon: <FiCheckCircle size={14} />
      });
      actions.push({
        label: 'Reject',
        onClick: () => handleReject(item),
        className: styles.rejectBtn,
        icon: <FiXCircle size={14} />
      });
    }

    return actions;
  };

  if (localLoading) {
    return <div className={styles.loading}>Loading work items...</div>;
  }

  return (
    <>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(Number(e.target.value))}
            className={styles.select}
          >
            {statusOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`${styles.filterToggleBtn} ${showAdvancedFilters ? styles.filterToggleBtnActive : ''}`}
          >
            <FiFilter size={18} />
            {showAdvancedFilters ? 'Hide' : 'Show'} Filters
          </button>

          {(searchInput || statusFilter !== -1) && (
            <button onClick={clearAllFilters} className={styles.clearBtn}>
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className={styles.searchWrapper}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search by patient name, test name, or work ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className={styles.searchInput}
          />
          <button onClick={handleSearch} className={styles.searchIconBtn}>
            <FiSearch size={20} />
          </button>
        </div>
      </div>

      {/* Work Items Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Work ID</th>
              <th>Patient</th>
              <th>Test Name</th>
              <th>Result</th>
              <th>Status</th>
              <th>Date Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {workItems.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.noData}>
                  {searchInput
                    ? 'No work items found matching your search.'
                    : 'No work items found.'}
                </td>
              </tr>
            ) : (
              workItems.map((item) => {
                const actions = getAvailableActions(item);
                return (
                  <tr key={item.workId}>
                    <td>
                      <div className={styles.workIdCell}>
                        <span className={styles.workIdBadge}>#{item.workId}</span>
                        <div className={styles.subText}>Order: {item.orderId}</div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar}>
                          {item.patientName?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        <div>
                          <div className={styles.name}>{item.patientName}</div>
                          <div className={styles.subText}>
                            {item.fileNo} • {item.mobile}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.name}>{item.testName}</div>
                      <div className={styles.subText}>ID: {item.testId}</div>
                    </td>
                    <td>
                      {item.resultValue ? (
                        <div>
                          <div className={styles.name}>
                            {item.resultValue} {item.resultUnits || ''}
                          </div>
                          <div className={styles.subText}>{item.normalRange || '—'}</div>
                        </div>
                      ) : (
                        <div className={styles.subText}>Not entered</div>
                      )}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${getStatusBadgeClass(item.status)}`}>
                        {statusOptions.find(s => s.id === item.status)?.label || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.name}>{formatDate(item.dateCreated)}</div>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          onClick={() => handleViewDetails(item)}
                          className={styles.viewBtn}
                        >
                          View
                        </button>
                        {actions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={action.onClick}
                            className={action.className}
                          >
                            {action.icon}
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {isDetailsOpen && selectedWorkItem && (
        <WorkItemDetailsModal
          workItem={selectedWorkItem}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedWorkItem(null);
          }}
        />
      )}

      {isSampleCollectionOpen && selectedWorkItem && (
        <SampleCollectionModal
          workItem={selectedWorkItem}
          onClose={() => {
            setIsSampleCollectionOpen(false);
            setSelectedWorkItem(null);
          }}
          onSuccess={handleModalSuccess}
          setLoading={setLoading}
        />
      )}

      {isResultEntryOpen && selectedWorkItem && (
        <ResultEntryModal
          workItem={selectedWorkItem}
          employeeList={employeeList}
          onClose={() => {
            setIsResultEntryOpen(false);
            setSelectedWorkItem(null);
          }}
          onSuccess={handleModalSuccess}
          setLoading={setLoading}
        />
      )}

      {isApprovalOpen && selectedWorkItem && (
        <ApprovalModal
          workItem={selectedWorkItem}
          employeeList={employeeList}
          onClose={() => {
            setIsApprovalOpen(false);
            setSelectedWorkItem(null);
          }}
          onSuccess={handleModalSuccess}
          setLoading={setLoading}
        />
      )}

      {isRejectionOpen && selectedWorkItem && (
        <RejectionModal
          workItem={selectedWorkItem}
          employeeList={employeeList}
          onClose={() => {
            setIsRejectionOpen(false);
            setSelectedWorkItem(null);
          }}
          onSuccess={handleModalSuccess}
          setLoading={setLoading}
        />
      )}
    </>
  );
};

export default WorkItemsTab;