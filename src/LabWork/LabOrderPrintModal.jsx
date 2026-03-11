// src/components/LabWork/LabOrderPrintModal.jsx
import React, { useRef, useState, useEffect } from 'react';
import { FiX, FiPrinter, FiDownload } from 'react-icons/fi';
import cpLogo from '../assets/cplogo.png';
import { getLabTestPackageItemList } from '../Api/ApiLabTests.js';
import styles from './LabOrderPrintModal.module.css';

const STATUS_LABELS   = { 1:'Pending', 2:'Completed', 3:'Cancelled', 4:'Invoice Processed', 5:'Work in Progress', 6:'External' };
const PRIORITY_LABELS = { 1:'Normal',  2:'Urgent',    3:'STAT' };

const statusBadgeClass = (s, st) => {
  const map = { 1: st.badgePending, 2: st.badgeCompleted, 3: st.badgeCancelled, 4: st.badgeInvoice, 5: st.badgeProgress };
  return `${st.badge} ${map[s] ?? st.badgeNormal}`;
};

const priorityBadgeClass = (p, st) => {
  const map = { 2: st.badgeUrgent, 3: st.badgeStat };
  return `${st.badge} ${map[p] ?? st.badgeNormal}`;
};

const fmt   = (d) => d ? new Date(d).toLocaleDateString ('en-US', { year:'numeric', month:'long',  day:'numeric' }) : '—';
const fmtDT = (d) => d ? new Date(d).toLocaleString    ('en-US', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';

/* Collect all CSS text from every stylesheet on the page */
const collectAllStyles = () => {
  let css = '';
  try {
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          css += rule.cssText + '\n';
        }
      } catch { /* cross-origin sheet — skip */ }
    }
  } catch { /* ignore */ }
  return css;
};

