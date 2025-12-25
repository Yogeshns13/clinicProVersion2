export default function Popup({ show, message }) {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={() => (show = false)}>
      <div className="modal-content">
        <p>{message}</p>
        <button className="modal-button">OK</button>
      </div>
    </div>
  );
}
