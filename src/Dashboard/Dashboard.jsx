// src/components/dashboard/Dashboard.jsx
import React, { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import "./Dashboard.css";
import {
  FiBell,
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiFileText,
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
import { updatePassword } from "../Api/Api.js";
import { getStoredClinicId, getStoredUserId } from "../Utils/Cryptoutils.js";

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

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

  // ---------- Get doctor name from localStorage ----------
  const getDoctorName = () => {
    try {
      const profile = localStorage.getItem("profileName");
      return profile || "Admin";
    } catch (e) {
      return "Admin";
    }
  };

  const doctorName = getDoctorName();
  // ---------------------------------------------------------

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);



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

  // Sample Data
  const patientFlow = [
    { day: "Mon", patients: 65 },
    { day: "Tue", patients: 78 },
    { day: "Wed", patients: 90 },
    { day: "Thu", patients: 81 },
    { day: "Fri", patients: 96 },
    { day: "Sat", patients: 55 },
    { day: "Sun", patients: 40 },
  ];

  const revenueData = [
    { month: "Jan", revenue: 32000 },
    { month: "Feb", revenue: 38000 },
    { month: "Mar", revenue: 45000 },
    { month: "Apr", revenue: 41000 },
    { month: "May", revenue: 52000 },
    { month: "Jun", revenue: 68000 },
  ];

  const appointments = [
    { id: 1, patient: "Arun Kumar", time: "10:30 AM", type: "General Checkup", status: "Confirmed" },
    { id: 2, patient: "Priya Sharma", time: "11:15 AM", type: "Follow-up", status: "Pending" },
    { id: 3, patient: "Ravi Patel", time: "02:00 PM", type: "Dental", status: "Confirmed" },
    { id: 4, patient: "Sneha Reddy", time: "03:30 PM", type: "Vaccination", status: "Confirmed" },
  ];

  const recentActivity = [
    { icon: FiUserPlus, text: "New patient registered - Vikram Singh", time: "2 min ago" },
    { icon: FiUpload, text: "Lab report uploaded for Ravi Patel", time: "1 hour ago" },
    { icon: FiClock, text: "Appointment rescheduled - Sneha Reddy", time: "2 hours ago" },
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

      {/* Stats Cards */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="icon patients">
            <FiUsers size={28} />
          </div>
          <div className="info">
            <h3>1,284</h3>
            <p>Total Patients</p>
            <span className="trend up">+12.5% from last month</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="icon appointments">
            <FiCalendar size={28} />
          </div>
          <div className="info">
            <h3>89</h3>
            <p>Today's Appointments</p>
            <span className="trend up">+8 today</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="icon revenue">
            <FiDollarSign size={28} />
          </div>
          <div className="info">
            <h3>₹2,86,000</h3>
            <p>Monthly Revenue</p>
            <span className="trend up">+28.5% growth</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="icon reports">
            <FiFileText size={28} />
          </div>
          <div className="info">
            <h3>12</h3>
            <p>Pending Reports</p>
            <span className="trend down">-3 from yesterday</span>
          </div>
        </div>
      </section>

      {/* Charts Row */}
      <section className="charts-row">
        <div className="chart-card">
          <h3>Patient Flow (This Week)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={patientFlow}>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: "rgba(15,23,42,0.95)", border: "none", borderRadius: "12px" }} />
              <Line type="monotone" dataKey="patients" stroke="#30b2b5" strokeWidth={4} dot={{ fill: "#30b2b5", r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: "rgba(15,23,42,0.95)", border: "none", borderRadius: "12px" }} />
              <Bar dataKey="revenue" fill="#30b2b5" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Bottom Row */}
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
                    onClick={() => setShowNewPass((v) => !v)}
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
                    onClick={() => setShowConfirmPass((v) => !v)}
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