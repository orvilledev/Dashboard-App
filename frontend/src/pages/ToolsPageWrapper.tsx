import { Component, ReactNode } from 'react';
import { ToolsPage } from './ToolsPage';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ToolsPage Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px' }}>
          <h1 style={{ color: 'red' }}>Error Loading Tools Page</h1>
          <pre style={{ background: '#fee', padding: '20px', borderRadius: '8px', overflow: 'auto' }}>
            {this.state.error?.toString()}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ToolsPageWrapper() {
  return (
    <ErrorBoundary>
      <ToolsPage />
    </ErrorBoundary>
  );
}