/* ─────────────────── COMPONENT ─────────────────── */
const LabOrderPrintModal = ({ order, orderItems, onClose }) => {
  const printRef   = useRef(null);
  const [logoDataUrl, setLogoDataUrl] = useState(cpLogo);

  // Map of packageId -> array of test names fetched from API
  const [packageTests, setPackageTests] = useState({});
  const [loadingPackages, setLoadingPackages] = useState(false);

  /* Convert logo to base64 so it embeds in downloaded HTML */
  useEffect(() => {
    const img        = new Image();
    img.crossOrigin  = 'anonymous';
    img.onload = () => {
      const canvas  = document.createElement('canvas');
      canvas.width  = img.naturalWidth  || img.width;
      canvas.height = img.naturalHeight || img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      try { setLogoDataUrl(canvas.toDataURL('image/png')); } catch { /* tainted — keep original */ }
    };
    img.src = cpLogo;
  }, []);

  /* Fetch sub-tests for any package items in the order */
  useEffect(() => {
    if (!orderItems || orderItems.length === 0) return;

    // Detect package items: testType === 2 means package, or isPackage flag, or packageId present
    // Adjust the condition below to match your actual data shape
    const packageItems = orderItems.filter(
      (item) => item.testType === 2 || item.isPackage === true || item.packageId
    );

    if (packageItems.length === 0) return;

    const fetchAllPackageTests = async () => {
      setLoadingPackages(true);
      try {
        const clinicId = Number(localStorage.getItem('clinicID'));
        const branchId = Number(localStorage.getItem('branchID'));

        const results = await Promise.allSettled(
          packageItems.map(async (item) => {
            // Use item.packageId if present, otherwise fall back to item.itemId or item.testId
            const packageId = item.packageId || item.testId || item.itemId;
            const tests = await getLabTestPackageItemList({
              ClinicID: clinicId,
              BranchID: branchId,
              packageId,
            });
            return { packageId, tests };
          })
        );

        const map = {};
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            const { packageId, tests } = result.value;
            map[packageId] = tests;
          }
        });
        setPackageTests(map);
      } catch (err) {
        console.error('Failed to fetch package sub-tests:', err);
      } finally {
        setLoadingPackages(false);
      }
    };

    fetchAllPackageTests();
  }, [orderItems]);

  /* Build a standalone HTML string from the live DOM */
  const buildHtml = (bodyBg) => {
    const allCss = collectAllStyles();
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Lab Order — ${order.patientName || ''}</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{background:${bodyBg};-webkit-print-color-adjust:exact;print-color-adjust:exact;
         display:flex;justify-content:center;padding:24px;}
    @media print{body{background:#fff;padding:0}@page{size:A4;margin:0}}
    ${allCss}
  </style>
</head>
<body>${printRef.current.innerHTML}</body>
</html>`;
  };

  /* ── Print ── */
  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=920,height=780');
    win.document.write(buildHtml('#fff'));
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 900);
  };

  /* ── Download ── */
  const handleDownload = () => {
    const html = buildHtml('#c8d5e2');
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href: url,
      download: `LabOrder_${(order.patientName || '').replace(/\s+/g, '_')}_${order.id}.html`
    });
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  /* ── Info rows data ── */
  const patientRows  = [
    ['Full Name',  order.patientName],
    ['File No.',   order.patientFileNo],
    ['Mobile',     order.patientMobile],
    ['Gender',     order.gender],
    ['Age',        order.age ? `${order.age} yrs` : null],
  ];
  const clinicalRows = [
    ['Ordering Doctor', order.doctorFullName],
    ['Doctor Code',     order.doctorCode],
    ['Clinic',          order.clinicName],
    ['Branch',          order.branchName],
    ['Order Date',      fmtDT(order.dateCreated)],
  ];

  /* Helper: is this order item a package? */
  const isPackageItem = (item) =>
    item.testType === 2 || item.isPackage === true || !!item.packageId;

  /* Helper: get the key used to look up package sub-tests */
  const getPackageKey = (item) =>
    item.packageId || item.testId || item.itemId;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        {/* ── TOP BAR ── */}
        <div className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <div className={styles.topBarIcon}><FiPrinter size={18}/></div>
            <div>
              <div className={styles.topBarTitle}>Lab Order Preview</div>
              <div className={styles.topBarSub}>A4 · Ready to Print or Download</div>
            </div>
          </div>
          <div className={styles.topBarActions}>
            <button className={styles.downloadBtn} onClick={handleDownload}>
              <FiDownload size={15}/><span>Download</span>
            </button>
            <button className={styles.printBtn} onClick={handlePrint}>
              <FiPrinter size={15}/><span>Print</span>
            </button>
            <button className={styles.closeBtn} onClick={onClose}>
              <FiX size={19}/>
            </button>
          </div>
        </div>

        {/* ── PREVIEW SCROLL AREA ── */}
        <div className={styles.previewArea}>
          <div className={styles.paper} ref={printRef}>

            {/* ════════════════════════════════════════════
                A4 DOCUMENT  — all className, no inline styles
            ════════════════════════════════════════════ */}
            <div className={styles.page}>

              {/* HEADER */}
              <div className={styles.docHeader}>
                <div className={styles.headerCircle1}/>
                <div className={styles.headerCircle2}/>
                <div className={styles.headerInner}>
                  <div className={styles.clinicBrand}>
                    <div className={styles.clinicLogoBox}>
                      <img src={logoDataUrl} alt="Clinic Logo" className={styles.clinicLogoImg}/>
                    </div>
                    <div>
                      <div className={styles.clinicName}>{order.clinicName || 'Clinic Name'}</div>
                      <div className={styles.branchName}>{order.branchName || 'Branch'}</div>
                    </div>
                  </div>
                  <div className={styles.docTitleBlock}>
                    <div className={styles.docTitle}>Lab Order</div>
                    <div className={styles.docSubtitle}>Laboratory Request Form</div>
                  </div>
                </div>
              </div>

              {/* ACCENT BAR */}
              <div className={styles.accentBar}/>

              {/* BADGE STRIP — status & priority only, no order # */}
              <div className={styles.badgeStrip}>
                <div className={styles.badgeRow}>
                  <span className={statusBadgeClass(order.status, styles)}>
                    {STATUS_LABELS[order.status] || '—'}
                  </span>
                  <span className={priorityBadgeClass(order.priority, styles)}>
                    {PRIORITY_LABELS[order.priority] || 'Normal'}
                  </span>
                  <span className={styles.orderStripDate}>Issued:&nbsp;{fmt(order.dateCreated)}</span>
                </div>
              </div>

              {/* INFO CARDS */}
              <div className={styles.infoGrid}>
                {[['Patient Information', patientRows], ['Clinical Information', clinicalRows]].map(([title, rows]) => (
                  <div key={title} className={styles.infoCard}>
                    <div className={styles.infoCardHeader}>
                      <h3>{title}</h3>
                    </div>
                    {rows.map(([label, val], i) => (
                      <div key={label} className={i < rows.length - 1 ? styles.infoRow : styles.infoRowLast}>
                        <span className={styles.infoLabel}>{label}</span>
                        <span className={styles.infoValue}>{val || '—'}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* SECTION DIVIDER */}
              <div className={styles.sectionDivider}/>

              {/* ITEMS TABLE */}
              <div className={styles.itemsSection}>
                <div className={styles.itemsSectionTitle}>
                  Ordered Tests &amp; Packages
                </div>

                {loadingPackages ? (
                  <div className={styles.packageLoadingRow}>
                    Loading package details...
                  </div>
                ) : (
                  <div className={styles.tableWrapper}>
                    <table className={styles.itemsTable}>
                      <thead>
                        <tr>
                          <th className={styles.thCenter}>#</th>
                          <th>Test / Package Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderItems.length === 0 ? (
                          <tr>
                            <td colSpan={2} className={styles.tdEmpty}>
                              No test items found for this order
                            </td>
                          </tr>
                        ) : (
                          (() => {
                            const rows = [];
                            let counter = 1;

                            orderItems.forEach((item) => {
                              const isPackage = isPackageItem(item);
                              const pkgKey    = getPackageKey(item);
                              const subTests  = isPackage ? (packageTests[pkgKey] || []) : [];

                              if (isPackage) {
                                /* ── Package row ── */
                                rows.push(
                                  <tr key={`pkg-${item.itemId}`} className={styles.packageRow}>
                                    <td className={styles.tdIndex}>{counter++}</td>
                                    <td className={styles.tdPackageName}>
                                      <span className={styles.packageLabel}>Package</span>
                                      {item.testOrPackageName}
                                    </td>
                                  </tr>
                                );

                                /* ── Sub-test rows ── */
                                if (subTests.length > 0) {
                                  subTests.forEach((test, subIdx) => {
                                    rows.push(
                                      <tr key={`pkg-${item.itemId}-test-${test.packageItemId ?? subIdx}`} className={styles.subTestRow}>
                                        <td className={styles.tdSubIndex}>
                                          {String.fromCharCode(97 + subIdx)}.
                                        </td>
                                        <td className={styles.tdSubName}>
                                          {test.testName}
                                        </td>
                                      </tr>
                                    );
                                  });
                                }
                              } else {
                                /* ── Regular single test row ── */
                                rows.push(
                                  <tr key={`test-${item.itemId}`}>
                                    <td className={styles.tdIndex}>{counter++}</td>
                                    <td className={styles.tdName}>{item.testOrPackageName}</td>
                                  </tr>
                                );
                              }
                            });

                            return rows;
                          })()
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* NOTES */}
              {order.notes && (
                <div className={styles.notesSection}>
                  <div className={styles.notesLabel}>Clinical Notes</div>
                  <div className={styles.notesText}>{order.notes}</div>
                </div>
              )}

              {/* SPACER — pushes footer to bottom */}
              <div className={styles.pageSpacer}/>

              {/* FOOTER */}
              <div className={styles.docFooter}>
                <div className={styles.footerLeft}>
                  <div><strong>Generated:</strong>&nbsp;{fmtDT(new Date().toISOString())}</div>
                  <div>
                    <strong>Clinic:</strong>&nbsp;{order.clinicName || '—'}
                    &nbsp;·&nbsp;
                    <strong>Branch:</strong>&nbsp;{order.branchName || '—'}
                  </div>
                  <div className={styles.footerDisclaimer}>
                    This document is computer generated and is valid without signature.
                  </div>
                </div>
                <div className={styles.signatureBlock}>
                  <div className={styles.signatureLine}/>
                  <div className={styles.signatureLabel}>Authorized Signatory</div>
                </div>
              </div>

              <div className={styles.watermark}>Lab</div>

            </div>{/* end .page */}
          </div>{/* end .paper */}
        </div>{/* end .previewArea */}

      </div>
    </div>
  );
};

export default LabOrderPrintModal;