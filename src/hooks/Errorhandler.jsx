const ErrorHandler = ({ error }) => {
  if (!error) return null;

  const statusCode = error?.status || error?.code;
  const message = error?.message || error?.error || "An unexpected error occurred";

  // Only show for client errors (400+)
  if (statusCode >= 400) {
    return (
      <div className="certificate-list" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <div className="error-container system-error" style={{ 
          backgroundColor: '#fff', 
          border: '1px solid #e0e0e0', 
          borderRadius: '8px', 
          padding: '30px', 
          textAlign: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div className="error-content" style={{ color: '#d32f2f' }}>
            <h3 style={{ 
              color: '#d32f2f', 
              marginBottom: '20px', 
              fontSize: '24px', 
              fontWeight: '600' 
            }}>
              General System Error
            </h3>
            <div className="error-details" style={{ 
              backgroundColor: '#fee', 
              border: '1px solid #f5c6cb', 
              borderRadius: '6px', 
              padding: '20px', 
              textAlign: 'left',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              <p style={{ margin: '8px 0', fontSize: '16px' }}>
                <strong style={{ color: '#c62828' }}>Status Code:</strong> {statusCode}
              </p>
              <p style={{ margin: '8px 0', fontSize: '16px' }}>
                <strong style={{ color: '#c62828' }}>Message:</strong> {message}
              </p>
            </div>
            <div style={{ marginTop: '25px' }}>
              <button 
                onClick={() => window.location.reload()} 
                style={{
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#1565c0'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#1976d2'}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ErrorHandler;