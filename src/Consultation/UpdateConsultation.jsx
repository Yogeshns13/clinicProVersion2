// src/components/UpdateConsultation.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import { getConsultationList, updateConsultation } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import './UpdateConsultation.css';

const UpdateConsultation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    reason: '',
    symptoms: '',
    bpSystolic: '',
    bpDiastolic: '',
    temperature: '',
    weight: '',
    emrNotes: '',
    ehrNotes: '',
    instructions: '',
    consultationNotes: '',
    nextConsultationDate: '',
    treatmentPlan: ''
  });

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
        const consult = data[0];
        setConsultation(consult);

        const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

        
        // Populate form
        setFormData({
          reason: consult.reason || '',
          symptoms: consult.symptoms || '',
          bpSystolic: consult.bpSystolic || '',
          bpDiastolic: consult.bpDiastolic || '',
          temperature: consult.temperature || '',
          weight: consult.weight || '',
          emrNotes: consult.emrNotes || '',
          ehrNotes: consult.ehrNotes || '',
          instructions: consult.instructions || '',
          consultationNotes: consult.consultationNotes || '',
          nextConsultationDate: formatDate(consult.nextConsultationDate) || '',
          treatmentPlan: consult.treatmentPlan || ''
        });
      } else {
        setError({ message: 'Consultation not found' });
      }
    } catch (err) {
      console.error('fetchConsultationDetails error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));

      const updateData = {
        consultationId: Number(id),
        clinicId,
        reason: formData.reason.trim(),
        symptoms: formData.symptoms.trim(),
        bpSystolic: formData.bpSystolic ? Number(formData.bpSystolic) : 0,
        bpDiastolic: formData.bpDiastolic ? Number(formData.bpDiastolic) : 0,
        temperature: formData.temperature ? Number(formData.temperature) : 0,
        weight: formData.weight ? Number(formData.weight) : 0,
        emrNotes: formData.emrNotes.trim(),
        ehrNotes: formData.ehrNotes.trim(),
        instructions: formData.instructions.trim(),
        consultationNotes: formData.consultationNotes.trim(),
        nextConsultationDate: formData.nextConsultationDate || '',
        treatmentPlan: formData.treatmentPlan.trim()
      };

      await updateConsultation(updateData);
      
      // Navigate back to consultation list
      navigate('/consultation-list');
    } catch (err) {
      console.error('handleSubmit error:', err);
      setError(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/consultation-list');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className="update-consultation-loading">Loading consultation...</div>;

  if (error) return <div className="update-consultation-error">Error: {error.message || error}</div>;

  if (!consultation) return <div className="update-consultation-error">Consultation not found</div>;

  return (
    <div className="update-consultation-wrapper">
      <ErrorHandler error={error} />
      <Header title="Update Consultation" />

      <div className="update-consultation-container">
        {/* Back Button */}
        <button onClick={handleCancel} className="back-btn">
          <FiArrowLeft size={20} />
          Back to Consultations
        </button>

        {/* Patient & Doctor Info Card */}
        <div className="consultation-info-card">
          <div className="info-section">
            <div className="info-item">
              <span className="info-label">Patient:</span>
              <span className="info-value">{consultation.patientName}</span>
            </div>
            <div className="info-item">
              <span className="info-label">File No:</span>
              <span className="info-value">{consultation.patientFileNo || '—'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Mobile:</span>
              <span className="info-value">{consultation.patientMobile || '—'}</span>
            </div>
          </div>
          <div className="info-section">
            <div className="info-item">
              <span className="info-label">Doctor:</span>
              <span className="info-value">{consultation.doctorFullName}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Doctor Code:</span>
              <span className="info-value">{consultation.doctorCode || '—'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Date:</span>
              <span className="info-value">{formatDate(consultation.dateCreated)}</span>
            </div>
          </div>
        </div>

        {/* Update Form */}
        <form onSubmit={handleSubmit} className="update-consultation-form">
          {/* Visit Information */}
          <div className="form-section">
            <h3 className="form-section-title">Visit Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Reason for Visit</label>
                <input
                  type="text"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  placeholder="Reason for visit..."
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Symptoms</label>
                <input
                  type="text"
                  name="symptoms"
                  value={formData.symptoms}
                  onChange={handleInputChange}
                  placeholder="Patient symptoms..."
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Vital Signs */}
          <div className="form-section">
            <h3 className="form-section-title">Vital Signs</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">BP Systolic</label>
                <input
                  type="number"
                  name="bpSystolic"
                  value={formData.bpSystolic}
                  onChange={handleInputChange}
                  placeholder="120"
                  className="form-input"
                  min="0"
                  max="300"
                />
              </div>

              <div className="form-group">
                <label className="form-label">BP Diastolic</label>
                <input
                  type="number"
                  name="bpDiastolic"
                  value={formData.bpDiastolic}
                  onChange={handleInputChange}
                  placeholder="80"
                  className="form-input"
                  min="0"
                  max="200"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Temperature (°F)</label>
                <input
                  type="number"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleInputChange}
                  placeholder="98.6"
                  className="form-input"
                  step="0.1"
                  min="90"
                  max="110"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder="70"
                  className="form-input"
                  step="0.1"
                  min="0"
                  max="500"
                />
              </div>
            </div>
          </div>

          {/* Medical Records */}
          <div className="form-section">
            <h3 className="form-section-title">Medical Records</h3>
            
            <div className="form-group">
              <label className="form-label">EMR Notes</label>
              <textarea
                name="emrNotes"
                value={formData.emrNotes}
                onChange={handleInputChange}
                placeholder="Electronic Medical Record notes..."
                className="form-textarea"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label className="form-label">EHR Notes</label>
              <textarea
                name="ehrNotes"
                value={formData.ehrNotes}
                onChange={handleInputChange}
                placeholder="Electronic Health Record notes..."
                className="form-textarea"
                rows={3}
              />
            </div>
          </div>

          {/* Consultation Details */}
          <div className="form-section">
            <h3 className="form-section-title">Consultation Details</h3>
            
            <div className="form-group">
              <label className="form-label">Consultation Notes *</label>
              <textarea
                name="consultationNotes"
                value={formData.consultationNotes}
                onChange={handleInputChange}
                placeholder="Detailed consultation notes..."
                className="form-textarea"
                rows={4}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Instructions</label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleInputChange}
                placeholder="Instructions for patient..."
                className="form-textarea"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Treatment Plan</label>
              <textarea
                name="treatmentPlan"
                value={formData.treatmentPlan}
                onChange={handleInputChange}
                placeholder="Recommended treatment plan..."
                className="form-textarea"
                rows={4}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Next Consultation Date</label>
              <input
                type="date"
                name="nextConsultationDate"
                value={formData.nextConsultationDate}
                onChange={handleInputChange}
                className="form-input"
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="form-hint">Optional: Schedule a follow-up consultation</p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="update-consultation-actions">
            <button 
              type="button" 
              onClick={handleCancel} 
              className="btn-cancel"
              disabled={submitLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-save"
              disabled={submitLoading}
            >
              <FiSave size={18} />
              {submitLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateConsultation;