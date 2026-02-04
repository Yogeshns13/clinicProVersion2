// src/components/LabWorkManagement/modals/SampleCollectionModal.jsx
import React, { useState } from 'react';
import { FiX, FiCalendar, FiMapPin } from 'react-icons/fi';
import { updateSampleCollection } from '../../api/api-labtest.js';
import styles from '../LabWorkManagement.module.css';

const SampleCollectionModal = ({ workItem, onClose, onSuccess, setLoading }) => {
  const [formData, setFormData] = useState({
    sampleCollectedTime: '',
    sampleCollectedPlace: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.sampleCollectedTime) {
      alert('Please enter sample collection date and time');
      return;
    }

    try {
      setLoading(true);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      await updateSampleCollection({
        workId: workItem.workId,
        clinicId,
        branchId,
        sampleCollectedTime: formData.sampleCollectedTime,
        sampleCollectedPlace: formData.sampleCollectedPlace
      });

      alert('Sample collection updated successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error updating sample collection:', err);
      alert(err.message || 'Failed to update sample collection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Collect Sample</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {/* Work Item Info */}
            <div className={styles.infoSection}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Work ID:</span>
                <span className={styles.infoValue}>#{workItem.workId}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Patient:</span>
                <span className={styles.infoValue}>{workItem.patientName}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Test:</span>
                <span className={styles.infoValue}>{workItem.testName}</span>
              </div>
            </div>

            {/* Form Fields */}
            <div className={styles.formGrid}>
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>
                  <FiCalendar size={16} />
                  Sample Collection Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.sampleCollectedTime}
                  onChange={(e) => setFormData({ ...formData, sampleCollectedTime: e.target.value })}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>
                  <FiMapPin size={16} />
                  Collection Place
                </label>
                <input
                  type="text"
                  value={formData.sampleCollectedPlace}
                  onChange={(e) => setFormData({ ...formData, sampleCollectedPlace: e.target.value })}
                  className={styles.formInput}
                  placeholder="e.g., Lab Room 1, Patient Room"
                />
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="submit" className={styles.submitBtn}>
              Save Sample Collection
            </button>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SampleCollectionModal;