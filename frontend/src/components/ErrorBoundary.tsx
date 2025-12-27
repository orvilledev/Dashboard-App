import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '40px', 
          maxWidth: '800px', 
          margin: '40px auto',
          backgroundColor: '#FEF2F2',
          border: '2px solid #EF4444',
          borderRadius: '12px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <h1 style={{ color: '#991B1B', marginBottom: '16px' }}>
            ⚠️ Something went wrong
          </h1>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Error:</h2>
            <pre style={{ 
              backgroundColor: '#FEF2F2', 
              padding: '12px', 
              borderRadius: '6px',
              overflow: 'auto',
              fontSize: '14px'
            }}>
              {this.state.error?.toString()}
            </pre>
          </div>
          {this.state.errorInfo && (
            <details style={{ 
              backgroundColor: 'white', 
              padding: '20px', 
              borderRadius: '8px',
              cursor: 'pointer'
            }}>
              <summary style={{ fontWeight: 'bold', marginBottom: '12px' }}>
                Stack Trace
              </summary>
              <pre style={{ 
                backgroundColor: '#FEF2F2', 
                padding: '12px', 
                borderRadius: '6px',
                overflow: 'auto',
                fontSize: '12px',
                whiteSpace: 'pre-wrap'
              }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              backgroundColor: '#DC2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

