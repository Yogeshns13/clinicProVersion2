// src/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import "./Dashboard.css";
import {
  FiBell,
  FiUsers,
  FiCalendar,
  FiActivity,
  FiUserPlus,
  FiUpload,
  FiClock,
  FiLock,
  FiEye,
  FiEyeOff,
  FiX,
  FiCheck,
  FiAlertCircle,
} from "react-icons/fi";
import scope from "../assets/account.png";

import { getDashboardStats, updatePassword } from "../Api/Api.js";
import { getStoredClinicId, getStoredBranchId, getStoredUserId } from "../Utils/Cryptoutils.js";

const toDayLabel = (isoString) =>
  new Date(isoString).toLocaleDateString("en-US", { weekday: "short" });

const GENDER_COLORS = ["#0284c7", "#e879f9"];

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ---------- Change Password Modal State ----------
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  // -------------------------------------------------

  const getDoctorName = () => {
    try {
      return localStorage.getItem("profileName") || "Admin";
    } catch {
      return "Admin";
    }
  };

  const doctorName = getDoctorName();

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Dashboard Stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const clinicId = await getStoredClinicId();
        const branchId = await getStoredBranchId();

        if (!clinicId || !branchId) {
          throw new Error("Clinic or Branch ID missing. Please log in again.");
        }

        const result = await getDashboardStats(clinicId, branchId);
        setStats(result);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // ---------- Password Modal Handlers ----------
  const handleCloseModal = () => {
    setShowChangePassword(false);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setShowNewPass(false);
    setShowConfirmPass(false);
  };

  const handleChangePassword = async () => {
    setPasswordError("");

    if (!newPassword.trim()) {
      setPasswordError("New password cannot be empty.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match. Please try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const userId = await getStoredUserId();
      const clinicId = await getStoredClinicId();

      await updatePassword({
        UserID: userId,
        ClinicID: clinicId,
        Password: newPassword.trim(),
      });

      handleCloseModal();
      setShowSuccessPopup(true);
    } catch (err) {
      setPasswordError(err.message || "Failed to update password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  // ---------------------------------------------

  // Prepare Chart Data
  const weeklyFlowData = stats
    ? stats.appointmentFlow?.map((item, i) => ({
        day: toDayLabel(item.date),
        Appointments: item.count,
        Visits: stats.visitFlow?.[i]?.count ?? 0,
      })) || []
    : [];

  const monthlyPatientData = stats
    ? stats.patientMonthlyFlow?.map((item) => ({
        month: item.monthName,
        patients: item.count,
      })) || []
    : [];

  const genderData = stats
    ? stats.genderBreakdown?.map((g) => ({
        name: g.genderDesc,
        value: g.count,
      })) || []
    : [];

  // ---------- Dummy Records ----------
  const appointments = [
    { id: 1, patient: "Arun Kumar",   time: "10:30 AM", type: "General Checkup", status: "Confirmed" },
    { id: 2, patient: "Priya Sharma", time: "11:15 AM", type: "Follow-up",       status: "Pending"   },
    { id: 3, patient: "Ravi Patel",   time: "02:00 PM", type: "Dental",          status: "Confirmed" },
    { id: 4, patient: "Sneha Reddy",  time: "03:30 PM", type: "Vaccination",     status: "Confirmed" },
  ];

  const recentActivity = [
    { icon: FiUserPlus, text: "New patient registered - Vikram Singh",  time: "2 min ago"   },
    { icon: FiUpload,   text: "Lab report uploaded for Ravi Patel",     time: "1 hour ago"  },
    { icon: FiClock,    text: "Appointment rescheduled - Sneha Reddy",  time: "2 hours ago" },
  ];
  // ------------------------------------

  // Loading State
  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="dashboard-wrapper">
        <div className="error-state">
          <p>⚠️ Failed to load dashboard: {error}</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Stat Cards
  const statCards = [
    {
      icon: <FiUsers size={28} />,
      iconClass: "patients",
      value: stats?.totalActivePatients?.toLocaleString() || "0",
      label: "Total Active Patients",
      trend: `+${stats?.newPatientsThisMonth || 0} new this month`,
      trendType: "up",
    },
    {
      icon: <FiCalendar size={28} />,
      iconClass: "appointments",
      value: stats?.todayAppointments || 0,
      label: "Today's Appointments",
      trend:
        stats?.todayAppointments > 0
          ? `${stats.todayAppointments} scheduled`
          : "None today",
      trendType: stats?.todayAppointments > 0 ? "up" : "neutral",
    },
    {
      icon: <FiCalendar size={28} />,
      iconClass: "tomorrow",
      value: stats?.tomorrowAppointments || 0,
      label: "Tomorrow's Appointments",
      trend:
        stats?.tomorrowAppointments > 0
          ? `${stats.tomorrowAppointments} upcoming`
          : "None tomorrow",
      trendType: stats?.tomorrowAppointments > 0 ? "up" : "neutral",
    },
    {
      icon: <FiActivity size={28} />,
      iconClass: "revenue",
      value: stats?.todayVisits || 0,
      label: "Today's Visits",
      trend: "Live count",
      trendType: "up",
    },
    {
      icon: <FiUserPlus size={28} />,
      iconClass: "reports",
      value: stats?.newPatientsThisMonth || 0,
      label: "New Patients (Month)",
      trend: "This month",
      trendType: "up",
    },
  ];

  return (
    <div className="dashboard-wrapper">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Medical Dashboard</h1>
          <p>Welcome back, {doctorName}</p>
        </div>
        <div className="header-right">
          <div className="clock">
            {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className="notifications">
            <FiBell className="icon" />
            <span className="badge">3</span>
          </div>

          {/* Update Password Button */}
          <button
            className="change-password-btn"
            onClick={() => setShowChangePassword(true)}
          >
            Update Password
          </button>

          <div className="user-profile">
            <div className="avatar">
              <img src={scope} alt={doctorName} />
            </div>
            <span>{doctorName}</span>
          </div>
        </div>
      </header>

      {/* Stat Cards — single row, 5 columns */}
      <section className="stats-grid five-cards">
        {statCards.map((card, i) => (
          <div className="stat-card" key={i}>
            <div className={`icon ${card.iconClass}`}>
              {card.icon}
            </div>
            <div className="info">
              <h3>{card.value}</h3>
              <p>{card.label}</p>
              <span className={`trend ${card.trendType}`}>{card.trend}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Charts Row */}
      <section className="charts-row">
        {/* Weekly Appointment & Visit Flow */}
        <div className="chart-card">
          <h3>Weekly Appointment &amp; Visit Flow</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={weeklyFlowData}>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(34,43,108,0.08)" />
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  boxShadow: "0 4px 16px rgba(34,43,108,0.1)",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Appointments"
                stroke="#30b2b5"
                strokeWidth={3}
                dot={{ fill: "#30b2b5", r: 5 }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="Visits"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: "#8b5cf6", r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Patient Registrations */}
        <div className="chart-card">
          <h3>Monthly Patient Registrations</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyPatientData}>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(34,43,108,0.08)" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  boxShadow: "0 4px 16px rgba(34,43,108,0.1)",
                }}
              />
              <Bar dataKey="patients" fill="#30b2b5" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Gender Breakdown */}
      <section className="gender-section">
        <div className="chart-card gender-card">
          <h3>Patient Gender Breakdown</h3>
          {genderData.length > 0 ? (
            <div className="gender-chart-wrap">
              <ResponsiveContainer width="45%" height={220}>
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {genderData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={GENDER_COLORS[index % GENDER_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="gender-legend">
                {genderData.map((g, i) => (
                  <div key={i} className="gender-legend-item">
                    <div
                      className="gender-legend-dot"
                      style={{ background: GENDER_COLORS[i] }}
                    />
                    <div className="gender-legend-info">
                      <span className="gender-legend-label">{g.name}</span>
                      <span className="gender-legend-count">{g.value} patients</span>
                      <span className="gender-legend-pct">
                        {Math.round(
                          (g.value / genderData.reduce((s, x) => s + x.value, 0)) * 100
                        )}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state-box">
              <FiUsers size={32} color="#94a3b8" />
              <p>No gender data available</p>
            </div>
          )}
        </div>
      </section>

      {/* ===================== BOTTOM ROW ===================== */}
      <section className="bottom-row">
        {/* Upcoming Appointments */}
        <div className="appointments-card">
          <div className="card-header">
            <h3>Upcoming Appointments</h3>
            <a href="/appointments" className="view-all">View All</a>
          </div>
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Time</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt) => (
                <tr key={apt.id}>
                  <td>
                    <div className="patient-cell">
                      <span className="avatar-sm">{apt.patient[0]}</span>
                      {apt.patient}
                    </div>
                  </td>
                  <td>{apt.time}</td>
                  <td>{apt.type}</td>
                  <td>
                    <span className={`status ${apt.status.toLowerCase()}`}>
                      {apt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Activity */}
        <div className="activity-card">
          <div className="card-header">
            <h3>Recent Activity</h3>
          </div>
          <div className="activity-list">
            {recentActivity.map((act, i) => {
              const Icon = act.icon;
              return (
                <div key={i} className="activity-item">
                  <div className="activity-icon">
                    <Icon size={20} />
                  </div>
                  <div className="activity-content">
                    <p>{act.text}</p>
                    <span>{act.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== CHANGE PASSWORD MODAL ===================== */}
      {showChangePassword && (
        <div className="cp-overlay">
          <div className="cp-modal">
            {/* Modal Header */}
            <div className="cp-modal-header">
              <div className="cp-header-icon">
                <FiLock size={22} />
              </div>
              <div>
                <h2>Change Password</h2>
                <p>Set a new secure password for your account</p>
              </div>
              <button className="cp-close-btn" onClick={handleCloseModal} aria-label="Close">
                <FiX size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="cp-modal-body">
              {/* New Password */}
              <div className="cp-field">
                <label>New Password</label>
                <div className="cp-input-wrap">
                  <input
                    type={showNewPass ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError("");
                    }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="cp-eye-btn"
                    onClick={() => { setShowNewPass((v) => !v); setShowConfirmPass(false); }}
                    tabIndex={-1}
                    aria-label="Toggle new password visibility"
                  >
                    {showNewPass ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="cp-field">
                <label>Confirm Password</label>
                <div className={`cp-input-wrap ${confirmPassword && newPassword !== confirmPassword ? "mismatch" : confirmPassword && newPassword === confirmPassword ? "match" : ""}`}>
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordError("");
                    }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="cp-eye-btn"
                    onClick={() => { setShowConfirmPass((v) => !v); setShowNewPass(false); }}
                    tabIndex={-1}
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPass ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                  </button>
                  {confirmPassword && newPassword === confirmPassword && (
                    <span className="cp-match-icon"><FiCheck size={15} /></span>
                  )}
                </div>
              </div>

              {/* Inline mismatch / error message */}
              {passwordError && (
                <div className="cp-error-msg">
                  <FiAlertCircle size={15} />
                  <span>{passwordError}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="cp-modal-footer">
              <button className="cp-btn-cancel" onClick={handleCloseModal} disabled={isSubmitting}>
                Cancel
              </button>
              <button
                className="cp-btn-submit"
                onClick={handleChangePassword}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="cp-spinner" />
                ) : (
                  <>
                    <FiLock size={15} />
                    Update Password
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== SUCCESS POPUP ===================== */}
      {showSuccessPopup && (
        <div className="cp-overlay">
          <div className="cp-success-popup">
            <div className="cp-success-icon">
              <FiCheck size={32} />
            </div>
            <h3>Password Updated!</h3>
            <p>Your password has been changed successfully.</p>
            <button
              className="cp-btn-okay"
              onClick={() => setShowSuccessPopup(false)}
            >
              Okay
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;