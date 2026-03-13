import React from 'react';
import { FiX, FiEdit, FiTrash2 } from 'react-icons/fi';
import styles from './ViewLabMaster.module.css';
import { FaClinicMedical } from 'react-icons/fa';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';

const TEST_TYPES = [
  { id: 1, label: 'Blood' },
  { id: 2, label: 'Urine' },
  { id: 3, label: 'Saliva' },
  { id: 4, label: 'Stool' },
  { id: 5, label: 'CSF' },
  { id: 6, label: 'Tissue' },
  { id: 7, label: 'Other' },
];

const TEST_STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
  { id: 3, label: 'Deprecated' },
];

const ViewLabMaster = ({ test, onClose, onUpdate, onDelete }) => {
  if (!test) return null;

  const getTestTypeLabel = (testTypeId) => {
    return TEST_TYPES.find((t) => t.id === testTypeId)?.label || 'Unknown';
  };

  const getTestStatusLabel = (statusId) => {
    return TEST_STATUS_OPTIONS.find((s) => s.id === statusId)?.label || 'Unknown';
  };

  const getStatusClass = (statusId) => {
    if (statusId === 1) return styles.active;
    if (statusId === 2) return styles.inactive;
    if (statusId === 3) return styles.deprecated;
    return styles.inactive;
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.detailsModal}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.detailsModalHeader}>
          <div className={styles.detailsHeaderContent}>
            <div className={styles.avatarLarge}>
              {test.testName?.charAt(0).toUpperCase() || 'T'}
            </div>
            <div>
              <h2>{test.testName}</h2>
              
            </div>
          </div>
          <div className={styles.clinicNameone}>
              <FaClinicMedical size={20} style={{ verticalAlign: 'middle', margin: '6px' }} />  
                {localStorage.getItem('clinicName') || '—'}
          </div>
          <button onClick={onClose} className={styles.modalClose}>
            ×
          </button>
        </div>

        <div className={styles.detailsModalBody}>
          <table className={styles.detailsTable}>
            <tbody>
              <tr>
                <td className={styles.label}>Test Name</td>
                <td className={styles.value}>{test.testName || '—'}</td>
              </tr>
              <tr>
                <td className={styles.label}>Short Name</td>
                <td className={styles.value}>{test.shortName || '—'}</td>
              </tr>
              <tr>
                <td className={styles.label}>Test Type</td>
                <td className={styles.value}>
                  {getTestTypeLabel(test.testType)}
                </td>
              </tr>
              <tr>
                <td className={styles.label}>Description</td>
                <td className={styles.value}>{test.description || '—'}</td>
              </tr>
              <tr>
                <td className={styles.label}>Normal Range</td>
                <td className={styles.value}>{test.normalRange || '—'}</td>
              </tr>
              <tr>
                <td className={styles.label}>Units</td>
                <td className={styles.value}>{test.units || '—'}</td>
              </tr>
              <tr>
                <td className={styles.label}>Fees</td>
                <td className={styles.value}>₹{parseFloat(test.fees || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td className={styles.label}>CGST %</td>
                <td className={styles.value}>{test.cgstPercentage || '0'}%</td>
              </tr>
              <tr>
                <td className={styles.label}>SGST %</td>
                <td className={styles.value}>{test.sgstPercentage || '0'}%</td>
              </tr>
              <tr>
                <td className={styles.label}>Remarks</td>
                <td className={styles.value}>{test.remarks || '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={styles.modalFooter}>
          <button onClick={() => onDelete(test)} className={styles.btnDelete}>
            <FiTrash2 size={16} /> Delete Test
          </button>
          <button onClick={() => onUpdate(test)} className={styles.btnUpdate}>
            <FiEdit size={16} /> Update Test
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewLabMaster;