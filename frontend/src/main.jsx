import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import './index.css'
import App from './App.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', backgroundColor: 'white', height: '100vh' }}>
          <h1>Something went wrong.</h1>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

const root = createRoot(document.getElementById('root'))

if (!PUBLISHABLE_KEY) {
  root.render(
    <StrictMode>
      <div style={{ padding: '24px', color: '#991b1b', backgroundColor: '#fef2f2', minHeight: '100vh' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>Clerk is not configured</h1>
        <p style={{ marginBottom: '8px' }}>
          Add <code>VITE_CLERK_PUBLISHABLE_KEY</code> to <code>frontend/.env.local</code> and restart the Vite dev server.
        </p>
        <p>Example: <code>VITE_CLERK_PUBLISHABLE_KEY=pk_test_...</code></p>
      </div>
    </StrictMode>,
  )
} else {
  root.render(
    <StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/login">
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </ClerkProvider>
    </StrictMode>,
  )
}
