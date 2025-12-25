import React, { useState, useEffect } from 'react';
import './Attendance.css';
import { format } from 'date-fns';

const Attendance = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sample attendance data for today
  const todayStats = {
    present: 142,
    absent: 8,
    late: 12,
    onLeave: 5,
  };

  const totalStaff = todayStats.present + todayStats.absent + todayStats.late + todayStats.onLeave;

  const recentRecords = [
    { id: 1, name: 'Dr. Sarah Johnson', department: 'Cardiology', time: '08:45 AM', status: 'present', avatar: 'SJ' },
    { id: 2, name: 'Nurse Emily Chen', department: 'Emergency', time: '08:52 AM', status: 'late', avatar: 'EC' },
    { id: 3, name: 'Dr. Michael Roberts', department: 'Pediatrics', time: '09:10 AM', status: 'present', avatar: 'MR' },
    { id: 4, name: 'Admin Lisa Wong', department: 'Administration', time: '—', status: 'absent', avatar: 'LW' },
    { id: 5, name: 'Dr. Ahmed Khan', department: 'Neurology', time: '08:30 AM', status: 'present', avatar: 'AK' },
  ];

  return (
    <div className="attendance-wrapper">
      {/* Header */}
      <div className="attendance-header">
        <div className="header-left">
          <h1>Staff Attendance</h1>
          <p>{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="header-right">
          <div className="clock">
            {format(currentTime, 'hh:mm:ss a')}
          </div>
          <div className="attendance-summary">
            <span className="summary-text">Today's Rate</span>
            <span className="summary-value">
              {((todayStats.present / totalStaff) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="icon present">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="info">
            <h3>{todayStats.present}</h3>
            <p>Present</p>
            <span className="trend up">+2 from yesterday</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="icon late">
            <i className="fas fa-clock"></i>
          </div>
          <div className="info">
            <h3>{todayStats.late}</h3>
            <p>Late Arrivals</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="icon absent">
            <i className="fas fa-times-circle"></i>
          </div>
          <div className="info">
            <h3>{todayStats.absent}</h3>
            <p>Absent</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="icon leave">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div className="info">
            <h3>{todayStats.onLeave}</h3>
            <p>On Leave</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="attendance-content">
        <div className="recent-records-card">
          <div className="card-header">
            <h3>Recent Check-ins</h3>
            <a href="#" className="view-all">View All</a>
          </div>
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Department</th>
                <th>Check-in Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentRecords.map((record) => (
                <tr key={record.id}>
                  <td className="staff-cell">
                    <div className="avatar-sm">{record.avatar}</div>
                    <div>
                      <div className="staff-name">{record.name}</div>
                    </div>
                  </td>
                  <td>{record.department}</td>
                  <td>{record.time}</td>
                  <td>
                    <span className={`status ${record.status}`}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="monthly-overview">
          <div className="card-header">
            <h3>Monthly Overview</h3>
          </div>
          <div className="calendar-placeholder">
            <div className="calendar-grid">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className={`day ${
                    i === 14
                      ? 'today'
                      : i % 7 === 0 || i % 5 === 0
                      ? 'absent'
                      : Math.random() > 0.3
                      ? 'present'
                      : 'late'
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <div className="legend">
              <span><i className="dot present"></i> Present</span>
              <span><i className="dot late"></i> Late</span>
              <span><i className="dot absent"></i> Absent</span>
              <span><i className="dot today"></i> Today</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;