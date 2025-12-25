// src/components/dashboard/UpcomingAppointments.jsx
const appointments = [
  { id: 1, patient: "Arun Kumar", time: "10:30 AM", type: "Checkup", status: "Confirmed" },
  { id: 2, patient: "Priya Sharma", time: "11:00 AM", type: "Follow-up", status: "Pending" },
  { id: 3, patient: "Ravi Patel", time: "02:00 PM", type: "Surgery", status: "Confirmed" },
  { id: 4, patient: "Sneha Reddy", time: "03:30 PM", type: "Consultation", status: "Confirmed" },
];

export default function UpcomingAppointments() {
  return (
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
                  <span className="avatar">{apt.patient[0]}</span>
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
  );
}