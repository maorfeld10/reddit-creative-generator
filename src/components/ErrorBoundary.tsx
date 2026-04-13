import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled UI error:', error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  override render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen w-full bg-neutral-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-50 border border-red-100 rounded-lg p-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h1 className="text-lg font-bold">Something went wrong</h1>
            </div>
            <p className="text-sm text-neutral-600">
              The app hit an unexpected error. You can try again, or reload the page if it
              keeps happening.
            </p>
            <pre className="text-xs bg-neutral-50 border border-neutral-200 rounded p-3 overflow-auto max-h-40 text-neutral-700">
              {this.state.error.message}
            </pre>
            <div className="flex gap-2">
              <Button onClick={this.handleReset} variant="outline">
                Try again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                className="bg-[#FF4500] hover:bg-[#E03D00] text-white"
              >
                Reload page
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
