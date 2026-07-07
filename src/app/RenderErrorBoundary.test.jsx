// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@/i18n/index.js';
import { RenderErrorBoundary } from './RenderErrorBoundary.jsx';
import { frontendTelemetry } from '@/infrastructure/observability/frontendTelemetry.js';

vi.mock('@/infrastructure/observability/frontendTelemetry.js', () => ({
  frontendTelemetry: { trackFailure: vi.fn() },
}));

function Broken() {
  throw new Error('render token secret');
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe('RenderErrorBoundary', () => {
  it('reports render failures and shows an accessible fallback', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <RenderErrorBoundary>
        <Broken />
      </RenderErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('The interface could not be rendered safely');
    expect(frontendTelemetry.trackFailure).toHaveBeenCalledWith(expect.objectContaining({
      failureType: 'render',
      phase: 'render',
    }));
  });
});
