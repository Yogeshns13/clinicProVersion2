// src/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import styles from "./Dashboard.module.css";
import {
  FiBell, FiUsers, FiCalendar, FiActivity, FiUserPlus, FiUpload, FiClock,
} from "react-icons/fi";
import scope from "../assets/account.png";

import { getDashboardStats, updatePassword } from "../Api/Api.js";
import { getStoredClinicId, getStoredBranchId, getStoredUserId } from "../Utils/Cryptoutils.js";
import { useAuth } from "../Contexts/AuthContext";

// ── Shared reusable password modal ──
import UpdatePassword from "../UpdatePassword/UpdatePassword";

// ── Header component ──
import Header from "../Header/Header";

const toDayLabel = (isoString) =>
  new Date(isoString).toLocaleDateString("en-US", { weekday: "short" });

const GENDER_COLORS = ["#0284c7", "#e879f9"];

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const { mustChangePassword, clearMustChangePassword, logout } = useAuth();

  // ── "Update Password" modal (voluntary, from header button) ──
  const [showChangePassword, setShowChangePassword] = useState(false);

  const getDoctorName = () => {
    try { return localStorage.getItem("profileName") || "Admin"; } catch { return "Admin"; }
  };
  const doctorName = getDoctorName();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const clinicId = await getStoredClinicId();
        const branchId = await getStoredBranchId();
        if (!clinicId || !branchId)
          throw new Error("Clinic or Branch ID missing. Please log in again.");
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

  if (loading) {
    return (
      <div className={styles.dashboardWrapper}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboardWrapper}>
        <div className={styles.errorState}>
          <p>⚠️ Failed to load dashboard: {error}</p>
          <button onClick={() => window.location.reload()} className={styles.retryBtn}>Retry</button>
        </div>
      </div>
    );
  }

  const weeklyFlowData = stats
    ? stats.appointmentFlow?.map((item, i) => ({
        day: toDayLabel(item.date),
        Appointments: item.count,
        Visits: stats.visitFlow?.[i]?.count ?? 0,
      })) || []
    : [];

  const monthlyPatientData = stats
    ? stats.patientMonthlyFlow?.map((item) => ({ month: item.monthName, patients: item.count })) || []
    : [];

  const genderData = stats
    ? stats.genderBreakdown?.map((g) => ({ name: g.genderDesc, value: g.count })) || []
    : [];

  const appointments = [
    { id: 1, patient: "Arun Kumar",   time: "10:30 AM", type: "General Checkup", status: "Confirmed" },
    { id: 2, patient: "Priya Sharma", time: "11:15 AM", type: "Follow-up",        status: "Pending"   },
    { id: 3, patient: "Ravi Patel",   time: "02:00 PM", type: "Dental",           status: "Confirmed" },
    { id: 4, patient: "Sneha Reddy",  time: "03:30 PM", type: "Vaccination",      status: "Confirmed" },
  ];

  const recentActivity = [
    { icon: FiUserPlus, text: "New patient registered - Vikram Singh",  time: "2 min ago"   },
    { icon: FiUpload,   text: "Lab report uploaded for Ravi Patel",      time: "1 hour ago"  },
    { icon: FiClock,    text: "Appointment rescheduled - Sneha Reddy",   time: "2 hours ago" },
  ];

  const statCards = [
    {
      icon: <FiUsers size={28} />, iconClass: "patients",
      value: stats?.totalActivePatients?.toLocaleString() || "0",
      label: "Total Active Patients",
      trend: `+${stats?.newPatientsThisMonth || 0} new this month`, trendType: "up",
    },
    {
      icon: <FiCalendar size={28} />, iconClass: "appointments",
      value: stats?.todayAppointments || 0, label: "Today's Appointments",
      trend: stats?.todayAppointments > 0 ? `${stats.todayAppointments} scheduled` : "None today",
      trendType: stats?.todayAppointments > 0 ? "up" : "neutral",
    },
    {
      icon: <FiCalendar size={28} />, iconClass: "tomorrow",
      value: stats?.tomorrowAppointments || 0, label: "Tomorrow's Appointments",
      trend: stats?.tomorrowAppointments > 0 ? `${stats.tomorrowAppointments} upcoming` : "None tomorrow",
      trendType: stats?.tomorrowAppointments > 0 ? "up" : "neutral",
    },
    {
      icon: <FiActivity size={28} />, iconClass: "revenue",
      value: stats?.todayVisits || 0, label: "Today's Visits",
      trend: "Live count", trendType: "up",
    },
    {
      icon: <FiUserPlus size={28} />, iconClass: "reports",
      value: stats?.newPatientsThisMonth || 0, label: "New Patients (Month)",
      trend: "This month", trendType: "up",
    },
  ];

  // ── Force-password close: logout and redirect to login ──
  const handleForcePasswordClose = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className={styles.dashboardWrapper}>

      {/* ── Force-change password modal (blocks the UI until done) ── */}
      {mustChangePassword && (
        <UpdatePassword
          mode="force"
          updatePasswordApi={updatePassword}
          getStoredUserId={getStoredUserId}
          getStoredClinicId={getStoredClinicId}
          onSuccess={clearMustChangePassword}
          onClose={handleForcePasswordClose}
        />
      )}

      {/* ── Voluntary "Update Password" modal ── */}
      {showChangePassword && (
        <UpdatePassword
          mode="self"
          updatePasswordApi={updatePassword}
          getStoredUserId={getStoredUserId}
          getStoredClinicId={getStoredClinicId}
          onSuccess={() => setShowChangePassword(false)}
          onClose={() => setShowChangePassword(false)}
        />
      )}

      {/* ── Header ── */}
      <Header title="Medical Dashboard" />

      {/* ── Dashboard Header ── */}
      <header className={styles.dashboardHeader}>
        <div className={styles.headerLeft}>
          
          <p>Welcome back, {doctorName}</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.clock}>
            {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className={styles.notifications}>
            <FiBell className={styles.icon} />
            <span className={styles.badge}>3</span>
          </div>
          <button className={styles.changePasswordBtn} onClick={() => setShowChangePassword(true)}>
            Update Password
          </button>
          <div className={styles.userProfile}>
            <div className={styles.avatar}>
              <img src={scope} alt={doctorName} />
            </div>
            <span>{doctorName}</span>
          </div>
        </div>
      </header>

      {/* ── Stat Cards ── */}
      <section className={`${styles.statsGrid} ${styles.fiveCards}`}>
        {statCards.map((card, i) => (
          <div className={styles.statCard} key={i}>
            <div className={`${styles.icon} ${styles[card.iconClass]}`}>{card.icon}</div>
            <div className={styles.info}>
              <h3>{card.value}</h3>
              <p>{card.label}</p>
              <span className={`${styles.trend} ${styles[card.trendType]}`}>{card.trend}</span>
            </div>
          </div>
        ))}
      </section>

      {/* ── Charts Row ── */}
      <section className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <h3>Weekly Appointment &amp; Visit Flow</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={weeklyFlowData}>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(34,43,108,0.08)" />
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" allowDecimals={false} />
              <Tooltip contentStyle={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:"12px", boxShadow:"0 4px 16px rgba(34,43,108,0.1)" }} />
              <Legend />
              <Line type="monotone" dataKey="Appointments" stroke="#30b2b5" strokeWidth={3} dot={{ fill:"#30b2b5", r:5 }} activeDot={{ r:7 }} />
              <Line type="monotone" dataKey="Visits"        stroke="#8b5cf6" strokeWidth={3} dot={{ fill:"#8b5cf6", r:5 }} activeDot={{ r:7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3>Monthly Patient Registrations</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyPatientData}>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(34,43,108,0.08)" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" allowDecimals={false} />
              <Tooltip contentStyle={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:"12px", boxShadow:"0 4px 16px rgba(34,43,108,0.1)" }} />
              <Bar dataKey="patients" fill="#30b2b5" radius={[10,10,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ── Gender Section ── */}
      <section className={styles.genderSection}>
        <div className={`${styles.chartCard} ${styles.genderCard}`}>
          <h3>Patient Gender Breakdown</h3>
          {genderData.length > 0 ? (
            <div className={styles.genderChartWrap}>
              <ResponsiveContainer width="45%" height={220}>
                <PieChart>
                  <Pie data={genderData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                    {genderData.map((_, index) => (
                      <Cell key={index} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:"12px" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.genderLegend}>
                {genderData.map((g, i) => (
                  <div key={i} className={styles.genderLegendItem}>
                    <div className={styles.genderLegendDot} style={{ background: GENDER_COLORS[i] }} />
                    <div className={styles.genderLegendInfo}>
                      <span className={styles.genderLegendLabel}>{g.name}</span>
                      <span className={styles.genderLegendCount}>{g.value} patients</span>
                      <span className={styles.genderLegendPct}>
                        {Math.round((g.value / genderData.reduce((s, x) => s + x.value, 0)) * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.emptyStateBox}>
              <FiUsers size={32} color="#94a3b8" />
              <p>No gender data available</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Bottom Row ── */}
      <section className={styles.bottomRow}>
        <div className={styles.appointmentsCard}>
          <div className={styles.cardHeader}>
            <h3>Upcoming Appointments</h3>
            <a href="/appointments" className={styles.viewAll}>View All</a>
          </div>
          <table className={styles.appointmentsTable}>
            <thead>
              <tr><th>Patient</th><th>Time</th><th>Type</th><th>Status</th></tr>
            </thead>
            <tbody>
              {appointments.map((apt) => (
                <tr key={apt.id}>
                  <td>
                    <div className={styles.patientCell}>
                      <span className={styles.avatarSm}>{apt.patient[0]}</span>
                      {apt.patient}
                    </div>
                  </td>
                  <td>{apt.time}</td>
                  <td>{apt.type}</td>
                  <td>
                    <span className={`${styles.status} ${styles[apt.status.toLowerCase()]}`}>{apt.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.activityCard}>
          <div className={styles.cardHeader}><h3>Recent Activity</h3></div>
          <div className={styles.activityList}>
            {recentActivity.map((act, i) => {
              const Icon = act.icon;
              return (
                <div key={i} className={styles.activityItem}>
                  <div className={styles.activityIcon}><Icon size={20} /></div>
                  <div className={styles.activityContent}>
                    <p>{act.text}</p>
                    <span>{act.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;