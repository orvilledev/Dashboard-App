export default function DiagnosticApp() {
  console.log('✅ DiagnosticApp is rendering');
  console.log('✅ React is working!');
  
  // Get environment variables
  const clerkKey = import.meta?.env?.VITE_CLERK_PUBLISHABLE_KEY;
  const apiUrl = import.meta?.env?.VITE_API_URL;
  
  return (
    <div style={{ 
      padding: '40px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#10b981',
      minHeight: '100vh'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{ color: '#059669', marginBottom: '20px', fontSize: '32px' }}>
          ✅✅✅ React is Working! ✅✅✅
        </h1>
        
        <div style={{ 
          marginBottom: '20px',
          backgroundColor: '#d1fae5',
          padding: '20px',
          borderRadius: '8px'
        }}>
          <p style={{ fontSize: '18px', margin: 0 }}>
            <strong>🎉 SUCCESS!</strong> If you can see this green page, React is rendering correctly!
          </p>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Environment Check:</h2>
          <ul style={{ lineHeight: '1.8' }}>
            <li>
              <strong>Clerk Key:</strong>{' '}
              {clerkKey ? '✅ Present' : '❌ Missing'}
            </li>
            <li>
              <strong>API URL:</strong>{' '}
              {apiUrl || 'Using default (http://localhost:8000/api/v1)'}
            </li>
            <li>
              <strong>Current URL:</strong> {window.location.href}
            </li>
            <li>
              <strong>Timestamp:</strong> {new Date().toLocaleString()}
            </li>
          </ul>
        </div>

        <div style={{
          backgroundColor: '#FEF3C7',
          padding: '20px',
          borderRadius: '8px',
          border: '2px solid #F59E0B'
        }}>
          <h3 style={{ marginTop: 0 }}>📋 What This Means:</h3>
          <ol style={{ lineHeight: '2', paddingLeft: '20px' }}>
            <li><strong>React is installed and working correctly</strong></li>
            <li><strong>The development server is serving files properly</strong></li>
            <li><strong>Your browser can execute JavaScript</strong></li>
            <li>The blank page issue is likely in the main App component</li>
          </ol>
        </div>

        <button
          onClick={() => {
            console.log('🔘 Button clicked - console is working');
            alert('🎉 JavaScript is working! Check the console for the log message.');
          }}
          style={{
            marginTop: '20px',
            padding: '12px 24px',
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Test Console & Alerts
        </button>
      </div>
    </div>
  );
}

