import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = (): void => {
    (this as unknown as { setState: (state: ErrorBoundaryState) => void }).setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    const state = (this as unknown as { state: ErrorBoundaryState }).state;
    const props = (this as unknown as { props: ErrorBoundaryProps }).props;

    if (state.hasError) {
      if (props.fallback) {
        return props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-md w-full text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Something went wrong</h2>
            <p className="text-sm text-slate-600">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
              onClick={this.handleReset}
              className="px-6 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return props.children;
  }
}
