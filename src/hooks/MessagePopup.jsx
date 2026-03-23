// src/components/MessagePopup.jsx
import React, { useEffect, useRef } from 'react';

const MessagePopup = ({ visible, message, type = 'success', onClose }) => {

  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    if (visible && type === 'success') {
      const timer = setTimeout(() => onCloseRef.current(), 1000);
      return () => clearTimeout(timer);
    }
  }, [visible, type]); // ← intentionally excludes onClose

  if (!visible || !message) return null;

  const config = {
    success: {
      barColor:   'linear-gradient(90deg, #207d9c, #30b2b5)',
      iconBg:     'rgba(48, 178, 181, 0.12)',
      iconStroke: '#207d9c',
      btnBg:      'linear-gradient(90deg, #207d9c, #30b2b5)',
      label: 'Success',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M3.5 9.5L7.5 13.5L14.5 5.5"
            stroke="#207d9c"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    error: {
      barColor:   'linear-gradient(90deg, #c0392b, #e74c3c)',
      iconBg:     'rgba(231, 76, 60, 0.10)',
      iconStroke: '#c0392b',
      btnBg:      'linear-gradient(90deg, #c0392b, #e74c3c)',
      label: 'Error',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="7" stroke="#c0392b" strokeWidth="1.8" />
          <path
            d="M9 5.5V9.5M9 11.5V12"
            stroke="#c0392b"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    warning: {
      barColor:   'linear-gradient(90deg, #222b6c, #225ca0)',
      iconBg:     'rgba(34, 43, 108, 0.10)',
      iconStroke: '#222b6c',
      btnBg:      'linear-gradient(90deg, #222b6c, #225ca0)',
      label: 'Warning',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M9 2.5L16 15H2L9 2.5Z"
            stroke="#222b6c"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M9 8V11M9 12.5V13"
            stroke="#222b6c"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
  };

  const { barColor, iconBg, btnBg, label, icon } = config[type] ?? config.error;

  return (
    <>
      <style>{`
        @keyframes mp-grow {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes mp-fadein {
          from { opacity: 0; transform: translateY(-12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)     scale(1);    }
        }
      `}</style>

      {/* ── Backdrop ── */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(34, 43, 108, 0.32)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
      >
        {/* ── Card ── */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            width: '100%',
            maxWidth: '420px',
            margin: '0 1rem',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(34, 43, 108, 0.18)',
            animation: 'mp-fadein 0.22s ease-out forwards',
          }}
        >
          {/* Gradient accent bar */}
          <div style={{ height: '4px', background: barColor }} />

          {/* Body */}
          <div style={{ padding: '1.25rem 1.25rem 1rem' }}>

            {/* Icon + text row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '13px' }}>

              {/* Icon circle */}
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: `1.5px solid ${iconBg}`,
                }}
              >
                {icon}
              </div>

              {/* Title + message */}
              <div style={{ flex: 1, minWidth: 0, paddingTop: '1px' }}>
                <p
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#1e293b',
                    margin: '0 0 4px',
                    lineHeight: 1.4,
                  }}
                >
                  {label}
                </p>
                <p
                  style={{
                    fontSize: '13.5px',
                    color: '#475569',
                    margin: 0,
                    lineHeight: 1.55,
                  }}
                >
                  {message}
                </p>
              </div>
            </div>

            {/* Success: left-to-right growing progress bar */}
            {type === 'success' && (
              <div
                style={{
                  marginTop: '1rem',
                  height: '3px',
                  background: 'rgba(34, 43, 108, 0.08)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    background: barColor,
                    borderRadius: '2px',
                    animation: 'mp-grow 1s linear forwards',
                  }}
                />
              </div>
            )}

            {/* Error / Warning: OK button */}
            {(type === 'error' || type === 'warning') && (
              <div
                style={{
                  marginTop: '1.25rem',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  onClick={onClose}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = '0.88')}
                  onMouseOut={(e)  => (e.currentTarget.style.opacity = '1')}
                  style={{
                    padding: '7px 22px',
                    background: btnBg,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    letterSpacing: '0.02em',
                    transition: 'opacity 0.15s',
                    boxShadow: '0 2px 8px rgba(34,43,108,0.18)',
                  }}
                >
                  OK, got it
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default MessagePopup;