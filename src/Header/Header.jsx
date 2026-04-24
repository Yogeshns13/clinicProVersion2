// src/components/Header/Header.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FiMoon, FiSun, FiLogOut, FiUser, FiKey, FiMenu, FiX } from "react-icons/fi";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';

// Drag-handle icon (six dots)
const DragHandle = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <circle cx="4" cy="3"  r="1.3" />
    <circle cx="4" cy="7"  r="1.3" />
    <circle cx="4" cy="11" r="1.3" />
    <circle cx="9" cy="3"  r="1.3" />
    <circle cx="9" cy="7"  r="1.3" />
    <circle cx="9" cy="11" r="1.3" />
  </svg>
);

const Header = ({ title = "Clinic Management", menuItems = [], onMenuReorder }) => {
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMenuOpen,    setIsMenuOpen]    = useState(false);
  const [isDarkMode,    setIsDarkMode]    = useState(
    () => localStorage.getItem('darkMode') === 'true'
  );

  const [dragIdx,     setDragIdx]     = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const profileRef = useRef(null);
  const menuRef    = useRef(null);

  const profileName = localStorage.getItem("profileName") || "Admin";

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
      if (menuRef.current    && !menuRef.current.contains(e.target))    setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDarkMode = () => { setIsDarkMode(prev => !prev); setIsProfileOpen(false); };
  const handleLogout   = (e) => { e.preventDefault(); navigate("/logout", { replace: true }); };

  // ── Drag handlers ──────────────────────────────
  const handleDragStart = (e, idx) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    const ghost = document.createElement('div');
    ghost.style.opacity = '0';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (idx !== dragOverIdx) setDragOverIdx(idx);
  };

  const handleDrop = (e, idx) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDragOverIdx(null); return; }
    const newOrder = menuItems.map((item) => item.id);
    const [moved]  = newOrder.splice(dragIdx, 1);
    newOrder.splice(idx, 0, moved);
    onMenuReorder?.(newOrder);
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

  const hasCheckboxItems = menuItems.some((item) => item.checked !== undefined);

  return (
    <div className={styles.clinicListHeader}>
      <h1>{title}</h1>

      <div className={styles.headerRight}>

        {/* ── Profile ── */}
        <div className={styles.headerProfileContainer} ref={profileRef}>
          <div
            className={styles.headerProfile}
            onClick={() => { setIsProfileOpen(prev => !prev); setIsMenuOpen(false); }}
            role="button"
            tabIndex={0}
          >
            <div className={styles.userIconWrapper}>
              <FaUserCircle size={30} />
            </div>
          </div>

          {isProfileOpen && (
            <div className={styles.profileDropdown}>
              <div className={`${styles.profileDropdownItem} ${styles.usernameItem}`}>
                <FiUser size={18} /><span>{profileName}</span>
              </div>
              <div className={styles.profileDropdownItem} onClick={toggleDarkMode}>
                {isDarkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
                <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
              <div className={styles.profileDropdownItem} onClick={handleLogout}>
                <FiLogOut size={18} /><span>Logout</span>
              </div>
              <div className={styles.profileDropdownItem}>
                <FiKey size={18} /><span>Forget Password</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Hamburger Menu ── */}
        <div className={styles.menuContainer} ref={menuRef}>
          <button
            className={styles.menuBtn}
            onClick={() => { setIsMenuOpen(prev => !prev); setIsProfileOpen(false); }}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>

          {isMenuOpen && (
            <div className={styles.menuDropdown}>
              <div className={styles.menuDropdownHeader}>
                {hasCheckboxItems ? 'Columns' : 'Menu'}
              </div>

              {menuItems.length > 0 ? (
                <table className={styles.menuTable}>
                  <tbody>
                    {menuItems.map((item, idx) => (
                      <tr
                        key={item.id ?? idx}
                        className={[
                          styles.menuTableRow,
                          item.checked ? styles.menuTableRowChecked : '',
                          dragOverIdx === idx && dragIdx !== idx ? styles.menuTableRowDragOver : '',
                          dragIdx === idx ? styles.menuTableRowDragging : '',
                        ].filter(Boolean).join(' ')}
                        draggable={!!onMenuReorder}
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e)  => handleDragOver(e, idx)}
                        onDrop={(e)      => handleDrop(e, idx)}
                        onDragEnd={handleDragEnd}
                        onClick={() => { item.onClick?.(); if (!item.keepOpen) setIsMenuOpen(false); }}
                      >
                        

                        {/* Checkbox */}
                        {item.checked !== undefined && (
                          <td className={styles.menuTableCheckbox}>
                            <span className={`${styles.checkbox} ${item.checked ? styles.checkboxChecked : ''}`}>
                              {item.checked && (
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </span>
                          </td>
                        )}

                        {/* Icon */}
                        {item.icon && (
                          <td className={styles.menuTableIcon}>{item.icon}</td>
                        )}

                        {/* Label */}
                        <td className={styles.menuTableLabel}>{item.label}</td>

                        {/* ── Slot label badge (e.g. "Owner col") ── */}
                        {item.slotLabel && (
                          <td className={styles.menuTableSlotCell}>
                            <span className={styles.menuTableSlotBadge}>{item.slotLabel}</span>
                          </td>
                        )}

                        {/* Value (non-checkbox items only) */}
                        {item.checked === undefined && item.value !== undefined && (
                          <td className={styles.menuTableValue}>{item.value}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.menuEmpty}>No menu items.</div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Header;