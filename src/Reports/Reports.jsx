// src/components/reports/Reports.jsx
import React, { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import "./Reports.css";
import {
  FiDollarSign,
  FiUsers,
  FiCalendar,
  FiTrendingUp,
} from "react-icons/fi";

const revenueData = [
  { month: "Jan", revenue: 32000 },
  { month: "Feb", revenue: 38000 },
  { month: "Mar", revenue: 45000 },
  { month: "Apr", revenue: 41000 },
  { month: "May", revenue: 52000 },
  { month: "Jun", revenue: 68000 },
];

const patientTrend = [
  { month: "Jan", new: 85, returning: 120 },
  { month: "Feb", new: 92, returning: 135 },
  { month: "Mar", new: 110, returning: 160 },
  { month: "Apr", new: 98, returning: 145 },
  { month: "May", new: 130, returning: 180 },
  { month: "Jun", new: 165, returning: 210 },
];

const appointmentType = [
  { name: "Checkup", value: 380, color: "#30b2b5" },
  { name: "Follow-up", value: 240, color: "#60a5fa" },
  { name: "Surgery", value: 120, color: "#f472b6" },
  { name: "Consultation", value: 280, color: "#a78bfa" },
  { name: "Others", value: 180, color: "#94a3b8" },
];

export default function Reports() {
  const [dateRange, setDateRange] = useState("last6months");

  return (
    <div className="reports-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Reports & Analytics</h1>
          <p>Track clinic performance and patient insights</p>
        </div>
        <div className="header-actions">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="date-range-select"
          >
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="last3months">Last 3 Months</option>
            <option value="last6months">Last 6 Months</option>
            <option value="lastyear">Last Year</option>
          </select>
          <button className="btn-export">
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics Cards - Now with REAL ICONS */}
      <section className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon revenue">
            <FiDollarSign size={32} />
          </div>
          <div className="metric-value">₹2,86,000</div>
          <div className="metric-label">Total Revenue</div>
          <div className="metric-trend up">+28.5% from last period</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon patients">
            <FiUsers size={32} />
          </div>
          <div className="metric-value">892</div>
          <div className="metric-label">Total Patients</div>
          <div className="metric-trend up">+18.2% growth</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon appointments">
            <FiCalendar size={32} />
          </div>
          <div className="metric-value">487</div>
          <div className="metric-label">Appointments</div>
          <div className="metric-trend up">+12.8% vs last month</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon satisfaction">
            <FiTrendingUp size={32} />
          </div>
          <div className="metric-value">94.8%</div>
          <div className="metric-label">Patient Satisfaction</div>
          <div className="metric-trend up">+2.1% improvement</div>
        </div>
      </section>

      {/* Charts Section */}
      <section className="charts-section">
        {/* Revenue Trend */}
        <div className="chart-container large">
          <h3>Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  background: "rgba(15, 23, 42, 0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  backdropFilter: "blur(8px)"
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#30b2b5"
                strokeWidth={4}
                dot={{ fill: "#30b2b5", r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Patient Growth */}
        <div className="chart-container">
          <h3>Patient Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={patientTrend}>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  background: "rgba(15, 23, 42, 0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px"
                }}
              />
              <Legend />
              <Bar dataKey="new" fill="#60a5fa" radius={[8, 8, 0, 0]} />
              <Bar dataKey="returning" fill="#34d399" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Appointment Types */}
        <div className="chart-container">
          <h3>Appointment Types</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={appointmentType}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {appointmentType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "rgba(15, 23, 42, 0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px"
                }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pie-label">Total: 1,208</div>
        </div>
      </section>

      {/* Summary */}
      <div className="report-summary">
        <h3>Summary</h3>
        <p>
          Your clinic has shown <strong>excellent growth</strong> in the last 6 months with a 
          <strong> 28.5% increase in revenue</strong> and <strong>892 active patients</strong>. 
          Patient satisfaction remains high at <strong>94.8%</strong>.
        </p>
        <div className="summary-highlight">
          Keep up the great work, Dr. Sharma!
        </div>
      </div>
    </div>
  );
}