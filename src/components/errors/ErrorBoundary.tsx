import { Component, type ErrorInfo, type ReactNode } from 'react';
import ErrorState from './ErrorState';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep diagnostics in the developer console; render a safe message to users.
    console.error('TrainHub UI error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 text-zinc-100">
        <div className="w-full max-w-xl"><ErrorState title="This page hit a problem" description="Reload the page to continue. If the problem persists, contact your workspace administrator." onRetry={() => window.location.reload()} retryLabel="Reload page" /></div>
      </main>;
    }

    return this.props.children;
  }
}
