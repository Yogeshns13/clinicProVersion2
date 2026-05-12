// src/components/ReportPopup.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiFileText } from 'react-icons/fi';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { createReportFile } from '../Api/ApiPdf.js';
import { useTableOptions } from '../Hooks/UseTableOptions.js';
import { getStoredClinicId, getStoredBranchId, getStoredFileAccessToken } from '../Utils/Cryptoutils.js';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import styles from './ReportPopup.module.css';

const ReportPopup = ({
  isOpen,
  onClose,
  onPdfReady,
  reportType,
  title = 'Generate Report',
  filterConfig = [],
  defaultFilters = {},
}) => {
  const tableIds = filterConfig
    .filter((f) => f.type === 'select-table' && f.tableId)
    .map((f) => f.tableId);

  const { tables, loading: tablesLoading } = useTableOptions(tableIds);

  const buildInitialFilters = () => {
    const init = {};
    filterConfig.forEach((f) => {
      init[f.name] = defaultFilters[f.name] !== undefined
        ? defaultFilters[f.name]
        : (f.default !== undefined ? f.default : '');
    });
    return init;
  };

  const [filters, setFilters] = useState(buildInitialFilters);
  const [generating, setGenerating] = useState(false);

  // MessagePopup state
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });

  const showPopup = (message, type = 'error') => {
    setPopup({ visible: true, message, type });
  };

  const closePopup = () => {
    setPopup((prev) => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    if (isOpen) {
      setFilters(buildInitialFilters());
      setPopup({ visible: false, message: '', type: 'success' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const buildApiFilters = async () => {
    const clinicId = await getStoredClinicId();
    const branchId = await getStoredBranchId();
    const built = { ClinicID: clinicId, BranchID: branchId };

    filterConfig.forEach((f) => {
      const raw = filters[f.name];
      if (f.type === 'date') {
        built[f.apiKey || f.name] = raw || '';
      } else {
        const num = Number(raw);
        built[f.apiKey || f.name] = isNaN(num) ? raw : num;
      }
    });

    return built;
  };

  const handleGenerate = async (format) => {
    try {
      const missingDates = [];
      if (!filters.FromDate) missingDates.push('From Date');
      if (!filters.ToDate)   missingDates.push('To Date');
      if (missingDates.length > 0) {
        showPopup(`${missingDates.join(' and ')} is required.`, 'error');
        return;
      }
      setGenerating(true);

      const fileAccessToken = await getStoredFileAccessToken();
      const apiFilters = await buildApiFilters();

      const result = await createReportFile({
        ClinicID: apiFilters.ClinicID,
        FileAccessToken: fileAccessToken,
        ReportType: reportType,
        Format: format,
        Filters: apiFilters,
      });

      if (format === 2) {
        const a = document.createElement('a');
        a.href = result.url;
        a.download = `${reportType}_Report.xlsx`;
        a.click();
        URL.revokeObjectURL(result.url);
        showPopup('Excel report downloaded successfully.', 'success');
      } else {
        onPdfReady({
          url: result.url,
          blob: result.blob,
          label: `${title}`,
        });
        onClose();
      }
    } catch (err) {
      showPopup(err.message || 'Failed to generate report. Please try again.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const renderField = (field) => {
    if (field.type === 'date') {
      const today = new Date().toISOString().split('T')[0];
      return (
        <div className={styles.formGroup} key={field.name}>
          <label className={styles.label}>
            {field.label}
            <span style={{ color: 'red', marginLeft: 3 }}>*</span>
          </label>
          <input
            type="date"
            name={field.name}
            value={filters[field.name] || ''}
            onChange={handleFilterChange}
            max={today}
            className={styles.input}
          />
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <div className={styles.formGroup} key={field.name}>
          <label className={styles.label}>{field.label}</label>
          <select
            name={field.name}
            value={filters[field.name]}
            onChange={handleFilterChange}
            className={styles.select}
          >
            {field.allLabel && (
              <option value={field.default !== undefined ? field.default : 0}>
                {field.allLabel}
              </option>
            )}
            {(field.options || []).map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === 'select-table') {
      const opts = tables[field.tableId] || [];
      return (
        <div className={styles.formGroup} key={field.name}>
          <label className={styles.label}>{field.label}</label>
          <select
            name={field.name}
            value={filters[field.name]}
            onChange={handleFilterChange}
            className={styles.select}
            disabled={tablesLoading}
          >
            {field.allLabel && (
              <option value={field.default !== undefined ? field.default : 0}>
                {tablesLoading ? 'Loading...' : field.allLabel}
              </option>
            )}
            {opts.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <MessagePopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
      />

      <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className={styles.modal}>

          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.headerIcon}>
                <FiFileText size={20} />
              </div>
              <div>
                <h2 className={styles.headerTitle}>{title}</h2>
                <p className={styles.headerSubtitle}>Configure filters and generate report</p>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={onClose} disabled={generating} title="Close">
              <FiX size={18} />
            </button>
          </div>

          {/* Body */}
          <div className={styles.body}>
            <div className={styles.filtersGrid}>
              {filterConfig.map((field) => renderField(field))}
            </div>
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnCancel}
              disabled={generating}
            >
              Cancel
            </button>

            <div className={styles.generateBtns}>
              <button
                type="button"
                onClick={() => handleGenerate(2)}
                className={styles.btnExcel}
                disabled={generating || tablesLoading}
                title="Download as Excel"
              >
                {generating ? <span className={styles.spinner} /> : <FaFileExcel size={16} />}
                Download Excel
              </button>

              <button
                type="button"
                onClick={() => handleGenerate(1)}
                className={styles.btnPdf}
                disabled={generating || tablesLoading}
                title="Generate PDF"
              >
                {generating ? <span className={styles.spinner} /> : <FaFilePdf size={16} />}
                Generate PDF
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default ReportPopup;