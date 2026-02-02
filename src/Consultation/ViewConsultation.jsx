// src/components/ViewConsultation.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiCalendar, FiActivity, FiFileText, FiEdit2 } from 'react-icons/fi';
import { getConsultationList } from '../api/api-consultation.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './ViewConsultation.module.css';

const ViewConsultation = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (id) {
      fetchConsultationDetails();
    }
  }, [id]);

  const fetchConsultationDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const options = {
        Page: 1,
        PageSize: 1,
        BranchID: branchId,
        ConsultationID: Number(id)
      };

      const data = await getConsultationList(clinicId, options);

      if (data && data.length > 0) {
        setConsultation(data[0]);
      } else {
        setError({ message: 'Consultation not found' });
      }
    } catch (err) {
      console.error('fetchConsultationDetails error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load consultation details' }
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateOnly = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusClass = (status) => {
    if (status === 'active') return 'active';
    if (status === 'completed') return 'completed';
    if (status === 'inactive') return 'inactive';
    return 'inactive';
  };

  const handleBack = () => {
    navigate('/consultation-list');
  };

  const handleUpdate = () => {
    if (id) {
      navigate(`/update-consultation/${id}`);
    }
  };

  const handleTabClick = (tab, path) => {
    if (path) {
      navigate(path);
    } else {
      setActiveTab(tab);
    }
  };

  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.loading}>Loading consultation details...</div>;

  if (error) return <div className={styles.error}>Error: {error.message || error}</div>;

  if (!consultation) return <div className={styles.error}>Consultation not found</div>;

  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Consultation Details" />

      {/* Back Button */}
      <div className={styles.toolbar}>
        <button onClick={handleBack} className={styles.backBtn}>
          <FiArrowLeft size={20} /> Back to List
        </button>
      </div>

      {/* Consultation Details Card */}
      <div className={styles.detailsCard}>
        
        {/* Header Section with Tabs */}
        <div className={styles.cardHeader}>
          <div className={styles.headerInfo}>
            <h2>{consultation.patientName}</h2>
            <p className={styles.subtitle}>
              {consultation.doctorFullName} • {formatDateOnly(consultation.dateCreated)}
            </p>
            <span className={`${styles.statusBadge} ${styles.large} ${styles[getStatusClass(consultation.status || 'completed')]}`}>
              {(consultation.status || 'COMPLETED').toUpperCase()}
            </span>
          </div>

          {/* Tab Navigation */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tabButton} ${activeTab === 'details' ? styles.active : ''}`}
              onClick={() => handleTabClick('details')}
            >
              Consultation Details
            </button>
            <button
              className={styles.tabButton}
              onClick={() => handleTabClick('prescription', `/view-prescription/${id}`)}
            >
              Prescription Details
            </button>
            <button
              className={styles.tabButton}
              onClick={() => handleTabClick('laborder', `/view-laborder/${id}`)}
            >
              Lab Order Details
            </button>
          </div>
        </div>

        {/* Details Body */}
        <div className={styles.cardBody}>
          
          {/* Section 1: Patient & Doctor Info Grid */}
          <div className={styles.section}>
            <div className={styles.infoGrid}>
              <div className={`${styles.infoCard} ${styles.patientInfo}`}>
                <div className={styles.infoCardHeader}>
                  <FiUser size={20} />
                  <span>Patient Information</span>
                </div>
                <div className={styles.infoCardBody}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Name</span>
                    <span className={styles.detailValue}>{consultation.patientName}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>File No</span>
                    <span className={styles.detailValue}>{consultation.patientFileNo || '—'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Mobile</span>
                    <span className={styles.detailValue}>{consultation.patientMobile || '—'}</span>
                  </div>
                </div>
              </div>

              <div className={`${styles.infoCard} ${styles.doctorInfo}`}>
                <div className={styles.infoCardHeader}>
                  <FiUser size={20} />
                  <span>Doctor Information</span>
                </div>
                <div className={styles.infoCardBody}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Name</span>
                    <span className={styles.detailValue}>{consultation.doctorFullName}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Code</span>
                    <span className={styles.detailValue}>{consultation.doctorCode || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Visit Details */}
          {(consultation.reason || consultation.symptoms) && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <FiActivity size={20} />
                Visit Details
              </h3>
              <div className={styles.detailsGrid}>
                {consultation.reason && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Reason for Visit</span>
                    <span className={styles.detailValue}>{consultation.reason}</span>
                  </div>
                )}
                {consultation.symptoms && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Symptoms</span>
                    <span className={styles.detailValue}>{consultation.symptoms}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 3: Vital Signs */}
          {(consultation.bpReading || consultation.temperature || consultation.weight) && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <FiActivity size={20} />
                Vital Signs
              </h3>
              <div className={styles.vitalsGrid}>
                {consultation.bpReading && (
                  <div className={`${styles.vitalCard} ${styles.bpCard}`}>
                    <div className={styles.vitalLabel}>Blood Pressure</div>
                    <div className={styles.vitalValue}>{consultation.bpReading}</div>
                    <div className={styles.vitalUnit}>mmHg</div>
                  </div>
                )}
                {consultation.temperature && (
                  <div className={`${styles.vitalCard} ${styles.tempCard}`}>
                    <div className={styles.vitalLabel}>Temperature</div>
                    <div className={styles.vitalValue}>{consultation.temperature}</div>
                    <div className={styles.vitalUnit}>°F</div>
                  </div>
                )}
                {consultation.weight && (
                  <div className={`${styles.vitalCard} ${styles.weightCard}`}>
                    <div className={styles.vitalLabel}>Weight</div>
                    <div className={styles.vitalValue}>{consultation.weight}</div>
                    <div className={styles.vitalUnit}>kg</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 4: Medical Records */}
          {(consultation.emrNotes || consultation.ehrNotes) && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <FiFileText size={20} />
                Medical Records
              </h3>
              <div className={styles.detailsGrid}>
                {consultation.emrNotes && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>EMR Notes</span>
                    <div className={styles.contentBox}>{consultation.emrNotes}</div>
                  </div>
                )}
                {consultation.ehrNotes && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>EHR Notes</span>
                    <div className={styles.contentBox}>{consultation.ehrNotes}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 5: Consultation Notes */}
          {consultation.consultationNotes && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <FiFileText size={20} />
                Consultation Notes
              </h3>
              <div className={styles.contentBox}>
                {consultation.consultationNotes}
              </div>
            </div>
          )}

          {/* Section 6: Instructions */}
          {consultation.instructions && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <FiFileText size={20} />
                Instructions for Patient
              </h3>
              <div className={styles.contentBox}>
                {consultation.instructions}
              </div>
            </div>
          )}

          {/* Section 7: Treatment Plan */}
          {consultation.treatmentPlan && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <FiFileText size={20} />
                Treatment Plan
              </h3>
              <div className={styles.contentBox}>
                {consultation.treatmentPlan}
              </div>
            </div>
          )}

          {/* Section 8: Next Consultation / Follow-up */}
          {consultation.nextConsultationDate && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <FiCalendar size={20} />
                Follow-up Appointment
              </h3>
              <div className={styles.followupContent}>
                <div className={styles.followupDate}>
                  {formatDateOnly(consultation.nextConsultationDate)}
                </div>
              </div>
            </div>
          )}

          {/* Section 9: Metadata */}
          <div className={styles.metadata}>
            <div className={styles.metadataItem}>
              <span className={styles.detailLabel}>Created</span>
              <span className={styles.detailValue}>{formatDate(consultation.dateCreated)}</span>
            </div>
            {consultation.dateModified && (
              <div className={styles.metadataItem}>
                <span className={styles.detailLabel}>Last Modified</span>
                <span className={styles.detailValue}>{formatDate(consultation.dateModified)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.cardFooter}>
          <button onClick={handleUpdate} className={styles.btnUpdate}>
            <FiEdit2 size={16} />
            Update Consultation
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewConsultation;