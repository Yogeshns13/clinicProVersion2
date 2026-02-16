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
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";
import logo from "../assets/cplogo.png";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const { logout, profileName } = useAuth();
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
      roles: ["admin", "spradmin","doctor","fronttdesk", "nurse", "pharmacy", "labtest", "accounts"],
      hasDropdown: true,
      subItems: [
        {to: "/clinic-list", label: "Clinic", roles: ["admin", "spradmin", "doctor", "fronttdesk", "nurse", "pharmacy", "labtest", "accounts"],},
        {to: "/branch-list",  label: "Branch", roles: ["admin", "spradmin","doctor", "fronttdesk", "nurse", "pharmacy", "labtest", "accounts"],},
        {to: "/dept-list", label: "Department", roles: ["admin", "spradmin", "fronttdesk", "nurse", "pharmacy", "labtest", "accounts"],},
      ],
    },
    {
      id: "employee",
      icon: FiBriefcase,
      label: "Employee",
      roles: ["admin", "spradmin","fronttdesk"],
      hasDropdown: true,
      subItems: [
        {to: "/work-shift", label: "Work Shift", roles: ["admin", "spradmin", "fronttdesk", "nurse"],},
        {to: "/employee-list", label: "Employee List", roles: ["admin", "spradmin", "fronttdesk", "nurse"],},
      ],
    },
    {
      id: "patients",
      icon: FiUsers,
      label: "Patients",
      roles: ["admin", "spradmin", "doctor", "nurse", "fronttdesk", "accounts"],
      hasDropdown: true,
      subItems: [
        {to: "/patient-list", label: "Patients", roles: ["admin", "spradmin", "nurse", "doctor", "fronttdesk", "accounts"],},
        {to: "/slotconfig-list", label: "SlotConfig List", roles: ["admin", "spradmin", "fronttdesk"],},
        {to: "/slot-list", label: "Slot List", roles: ["admin", "spradmin", "nurse", "doctor", "fronttdesk"],},
        {to: "/appointment-list", label: "Appointment List", roles: ["admin", "spradmin", "fronttdesk","doctor", "nurse"],},
        {to: "/patientvisit-list", label: "Patient Visit", roles: ["admin", "spradmin", "fronttdesk","doctor","nurse"],},
      ],
    },
    {
      id: "consultation",
      icon: FiUserCheck,
      label: "Consultation",
      roles: ["admin", "spradmin", "doctor", "nurse", "fronttdesk", "accounts"],
      hasDropdown: true,
      subItems: [
        {to: "/consultation-list", label: "Consultation List", roles: ["admin", "spradmin", "nurse", "doctor", "fronttdesk", "accounts"],},
        {to: "/consultationcharge-config", label: "Consul Charge Config", roles: ["admin", "spradmin", "fronttdesk", "accounts"],},
        {to: "/consultation-charge", label: "Consultation Charge", roles: ["admin", "spradmin", "fronttdesk", "accounts"],},
      ],
    },
    {
      id: "lab",
      icon: FiPlusSquare,
      label: "Lab",
      roles: ["admin", "spradmin", "labtest","doctor", "fronttdesk", "accounts"],
      hasDropdown: true,
      subItems: [
        {to: "/labtestmaster", label: "Lab Master", roles: ["admin", "spradmin", "labtest", "accounts"],},
        {to: "/laborder-list", label: "Lab Order", roles: ["admin", "spradmin", "labtest"],},
        {to: "/labwork-list", label: "Lab Work", roles: ["admin", "spradmin", "labtest"],},
        {to: "/lab-report-list", label: "Lab Reports", roles: ["admin", "spradmin", "labtest","doctor", "fronttdesk"],},
        {to: "/lab-invoice", label: "Lab Invoice", roles: ["admin", "spradmin", "labtest"],},

      ],
    },
    {
      id: "pharmacy",
      icon: FiPackage,
      label: "Pharmacy",
      roles: ["admin", "spradmin", "pharmacy","doctor", "fronttdesk", "accounts"],
      hasDropdown: true,
      subItems: [
        {to: "/vendor-list", label: "Vendor", roles: ["admin", "spradmin", "pharmacy"],},
        {to: "/medicinemaster-list", label: "Medicine", roles: ["admin", "spradmin", "pharmacy", "doctor", "fronttdesk", "accounts"],},
        {to: "/medicinestock-list", label: "Medicine Stock", roles: ["admin", "spradmin", "pharmacy", "doctor", "fronttdesk"],},
        {to: "/purchaseorder-list", label: "purchase Order", roles: ["admin", "spradmin", "pharmacy"],},
        {to: "/salescart-list", label: "Sales Cart", roles: ["admin", "spradmin", "pharmacy"],},
        {to: "/pharmacy-invoice", label: "Pharmacy Invoice", roles: ["admin", "spradmin", "pharmacy"],},
      ],
    },
    {
      id: "invoice",
      icon: FiFileText,
      label: "Invoice",
      roles: ["admin", "spradmin", "accounts","doctor", "fronttdesk", "pharmacy", "labtest"],
      hasDropdown: true,
      subItems: [
        {to: "/invoice-management", label: "Invoice Management", roles: ["admin", "spradmin", "accounts", "doctor", "fronttdesk", "pharmacy", "labtest"],},
        {to: "/invoice-payment", label: "Invoice Payment", roles: ["admin", "spradmin", "accounts", "doctor", "fronttdesk", "pharmacy", "labtest"],},
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
    logout();
    navigate("/login", { replace: true });
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
