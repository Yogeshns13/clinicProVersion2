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
import { FiBell, FiUsers, FiCalendar, FiActivity, FiUserPlus, FiUpload, FiClock } from "react-icons/fi";
import scope from "../assets/account.png";

import { getDashboardStats } from "../Api/Api.js";
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';

const toDayLabel = (isoString) =>
  new Date(isoString).toLocaleDateString("en-US", { weekday: "short" });

const GENDER_COLORS = ["#0284c7", "#e879f9"];

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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


// inside fetchStats:
useEffect(() => {
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ Await the async crypto utils
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      console.log("Clinic ID:", clinicId);
      console.log("Branch ID:", branchId);

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

  // Prepare Chart Data
  const weeklyFlowData = stats
    ? stats.AppointmentFlow?.map((item, i) => ({
        day: toDayLabel(item.Date),
        Appointments: item.Count,
        Visits: stats.VisitFlow?.[i]?.Count ?? 0,
      })) || []
    : [];

  const monthlyPatientData = stats
    ? stats.PatientMonthlyFlow?.map((item) => ({
        month: item.MonthName,
        patients: item.Count,
      })) || []
    : [];

  const genderData = stats
    ? stats.GenderBreakdown?.map((g) => ({
        name: g.GenderDesc,
        value: g.PatientCount,
      })) || []
    : [];

  // ---------- Dummy Records ----------
  const appointments = [
    { id: 1, patient: "Arun Kumar",  time: "10:30 AM", type: "General Checkup", status: "Confirmed" },
    { id: 2, patient: "Priya Sharma", time: "11:15 AM", type: "Follow-up",       status: "Pending"   },
    { id: 3, patient: "Ravi Patel",   time: "02:00 PM", type: "Dental",          status: "Confirmed" },
    { id: 4, patient: "Sneha Reddy",  time: "03:30 PM", type: "Vaccination",     status: "Confirmed" },
  ];

  const recentActivity = [
    { icon: FiUserPlus, text: "New patient registered - Vikram Singh",       time: "2 min ago"   },
    { icon: FiUpload,   text: "Lab report uploaded for Ravi Patel",          time: "1 hour ago"  },
    { icon: FiClock,    text: "Appointment rescheduled - Sneha Reddy",       time: "2 hours ago" },
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
      value: stats?.TotalActivePatients?.toLocaleString() || "0",
      label: "Total Active Patients",
      trend: `+${stats?.NewPatientsThisMonth || 0} new this month`,
      trendType: "up",
    },
    {
      icon: <FiCalendar size={28} />,
      iconClass: "appointments",
      value: stats?.TodayAppointmentCount || 0,
      label: "Today's Appointments",
      trend:
        stats?.TodayAppointmentCount > 0
          ? `${stats.TodayAppointmentCount} scheduled`
          : "None today",
      trendType: stats?.TodayAppointmentCount > 0 ? "up" : "neutral",
    },
    {
      icon: <FiCalendar size={28} />,
      iconClass: "tomorrow",
      value: stats?.TomorrowAppointmentCount || 0,
      label: "Tomorrow's Appointments",
      trend:
        stats?.TomorrowAppointmentCount > 0
          ? `${stats.TomorrowAppointmentCount} upcoming`
          : "None tomorrow",
      trendType: stats?.TomorrowAppointmentCount > 0 ? "up" : "neutral",
    },
    {
      icon: <FiActivity size={28} />,
      iconClass: "revenue",
      value: stats?.TodayVisitCount || 0,
      label: "Today's Visits",
      trend: "Live count",
      trendType: "up",
    },
    {
      icon: <FiUserPlus size={28} />,
      iconClass: "reports",
      value: stats?.NewPatientsThisMonth || 0,
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
          <div className="user-profile">
            <div className="avatar">
              <img src={scope} alt={doctorName} />
            </div>
            <span>{doctorName}</span>
          </div>
        </div>
      </header>

      {/* Stat Cards */}
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
          <h3>Weekly Appointment & Visit Flow</h3>
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

      {/* ===================== BOTTOM ROW (Dummy Records) ===================== */}
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
      {/* ===================================================================== */}

    </div>
  );
};

export default Dashboard;