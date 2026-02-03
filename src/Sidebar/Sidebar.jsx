// src/components/layout/Sidebar.jsx
import  { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiFileText,
  FiBarChart2,
  FiSettings,
  FiMessageCircle,
  FiUserCheck,
  FiLogOut,
  FiChevronDown,
  FiLayers,
  FiBriefcase,
  FiChevronRight,
  FiPlusSquare,
} from "react-icons/fi";
import { HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";
import logo from "../assets/cplogo.png";
import { AiFillProfile } from "react-icons/ai";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const { logout, profileName } = useAuth();
  const navigate = useNavigate();

  const hasAccess = (roles) => {
    return roles.includes(profileName?.toLowerCase());
  };

  const MENU_PERMISSIONS = {
    clinic: ["admin", "doctor", "receptionist", "nurse"],
    employee: ["admin", "doctor", "receptionist"],
    patients: ["admin", "doctor", "receptionist"],
    consultation: ["admin", "doctor", "receptionist"],
    lab: ["admin", "doctor", "receptionist"],
    invoice: ["admin", "doctor", "receptionist"],
    pharmacy: ["admin", "doctor", "receptionist"],
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
        { to: "/clinic-list", label: "Clinic" },
        { to: "/branch-list", label: "Branch" },
        { to: "/dept-list", label: "Department" },
      ],
      show: hasAccess(MENU_PERMISSIONS.clinic),
    },
    {
      id: "employee",
      icon: FiBriefcase,
      label: "Employee",
      hasDropdown: true,
      subItems: [
        { to: "/work-shift", label: "Work Shift" },
        { to: "/employee-list", label: "Employee" },
      ],
      show: hasAccess(MENU_PERMISSIONS.employee),
    },
    {
      id: "patients",
      icon: FiUsers,
      label: "Patients",
      hasDropdown: true,
      subItems: [
        { to: "/patient-list", label: "Patients" },
        { to: "/slotconfig-list", label: "SlotConfig List" },
        { to: "/slot-list", label: "Slot-List" },
        { to: "/appointment-list", label: "Appoinment List" },
        { to: "/patientvisit-list", label: "Patient Visit List"},
      ],
      show: hasAccess(MENU_PERMISSIONS.patients),
    },
    {
      id: "consultation",
      icon: FiUserCheck,
      label: "Consultation",
      hasDropdown: true,
      subItems: [
        { to: "/consultation-list", label: "Consultation List"},
        { to: "/consultationcharge-config", label: "Consul Charge Config"},
        { to: "/consultation-charge", label: "Consultation Charge"},
      ],
      show: hasAccess(MENU_PERMISSIONS.consultation),
    },
    {
      id: "lab",
      icon: FiPlusSquare,
      label: "lab",
      hasDropdown: true,
      subItems: [
        { to: "/labtestmaster", label: "Lab Master"},
      ],
      show: hasAccess(MENU_PERMISSIONS.lab),
    },
    {
      id: "invoice",
      icon: FiFileText,
      label: "invoice",
      hasDropdown: true,
      subItems: [
        { to: "/invoice-management", label: "Invoice"},
        { to: "/invoice-payment", label: "Invoice Payment"},
      ],
      show: hasAccess(MENU_PERMISSIONS.invoice),
    },
    {
      id: "pharmacy",
      icon: FiPlusSquare,
      label: "pharmacy",
      hasDropdown: true,
      subItems: [
        { to: "/vendor-list", label: "Vendor"},
        { to: "/medicinemaster-list", label: "Medicine"},
        { to: "/purchaseorder-list", label: "purchase Order"},
        { to: "/purchaseorderdetail-list", label: "purchase Order Detail"},
      ],
      show: hasAccess(MENU_PERMISSIONS.pharmacy),
    },
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