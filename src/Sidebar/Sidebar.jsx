// src/components/layout/Sidebar.jsx
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiFileText,
  FiPackage,
  FiUserCheck,
  FiLogOut,
  FiChevronDown,
  FiLayers,
  FiBriefcase,
  FiChevronRight,
  FiPlusSquare,
} from "react-icons/fi";
import { useAuth } from "../Contexts/AuthContext";
import "./Sidebar.css";
import logo from "../assets/cplogo.png";

const getDefaultOpenDropdowns = (profileName) => {
  const role = profileName?.toLowerCase();
  const defaults = {
    nurse: "patients",
    pharmacy: "pharmacy",
    labtest: "lab",
    doctor: "consultation",
    accounts: "invoice",
  };
  return defaults[role] ? { [defaults[role]]: true } : {};
};

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { logout, profileName } = useAuth();
  const [openDropdowns, setOpenDropdowns] = useState(() =>
    getDefaultOpenDropdowns(profileName)
  );
  const navigate = useNavigate();

  const hasAccess = (roles = []) => {
    return (
      roles.length === 0 ||
      roles.includes(profileName?.toLowerCase())
    );
  };

  const mainMenuItems = [
    {
      to: "/dashboard",
      icon: FiHome,
      label: "Dashboard",
    },
    {
      id: "clinic",
      icon: FiLayers,
      label: "Clinic",
      roles: ["admin", "spradmin","frontdesk", "nurse", "pharmacy", "labtech", "accounts"],
      hasDropdown: true,
      subItems: [
        {to: "/clinic-list", label: "Clinic", roles: ["admin", "spradmin", "doctor", "frontdesk", "nurse", "pharmacy", "labtech", "accounts"],},
        {to: "/branch-list",  label: "Branch", roles: ["admin", "spradmin","doctor", "frontdesk", "nurse", "pharmacy", "labtech", "accounts"],},
        {to: "/dept-list", label: "Department", roles: ["admin", "spradmin", "frontdesk", "nurse", "pharmacy", "labtech", "accounts"],},
      ],
    },
    {
      id: "employee",
      icon: FiBriefcase,
      label: "Employee",
      roles: ["admin", "nurse","spradmin","frontdesk"],
      hasDropdown: true,
      subItems: [
        {to: "/work-shift", label: "Work Shift", roles: ["admin","frontdesk", "nurse"],},
        {to: "/employee-list", label: "Employee List", roles: ["admin","frontdesk", "nurse"],},
        {to: "/admin-employee-list", label: "Employee List", roles: ["spradmin"],},
        {to: "/user-list", label: "User List", roles: ["spradmin"],},
      ],
    },
    {
      id: "patients",
      icon: FiUsers,
      label: "Patients",
      roles: ["admin", "doctor", "nurse", "frontdesk", "accounts"],
      hasDropdown: true,
      subItems: [
        {to: "/patient-list", label: "Patients", roles: ["admin", "nurse", "doctor", "frontdesk", "accounts"],},
        {to: "/slotconfig-list", label: "SlotConfig List", roles: ["admin",  "frontdesk"],},
        {to: "/slot-list", label: "Slot List", roles: ["admin", "nurse", "doctor", "frontdesk"],},
        {to: "/appointment-list", label: "Appointment List", roles: ["admin", "frontdesk","doctor", "nurse"],},
        {to: "/patientvisit-list", label: "Patient Visit", roles: ["admin", "frontdesk", "doctor", "nurse"],},
      ],
    },
    {
      id: "consultation",
      icon: FiUserCheck,
      label: "Consultation",
      roles: ["admin","doctor", "nurse", "frontdesk", "accounts"],
      hasDropdown: true,
      subItems: [
        {to: "/consultation-list", label: "Consultation List", roles: ["admin", "doctor"],},
        {to: "/consulted-patient", label: "Consultation List", roles: ["nurse", "frontdesk", "accounts"],},
        {to: "/print-prescription", label: "Prescription/Lab Order", roles: ["admin", "doctor", "nurse"],},
        {to: "/consultationcharge-config", label: "Consul Charge Config", roles: ["admin", "frontdesk", "accounts"],},
        {to: "/consultation-charge", label: "Consultation Charge", roles: ["admin", "frontdesk", "accounts"],},
        {to: "/external-lab", label: "External Lab", roles: ["admin","doctor","frontdesk"],},
        {to: "/consultation-invoice", label: "Consultation Invoice", roles: ["admin","doctor","frontdesk", "nurse"],},
      ],
    },
    {
      id: "lab",
      icon: FiPlusSquare,
      label: "Lab",
      roles: ["admin", "labtech","doctor", "frontdesk", "accounts"],
      hasDropdown: true,
      subItems: [
        {to: "/labtestmaster", label: "Lab Master", roles: ["admin", "labtech", "accounts"],},
        {to: "/laborder-list", label: "Lab Order", roles: ["admin", "labtech"],},
        {to: "/labwork-list", label: "Lab Work", roles: ["admin", "labtech"],},
        {to: "/lab-report-list", label: "Lab Reports", roles: ["admin", "labtech","doctor", "frontdesk"],},
        {to: "/lab-invoice", label: "Lab Invoice", roles: ["admin", "labtech"],},

      ],
    },
    {
      id: "pharmacy",
      icon: FiPackage,
      label: "Pharmacy",
      roles: ["admin", "nurse", "pharmacy","doctor", "frontdesk", "accounts"],
      hasDropdown: true,
      subItems: [
        {to: "/vendor-list", label: "Vendor", roles: ["admin",  "pharmacy"],},
        {to: "/medicinemaster-list", label: "Medicine", roles: ["admin", "pharmacy", "doctor", "frontdesk", "accounts"],},
        {to: "/medicinestock-list", label: "Medicine Stock", roles: ["admin", "pharmacy", "doctor", "frontdesk"],},
        {to: "/purchaseorder-list", label: "purchase Order", roles: ["admin",  "pharmacy"],},
        {to: "/salescart-list", label: "Sales Cart", roles: ["admin", "pharmacy", "nurse"],},
        {to: "/pharmacy-invoice", label: "Pharmacy Invoice", roles: ["admin", "pharmacy"],},
      ],
    },
    {
      id: "invoice",
      icon: FiFileText,
      label: "Invoice",
      roles: ["admin","accounts","doctor", "frontdesk", "pharmacy", "labtech"],
      hasDropdown: true,
      subItems: [
        {to: "/invoice-management", label: "Invoice Management", roles: ["admin", "accounts", "doctor", "frontdesk", "pharmacy", "labtech"],},
        {to: "/invoice-payment", label: "Invoice Payment", roles: ["admin", "accounts", "doctor", "frontdesk", "pharmacy", "labtech"],},
      ],
    },
  ];

  const toggleDropdown = (id) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleLogout = (e) => {
    e.preventDefault();
    navigate("/logout", { replace: true });
  };

  const filteredMenu = mainMenuItems.filter((item) =>
    hasAccess(item.roles)
  );

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-top">
        <div className="logo-wrap">
          <img src={logo} alt="Clinic Pro" className="logo-img" />
        </div>
      </div>

      <nav className="nav">
        {filteredMenu.map((item) => {
          const Icon = item.icon;

          if (!item.hasDropdown) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
                end
              >
                {Icon && <Icon size={22} />}
                {!isCollapsed && (
                  <span className="nav-label">
                    {item.label}
                  </span>
                )}
              </NavLink>
            );
          }

          const isOpen = openDropdowns[item.id] || false;

          return (
            <div key={item.id} className="dropdown-wrapper">
              <div
                className={`nav-item dropdown-toggle ${
                  isOpen ? "open" : ""
                }`}
                onClick={() => toggleDropdown(item.id)}
              >
                <Icon size={22} />
                {!isCollapsed && (
                  <>
                    <span className="nav-label">
                      {item.label}
                    </span>
                    {isOpen ? (
                      <FiChevronDown size={16} />
                    ) : (
                      <FiChevronRight size={16} />
                    )}
                  </>
                )}
              </div>

              {!isCollapsed && isOpen && (
                <div className="dropdown-menu">
                  {item.subItems
                    .filter((sub) =>
                      hasAccess(sub.roles)
                    )
                    .map((sub) => (
                      <NavLink
                        key={sub.to}
                        to={sub.to}
                        className={({ isActive }) =>
                          `dropdown-item ${
                            isActive ? "active" : ""
                          }`
                        }
                        end
                      >
                        {sub.label}
                      </NavLink>
                    ))}
                </div>
              )}
            </div>
          );
        })}

        <NavLink
          to="/login"
          className="nav-item logout"
          onClick={handleLogout}
        >
          <FiLogOut size={22} />
          {!isCollapsed && (
            <span className="nav-label">Logout</span>
          )}
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        {!isCollapsed && (
          <small>
            © {new Date().getFullYear()} Clinic Pro
          </small>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;