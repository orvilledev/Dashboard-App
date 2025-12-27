import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import TestApp from './TestApp';
import DiagnosticApp from './DiagnosticApp';
import { ErrorBoundary } from './components/ErrorBoundary';

console.log('main.tsx loaded');

const rootElement = document.getElementById('root');
console.log('Root element:', rootElement);

// Diagnostic mode flags - set both to false to use main App
const USE_TEST_APP = false; // Simple test to verify React is working
const USE_DIAGNOSTIC = false; // Detailed diagnostic page

try {
  if (rootElement) {
    let ComponentToRender = App;
    
    if (USE_DIAGNOSTIC) {
      ComponentToRender = DiagnosticApp;
    } else if (USE_TEST_APP) {
      ComponentToRender = TestApp;
    }
    
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <ComponentToRender />
        </ErrorBoundary>
      </StrictMode>
    );
    console.log('React app rendered successfully with component:', ComponentToRender.name);
  } else {
    console.error('Root element not found!');
    document.body.innerHTML = `
      <div style="padding: 20px; background: red; color: white; font-family: Arial;">
        <h1>❌ Critical Error</h1>
        <p>Root element with id "root" not found in HTML!</p>
      </div>
    `;
  }
} catch (error) {
  console.error('Error rendering app:', error);
  // Show error on page
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; background: red; color: white; font-family: Arial;">
        <h1>❌ Error Loading App</h1>
        <pre style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 4px;">${error}</pre>
      </div>
    `;
  }
}
