// src/components/PdfViewerPopup.jsx
import React from 'react';
import { FiX, FiPrinter, FiDownload } from 'react-icons/fi';
import styles from './PdfViewerPopup.module.css';

/**
 * PdfViewerPopup - Fullscreen PDF viewer popup.
 *
 * Props:
 *  isOpen     {boolean}   - controls visibility
 *  onClose    {function}  - called on close
 *  pdfUrl     {string}    - object URL of the PDF blob
 *  title      {string}    - display title in header
 *  fileName   {string}    - name for the downloaded file (without extension)
 */
const PdfViewerPopup = ({ isOpen, onClose, pdfUrl, title = 'Report', fileName }) => {
  if (!isOpen || !pdfUrl) return null;

  const handlePrint = () => {
    const iframe = document.getElementById('reportPdfViewerIframe');
    if (iframe) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `${fileName || title}.pdf`;
    a.click();
  };

  return (
    <div
      className={styles.overlay}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.modal}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <FiPrinter size={22} />
            </div>
            <div>
              <h2 className={styles.headerTitle}>{title}</h2>
              <p className={styles.headerSubtitle}>PDF Preview</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="Close">
            <FiX size={20} />
          </button>
        </div>

        {/* Body — iframe */}
        <div className={styles.body}>
          <iframe
            id="reportPdfViewerIframe"
            src={pdfUrl}
            title={title}
            className={styles.iframe}
          />
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.btnPrint} onClick={handlePrint}>
            <FiPrinter size={16} /> Print
          </button>
          <button className={styles.btnDownload} onClick={handleDownload}>
            <FiDownload size={16} /> Download
          </button>
        </div>

      </div>
    </div>
  );
};

export default PdfViewerPopup;