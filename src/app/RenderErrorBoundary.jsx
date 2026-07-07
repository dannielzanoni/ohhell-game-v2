import { Component } from 'react';
import i18n from '@/i18n/index.js';
import { frontendTelemetry } from '@/infrastructure/observability/frontendTelemetry.js';

export class RenderErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    frontendTelemetry.trackFailure({
      diagnostic: { error, componentStack: info?.componentStack },
      failureType: 'render',
      phase: 'render',
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center px-6 py-8">
          <p role="alert" className="max-w-md rounded-lg border border-destructive/40 bg-card p-4 text-sm text-destructive">
            {i18n.t('errors.render')}
          </p>
        </main>
      );
    }

    return this.props.children;
  }
}
