// src/components/LabWork/LabOrderPrintModal.jsx
import React, { useRef, useState, useEffect } from 'react';
import { FiX, FiPrinter } from 'react-icons/fi';
import cpLogo from '../assets/cplogo.png';
import { getLabTestPackageItemList } from '../Api/ApiLabTests.js';
import { getClinicList } from '../Api/Api.js';
import styles from './LabOrderPrintModal.module.css';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';

const STATUS_LABELS   = { 1:'Pending', 2:'Completed', 3:'Cancelled', 4:'Invoice Processed', 5:'Work in Progress', 6:'External' };
const PRIORITY_LABELS = { 1:'Normal', 2:'Urgent', 3:'STAT' };

const statusBadgeClass = (s, st) => {
  const map = { 1: st.badgePending, 2: st.badgeCompleted, 3: st.badgeCancelled, 4: st.badgeInvoice, 5: st.badgeProgress };
  return `${st.badge} ${map[s] ?? st.badgeNormal}`;
};
const priorityBadgeClass = (p, st) => {
  const map = { 1: st.badgeNormal, 2: st.badgeUrgent, 3: st.badgeStat };
  return `${st.badge} ${map[p] ?? st.badgeNormal}`;
};

const fmt   = (d) => d ? new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }) : '—';
const fmtDT = (d) => d ? new Date(d).toLocaleString('en-US',    { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';

/* ═══════════════════════════════════════════════════════════
   PRINT_CSS  ·  standalone un-hashed class names
   Fonts: Plus Jakarta Sans (body) + Cormorant Garamond (headings)
   Brand palette:
     #0f2057  deep navy
     #1a3a8f  mid blue
     #0d7aa8  teal
     #30b2b5  cyan accent
═══════════════════════════════════════════════════════════ */
const PRINT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

body{
  -webkit-print-color-adjust:exact;
  print-color-adjust:exact;
  display:flex;justify-content:center;
  padding:24px;
  font-family:'Plus Jakarta Sans','Segoe UI',sans-serif;
  background:#c8d4de;
}

@media print{
  body{background:#fff!important;padding:0}
  @page{size:A4;margin:0}
}

/* ── PAGE ── */
.page{
  width:210mm;min-height:297mm;height:297mm;
  background:#fff;color:#0f2057;
  position:relative;overflow:hidden;
  box-sizing:border-box;
  display:flex;flex-direction:column;
  box-shadow:0 2px 8px rgba(0,0,0,.08),0 16px 48px rgba(0,0,0,.20);
}

/* subtle graph-paper grid behind content */
.page::before{
  content:'';
  position:absolute;inset:0;
  background-image:
    linear-gradient(rgba(13,122,168,.028) 1px,transparent 1px),
    linear-gradient(90deg,rgba(13,122,168,.028) 1px,transparent 1px);
  background-size:11mm 11mm;
  pointer-events:none;z-index:0;
}

/* ── HEADER ── */
.doc-header{position:relative;z-index:1;flex-shrink:0}

.header-stripe{
  height:5px;
  background:linear-gradient(90deg,#0f2057 0%,#1a3a8f 40%,#0d7aa8 72%,#30b2b5 100%);
}

.header-ribbon{
  background:#0f2057;
  padding:4px 28px;
  display:flex;align-items:center;justify-content:space-between;
}
.ribbon-contacts{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.ribbon-item{
  font-size:8.5px;color:rgba(255,255,255,.68);
  display:flex;align-items:center;gap:5px;letter-spacing:.3px;
}
.ribbon-icon{
  width:13px;height:13px;border-radius:50%;
  background:rgba(48,178,181,.20);
  display:inline-flex;align-items:center;justify-content:center;
  font-size:7px;color:#30b2b5;flex-shrink:0;
}
.ribbon-right{font-size:8px;color:rgba(255,255,255,.38);letter-spacing:.5px;text-transform:uppercase}

.header-main{
  background:linear-gradient(135deg,#0f2057 0%,#1a3a8f 52%,#0d7aa8 100%);
  padding:17px 28px 15px;
  display:flex;align-items:center;justify-content:space-between;
  position:relative;overflow:hidden;
}
.hd-circle1{position:absolute;top:-55px;right:-55px;width:175px;height:175px;border-radius:50%;background:rgba(255,255,255,.04);pointer-events:none}
.hd-circle2{position:absolute;bottom:-38px;left:150px;width:115px;height:115px;border-radius:50%;background:rgba(48,178,181,.09);pointer-events:none}
.hd-caduceus{
  position:absolute;right:195px;top:4px;
  font-size:76px;color:rgba(255,255,255,.04);
  pointer-events:none;letter-spacing:-6px;line-height:1;
}

.hd-left{display:flex;align-items:center;gap:14px;position:relative;z-index:1}
.hd-logo-wrap{
  width:52px;height:52px;border-radius:10px;
  background:#fff;border:2px solid rgba(255,255,255,.5);
  box-shadow:0 4px 14px rgba(0,0,0,.28);
  display:flex;align-items:center;justify-content:center;
  overflow:hidden;flex-shrink:0;
}
.hd-logo-wrap img{width:100%;height:100%;object-fit:contain}

.hd-clinic-name{
  font-family:'Cormorant Garamond',Georgia,serif;
  font-size:18px;font-weight:700;color:#fff;
  letter-spacing:.3px;line-height:1.2;margin:0 0 2px;
}
.hd-clinic-addr{
  font-size:9px;color:rgba(255,255,255,.58);
  line-height:1.55;max-width:240px;
}

.hd-right{text-align:right;position:relative;z-index:1}
.hd-form-title{
  font-family:'Cormorant Garamond',Georgia,serif;
  font-size:17px;font-weight:700;color:#fff;
  letter-spacing:3px;text-transform:uppercase;
}
.hd-form-sub{
  font-size:7.5px;color:rgba(255,255,255,.48);
  letter-spacing:3px;text-transform:uppercase;margin-top:3px;
}
.hd-ref-block{
  margin-top:10px;
  border:1px solid rgba(255,255,255,.17);
  border-radius:5px;padding:7px 12px;
  background:rgba(255,255,255,.06);
  display:inline-block;text-align:left;
  min-width:155px;
}
.hd-ref-row{
  display:flex;align-items:center;justify-content:space-between;gap:16px;
}
.hd-ref-row+.hd-ref-row{
  margin-top:4px;padding-top:4px;
  border-top:1px solid rgba(255,255,255,.09);
}
.hd-ref-label{font-size:7.5px;color:rgba(255,255,255,.42);text-transform:uppercase;letter-spacing:.8px;white-space:nowrap}
.hd-ref-value{font-size:10px;color:#fff;font-weight:700;letter-spacing:.3px}

/* ── ACCENT LINE ── */
.accent-bar{
  height:2px;
  background:linear-gradient(90deg,#30b2b5,#0d7aa8,#1a3a8f,#0f2057);
  flex-shrink:0;position:relative;z-index:1;
}

/* ── STATUS STRIP ── */
.status-ribbon{
  background:#eef5fb;
  border-bottom:1.5px solid #c8ddef;
  padding:7px 28px;
  display:flex;align-items:center;justify-content:space-between;
  flex-shrink:0;position:relative;z-index:1;
}
.status-ribbon-left{display:flex;align-items:center;gap:7px}
.status-ribbon-right{font-size:9.5px;color:#4a6a8a;font-weight:500}

/* BADGES */
.badge{
  display:inline-flex;align-items:center;gap:4px;
  padding:3px 9px;border-radius:3px;
  font-size:8px;font-weight:700;letter-spacing:.9px;text-transform:uppercase;border:1px solid;
}
.badge-pending  {background:rgba(234,179,8,.11);color:#92670a;border-color:rgba(234,179,8,.32)}
.badge-completed{background:rgba(22,163,74,.09);color:#166534;border-color:rgba(22,163,74,.28)}
.badge-cancelled{background:rgba(220,38,38,.09);color:#991b1b;border-color:rgba(220,38,38,.26)}
.badge-invoice  {background:rgba(13,122,168,.10);color:#0d5e82;border-color:rgba(13,122,168,.26)}
.badge-progress {background:rgba(139,92,246,.09);color:#5b21b6;border-color:rgba(139,92,246,.26)}
.badge-normal   {background:rgba(15,32,87,.08);color:#0f2057;border-color:rgba(15,32,87,.20)}
.badge-urgent   {background:rgba(234,88,12,.10);color:#c2410c;border-color:rgba(234,88,12,.26)}
.badge-stat     {background:rgba(220,38,38,.13);color:#991b1b;border-color:rgba(220,38,38,.38)}
.badge-urgent::before,.badge-stat::before{
  content:'';width:5px;height:5px;border-radius:50%;flex-shrink:0;
}
.badge-urgent::before{background:#c2410c}
.badge-stat::before{background:#991b1b}

/* ══════════════════════════════
   FORM BODY
══════════════════════════════ */
.form-body{
  padding:11px 28px 0;
  flex-shrink:0;position:relative;z-index:1;
}

/* section header */
.section-title{
  display:flex;align-items:center;gap:7px;margin-bottom:7px;
}
.section-bar{
  width:3px;height:12px;
  background:linear-gradient(180deg,#0f2057,#0d7aa8);
  border-radius:2px;flex-shrink:0;
}
.section-text{
  font-family:'Cormorant Garamond',serif;
  font-size:11px;font-weight:700;color:#0f2057;
  letter-spacing:.5px;text-transform:uppercase;
}
.section-line{flex:1;height:1px;background:linear-gradient(90deg,#b8d0e5,transparent)}

/* field grid — requisition form look */
.field-grid{
  display:grid;grid-template-columns:1fr 1fr 1fr;
  border:1.5px solid #c0d4e4;border-radius:6px;overflow:hidden;
  margin-bottom:9px;
}

/* dark header row spanning full width */
.fg-header{
  grid-column:span 3;
  background:linear-gradient(135deg,#0f2057,#1a3a8f);
  padding:5px 11px;border-bottom:1.5px solid #0d7aa8;
}
.fg-header-text{
  font-size:7.5px;font-weight:700;color:rgba(255,255,255,.86);
  text-transform:uppercase;letter-spacing:1.5px;
}

.fc{
  padding:6px 10px;
  border-right:1px solid #c0d4e4;
  border-bottom:1px solid #c0d4e4;
}
.fc.no-right{border-right:none}
.fc.no-bottom{border-bottom:none}
.fc.span2{grid-column:span 2}
.fc.span3{grid-column:span 3;border-right:none}

.fl{font-size:7.5px;font-weight:700;color:#0d7aa8;text-transform:uppercase;letter-spacing:.8px;margin-bottom:3px}
.fv{font-size:10.5px;font-weight:600;color:#0f2057;line-height:1.3;min-height:14px;word-break:break-word}
.fv-lg{font-size:12px;font-weight:700}
.fv-muted{color:#4a6a8a;font-weight:500}

/* ══════════════════════════════
   TESTS TABLE SECTION
══════════════════════════════ */
.tests-section{
  padding:0 28px 8px;
  flex-shrink:0;position:relative;z-index:1;
}

.table-wrap{
  border:1.5px solid #c0d4e4;border-radius:6px;overflow:hidden;
}

.req-table{width:100%;border-collapse:collapse;font-size:10.5px}
.req-table thead tr{
  background:linear-gradient(135deg,#0f2057 0%,#1a3a8f 55%,#0d7aa8 100%);
  -webkit-print-color-adjust:exact;print-color-adjust:exact;
}
.req-table thead th{
  padding:8px 11px;
  color:rgba(255,255,255,.90);font-weight:700;
  font-size:8px;text-transform:uppercase;letter-spacing:.9px;
  text-align:left;border:none;font-family:'Plus Jakarta Sans',sans-serif;
}
.th-no{text-align:center;width:34px}
.th-type{width:78px}

.req-table tbody tr{border-bottom:1px solid #deeaf5}
.req-table tbody tr:nth-child(even):not(.pkg-row){background:#f4f9fd}
.req-table tbody tr:last-child{border-bottom:none}
.req-table tbody td{padding:6px 11px;vertical-align:middle}

.td-no{text-align:center;color:#7a9ab8;font-size:9.5px;font-weight:700;width:34px}
.td-name{font-weight:600;font-size:10.5px;color:#0f2057}
.td-type{width:78px}
.td-empty{text-align:center;padding:18px;color:#7a9ab8;font-style:italic;font-size:10.5px}

/* type pill */
.type-pill{
  display:inline-block;padding:2px 7px;border-radius:3px;
  font-size:7.5px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;
}
.type-test{background:rgba(13,122,168,.10);color:#0d7aa8;border:1px solid rgba(13,122,168,.20)}
.type-pkg {background:rgba(15,32,87,.09);color:#0f2057;border:1px solid rgba(15,32,87,.18)}

/* package header row */
.pkg-row{
  background:linear-gradient(90deg,#e8f2fb,#f4f9fd)!important;
  border-top:1.5px solid #b0ccdf!important;
  border-bottom:1px solid #b0ccdf!important;
  -webkit-print-color-adjust:exact;print-color-adjust:exact;
}
.pkg-cell{padding:7px 11px!important}
.pkg-inner{display:flex;align-items:center;gap:7px}
.pkg-chevron{font-size:9px;color:#0d7aa8;flex-shrink:0}
.pkg-label{
  font-family:'Cormorant Garamond',serif;
  font-size:12px;font-weight:700;color:#0f2057;flex:1;
}
.pkg-count-pill{
  display:inline-block;padding:1px 7px;border-radius:10px;
  font-size:7.5px;font-weight:700;
  background:rgba(13,122,168,.11);color:#0d7aa8;
  border:1px solid rgba(13,122,168,.20);
}

/* sub-test rows */
.sub-row td{background:transparent}
.sub-row .td-no{color:#a8c4d8;font-size:9px}
.sub-row .td-name{
  color:#1a3a6a;font-weight:500;font-size:10px;
}

/* ══ NOTES ══ */
.notes-box{
  margin:0 28px 8px;
  border:1.5px solid #c0d4e4;border-radius:6px;overflow:hidden;
  flex-shrink:0;position:relative;z-index:1;
}
.notes-hdr{
  background:linear-gradient(135deg,#0f2057,#1a3a8f);
  padding:5px 11px;
}
.notes-hdr-text{
  font-size:7.5px;font-weight:700;color:rgba(255,255,255,.86);
  text-transform:uppercase;letter-spacing:1.5px;
}
.notes-body{
  padding:8px 11px;
  font-size:10px;color:#1a3060;line-height:1.65;
  background:#f6fbff;min-height:26px;
}

/* ══ SPACER ══ */
.pg-spacer{flex:1;min-height:6px;position:relative;z-index:1}

/* ══ SIGN ROW ══ */
.sign-row{
  margin:0 28px 10px;
  display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;
  flex-shrink:0;position:relative;z-index:1;
}
.sign-block{text-align:center}
.sign-line{
  height:1px;
  background:linear-gradient(90deg,transparent,#0d7aa8 30%,#0d7aa8 70%,transparent);
  margin-bottom:5px;
}
.sign-label{font-size:7.5px;color:#4a6a8a;font-weight:600;text-transform:uppercase;letter-spacing:.7px}

/* ══ FOOTER ══ */
.doc-footer{flex-shrink:0;position:relative;z-index:1}
.footer-accent{height:2px;background:linear-gradient(90deg,#0f2057,#0d7aa8,#30b2b5)}
.footer-inner{
  background:#0f2057;padding:8px 28px;
  display:flex;align-items:center;justify-content:space-between;
}
.footer-left{font-size:8.5px;color:rgba(255,255,255,.52);line-height:1.7}
.footer-left strong{color:rgba(255,255,255,.78);font-weight:600}
.footer-right{
  font-size:7.5px;color:rgba(255,255,255,.32);
  text-align:right;line-height:1.6;
}

/* ══ WATERMARK ══ */
.watermark{
  position:absolute;bottom:65px;right:18px;
  font-family:'Cormorant Garamond',serif;
  font-size:105px;color:rgba(13,122,168,.032);
  font-style:italic;pointer-events:none;user-select:none;
  transform:rotate(-20deg);letter-spacing:-5px;line-height:1;z-index:0;
}
`;

/* ═══════════════════════════════════════════════════════════
   buildDocumentHtml
═══════════════════════════════════════════════════════════ */
const buildDocumentHtml = ({ order, orderItems, packageTests, logoDataUrl, clinicInfo }) => {
  const statusMap   = { 1:'badge-pending', 2:'badge-completed', 3:'badge-cancelled', 4:'badge-invoice', 5:'badge-progress' };
  const priorityMap = { 1:'badge-normal', 2:'badge-urgent', 3:'badge-stat' };
  const esc = (v) => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const sC  = (s) => `badge ${statusMap[s]   ?? 'badge-normal'}`;
  const pC  = (p) => `badge ${priorityMap[p] ?? 'badge-normal'}`;

  const clinicName = esc(clinicInfo?.name  || order.clinicName || 'Clinic Name');
  const clinicAddr = esc(clinicInfo?.address || order.branchName || '');
  const phone1 = esc(clinicInfo?.mobile    || '');
  const phone2 = esc(clinicInfo?.altMobile || '');
  const email  = esc(clinicInfo?.email     || '');
  const gstNo  = esc(clinicInfo?.gstNo     || '');
  const refNo  = esc(order.uniqueSeq || String(order.id).padStart(6,'0'));

  const ribbonItems = [
    phone1 && `<span class="ribbon-item"><span class="ribbon-icon">✆</span>${phone1}</span>`,
    phone2 && `<span class="ribbon-item"><span class="ribbon-icon">✆</span>${phone2}</span>`,
    email  && `<span class="ribbon-item"><span class="ribbon-icon">@</span>${email}</span>`,
  ].filter(Boolean).join('');

  const isPackageItem = (i) => i.testType === 2 || i.isPackage === true || !!i.packageId;
  const getPkgKey     = (i) => i.packageId || i.testId || i.itemId;

  let rows = ''; let n = 1;
  if (!orderItems?.length) {
    rows = `<tr><td colspan="3" class="td-empty">No test items found for this order</td></tr>`;
  } else {
    orderItems.forEach(item => {
      const isPkg = isPackageItem(item);
      const subs  = isPkg ? (packageTests[getPkgKey(item)] || []) : [];
      if (isPkg) {
        rows += `<tr class="pkg-row">
          <td class="pkg-cell" colspan="3">
            <div class="pkg-inner">
              <span class="pkg-chevron">&#9654;</span>
              <span class="pkg-label">${esc(item.testOrPackageName)}</span>
              <span class="type-pill type-pkg">Package</span>
              ${subs.length ? `<span class="pkg-count-pill">${subs.length} Tests</span>` : ''}
            </div>
          </td></tr>`;
        subs.forEach(t => {
          rows += `<tr class="sub-row">
            <td class="td-no">${n++}</td>
            <td class="td-name" style="padding-left:22px">${esc(t.testName)}</td>
            <td class="td-type"><span class="type-pill type-test">Test</span></td>
          </tr>`;
        });
      } else {
        rows += `<tr>
          <td class="td-no">${n++}</td>
          <td class="td-name">${esc(item.testOrPackageName)}</td>
          <td class="td-type"><span class="type-pill type-test">Test</span></td>
        </tr>`;
      }
    });
  }

  const notesHtml = order.notes ? `
    <div class="notes-box">
      <div class="notes-hdr"><span class="notes-hdr-text">Clinical Notes &amp; Instructions</span></div>
      <div class="notes-body">${esc(order.notes)}</div>
    </div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Lab Requisition — ${esc(order.patientName || '')}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>${PRINT_CSS}</style>
</head>
<body>
<div class="page">

  <div class="doc-header">
    <div class="header-stripe"></div>
    <div class="header-ribbon">
      <div class="ribbon-contacts">${ribbonItems}</div>
      <div class="ribbon-right">${gstNo ? 'GST: ' + gstNo : ''}</div>
    </div>
    <div class="header-main">
      <div class="hd-circle1"></div><div class="hd-circle2"></div>
      <div class="hd-caduceus">⚕</div>
      <div class="hd-left">
        <div class="hd-logo-wrap"><img src="${logoDataUrl}" alt="logo"/></div>
        <div>
          <div class="hd-clinic-name">${clinicName}</div>
          <div class="hd-clinic-addr">${clinicAddr}</div>
        </div>
      </div>
      <div class="hd-right">
        <div class="hd-form-title">Lab Requisition</div>
        <div class="hd-form-sub">Laboratory Test Request Form</div>
        <div class="hd-ref-block">
          <div class="hd-ref-row"><span class="hd-ref-label">Req. No.</span><span class="hd-ref-value">${refNo}</span></div>
          <div class="hd-ref-row"><span class="hd-ref-label">Date</span><span class="hd-ref-value">${esc(fmt(order.dateCreated))}</span></div>
        </div>
      </div>
    </div>
  </div>
  <div class="accent-bar"></div>

  <div class="status-ribbon">
    <div class="status-ribbon-left">
      <span class="${sC(order.status)}">${esc(STATUS_LABELS[order.status] || '—')}</span>
      <span class="${pC(order.priority)}">${esc(PRIORITY_LABELS[order.priority] || 'Normal')}</span>
    </div>
    <div class="status-ribbon-right">Issued: ${esc(fmt(order.dateCreated))}</div>
  </div>

  <div class="form-body">

    <div class="section-title">
      <div class="section-bar"></div>
      <div class="section-text">Patient Details</div>
      <div class="section-line"></div>
    </div>
    <div class="field-grid">
      <div class="fg-header"><span class="fg-header-text">Patient Information</span></div>
      <div class="fc"><div class="fl">Full Name</div><div class="fv fv-lg">${esc(order.patientName || '—')}</div></div>
      <div class="fc"><div class="fl">File No.</div><div class="fv">${esc(order.patientFileNo || '—')}</div></div>
      <div class="fc no-right no-bottom"><div class="fl">Mobile</div><div class="fv">${esc(order.patientMobile || '—')}</div></div>
      <div class="fc no-bottom"><div class="fl">Consultation ID</div><div class="fv fv-muted">${esc(order.consultationId || '—')}</div></div>
      <div class="fc no-bottom"><div class="fl">Visit ID</div><div class="fv fv-muted">${esc(order.visitId || '—')}</div></div>
      <div class="fc no-right no-bottom"><div class="fl">Branch</div><div class="fv fv-muted">${esc(order.branchName || '—')}</div></div>
    </div>

    <div class="section-title">
      <div class="section-bar"></div>
      <div class="section-text">Clinical Details</div>
      <div class="section-line"></div>
    </div>
    <div class="field-grid">
      <div class="fg-header"><span class="fg-header-text">Ordering Physician &amp; Order Information</span></div>
      <div class="fc span2"><div class="fl">Ordering Doctor</div><div class="fv fv-lg">${esc(order.doctorFullName || '—')}</div></div>
      <div class="fc no-right no-bottom"><div class="fl">Doctor Code</div><div class="fv fv-muted">${esc(order.doctorCode || '—')}</div></div>
      <div class="fc no-bottom"><div class="fl">Order Date</div><div class="fv">${esc(fmt(order.dateCreated))}</div></div>
      <div class="fc no-bottom"><div class="fl">Priority</div><div class="fv">${esc(PRIORITY_LABELS[order.priority] || 'Normal')}</div></div>
      <div class="fc no-right no-bottom"><div class="fl">Status</div><div class="fv">${esc(STATUS_LABELS[order.status] || '—')}</div></div>
    </div>

  </div>

  <div class="tests-section">
    <div class="section-title">
      <div class="section-bar"></div>
      <div class="section-text">Ordered Tests &amp; Packages</div>
      <div class="section-line"></div>
    </div>
    <div class="table-wrap">
      <table class="req-table">
        <thead><tr>
          <th class="th-no">#</th>
          <th>Test / Package Name</th>
          <th class="th-type">Type</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>

  ${notesHtml}
  <div class="pg-spacer"></div>

  <div class="sign-row">
    <div class="sign-block"><div class="sign-line"></div><div class="sign-label">Sample Collected By</div></div>
    <div class="sign-block"><div class="sign-line"></div><div class="sign-label">Lab Technician</div></div>
    <div class="sign-block"><div class="sign-line"></div><div class="sign-label">Authorized Signatory</div></div>
  </div>

  <div class="doc-footer">
    <div class="footer-accent"></div>
    <div class="footer-inner">
      <div class="footer-left">
        <div><strong>Clinic:</strong> ${clinicName} &nbsp;·&nbsp; <strong>Branch:</strong> ${esc(order.branchName || '—')}</div>
        ${gstNo ? `<div><strong>GST No:</strong> ${gstNo}</div>` : ''}
        <div>Generated: ${esc(fmt(new Date().toISOString()))}</div>
      </div>
      <div class="footer-right">
        This document is computer generated and valid without a physical seal.<br/>
        Confidential — For authorized medical use only.
      </div>
    </div>
  </div>

  <div class="watermark">Rx</div>
</div>
</body>
</html>`;
};

/* ═══════════════════════════════════════════════════════════
   REACT COMPONENT
═══════════════════════════════════════════════════════════ */
const LabOrderPrintModal = ({ order, orderItems, onClose }) => {
  const printRef = useRef(null);
  const [logoDataUrl,     setLogoDataUrl]     = useState(cpLogo);
  const [packageTests,    setPackageTests]    = useState({});
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [clinicInfo,      setClinicInfo]      = useState(null);

  /* logo → base64 */
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth || img.width;
      c.height = img.naturalHeight || img.height;
      c.getContext('2d').drawImage(img, 0, 0);
      try { setLogoDataUrl(c.toDataURL('image/png')); } catch {}
    };
    img.src = cpLogo;
  }, []);

  /* fetch clinic info */
  useEffect(() => {
    const run = async () => {
      try {
        const clinicId = await getStoredClinicId();
        if (!clinicId) return;
        const res = await getClinicList({ ClinicID: clinicId, Page: 1, PageSize: 1 });
        if (res?.length) setClinicInfo(res[0]);
      } catch (e) { console.error('clinic fetch:', e); }
    };
    run();
  }, []);

  /* fetch package sub-tests */
  useEffect(() => {
    if (!orderItems?.length) return;
    const pkgItems = orderItems.filter(i => i.testType === 2 || i.isPackage === true || i.packageId);
    if (!pkgItems.length) return;
    const run = async () => {
      setLoadingPackages(true);
      try {
        const clinicId = await getStoredClinicId();
        const branchId = await getStoredBranchId();
        const settled  = await Promise.allSettled(
          pkgItems.map(async item => {
            const pkgId = item.packageId || item.testId || item.itemId;
            const tests = await getLabTestPackageItemList({ ClinicID: clinicId, BranchID: branchId, packageId: pkgId });
            return { pkgId, tests };
          })
        );
        const map = {};
        settled.forEach(r => { if (r.status === 'fulfilled') map[r.value.pkgId] = r.value.tests; });
        setPackageTests(map);
      } catch (e) { console.error('pkg fetch:', e); }
      finally { setLoadingPackages(false); }
    };
    run();
  }, [orderItems]);

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=920,height=780');
    win.document.write(buildDocumentHtml({ order, orderItems, packageTests, logoDataUrl, clinicInfo }));
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 900);
  };

  const isPackageItem = (i) => i.testType === 2 || i.isPackage === true || !!i.packageId;
  const getPkgKey     = (i) => i.packageId || i.testId || i.itemId;

  const buildRows = () => {
    const rows = []; let n = 1;
    orderItems.forEach(item => {
      const isPkg = isPackageItem(item);
      const subs  = isPkg ? (packageTests[getPkgKey(item)] || []) : [];
      if (isPkg) {
        rows.push(
          <tr key={`ph-${item.itemId}`} className={styles.pkgRow}>
            <td colSpan={3} className={styles.pkgCell}>
              <div className={styles.pkgInner}>
                <span className={styles.pkgChevron}>▶</span>
                <span className={styles.pkgLabel}>{item.testOrPackageName}</span>
                <span className={`${styles.typePill} ${styles.typePkg}`}>Package</span>
              </div>
            </td>
          </tr>
        );
        subs.forEach((t, si) => rows.push(
          <tr key={`ps-${item.itemId}-${si}`} className={styles.subRow}>
            <td className={styles.tdNo}>{n++}</td>
            <td className={`${styles.tdName} ${styles.tdNameIndent}`}>{t.testName}</td>
            <td className={styles.tdType}><span className={`${styles.typePill} ${styles.typeTest}`}>Test</span></td>
          </tr>
        ));
      } else {
        rows.push(
          <tr key={`t-${item.itemId}`}>
            <td className={styles.tdNo}>{n++}</td>
            <td className={styles.tdName}>{item.testOrPackageName}</td>
            <td className={styles.tdType}><span className={`${styles.typePill} ${styles.typeTest}`}>Test</span></td>
          </tr>
        );
      }
    });
    return rows;
  };

  const clinicName = clinicInfo?.name || order.clinicName || 'Clinic Name';
  const clinicAddr = clinicInfo?.address || order.branchName || '';

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        {/* TOP BAR */}
        <div className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <div className={styles.topBarIcon}><FiPrinter size={18}/></div>
            <div>
              <div className={styles.topBarTitle}>Lab Requisition Preview</div>
              <div className={styles.topBarSub}>A4 · Lab Test Requisition Form</div>
            </div>
          </div>
          <div className={styles.topBarActions}>
            <button className={styles.printBtn} onClick={handlePrint}>
              <FiPrinter size={15}/><span>Print</span>
            </button>
            <button className={styles.closeBtn} onClick={onClose}><FiX size={19}/></button>
          </div>
        </div>

        {/* PREVIEW AREA */}
        <div className={styles.previewArea}>
          <div className={styles.paper} ref={printRef}>
            <div className={styles.page}>

              {/* ── HEADER ── */}
              <div className={styles.docHeader}>
                <div className={styles.headerStripe}/>
                <div className={styles.headerRibbon}>
                  <div className={styles.ribbonContacts}>
                    {clinicInfo?.mobile    && <span className={styles.ribbonItem}><span className={styles.ribbonIcon}>✆</span>{clinicInfo.mobile}</span>}
                    {clinicInfo?.altMobile && <span className={styles.ribbonItem}><span className={styles.ribbonIcon}>✆</span>{clinicInfo.altMobile}</span>}
                    {clinicInfo?.email     && <span className={styles.ribbonItem}><span className={styles.ribbonIcon}>@</span>{clinicInfo.email}</span>}
                  </div>
                  <div className={styles.ribbonRight}>{clinicInfo?.gstNo ? `GST: ${clinicInfo.gstNo}` : ''}</div>
                </div>
                <div className={styles.headerMain}>
                  <div className={styles.hdCircle1}/><div className={styles.hdCircle2}/>
                  <div className={styles.hdCaduceus}>⚕</div>
                  <div className={styles.hdLeft}>
                    <div className={styles.hdLogoWrap}>
                      <img src={logoDataUrl} alt="logo" className={styles.hdLogoImg}/>
                    </div>
                    <div className={styles.hdClinicInfo}>
                      <div className={styles.hdClinicName}>{clinicName}</div>
                      {clinicAddr && <div className={styles.hdClinicAddr}>{clinicAddr}</div>}
                    </div>
                  </div>
                  <div className={styles.hdRight}>
                    <div className={styles.hdFormTitle}>Lab Requisition</div>
                    <div className={styles.hdFormSub}>Laboratory Test Request Form</div>
                    <div className={styles.hdRefBlock}>
                      <div className={styles.hdRefRow}>
                        <span className={styles.hdRefLabel}>Req. No.</span>
                        <span className={styles.hdRefValue}>{order.uniqueSeq || String(order.id).padStart(6,'0')}</span>
                      </div>
                      <div className={styles.hdRefRow}>
                        <span className={styles.hdRefLabel}>Date</span>
                        <span className={styles.hdRefValue}>{fmt(order.dateCreated)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.accentBar}/>

              {/* STATUS STRIP */}
              <div className={styles.statusRibbon}>
                <div className={styles.statusRibbonLeft}>
                  <span className={priorityBadgeClass(order.priority, styles)}>{PRIORITY_LABELS[order.priority] || 'Normal'}</span>
                </div>
                <div className={styles.statusRibbonRight}>Issued: {fmt(order.dateCreated)}</div>
              </div>

              {/* FORM BODY */}
              <div className={styles.formBody}>

                {/* Patient */}
                <div className={styles.sectionTitle}>
                  <div className={styles.sectionBar}/><div className={styles.sectionText}>Patient Details</div><div className={styles.sectionLine}/>
                </div>
                <div className={styles.fieldGrid}>
                  <div className={`${styles.fgHeader}`} style={{gridColumn:'span 3'}}>
                    <span className={styles.fgHeaderText}>Patient Information</span>
                  </div>
                  <div className={styles.fc}>
                    <div className={styles.fl}>Full Name</div>
                    <div className={`${styles.fv} ${styles.fvLg}`}>{order.patientName || '—'}</div>
                  </div>
                  <div className={styles.fc}>
                    <div className={styles.fl}>File No.</div>
                    <div className={styles.fv}>{order.patientFileNo || '—'}</div>
                  </div>
                  <div className={`${styles.fc} ${styles.noRight} ${styles.noBottom}`}>
                    <div className={styles.fl}>Mobile</div>
                    <div className={styles.fv}>{order.patientMobile || '—'}</div>
                  </div>
                  <div className={`${styles.fc} ${styles.noBottom}`}>
                    <div className={styles.fl}>Consultation ID</div>
                    <div className={`${styles.fv} ${styles.fvMuted}`}>{order.consultationId || '—'}</div>
                  </div>
                  <div className={`${styles.fc} ${styles.noBottom}`}>
                    <div className={styles.fl}>Visit ID</div>
                    <div className={`${styles.fv} ${styles.fvMuted}`}>{order.visitId || '—'}</div>
                  </div>
                  <div className={`${styles.fc} ${styles.noRight} ${styles.noBottom}`}>
                    <div className={styles.fl}>Branch</div>
                    <div className={`${styles.fv} ${styles.fvMuted}`}>{order.branchName || '—'}</div>
                  </div>
                </div>

                {/* Clinical */}
                <div className={styles.sectionTitle}>
                  <div className={styles.sectionBar}/><div className={styles.sectionText}>Clinical Details</div><div className={styles.sectionLine}/>
                </div>
                <div className={styles.fieldGrid}>
                  <div className={styles.fgHeader} style={{gridColumn:'span 3'}}>
                    <span className={styles.fgHeaderText}>Ordering Physician &amp; Order Information</span>
                  </div>
                  <div className={`${styles.fc} ${styles.span2}`}>
                    <div className={styles.fl}>Ordering Doctor</div>
                    <div className={`${styles.fv} ${styles.fvLg}`}>{order.doctorFullName || '—'}</div>
                  </div>
                  <div className={`${styles.fc} ${styles.noRight} ${styles.noBottom}`}>
                    <div className={styles.fl}>Doctor Code</div>
                    <div className={`${styles.fv} ${styles.fvMuted}`}>{order.doctorCode || '—'}</div>
                  </div>
                  <div className={`${styles.fc} ${styles.noBottom}`}>
                    <div className={styles.fl}>Order Date</div>
                    <div className={styles.fv}>{fmt(order.dateCreated)}</div>
                  </div>
                  <div className={`${styles.fc} ${styles.noBottom}`}>
                    <div className={styles.fl}>Priority</div>
                    <div className={styles.fv}>{PRIORITY_LABELS[order.priority] || 'Normal'}</div>
                  </div>
                  <div className={`${styles.fc} ${styles.noRight} ${styles.noBottom}`}>
                    <div className={styles.fl}>Status</div>
                    <div className={styles.fv}>{STATUS_LABELS[order.status] || '—'}</div>
                  </div>
                </div>

              </div>

              <div className={styles.testsSection}>
                <div className={styles.sectionTitle}>
                  <div className={styles.sectionBar}/><div className={styles.sectionText}>Ordered Tests &amp; Packages</div><div className={styles.sectionLine}/>
                </div>
                {loadingPackages ? (
                  <div className={styles.loadingRow}>Loading package details…</div>
                ) : (
                  <div className={styles.tableWrap}>
                    <table className={styles.reqTable}>
                      <thead>
                        <tr>
                          <th className={styles.thNo}>#</th>
                          <th>Test / Package Name</th>
                          <th className={styles.thType}>Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderItems.length === 0
                          ? <tr><td colSpan={3} className={styles.tdEmpty}>No test items found for this order</td></tr>
                          : buildRows()
                        }
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* NOTES */}
              {order.notes && (
                <div className={styles.notesBox}>
                  <div className={styles.notesHdr}><span className={styles.notesHdrText}>Clinical Notes &amp; Instructions</span></div>
                  <div className={styles.notesBody}>{order.notes}</div>
                </div>
              )}

              <div className={styles.pgSpacer}/>

              {/* SIGN ROW */}
              <div className={styles.signRow}>
                {['','','Authorized Signatory'].map(lbl => (
                  <div key={lbl} className={styles.signBlock}>
                    <div className={styles.signLine}/><div className={styles.signLabel}>{lbl}</div>
                  </div>
                ))}
              </div>

              {/* FOOTER */}
              <div className={styles.docFooter}>
                <div className={styles.footerAccent}/>
                <div className={styles.footerInner}>
                  <div className={styles.footerLeft}>
                    <div><strong>Clinic:</strong> {clinicName} &nbsp;·&nbsp; <strong>Branch:</strong> {order.branchName || '—'}</div>
                    {clinicInfo?.gstNo && <div><strong>GST No:</strong> {clinicInfo.gstNo}</div>}
                    <div>Generated: {fmt(new Date().toISOString())}</div>
                  </div>
                  <div className={styles.footerRight}>
                    This document is computer generated and valid without a physical seal.<br/>
                    Confidential — For authorized medical use only.
                  </div>
                </div>
              </div>

              <div className={styles.watermark}>Rx</div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LabOrderPrintModal;