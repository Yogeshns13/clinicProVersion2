// src/components/Header.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FiMoon, FiSun, FiLogOut, FiUser, FiKey } from "react-icons/fi";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import './Header.css';          

const Header = ({ title = "Clinic Management" }) => {
  const navigate = useNavigate();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem('darkMode') === 'true'
  );

  const profileRef = useRef(null);

  const profileName = localStorage.getItem("profileName") || "Admin";

  // Dark mode toggle
  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

  // Click outside to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
    setIsProfileOpen(false);
  };

  const handleLogout = (e) => {
    e.preventDefault();
    navigate("/logout", { replace: true });
  };


  return (
    <div className="clinic-list-header">
      <h1>{title}</h1>

      <div className="header-profile-container" ref={profileRef}>
        <div
          className="header-profile"
          onClick={() => setIsProfileOpen(prev => !prev)}
          role="button"
          tabIndex={0}
        >
          <div className="user-icon-wrapper">
            <FaUserCircle size={30} />
          </div>
        </div>

        {isProfileOpen && (
          <div className="profile-dropdown">
            <div className="profile-dropdown-item username-item">
              <FiUser size={18} />
              <span>{profileName}</span>
            </div>
            <div className="profile-dropdown-item" onClick={toggleDarkMode}>
              {isDarkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
            <div className="profile-dropdown-item" onClick={handleLogout}>
              <FiLogOut size={18} />
              <span>Logout</span>
            </div>
            <div className="profile-dropdown-item">
              <FiKey size={18} />
              <span>Forget Password</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;