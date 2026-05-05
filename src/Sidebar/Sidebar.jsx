// src/components/layout/Sidebar.jsx
import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
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
import styles from "./Sidebar.module.css";
import logo from "../assets/cplogo.png";

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
      {to: "/user-list", label: "User List", roles: ["spradmin","admin"],},
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
      {to: "/invoice-management", label: "Consolidated Invoice", roles: ["admin", "accounts", "doctor", "frontdesk", "pharmacy", "labtech"],},
      {to: "/invoice-payment", label: "Consolidated Payment", roles: ["admin", "accounts", "doctor", "frontdesk", "pharmacy", "labtech"],},
    ],
  },
];

// Given current pathname, find which dropdown id contains it
const getActiveDropdownId = (pathname) => {
  for (const item of mainMenuItems) {
    if (item.hasDropdown && item.subItems) {
      if (item.subItems.some((sub) => pathname === sub.to || pathname.startsWith(sub.to + "/"))) {
        return item.id;
      }
    }
  }
  return null;
};

const Sidebar = () => {
  const [isHovered, setIsHovered] = useState(false);
  const { logout, profileName } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef(null);
  const activeItemRef = useRef(null);

  // Always derive the active dropdown from the current route
  const activeDropdownId = getActiveDropdownId(location.pathname);

  // openDropdowns: manually toggled overrides on top of the active one
  const [manualOverrides, setManualOverrides] = useState({});

  // When sidebar expands, scroll the active item into view
  useEffect(() => {
    if (isHovered && activeItemRef.current && navRef.current) {
      setTimeout(() => {
        activeItemRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 50);
    }
  }, [isHovered]);

  // Reset manual overrides when route changes so new active section takes over
  useEffect(() => {
    setManualOverrides({});
  }, [location.pathname]);

  const isExpanded = isHovered;

  const hasAccess = (roles = []) => {
    return (
      roles.length === 0 ||
      roles.includes(profileName?.toLowerCase())
    );
  };

  // A dropdown is open if:
  // 1. It's the active dropdown (current route lives inside it), OR
  // 2. It has been manually toggled open (and not manually closed)
  const isDropdownOpen = (id) => {
    if (id in manualOverrides) {
      return manualOverrides[id];
    }
    return id === activeDropdownId;
  };

  const toggleDropdown = (id) => {
    setManualOverrides((prev) => {
      const currentState = isDropdownOpen(id);
      return { ...prev, [id]: !currentState };
    });
  };

  const handleLogout = (e) => {
    e.preventDefault();
    navigate("/logout", { replace: true });
  };

  const filteredMenu = mainMenuItems.filter((item) =>
    hasAccess(item.roles)
  );

  return (
    <aside
      className={`${styles.sidebar} ${!isExpanded ? styles.collapsed : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.sidebarTop}>
        <div className={styles.logoWrap}>
          <img src={logo} alt="Clinic Pro" className={styles.logoImg} />
        </div>
      </div>

      <nav className={styles.nav} ref={navRef}>
        {filteredMenu.map((item) => {
          const Icon = item.icon;

          if (!item.hasDropdown) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ""}`
                }
                end
              >
                {Icon && <Icon size={22} />}
                {isExpanded && (
                  <span className={styles.navLabel}>
                    {item.label}
                  </span>
                )}
              </NavLink>
            );
          }

          const isOpen = isDropdownOpen(item.id);
          const isActiveSection = item.id === activeDropdownId;

          return (
            <div
              key={item.id}
              className={styles.dropdownWrapper}
              ref={isActiveSection ? activeItemRef : null}
            >
              <div
                className={`${styles.navItem} ${styles.dropdownToggle} ${isOpen ? styles.open : ""} ${isActiveSection ? styles.activeSection : ""}`}
                onClick={() => isExpanded && toggleDropdown(item.id)}
              >
                <Icon size={22} />
                {isExpanded && (
                  <>
                    <span className={styles.navLabel}>
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

              {/* KEY FIX: Only render dropdown menu when sidebar is expanded (isHovered).
                  This prevents sub-items from bleeding through when sidebar is collapsed,
                  especially on pages like AddConsultation where a modal is open. */}
              {isExpanded && isOpen && (
                <div className={styles.dropdownMenu}>
                  {item.subItems
                    .filter((sub) =>
                      hasAccess(sub.roles)
                    )
                    .map((sub) => (
                      <NavLink
                        key={sub.to}
                        to={sub.to}
                        className={({ isActive }) =>
                          `${styles.dropdownItem} ${isActive ? styles.active : ""}`
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
          className={`${styles.navItem} ${styles.logout}`}
          onClick={handleLogout}
        >
          <FiLogOut size={22} />
          {isExpanded && (
            <span className={styles.navLabel}>Logout</span>
          )}
        </NavLink>
      </nav>

      <div className={styles.sidebarFooter}>
        {isExpanded && (
          <small>
            © {new Date().getFullYear()} Clinic Pro
          </small>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;