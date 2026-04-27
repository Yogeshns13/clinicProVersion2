// src/components/ViewPatientVisit.jsx
import React, { useState, useEffect } from "react";
import {
  FiX,
  FiUser,
  FiCalendar,
  FiActivity,
  FiFileText,
  FiEdit,
} from "react-icons/fi";
import { getPatientVisitList } from "../Api/Api.js";
import styles from "./ViewPatientVisit.module.css";
import { FaClinicMedical } from "react-icons/fa";
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';

const ViewPatientVisit = ({ isOpen, onClose, visitId, onEdit }) => {
  const [visit,   setVisit]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const fetchVisitDetails = async () => {
      if (!visitId || !isOpen) return;

      try {
        setLoading(true);
        setError(null);

        const clinicId = await getStoredClinicId();
        const branchId = await getStoredBranchId();

        const data = await getPatientVisitList(clinicId, {
          VisitID:  Number(visitId),
          BranchID: branchId,
        });

        if (data && data.length > 0) {
          setVisit(data[0]);
        } else {
          setError({ message: "Visit not found" });
        }
      } catch (err) {
        console.error("fetchVisitDetails error:", err);
        setError({ message: err.message || "Failed to load visit details" });
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchVisitDetails();
    }
  }, [visitId, isOpen]);

  const handleEdit = () => {
    if (visitId && onEdit) {
      onEdit(visitId);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        year: "numeric", month: "long", day: "numeric", weekday: "long",
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "—";
    const [hours, minutes] = timeStr.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  if (!isOpen) return null;

  const clinicName = localStorage.getItem('clinicName') || '—';
  const branchName = localStorage.getItem('branchName') || '—';

  return (
    <div className={styles['visit-details-overlay']}>
      <div className={styles['visit-details-modal']}>

        {/* Header */}
        <div className={styles['visit-details-header']}>
          <div className={styles['visit-details-header-content']}>
            <FiActivity className={styles['visit-details-header-icon']} size={24} />
            <h2>Visit Details</h2>
          </div>
          <div className={styles.addModalHeaderCard}>
                      <div className={styles.clinicInfoIcon}>
                        <FaClinicMedical size={18} />
                      </div>
                      <div className={styles.clinicInfoText}>
                        <span className={styles.clinicInfoName}>{clinicName}</span>
                        <span className={styles.clinicInfoBranch}>{branchName}</span>
                      </div>
                      </div>
          <button onClick={onClose} className={styles['visit-details-close']}>
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles['visit-details-body']}>
          {loading && (
            <div className={styles['visit-details-loading']}>
              <div className={styles['visit-details-spinner']}></div>
              <p>Loading visit details...</p>
            </div>
          )}

          {error && (
            <div className={styles['visit-details-error']}>
              <p>Error: {error.message || error}</p>
            </div>
          )}

          {!loading && !error && visit && (
            <>
              {/* Patient & Doctor Information */}
              <div className={styles['visit-details-section']}>
                <h3 className={styles['visit-details-section-title']}>
                  <FiUser size={18} />
                  Patient &amp; Doctor Information
                </h3>
                <div className={styles['visit-details-grid']}>
                  <div className={styles['visit-detail-item']}>
                    <span className={styles['visit-detail-label']}>Patient Name</span>
                    <span className={styles['visit-detail-value']}>{visit.patientName || "—"}</span>
                  </div>
                  <div className={styles['visit-detail-item']}>
                    <span className={styles['visit-detail-label']}>File Number</span>
                    <span className={styles['visit-detail-value']}>{visit.patientFileNo || "—"}</span>
                  </div>
                  <div className={styles['visit-detail-item']}>
                    <span className={styles['visit-detail-label']}>Mobile</span>
                    <span className={styles['visit-detail-value']}>{visit.patientMobile || "—"}</span>
                  </div>
                  <div className={styles['visit-detail-item']}>
                    <span className={styles['visit-detail-label']}>Doctor Name</span>
                    <span className={styles['visit-detail-value']}>{visit.doctorFullName || "—"}</span>
                  </div>
                  <div className={styles['visit-detail-item']}>
                    <span className={styles['visit-detail-label']}>Doctor Code</span>
                    <span className={styles['visit-detail-value']}>{visit.doctorCode || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Visit Information */}
              <div className={styles['visit-details-section']}>
                <h3 className={styles['visit-details-section-title']}>
                  <FiCalendar size={18} />
                  Visit &amp; Clinical Details
                </h3>
                <div className={styles['visit-details-grid']}>
                  <div className={styles['visit-detail-item']}>
                    <span className={styles['visit-detail-label']}>Visit Date</span>
                    <span className={styles['visit-detail-value']}>{formatDate(visit.visitDate)}</span>
                  </div>
                  <div className={styles['visit-detail-item']}>
                    <span className={styles['visit-detail-label']}>Visit Time</span>
                    <span className={styles['visit-detail-value']}>{formatTime(visit.visitTime)}</span>
                  </div>
                  {visit.appointmentId && (
                    <div className={styles['visit-detail-item']}>
                      <span className={styles['visit-detail-label']}>Appointment ID</span>
                      <span className={styles['visit-detail-value']}>{visit.appointmentId}</span>
                    </div>
                  )}
                  <div className={`${styles['visit-detail-item']} ${styles['visit-full-width']}`}>
                    <span className={styles['visit-detail-label']}>Reason for Visit</span>
                    <span className={styles['visit-detail-value']}>{visit.reason || "—"}</span>
                  </div>
                  <div className={`${styles['visit-detail-item']} ${styles['visit-full-width']}`}>
                    <span className={styles['visit-detail-label']}>Symptoms</span>
                    <span className={styles['visit-detail-value']}>{visit.symptoms || "—"}</span>
                  </div>

                  <div className={styles['vitals-cards-grid']}>
                    <div className={`${styles['vital-card']} ${styles['bp-card']}`}>
                      <div className={styles['vital-icon']}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                            fill="currentColor"
                          />
                        </svg>
                      </div>
                      <div className={styles['vital-content']}>
                        <div className={styles['vital-label']}>Blood Pressure</div>
                        <div className={styles['vital-value']}>
                          {visit.bpReading ||
                            (visit.bpSystolic && visit.bpDiastolic
                              ? `${visit.bpSystolic}/${visit.bpDiastolic}`
                              : "—")}
                        </div>
                        <div className={styles['vital-unit']}>mmHg</div>
                      </div>
                    </div>

                    <div className={`${styles['vital-card']} ${styles['temp-card']}`}>
                      <div className={styles['vital-icon']}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4zm-3-10c.83 0 1.5.67 1.5 1.5v7.97c1.27.41 2.2 1.59 2.2 2.97 0 1.76-1.43 3.19-3.19 3.19s-3.19-1.43-3.19-3.19c0-1.38.93-2.56 2.2-2.97V4.5c0-.83.67-1.5 1.5-1.5z"
                            fill="currentColor"
                          />
                        </svg>
                      </div>
                      <div className={styles['vital-content']}>
                        <div className={styles['vital-label']}>Temperature</div>
                        <div className={styles['vital-value']}>{visit.temperature || "—"}</div>
                        <div className={styles['vital-unit']}>°F</div>
                      </div>
                    </div>

                    <div className={`${styles['vital-card']} ${styles['weight-card']}`}>
                      <div className={styles['vital-icon']}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zm1-11h-2v3H8v2h3v3h2v-3h3v-2h-3V8z"
                            fill="currentColor"
                          />
                        </svg>
                      </div>
                      <div className={styles['vital-content']}>
                        <div className={styles['vital-label']}>Weight</div>
                        <div className={styles['vital-value']}>{visit.weight || "—"}</div>
                        <div className={styles['vital-unit']}>kg</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clinic Information */}
              <div className={styles['visit-details-section']}>
                <h3 className={styles['visit-details-section-title']}>
                  <FiFileText size={18} />
                  Clinic &amp; Record Information
                </h3>
                <div className={styles['visit-details-grid']}>
                  <div className={styles['visit-detail-item']}>
                    <span className={styles['visit-detail-label']}>Clinic Name</span>
                    <span className={styles['visit-detail-value']}>{visit.clinicName || "—"}</span>
                  </div>
                  <div className={styles['visit-detail-item']}>
                    <span className={styles['visit-detail-label']}>Branch Name</span>
                    <span className={styles['visit-detail-value']}>{visit.branchName || "—"}</span>
                  </div>
                  <div className={styles['visit-detail-item']}>
                    <span className={styles['visit-detail-label']}>Date Created</span>
                    <span className={styles['visit-detail-value']}>{formatDate(visit.dateCreated)}</span>
                  </div>
                  <div className={styles['visit-detail-item']}>
                    <span className={styles['visit-detail-label']}>Last Modified</span>
                    <span className={styles['visit-detail-value']}>{formatDate(visit.dateModified)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles['visit-details-footer']}>
          <button onClick={onClose} className={styles['visit-details-close-btn']}>
            Close
          </button>
          <button onClick={handleEdit} className={styles['visit-details-edit-btn']}>
            Update Visit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewPatientVisit;