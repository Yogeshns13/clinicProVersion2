// src/components/layout/Sidebar.jsx
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiFileText,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiChevronDown,
  FiLayers,
  FiBriefcase,
  FiChevronRight,
} from "react-icons/fi";
import { HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";
import logo from "../assets/cplogo.png";
import { AiFillProfile } from "react-icons/ai";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState({}); // Track multiple open states
  const { logout, profileName } = useAuth();
  const navigate = useNavigate();

  const hasAccess = (roles) => {
    return roles.includes(profileName?.toLowerCase());
  };

  const MENU_PERMISSIONS = {
    clinic: ["admin", "doctor", "receptionist", "nurse"],
    employee: ["admin", "doctor", "receptionist"],
    patients: ["admin", "doctor", "receptionist"],
    appointments: ["admin", "doctor", "receptionist"],
    prescriptions: ["admin", "doctor"],
    reports: ["admin", "doctor"],
    attendance: ["admin", "doctor"],
    settings: ["admin"],
  };

  const mainMenuItems = [
    { to: "/dashboard", icon: FiHome, label: "Dashboard" },
    {
      id: "clinic",
      icon: FiLayers,
      label: "Clinic",
      hasDropdown: true,
      subItems: [
        { to: "/clinic-list", label: "Clinic List" },
        { to: "/branch-list", label: "Branch List" },
        { to: "/dept-list", label: "Department List" },
      ],
      show: hasAccess(MENU_PERMISSIONS.clinic),
    },
    {
      id: "employee",
      icon: FiBriefcase,
      label: "Employee",
      hasDropdown: true,
      subItems: [
        { to: "/employee-list", label: "Employee List" },
      ],
      show: hasAccess(MENU_PERMISSIONS.employee),
    },
    { to: "/patients", icon: FiUsers, label: "Patients", show: hasAccess(MENU_PERMISSIONS.patients) },
    { to: "/appointments", icon: FiCalendar, label: "Appointments", show: hasAccess(MENU_PERMISSIONS.appointments) },
    { to: "/prescriptions", icon: FiFileText, label: "Prescriptions", show: hasAccess(MENU_PERMISSIONS.prescriptions) },
    { to: "/reports", icon: FiBarChart2, label: "Reports", show: hasAccess(MENU_PERMISSIONS.reports) },
    { to: "/attendance", icon: FiBarChart2, label: "Attendance", show: hasAccess(MENU_PERMISSIONS.attendance) },
    { to: "/settings", icon: FiSettings, label: "Settings", show: hasAccess(MENU_PERMISSIONS.settings) },
  ].filter(item => item.show !== false);

  const toggleDropdown = (id) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      {/* Logo & Collapse Button */}
      <div className="sidebar-top">
        <div className="logo-wrap">
          <img src={logo} alt="Clinic Pro" className="logo-img" />
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="nav">
        {mainMenuItems.map((item) => {
          const Icon = item.icon;

          // Regular menu item
          if (!item.hasDropdown) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                end
              >
                {Icon && <Icon className="nav-icon" size={24} />}
                {!isCollapsed && <span className="nav-label">{item.label}</span>}
                {isCollapsed && <div className="tooltip">{item.label}</div>}
              </NavLink>
            );
          }

          // Dropdown menu item (dynamic)
          const isOpen = openDropdowns[item.id] || false;

          return (
            <div key={item.id} className="dropdown-wrapper">
              <div
                className={`nav-item dropdown-toggle ${isOpen ? "open" : ""}`}
                onClick={() => toggleDropdown(item.id)}
              >
                <Icon className="nav-icon" size={24} />
                {!isCollapsed && (
                  <>
                    <span className="nav-label">{item.label}</span>
                    {isOpen ? (
                      <FiChevronDown className="dropdown-arrow" size={18} />
                    ) : (
                      <FiChevronRight className="dropdown-arrow" size={18} />
                    )}
                  </>
                )}
                {isCollapsed && <div className="tooltip">{item.label}</div>}
              </div>

              {/* Submenu - only show when expanded and sidebar is not collapsed */}
              {!isCollapsed && isOpen && (
                <div className="dropdown-menu">
                  {item.subItems.map((sub) => (
                    <NavLink
                      key={sub.to}
                      to={sub.to}
                      className={({ isActive }) => `dropdown-item ${isActive ? "active" : ""}`}
                      end
                    >
                      <span className="dropdown-label">{sub.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Logout */}
        <NavLink to="/login" className="nav-item logout" onClick={handleLogout}>
          <FiLogOut className="nav-icon" size={24} />
          {!isCollapsed && <span className="nav-label">Logout</span>}
          {isCollapsed && <div className="tooltip">Logout</div>}
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        {!isCollapsed && <small>© {new Date().getFullYear()} Clinic Pro</small>}
        {isCollapsed && <div className="tooltip">© {new Date().getFullYear()}</div>}
      </div>
    </aside>
  );
};

export default Sidebar;