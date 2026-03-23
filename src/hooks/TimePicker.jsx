// src/components/TimePicker.jsx
// ─────────────────────────────────────────────────────────────────────────────
// TimePicker — self-contained clock modal for picking HH:MM in 12-hour mode.
//
// Props:
//   value    {string}   — current value in "HH:MM" (24-hr) format, or ""
//   onChange {function} — called with a synthetic-like event: { target: { name, value } }
//                         where value is "HH:MM" in 24-hr format
//   name     {string}   — field name forwarded in the onChange event
//   label    {string}   — optional label override (unused internally, kept for symmetry)
//
// Usage (drop-in replacement for <input type="time">):
//   <TimePicker
//     name="timeStart"
//     value={formData.timeStart}
//     onChange={handleInputChange}
//   />
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect, useCallback } from "react";

// ── Helpers ──────────────────────────────────────────────────────────────────

// Parse "HH:MM" (24-hr) → { hour12, minute, ampm }
const parse24 = (val) => {
  if (!val) return { hour12: 12, minute: 0, ampm: "AM" };
  const [h, m] = val.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return { hour12, minute: isNaN(m) ? 0 : m, ampm };
};

// Convert 12-hr parts → "HH:MM" (24-hr)
const to24 = (hour12, minute, ampm) => {
  let h = hour12 % 12;
  if (ampm === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

// Format for the trigger button display
const display = (val) => {
  if (!val) return "— : —";
  const { hour12, minute, ampm } = parse24(val);
  return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${ampm}`;
};

// ── Clock face math ───────────────────────────────────────────────────────────
// Returns { x, y } on the clock face for a given value and total count
const clockPos = (value, total, radius) => {
  const angle = (value / total) * 2 * Math.PI - Math.PI / 2;
  return {
    x: 50 + radius * Math.cos(angle),
    y: 50 + radius * Math.sin(angle),
  };
};

// ── CSS (injected once) ───────────────────────────────────────────────────────
const STYLE_ID = "timepicker-styles";
const CSS = `
.tp-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  background: rgba(255,255,255,0.9);
  border: 2px solid rgba(34,43,108,0.15);
  border-radius: 10px;
  color: #1e293b;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: inherit;
  box-sizing: border-box;
  text-align: left;
}
.tp-trigger:hover {
  border-color: #30b2b5;
  box-shadow: 0 0 0 3px rgba(48,178,181,0.14);
}
.tp-trigger.tp-open {
  border-color: #30b2b5;
  box-shadow: 0 0 0 4px rgba(48,178,181,0.15);
  background: white;
}
.tp-trigger-icon {
  width: 16px; height: 16px; flex-shrink: 0; color: #207d9c;
}
.tp-trigger-text { flex: 1; }
.tp-trigger-placeholder { color: rgba(30,41,59,0.35); font-weight: 500; }

.tp-overlay {
  position: fixed; inset: 0;
  background: rgba(34,43,108,0.30);
  backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center;
  z-index: 99999;
  animation: tp-fade-in 0.15s ease;
}
@keyframes tp-fade-in { from { opacity:0 } to { opacity:1 } }

.tp-modal {
  background: white;
  border-radius: 20px;
  width: 300px;
  box-shadow: 0 20px 60px rgba(34,43,108,0.22);
  overflow: hidden;
  animation: tp-slide-up 0.2s cubic-bezier(0.4,0,0.2,1);
}
@keyframes tp-slide-up {
  from { opacity:0; transform:translateY(16px) scale(0.97) }
  to   { opacity:1; transform:translateY(0)    scale(1)    }
}

.tp-header {
  background: linear-gradient(135deg, #225ca0, #30b2b5);
  padding: 16px 20px 14px;
  display: flex; align-items: flex-end; justify-content: center; gap: 4px;
}
.tp-header-seg {
  font-size: 2.8rem; font-weight: 700; color: rgba(255,255,255,0.55);
  line-height: 1; cursor: pointer; border-radius: 10px;
  padding: 2px 8px; transition: all 0.2s ease; user-select: none;
  letter-spacing: -1px;
}
.tp-header-seg.tp-active {
  color: #fff;
  background: rgba(255,255,255,0.2);
}
.tp-header-sep {
  font-size: 2.8rem; font-weight: 700; color: rgba(255,255,255,0.55);
  line-height: 1; padding-bottom: 2px;
}
.tp-ampm-col {
  display: flex; flex-direction: column; gap: 4px;
  margin-left: 6px; margin-bottom: 4px;
}
.tp-ampm-btn {
  background: rgba(255,255,255,0.15); border: none; border-radius: 7px;
  color: rgba(255,255,255,0.55); font-size: 0.75rem; font-weight: 700;
  padding: 4px 8px; cursor: pointer; transition: all 0.2s ease;
}
.tp-ampm-btn.tp-active {
  background: rgba(255,255,255,0.3); color: white;
}

.tp-body { padding: 18px 20px 16px; }

.tp-clock-label {
  text-align: center; font-size: 0.72rem; font-weight: 700;
  color: #207d9c; letter-spacing: 0.06em; text-transform: uppercase;
  margin-bottom: 12px;
}

.tp-clock-wrap {
  position: relative; width: 200px; height: 200px;
  margin: 0 auto 16px;
}
.tp-clock-svg { width: 100%; height: 100%; }

.tp-clock-face { fill: #f0f7ff; }
.tp-clock-center { fill: #207d9c; }
.tp-clock-hand { stroke: #207d9c; stroke-width: 2; stroke-linecap: round; }
.tp-clock-hand-end { fill: #207d9c; }

.tp-clock-num {
  fill: #1e293b; font-size: 8px; font-weight: 600;
  text-anchor: middle; dominant-baseline: central;
  cursor: pointer; user-select: none;
  transition: fill 0.15s;
}
.tp-clock-num.tp-selected { fill: white; }
.tp-clock-num-bg {
  cursor: pointer;
  transition: fill 0.15s, r 0.1s;
}
.tp-clock-num-bg:hover ~ text,
.tp-clock-num-bg:hover + text { fill: white; }

.tp-quick-row {
  display: flex; flex-wrap: wrap; gap: 5px;
  justify-content: center; margin-bottom: 14px;
}
.tp-quick-btn {
  background: #f0f7ff; border: 1.5px solid rgba(34,43,108,0.12);
  border-radius: 7px; color: #1e293b; font-size: 0.7rem; font-weight: 600;
  padding: 4px 9px; cursor: pointer; transition: all 0.2s ease;
}
.tp-quick-btn:hover, .tp-quick-btn.tp-active {
  background: linear-gradient(135deg, #207d9c, #30b2b5);
  border-color: transparent; color: white;
}

.tp-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 0 20px 16px;
}
.tp-btn-cancel {
  padding: 8px 18px; border-radius: 9px; border: 1.5px solid rgba(34,43,108,0.15);
  background: white; color: #475569; font-size: 0.82rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s ease;
}
.tp-btn-cancel:hover { background: #f1f5f9; border-color: #94a3b8; }
.tp-btn-ok {
  padding: 8px 22px; border-radius: 9px; border: none;
  background: linear-gradient(135deg, #207d9c, #30b2b5);
  color: white; font-size: 0.82rem; font-weight: 700;
  cursor: pointer; transition: all 0.2s ease;
  box-shadow: 0 3px 10px rgba(32,125,156,0.3);
}
.tp-btn-ok:hover { box-shadow: 0 5px 16px rgba(32,125,156,0.4); transform: translateY(-1px); }
`;

const injectStyles = () => {
  if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
    const tag = document.createElement("style");
    tag.id = STYLE_ID;
    tag.textContent = CSS;
    document.head.appendChild(tag);
  }
};

// ── Sub-component: ClockFace ──────────────────────────────────────────────────
const HOUR_NUMS  = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MIN_NUMS   = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const MIN_LABELS = ["00","05","10","15","20","25","30","35","40","45","50","55"];

const ClockFace = ({ mode, value, onSelect }) => {
  const items  = mode === "hour" ? HOUR_NUMS : MIN_NUMS;
  const labels = mode === "hour" ? HOUR_NUMS.map(String) : MIN_LABELS;
  const total  = 12;
  const R      = 38; // radius for numbers
  const svgRef = useRef(null);

  const handleSvgClick = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    let angle = Math.atan2(dy, dx) + Math.PI / 2;
    if (angle < 0) angle += 2 * Math.PI;
    const fraction = angle / (2 * Math.PI);
    const index = Math.round(fraction * total) % total;
    onSelect(items[index]);
  }, [items, total, onSelect]);

  // Determine selected index for hand drawing
  const selIndex = mode === "hour"
    ? HOUR_NUMS.indexOf(value)
    : MIN_NUMS.indexOf(value === undefined ? 0 : Math.round(value / 5) * 5);

  const handEnd = selIndex >= 0 ? clockPos(selIndex, total, R - 4) : null;

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      className="tp-clock-svg"
      onClick={handleSvgClick}
    >
      {/* Face */}
      <circle cx="50" cy="50" r="49" className="tp-clock-face" />
      <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(34,43,108,0.08)" strokeWidth="0.5" />

      {/* Hand */}
      {handEnd && (
        <>
          <line
            x1="50" y1="50"
            x2={handEnd.x} y2={handEnd.y}
            className="tp-clock-hand"
          />
          <circle cx={handEnd.x} cy={handEnd.y} r="4.5" className="tp-clock-hand-end" />
        </>
      )}

      {/* Center dot */}
      <circle cx="50" cy="50" r="2.5" className="tp-clock-center" />

      {/* Numbers */}
      {items.map((num, i) => {
        const pos       = clockPos(i, total, R);
        const isSelected = mode === "hour"
          ? num === value
          : num === (Math.round((value ?? 0) / 5) * 5);
        return (
          <g key={num} onClick={(e) => { e.stopPropagation(); onSelect(num); }}>
            <circle
              cx={pos.x} cy={pos.y} r="7"
              fill={isSelected ? "#207d9c" : "transparent"}
              className="tp-clock-num-bg"
            />
            <text
              x={pos.x} y={pos.y}
              className={`tp-clock-num${isSelected ? " tp-selected" : ""}`}
            >
              {labels[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ── Main TimePicker ───────────────────────────────────────────────────────────
const MINUTE_QUICK = [0, 5, 10, 15, 20, 25, 30, 45];

const TimePicker = ({ value, onChange, name }) => {
  injectStyles();

  const { hour12: initH, minute: initM, ampm: initA } = parse24(value);

  const [open,   setOpen]   = useState(false);
  const [mode,   setMode]   = useState("hour"); // "hour" | "minute"
  const [hour12, setHour12] = useState(initH);
  const [minute, setMinute] = useState(initM);
  const [ampm,   setAmpm]   = useState(initA);

  // Sync internal state when value prop changes externally
  useEffect(() => {
    const { hour12: h, minute: m, ampm: a } = parse24(value);
    setHour12(h);
    setMinute(m);
    setAmpm(a);
  }, [value]);

  const openPicker = () => {
    const { hour12: h, minute: m, ampm: a } = parse24(value);
    setHour12(h);
    setMinute(m);
    setAmpm(a);
    setMode("hour");
    setOpen(true);
  };

  const handleConfirm = () => {
    const v = to24(hour12, minute, ampm);
    onChange({ target: { name, value: v } });
    setOpen(false);
  };

  const handleCancel = () => setOpen(false);

  const handleHourSelect = (h) => {
    setHour12(h);
    setMode("minute"); // auto-advance to minute after hour pick
  };

  const handleMinuteSelect = (m) => {
    setMinute(m);
  };

  return (
    <>
      {/* ── Trigger button ── */}
      <button
        type="button"
        className={`tp-trigger${open ? " tp-open" : ""}`}
        onClick={openPicker}
        aria-label="Pick time"
      >
        {/* Clock icon */}
        <svg className="tp-trigger-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        {value ? (
          <span className="tp-trigger-text">{display(value)}</span>
        ) : (
          <span className="tp-trigger-placeholder">Select time</span>
        )}
      </button>

      {/* ── Modal ── */}
      {open && (
        <div className="tp-overlay" onClick={handleCancel}>
          <div className="tp-modal" onClick={(e) => e.stopPropagation()}>

            {/* Header — shows current selection, click to switch mode */}
            <div className="tp-header">
              <span
                className={`tp-header-seg${mode === "hour" ? " tp-active" : ""}`}
                onClick={() => setMode("hour")}
              >
                {String(hour12).padStart(2, "0")}
              </span>
              <span className="tp-header-sep">:</span>
              <span
                className={`tp-header-seg${mode === "minute" ? " tp-active" : ""}`}
                onClick={() => setMode("minute")}
              >
                {String(minute).padStart(2, "0")}
              </span>
              <div className="tp-ampm-col">
                <button
                  type="button"
                  className={`tp-ampm-btn${ampm === "AM" ? " tp-active" : ""}`}
                  onClick={() => setAmpm("AM")}
                >AM</button>
                <button
                  type="button"
                  className={`tp-ampm-btn${ampm === "PM" ? " tp-active" : ""}`}
                  onClick={() => setAmpm("PM")}
                >PM</button>
              </div>
            </div>

            <div className="tp-body">
              {/* Mode label */}
              <div className="tp-clock-label">
                {mode === "hour" ? "Select Hour" : "Select Minute"}
              </div>

              {/* Clock face */}
              <div className="tp-clock-wrap">
                {mode === "hour" ? (
                  <ClockFace mode="hour"   value={hour12} onSelect={handleHourSelect} />
                ) : (
                  <ClockFace mode="minute" value={minute} onSelect={handleMinuteSelect} />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="tp-footer">
              <button type="button" className="tp-btn-cancel" onClick={handleCancel}>
                Cancel
              </button>
              <button type="button" className="tp-btn-ok" onClick={handleConfirm}>
                OK
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default TimePicker;