// src/components/settings/Settings.jsx
import React, { useState } from "react";
import "./Settings.css";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    appointments: true,
    reminders: true,
    reports: false,
  });

  const [profile, setProfile] = useState({
    name: "Dr. Rajesh Sharma",
    email: "dr.rajesh@medcarepro.com",
    phone: "+91 98765 43210",
    specialty: "General Physician",
    experience: "15 years",
    license: "MH-198765",
  });

  const [clinic, setClinic] = useState({
    name: "MedCare Family Clinic",
    address: "123 Health Street, Mumbai, Maharashtra 400001",
    phone: "+91 22 4567 8900",
    timings: "Mon–Sat: 9:00 AM – 8:00 PM",
    emergency: "+91 98765 00011",
  });

  const handleNotificationToggle = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your account, clinic, and preferences</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="settings-tabs">
        <button
          className={activeTab === "profile" ? "tab active" : "tab"}
          onClick={() => setActiveTab("profile")}
        >
          Profile
        </button>
        <button
          className={activeTab === "clinic" ? "tab active" : "tab"}
          onClick={() => setActiveTab("clinic")}
        >
          Clinic Info
        </button>
        <button
          className={activeTab === "notifications" ? "tab active" : "tab"}
          onClick={() => setActiveTab("notifications")}
        >
          Notifications
        </button>
        <button
          className={activeTab === "security" ? "tab active" : "tab"}
          onClick={() => setActiveTab("security")}
        >
          Security
        </button>
      </div>

      <div className="settings-content">
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="settings-card">
            <div className="card-header">
              <h3>Doctor Profile</h3>
              <button className="btn-save">Save Changes</button>
            </div>

            <div className="profile-grid">
              <div className="profile-avatar">
                <img src="/assets/doctor-avatar.jpg" alt="Dr. Sharma" />
                <button className="btn-change-photo">Change Photo</button>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="tel" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Specialty</label>
                  <input type="text" value={profile.specialty} onChange={(e) => setProfile({...profile, specialty: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Experience</label>
                  <input type="text" value={profile.experience} onChange={(e) => setProfile({...profile, experience: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Medical License No.</label>
                  <input type="text" value={profile.license} onChange={(e) => setProfile({...profile, license: e.target.value})} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clinic Info Tab */}
        {activeTab === "clinic" && (
          <div className="settings-card">
            <div className="card-header">
              <h3>Clinic Information</h3>
              <button className="btn-save">Update Clinic</button>
            </div>

            <div className="form-grid wide">
              <div className="form-group">
                <label>Clinic Name</label>
                <input type="text" value={clinic.name} onChange={(e) => setClinic({...clinic, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea rows={3} value={clinic.address} onChange={(e) => setClinic({...clinic, address: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Clinic Phone</label>
                <input type="tel" value={clinic.phone} onChange={(e) => setClinic({...clinic, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Working Hours</label>
                <input type="text" value={clinic.timings} onChange={(e) => setClinic({...clinic, timings: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Emergency Contact</label>
                <input type="tel" value={clinic.emergency} onChange={(e) => setClinic({...clinic, emergency: e.target.value})} />
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="settings-card">
            <div className="card-header">
              <h3>Notification Preferences</h3>
            </div>

            <div className="notification-list">
              <div className="notification-item">
                <div>
                  <h4>Email Notifications</h4>
                  <p>Receive updates via email</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={notifications.email} onChange={() => handleNotificationToggle("email")} />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="notification-item">
                <div>
                  <h4>SMS Alerts</h4>
                  <p>Get appointment reminders via SMS</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={notifications.sms} onChange={() => handleNotificationToggle("sms")} />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="notification-item">
                <div>
                  <h4>New Appointment Alerts</h4>
                  <p>Notify when a new appointment is booked</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={notifications.appointments} onChange={() => handleNotificationToggle("appointments")} />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="notification-item">
                <div>
                  <h4>Daily Reminders</h4>
                  <p>Morning reminder of today's schedule</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={notifications.reminders} onChange={() => handleNotificationToggle("reminders")} />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="notification-item">
                <div>
                  <h4>Weekly Reports</h4>
                  <p>Receive weekly performance summary</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={notifications.reports} onChange={() => handleNotificationToggle("reports")} />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="settings-card">
            <div className="card-header">
              <h3>Security & Login</h3>
            </div>

            <div className="security-actions">
              <div className="security-item">
                <div>
                  <h4>Change Password</h4>
                  <p>Last changed 3 months ago</p>
                </div>
                <button className="btn-change">Change</button>
              </div>

              <div className="security-item">
                <div>
                  <h4>Two-Factor Authentication</h4>
                  <p>Add an extra layer of security</p>
                </div>
                <button className="btn-enable">Enable 2FA</button>
              </div>

              <div className="security-item">
                <div>
                  <h4>Active Sessions</h4>
                  <p>Manage devices logged into your account</p>
                </div>
                <button className="btn-view">View Sessions</button>
              </div>

              <div className="security-item danger">
                <div>
                  <h4>Delete Account</h4>
                  <p>Permanently delete your MedCare Pro account</p>
                </div>
                <button className="btn-delete">Delete Account</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}