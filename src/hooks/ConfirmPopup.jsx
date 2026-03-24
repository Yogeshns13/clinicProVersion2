// src/components/ConfirmPopup.jsx
import React from 'react';

const ConfirmPopup = ({ visible, message, subMessage, onConfirm, onCancel, confirmLabel = 'Yes, Delete', cancelLabel = 'Cancel' }) => {
  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes cp-fadein {
          from { opacity: 0; transform: translateY(-14px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)     scale(1);    }
        }
        @keyframes cp-shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-5px); }
          40%       { transform: translateX(5px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }
        .cp-card {
          animation: cp-fadein 0.22s ease-out forwards;
        }
        .cp-btn-confirm:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }
        .cp-btn-cancel:hover {
          background: rgba(34, 43, 108, 0.08) !important;
        }
        .cp-btn-confirm, .cp-btn-cancel {
          transition: all 0.16s ease;
        }
      `}</style>

      {/* ── Backdrop ── */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          padding: '20px 20px 20px 260px',
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}
        onClick={onCancel}
      >
        {/* ── Card ── */}
        <div
          className="cp-card"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '400px',
            margin: '0 1rem',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.22), 0 4px 16px rgba(15, 23, 42, 0.10)',
          }}
        >
          {/* Top accent bar — red for danger */}
          <div style={{ height: '4px', background: 'linear-gradient(90deg, #be123c, #f43f5e)' }} />

          {/* Body */}
          <div style={{ padding: '1.5rem 1.5rem 1.25rem' }}>

            {/* Icon + title row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '1rem' }}>

              {/* Trash icon circle */}
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(244, 63, 94, 0.10)',
                  border: '1.5px solid rgba(244, 63, 94, 0.20)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {/* Trash SVG */}
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M3 5H17M8 5V3H12V5M6 5L7 16H13L14 5H6Z"
                    stroke="#f43f5e"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 8.5V13M11 8.5V13"
                    stroke="#f43f5e"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Text */}
              <div style={{ flex: 1, paddingTop: '2px' }}>
                <p style={{
                  margin: '0 0 5px',
                  fontSize: '15.5px',
                  fontWeight: 700,
                  color: '#0f172a',
                  lineHeight: 1.35,
                }}>
                  {message || 'Are you sure?'}
                </p>
                {subMessage && (
                  <p style={{
                    margin: 0,
                    fontSize: '13px',
                    color: '#64748b',
                    lineHeight: 1.55,
                  }}>
                    {subMessage}
                  </p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: '#f1f5f9', margin: '0 0 1.1rem' }} />

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>

              {/* Cancel */}
              <button
                className="cp-btn-cancel"
                onClick={onCancel}
                style={{
                  padding: '8px 20px',
                  background: 'transparent',
                  color: '#475569',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '9px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  letterSpacing: '0.01em',
                }}
              >
                {cancelLabel}
              </button>

              {/* Confirm / Delete */}
              <button
                className="cp-btn-confirm"
                onClick={onConfirm}
                style={{
                  padding: '8px 20px',
                  background: 'linear-gradient(135deg, #be123c, #f43f5e)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  letterSpacing: '0.01em',
                  boxShadow: '0 3px 10px rgba(244, 63, 94, 0.30)',
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmPopup;